from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourrierViewSet, TransmissionViewSet

router = DefaultRouter()
router.register('courriers',     CourrierViewSet,     basename='registre-courrier')
router.register('transmissions', TransmissionViewSet, basename='registre-transmission')

urlpatterns = [path('', include(router.urls))]
