from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, STAFF_ROLES


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id','email','nom','prenom','telephone','cni','role','is_verified','date_joined']
        # Le rôle ne peut JAMAIS être modifié par l'utilisateur lui-même (/api/auth/me/)
        read_only_fields = ['id','email','role','date_joined','is_verified']


class RegisterSerializer(serializers.ModelSerializer):
    """Inscription publique : réservée aux citoyens (le rôle est forcé côté serveur)."""
    password  = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ['email','nom','prenom','telephone','cni','password','password2']

    def validate(self, data):
        if data['password'] != data.pop('password2'):
            raise serializers.ValidationError({'password': 'Les mots de passe ne correspondent pas.'})
        return data

    def create(self, validated_data):
        # Toute donnée "role" envoyée par le client est ignorée
        validated_data['role'] = 'citoyen'
        return User.objects.create_user(**validated_data)


class StaffUserSerializer(serializers.ModelSerializer):
    """Création / gestion des comptes du personnel judiciaire (greffier en chef uniquement)."""
    password = serializers.CharField(write_only=True, min_length=6, required=False)
    role     = serializers.ChoiceField(choices=[r for r in User.ROLES if r[0] in STAFF_ROLES])

    class Meta:
        model  = User
        fields = ['id','email','nom','prenom','telephone','role','tribunal',
                  'is_active','date_joined','password']
        read_only_fields = ['id','date_joined']

    def validate(self, data):
        if self.instance is None and not data.get('password'):
            raise serializers.ValidationError({'password': 'Mot de passe temporaire requis.'})
        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        # Rattache par défaut le nouveau compte au tribunal du créateur
        request = self.context.get('request')
        if not validated_data.get('tribunal') and request and request.user.tribunal_id:
            validated_data['tribunal'] = request.user.tribunal
        return User.objects.create_user(password=password, is_verified=True, **validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class CustomTokenSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['nom']  = user.nom
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data
