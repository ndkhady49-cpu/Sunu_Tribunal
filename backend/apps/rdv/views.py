from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import RendezVous, Tribunal
from .serializers import RendezVousSerializer, TribunalSerializer


class TribunalViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tribunal.objects.filter(actif=True)
    serializer_class = TribunalSerializer
    permission_classes = [IsAuthenticated]


class RendezVousViewSet(viewsets.ModelViewSet):
    serializer_class   = RendezVousSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend]
    filterset_fields   = ['statut', 'tribunal', 'date']

    def get_queryset(self):
        user = self.request.user
        if user.role in ('admin', 'juge'):
            qs = RendezVous.objects.all()
            if user.tribunal:
                qs = qs.filter(tribunal=user.tribunal)
            return qs
        return RendezVous.objects.filter(citoyen=user)

    def perform_create(self, serializer):
        serializer.save(citoyen=self.request.user)

    @action(detail=False, methods=['get'])
    def my(self, request):
        rdvs = RendezVous.objects.filter(citoyen=request.user).order_by('-created_at')
        return Response(RendezVousSerializer(rdvs, many=True).data)

    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        rdv = self.get_object()
        rdv.statut = 'confirmed'
        rdv.save()
        # TODO: send push notification to citoyen
        return Response({'status': 'confirmed', 'message': 'RDV confirmé — citoyen notifié'})

    @action(detail=True, methods=['post'])
    def rejeter(self, request, pk=None):
        rdv = self.get_object()
        rdv.statut = 'rejected'
        rdv.notes_admin = request.data.get('motif', '')
        rdv.save()
        return Response({'status': 'rejected'})

    @action(detail=False, methods=['get'])
    def slots(self, request):
        tribunal_id = request.query_params.get('tribunal')
        date        = request.query_params.get('date')
        if not tribunal_id or not date:
            return Response({'error': 'tribunal et date requis'}, status=400)

        all_slots  = ['08:00','09:00','10:00','11:00','14:00','15:00','16:00']
        taken = RendezVous.objects.filter(
            tribunal_id=tribunal_id, date=date,
            statut__in=['pending','confirmed']
        ).values_list('heure', flat=True)
        taken_str = [str(h)[:5] for h in taken]

        result = [{'heure': s, 'disponible': s not in taken_str} for s in all_slots]
        return Response(result)
