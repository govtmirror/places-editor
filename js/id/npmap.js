iD.npmap = {
   settings: {
       connection: {
           api: 'http://localhost',
           oauth: {
               url: 'http://localhost',
               consumerKey: 'consumer_key',
               secret: 'consumer_secret'
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
