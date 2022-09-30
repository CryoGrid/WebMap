# import Python's built-in JSON library
import json
import os
import zipfile
import numpy as np
from datetime import datetime

# import the psycopg2 database adapter for PostgreSQL

# use Python's open() function to load the JSON data
from psycopg2 import connect, Error


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
directory_to_extract_to = "./GM_Data/output"  # will be extracted into working dir of this script
'''
with zipfile.ZipFile(path_to_zip_file, 'r') as zip_ref:
    zip_ref.extractall(directory_to_extract_to)

print('Extract all files in ZIP ', path_to_zip_file, ' to ', directory_to_extract_to)
'''
table_names = ['cgmap_forcingdata', 'cgmap_soiltype', 'cgmap_soilcharacteristics', 'cgmap_cryogriddata', 'cgmap_date']
date_entry_created = False

for filename in os.listdir(directory_to_extract_to):
    if filename.endswith('.json'):
        with open(os.path.join(directory_to_extract_to, filename)) as json_data:
            if date_entry_created is False:
                db_dict = {'cgmap_forcingdata': {}, 'cgmap_cryogriddata': {}, 'cgmap_date': {}}
            else:
                db_dict = {'cgmap_forcingdata': {}, 'cgmap_cryogriddata': {}}
            print('was date entry created? ', date_entry_created)

            record_list = json.load(json_data)
            now = datetime.now()
            dt_string = now.strftime("%d-%m-%Y_%H-%M-%S")
            print('date and time: ', dt_string)
            sql_string = ''

            record_name = filename.removesuffix('.json')
            record_list["NAME"] = [record_name]
            record_list["MODIFIED_AT"] = [now.strftime('%Y-%m-%d_%H:%M:%S')]

            # adding name and grid id to forcingdata sql list
            db_dict['cgmap_forcingdata'].update({"NAME": [record_name]})
            db_dict['cgmap_forcingdata'].update({"MODIFIED_AT": [now.strftime('%Y-%m-%d_%H:%M:%S')]})

            data_file_name = os.path.join("./GM_DB_Update/", record_name + '.sql')
            print('record of: ', record_name)
            # print('dict: ', db_dict['cgmap_cryogriddata'])

            # iterating through file to separate forcingdata and cryogriddata
            for record in record_list:
                value = {record: record_list[record]}
                # print('record value: ', record)
                if record == 'TAIR':
                    value = {record: [round(r, 3) for r in record_list[record]]}
                    db_dict['cgmap_forcingdata'].update(value)
                elif record == 'TIME' and date_entry_created is False:
                    db_dict['cgmap_date'].update(value)
                    # print('db_dict: ', type(db_dict['cgmap_date']))
                    date_entry_created = True
                elif record != 'TIME':
                    if record == 'T_out':
                        for idx, r in enumerate(record_list[record]):
                            record_list[record][idx] = [round(v, 3) for v in r]
                        value = {record: record_list[record]}
                    db_dict['cgmap_cryogriddata'].update(value)

            if type(db_dict):
                for table_names in db_dict:
                    # get table name

                    for col_names, records in db_dict[table_names].items():
                        # tuple of column name (eg: TIME) and data array
                        # print('value: ', col_names, 'type: ', type(records))

                        # join the list of values and enclose record in parenthesis

                        if col_names == 'TIME':
                            sql_string += 'DROP TABLE {}; \n'.format(col_names)
                            sql_string += 'INSERT INTO {} ({}) VALUES '.format(table_names, col_names)
                            # sql_string += 'UPDATE {} SET {} ='.format(table_names, col_names)
                            for r in records:
                                sql_string += "(\'" + r + "\'),"
                            sql_string += ';'

                        if len(records) <= 1 and col_names != 'NAME':
                            sql_string += 'UPDATE {} SET {} ='.format(table_names, col_names)
                            for r in records:
                                sql_string += "\'" + r + "\'"
                            sql_string += ' WHERE name = \'' + record_name + '\';\n'

                        if col_names == 'TAIR' or col_names == 'T_out':
                            sql_string += 'UPDATE {} SET {} ='.format(table_names, col_names)
                            sql_string += "'{" + ', '.join(str(r) for r in records) + "}'"
                            sql_string += ' WHERE name = \'' + record_name + '\';\n'
        sql_string = sql_string.replace("[", "{")
        sql_string = sql_string.replace("T_out", "TSOIL")
        sql_string = sql_string.replace(", nan]", "}")

        print('________________________________________________________________________________')
        # persist_to_db(sql_string)

        with open(data_file_name, 'w') as output_file:
            output_file.write(sql_string)