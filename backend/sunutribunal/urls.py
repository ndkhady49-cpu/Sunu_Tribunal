from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from .views import home_view

urlpatterns = [
    path('',              home_view,            name='home'),
    path('admin/',        admin.site.urls),
    path('api/auth/',     include('apps.accounts.urls')),
    path('api/rdv/',      include('apps.rdv.urls')),
    path('api/plaintes/', include('apps.plaintes.urls')),
    path('api/alertes/',  include('apps.alertes.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)