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
        ('depot_dossier', 'Dépôt de dossier'),
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


# ─────────────────────────────────────────────────────────
# Orientation des usagers (besoin exprimé par le service d'accueil)
# ─────────────────────────────────────────────────────────

# Pièces à apporter selon le service (affichées au citoyen et envoyées par SMS)
PIECES_A_FOURNIR = {
    'depot_dossier': ["Carte nationale d'identité (CNI)", 'Dossier complet en 2 exemplaires',
                      'Copie des pièces justificatives', 'Timbres fiscaux si requis'],
    'civil':         ["Carte nationale d'identité (CNI)", 'Requête ou assignation', 'Pièces justificatives'],
    'consultation':  ["Carte nationale d'identité (CNI)", 'Tout document lié à votre question'],
    'audience':      ["Carte nationale d'identité (CNI)", 'Convocation', 'Pièces du dossier'],
    'etat_civil':    ["Carte nationale d'identité (CNI)", 'Extrait de naissance', 'Timbre fiscal'],
    'commercial':    ["Carte nationale d'identité (CNI)", 'Registre de commerce (RCCM)', 'Contrats et factures'],
    'autre':         ["Carte nationale d'identité (CNI)"],
}

# Bureau par défaut vers lequel l'ASP oriente le citoyen (modifiable dans Django Admin)
BUREAUX_DEFAUT = {
    'depot_dossier': ('Bureau courrier / Greffe', "Rez-de-chaussée, à droite de l'accueil"),
    'civil':         ('Greffe civil',             'Rez-de-chaussée'),
    'consultation':  ("Service d'accueil et d'orientation", "Hall d'entrée"),
    'audience':      ("Salle d'audience",         'Se présenter au greffier d\'audience'),
    'etat_civil':    ('Bureau de l\'état civil / casier judiciaire', 'Rez-de-chaussée'),
    'commercial':    ('Greffe du tribunal de commerce', '1er étage'),
    'autre':         ("Service d'accueil et d'orientation", "Hall d'entrée"),
}


class BureauService(models.Model):
    """Bureau d'orientation par service et par tribunal (paramétrable par le greffe)."""
    tribunal     = models.ForeignKey(Tribunal, on_delete=models.CASCADE, related_name='bureaux')
    service      = models.CharField(max_length=30, choices=RendezVous.SERVICES)
    bureau       = models.CharField(max_length=120, help_text='Ex : Bureau 4 — Greffe civil')
    localisation = models.CharField(max_length=200, blank=True, help_text='Ex : 1er étage, aile gauche')

    class Meta:
        unique_together = [['tribunal', 'service']]
        verbose_name = "Bureau d'orientation"
        verbose_name_plural = "Bureaux d'orientation"

    def __str__(self):
        return f'{self.tribunal.nom} · {self.get_service_display()} → {self.bureau}'


def bureau_pour(rdv_or_service, tribunal=None):
    """Retourne (bureau, localisation) pour un RDV ou un service donné."""
    if isinstance(rdv_or_service, RendezVous):
        service, tribunal = rdv_or_service.service, rdv_or_service.tribunal
    else:
        service = rdv_or_service
    if tribunal is not None:
        b = BureauService.objects.filter(tribunal=tribunal, service=service).first()
        if b:
            return b.bureau, b.localisation
    return BUREAUX_DEFAUT.get(service, BUREAUX_DEFAUT['autre'])
