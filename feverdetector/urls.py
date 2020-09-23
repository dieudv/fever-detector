"""feverdetector URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.conf import settings
from django.urls import path, re_path, include
from django.views.static import serve
from temperature import api, views
from rest_framework.routers import SimpleRouter


router = SimpleRouter()
router.register(r'api', api.RecordViewSet)

urlpatterns = [
    path('', include(router.urls), name="api"),
    path('', views.index, name="index"),
    path('screen', views.screen, name="screen"),
    path('download/csv', views.export_records_csv, name="download_csv"),
    path('download/photo', views.export_photos, name="download_photo"),
    path('admin/', admin.site.urls),
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT,}),
]
