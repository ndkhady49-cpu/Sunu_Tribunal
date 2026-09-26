from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (LoginView, RegisterView, MeView, UpdateFCMTokenView, StaffUserViewSet,
                    ChangerMotDePasseView)

router = DefaultRouter()
router.register('staff', StaffUserViewSet, basename='staff')

urlpatterns = [
    path('login/',     LoginView.as_view(),        name='login'),
    path('register/',  RegisterView.as_view(),      name='register'),
    path('me/',        MeView.as_view(),             name='me'),
    path('fcm-token/', UpdateFCMTokenView.as_view(), name='fcm-token'),
    path('changer-mot-de-passe/', ChangerMotDePasseView.as_view(), name='changer-mot-de-passe'),
    path('', include(router.urls)),
]
