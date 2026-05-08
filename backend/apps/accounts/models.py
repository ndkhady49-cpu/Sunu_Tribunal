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


class User(AbstractBaseUser, PermissionsMixin):
    ROLES = [
        ('citoyen', 'Citoyen'),
        ('admin',   'Greffier / Admin Tribunal'),
        ('juge',    'Juge'),
        ('avocat',  'Avocat'),
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
    def full_name(self):
        return f'{self.prenom} {self.nom}'.strip()
