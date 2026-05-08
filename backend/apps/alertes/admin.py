from django.contrib import admin
from .models import AlerteSOS

@admin.register(AlerteSOS)
class AlerteAdmin(admin.ModelAdmin):
    list_display = ['reference', 'citoyen', 'type_alerte', 'statut', 'created_at']
    list_filter  = ['statut', 'type_alerte']
    search_fields = ['reference', 'citoyen__nom']
