from django.db import models
from django.contrib.postgres.fields import ArrayField
# from django.contrib.gis.db import models -> throws error: GDAL lib is missing


# Create your models here.

class CryoGridData(models.Model):
    db_table = 'cryo_grid_data'
    start_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    modified_at = models.DateTimeField(auto_now=True, editable=False)


class ForcingData(models.Model):
    db_table = 'forcing_data'
    name = models.CharField(max_length=256)
    description = models.TextField()
    start_date = models.DateTimeField()
    precipitation = ArrayField(
        ArrayField(
            models.BigIntegerField(),
        )
    )
    air_temperature = ArrayField(
        ArrayField(
            models.BigIntegerField(),
        )
    )
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    modified_at = models.DateTimeField(auto_now=True, editable=False)

    def __str__(self):
        return self.name


class SoilType(models.Model):
    db_table = 'soil_type'
    name = models.CharField(max_length=256)
    description = models.TextField()
    min_depth = models.PositiveBigIntegerField()
    max_depth = models.PositiveBigIntegerField()


class SoilCharacteristics(models.Model):
    db_table = 'soil_characteristics'
    name = models.CharField(max_length=256)
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

