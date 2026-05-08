from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .models import AlerteSOS


class AlerteSerializer(serializers.ModelSerializer):
    citoyen_nom = serializers.CharField(source='citoyen.nom', read_only=True)
    type_label  = serializers.CharField(source='get_type_alerte_display', read_only=True)
    class Meta:
        model  = AlerteSOS
        fields = '__all__'
        read_only_fields = ['reference','citoyen','statut','created_at']


class AlerteViewSet(viewsets.ModelViewSet):
    serializer_class   = AlerteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ('admin', 'juge'):
            return AlerteSOS.objects.all()
        return AlerteSOS.objects.filter(citoyen=user)

    def perform_create(self, serializer):
        alerte = serializer.save(citoyen=self.request.user)
        # TODO: notify police + admin push notification
        return alerte

    @action(detail=True, methods=['post'])
    def prendre(self, request, pk=None):
        alerte = self.get_object()
        alerte.statut = 'progress'
        alerte.pris_en_charge_par = request.user
        alerte.save()
        return Response({'status': 'progress'})

    @action(detail=True, methods=['post'])
    def cloturer(self, request, pk=None):
        alerte = self.get_object()
        alerte.statut = 'resolved'
        alerte.save()
        return Response({'status': 'resolved'})


router = DefaultRouter()
router.register('', AlerteViewSet, basename='alerte')
urlpatterns = [path('', include(router.urls))]
