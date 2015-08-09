iD.npmap = {
    "settings": {
        "connection": {
            "api": "http://10.147.153.193",
            "oauth": {
                "consumerKey": "{{secrets.oauth.iD.consumerKey}}",
                "external": false,
                "secret": "{{secrets.oauth.iD.consumerSecret}}",
                "url": "http://10.147.153.193"
            }
        },
        "editing": {
            "area": true,
            "line": true,
            "minZoom": 15.5,
            "point": true
        },
        "locationOverlayMaxZoom": 22,
        "map": {
            "center": [
                -77.0228,
                38.8944
            ],
            "defaultBackground": "mapbox-satellite",
            "zoom": 15.01
        },
        "tags": {
            "disabledFields": [
                "nps:building_id",
                "nps:fcat",
                "nps:feature_id",
                "nps:geometry_id",
                "nps:source_system",
                "nps:source_system_key",
                "nps:source_system_key_value"
            ],
            "uninterestingFields": [
                "attribution",
                "created_by",
                "nps:unit_code",
                "odbl",
                "source"
            ]
        }
    }
};
