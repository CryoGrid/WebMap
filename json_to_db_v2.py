# import Python's built-in JSON library
import json
import os
import zipfile
import numpy as np
from datetime import datetime

# import the psycopg2 database adapter for PostgreSQL

# use Python's open() function to load the JSON data
from psycopg2 import connect, Error


def get_grid_id(top_coord, right_coord):
    sql_string_grid_id = 'SELECT id FROM cgmap_mapgrid WHERE top = ' + str(
        top_coord) + ' AND cgmap_mapgrid.right = ' + str(right_coord)

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
            grid_id = cur.fetchone()

            print('\nfinished SELECT FROM execution')
            return str(int(grid_id[0]))

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

            print('\nfinished INSERT INTO execution')

        except (Exception, Error) as error:
            print("\nexecute_sql() error:", error)
            conn.rollback()

        # close the cursor and connection
        cur.close()
        conn.close()


path_to_zip_file = "./Data/CG3_Germany.zip"  # please adjust link to your cryo grid zip file
directory_to_extract_to = "./CG_GermanyGridData"  # will be extracted into working dir of this script
'''
with zipfile.ZipFile(path_to_zip_file, 'r') as zip_ref:
    zip_ref.extractall(directory_to_extract_to)

print('Extract all files in ZIP ', path_to_zip_file, ' to ', directory_to_extract_to)
'''
table_names = ['cgmap_forcingdata', 'cgmap_soiltype', 'cgmap_soilcharacteristics', 'cgmap_cryogriddata', 'cgmap_date']

half_length = 0.125
date_entry_created = True

for filename in os.listdir(directory_to_extract_to):
    if filename.endswith('.json'):
        with open(os.path.join(directory_to_extract_to, filename)) as json_data:
            if date_entry_created is False:
                db_dict = {'cgmap_forcingdata': {}, 'cgmap_cryogriddata': {}, 'cgmap_date': {}}
            else:
                db_dict = {'cgmap_forcingdata': {}, 'cgmap_cryogriddata': {}}
            print('was date entry created? ', date_entry_created)
            # content = json_data.read()
            record_list = json.load(json_data)
            now = datetime.now()
            dt_string = now.strftime("%d-%m-%Y_%H-%M-%S")
            print('date and time: ', dt_string)
            sql_string = ''

            record_name = filename.removesuffix('.json')
            record_list["NAME"] = [record_name]
            # getting grid center coords from file name -> based on the assumption that the first eight numbers are the center
            lat_long_list = record_name.split('_')
            print('lat_long_list: ', lat_long_list)
            lat = '.'.join(lat_long_list[1][i:i + 2] for i in range(0, len(lat_long_list[0]), 2))
            long = '.'.join(lat_long_list[2][i:i + 2] for i in range(0, len(lat_long_list[0]), 2))
            record_list["LAT"] = [lat]
            record_list["LONG"] = [long]
            record_list["CREATED_AT"] = [now.strftime('%Y-%m-%d_%H:%M:%S')]
            record_list["MODIFIED_AT"] = [now.strftime('%Y-%m-%d_%H:%M:%S')]

            # calculation of coordinates for german grid map
            top = float(lat) + half_length
            bottom = float(lat) - half_length
            left = float(long) - half_length
            right = float(long) + half_length
            db_grid_id = get_grid_id(top, right)
            print('coords: (', top, ', ', bottom, ') have grid id: ', db_grid_id)
            record_list["GRID_ID"] = [db_grid_id]

            # adding name and grid id to forcingdata sql list
            db_dict['cgmap_forcingdata'].update({"NAME": [record_name]})
            db_dict['cgmap_forcingdata'].update({"GRID_ID": [db_grid_id]})
            db_dict['cgmap_forcingdata'].update({"CREATED_AT": [now.strftime('%Y-%m-%d_%H:%M:%S')]})
            db_dict['cgmap_forcingdata'].update({"MODIFIED_AT": [now.strftime('%Y-%m-%d_%H:%M:%S')]})

            data_file_name = os.path.join("./DB_Uploads/", record_name + '.sql')
            print('record of: ', data_file_name)
            print('dict: ', db_dict['cgmap_cryogriddata'])

            # iterating through file to separate forcingdata and cryogriddata
            for record in record_list:
                value = {record: record_list[record]}
                print('record value: ', record)
                if record == 'TAIR':
                    value = {record: [round(r, 3) for r in record_list[record]]}
                    db_dict['cgmap_forcingdata'].update(value)
                elif record == 'TIME' and date_entry_created is False:
                    db_dict['cgmap_date'].update(value)
                    print('db_dict: ', type(db_dict['cgmap_date']))
                elif record != 'TIME':
                    if record == 'TSOIL':
                        for idx, r in enumerate(record_list[record]):
                            record_list[record][idx] = [round(v, 3) for v in r]
                        value = {record: record_list[record]}
                    db_dict['cgmap_cryogriddata'].update(value)

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
                        # sql_string += "(\'" + ', '.join(str(r) for r in records) + "\'),\n"

                        if col_names == 'TIME':
                            for r in records:
                                sql_string += "(\'" + r + "\'),\n"

                        if len(records) <= 1:
                            for r in records:
                                sql_string += "\'" + r + "\',\n"
                        else:
                            sql_string += "'{" + ', '.join(str(r) for r in records) + "}',\n"

                    # remove the last comma and end statement with a semicolon
                    sql_string = sql_string[:-2] + ");"
            date_entry_created = True
        sql_string = sql_string.replace("[", "{")
        sql_string = sql_string.replace("]", "}")
        print('________________________________________________________________________________')
        # persist_to_db(sql_string)

        with open(data_file_name, 'w') as output_file:
            output_file.write(sql_string)
