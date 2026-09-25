from django.contrib import admin
from .models import CourrierCitoyen


@admin.register(CourrierCitoyen)
class CourrierCitoyenAdmin(admin.ModelAdmin):
    list_display  = ['created_at', 'sens', 'citoyen', 'tribunal', 'sujet', 'dossier_ref', 'lu', 'courrier_registre']
    list_filter   = ['sens', 'destinataire_service', 'lu', 'tribunal']
    search_fields = ['sujet', 'message', 'dossier_ref', 'citoyen__nom', 'citoyen__email']
