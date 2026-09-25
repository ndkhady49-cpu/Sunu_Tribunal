from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourrierCitoyenViewSet

router = DefaultRouter()
router.register('', CourrierCitoyenViewSet, basename='courrier-citoyen')

urlpatterns = [path('', include(router.urls))]
