from django.db import models
from django.conf import settings


class AlerteSOS(models.Model):
    TYPES = [
        ('agression', 'Agression physique'),
        ('vol',       'Vol / Braquage'),
        ('danger',    'Danger immédiat'),
        ('autre',     'Autre urgence'),
    ]
    STATUTS = [
        ('active',   'Active'),
        ('progress', 'Prise en charge'),
        ('resolved', 'Résolue'),
        ('archived', 'Archivée'),
    ]

    reference   = models.CharField(max_length=30, unique=True)
    citoyen     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                    related_name='alertes')
    type_alerte = models.CharField(max_length=20, choices=TYPES, default='danger')
    description = models.TextField(blank=True)
    latitude    = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude   = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    adresse     = models.CharField(max_length=300, blank=True)
    statut      = models.CharField(max_length=20, choices=STATUTS, default='active')
    pris_en_charge_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='alertes_prises'
    )
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Alerte SOS'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.reference} — {self.citoyen.nom}'

    def save(self, *args, **kwargs):
        if not self.reference:
            import random
            from django.utils import timezone
            self.reference = f'SOS-{timezone.now().year}-{random.randint(10000,99999)}'
        super().save(*args, **kwargs)
