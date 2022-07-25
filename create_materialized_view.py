# import Python's built-in JSON library
import json
import os
import zipfile
import numpy as np
from datetime import datetime

# import the psycopg2 database adapter for PostgreSQL

# use Python's open() function to load the JSON data
from psycopg2 import connect, Error


def get_cg_data(depth_id, start, end):
    sql_string_cg = 'SELECT grid_id, name, depth_level%s[%s:%s], tair[%s:%s] FROM temperature_depth_level' % (depth_id, start, end, start, end)

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
            cur.execute(sql_string_cg)
            cg_data_arr = cur.fetchall()

            print('\nfinished SELECT FROM execution')
            return cg_data_arr

        except (Exception, Error) as error:
            print("\nexecute_sql() error:", error)
            conn.rollback()

        # close the cursor and connection
        cur.close()
        conn.close()


def get_date(date):
    sql_date = 'SELECT id FROM cgmap_date WHERE time=\'' + date + '\''

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
            cur.execute(sql_date)
            date_id = cur.fetchone()

            print('\nfinished SELECT FROM execution')
            return date_id

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

            print('\nfinished CREATE MATERIALIZED VIEW execution')

        except (Exception, Error) as error:
            print("\nexecute_sql() error:", error)
            conn.rollback()

        # close the cursor and connection
        cur.close()
        conn.close()


# set interval around a decade -> 1990 - 2000; 2000 - 2010; 2010 - 2020; 2020 - 2030...
years = ['1990', '2000', '2010', '2020', '2030', '2040', '2050', '2060', '2070', '2080', '2090', '2100']
sql_query = ''
depth_levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
for idx, year in enumerate(years):
    while idx+1 != len(depth_levels):
        sql_query = 'CREATE MATERIALIZED VIEW decade_%s_cg_data_view AS SELECT tdl.id, tdl.grid_id, tdl.name,' % years[idx+1]
        # "SELECT tdl.grid_id, tdl.name, tmp.cg, tmp.tair FROM temperature_depth_level tdl LEFT JOIN LATERAL( select avg((select avg(val) from unnest(depth_level%s[%s:%s]) as val)) as cg, avg((select avg(val) from unnest(tair[%s:%s]) as val)) as tair FROM temperature_depth_level) as tmp" % (depth_id, start_date, end_date, start_date, end_date))
        for depth in depth_levels:
            sql_query += ' depth%s.cg%s,' % (depth, depth)
        sql_query += ' t.tair FROM temperature_depth_level tdl '
        start_date = get_date(str(years[idx]+'-01-01'))[0]
        end_date = get_date(str(years[idx+2]+'-01-01'))[0]
        record_name = 'materialized_view' + years[idx+1]
        for depth in depth_levels:
            sql_query += ' LEFT JOIN LATERAL(select (select avg(val) from unnest(depth_level%s[%s:%s]) as val) as cg%s FROM temperature_depth_level) depth%s ON true' % (depth, depth, start_date, end_date, depth)

        sql_query += ' LEFT JOIN LATERAL(select (select avg(val) from unnest(tair[%s:%s]) as val) as tair FROM temperature_depth_level) t ON true' % (start_date, end_date)
        data_file_name = os.path.join("./Materialized_View/", record_name + '.sql')
        """
        depth_level_arr = []
        for depth in depth_levels:
            print('@ level: ', depth)
            cg_data_lst = get_cg_data(depth, start_date, end_date)
            soil_temp_arr = []
            air_temp_arr = []
            for cg_data in cg_data_lst:
                grid_id = cg_data[0]
                soil_arr = [float(i) for i in cg_data[2]]
                air_arr = [float(i) for i in cg_data[3]]
                soil_temp = np.round(np.mean(np.array(soil_arr)), 2)
                soil_temp_arr.append(soil_temp)
                air_temp = np.round(np.mean(np.array(air_arr)), 2)
                air_temp_arr.append(air_temp)
                # print('@ grid id: ', grid_id, 'soil: ', soil_temp, 'air: ', air_temp)
            depth_level_arr.append(soil_temp_arr)
            print('soil arr: ', len(soil_temp_arr), ' air arr: ', len(air_temp_arr), ' depth level arr: ', len(depth_level_arr))
            print('______________________________________________________')
            sql_query += 'array(' + str(depth_level_arr[depth-1]) + ') as depth_level' + str(depth) + ', '

        sql_query += str(air_temp_arr) + ' as tair FROM temperature_depth_level tdl;'
        print('create materialized view from year ', years[idx], ' until ', years[idx+1])
        sql_query = sql_query.replace("[", "{")
        sql_query = sql_query.replace("]", "}") """
        persist_to_db(sql_query)
        with open(data_file_name, 'w') as output_file:
            output_file.write(sql_query)
