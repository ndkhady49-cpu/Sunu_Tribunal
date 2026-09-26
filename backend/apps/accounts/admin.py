from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, STAFF_ROLES, SecuriteCompte


class SecuriteCompteInline(admin.StackedInline):
    """Débloquer un agent ou lui imposer un nouveau changement de mot de passe."""
    model = SecuriteCompte
    can_delete = False
    extra = 0
    max_num = 1
    verbose_name_plural = 'Sécurité du compte'
    fields = ['doit_changer_mdp', 'echecs_connexion', 'bloque_jusqua', 'derniere_connexion_reussie']
    readonly_fields = ['derniere_connexion_reussie']


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """
    Circuit de création : le superutilisateur crée ici le greffier en chef (rôle « admin ») avec son tribunal ;
    le greffier en chef crée ensuite les autres agents depuis la page Personnel de l'application.
    """
    list_display = ['email', 'nom', 'role', 'tribunal', 'is_active', 'date_joined']
    list_filter  = ['role', 'tribunal', 'is_verified', 'is_active']
    search_fields= ['email', 'nom']
    ordering     = ['-date_joined']
    inlines      = [SecuriteCompteInline]
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informations', {'fields': ('nom','prenom','telephone','cni','role','tribunal')}),
        ('Statut', {'fields': ('is_verified','is_active','is_staff','is_superuser')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'nom', 'prenom', 'telephone', 'role', 'tribunal', 'password1', 'password2'),
            'description': "Pour un compte du personnel, le mot de passe saisi est temporaire : "
                           "il devra être changé à la première connexion.",
        }),
    )

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        # Compte du personnel créé ici : mot de passe temporaire, à changer à la 1re connexion
        if not change and obj.role in STAFF_ROLES and not obj.is_superuser:
            SecuriteCompte.exiger_changement(obj)
