"""Plaintes — Model, Serializer, Views, URLs"""
# ── models.py content ───────────────────────────────────────────
from django.db import models
from django.conf import settings


class Plainte(models.Model):
    NATURES = [
        ('agression',   'Agression physique'),
        ('escroquerie', 'Escroquerie / Fraude'),
        ('foncier',     'Litige foncier'),
        ('violence',    'Violence domestique'),
        ('cyber',       'Cybercriminalité'),
        ('autre',       'Autre'),
    ]
    STATUTS = [
        ('pending',   'En attente'),
        ('progress',  'En instruction'),
        ('urgent',    'Urgent'),
        ('done',      'Traité'),
        ('rejected',  'Rejeté'),
        ('archived',  'Archivé'),
    ]

    reference   = models.CharField(max_length=30, unique=True)
    plaignant   = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                    related_name='plaintes')
    tribunal    = models.ForeignKey('rdv.Tribunal', on_delete=models.CASCADE,
                                    related_name='plaintes')
    nature      = models.CharField(max_length=30, choices=NATURES)
    description = models.TextField()
    statut      = models.CharField(max_length=20, choices=STATUTS, default='pending')
    juge        = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                                    on_delete=models.SET_NULL, related_name='dossiers')
    notes_greffe = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Plainte'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.reference} — {self.plaignant.nom}'

    def save(self, *args, **kwargs):
        if not self.reference:
            import random
            from django.utils import timezone
            self.reference = f'PLT-{timezone.now().year}-{random.randint(10000, 99999)}'
        super().save(*args, **kwargs)


class PieceJointe(models.Model):
    plainte = models.ForeignKey(Plainte, on_delete=models.CASCADE, related_name='pieces')
    fichier = models.FileField(upload_to='plaintes/pieces/')
    nom     = models.CharField(max_length=200)
    taille  = models.IntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nom


class MessageDossier(models.Model):
    plainte    = models.ForeignKey(Plainte, on_delete=models.CASCADE, related_name='messages')
    auteur     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    contenu    = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
