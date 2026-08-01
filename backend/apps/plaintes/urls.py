from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlainteViewSet

router = DefaultRouter()
router.register('', PlainteViewSet, basename='plainte')
urlpatterns = [path('', include(router.urls))]
