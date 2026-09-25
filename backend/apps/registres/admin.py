from django.contrib import admin
from .models import Courrier, Transmission, Compteur, ParametreJuridiction


class TransmissionInline(admin.TabularInline):
    model = Transmission
    extra = 0
    readonly_fields = ['action', 'service_origine', 'service_destination', 'agent', 'commentaire', 'date']
    can_delete = False


@admin.register(Courrier)
class CourrierAdmin(admin.ModelAdmin):
    list_display  = ['numero', 'sens', 'registre', 'correspondant', 'objet', 'service_actuel', 'statut', 'date_enregistrement']
    list_filter   = ['sens', 'registre', 'statut', 'priorite', 'service_actuel']
    search_fields = ['numero', 'objet', 'correspondant', 'reference_externe']
    readonly_fields = ['numero']
    inlines = [TransmissionInline]


@admin.register(ParametreJuridiction)
class ParametreJuridictionAdmin(admin.ModelAdmin):
    list_display = ['tribunal', 'code']


@admin.register(Compteur)
class CompteurAdmin(admin.ModelAdmin):
    list_display = ['registre', 'annee', 'tribunal', 'dernier']
    list_filter  = ['registre', 'annee']
