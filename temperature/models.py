from django.core.validators import RegexValidator
from django.db import models
from django.utils.translation import gettext_lazy as _


class RecordQuerySet(models.QuerySet):
    def published(self):
        return self.all()


class Record(models.Model):
    created_at = models.DateTimeField(verbose_name=_('created_at'), auto_now_add=True)
    value = models.DecimalField(verbose_name=_('value'), max_digits=3, decimal_places=1, null=True)
    photo = models.ImageField(verbose_name=_('photo'), upload_to='img/', blank=True, null=True)

    objects = RecordQuerySet.as_manager()

    def __str__(self):
        return "{} {}°C".format(self.created_at, self.value)