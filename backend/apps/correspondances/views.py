from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import HasRole
from apps.notifications.services import notifier, notifier_personnel
from apps.plaintes.models import Plainte
from apps.rdv.models import RendezVous
from apps.registres.models import Courrier, Transmission
from .models import CourrierCitoyen
from .serializers import CourrierCitoyenSerializer

# Personnel qui gère les courriers des citoyens (même liste que la sidebar « Courriers »)
ROLES_COURRIER = ('admin', 'greffier', 'courrier', 'accueil')
# Personnel prévenu à l'arrivée d'un courrier citoyen
ROLES_ALERTES_COURRIER = ('admin', 'greffier', 'courrier')
ROLES_CITOYEN = ('citoyen', 'avocat')


def dossier_du_citoyen(citoyen, ref):
    """Plainte ou RDV `ref` appartenant à ce citoyen (None si ref vide ; erreur si inconnu)."""
    if not ref:
        return None
    dossier = (Plainte.objects.select_related('tribunal', 'juge').filter(reference=ref, plaignant=citoyen).first()
               or RendezVous.objects.select_related('tribunal').filter(reference=ref, citoyen=citoyen).first())
    if dossier is None:
        raise ValidationError({'dossier_ref': 'Ce dossier n\'appartient pas à ce citoyen.'})
    return dossier


def inscrire_au_registre(cc, agent):
    """Inscrit le courrier au registre officiel : arrivée (CA-…) ou départ (CD-…)."""
    arrivee = cc.sens == 'entrant'
    reg = Courrier(
        sens='arrivee' if arrivee else 'depart',
        registre='plaintes' if cc.dossier_ref.startswith('PLT') else 'administratif',
        tribunal=cc.tribunal,
        date_courrier=timezone.localdate(),
        correspondant=(cc.citoyen.full_name or cc.citoyen.email)[:200],
        adresse_correspondant=cc.citoyen.email,
        reference_externe='Application SunuTribunal',
        objet=cc.sujet[:300],
        resume=cc.message[:2000],
        dossier_lie=cc.dossier_ref,
        service_actuel='cabinet_juge' if cc.destinataire_service == 'juge_dossier' else 'bureau_courrier',
        statut='enregistre' if arrivee else 'expedie',
        enregistre_par=agent,
    )
    if cc.piece_jointe:
        reg.fichier = cc.piece_jointe.name
    reg.save()
    Transmission.objects.create(
        courrier=reg, action='enregistrement', agent=agent, service_destination=reg.service_actuel,
        commentaire=f'Reçu via l\'application citoyen — n° {reg.numero}' if arrivee
                    else f'Enregistré au départ sous le n° {reg.numero}',
    )
    if not arrivee:
        Transmission.objects.create(courrier=reg, action='expedition', agent=agent,
                                    service_origine='bureau_courrier', service_destination='exterieur',
                                    commentaire='Envoyé au citoyen via l\'application')
    cc.courrier_registre = reg
    cc.save(update_fields=['courrier_registre'])


def courriers_visibles(user):
    """Courriers visibles selon le rôle (réutilisé par les statistiques)."""
    qs = CourrierCitoyen.objects.select_related('citoyen', 'tribunal', 'juge', 'auteur', 'courrier_registre')
    if user.is_superuser:
        return qs
    if user.role in ROLES_CITOYEN:
        return qs.filter(citoyen=user)
    if user.role == 'juge':
        return qs.filter(Q(juge=user) | Q(auteur=user))
    if user.role in ROLES_COURRIER:
        if user.tribunal_id:
            qs = qs.filter(Q(tribunal=user.tribunal) | Q(tribunal__isnull=True))
        return qs
    return qs.none()


class CourrierCitoyenViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin,
                             mixins.CreateModelMixin, viewsets.GenericViewSet):
    """
    Courriers citoyen ↔ tribunal.
    Citoyen   : ses courriers (reçus = sortant, envoyés = entrant).
    Personnel : courriers de son tribunal ; le juge ne voit que ceux qui lui sont adressés.
    Filtres   : ?sens=entrant|sortant  ?citoyen=<id>
    """
    serializer_class   = CourrierCitoyenSerializer
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]
    pagination_class   = None

    def get_queryset(self):
        qs = courriers_visibles(self.request.user)
        p = self.request.query_params
        if p.get('sens') in ('entrant', 'sortant'):
            qs = qs.filter(sens=p['sens'])
        if p.get('citoyen', '').isdigit():
            qs = qs.filter(citoyen_id=int(p['citoyen']))
        return qs

    def create(self, request, *args, **kwargs):
        user = request.user
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            if user.role in ROLES_CITOYEN and not user.is_superuser:
                cc = self._depuis_citoyen(serializer)
            elif user.role in ROLES_COURRIER or user.role == 'juge' or user.is_superuser:
                cc = self._vers_citoyen(serializer.validated_data)
            else:
                return Response({'detail': 'Action non autorisée.'}, status=403)
        return Response(self.get_serializer(cc).data, status=status.HTTP_201_CREATED)

    # ── Citoyen → tribunal ────────────────────────────────
    def _depuis_citoyen(self, serializer):
        user = self.request.user
        data = serializer.validated_data
        parent = data.get('parent')
        if parent is not None and parent.citoyen_id != user.id:
            raise ValidationError({'parent': 'Courrier introuvable.'})
        dossier = dossier_du_citoyen(user, data.get('dossier_ref', ''))
        tribunal = (dossier.tribunal if dossier else None) or (parent.tribunal if parent else None) \
            or data.get('tribunal')
        if tribunal is None:
            raise ValidationError({'tribunal': 'Choisissez le tribunal destinataire.'})

        juge = None
        if data.get('destinataire_service') == 'juge_dossier':
            juge = getattr(dossier, 'juge', None)
            if juge is None:
                raise ValidationError({'destinataire_service':
                                       'Aucun juge n\'est encore assigné à ce dossier : écrivez au greffe.'})

        cc = serializer.save(citoyen=user, sens='entrant', tribunal=tribunal, juge=juge, auteur=user)
        inscrire_au_registre(cc, None)

        lien = f'/admin/courrier?id={cc.id}'
        titre = f'Nouveau courrier de {user.full_name}'
        corps = f'{cc.sujet} — enregistré sous le n° {cc.courrier_registre.numero}.'
        if juge:
            notifier(juge, 'message', titre, corps, lien)
        notifier_personnel(tribunal, ROLES_ALERTES_COURRIER, 'message', titre, corps, lien)
        return cc

    # ── Tribunal → citoyen ────────────────────────────────
    def _vers_citoyen(self, data, parent=None):
        agent = self.request.user
        citoyen = parent.citoyen if parent else data.get('citoyen')
        if citoyen is None or citoyen.role not in ROLES_CITOYEN:
            raise ValidationError({'citoyen': 'Choisissez le citoyen destinataire.'})
        dossier_ref = data.get('dossier_ref') or (parent.dossier_ref if parent else '')
        dossier = dossier_du_citoyen(citoyen, dossier_ref)
        tribunal = (agent.tribunal or (dossier.tribunal if dossier else None)
                    or (parent.tribunal if parent else None) or data.get('tribunal'))

        cc = CourrierCitoyen.objects.create(
            citoyen=citoyen, tribunal=tribunal, sens='sortant',
            destinataire_service=parent.destinataire_service if parent else 'greffe',
            sujet=data['sujet'], message=data['message'], dossier_ref=dossier_ref,
            piece_jointe=data.get('piece_jointe') or '', auteur=agent, parent=parent,
        )
        inscrire_au_registre(cc, agent)
        notifier(citoyen, 'message', f'Courrier du tribunal : {cc.sujet}',
                 cc.message if len(cc.message) <= 160 else cc.message[:157] + '...',
                 f'/citoyen/courrier?id={cc.id}')
        return cc

    @action(detail=True, methods=['post'], permission_classes=[HasRole(*ROLES_COURRIER, 'juge')])
    def repondre(self, request, pk=None):
        parent = self.get_object()
        if parent.sens != 'entrant':
            return Response({'detail': 'On ne répond qu\'à un courrier reçu d\'un citoyen.'}, status=400)
        data = {
            'sujet':   str(request.data.get('sujet') or f'Re: {parent.sujet}')[:300].strip(),
            'message': str(request.data.get('message', '')).strip(),
            'dossier_ref': str(request.data.get('dossier_ref') or parent.dossier_ref),
            'piece_jointe': request.FILES.get('piece_jointe'),
        }
        if not data['message']:
            return Response({'message': ['Le message est obligatoire.']}, status=400)
        if data['piece_jointe']:
            self.get_serializer().validate_piece_jointe(data['piece_jointe'])
        with transaction.atomic():
            cc = self._vers_citoyen(data, parent=parent)
            if not parent.lu:
                parent.lu, parent.lu_at = True, timezone.now()
                parent.save(update_fields=['lu', 'lu_at'])
        return Response(self.get_serializer(cc).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def lu(self, request, pk=None):
        """Seul le destinataire marque un courrier comme lu."""
        cc = self.get_object()
        destinataire_citoyen = cc.sens == 'sortant'
        if destinataire_citoyen != (request.user.role in ROLES_CITOYEN):
            return Response({'detail': 'Seul le destinataire peut marquer ce courrier comme lu.'}, status=400)
        if not cc.lu:
            cc.lu, cc.lu_at = True, timezone.now()
            cc.save(update_fields=['lu', 'lu_at'])
        return Response(self.get_serializer(cc).data)

    # ── Aides aux formulaires ─────────────────────────────
    @action(detail=False, methods=['get'], permission_classes=[HasRole(*ROLES_COURRIER, 'juge')])
    def citoyens(self, request):
        q = request.query_params.get('q', '').strip()
        qs = User.objects.filter(role__in=ROLES_CITOYEN, is_active=True)
        if q:
            qs = qs.filter(Q(nom__icontains=q) | Q(prenom__icontains=q) | Q(email__icontains=q) |
                           Q(cni__icontains=q) | Q(telephone__icontains=q))
        return Response([{'id': u.id, 'nom': u.full_name, 'email': u.email, 'telephone': u.telephone}
                         for u in qs.order_by('nom')[:20]])

    @action(detail=False, methods=['get'])
    def dossiers(self, request):
        """Références PLT / RDV d'un citoyen (le sien, ou ?citoyen= pour le personnel)."""
        user = request.user
        if user.role in ROLES_CITOYEN and not user.is_superuser:
            citoyen = user
        elif user.is_staff_role:
            citoyen = User.objects.filter(pk=request.query_params.get('citoyen') or 0).first()
            if citoyen is None:
                return Response([])
        else:
            return Response([])
        data = [{'ref': p.reference, 'type': 'Plainte', 'libelle': p.get_nature_display(),
                 'tribunal': p.tribunal_id, 'tribunal_nom': p.tribunal.nom,
                 'juge': p.juge.full_name if p.juge else ''}
                for p in Plainte.objects.filter(plaignant=citoyen).select_related('tribunal', 'juge')]
        data += [{'ref': r.reference, 'type': 'Rendez-vous', 'libelle': r.get_service_display(),
                  'tribunal': r.tribunal_id, 'tribunal_nom': r.tribunal.nom, 'juge': ''}
                 for r in RendezVous.objects.filter(citoyen=citoyen).select_related('tribunal')]
        return Response(data)
