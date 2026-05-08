from django.db import models
from django.conf import settings


class Tribunal(models.Model):
    nom      = models.CharField(max_length=200)
    adresse  = models.CharField(max_length=300)
    telephone = models.CharField(max_length=20, blank=True)
    email    = models.EmailField(blank=True)
    latitude  = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    heures_ouverture = models.CharField(max_length=100, default='Lun–Ven · 08h–17h')
    actif    = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Tribunal'
        ordering = ['nom']

    def __str__(self):
        return self.nom


class RendezVous(models.Model):
    SERVICES = [
        ('civil',         'Dépôt dossier civil'),
        ('consultation',  'Consultation juridique'),
        ('audience',      'Audience correctionnelle'),
        ('etat_civil',    'État civil / Casier judiciaire'),
        ('commercial',    'Litige commercial'),
        ('autre',         'Autre'),
    ]
    STATUTS = [
        ('pending',   'En attente'),
        ('confirmed', 'Confirmé'),
        ('rejected',  'Rejeté'),
        ('done',      'Effectué'),
        ('cancelled', 'Annulé'),
    ]

    reference  = models.CharField(max_length=30, unique=True)
    citoyen    = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                   related_name='rdv')
    tribunal   = models.ForeignKey(Tribunal, on_delete=models.CASCADE, related_name='rdv')
    service    = models.CharField(max_length=30, choices=SERVICES)
    date       = models.DateField()
    heure      = models.TimeField()
    motif      = models.TextField(blank=True)
    statut     = models.CharField(max_length=20, choices=STATUTS, default='pending')
    notes_admin = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Rendez-vous'
        ordering = ['-created_at']
        unique_together = [['tribunal','date','heure']]

    def __str__(self):
        return f'{self.reference} — {self.citoyen.nom} · {self.date} {self.heure}'

    def save(self, *args, **kwargs):
        if not self.reference:
            import random
            self.reference = f'RDV-{self.date.year}-{random.randint(10000, 99999)}'
        super().save(*args, **kwargs)
