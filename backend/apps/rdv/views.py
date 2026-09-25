from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.accounts.models import STAFF_ROLES
from apps.accounts.permissions import IsStaffRole
from apps.notifications.models import Notification
from apps.notifications.services import notifier_personnel
from apps.notifications.sms import envoyer_sms
from .models import RendezVous, Tribunal, PIECES_A_FOURNIR, bureau_pour
from .serializers import RendezVousSerializer, TribunalSerializer, CRENEAUX


class TribunalViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tribunal.objects.filter(actif=True)
    serializer_class = TribunalSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None


def _fmt(rdv):
    return rdv.date.strftime('%d/%m/%Y'), rdv.heure.strftime('%Hh%M')


class RendezVousViewSet(viewsets.ModelViewSet):
    serializer_class   = RendezVousSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend]
    filterset_fields   = ['statut', 'tribunal', 'date']
    pagination_class   = None
    http_method_names  = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        qs = RendezVous.objects.select_related('citoyen', 'tribunal').order_by('date', 'heure')
        if user.role in STAFF_ROLES or user.is_superuser:
            if user.tribunal:
                qs = qs.filter(tribunal=user.tribunal)
            return qs
        return qs.filter(citoyen=user)

    def perform_create(self, serializer):
        rdv = serializer.save(citoyen=self.request.user)
        Notification.objects.create(
            destinataire=rdv.citoyen, type_notif='rdv',
            titre='Demande de rendez-vous envoyée',
            corps=f'Votre demande {rdv.reference} du {_fmt(rdv)[0]} à {_fmt(rdv)[1]} '
                  f'est en attente de validation par le service d\'accueil.',
            lien='/citoyen/suivi?ref=' + rdv.reference,
        )
        date, heure = _fmt(rdv)
        notifier_personnel(rdv.tribunal, ('admin', 'accueil'), 'rdv', 'Nouvelle demande de rendez-vous',
                           f'{rdv.reference} — {rdv.citoyen.full_name} · {rdv.get_service_display()} '
                           f'le {date} à {heure}.', '/admin/rdv')

    def partial_update(self, request, *args, **kwargs):
        # Le citoyen ne peut modifier qu'un RDV encore en attente
        rdv = self.get_object()
        if not (request.user.role in STAFF_ROLES or request.user.is_superuser) and rdv.statut != 'pending':
            return Response({'detail': 'Ce rendez-vous ne peut plus être modifié.'}, status=400)
        return super().partial_update(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def my(self, request):
        rdvs = RendezVous.objects.filter(citoyen=request.user).select_related('tribunal').order_by('-date', '-heure')
        return Response(RendezVousSerializer(rdvs, many=True).data)

    # ── Décisions du service d'accueil (avec SMS) ─────────
    @action(detail=True, methods=['post'], permission_classes=[IsStaffRole])
    def valider(self, request, pk=None):
        rdv = self.get_object()
        if rdv.statut != 'pending':
            return Response({'detail': 'Ce rendez-vous a déjà été traité.'}, status=400)
        rdv.statut = 'confirmed'
        rdv.save(update_fields=['statut', 'updated_at'])

        date, heure = _fmt(rdv)
        bureau, localisation = bureau_pour(rdv)
        Notification.objects.create(
            destinataire=rdv.citoyen, type_notif='rdv',
            titre='Rendez-vous confirmé', lien='/citoyen/suivi?ref=' + rdv.reference,
            corps=f'Votre RDV {rdv.reference} est confirmé le {date} à {heure} au {rdv.tribunal.nom}. '
                  f'Présentez-vous au : {bureau} ({localisation}).',
        )
        sms = envoyer_sms(
            rdv.citoyen.telephone,
            f'SunuTribunal: votre RDV {rdv.reference} est CONFIRME le {date} a {heure} - '
            f'{rdv.tribunal.nom}. Presentez-vous au: {bureau}. Apportez votre CNI.',
            destinataire=rdv.citoyen, objet_ref=rdv.reference,
        )
        return Response({'status': 'confirmed', 'sms': sms.statut, 'sms_erreur': sms.erreur,
                         'rdv': RendezVousSerializer(rdv).data})

    @action(detail=True, methods=['post'], permission_classes=[IsStaffRole])
    def rejeter(self, request, pk=None):
        rdv = self.get_object()
        if rdv.statut != 'pending':
            return Response({'detail': 'Ce rendez-vous a déjà été traité.'}, status=400)
        motif = str(request.data.get('motif', '')).strip()
        if not motif:
            return Response({'detail': 'Le motif du rejet est obligatoire.'}, status=400)
        rdv.statut = 'rejected'
        rdv.notes_admin = motif[:500]
        rdv.save(update_fields=['statut', 'notes_admin', 'updated_at'])

        date, _ = _fmt(rdv)
        Notification.objects.create(
            destinataire=rdv.citoyen, type_notif='rdv',
            titre='Rendez-vous non retenu', lien='/citoyen/suivi?ref=' + rdv.reference,
            corps=f'Votre demande {rdv.reference} du {date} n\'a pas été retenue. Motif : {motif}',
        )
        sms = envoyer_sms(
            rdv.citoyen.telephone,
            f'SunuTribunal: votre demande de RDV {rdv.reference} du {date} n\'est pas retenue. '
            f'Motif: {motif[:120]}. Reprenez un RDV dans l\'application.',
            destinataire=rdv.citoyen, objet_ref=rdv.reference,
        )
        return Response({'status': 'rejected', 'sms': sms.statut, 'sms_erreur': sms.erreur,
                         'rdv': RendezVousSerializer(rdv).data})

    @action(detail=True, methods=['post'], permission_classes=[IsStaffRole])
    def terminer(self, request, pk=None):
        """Le citoyen s'est présenté : RDV effectué."""
        rdv = self.get_object()
        if rdv.statut != 'confirmed':
            return Response({'detail': 'Seul un RDV confirmé peut être marqué comme effectué.'}, status=400)
        rdv.statut = 'done'
        rdv.save(update_fields=['statut', 'updated_at'])
        return Response(RendezVousSerializer(rdv).data)

    @action(detail=True, methods=['post'])
    def annuler(self, request, pk=None):
        """Annulation par le citoyen (tant que le RDV n'est pas passé)."""
        rdv = self.get_object()
        if rdv.citoyen != request.user:
            return Response({'detail': 'Action non autorisée.'}, status=403)
        if rdv.statut not in ('pending', 'confirmed'):
            return Response({'detail': 'Ce rendez-vous ne peut plus être annulé.'}, status=400)
        rdv.statut = 'cancelled'
        rdv.save(update_fields=['statut', 'updated_at'])
        date, heure = _fmt(rdv)
        notifier_personnel(rdv.tribunal, ('admin', 'accueil'), 'rdv', 'Rendez-vous annulé par le citoyen',
                           f'{rdv.reference} — {rdv.citoyen.full_name} a annulé son RDV du {date} à {heure}.',
                           '/admin/rdv')
        return Response(RendezVousSerializer(rdv).data)

    # ── Aides à la prise de RDV ───────────────────────────
    @action(detail=False, methods=['get'])
    def slots(self, request):
        tribunal_id = request.query_params.get('tribunal')
        date        = request.query_params.get('date')
        if not tribunal_id or not date:
            return Response({'error': 'tribunal et date requis'}, status=400)

        # Tout créneau déjà inscrit est indisponible (contrainte d'unicité en base)
        taken = RendezVous.objects.filter(tribunal_id=tribunal_id, date=date).values_list('heure', flat=True)
        taken_str = {h.strftime('%H:%M') for h in taken}

        maintenant = timezone.localtime()
        est_aujourdhui = date == maintenant.date().isoformat()
        result = []
        for s in CRENEAUX:
            passe = est_aujourdhui and s <= maintenant.strftime('%H:%M')
            result.append({'heure': s, 'disponible': s not in taken_str and not passe})
        return Response(result)

    @action(detail=False, methods=['get'])
    def services(self, request):
        """Services proposés + pièces à apporter + bureau d'orientation."""
        tribunal = Tribunal.objects.filter(id=request.query_params.get('tribunal') or 0).first()
        data = []
        for code, label in RendezVous.SERVICES:
            bureau, localisation = bureau_pour(code, tribunal)
            data.append({'value': code, 'label': label,
                         'pieces': PIECES_A_FOURNIR.get(code, PIECES_A_FOURNIR['autre']),
                         'bureau': bureau, 'localisation': localisation})
        return Response(data)
