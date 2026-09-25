import os
from django.db.models import Q, Count
from django.utils import timezone
from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import IsStaffRole, IsChefGreffe
from apps.registres.views import filtrer_par_tribunal
from .models import DossierArchive, PieceArchive, HistoriqueDossier
from .serializers import DossierArchiveSerializer, DossierArchiveListSerializer, PieceArchiveSerializer

EXTENSIONS_AUTORISEES = {'.pdf', '.jpg', '.jpeg', '.png', '.webp', '.heic'}
TAILLE_MAX = 15 * 1024 * 1024  # 15 Mo par fichier


def tracer(dossier, user, action, detail=''):
    HistoriqueDossier.objects.create(dossier=dossier, agent=user, action=action, detail=detail)


class DossierArchiveViewSet(mixins.ListModelMixin, mixins.CreateModelMixin,
                            mixins.RetrieveModelMixin, mixins.UpdateModelMixin,
                            viewsets.GenericViewSet):
    """
    Archivage numérique.
    Recherche : ?q=  (n°, intitulé, parties, mots-clés, nom des pièces)
    Filtres   : ?registre=  ?statut=  ?categorie=  ?annee=  ?juge=
    """
    permission_classes = [IsStaffRole]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]
    pagination_class   = None

    def get_serializer_class(self):
        return DossierArchiveListSerializer if self.action == 'list' else DossierArchiveSerializer

    def get_queryset(self):
        qs = filtrer_par_tribunal(
            DossierArchive.objects.select_related('juge', 'plainte')
                                  .prefetch_related('pieces__ajoute_par', 'historique__agent'),
            self.request.user,
        )
        p = self.request.query_params
        for champ in ('registre', 'statut', 'categorie'):
            if p.get(champ):
                qs = qs.filter(**{champ: p[champ]})
        if p.get('annee', '').isdigit():
            qs = qs.filter(date_ouverture__year=int(p['annee']))
        if p.get('juge', '').isdigit():
            qs = qs.filter(juge_id=int(p['juge']))
        if p.get('q'):
            q = p['q'].strip()
            qs = qs.filter(
                Q(numero__icontains=q) | Q(intitule__icontains=q) |
                Q(demandeur__icontains=q) | Q(defendeur__icontains=q) |
                Q(mots_cles__icontains=q) | Q(pieces__nom__icontains=q) |
                Q(plainte__reference__icontains=q)
            ).distinct()
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        dossier = serializer.save(tribunal=user.tribunal, cree_par=user)
        tracer(dossier, user, 'Ouverture du dossier',
               f'Inscrit au {dossier.get_registre_display().lower()} sous le n° {dossier.numero}')

    def perform_update(self, serializer):
        dossier = serializer.save()
        champs = ', '.join(sorted(serializer.validated_data.keys()))
        tracer(dossier, self.request.user, 'Modification', f'Champs modifiés : {champs}')

    def _reponse(self, dossier, request):
        # Recharge depuis la base : pièces et historique à jour
        frais = DossierArchive.objects.prefetch_related('pieces__ajoute_par', 'historique__agent').get(pk=dossier.pk)
        return Response(DossierArchiveSerializer(frais, context={'request': request}).data)

    # ── Pièces scannées ───────────────────────────────────
    @action(detail=True, methods=['post'])
    def pieces(self, request, pk=None):
        """Ajouter une ou plusieurs pièces (champ multipart 'fichiers')."""
        dossier = self.get_object()
        fichiers = request.FILES.getlist('fichiers')
        if not fichiers:
            return Response({'detail': 'Aucun fichier reçu.'}, status=400)
        type_piece = request.data.get('type_piece', 'autre')
        if type_piece not in dict(PieceArchive.TYPES):
            type_piece = 'autre'

        for f in fichiers:
            ext = os.path.splitext(f.name)[1].lower()
            if ext not in EXTENSIONS_AUTORISEES:
                return Response({'detail': f'« {f.name} » : format non accepté (PDF ou image uniquement).'}, status=400)
            if f.size > TAILLE_MAX:
                return Response({'detail': f'« {f.name} » dépasse 15 Mo.'}, status=400)

        crees = [PieceArchive.objects.create(dossier=dossier, fichier=f, nom=f.name[:200],
                                             type_piece=type_piece, taille=f.size,
                                             ajoute_par=request.user)
                 for f in fichiers]
        tracer(dossier, request.user, 'Numérisation',
               f'{len(crees)} pièce(s) ajoutée(s) : ' + ', '.join(p.nom for p in crees))
        return Response(PieceArchiveSerializer(crees, many=True, context={'request': request}).data, status=201)

    @action(detail=True, methods=['delete'], url_path=r'pieces/(?P<piece_id>\d+)',
            permission_classes=[IsChefGreffe])
    def supprimer_piece(self, request, pk=None, piece_id=None):
        """Suppression d'une pièce : réservée au greffier en chef, et tracée."""
        dossier = self.get_object()
        piece = dossier.pieces.filter(id=piece_id).first()
        if not piece:
            return Response({'detail': 'Pièce introuvable.'}, status=404)
        nom = piece.nom
        piece.fichier.delete(save=False)
        piece.delete()
        tracer(dossier, request.user, 'Suppression de pièce', nom)
        return Response(status=204)

    # ── Cycle de vie ──────────────────────────────────────
    @action(detail=True, methods=['post'])
    def cloturer(self, request, pk=None):
        dossier = self.get_object()
        if dossier.statut != 'actif':
            return Response({'detail': 'Seul un dossier en cours peut être clôturé.'}, status=400)
        dossier.statut = 'clos'
        dossier.date_cloture = timezone.localdate()
        dossier.save(update_fields=['statut', 'date_cloture', 'updated_at'])
        tracer(dossier, request.user, 'Clôture', str(request.data.get('commentaire', ''))[:500])
        return self._reponse(dossier, request)

    @action(detail=True, methods=['post'])
    def archiver(self, request, pk=None):
        """Archivage : l'emplacement de l'original papier est obligatoire."""
        dossier = self.get_object()
        if dossier.statut == 'archive':
            return Response({'detail': 'Ce dossier est déjà archivé.'}, status=400)
        for champ in ('salle', 'armoire', 'etagere', 'boite'):
            if champ in request.data:
                setattr(dossier, champ, str(request.data[champ])[:60])
        if not (dossier.salle and dossier.boite):
            return Response({'detail': "Indiquez au minimum la salle et la boîte d'archives de l'original papier."}, status=400)
        if not dossier.date_cloture:
            dossier.date_cloture = timezone.localdate()
        dossier.statut = 'archive'
        dossier.save()
        tracer(dossier, request.user, 'Archivage', f'Original classé : {dossier.emplacement}')
        return self._reponse(dossier, request)

    @action(detail=True, methods=['post'])
    def rouvrir(self, request, pk=None):
        dossier = self.get_object()
        if dossier.statut == 'actif':
            return Response({'detail': 'Ce dossier est déjà en cours.'}, status=400)
        dossier.statut = 'actif'
        dossier.date_cloture = None
        dossier.save(update_fields=['statut', 'date_cloture', 'updated_at'])
        tracer(dossier, request.user, 'Réouverture', str(request.data.get('commentaire', ''))[:500])
        return self._reponse(dossier, request)

    # ── Outils ────────────────────────────────────────────
    @action(detail=False, methods=['get'])
    def stats(self, request):
        qs = filtrer_par_tribunal(DossierArchive.objects.all(), request.user)
        par_statut = dict(qs.values_list('statut').annotate(n=Count('id')))
        pieces = PieceArchive.objects.filter(dossier__in=qs)
        return Response({
            'total':        qs.count(),
            'actifs':       par_statut.get('actif', 0),
            'clos':         par_statut.get('clos', 0),
            'archives':     par_statut.get('archive', 0),
            'pieces':       pieces.count(),
            'sans_scan':    qs.filter(pieces__isnull=True).count(),
        })

    @action(detail=False, methods=['get'])
    def juges(self, request):
        juges = User.objects.filter(role='juge', is_active=True)
        juges = filtrer_par_tribunal(juges, request.user)
        return Response([{'id': j.id, 'nom': j.full_name} for j in juges])
