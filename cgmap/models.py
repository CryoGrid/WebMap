from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.contrib.gis.db import models # -> throws error: GDAL lib is missing


# Create your models here.
class ForcingData(models.Model):
    db_table = 'forcing_data'
    name = models.CharField(max_length=50)
    description = models.TextField()
    start_date = models.DateTimeField()
    precipitation = ArrayField(
        ArrayField(
            models.BigIntegerField(),
        )
    )
    tair = ArrayField(
        ArrayField(
            models.DecimalField(max_digits=6, decimal_places=3, default=None)
        )
    )
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    modified_at = models.DateTimeField(auto_now=True, editable=False)

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


class CryoGridData(models.Model):
    db_table = 'cryo_grid_data'
    name = models.CharField(max_length=50)
    lat = models.DecimalField(max_digits=9, decimal_places=6, default=None)
    long = models.DecimalField(max_digits=9, decimal_places=6, default=None)
    alt = models.DecimalField(max_digits=9, decimal_places=6, default=None)
    z_level = ArrayField(models.BigIntegerField())
    tsoil = ArrayField(
        ArrayField(
            models.DecimalField(max_digits=6, decimal_places=3, default=None)
        )
    )
    time = ArrayField(models.DateTimeField())
    start_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    modified_at = models.DateTimeField(auto_now=True, editable=False)
    forcing_data = models.ForeignKey(
        ForcingData,
        on_delete=models.CASCADE,
        verbose_name="related forcing data",
        blank=False,
        null=False,
        default=None,
    )
    soil_characteristics = models.ForeignKey(
        SoilCharacteristics,
        on_delete=models.CASCADE,
        verbose_name="related soil characteristics",
        blank=False,
        null=False,
        default=None,
    )


class MapGrid(models.Model):
    left = models.FloatField()
    top = models.FloatField()
    right = models.FloatField()
    bottom = models.FloatField()
    geom = models.MultiPolygonField(srid=4326)

    def __str__(self):
        return self.left
