from django.db.models import Q
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .models import AlerteSOS
from apps.accounts.models import STAFF_ROLES
from apps.accounts.permissions import IsStaffRole
from apps.notifications.services import notifier, notifier_personnel

# Personnel prévenu d'une alerte SOS (même liste que la sidebar « Alertes SOS »)
ROLES_SOS = ('admin', 'juge', 'greffier', 'accueil')


class AlerteSerializer(serializers.ModelSerializer):
    citoyen_nom       = serializers.CharField(source='citoyen.full_name', read_only=True)
    citoyen_telephone = serializers.CharField(source='citoyen.telephone', read_only=True)
    type_label        = serializers.CharField(source='get_type_alerte_display', read_only=True)
    statut_label      = serializers.CharField(source='get_statut_display', read_only=True)
    pris_en_charge_par_nom = serializers.CharField(source='pris_en_charge_par.full_name',
                                                   read_only=True, default='')

    class Meta:
        model  = AlerteSOS
        fields = '__all__'
        read_only_fields = ['reference','citoyen','statut','pris_en_charge_par','created_at','updated_at']


def alertes_visibles(user):
    """Alertes visibles : le citoyen voit les siennes ; le personnel, celles de son tribunal
    et celles des citoyens sans tribunal (cas général). Réutilisé par les statistiques."""
    qs = AlerteSOS.objects.select_related('citoyen', 'pris_en_charge_par')
    if user.role in STAFF_ROLES or user.is_superuser:
        if user.tribunal_id and not user.is_superuser:
            qs = qs.filter(Q(citoyen__tribunal=user.tribunal) | Q(citoyen__tribunal__isnull=True))
        return qs
    return qs.filter(citoyen=user)


class AlerteViewSet(viewsets.ModelViewSet):
    serializer_class   = AlerteSerializer
    permission_classes = [IsAuthenticated]
    pagination_class   = None
    http_method_names  = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        return alertes_visibles(self.request.user)

    def create(self, request, *args, **kwargs):
        if request.user.is_staff_role:
            return Response({'detail': 'L\'alerte SOS est réservée aux citoyens.'}, status=403)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        alerte = serializer.save(citoyen=self.request.user)
        position = (f'{alerte.latitude}, {alerte.longitude}' if alerte.latitude is not None
                    else 'position GPS indisponible')
        notifier(alerte.citoyen, 'sos', 'Alerte SOS transmise',
                 f'Votre alerte {alerte.reference} a été transmise au tribunal. '
                 f'En danger immédiat, appelez le 17.', '/citoyen/sos')
        notifier_personnel(alerte.citoyen.tribunal, ROLES_SOS, 'sos',
                           f'ALERTE SOS — {alerte.get_type_alerte_display()}',
                           f'{alerte.reference} : {alerte.citoyen.full_name} '
                           f'({alerte.citoyen.telephone or "sans téléphone"}) — {position}.',
                           '/admin/alertes')

    @action(detail=True, methods=['post'], permission_classes=[IsStaffRole])
    def prendre(self, request, pk=None):
        alerte = self.get_object()
        if alerte.statut != 'active':
            return Response({'detail': 'Cette alerte est déjà prise en charge ou clôturée.'}, status=400)
        alerte.statut = 'progress'
        alerte.pris_en_charge_par = request.user
        alerte.save(update_fields=['statut', 'pris_en_charge_par', 'updated_at'])
        notifier(alerte.citoyen, 'sos', 'Alerte prise en charge',
                 f'Votre alerte {alerte.reference} est prise en charge par {request.user.full_name}.',
                 '/citoyen/sos')
        notifier_personnel(alerte.citoyen.tribunal, ROLES_SOS, 'sos', f'{alerte.reference} prise en charge',
                           f'Alerte prise en charge par {request.user.full_name}.', '/admin/alertes',
                           exclure=request.user)
        return Response(self.get_serializer(alerte).data)

    @action(detail=True, methods=['post'], permission_classes=[IsStaffRole])
    def cloturer(self, request, pk=None):
        alerte = self.get_object()
        if alerte.statut not in ('active', 'progress'):
            return Response({'detail': 'Cette alerte est déjà clôturée.'}, status=400)
        commentaire = str(request.data.get('commentaire', '')).strip()[:500]
        alerte.statut = 'resolved'
        if alerte.pris_en_charge_par_id is None:
            alerte.pris_en_charge_par = request.user
        alerte.save(update_fields=['statut', 'pris_en_charge_par', 'updated_at'])
        corps = f'Votre alerte {alerte.reference} a été clôturée par le tribunal.'
        if commentaire:
            corps += f' {commentaire}'
        notifier(alerte.citoyen, 'sos', 'Alerte clôturée', corps, '/citoyen/sos')
        return Response(self.get_serializer(alerte).data)


router = DefaultRouter()
router.register('', AlerteViewSet, basename='alerte')
urlpatterns = [path('', include(router.urls))]
