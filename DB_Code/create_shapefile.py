import os
import geopandas as gpd
from netCDF4 import Dataset
from shapely.geometry import Polygon

# conda env -> geo_env

path_to_data = 'N:/netscratch/jnitzbon/ArcticEnsemble/output/RESULT_JSONfiles_1600-2020_nEns100'
polygon_geom = []
coords_top = []
coords_bottom = []
coords_left = []
coords_right = []
id_list = []
shape = {}


def create_coord_list():
    gen_id = 1
    for filename in os.listdir(path_to_data):
        print('filename: ', filename)
        with open(os.path.join(path_to_data, filename)) as net_data:
            #arc_var = net_data.variables

            record_name = filename.removesuffix('.json')
            # getting grid center coords from file name -> based on the assumption that the first eight numbers are the center
            lat_long_list = record_name.split('_')
            long = float(lat_long_list[2])
            lat = float(lat_long_list[3])
            # if long > 180.0:
            #    long = 180.0 - long

            # calculation of coordinates for german grid map
            top = float(lat)
            bottom = float(lat) - 1
            left = float(long)
            right = float(long) + 1
            print(' top: ', top, ' bottom: ', bottom, ' left: ', left, ' right: ', right)
            lat_point_list = [top, top, bottom, bottom, top]
            lon_point_list = [left, right, right, left, left]
            polygon_geom.append(Polygon(zip(lon_point_list, lat_point_list)))
            coords_top.append(top)
            coords_left.append(left)
            coords_right.append(right)
            coords_bottom.append(bottom)
            id_list.append(gen_id)
            gen_id += 1
    shape['id'] = id_list
    shape['top'] = coords_top
    shape['left'] = coords_left
    shape['right'] = coords_right
    shape['bottom'] = coords_bottom
    shape['geometry'] = polygon_geom


create_coord_list()
crs = {'init': 'epsg:4326'}
polygon = gpd.GeoDataFrame(shape, crs=crs)

polygon.to_file(filename='../ArcticMap/ArcticMap/shapefile/polygon.geojson', driver='GeoJSON')
polygon.to_file(filename='../ArcticMap/ArcticMap/shapefile/polygon.shp', driver='ESRI Shapefile')
