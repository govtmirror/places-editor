/* globals iD */

iD.npmap = {
  settings: {
    connection: {
      api: 'http://10.147.153.193',
      oauth: {
        consumerKey: 'CpIont3biEafgafInTYWkFlooQkcFLtGREu6yMG0',
        external: false,
        secret: 'MFgSWe00v8EsddR9KI42uZZX61r2XL8JwEPxHY2p',
        url: 'http://10.147.153.193'
      }
    },
    editing: {
      area: true,
      disabledFields: [
        'nps:building_id',
        'nps:fcat',
        'nps:feature_id',
        'nps:geometry_id',
        'nps:source_system',
        'nps:source_system_key',
        'nps:source_system_key_value'
      ],
      line: true,
      minZoom: 15.5,
      point: true
    },
    locationOverlayMaxZoom: 22,
    map: {
      center: [
        -99.00,
        39.00
      ],
      defaultBackground: 'mapbox-satellite',
      zoom: 4.00
    },
    tags: {
      disabledFields: [
        'nps:building_id',
        'nps:fcat',
        'nps:feature_id',
        'nps:geometry_id',
        'nps:source_system',
        'nps:source_system_key',
        'nps:source_system_key_value'
      ],
      uninterestingFields: [
        'attribution',
        'created_by',
        'nps:unit_code',
        'odbl',
        'source'
      ]
    }
  }
};
