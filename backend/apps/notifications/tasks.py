"""
SunuTribunal — Celery Async Tasks
Handles notifications, SMS, and background processing
"""
from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def send_rdv_confirmation_task(self, rdv_id: int):
    """Send push + SMS when RDV is confirmed"""
    try:
        from apps.rdv.models import RendezVous
        from apps.notifications.push import notify_rdv_confirmed
        rdv = RendezVous.objects.get(id=rdv_id)
        notify_rdv_confirmed(rdv)
        logger.info(f'RDV confirmation sent for {rdv.reference}')
    except Exception as e:
        logger.error(f'Task failed: {e}')
        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_sos_notifications_task(self, alerte_id: int):
    """Send urgent SOS alerts to all admins + police"""
    try:
        from apps.alertes.models import AlerteSOS
        from apps.notifications.push import notify_admin_sos
        alerte = AlerteSOS.objects.get(id=alerte_id)
        notify_admin_sos(alerte)
        # Also send SMS via Twilio
        send_sos_sms.delay(alerte_id)
        logger.info(f'SOS notifications sent for {alerte.reference}')
    except Exception as e:
        logger.error(f'SOS task failed: {e}')
        raise self.retry(exc=e, countdown=30)


@shared_task
def send_sos_sms(alerte_id: int):
    """Send SMS to police via Twilio for SOS alerts"""
    try:
        from django.conf import settings
        from apps.alertes.models import AlerteSOS

        alerte = AlerteSOS.objects.get(id=alerte_id)
        message = (
            f'ALERTE SOS SunuTribunal\n'
            f'Ref: {alerte.reference}\n'
            f'Citoyen: {alerte.citoyen.nom}\n'
            f'Type: {alerte.type_alerte}\n'
            f'GPS: {alerte.latitude},{alerte.longitude}\n'
            f'Adresse: {alerte.adresse}'
        )

        if not settings.TWILIO_ACCOUNT_SID:
            logger.info(f'[SMS MOCK] {message}')
            return

        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(
            body=message,
            from_=settings.TWILIO_FROM_NUMBER,
            to='+221338693300',  # Police Nationale Dakar
        )
        logger.info(f'SMS sent for SOS {alerte.reference}')
    except Exception as e:
        logger.error(f'SMS failed: {e}')


@shared_task
def send_plainte_status_update(plainte_id: int, message: str):
    """Notify citoyen when plainte status changes"""
    try:
        from apps.plaintes.models import Plainte
        from apps.notifications.push import notify_plainte_updated
        plainte = Plainte.objects.get(id=plainte_id)
        notify_plainte_updated(plainte, message)
    except Exception as e:
        logger.error(f'Plainte notification failed: {e}')


@shared_task
def cleanup_old_notifications():
    """Periodic task: delete notifications older than 90 days"""
    from django.utils import timezone
    from datetime import timedelta
    from apps.notifications.models import Notification
    cutoff = timezone.now() - timedelta(days=90)
    deleted, _ = Notification.objects.filter(created_at__lt=cutoff, lu=True).delete()
    logger.info(f'Cleaned up {deleted} old notifications')
