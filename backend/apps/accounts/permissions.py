"""
Permissions par rôle — SunuTribunal
"""
from rest_framework.permissions import BasePermission

from .models import STAFF_ROLES


class IsStaffRole(BasePermission):
    """Personnel judiciaire : greffier en chef (admin), juge, greffier."""
    message = "Action réservée au personnel du tribunal."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated
            and (user.role in STAFF_ROLES or user.is_superuser)
        )


class IsChefGreffe(BasePermission):
    """Greffier en chef (role 'admin') ou superutilisateur Django."""
    message = "Action réservée au greffier en chef."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated
            and (user.role == 'admin' or user.is_superuser)
        )
