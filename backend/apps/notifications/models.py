from django.db import models
from django.conf import settings
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.urls import path, include
from rest_framework.routers import DefaultRouter


class Notification(models.Model):
    TYPES = [
        ('rdv',     'Rendez-vous'),
        ('plainte', 'Plainte'),
        ('sos',     'Alerte SOS'),
        ('message', 'Message tribunal'),
        ('system',  'Système'),
    ]
    destinataire = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                     related_name='notifications')
    type_notif   = models.CharField(max_length=20, choices=TYPES, default='system')
    titre        = models.CharField(max_length=200)
    corps        = models.TextField()
    lu           = models.BooleanField(default=False)
    lien         = models.CharField(max_length=200, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Notification
        fields = '__all__'
        read_only_fields = ['destinataire','created_at']


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class   = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(destinataire=self.request.user)

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        notif = self.get_object()
        notif.lu = True
        notif.save()
        return Response({'status': 'read'})

    @action(detail=False, methods=['post'])
    def read_all(self, request):
        self.get_queryset().update(lu=True)
        return Response({'status': 'all read'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = self.get_queryset().filter(lu=False).count()
        return Response({'count': count})


router = DefaultRouter()
router.register('', NotificationViewSet, basename='notification')
urlpatterns = [path('', include(router.urls))]
