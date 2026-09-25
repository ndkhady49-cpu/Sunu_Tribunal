from django.contrib import admin
from .models import Plainte, PieceJointe, MessageDossier, EvenementPlainte

@admin.register(Plainte)
class PlainteAdmin(admin.ModelAdmin):
    list_display = ['reference', 'plaignant', 'nature', 'statut', 'created_at']
    list_filter  = ['statut', 'nature']
    search_fields = ['reference', 'plaignant__nom']

admin.site.register(PieceJointe)
admin.site.register(MessageDossier)


@admin.register(EvenementPlainte)
class EvenementPlainteAdmin(admin.ModelAdmin):
    list_display  = ['plainte', 'type', 'statut', 'auteur', 'created_at']
    list_filter   = ['type']
    search_fields = ['plainte__reference', 'detail']
