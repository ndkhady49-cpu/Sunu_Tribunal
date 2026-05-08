# serializers.py
from rest_framework import serializers
from .models import RendezVous, Tribunal


class TribunalSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Tribunal
        fields = '__all__'


class RendezVousSerializer(serializers.ModelSerializer):
    citoyen_nom  = serializers.CharField(source='citoyen.nom',      read_only=True)
    tribunal_nom = serializers.CharField(source='tribunal.nom',     read_only=True)
    service_label= serializers.CharField(source='get_service_display', read_only=True)

    class Meta:
        model  = RendezVous
        fields = '__all__'
        read_only_fields = ['reference','citoyen','statut','created_at','updated_at']
