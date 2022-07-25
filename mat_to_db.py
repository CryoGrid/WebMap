from psycopg2 import connect, Error
from mat4py import loadmat
import metpy.calc
from metpy.units import units
from pint import UnitRegistry
import numpy as np


# calculate altitude of grid cell
def calc_geo_height(h):
    re = 6371000  # earth radius in m
    g = 9.80665  # m/s2
    sq = re / (re + h)
    alt = g * np.square(sq)
    return alt


def persist_to_db(sql_command):
    # code for psycopg2 to connect to Postgres
    try:
        # declare a new PostgreSQL connection object
        conn = connect(
            dbname="postgres",
            user="postgres",
            host="localhost",
            password="postgres",
            # attempt to connect or 3 seconds then raise exception
            connect_timeout=3
        )

        cur = conn.cursor()
        print("\ncreated cursor object:", cur)

    except (Exception, Error) as err:
        print("\npsycopg2 connect error:", err)
        conn = None
        cur = None

    # use psycopg2 to insert JSON data
    if cur is not None:

        try:
            cur.execute(sql_command)
            conn.commit()

            print('\nfinished INSERT INTO execution')

        except (Exception, Error) as error:
            print("\nexecute_sql() error:", error)
            conn.rollback()

        # close the cursor and connection
        cur.close()
        conn.close()


def get_grid_id(lat, lng):
    sql_string_grid_id = 'SELECT id FROM cgmap_cryogriddata WHERE lat = ' + str(
        lat) + ' AND cgmap_cryogriddata.long = ' + str(lng)

    # code for psycopg2 to connect to Postgres
    try:
        # declare a new PostgreSQL connection object
        conn = connect(
            dbname="postgres",
            user="postgres",
            host="localhost",
            password="postgres",
            # attempt to connect or 3 seconds then raise exception
            connect_timeout=3
        )

        cur = conn.cursor()
        print("\ncreated cursor object:", cur)

    except (Exception, Error) as err:
        print("\npsycopg2 connect error:", err)
        conn = None
        cur = None

    if cur is not None:

        try:
            cur.execute(sql_string_grid_id)
            ix = cur.fetchone()

            print('\nfinished SELECT FROM execution')
            return str(int(ix[0]))

        except (Exception, Error) as error:
            print("\nexecute_sql() error:", error)
            conn.rollback()

        # close the cursor and connection
        cur.close()
        conn.close()


ureg = UnitRegistry()
# path: 'N:\permarisk\data\ERA_Data\ERA5\Germany\Geopotential\era5_geopotential.mat'
print('\nloading file')
mat = loadmat('N:/permarisk/data/ERA_Data/ERA5/Germany/Geopotential/era5_geopotential.mat')
latitude = mat.get('era5gp').get('latitude')
longitude = mat.get('era5gp').get('longitude')
geo = mat.get('era5gp').get('geopotential')

geopot = geo * units.m ** 2 / units.s ** 2
h_lst = metpy.calc.geopotential_to_height(geopot)

alt_lst = []
idx_lst = []
sql_string = ''
data_file_name = 'file'

for idx, val in enumerate(h_lst):
    lat = latitude[idx]
    lng = longitude[idx]
    alt = h_lst[idx]
    # alt = alt.replace('meter', '').strip()
    print('alt value: ', alt, ' unit: ', alt.units)
    i = get_grid_id(lat, lng)
    if i is not None:
        if alt > 2963 * units.m:
            print('alt to high! ', alt, i)  # ~3069 id 1401
            break
        if alt < -4 * units.m:
            print('alt to low! ', alt, i)  # ~-6.97 id 1756
            break
        sql = 'UPDATE cgmap_cryogriddata SET alt = ' + str(alt.magnitude) + ' WHERE id = ' + i + '; '
        alt_lst.append(alt)
        sql_string += 'ID: ' + i + ' sql: ' + sql
        print('sql: ', sql)
        print('________________________________________________________________________________')
        #persist_to_db(sql)
'''
for idx, val in enumerate(latitude):
    la = latitude[idx]
    ln = longitude[idx]
    al = calc_geo_height(geo[idx])
    alt_lst.append(al)
    i = get_grid_id(la, ln)
    if i is not None:
        if al > 2963:
            print('alt to high! ', al, i)  # ~3069 id 1401
            break
        if al < -4:
            print('alt to low! ', al, i)  # ~-6.97 id 1756
            break
        sql = 'UPDATE cgmap_cryogriddata SET alt = ' + str(al) + ' WHERE id = ' + i
        print('sql: ', sql)
    # idx_lst.append(i)
    # print('id list: ', idx_lst)
'''
print('alt list: ', len(alt_lst))
print(' first: ', alt_lst[0])
print(' last: ', alt_lst[859])

with open(data_file_name, 'w') as output_file:
    output_file.write(sql_string)
