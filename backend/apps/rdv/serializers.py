import datetime
from django.utils import timezone
from rest_framework import serializers
from .models import RendezVous, Tribunal, PIECES_A_FOURNIR, bureau_pour

# Créneaux proposés aux citoyens
CRENEAUX = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00']


class TribunalSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Tribunal
        fields = '__all__'


class RendezVousSerializer(serializers.ModelSerializer):
    citoyen_nom       = serializers.SerializerMethodField()
    citoyen_telephone = serializers.CharField(source='citoyen.telephone', read_only=True)
    tribunal_nom      = serializers.CharField(source='tribunal.nom',     read_only=True)
    service_label     = serializers.CharField(source='get_service_display', read_only=True)
    statut_label      = serializers.CharField(source='get_statut_display', read_only=True)
    motif_rejet       = serializers.CharField(source='notes_admin', read_only=True)
    pieces_a_fournir  = serializers.SerializerMethodField()
    orientation       = serializers.SerializerMethodField()

    class Meta:
        model  = RendezVous
        fields = ['id', 'reference', 'citoyen', 'citoyen_nom', 'citoyen_telephone',
                  'tribunal', 'tribunal_nom', 'service', 'service_label', 'date', 'heure',
                  'motif', 'statut', 'statut_label', 'motif_rejet',
                  'pieces_a_fournir', 'orientation', 'created_at', 'updated_at']
        read_only_fields = ['reference', 'citoyen', 'statut', 'created_at', 'updated_at']
        validators = []  # le doublon de créneau est vérifié dans validate() avec un message clair

    def get_citoyen_nom(self, obj):
        return obj.citoyen.full_name

    def get_pieces_a_fournir(self, obj):
        return PIECES_A_FOURNIR.get(obj.service, PIECES_A_FOURNIR['autre'])

    def get_orientation(self, obj):
        """Ticket d'orientation : visible uniquement quand le RDV est confirmé."""
        if obj.statut != 'confirmed':
            return None
        bureau, localisation = bureau_pour(obj)
        return {'bureau': bureau, 'localisation': localisation}

    def validate(self, data):
        date     = data.get('date', getattr(self.instance, 'date', None))
        heure    = data.get('heure', getattr(self.instance, 'heure', None))
        tribunal = data.get('tribunal', getattr(self.instance, 'tribunal', None))

        if date:
            if date < timezone.localdate():
                raise serializers.ValidationError({'date': 'La date ne peut pas être dans le passé.'})
            if date.weekday() >= 5:
                raise serializers.ValidationError({'date': 'Le tribunal reçoit du lundi au vendredi.'})
        if heure and heure.strftime('%H:%M') not in CRENEAUX:
            raise serializers.ValidationError({'heure': 'Créneau horaire non proposé.'})
        if date and heure and date == timezone.localdate():
            if datetime.datetime.combine(date, heure) <= timezone.localtime().replace(tzinfo=None):
                raise serializers.ValidationError({'heure': 'Ce créneau est déjà passé.'})
        if tribunal and date and heure:
            deja = RendezVous.objects.filter(tribunal=tribunal, date=date, heure=heure)
            if self.instance:
                deja = deja.exclude(pk=self.instance.pk)
            if deja.exists():
                raise serializers.ValidationError({'heure': 'Ce créneau vient d\'être réservé. Choisissez-en un autre.'})
        return data
