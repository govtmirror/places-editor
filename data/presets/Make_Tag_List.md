The places snapshot database has a table of all the tags used in the iD presets. 
This table is created with

`make_tag_list.sh pgsnapshot [owner]`

Where `pgsnapshot` is the name of the pgsnapshot database, 
and `owner` is the name of the owner for the new table. 
The default owner is `osm`.

`make_tag_list.sh` must be run by a user with suitable permissions

The iD `make` process is required first to create the `presets.json`
