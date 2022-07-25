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


def get_grid_id(top_coord, right_coord):
    sql_string_grid_id = 'SELECT id FROM acgmap_mapgrid WHERE top = ' + str(
        top_coord) + ' AND acgmap_mapgrid.right = ' + str(right_coord)

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
            cur.execute(sql_string_grid_id)
            grid_id = cur.fetchone()

            print('\nfinished SELECT FROM execution')
            return str(int(grid_id[0]))

        except (Exception, Error) as error:
            print("\nexecute_sql() error:", error)
            conn.rollback()

        # close the cursor and connection
        cur.close()
        conn.close()


def entry_exists(grid_id):
    sql_string = 'select exists(select 1 from acgmap_cryogriddata where grid_id= %s)' % str(grid_id)
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
            exists = cur.fetchone()
            print('Entry exists? ', exists[0])

            print('\nfinished SELECT FROM execution')
            return exists[0]

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


half_length = 0.125


def flatten(t):
    return [item for sublist in t for item in sublist]


def cryogriddata_to_db_json():
    path_to_data = 'N:/netscratch/jnitzbon/ArcticEnsemble/output/RESULT_JSONfiles_1600-2020_nEns100/stack1'
    table_names = ['acgmap_cryogriddata']

    for filename in os.listdir(path_to_data):
        with open(os.path.join(path_to_data, filename)) as json_data:
            db_dict = {'acgmap_cryogriddata': {}}
            record_list = json.load(json_data)
            now = datetime.now()
            dt_string = now.strftime("%d-%m-%Y_%H-%M-%S")
            print('date and time: ', dt_string)
            sql_string = ''

            record_name = filename.removesuffix('.json')
            record_list["NAME"] = [record_name]
            # getting grid center coords from file name -> based on the assumption that the first eight numbers are the center
            lat_long_list = record_name.split('_')
            long = float(lat_long_list[2])
            lat = float(lat_long_list[3])
            if long > 180.0:
                long = 180.0 - long
            record_list["LAT"] = [lat]
            record_list["LONG"] = [long]
            record_list["CREATED_AT"] = [now.strftime('%Y-%m-%d_%H:%M:%S')]
            record_list["MODIFIED_AT"] = [now.strftime('%Y-%m-%d_%H:%M:%S')]

            # calculation of coordinates for german grid map
            top = float(lat)
            bottom = float(lat) - 1.0
            left = float(long)
            right = float(long) + 1.0
            db_grid_id = get_grid_id(top, right)

            if entry_exists(db_grid_id):
                print(db_grid_id, ' already exists!')
            else:
                print('coords: (', top, ', ', right, ') have grid id: ', db_grid_id)
                record_list["GRID_ID"] = [db_grid_id]

                # adding name and grid id to forcingdata sql list
                db_dict['acgmap_cryogriddata'].update({"NAME": [record_name]})
                db_dict['acgmap_cryogriddata'].update({"GRID_ID": [db_grid_id]})
                db_dict['acgmap_cryogriddata'].update({"LAT": [lat]})
                db_dict['acgmap_cryogriddata'].update({"LONG": [long]})
                db_dict['acgmap_cryogriddata'].update({"CREATED_AT": [now.strftime('%Y-%m-%d_%H:%M:%S')]})
                db_dict['acgmap_cryogriddata'].update({"MODIFIED_AT": [now.strftime('%Y-%m-%d_%H:%M:%S')]})

                data_file_name = os.path.join("./GM_data/cryodata_sql/", record_name + '.sql')

                for record in record_list:
                    value = {record: record_list[record]}
                    if record == 'T_av_all' or record == 'T_min_all' or record == 'T_max_all':
                        rev = record + '_rev'  # entry at [0]
                        m = record + '_51'  # entry at [1:51]
                        n = record + '_101'  # entry at [51:100]
                        rev_list = [record_list['T_av_all'][0]]  # 421x72
                        m_list = [record_list['T_av_all'][1:51]]  # 50x421x72
                        n_list = [record_list['T_av_all'][51:100]]  # 49x421x72
                        rev_value = {rev: [[[round(r, 3) for r in depth_arr] for depth_arr in year_arr] for year_arr in
                                           rev_list]}
                        db_dict['acgmap_cryogriddata'].update(rev_value)
                        m_value = {
                            m: [[[[round(r, 3) for r in depth_arr] for depth_arr in year_arr] for year_arr in tile_arr] for
                                tile_arr in m_list]}
                        db_dict['acgmap_cryogriddata'].update(m_value)
                        n_value = {
                            n: [[[[round(r, 3) for r in depth_arr] for depth_arr in year_arr] for year_arr in tile_arr] for
                                tile_arr in n_list]}
                        db_dict['acgmap_cryogriddata'].update(n_value)

                if type(db_dict):
                    for table_names in db_dict:
                        # get table name
                        sql_string += 'INSERT INTO {} '.format(table_names)
                        columns = []
                        # store column names into array
                        for key in db_dict[table_names]:
                            columns.append(key.lower())
                        print("\ncolumn names:", columns)

                        sql_string += "(" + ', '.join(columns) + ")\nVALUES ("

                        for col_names, records in db_dict[table_names].items():
                            # tuple of column name (eg: TIME) and data array
                            print('value: ', col_names, 'type: ', type(records))
                            # join the list of values and enclose record in parenthesis
                            if len(records) <= 1:
                                for r in records:
                                    sql_string += "\'" + str(r) + "\',\n"
                            else:
                                sql_string += "'{" + ', '.join(str(r) for r in records) + "}',\n"

                        # remove the last comma and end statement with a semicolon
                        sql_string = sql_string[:-2] + ");"
                sql_string = sql_string.replace("[", "{")
                sql_string = sql_string.replace("]", "}")
                print('______________________________________saved__________________________________________')
                persist_to_db(sql_string)

                # with open(data_file_name, 'w', encoding='utf-8') as output_file:
                #   output_file.write(sql_string)


def forcing_to_db():
    path_to_forcing = 'N:/permarisk/input/data/scr/FORCING_rcp2_6_JSONfiles'
    table_names = ['acgmap_forcingdata']

    for filename in os.listdir(path_to_forcing):
        if filename.endswith('.json'):
            with open(os.path.join(path_to_forcing, filename)) as json_data:
                db_dict = {'acgmap_forcingdata': {}}

                record_list = json.load(json_data)['data']
                now = datetime.now()
                dt_string = now.strftime("%d-%m-%Y_%H-%M-%S")
                print('date and time: ', dt_string)
                sql_string = ''

                record_name = filename.removesuffix('.json')
                record_list["NAME"] = [record_name]
                # getting grid center coords from file name -> based on the assumption that the first eight numbers are the center
                lat_long_list = record_name.split('_')
                print('lat_long_list: ', lat_long_list)
                long = float(lat_long_list[2])
                lat = float(lat_long_list[3])
                if long > 180.0:
                    long = 180.0 - long
                record_list["LAT"] = [lat]
                record_list["LONG"] = [long]
                record_list["CREATED_AT"] = [now.strftime('%Y-%m-%d_%H:%M:%S')]
                record_list["MODIFIED_AT"] = [now.strftime('%Y-%m-%d_%H:%M:%S')]

                # calculation of coordinates for german grid map
                top = float(lat)
                bottom = float(lat) - 1.0
                left = float(long)
                right = float(long) + 1.0
                db_grid_id = get_grid_id(top, right)
                print('coords: (', top, ', ', right, ') have grid id: ', db_grid_id)
                record_list["GRID_ID"] = [db_grid_id]

                # adding name and grid id to forcingdata sql list
                db_dict['acgmap_forcingdata'].update({"NAME": [record_name]})
                db_dict['acgmap_forcingdata'].update({"GRID_ID": [db_grid_id]})
                db_dict['acgmap_forcingdata'].update({"CREATED_AT": [now.strftime('%Y-%m-%d_%H:%M:%S')]})
                db_dict['acgmap_forcingdata'].update({"MODIFIED_AT": [now.strftime('%Y-%m-%d_%H:%M:%S')]})

                data_file_name = os.path.join("../GM_Data/", record_name + '.sql')
                print('record of: ', data_file_name)

                for record in record_list:
                    value = {record: record_list[record]}
                    print('record value: ', record)
                    if record == 'Tair':
                        value = {record: [round(r, 3) for r in record_list[record]]}
                        db_dict['acgmap_forcingdata'].update(value)

                if type(db_dict):
                    for table_names in db_dict:
                        # get table name
                        sql_string += 'INSERT INTO {} '.format(table_names)
                        columns = []
                        # store column names into array
                        for key in db_dict[table_names]:
                            columns.append(key.lower())
                        print("\ncolumn names:", columns)

                        sql_string += "(" + ', '.join(columns) + ")\nVALUES ("

                        for col_names, records in db_dict[table_names].items():
                            # tuple of column name (eg: TIME) and data array
                            print('value: ', col_names, 'type: ', type(records))
                            # join the list of values and enclose record in parenthesis
                            if len(records) <= 1:
                                for r in records:
                                    sql_string += "\'" + r + "\',\n"
                            else:
                                sql_string += "'{" + ', '.join(str(r) for r in records) + "}',\n"

                        # remove the last comma and end statement with a semicolon
                        sql_string = sql_string[:-2] + ");"
            print('________________________________________________________________________________')
            persist_to_db(sql_string)

            with open(data_file_name, 'w', encoding='utf-8') as output_file:
                output_file.write(sql_string)


def cryogriddata_to_db():
    path_to_data = 'N:/netscratch/jnitzbon/ArcticEnsemble/output/RESULT_XRNCfiles_1600-2020_nEns100'
    table_names = ['acgmap_cryogriddata']

    for filename in os.listdir(path_to_data):
        if not filename.endswith('reduced.nc'):
            with xr.open_dataset(os.path.join(path_to_data, filename)) as net_data:
                print('net data opend with xarray: ', net_data)
                arc_var = net_data.variables
                db_dict = {'acgmap_cryogriddata': {}}
                record_list = {}
                now = datetime.now()

                sql_string = ''
                for vr in list(arc_var):
                    # to do: add record entries of netcdf file bzw. xarray values here; only necessary ones start from line 245!
                    if vr == 'T_av_all' or vr == 'T_min_all' or vr == 'T_max_all':
                        print('shape of: ', vr, ' : ', arc_var[vr].values.shape)
                        vr_arr = arc_var[vr].squeeze("longitude").squeeze("latitude")  # values.shape = 101x421x72
                        rev = vr + '_rev'  # entry at [0]
                        m = vr + '_51'  # entry at [1:51]
                        n = vr + '_101'  # entry at [51:100]
                        rev_list = [vr_arr.values[0, :, :]]
                        m_list = [vr_arr.values[1:51, :, :]]
                        n_list = [vr_arr.values[51:100, :, :]]
                        record_list[rev] = [vr_arr.values[0, :, :]]
                        record_list[m] = [vr_arr.values[1:51, :, :]]
                        record_list[n] = [vr_arr.values[51:100, :, :]]
                        print('data type of lists: ', type(rev_list[0]), type(m_list[0]), type(n_list[0]))
                        print('length of lists: ', len(rev_list[0]), len(m_list[0]), len(n_list[0]))
                    # record_list[vr] = [arc_var[vr][:]]

                record_name = filename.removesuffix('.nc')
                # print('record_name', record_name)
                record_list["NAME"] = [record_name]
                # getting grid center coords from file name -> based on the assumption that the last six numbers are the ULC
                lat_long_list = record_name.split('_')
                long = float(lat_long_list[2])
                lat = float(lat_long_list[3])
                if long > 180.0:
                    long = 180.0 - long
                record_list["LAT"] = [lat]
                record_list["LONG"] = [long]
                record_list["CREATED_AT"] = [now.strftime('%Y-%m-%d_%H:%M:%S')]
                record_list["MODIFIED_AT"] = [now.strftime('%Y-%m-%d_%H:%M:%S')]

                # calculation of coordinates for german grid map
                top = float(lat)
                bottom = float(lat) - 1
                left = float(long)
                right = float(long) + 1
                print(' top: ', top, ' bottom: ', bottom, ' left: ', left, ' right: ', right)
                db_grid_id = get_grid_id(top, right)
                print('coords: (', top, ', ', right, ') have grid id: ', db_grid_id)
                record_list["GRID_ID"] = [db_grid_id]

                # adding name and grid id to forcingdata sql list
                db_dict['acgmap_cryogriddata'].update({"NAME": [record_name]})
                db_dict['acgmap_cryogriddata'].update({"GRID_ID": [db_grid_id]})
                db_dict['acgmap_cryogriddata'].update({"CREATED_AT": [now.strftime('%Y-%m-%d_%H:%M:%S')]})
                db_dict['acgmap_cryogriddata'].update({"MODIFIED_AT": [now.strftime('%Y-%m-%d_%H:%M:%S')]})

                data_file_name = os.path.join("./GM_data/cryodata_sql", record_name + '.sql')
                print('record of: ', data_file_name)

                for record in record_list:
                    # store xarray data in dict
                    if type(record_list[record][0]) is numpy.ndarray:
                        rec_list = list(record_list[record][0])
                        entry = {record: rec_list}
                        db_dict['acgmap_cryogriddata'].update(entry)

                if type(db_dict):
                    for table_names in db_dict:
                        # get table name
                        sql_string += 'INSERT INTO {} '.format(table_names)
                        columns = []
                        # store column names into array
                        for key in db_dict[table_names]:
                            columns.append(key.lower())
                        print("\ncolumn names:", columns)

                        sql_string += "(" + ', '.join(columns) + ")\nVALUES ("

                        for col_names, records in db_dict[table_names].items():
                            # tuple of column name (eg: TIME) and data array
                            print('value: ', col_names, 'len: ', len(records))

                            # join the list of values and enclose record in parenthesis
                            for r in records:
                                print('type of r: ', type(r))
                                if type(r) is str:
                                    print('col_names: ', col_names, 'records: ', len(r))
                                    sql_string += "\'" + r + "\',\n"
                                else:
                                    sql_string += "\'{" + ', '.join(str(r) for r in records) + "}\',\n"
                                    print('dim of', col_names)  # 421 x 72

                        # remove the last comma and end statement with a semicolon
                        sql_string = sql_string[:-2] + ");"
                sql_string = sql_string.replace("[", "{")
                sql_string = sql_string.replace("]", "}")
                # persist_to_db(sql_string)

                with open(data_file_name, 'w') as output_file:
                    output_file.write(sql_string)


def depth_lvl_to_db():
    record_name = 'RESULTS_ULC_006_062_depth_lvl'
    data_file_name = os.path.join("../GM_Data/", record_name + '.sql')

    sql_string = 'INSERT INTO acgmap_depthlevel (z_level) VALUES'  # model has to be changed to string?
    data = Dataset(
        'N:/netscratch/jnitzbon/ArcticEnsemble/output/RESULT_XRNCfiles_1600-2020_nEns100/RESULTS_ULC_006_062.nc')
    data_vars = data.variables
    depth_lvl = data_vars["depth"]

    for lvl in depth_lvl:
        sql_string += "(\'" + str(lvl) + "\'),\n"
    sql_string = sql_string[:-2] + ";"
    print('sql: ', sql_string)
    print('______________________________________________________________________')
    persist_to_db(sql_string)
    with open(data_file_name, 'w') as output_file:
        output_file.write(sql_string)


def year_to_db():
    record_name = 'RESULTS_ULC_006_062_date'
    data_file_name = os.path.join("../GM_Data/", record_name + '.sql')

    sql_string = 'INSERT INTO acgmap_date (YEAR) VALUES'  # model has to be changed to string?
    data = Dataset(
        'N:/netscratch/jnitzbon/ArcticEnsemble/output/RESULT_XRNCfiles_1600-2020_nEns100/RESULTS_ULC_006_062_reduced.nc')
    data_vars = data.variables
    years = data_vars["time"]

    for y in years:
        sql_string += "(\'" + str(y) + "-01-01\'),\n"
    sql_string = sql_string[:-2] + ";"
    print('sql: ', sql_string)
    print('______________________________________________________________________')
    persist_to_db(sql_string)

    with open(data_file_name, 'w') as output_file:
        output_file.write(sql_string)


if __name__ == "__main__":
    # year_to_db()
    # forcing_to_db()
    # depth_lvl_to_db()
    cryogriddata_to_db_json()
    # cryogriddata_to_db()
    #file_name = os.path.join("./GM_Data/test.sql")
    #rootgrp = Dataset(
    #    'N:/netscratch/jnitzbon/ArcticEnsemble/output/RESULT_XRNCfiles_1600-2020_nEns100/RESULTS_ULC_006_062.nc')
    #des = rootgrp.variables
    #v = des["T_max_all"][1][0][0][0][0]
    #time = des["time"]

    #print(rootgrp)
    #print('______________________________________________________________________')
    #print('description: ', des.keys())
    #print('______________________________________________________________________')
    #print('T_MAX_ALL: ', v)
    #print('______________________________________________________________________')
    #print('Time: ', time)
