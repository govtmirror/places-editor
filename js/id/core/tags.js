iD.oneWayTags = {
    'aerialway': {
        'chair_lift': true,
        'mixed_lift': true,
        't-bar': true,
        'j-bar': true,
        'platter': true,
        'rope_tow': true,
        'magic_carpet': true,
        'yes': true
    },
    'highway': {
        'motorway': true,
        'motorway_link': true
    },
    'junction': {
        'roundabout': true
    },
    'man_made': {
        'piste:halfpipe': true
    },
    'piste:type': {
        'downhill': true,
        'sled': true,
        'yes': true
    },
    'waterway': {
        'river': true,
        'stream': true
    }
};

iD.interestingTag = function (key) {
    // These are the tags that are hardcoded into iD as being uninteresting
    var idUninterestingTags = ['attribution', 'created_by', 'source', 'odbl'];

    // All of the npmap disabled tags are also 'uninteresting', as at the uninteresting tags
    return [].concat(
        iD.npmap.settings.tags.disabledFields,
        iD.npmap.settings.tags.uninterestingFields,
        idUninterestingTags
      ).indexOf(key) === -1 &&
      key.indexOf('tiger:') !== 0;
};
