from django.contrib import admin

# Register your models here.
from .models import CryoGridData, SoilCharacteristics, SoilType, ForcingData

admin.site.register(CryoGridData)
admin.site.register(SoilCharacteristics)
admin.site.register(SoilType)
admin.site.register(ForcingData)
