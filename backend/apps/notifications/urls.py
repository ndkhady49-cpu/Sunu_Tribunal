from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .models import NotificationViewSet, SMSLogViewSet

router = DefaultRouter()
router.register('sms', SMSLogViewSet, basename='sms')
router.register('', NotificationViewSet, basename='notification')
urlpatterns = [path('', include(router.urls))]
