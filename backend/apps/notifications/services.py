"""
SunuTribunal — Notifications croisées citoyen ↔ tribunal
--------------------------------------------------------
Chaque action d'un côté crée une Notification (visible dans l'application)
pour l'autre côté, et tente un push Firebase si l'utilisateur a un token.
"""
from django.db.models import Q

from .models import Notification
from .push import send_push


def notifier(user, type_notif, titre, corps, lien=''):
    """Notifie un utilisateur précis (citoyen ou agent)."""
    if user is None:
        return None
    notif = Notification.objects.create(
        destinataire=user, type_notif=type_notif, titre=titre[:200], corps=corps, lien=lien[:200],
    )
    if user.fcm_token:
        send_push(user.fcm_token, titre, corps, {'type': type_notif, 'lien': lien})
    return notif


def personnel(tribunal, roles):
    """
    Agents actifs ayant l'un de ces rôles pour ce tribunal.
    Un agent sans tribunal a une compétence générale : il est toujours inclus.
    """
    from apps.accounts.models import User
    qs = User.objects.filter(role__in=roles, is_active=True)
    if tribunal is not None:
        qs = qs.filter(Q(tribunal=tribunal) | Q(tribunal__isnull=True))
    return qs


def notifier_personnel(tribunal, roles, type_notif, titre, corps, lien='', exclure=None):
    """Notifie tout le personnel concerné ; `exclure` = l'auteur de l'action."""
    agents = personnel(tribunal, roles)
    if exclure is not None:
        agents = agents.exclude(pk=exclure.pk)
    return [notifier(a, type_notif, titre, corps, lien) for a in agents]
