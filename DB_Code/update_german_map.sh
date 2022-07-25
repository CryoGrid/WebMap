#!/bin/bash
timestamp=$(date +%Y%m%d)

# create new entries in local db
python update_db_entry.py
wait
fname="db_dump" "$timestamp"
# create db dump
pg_dump -U postgres -t cgmap_cryogriddata -d postgres > fname
wait
scp -r fname lassmann@172.18.17.19:
expect "password"
send "59xI&'$'wA1)"
wait
USERNAME=lassmann
HOSTS="172.18.19"
SCRIPT="psql -U postgres -d cg_postgres < " fname ";
        psql -U postgres; \c cg_postgres;
        ALTER TABLE cgmap_cryogriddata OWNER TO cg_admin;
        REFRESH MATERIALIZED VIEW temperature_depth_level"
ssh -l ${USERNAME} ${HOSTS} "${SCRIPT}"
wait