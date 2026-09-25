import csv
from django.db.models import Q, Count
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from apps.accounts.permissions import IsStaffRole
from .models import Courrier, Transmission, SERVICES
from .serializers import CourrierSerializer, CourrierListSerializer, TransmissionSerializer

SERVICES_VALIDES = dict(SERVICES)


def filtrer_par_tribunal(qs, user, champ='tribunal'):
    """Un agent rattaché à un tribunal ne voit que les registres de son tribunal."""
    if user.tribunal_id and not user.is_superuser:
        return qs.filter(**{champ: user.tribunal})
    return qs


class CourrierViewSet(mixins.ListModelMixin, mixins.CreateModelMixin,
                      mixins.RetrieveModelMixin, mixins.UpdateModelMixin,
                      viewsets.GenericViewSet):
    """
    Registre du courrier arrivée / départ.
    Filtres : ?sens=arrivee|depart  ?registre=  ?statut=  ?service=  ?priorite=
              ?q=texte  ?du=AAAA-MM-JJ  ?au=AAAA-MM-JJ
    """
    permission_classes = [IsStaffRole]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]
    pagination_class   = None

    def get_serializer_class(self):
        return CourrierListSerializer if self.action == 'list' else CourrierSerializer

    def get_queryset(self):
        qs = filtrer_par_tribunal(
            Courrier.objects.select_related('enregistre_par').prefetch_related('transmissions__agent'),
            self.request.user,
        )
        p = self.request.query_params
        for champ, param in [('sens', 'sens'), ('registre', 'registre'), ('statut', 'statut'),
                             ('service_actuel', 'service'), ('priorite', 'priorite')]:
            if p.get(param):
                qs = qs.filter(**{champ: p[param]})
        if p.get('q'):
            q = p['q'].strip()
            qs = qs.filter(Q(numero__icontains=q) | Q(objet__icontains=q) |
                           Q(correspondant__icontains=q) | Q(reference_externe__icontains=q) |
                           Q(dossier_lie__icontains=q))
        if p.get('du'):
            qs = qs.filter(date_enregistrement__date__gte=p['du'])
        if p.get('au'):
            qs = qs.filter(date_enregistrement__date__lte=p['au'])
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        courrier = serializer.save(tribunal=user.tribunal, enregistre_par=user)
        if courrier.sens == 'depart':
            courrier.service_actuel = 'bureau_courrier'
            courrier.save(update_fields=['service_actuel'])
        Transmission.objects.create(
            courrier=courrier, action='enregistrement', agent=user,
            service_destination='bureau_courrier',
            commentaire=f'Enregistré au {courrier.get_sens_display().lower()} sous le n° {courrier.numero}',
        )

    # ── Circuit du courrier ───────────────────────────────
    def _etape(self, courrier, action_code, statut, request, destination=None):
        user = request.user
        origine = courrier.service_actuel
        Transmission.objects.create(
            courrier=courrier, action=action_code, agent=user,
            service_origine=origine,
            service_destination=destination or origine,
            commentaire=str(request.data.get('commentaire', ''))[:1000],
        )
        courrier.statut = statut
        if destination:
            courrier.service_actuel = destination
        courrier.save(update_fields=['statut', 'service_actuel', 'updated_at'])
        return self._reponse(courrier, request)

    def _reponse(self, courrier, request):
        # Recharge depuis la base : l'historique renvoyé inclut la nouvelle étape
        frais = Courrier.objects.prefetch_related('transmissions__agent').get(pk=courrier.pk)
        return Response(CourrierSerializer(frais, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def transmettre(self, request, pk=None):
        courrier = self.get_object()
        destination = request.data.get('service_destination')
        if destination not in SERVICES_VALIDES:
            return Response({'detail': 'Service destinataire invalide.'}, status=400)
        if destination == courrier.service_actuel:
            return Response({'detail': 'Le courrier est déjà dans ce service.'}, status=400)
        if courrier.statut == 'archive':
            return Response({'detail': 'Un courrier archivé ne peut plus être transmis.'}, status=400)
        return self._etape(courrier, 'transmission', 'transmis', request, destination)

    @action(detail=True, methods=['post'])
    def accuser_reception(self, request, pk=None):
        courrier = self.get_object()
        if courrier.statut != 'transmis':
            return Response({'detail': "Seul un courrier transmis peut faire l'objet d'un accusé de réception."}, status=400)
        return self._etape(courrier, 'reception', 'recu', request)

    @action(detail=True, methods=['post'])
    def traiter(self, request, pk=None):
        courrier = self.get_object()
        if courrier.statut in ('traite', 'expedie', 'archive'):
            return Response({'detail': 'Ce courrier est déjà traité.'}, status=400)
        return self._etape(courrier, 'traitement', 'traite', request)

    @action(detail=True, methods=['post'])
    def expedier(self, request, pk=None):
        courrier = self.get_object()
        if courrier.sens != 'depart':
            return Response({'detail': 'Seul un courrier départ peut être expédié.'}, status=400)
        if courrier.statut in ('expedie', 'archive'):
            return Response({'detail': 'Ce courrier est déjà expédié.'}, status=400)
        return self._etape(courrier, 'expedition', 'expedie', request, 'exterieur')

    @action(detail=True, methods=['post'])
    def archiver(self, request, pk=None):
        courrier = self.get_object()
        if courrier.statut == 'archive':
            return Response({'detail': 'Ce courrier est déjà archivé.'}, status=400)
        return self._etape(courrier, 'archivage', 'archive', request, 'archives')

    # ── Tableau de bord & export ──────────────────────────
    @action(detail=False, methods=['get'])
    def stats(self, request):
        qs = filtrer_par_tribunal(Courrier.objects.all(), request.user)
        aujourdhui = timezone.localdate()
        par_statut = dict(qs.values_list('statut').annotate(n=Count('id')))
        return Response({
            'total':          qs.count(),
            'arrivees':       qs.filter(sens='arrivee').count(),
            'departs':        qs.filter(sens='depart').count(),
            'aujourdhui':     qs.filter(date_enregistrement__date=aujourdhui).count(),
            'en_circulation': par_statut.get('transmis', 0) + par_statut.get('recu', 0),
            'urgents_ouverts': qs.filter(priorite='urgente').exclude(statut__in=['traite', 'expedie', 'archive']).count(),
            'par_statut':     par_statut,
        })

    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export CSV (ouvrable dans Excel) du registre filtré — pour impression ou archivage."""
        qs = self.get_queryset()
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        nom = f"registre_courrier_{timezone.localdate():%Y%m%d}.csv"
        response['Content-Disposition'] = f'attachment; filename="{nom}"'
        response.write('﻿')  # BOM : accents corrects dans Excel
        w = csv.writer(response, delimiter=';')
        w.writerow(['N° d\'ordre', 'Sens', 'Registre', 'Date enregistrement', 'Date du courrier',
                    'Correspondant', 'Réf. externe', 'Objet', 'Pièces', 'Priorité',
                    'Service actuel', 'Statut', 'Dossier lié', 'Enregistré par'])
        for c in qs:
            w.writerow([c.numero, c.get_sens_display(), c.get_registre_display(),
                        timezone.localtime(c.date_enregistrement).strftime('%d/%m/%Y %H:%M'),
                        c.date_courrier.strftime('%d/%m/%Y'), c.correspondant, c.reference_externe,
                        c.objet, c.nombre_pieces, c.get_priorite_display(),
                        c.get_service_actuel_display(), c.get_statut_display(), c.dossier_lie,
                        c.enregistre_par.full_name if c.enregistre_par else ''])
        return response

    @action(detail=False, methods=['get'])
    def services(self, request):
        """Liste des services du tribunal (pour les listes déroulantes)."""
        return Response([{'value': v, 'label': l} for v, l in SERVICES])


class TransmissionViewSet(viewsets.ReadOnlyModelViewSet):
    """Registre de transmission global (toutes les étapes, plus récentes d'abord)."""
    serializer_class   = TransmissionSerializer
    permission_classes = [IsStaffRole]
    pagination_class   = None

    def get_queryset(self):
        qs = filtrer_par_tribunal(
            Transmission.objects.select_related('courrier', 'agent'),
            self.request.user, champ='courrier__tribunal',
        ).order_by('-date', '-id')
        p = self.request.query_params
        if p.get('du'):
            qs = qs.filter(date__date__gte=p['du'])
        if p.get('au'):
            qs = qs.filter(date__date__lte=p['au'])
        if p.get('service'):
            qs = qs.filter(Q(service_origine=p['service']) | Q(service_destination=p['service']))
        return qs[:500]
