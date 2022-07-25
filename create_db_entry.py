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

            print('\nfinished CREATE MATERIALIZED VIEW daily_temp_depth0')

        except (Exception, Error) as error:
            print("\nexecute_sql() error:", error)
            conn.rollback()

        # close the cursor and connection
        cur.close()
        conn.close()


def get_date_list():
    sql_string = 'SELECT * FROM cgmap_date'

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
            cur.execute(sql_string)
            dates_list = cur.fetchall()

            print('\nfinished SELECT FROM execution')
            return dates_list

        except (Exception, Error) as error:
            print("\nexecute_sql() error:", error)
            conn.rollback()

        # close the cursor and connection
        cur.close()
        conn.close()


def get_depth_array():
    sql_string = 'SELECT tsoil[1] FROM cgmap_cryogriddata'

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
            cur.execute(sql_string)
            depth_list = cur.fetchone()

            print('\nfinished SELECT FROM execution')
            return depth_list

        except (Exception, Error) as error:
            print("\nexecute_sql() error:", error)
            conn.rollback()

        # close the cursor and connection
        cur.close()
        conn.close()


def get_db_entry():
    sql_string = 'SELECT grid_id, tsoil FROM cgmap_cryogriddata'

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
            cur.execute(sql_string)
            depth_list = cur.fetchone()

            print('\nfinished SELECT FROM execution')
            return depth_list

        except (Exception, Error) as error:
            print("\nexecute_sql() error:", error)
            conn.rollback()

        # close the cursor and connection
        cur.close()
        conn.close()



sql_string_start = 'CREATE MATERIALIZED VIEW daily_temp_depth0 AS '
sql_string_cryogrid = 'SELECT grid_id z_level soil_characteristics tsoil[1] FROM cgmap_cryogriddata '
sql_string_forcing = 'SELECT tair precipitation FROM cgmap_forcingdata '
sql_string_date = 'SELECT date FROM cgmap_date '
sql_string_create_idx = 'CREATE UNIQUE INDEX daily_temp_idx ON daily_temp_depth(date, grid_id)'

#date_list = get_date_list()
#for idx, date in date_list:
 #   sql_string_date += 'id = ' + str(idx)
  #  print('index: ', idx, ' with date: ', date)


#print('____________________________________________________')
entry = get_db_entry()
entry0 = entry[0]
entry1 = entry[1]
print('db entry0: ', entry0, 'with type: ', type(entry0))
for idx, ele in enumerate(entry1):
    print('db entry1 with type: ', type(ele), ' and index: ', idx)

sql_string = 'CREATE MATERIALIZED VIEW tsoil AS SELECT tsoil FROM cgmap_cryogriddata'
sql_string_idx = 'CREATE UNIQUE INDEX tsoil_idx ON tsoil;'



