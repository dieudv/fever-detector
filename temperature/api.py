import re, base64
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from datetime import datetime
from django_filters.rest_framework import DjangoFilterBackend
from django.core.files.base import ContentFile
from django.utils.text import slugify
from rest_framework import status
from rest_framework import viewsets, permissions
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Record
from .serializers import RecordSerializer

class RecordPagination(PageNumberPagination):
    page_size = 1000


class RecordViewSet(viewsets.ModelViewSet):
    queryset = Record.objects.all().order_by('created_at')
    serializer_class = RecordSerializer
    permission_classes = (AllowAny,)
    filter_backends = (DjangoFilterBackend,)
    search_fields = ('id', 'created_at')
    filter_fields = ('id', 'created_at')
    pagination_class = RecordPagination


    def create(self, request):
        data = request.data
        print(data)
        value = data.get("value", None)
        photo_encoded_str = data.get('photo')
        photo = None

        try:
            value = float(value)
        except:
            return Response({"status": False, "error": "Format error"}, status.HTTP_400_BAD_REQUEST)

        try:
            photo_str = base64.b64decode(photo_encoded_str)
            photo = ContentFile(photo_str)
        except:
            pass

        if not isinstance(value, float):
            return Response({"status": False, "error": "Format error"}, status.HTTP_400_BAD_REQUEST)
        
        if value <= 33 or value >= 42:
            return Response({"status": False, "error": "Temperature <= 42 and >= 33"}, status.HTTP_400_BAD_REQUEST)
        
        obj = Record.objects.create(value=value)
        if photo:
            obj.photo.save("{}.jpg".format(datetime.now()), photo, save=True)

        serialize = RecordSerializer(obj)

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)('feverdetector', {"type": "record.add", "data": serialize.data})

        return Response({"status": True, "data": serialize.data}, status.HTTP_201_CREATED) 


    def get_queryset(self):
        queryset = Record.objects.all()
        return queryset