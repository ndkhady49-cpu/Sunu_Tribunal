from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .models import Plainte, PieceJointe, MessageDossier


# ── Serializers ───────────────────────────────────────
class PieceJointeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PieceJointe
        fields = ['id','nom','fichier','taille','uploaded_at']


class MessageSerializer(serializers.ModelSerializer):
    auteur_nom = serializers.CharField(source='auteur.nom', read_only=True)
    class Meta:
        model  = MessageDossier
        fields = ['id','contenu','auteur_nom','created_at']
        read_only_fields = ['auteur_nom','created_at']


class PlainteSerializer(serializers.ModelSerializer):
    plaignant_nom = serializers.CharField(source='plaignant.nom',         read_only=True)
    tribunal_nom  = serializers.CharField(source='tribunal.nom',          read_only=True)
    nature_label  = serializers.CharField(source='get_nature_display',     read_only=True)
    pieces        = PieceJointeSerializer(many=True, read_only=True)
    messages      = MessageSerializer(many=True, read_only=True)
    nb_pieces     = serializers.IntegerField(source='pieces.count',        read_only=True)

    class Meta:
        model  = Plainte
        fields = '__all__'
        read_only_fields = ['reference','plaignant','statut','created_at','updated_at']


# ── Views ─────────────────────────────────────────────
class PlainteViewSet(viewsets.ModelViewSet):
    serializer_class   = PlainteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend]
    filterset_fields   = ['statut', 'nature', 'tribunal']

    def get_queryset(self):
        user = self.request.user
        if user.role in ('admin', 'juge'):
            qs = Plainte.objects.all()
            if user.tribunal:
                qs = qs.filter(tribunal=user.tribunal)
            return qs
        return Plainte.objects.filter(plaignant=user)

    def perform_create(self, serializer):
        plainte = serializer.save(plaignant=self.request.user)
        # Handle file uploads
        for f in self.request.FILES.getlist('pieces'):
            PieceJointe.objects.create(
                plainte=plainte, fichier=f, nom=f.name, taille=f.size
            )

    @action(detail=False, methods=['get'])
    def my(self, request):
        plaintes = Plainte.objects.filter(plaignant=request.user).order_by('-created_at')
        return Response(PlainteSerializer(plaintes, many=True).data)

    @action(detail=True, methods=['post'])
    def instruire(self, request, pk=None):
        plainte = self.get_object()
        plainte.statut = 'progress'
        plainte.save()
        return Response({'status': 'progress', 'message': 'Plainte prise en instruction'})

    @action(detail=True, methods=['post'])
    def message(self, request, pk=None):
        plainte = self.get_object()
        msg = MessageDossier.objects.create(
            plainte=plainte,
            auteur=request.user,
            contenu=request.data.get('message', '')
        )
        # TODO: push notification to citoyen
        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)


# ── URLs ──────────────────────────────────────────────
router = DefaultRouter()
router.register('', PlainteViewSet, basename='plainte')
urlpatterns = [path('', include(router.urls))]
