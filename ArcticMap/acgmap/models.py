from django.db import models
import datetime

from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.fields import ArrayField
from django.contrib.gis.db import models


# Create your models here.
class MapGrid(models.Model):
    auto_id = models.AutoField(primary_key=True)
    id = models.FloatField()
    left = models.FloatField()
    top = models.FloatField()
    right = models.FloatField()
    bottom = models.FloatField()
    geom = models.MultiPolygonField(srid=4326)

    def __str__(self):
        return str(self.id)


class Date(models.Model):
    year = models.DateTimeField(
        blank=False,
        null=False,
        default=None,
    )


class ForcingData(models.Model):
    db_table = 'forcing_data'
    name = models.CharField(max_length=50)
    tair = ArrayField(
        ArrayField(
            models.DecimalField(max_digits=9, decimal_places=3, default=None)
        ), default=None
    )
    created_at = models.DateTimeField(default=datetime.datetime.now)
    modified_at = models.DateTimeField(auto_now=True)
    grid = models.ForeignKey(
        MapGrid,
        on_delete=models.CASCADE,
        verbose_name="related grid cell",
        blank=False,
        null=False,
        default=None,
    )

    def __str__(self):
        return self.name


class CryoGridData(models.Model):
    db_table = 'cryo_grid_data'
    name = models.CharField(max_length=50, default=None)
    lat = models.DecimalField(max_digits=6, decimal_places=3, default=None)
    long = models.DecimalField(max_digits=6, decimal_places=3, default=None)
    t_max_all = ArrayField(
        ArrayField(
            models.DecimalField(max_digits=9, decimal_places=3, default=None)
        ), default=None
    )
    t_min_all = ArrayField(
        ArrayField(
            models.DecimalField(max_digits=9, decimal_places=3, default=None)
        ), default=None
    )
    t_av_all = ArrayField(
        ArrayField(
            models.DecimalField(max_digits=9, decimal_places=3, default=None)
        ), default=None
    )
    created_at = models.DateTimeField(default=datetime.datetime.now)
    modified_at = models.DateTimeField(auto_now=True)
    grid = models.ForeignKey(
        MapGrid,
        on_delete=models.CASCADE,
        verbose_name="related grid cell",
        blank=False,
        null=False,
        default=None,
    )
