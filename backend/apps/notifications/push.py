"""
SunuTribunal — Firebase Push Notification Service
Sends push notifications to citoyen and admin apps
"""
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def get_firebase_app():
    """Initialize Firebase Admin SDK (lazy)"""
    try:
        import firebase_admin
        from firebase_admin import credentials
        if not firebase_admin._apps:
            cred_path = settings.FIREBASE_CREDENTIALS
            if cred_path:
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
        return firebase_admin
    except Exception as e:
        logger.warning(f'Firebase not configured: {e}')
        return None


def send_push(token: str, title: str, body: str, data: dict = None):
    """
    Send a Firebase Cloud Messaging push notification.
    Falls back gracefully if Firebase is not configured.
    """
    if not token:
        logger.info('No FCM token — skipping push notification')
        return False

    firebase = get_firebase_app()
    if not firebase:
        logger.info(f'[PUSH MOCK] To:{token[:20]}... Title:{title} Body:{body}')
        return True

    try:
        from firebase_admin import messaging
        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data=data or {},
            token=token,
            android=messaging.AndroidConfig(priority='high'),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(sound='default', badge=1)
                )
            ),
        )
        response = messaging.send(message)
        logger.info(f'Push sent: {response}')
        return True
    except Exception as e:
        logger.error(f'Push notification failed: {e}')
        return False


def notify_rdv_confirmed(rdv):
    """Notify citoyen when their RDV is confirmed by admin"""
    token = rdv.citoyen.fcm_token
    send_push(
        token=token,
        title='Rendez-vous confirme !',
        body=f'Votre RDV {rdv.reference} est confirme pour le {rdv.date} a {rdv.heure}.',
        data={'type': 'rdv_confirmed', 'rdv_id': str(rdv.id)},
    )


def notify_plainte_updated(plainte, message: str):
    """Notify citoyen when their plainte status changes"""
    token = plainte.plaignant.fcm_token
    send_push(
        token=token,
        title='Dossier mis a jour',
        body=message or f'Votre plainte {plainte.reference} a ete mise a jour.',
        data={'type': 'plainte_update', 'plainte_id': str(plainte.id)},
    )


def notify_admin_new_rdv(rdv):
    """Notify admin when a new RDV request arrives"""
    from apps.accounts.models import User
    admins = User.objects.filter(
        role='admin',
        tribunal=rdv.tribunal,
        fcm_token__isnull=False
    ).exclude(fcm_token='')

    for admin in admins:
        send_push(
            token=admin.fcm_token,
            title='Nouvelle demande RDV',
            body=f'{rdv.citoyen.nom} demande un RDV le {rdv.date} a {rdv.heure}.',
            data={'type': 'new_rdv', 'rdv_id': str(rdv.id)},
        )


def notify_admin_sos(alerte):
    """Notify ALL admins of a SOS alert — high priority"""
    from apps.accounts.models import User
    admins = User.objects.filter(
        role__in=['admin', 'juge'],
        fcm_token__isnull=False
    ).exclude(fcm_token='')

    for admin in admins:
        send_push(
            token=admin.fcm_token,
            title=f'ALERTE SOS — {alerte.type_alerte.upper()}',
            body=f'{alerte.citoyen.nom} signale une urgence a {alerte.adresse or "localisation GPS transmise"}.',
            data={'type': 'sos_alert', 'alerte_id': str(alerte.id), 'priority': 'high'},
        )
