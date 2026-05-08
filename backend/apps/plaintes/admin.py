from django.contrib import admin
from .models import Plainte, PieceJointe, MessageDossier

@admin.register(Plainte)
class PlainteAdmin(admin.ModelAdmin):
    list_display = ['reference', 'plaignant', 'nature', 'statut', 'created_at']
    list_filter  = ['statut', 'nature']
    search_fields = ['reference', 'plaignant__nom']

admin.site.register(PieceJointe)
admin.site.register(MessageDossier)
