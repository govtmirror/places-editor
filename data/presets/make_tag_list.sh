if [ -z "$1" ]
then
    echo "You need to provide the name of the places snapshot database"
    exit 1
fi

owner=osm
if [ "$2" ]
then
	owner=$2
fi

if [ ! -f "presets.json" ]
then
    echo "You must build iD with 'make' first."
    exit 1
fi

node json_to_sql
psql -f presets_table.sql $1 $owner
psql -f presets.sql $1 $owner
