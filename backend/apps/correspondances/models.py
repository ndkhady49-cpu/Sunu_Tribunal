"""
Courriers échangés entre un citoyen et le tribunal (messagerie de l'application).
Chaque courrier est aussi inscrit au registre officiel du greffe :
    entrant (citoyen → tribunal) = courrier ARRIVÉE (CA-…)
    sortant (tribunal → citoyen) = courrier DÉPART  (CD-…)
"""
from django.conf import settings
from django.db import models


class CourrierCitoyen(models.Model):
    SENS = [
        ('entrant', 'Envoyé par le citoyen'),
        ('sortant', 'Envoyé par le tribunal'),
    ]
    DESTINATAIRES = [
        ('greffe',         'Greffe'),
        ('administration', 'Administration du tribunal'),
        ('juge_dossier',   'Juge en charge du dossier'),
    ]

    citoyen      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                     related_name='courriers_citoyen')
    tribunal     = models.ForeignKey('rdv.Tribunal', null=True, blank=True, on_delete=models.SET_NULL,
                                     related_name='courriers_citoyens')
    sens         = models.CharField(max_length=10, choices=SENS)
    destinataire_service = models.CharField(max_length=20, choices=DESTINATAIRES, default='greffe')
    juge         = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
                                     related_name='courriers_juge', help_text='Juge destinataire (dossier assigné)')
    sujet        = models.CharField(max_length=300)
    message      = models.TextField()
    dossier_ref  = models.CharField(max_length=40, blank=True, help_text='PLT-… ou RDV-… du citoyen')
    piece_jointe = models.FileField(upload_to='correspondances/%Y/', blank=True)
    auteur       = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL,
                                     related_name='courriers_citoyen_ecrits')
    parent       = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL,
                                     related_name='reponses')
    lu           = models.BooleanField(default=False, help_text='Lu par le destinataire')
    lu_at        = models.DateTimeField(null=True, blank=True)
    courrier_registre = models.ForeignKey('registres.Courrier', null=True, blank=True,
                                          on_delete=models.SET_NULL, related_name='courriers_citoyens')
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at', '-id']
        verbose_name = 'Courrier citoyen'
        verbose_name_plural = 'Courriers citoyens'

    def __str__(self):
        return f'{self.get_sens_display()} · {self.citoyen.full_name} · {self.sujet}'
