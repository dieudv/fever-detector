import csv
from django.http import HttpResponse
from django.shortcuts import render
from rest_framework import status
from wsgiref.util import FileWrapper
from zipfile import *

from .models import Record
from feverdetector import settings


def index(request):
    return render(request, 'index.html')


def screen(request):
    return render(request, 'screen.html')


def download_records_csv(request):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="records.csv"'

    writer = csv.writer(response)
    writer.writerow(['id', 'time', 'temperature', 'photo'])

    records = Record.objects.all().values_list('id', 'created_at', 'value', 'photo')
    for record in records:
        row = (record[0], record[1], record[2], record[3].replace("/img/", ""))
        writer.writerow(row)

    return response


def download_photos(request):
    records = Record.objects.all().values_list('photo')

    file_name = "photo.zip"
    with ZipFile(file_name, 'w') as export_zip:
        for record in records:
            image_path = settings.MEDIA_ROOT + "/" + record[0]
            export_zip.write(image_path, record[0].replace("ncov/img/", ""))

    wrapper = FileWrapper(open(file_name, 'rb'))
    content_type = 'application/zip'
    content_disposition = 'attachment; filename={}'.format(file_name)

    response = HttpResponse(wrapper, content_type=content_type)
    response['Content-Disposition'] = content_disposition
    return response