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


class DepthLevel(models.Model):
    z_level = models.DecimalField(
        max_digits=6,
        decimal_places=3,
        default=None,
        blank=True,
        null=True,
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
    t_max_all_rev = ArrayField(
        ArrayField(
            models.DecimalField(max_digits=9, decimal_places=3, default=None)
        ), default=None
    )
    t_min_all_rev = ArrayField(
        ArrayField(
            models.DecimalField(max_digits=9, decimal_places=3, default=None)
        ), default=None
    )
    t_av_all_rev = ArrayField(
        ArrayField(
            models.DecimalField(max_digits=9, decimal_places=3, default=None)
        ), default=None
    )
    t_max_all_51 = ArrayField(
        ArrayField(
            models.DecimalField(max_digits=9, decimal_places=3, default=None)
        ), default=None
    )
    t_min_all_51 = ArrayField(
        ArrayField(
            models.DecimalField(max_digits=9, decimal_places=3, default=None)
        ), default=None
    )
    t_av_all_51 = ArrayField(
        ArrayField(
            models.DecimalField(max_digits=9, decimal_places=3, default=None)
        ), default=None
    )
    t_av_iceage_51 = ArrayField(
        models.DecimalField(max_digits=9, decimal_places=3)
    )
    t_av_preindustrial_51 = ArrayField(
        models.DecimalField(max_digits=9, decimal_places=3)
    )
    t_av_historical_51 = ArrayField(
        models.DecimalField(max_digits=9, decimal_places=3)
    )
    t_min_iceage_51 = ArrayField(
        models.DecimalField(max_digits=9, decimal_places=3)
    )
    t_min_preindustrial_51 = ArrayField(
        models.DecimalField(max_digits=9, decimal_places=3)
    )
    t_min_historical_51 = ArrayField(
        models.DecimalField(max_digits=9, decimal_places=3)
    )
    t_max_iceage_51 = ArrayField(
        models.DecimalField(max_digits=9, decimal_places=3)
    )
    t_max_preindustrial_51 = ArrayField(
        models.DecimalField(max_digits=9, decimal_places=3)
    )
    t_max_historical_51 = ArrayField(
        models.DecimalField(max_digits=9, decimal_places=3)
    )
    t_max_all_101 = ArrayField(
        ArrayField(
            models.DecimalField(max_digits=9, decimal_places=3, default=None)
        ), default=None
    )
    t_min_all_101 = ArrayField(
        ArrayField(
            models.DecimalField(max_digits=9, decimal_places=3, default=None)
        ), default=None
    )
    t_av_all_101 = ArrayField(
        ArrayField(
            models.DecimalField(max_digits=9, decimal_places=3, default=None)
        ), default=None
    )
    t_av_iceage_101 = ArrayField(
        models.DecimalField(max_digits=9, decimal_places=3)
    )
    t_av_preindustrial_101 = ArrayField(
        models.DecimalField(max_digits=9, decimal_places=3)
    )
    t_av_historical_101 = ArrayField(
        models.DecimalField(max_digits=9, decimal_places=3)
    )
    t_min_iceage_101 = ArrayField(
        models.DecimalField(max_digits=9, decimal_places=3)
    )
    t_min_preindustrial_101 = ArrayField(
        models.DecimalField(max_digits=9, decimal_places=3)
    )
    t_min_historical_101 = ArrayField(
        models.DecimalField(max_digits=9, decimal_places=3)
    )
    t_max_iceage_101 = ArrayField(
        models.DecimalField(max_digits=9, decimal_places=3)
    )
    t_max_preindustrial_101 = ArrayField(
        models.DecimalField(max_digits=9, decimal_places=3)
    )
    t_max_historical_101 = ArrayField(
        models.DecimalField(max_digits=9, decimal_places=3, default=0.0)
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