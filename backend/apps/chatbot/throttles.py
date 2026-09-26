"""Limites d'usage des assistants (taux dans REST_FRAMEWORK.DEFAULT_THROTTLE_RATES)."""
from rest_framework.throttling import SimpleRateThrottle, UserRateThrottle


class AssistantParIP(SimpleRateThrottle):
    """Assistant citoyen (public) : 20 questions / minute par adresse IP."""
    scope = 'assistant_ip'

    def get_cache_key(self, request, view):
        return self.cache_format % {'scope': self.scope, 'ident': self.get_ident(request)}


class AssistantGreffe(UserRateThrottle):
    """Assistant du greffe : 20 questions / minute par agent."""
    scope = 'assistant_greffe'


class GenerationDocument(UserRateThrottle):
    """Rédaction de courriers officiels : 30 / heure par agent."""
    scope = 'generation_document'
