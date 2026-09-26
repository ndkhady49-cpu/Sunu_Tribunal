from rest_framework.exceptions import Throttled
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsStaffRole
from .services import (AssistantIndisponible, MESSAGE_INDISPONIBLE, MAX_CARACTERES,
                       ask_chatbot, ask_assistant_greffe, generate_official_document)
from .throttles import AssistantParIP, AssistantGreffe, GenerationDocument


class _BaseAssistant(APIView):
    """Réponses neutres : jamais de détail technique, message clair en cas d'abus."""

    def throttled(self, request, wait):
        secondes = int(wait or 60)
        raise Throttled(wait, detail=f'Vous avez envoyé trop de demandes à l\'assistant. '
                                     f'Réessayez dans {secondes} seconde{"s" if secondes > 1 else ""}.')

    def indisponible(self):
        return Response({'error': MESSAGE_INDISPONIBLE}, status=503)

    def question(self, request):
        return str(request.data.get('message', '')).strip()[:MAX_CARACTERES]


class ChatbotView(_BaseAssistant):
    """
    POST /api/chatbot/ask/  {message, historique: [{role, content}, ...]}  → {reply}
    Assistant juridique des citoyens, accessible sans connexion.
    """
    permission_classes = [AllowAny]
    # Pas d'authentification JWT : un jeton expiré ne doit pas bloquer l'assistant (erreur 401)
    authentication_classes = []
    throttle_classes = [AssistantParIP]

    def post(self, request):
        message = self.question(request)
        if not message:
            return Response({'error': 'Écrivez votre question.'}, status=400)
        try:
            return Response({'reply': ask_chatbot(message, request.data.get('historique'))})
        except AssistantIndisponible:
            return self.indisponible()


class AssistantGreffeView(_BaseAssistant):
    """
    POST /api/chatbot/admin/  {message, historique}  → {reply}
    Assistant du greffe : réservé au personnel du tribunal (jeton requis).
    """
    permission_classes = [IsStaffRole]
    throttle_classes = [AssistantGreffe]

    def post(self, request):
        message = self.question(request)
        if not message:
            return Response({'error': 'Écrivez votre demande.'}, status=400)
        try:
            return Response({'reply': ask_assistant_greffe(message, request.data.get('historique'))})
        except AssistantIndisponible:
            return self.indisponible()


class GenerateDocumentView(_BaseAssistant):
    """Rédaction d'un courrier officiel (module Courriers) — personnel du tribunal."""
    permission_classes = [IsStaffRole]
    throttle_classes = [GenerationDocument]

    def post(self, request):
        destinataire = str(request.data.get('destinataire', '')).strip()[:200]
        motif = str(request.data.get('motif', '')).strip()[:300]
        decision = str(request.data.get('decision', '')).strip()[:MAX_CARACTERES]
        if not destinataire or not motif:
            return Response({'error': 'Destinataire et motif sont requis.'}, status=400)
        try:
            return Response({'document': generate_official_document(destinataire, motif, decision)})
        except AssistantIndisponible:
            return self.indisponible()
