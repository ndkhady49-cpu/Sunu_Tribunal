from django.contrib import admin
from .models import Tribunal, RendezVous

@admin.register(Tribunal)
class TribunalAdmin(admin.ModelAdmin):
    list_display = ['nom', 'adresse', 'actif']
    search_fields = ['nom']

@admin.register(RendezVous)
class RendezVousAdmin(admin.ModelAdmin):
    list_display = ['reference', 'citoyen', 'tribunal', 'date', 'heure', 'statut']
    list_filter  = ['statut', 'tribunal', 'date']
    search_fields = ['reference', 'citoyen__nom']
