from rest_framework import generics, status, viewsets, mixins
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, STAFF_ROLES
from .permissions import IsChefGreffe
from .serializers import UserSerializer, RegisterSerializer, CustomTokenSerializer, StaffUserSerializer


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
    POST   /api/auth/staff/        → créer un compte (admin / juge / greffier)
    PATCH  /api/auth/staff/<id>/   → modifier / activer / désactiver
    Réservé au greffier en chef (role 'admin') et au superutilisateur.
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
        # Empêche le greffier en chef de se désactiver lui-même
        if serializer.instance == self.request.user and serializer.validated_data.get('is_active') is False:
            raise ValidationError({'detail': 'Vous ne pouvez pas désactiver votre propre compte.'})
        serializer.save()
