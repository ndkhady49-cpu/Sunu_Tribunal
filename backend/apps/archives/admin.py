from django.contrib import admin
from .models import DossierArchive, PieceArchive, HistoriqueDossier


class PieceInline(admin.TabularInline):
    model = PieceArchive
    extra = 0
    readonly_fields = ['taille', 'ajoute_par', 'created_at']


class HistoriqueInline(admin.TabularInline):
    model = HistoriqueDossier
    extra = 0
    readonly_fields = ['action', 'detail', 'agent', 'date']
    can_delete = False


@admin.register(DossierArchive)
class DossierArchiveAdmin(admin.ModelAdmin):
    list_display  = ['numero', 'registre', 'categorie', 'intitule', 'demandeur', 'statut', 'date_ouverture']
    list_filter   = ['registre', 'categorie', 'statut']
    search_fields = ['numero', 'intitule', 'demandeur', 'defendeur', 'mots_cles']
    readonly_fields = ['numero']
    inlines = [PieceInline, HistoriqueInline]
