from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['titre', 'destinataire', 'type_notif', 'lu', 'created_at']
    list_filter  = ['type_notif', 'lu']


from .models import SMSLog


@admin.register(SMSLog)
class SMSLogAdmin(admin.ModelAdmin):
    list_display  = ['created_at', 'telephone', 'destinataire', 'objet_ref', 'statut']
    list_filter   = ['statut']
    search_fields = ['telephone', 'objet_ref', 'message']
    readonly_fields = ['destinataire', 'telephone', 'message', 'statut', 'sid', 'erreur', 'objet_ref', 'created_at']
