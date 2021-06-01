import os
from django.contrib.gis.utils import LayerMapping
from cgmap.models import MapGrid

mapgrid_mapping = {
    'id': 'id',
    'left': 'left',
    'top': 'top',
    'right': 'right',
    'bottom': 'bottom',
    'geom': 'MULTIPOLYGON',
}

german_shp = os.path.abspath(
    os.path.join(os.path.dirname(__file__), 'data', '/shapefile/GermanyGridsShape/gridv1complete.shp'),
)


def run(verbose=True):
    lm = LayerMapping(
        MapGrid, german_shp, mapgrid_mapping, transform=False, encoding='utf-8',
    )
    lm.save(strict=True, verbose=verbose)
