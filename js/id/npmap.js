iD.npmap = {
   settings: {
       connection: {
          api: 'http://10.147.153.193',
          oauth: {
              external: false,
              url: 'http://10.147.153.193',
              consumerKey: 'CpIont3biEafgafInTYWkFlooQkcFLtGREu6yMG0',
              secret: 'MFgSWe00v8EsddR9KI42uZZX61r2XL8JwEPxHY2p'
          }
      },
      editing: {
           area: true,
           disabledFields: [
             'nps:places_uuid',
             'nps:building_id',
             'nps:fcat'
           ],
           line: true,
           minZoom: 15,
           point: true
       },
       locationOverlayMaxZoom: 22,
       map: {
           center: [
               -77.0228,
               38.8944
           ],
           defaultBackground: 'mapbox-satellite',
           zoom: 15.01
       },
       tags: {
           disabledFields: [
               'nps:building_id',
               'nps:fcat',
               'nps:places_id'
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
