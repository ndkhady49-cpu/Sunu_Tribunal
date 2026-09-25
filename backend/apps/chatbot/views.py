from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from apps.accounts.permissions import IsStaffRole
from .services import ask_chatbot, generate_official_document

class ChatbotView(APIView):
    # L'assistant juridique est accessible à tous (ou IsAuthenticated selon le besoin)
    permission_classes = [AllowAny]
    # Pas d'authentification JWT : un token expiré ne doit pas bloquer l'assistant (erreur 401)
    authentication_classes = []

    def post(self, request):
        message = str(request.data.get('message', '')).strip()[:2000]
        if not message:
            return Response({'error': 'Message est requis'}, status=400)
        
        reponse_ia = ask_chatbot(message)
        return Response({'reply': reponse_ia})

class GenerateDocumentView(APIView):
    # Réservé au personnel du tribunal (admin, juge, greffier)
    permission_classes = [IsStaffRole]

    def post(self, request):
        destinataire = request.data.get('destinataire', '')
        motif = request.data.get('motif', '')
        decision = request.data.get('decision', '')
        
        if not destinataire or not motif:
            return Response({'error': 'Destinataire et motif sont requis'}, status=400)
            
        document = generate_official_document(destinataire, motif, decision)
        return Response({'document': document})
