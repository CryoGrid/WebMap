import os

from django.contrib.gis.gdal import DataSource
from django.contrib.gis.utils import LayerMapping
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ArcticMap.settings')

django.setup()

from acgmap.models import MapGrid

mapgrid_mapping = {
    'id': 'id',
    'left': 'left',
    'top': 'top',
    'right': 'right',
    'bottom': 'bottom',
    'geom': 'MULTIPOLYGON',
}

print('_________________________loading shape file_________________________')

german_shp = os.path.abspath(
    os.path.join(os.path.dirname(__file__), 'shapefile/polygon.shp'),
)

print(german_shp)

#ds = DataSource(german_shp)
#print(ds.name)

print('_________________________start layer mapping_________________________')
lm = LayerMapping(
    MapGrid, german_shp, mapgrid_mapping, transform=False, encoding='utf-8',
)
lm.save(strict=True, verbose=True)