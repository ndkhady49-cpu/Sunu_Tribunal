"""
Archivage numérique des dossiers — SunuTribunal
Réponse au besoin n°1 exprimé par le greffe : scanner les fonds de dossier,
les retrouver vite, et savoir où se trouve l'original papier.

Numéro : RAC-00012/2026/TGIDK  (Registre des affaires civiles)
         RPL-00045/2026/TGIDK  (Registre des plaintes)
         RPQ-00007/2026/TGIDK  (Registre du parquet)
"""
import os
from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.registres.models import Compteur


class DossierArchive(models.Model):
    REGISTRES = [
        ('civil',    'Affaires civiles'),
        ('plaintes', 'Plaintes'),
        ('parquet',  'Parquet'),
    ]
    CODES_REGISTRE = {'civil': 'RAC', 'plaintes': 'RPL', 'parquet': 'RPQ'}
    CATEGORIES = [
        ('civil',       'Civil'),
        ('penal',       'Pénal'),
        ('commercial',  'Commercial'),
        ('social',      'Social'),
        ('foncier',     'Foncier'),
        ('etat_civil',  'État civil'),
        ('autre',       'Autre'),
    ]
    STATUTS = [
        ('actif',   'En cours'),
        ('clos',    'Clôturé'),
        ('archive', 'Archivé'),
    ]

    numero        = models.CharField(max_length=40, unique=True, editable=False)
    registre      = models.CharField(max_length=20, choices=REGISTRES)
    categorie     = models.CharField(max_length=20, choices=CATEGORIES, default='civil')
    tribunal      = models.ForeignKey('rdv.Tribunal', null=True, blank=True, on_delete=models.SET_NULL,
                                      related_name='dossiers_archives')

    intitule      = models.CharField(max_length=300, help_text='Objet de l\'affaire')
    demandeur     = models.CharField(max_length=200, blank=True, help_text='Demandeur / plaignant')
    defendeur     = models.CharField(max_length=200, blank=True, help_text='Défendeur / mis en cause')
    juge          = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                                      on_delete=models.SET_NULL, related_name='dossiers_archives_juge')
    plainte       = models.ForeignKey('plaintes.Plainte', null=True, blank=True,
                                      on_delete=models.SET_NULL, related_name='dossiers_archives')

    date_ouverture = models.DateField(default=timezone.localdate)
    date_cloture   = models.DateField(null=True, blank=True)
    statut         = models.CharField(max_length=10, choices=STATUTS, default='actif')

    # Emplacement physique de l'original papier
    salle    = models.CharField(max_length=60, blank=True)
    armoire  = models.CharField(max_length=60, blank=True)
    etagere  = models.CharField(max_length=60, blank=True)
    boite    = models.CharField(max_length=60, blank=True, help_text='Boîte / carton d\'archives')

    mots_cles    = models.CharField(max_length=300, blank=True)
    observations = models.TextField(blank=True)

    cree_par   = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL,
                                   related_name='dossiers_archives_crees')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Dossier archivé'
        verbose_name_plural = 'Dossiers (archivage numérique)'
        ordering = ['-date_ouverture', '-id']

    def __str__(self):
        return f'{self.numero} — {self.intitule}'

    @property
    def emplacement(self):
        morceaux = [('Salle', self.salle), ('Armoire', self.armoire),
                    ('Étagère', self.etagere), ('Boîte', self.boite)]
        return ' · '.join(f'{k} {v}' for k, v in morceaux if v)

    def save(self, *args, **kwargs):
        if not self.numero:
            self.numero = Compteur.prochain_numero(
                self.CODES_REGISTRE[self.registre], self.tribunal, self.date_ouverture,
            )
        super().save(*args, **kwargs)


class PieceArchive(models.Model):
    TYPES = [
        ('requete',   'Requête / assignation'),
        ('plainte',   'Plainte'),
        ('pv',        'Procès-verbal'),
        ('jugement',  'Jugement / décision'),
        ('identite',  "Pièce d'identité"),
        ('courrier',  'Courrier'),
        ('preuve',    'Pièce justificative'),
        ('autre',     'Autre'),
    ]

    dossier    = models.ForeignKey(DossierArchive, on_delete=models.CASCADE, related_name='pieces')
    fichier    = models.FileField(upload_to='archives/%Y/')
    nom        = models.CharField(max_length=200)
    type_piece = models.CharField(max_length=20, choices=TYPES, default='autre')
    taille     = models.PositiveIntegerField(default=0)
    ajoute_par = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Pièce scannée'
        ordering = ['created_at']

    def __str__(self):
        return self.nom

    @property
    def extension(self):
        return os.path.splitext(self.fichier.name)[1].lower().lstrip('.')


class HistoriqueDossier(models.Model):
    dossier = models.ForeignKey(DossierArchive, on_delete=models.CASCADE, related_name='historique')
    action  = models.CharField(max_length=100)
    detail  = models.TextField(blank=True)
    agent   = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    date    = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['date', 'id']

    def __str__(self):
        return f'{self.dossier.numero} · {self.action}'
