"""
Authentification JWT avec contrôle du mot de passe temporaire.
Tant qu'un compte doit changer son mot de passe, l'API ne lui répond que pour :
  - consulter son profil (GET /api/auth/me/)
  - changer son mot de passe (POST /api/auth/changer-mot-de-passe/)
Le blocage est fait côté serveur : un jeton obtenu avec le mot de passe temporaire
ne donne accès à aucune donnée.
"""
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import doit_changer_mdp

ROUTES_AUTORISEES = {
    ('GET',  '/api/auth/me/'),
    ('POST', '/api/auth/changer-mot-de-passe/'),
}


class MotDePasseAChanger(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = 'mot_de_passe_a_changer'
    # Le code figure dans la réponse JSON : le frontend s'en sert pour ouvrir la page « Définir votre mot de passe »
    default_detail = {'detail': 'Vous devez définir votre mot de passe avant de continuer.',
                      'code': 'mot_de_passe_a_changer'}


class JWTAuthentificationSecurisee(JWTAuthentication):
    def authenticate(self, request):
        resultat = super().authenticate(request)
        if resultat is None:
            return None
        user, jeton = resultat
        if (request.method, request.path) not in ROUTES_AUTORISEES and doit_changer_mdp(user):
            raise MotDePasseAChanger()
        return user, jeton
