"""
Registres numériques du greffe — SunuTribunal
- Compteur      : numérotation officielle (annuelle, par registre et par juridiction)
- Courrier      : registre du courrier ARRIVÉE / DÉPART
- Transmission  : registre de transmission (circuit du courrier entre services)

Format des numéros :  CODE-NNNNN/AAAA/JURIDICTION
    ex. CA-00142/2026/TGIDK  → 142e courrier arrivé en 2026 au TGI Dakar
"""
import re
from django.conf import settings
from django.db import models, transaction
from django.utils import timezone


# ── Registres officiels et leurs codes ───────────────────
REGISTRES = {
    'CA':  'Registre du courrier arrivée',
    'CD':  'Registre du courrier départ',
    'RAC': 'Registre des affaires civiles',
    'RPL': 'Registre des plaintes',
    'RPQ': 'Registre du parquet',
}

# Mots ignorés pour fabriquer le code de la juridiction
_MOTS_IGNORES = {'de', 'du', 'des', 'la', 'le', 'les', 'et', 'd', 'l', 'hors', 'classe'}


def code_juridiction(tribunal):
    """
    Code court de la juridiction, utilisé dans les numéros.
    Priorité : code saisi dans l'admin Django > initiales du nom > valeur par défaut.
    """
    if tribunal is None:
        return getattr(settings, 'CODE_JURIDICTION', 'SNTRIB')
    param = ParametreJuridiction.objects.filter(tribunal=tribunal).first()
    if param and param.code:
        return param.code.upper()
    mots = re.findall(r"[A-Za-zÀ-ÿ]+", tribunal.nom)
    initiales = ''.join(
        m if m.isupper() and len(m) > 1 else m[0]
        for m in mots if m.lower() not in _MOTS_IGNORES
    )
    return (initiales.upper() or 'TRIB')[:8]


class ParametreJuridiction(models.Model):
    """Code officiel d'une juridiction (modifiable dans Django Admin)."""
    tribunal = models.OneToOneField('rdv.Tribunal', on_delete=models.CASCADE, related_name='parametre')
    code     = models.CharField(max_length=10, help_text='Ex : TIDK pour Tribunal d\'instance de Dakar')

    class Meta:
        verbose_name = 'Code de juridiction'
        verbose_name_plural = 'Codes de juridiction'

    def __str__(self):
        return f'{self.tribunal.nom} → {self.code}'


class Compteur(models.Model):
    """Dernier numéro d'ordre attribué, remis à zéro chaque année."""
    registre = models.CharField(max_length=5)
    annee    = models.PositiveIntegerField()
    tribunal = models.ForeignKey('rdv.Tribunal', null=True, blank=True, on_delete=models.CASCADE)
    dernier  = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = [['registre', 'annee', 'tribunal']]
        verbose_name = 'Compteur de registre'

    def __str__(self):
        return f'{self.registre} {self.annee} : {self.dernier}'

    @classmethod
    def prochain_numero(cls, registre, tribunal=None, date=None):
        """Attribue le numéro suivant de façon sûre (pas de doublon)."""
        if registre not in REGISTRES:
            raise ValueError(f'Registre inconnu : {registre}')
        annee = (date or timezone.localdate()).year
        with transaction.atomic():
            compteur, _ = cls.objects.select_for_update().get_or_create(
                registre=registre, annee=annee, tribunal=tribunal,
            )
            compteur.dernier += 1
            compteur.save(update_fields=['dernier'])
            ordre = compteur.dernier
        return f'{registre}-{ordre:05d}/{annee}/{code_juridiction(tribunal)}'


# ── Services du tribunal (circuit du courrier) ───────────
SERVICES = [
    ('bureau_courrier',  'Bureau courrier'),
    ('greffe_chef',      'Greffier en chef'),
    ('greffe_civil',     'Greffe civil'),
    ('greffe_penal',     'Greffe correctionnel / pénal'),
    ('parquet',          'Parquet'),
    ('presidence',       'Présidence'),
    ('cabinet_juge',     'Cabinet du juge'),
    ('accueil',          'Accueil et orientation'),
    ('archives',         'Archives'),
    ('secretariat',      'Secrétariat'),
    ('exterieur',        'Extérieur'),
]


class Courrier(models.Model):
    SENS = [
        ('arrivee', 'Arrivée'),
        ('depart',  'Départ'),
    ]
    REGISTRES_METIER = [
        ('civil',          'Affaires civiles'),
        ('plaintes',       'Plaintes'),
        ('parquet',        'Parquet'),
        ('administratif',  'Administratif'),
    ]
    PRIORITES = [
        ('normale', 'Normale'),
        ('urgente', 'Urgente'),
    ]
    STATUTS = [
        ('enregistre', 'Enregistré'),
        ('transmis',   'Transmis'),
        ('recu',       'Reçu par le service'),
        ('traite',     'Traité'),
        ('expedie',    'Expédié'),
        ('archive',    'Archivé'),
    ]

    numero           = models.CharField(max_length=40, unique=True, editable=False)
    sens             = models.CharField(max_length=10, choices=SENS)
    registre         = models.CharField(max_length=20, choices=REGISTRES_METIER, default='administratif')
    tribunal         = models.ForeignKey('rdv.Tribunal', null=True, blank=True, on_delete=models.SET_NULL,
                                         related_name='courriers_registre')

    date_courrier    = models.DateField(help_text='Date figurant sur le document')
    date_enregistrement = models.DateTimeField(default=timezone.now)
    correspondant    = models.CharField(max_length=200, help_text='Expéditeur (arrivée) ou destinataire (départ)')
    adresse_correspondant = models.CharField(max_length=300, blank=True)
    reference_externe = models.CharField(max_length=100, blank=True, help_text='Référence portée par le document')
    objet            = models.CharField(max_length=300)
    resume           = models.TextField(blank=True)
    nombre_pieces    = models.PositiveIntegerField(default=1)
    priorite         = models.CharField(max_length=10, choices=PRIORITES, default='normale')
    dossier_lie      = models.CharField(max_length=60, blank=True, help_text='N° de dossier ou de plainte lié')

    service_actuel   = models.CharField(max_length=30, choices=SERVICES, default='bureau_courrier')
    statut           = models.CharField(max_length=20, choices=STATUTS, default='enregistre')
    fichier          = models.FileField(upload_to='registres/courriers/%Y/', blank=True)

    enregistre_par   = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL,
                                         related_name='courriers_enregistres')
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Courrier (registre)'
        verbose_name_plural = 'Registre du courrier'
        ordering = ['-date_enregistrement', '-id']

    def __str__(self):
        return f'{self.numero} — {self.objet}'

    def save(self, *args, **kwargs):
        if not self.numero:
            code = 'CA' if self.sens == 'arrivee' else 'CD'
            self.numero = Compteur.prochain_numero(code, self.tribunal, self.date_enregistrement.date()
                                                   if self.date_enregistrement else None)
        super().save(*args, **kwargs)


class Transmission(models.Model):
    """Une ligne du registre de transmission : qui a fait quoi, quand, vers quel service."""
    ACTIONS = [
        ('enregistrement', 'Enregistrement'),
        ('transmission',   'Transmission'),
        ('reception',      'Accusé de réception'),
        ('traitement',     'Traitement'),
        ('expedition',     'Expédition'),
        ('archivage',      'Archivage'),
    ]

    courrier            = models.ForeignKey(Courrier, on_delete=models.CASCADE, related_name='transmissions')
    action              = models.CharField(max_length=20, choices=ACTIONS)
    service_origine     = models.CharField(max_length=30, choices=SERVICES, blank=True)
    service_destination = models.CharField(max_length=30, choices=SERVICES, blank=True)
    agent               = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    commentaire         = models.TextField(blank=True)
    date                = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = 'Transmission'
        verbose_name_plural = 'Registre de transmission'
        ordering = ['date', 'id']

    def __str__(self):
        return f'{self.courrier.numero} · {self.get_action_display()}'
