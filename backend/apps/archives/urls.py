from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DossierArchiveViewSet

router = DefaultRouter()
router.register('dossiers', DossierArchiveViewSet, basename='archive-dossier')

urlpatterns = [path('', include(router.urls))]
