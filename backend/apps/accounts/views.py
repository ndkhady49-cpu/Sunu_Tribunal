from rest_framework import generics, status, viewsets, mixins
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.exceptions import PermissionDenied
from .models import User, STAFF_ROLES, SecuriteCompte
from .permissions import IsChefGreffe
from .serializers import (UserSerializer, RegisterSerializer, CustomTokenSerializer, StaffUserSerializer,
                          ChangerMotDePasseSerializer)


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class   = CustomTokenSerializer


class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class   = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {'message': 'Compte créé avec succès.', 'user': UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class   = UserSerializer

    def get_object(self):
        return self.request.user


class ChangerMotDePasseView(APIView):
    """
    POST /api/auth/changer-mot-de-passe/  {ancien, nouveau, confirmation}
    Obligatoire à la 1re connexion d'un compte du personnel (mot de passe temporaire).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangerMotDePasseSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data['nouveau'])
        user.save(update_fields=['password'])
        SecuriteCompte.objects.update_or_create(user=user, defaults={'doit_changer_mdp': False})
        return Response({'message': 'Mot de passe enregistré.', 'user': UserSerializer(user).data})


class UpdateFCMTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.data.get('fcm_token')
        if token:
            request.user.fcm_token = token
            request.user.save(update_fields=['fcm_token'])
        return Response({'status': 'ok'})


class StaffUserViewSet(mixins.ListModelMixin,
                       mixins.CreateModelMixin,
                       mixins.RetrieveModelMixin,
                       mixins.UpdateModelMixin,
                       viewsets.GenericViewSet):
    """
    Gestion du personnel judiciaire (module AdminUtilisateurs).
    GET    /api/auth/staff/        → liste du personnel
    POST   /api/auth/staff/        → créer un compte (juge / greffier / accueil / courrier)
    PATCH  /api/auth/staff/<id>/   → modifier / activer / désactiver / nouveau mot de passe temporaire
    Réservé au greffier en chef (role 'admin') et au superutilisateur.
    Les comptes « greffier en chef » se créent et se modifient uniquement dans Django Admin.
    """
    serializer_class   = StaffUserSerializer
    permission_classes = [IsChefGreffe]
    pagination_class   = None

    def get_queryset(self):
        qs = User.objects.filter(role__in=STAFF_ROLES).order_by('-date_joined')
        user = self.request.user
        if user.tribunal_id and not user.is_superuser:
            qs = qs.filter(tribunal=user.tribunal)
        return qs

    def perform_update(self, serializer):
        cible, moi = serializer.instance, self.request.user
        if cible == moi:
            # Empêche le greffier en chef de se désactiver ou de changer son propre rôle
            if serializer.validated_data.get('is_active') is False:
                raise ValidationError({'detail': 'Vous ne pouvez pas désactiver votre propre compte.'})
            if 'role' in serializer.validated_data and serializer.validated_data['role'] != cible.role:
                raise ValidationError({'role': 'Vous ne pouvez pas changer votre propre rôle.'})
        elif cible.role == 'admin' and not moi.is_superuser:
            # Un autre compte « greffier en chef » ne se modifie que par le superutilisateur (Django Admin)
            raise PermissionDenied("Ce compte se gère uniquement dans l'administration Django.")
        serializer.save()
