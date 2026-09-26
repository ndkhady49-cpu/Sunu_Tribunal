from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError('Email requis')
        email = self.normalize_email(email)
        user  = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault('is_staff',     True)
        extra.setdefault('is_superuser', True)
        extra.setdefault('role',         'admin')
        return self.create_user(email, password, **extra)


# Rôles du personnel judiciaire (accès à l'espace Tribunal)
STAFF_ROLES = ('admin', 'juge', 'greffier', 'accueil', 'courrier')


class User(AbstractBaseUser, PermissionsMixin):
    ROLES = [
        ('citoyen',  'Citoyen'),
        ('admin',    'Greffier en chef / Admin Tribunal'),
        ('juge',     'Juge'),
        ('greffier', 'Greffier'),
        ('accueil',  "Agent d'accueil et d'orientation"),
        ('courrier', 'Agent du bureau courrier'),
        ('avocat',   'Avocat'),
    ]

    email       = models.EmailField(unique=True)
    nom         = models.CharField(max_length=150)
    prenom      = models.CharField(max_length=150, blank=True)
    telephone   = models.CharField(max_length=20, blank=True)
    cni         = models.CharField(max_length=20, blank=True, verbose_name='N° CNI')
    role        = models.CharField(max_length=20, choices=ROLES, default='citoyen')
    tribunal    = models.ForeignKey('rdv.Tribunal', null=True, blank=True, on_delete=models.SET_NULL)
    fcm_token   = models.CharField(max_length=512, blank=True, help_text='Firebase push token')
    is_verified = models.BooleanField(default=False)
    is_active   = models.BooleanField(default=True)
    is_staff    = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['nom']
    objects = UserManager()

    class Meta:
        verbose_name = 'Utilisateur'
        ordering = ['-date_joined']

    def __str__(self):
        return f'{self.nom} ({self.role})'

    @property
    def is_staff_role(self):
        """True si l'utilisateur fait partie du personnel judiciaire."""
        return self.role in STAFF_ROLES or self.is_superuser

    @property
    def full_name(self):
        return f'{self.prenom} {self.nom}'.strip()


class SecuriteCompte(models.Model):
    """
    Sécurité de connexion d'un compte (nouvelle table : la table accounts_user n'est pas modifiée).
    - doit_changer_mdp : mot de passe temporaire à remplacer à la prochaine connexion
      (posé pour les comptes du personnel créés par Django Admin ou par la page Personnel)
    - echecs_connexion / bloque_jusqua : blocage 15 minutes après 5 échecs
    """
    user = models.OneToOneField('accounts.User', on_delete=models.CASCADE, related_name='securite')
    doit_changer_mdp = models.BooleanField(default=False, verbose_name='Doit changer son mot de passe')
    derniere_connexion_reussie = models.DateTimeField(null=True, blank=True)
    echecs_connexion = models.PositiveIntegerField(default=0)
    bloque_jusqua = models.DateTimeField(null=True, blank=True, verbose_name="Bloqué jusqu'à")

    class Meta:
        verbose_name = 'Sécurité du compte'
        verbose_name_plural = 'Sécurité des comptes'

    def __str__(self):
        return f'Sécurité · {self.user.email}'

    @classmethod
    def de(cls, user):
        return cls.objects.get_or_create(user=user)[0]

    @classmethod
    def exiger_changement(cls, user):
        """Le mot de passe actuel est temporaire : il devra être changé à la prochaine connexion."""
        cls.objects.update_or_create(user=user, defaults={'doit_changer_mdp': True})

    @property
    def est_bloque(self):
        return bool(self.bloque_jusqua and self.bloque_jusqua > timezone.now())


def doit_changer_mdp(user):
    """True si l'utilisateur doit remplacer son mot de passe temporaire (ligne absente = non)."""
    return SecuriteCompte.objects.filter(user=user, doit_changer_mdp=True).exists()
