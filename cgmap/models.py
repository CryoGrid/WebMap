import datetime

from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.contrib.gis.db import models  # -> throws error: GDAL lib is missing


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


class ForcingData(models.Model):
    db_table = 'forcing_data'
    name = models.CharField(max_length=50)
    precipitation = ArrayField(
        ArrayField(
            models.BigIntegerField(),
        ), null=True, blank=True
    )
    tair = ArrayField(
        ArrayField(
            models.DecimalField(max_digits=6, decimal_places=3, default=None)
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


class SoilType(models.Model):
    db_table = 'soil_type'
    name = models.CharField(max_length=50)
    description = models.TextField()
    min_depth = models.PositiveBigIntegerField()
    max_depth = models.PositiveBigIntegerField()

    def __str__(self):
        return self.name


class SoilCharacteristics(models.Model):
    db_table = 'soil_characteristics'
    name = models.CharField(max_length=50)
    description = models.TextField()
    soil_type = models.ForeignKey(
        SoilType,
        on_delete=models.CASCADE,
        verbose_name="related soil type",
        blank=False,
        null=False,
    )
    min_depth = models.PositiveBigIntegerField()
    max_depth = models.PositiveBigIntegerField()

    def __str__(self):
        return self.name


class Date(models.Model):
    time = models.DateTimeField(blank=False,
                                null=False,
                                default=None, )


class CryoGridData(models.Model):
    db_table = 'cryo_grid_data'
    name = models.CharField(max_length=50, default=None)
    lat = models.DecimalField(max_digits=6, decimal_places=3, default=None)
    long = models.DecimalField(max_digits=6, decimal_places=3, default=None)
    alt = models.DecimalField(max_digits=6, decimal_places=3, default=None, blank=True, null=True)
    z_level = ArrayField(models.BigIntegerField(), default=None, blank=True, null=True)
    tsoil = ArrayField(
        ArrayField(
            models.DecimalField(max_digits=6, decimal_places=3, default=None)
        ), default=None
    )
    created_at = models.DateTimeField(default=datetime.datetime.now)
    modified_at = models.DateTimeField(auto_now=True)
    soil_characteristics = models.ForeignKey(
        SoilCharacteristics,
        on_delete=models.CASCADE,
        verbose_name="related soil characteristics",
        blank=True,
        null=True,
        default=None,
    )
    grid = models.ForeignKey(
        MapGrid,
        on_delete=models.CASCADE,
        verbose_name="related grid cell",
        blank=False,
        null=False,
        default=None,
    )
