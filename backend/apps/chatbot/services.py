from groq import Groq
from django.conf import settings

# Configuration du client Groq
GROQ_API_KEY = getattr(settings, 'GROQ_API_KEY', None)
if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY not found in settings")

SYSTEM_PROMPT = """Tu es l'Assistant Juridique Officiel de Sunu Tribunal, la plateforme en ligne du tribunal du Sénégal.
Ton rôle est d'informer les citoyens sur :
1. Les procédures juridiques
2. Les documents à fournir
3. Le suivi des dossiers
4. Les droits des citoyens

Tes réponses doivent être :
- Claires, professionnelles et faciles à comprendre.
- Adaptées au contexte juridique sénégalais.
- Brèves (ne dépasse pas 3 ou 4 paragraphes courts).
Si l'utilisateur pose une question hors du cadre de la justice ou du tribunal, informe-le poliment que tu ne peux répondre qu'aux requêtes juridiques.
"""

def ask_chatbot(message: str) -> str:
    if not GROQ_API_KEY:
        return "Erreur : clé API Groq non configurée."
    try:
        client = Groq(api_key=GROQ_API_KEY)
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": message}
            ],
            temperature=0.7,
            max_tokens=1024,
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"Désolé, une erreur s'est produite lors de la connexion à l'assistant. ({str(e)})"

def generate_official_document(destinataire: str, motif: str, decision: str) -> str:
    if not GROQ_API_KEY:
        return "Erreur : clé API Groq non configurée."
    try:
        client = Groq(api_key=GROQ_API_KEY)
        prompt = f"""Rédige un courrier officiel administratif pour le tribunal.
Destinataire : {destinataire}
Motif : {motif}
Décision/Contenu : {decision}

Le ton doit être très formel, objectif, en français. Structure le courrier avec l'en-tête (République du Sénégal, Ministère de la Justice), le corps et une formule de politesse finale."""
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=2048,
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"Erreur de génération : {str(e)}"
