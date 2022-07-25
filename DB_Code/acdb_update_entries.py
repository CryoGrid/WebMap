# import the psycopg2 database adapter for PostgreSQL
import os
import json
from datetime import datetime

import numpy
import xarray.core.variable
from netCDF4 import Dataset
import xarray as xr
import numpy as np

from psycopg2 import connect, Error


def get_year_id(value):
    sql_string = "SELECT id FROM acgmap_date WHERE year = '%s';" % value

    # code for psycopg2 to connect to Postgres
    try:
        # declare a new PostgreSQL connection object
        conn = connect(
            dbname="arc_postgres",
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
            cur.execute(sql_string)
            year_id = cur.fetchone()

            print('\nfinished SELECT FROM execution')
            return str(year_id[0])

        except (Exception, Error) as error:
            print("\nexecute_sql() error:", error)
            conn.rollback()

        # close the cursor and connection
        cur.close()
        conn.close()


def get_avg_val(sql_string):
    # code for psycopg2 to connect to Postgres
    try:
        # declare a new PostgreSQL connection object
        conn = connect(
            dbname="arc_postgres",
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
            cur.execute(sql_string)
            conn.commit()
            values = cur.fetchall()

            print('\nfinished SELECT FROM execution')
            return values

        except (Exception, Error) as error:
            print("\nexecute_sql() error:", error)
            conn.rollback()

        # close the cursor and connection
        cur.close()
        conn.close()


def persist_to_db(sql_command):
    # code for psycopg2 to connect to Postgres
    try:
        # declare a new PostgreSQL connection object
        conn = connect(
            dbname="arc_postgres",
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


def update_sql(start_date, end_date):
    db_dict = {'acgmap_cryogriddata': {}}
    now = datetime.now()
    db_dict['acgmap_cryogriddata'].update({"MODIFIED_AT": [now.strftime('%Y-%m-%d_%H:%M:%S')]})

    for grid_id in grid_ids:
        av_historical_list = []
        min_historical_list = []
        max_historical_list = []
        for ids in depth_level:
            ssql = 'SELECT (select avg(cg) from unnest(t_av_all_51[1:51][%s:%s][%s]) as cg), (select min(cg) from unnest(t_min_all_51[1:51][%s:%s][%s]) as cg), (select max(cg) from unnest(t_max_all_51[1:51][%s:%s][%s]) as cg) FROM acgmap_cryogriddata WHERE grid_id = %s' % (
                start_date, end_date, ids, start_date, end_date, ids, start_date, end_date, ids, grid_id
            )
            sql = get_avg_val(ssql)
            av_historical_list.append(float(round(sql[0][0], 3)))
            min_historical_list.append(float(round(sql[0][1], 3)))
            max_historical_list.append(float(round(sql[0][2], 3)))
        sql_string = ''
        db_dict['acgmap_cryogriddata'].update({"t_av_historical_51": av_historical_list})
        db_dict['acgmap_cryogriddata'].update({"t_min_historical_51": min_historical_list})
        db_dict['acgmap_cryogriddata'].update({"t_max_historical_51": max_historical_list})
        if type(db_dict):
            for table_names in db_dict:
                # get table name
                sql_string += 'UPDATE {} SET '.format(table_names)

                for col_names, records in db_dict[table_names].items():
                    # tuple of column name (eg: TIME) and data array
                    if col_names == 'MODIFIED_AT':
                        sql_string += '{} = \'{}\', '.format(col_names, records[0])
                    else:
                        sql_string += '{} = \'{}\', '.format(col_names, records)
                # remove the last comma and end statement with a semicolon
                sql_string = sql_string[:-2] + " "
                sql_string += 'WHERE grid_id = \'{}\';'.format(grid_id)
        sql_string = sql_string.replace("[", "{")
        sql_string = sql_string.replace("]", "}")
        print('updated db: ', sql_string)
        persist_to_db(sql_string)
        print('with grid id: ', grid_id)
        sql_string = ''
        print('__________________________persist to db__________________________')


depth_level = np.arange(1, 73)
grid_ids = np.arange(1, 3683)

# preindustrial 1850 - 1900
#start = get_year_id('1850-01-01 00:00:00+01') # 251
#end = get_year_id('1900-01-01 00:00:00+01') # 301

# sql_string = "SELECT grid_id, name, (select avg(cg) from unnest(t_av_all_51[1:51][%s:%s][%s]) as cg), (select avg(cg) from unnest(t_max_all_51[1:51][%s:%s][%s]) as cg), (select avg(cg) from unnest(t_min_all_51[1:51][%s:%s][%s]) as cg) FROM acgmap_cryogriddata" % (
# start_date, end_date, ids, start_date, end_date, i, start_date, end_date, i
# )
# end of little ice age 1750 - 1800 : t_av_iceage_51, t_av_iceage_101, t_min_iceage_51, t_min_iceage_101, t_max_iceage_51, t_max_iceage_101
#_start = get_year_id('1751-01-01 00:00:00+01')  # 151
#_end = get_year_id('1800-01-01 00:00:00+01')  # 201


# historical 1950 - 2000 : t_av_historical_51, t_av_historical_101, t_min_historical_51, t_min_historical_101, t_max_historical_51, t_max_historical_101
start = get_year_id('1951-01-01 00:00:00+01')  # 352
end = get_year_id('2000-01-01 00:00:00+01')  # 401
update_sql(start, end)
