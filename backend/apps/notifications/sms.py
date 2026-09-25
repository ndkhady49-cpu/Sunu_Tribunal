"""
SunuTribunal — Envoi de SMS via Twilio (envoi réel)
---------------------------------------------------
Configuration dans backend/.env :
    TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    TWILIO_FROM_NUMBER=+1xxxxxxxxxx      (numéro Twilio acheté / d'essai)

Chaque tentative est enregistrée dans le journal (modèle SMSLog),
même en cas d'échec : l'action métier (valider un RDV…) n'est jamais bloquée.
"""
import logging
import re
import unicodedata

from django.conf import settings

logger = logging.getLogger(__name__)


def normaliser_telephone(numero: str) -> str | None:
    """
    Convertit un numéro sénégalais au format international E.164.
      77 123 45 67      → +221771234567
      00221771234567    → +221771234567
      221771234567      → +221771234567
      +33612345678      → +33612345678  (numéros étrangers acceptés)
    Retourne None si le numéro est invalide.
    """
    if not numero:
        return None
    n = re.sub(r'[\s.\-()/]', '', str(numero))
    if n.startswith('00'):
        n = '+' + n[2:]
    if re.fullmatch(r'[73]\d{8}', n):          # 9 chiffres sénégalais (mobile 7x, fixe 33)
        n = '+221' + n
    elif re.fullmatch(r'221[73]\d{8}', n):
        n = '+' + n
    if re.fullmatch(r'\+\d{8,15}', n):
        return n
    return None


def sans_accents(texte: str) -> str:
    """Les SMS sans accents tiennent en 160 caractères (au lieu de 70) : moins chers."""
    t = unicodedata.normalize('NFKD', texte)
    return ''.join(c for c in t if not unicodedata.combining(c)).replace('’', "'")


def twilio_configure() -> bool:
    return bool(settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_FROM_NUMBER)


def envoyer_sms(telephone: str, message: str, destinataire=None, objet_ref: str = ''):
    """
    Envoie un SMS et l'inscrit au journal.
    Retourne l'objet SMSLog (champ .statut : envoye / echec / non_configure / numero_invalide).
    """
    from .models import SMSLog

    message = sans_accents(message)[:600]
    numero = normaliser_telephone(telephone)
    log = SMSLog(destinataire=destinataire, telephone=numero or (telephone or ''),
                 message=message, objet_ref=objet_ref)

    if not numero:
        log.statut = 'numero_invalide'
        log.erreur = 'Numéro de téléphone absent ou invalide.'
    elif not twilio_configure():
        log.statut = 'non_configure'
        log.erreur = 'TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER manquants dans .env'
    else:
        try:
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            msg = client.messages.create(body=message, from_=settings.TWILIO_FROM_NUMBER, to=numero)
            log.statut = 'envoye'
            log.sid = getattr(msg, 'sid', '') or ''
        except Exception as e:  # erreur réseau, numéro non vérifié (compte d'essai), crédit épuisé…
            log.statut = 'echec'
            log.erreur = str(e)[:1000]
            logger.error('SMS Twilio en échec vers %s : %s', numero, e)

    log.save()
    return log
