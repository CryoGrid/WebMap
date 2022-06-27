import datetime

from django.contrib.postgres.indexes import GinIndex
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


class SoilType(models.Model):
    db_table = 'soil_type'
    name = models.CharField(max_length=50)
    description = models.TextField()
    min_depth = models.DecimalField(max_digits=6,
        decimal_places=3,
        default=None,
        blank=True,
        null=True,)
    max_depth = models.DecimalField(max_digits=6,
        decimal_places=3,
        default=None,
        blank=True,
        null=True,)

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
    min_depth = models.DecimalField(max_digits=6,
        decimal_places=3,
        default=None,
        blank=True,
        null=True,)
    max_depth = models.DecimalField(max_digits=6,
        decimal_places=3,
        default=None,
        blank=True,
        null=True,)

    def __str__(self):
        return self.name


class Date(models.Model):
    time = models.DateTimeField(
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


class CryoGridData(models.Model):
    db_table = 'cryo_grid_data'
    name = models.CharField(max_length=50, default=None)
    lat = models.DecimalField(max_digits=6, decimal_places=3, default=None)
    long = models.DecimalField(max_digits=6, decimal_places=3, default=None)
    alt = models.DecimalField(max_digits=9, decimal_places=3, default=None, blank=True, null=True)
    tsoil = ArrayField(
        ArrayField(
            models.DecimalField(max_digits=9, decimal_places=3, default=None)
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


class TemperatureDepthLevel(models.Model):
    name = models.CharField(max_length=50, default=None)
    grid_id = models.PositiveIntegerField()
    depth_level1 = ArrayField(models.DecimalField(max_digits=9, decimal_places=3, default=None))
    depth_level2 = ArrayField(models.DecimalField(max_digits=9, decimal_places=3, default=None))
    depth_level3 = ArrayField(models.DecimalField(max_digits=9, decimal_places=3, default=None))
    depth_level4 = ArrayField(models.DecimalField(max_digits=9, decimal_places=3, default=None))
    depth_level5 = ArrayField(models.DecimalField(max_digits=9, decimal_places=3, default=None))
    depth_level6 = ArrayField(models.DecimalField(max_digits=9, decimal_places=3, default=None))
    depth_level7 = ArrayField(models.DecimalField(max_digits=9, decimal_places=3, default=None))
    depth_level8 = ArrayField(models.DecimalField(max_digits=9, decimal_places=3, default=None))
    depth_level9 = ArrayField(models.DecimalField(max_digits=9, decimal_places=3, default=None))
    depth_level10 = ArrayField(models.DecimalField(max_digits=9, decimal_places=3, default=None))
    depth_level11 = ArrayField(models.DecimalField(max_digits=9, decimal_places=3, default=None))
    depth_level12 = ArrayField(models.DecimalField(max_digits=9, decimal_places=3, default=None))
    depth_level13 = ArrayField(models.DecimalField(max_digits=9, decimal_places=3, default=None))
    depth_level14 = ArrayField(models.DecimalField(max_digits=9, decimal_places=3, default=None))
    depth_level15 = ArrayField(models.DecimalField(max_digits=9, decimal_places=3, default=None))
    tair = ArrayField(models.DecimalField(max_digits=9, decimal_places=3, default=None))

    class Meta:
        managed = False
        db_table = 'temperature_depth_level'
        indexes = [GinIndex(fields=['depth_level1', 'depth_level2', 'depth_level3', 'depth_level4', 'depth_level5',
                                    'depth_level6', 'depth_level7', 'depth_level8', 'depth_level9', 'depth_level10',
                                    'depth_level11', 'depth_level12', 'depth_level13', 'depth_level14', 'depth_level15',
                                    'tair'])]
