from django.contrib import admin

# Register your models here.
from .models import CryoGridData, SoilCharacteristics, SoilType, ForcingData, MapGrid, DepthLevel


class CryoGridAdmin(admin.ModelAdmin):
    list_display = ('name', 'lat', 'long', 'alt', 'tsoil', 'grid',
                    'soil_characteristics', 'created_at', 'modified_at')


admin.site.register(CryoGridData, CryoGridAdmin)
admin.site.register(SoilCharacteristics)
admin.site.register(SoilType)
admin.site.register(ForcingData)
admin.site.register(DepthLevel)

admin.site.register(MapGrid)
