from django.contrib import admin
from .models import Record


class RecordAdmin(admin.ModelAdmin):
    list_display = ("created_at", "value")
    list_per_page = 100


admin.site.register(Record, RecordAdmin)