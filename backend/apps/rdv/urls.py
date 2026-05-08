from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RendezVousViewSet, TribunalViewSet

router = DefaultRouter()
router.register('tribunaux', TribunalViewSet, basename='tribunal')
router.register('',          RendezVousViewSet, basename='rdv')

urlpatterns = [path('', include(router.urls))]
