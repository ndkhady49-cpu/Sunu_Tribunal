from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['email', 'nom', 'role', 'is_verified', 'date_joined']
    list_filter  = ['role', 'is_verified', 'is_active']
    search_fields= ['email', 'nom']
    ordering     = ['-date_joined']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informations', {'fields': ('nom','prenom','telephone','cni','role','tribunal')}),
        ('Statut', {'fields': ('is_verified','is_active','is_staff','is_superuser')}),
    )
    add_fieldsets = (
        (None, {'fields': ('email','nom','role','password1','password2')}),
    )
