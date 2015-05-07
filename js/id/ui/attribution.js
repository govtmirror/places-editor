iD.ui.Attribution = function(context) {
    var selection;

    function attribution(data, klass) {
        var div = selection.selectAll('.' + klass)
            .data([0]);

        div.enter()
            .append('div')
            .attr('class', klass);

        var background = div.selectAll('.attribution')
            .data(data, function(d) { return d.name(); });

        background.enter()
            .append('span')
            .attr('class', 'attribution')
            .each(function(d) {
                if (d.terms_html) {
                    d3.select(this)
                        .html(d.terms_html);
                    return;
                }

                var source = d.terms_text || d.id || d.name();

                if (d.logo) {
                    source = '<img class="source-image" src="' + context.imagePath(d.logo) + '">';
                }

                if (d.terms_url) {
                    d3.select(this)
                        .append('a')
                        .attr('href', d.terms_url)
                        .attr('target', '_blank')
                        .html(source);
                } else {
                    d3.select(this)
                        .text(source);
                }
            });

        background.exit()
            .remove();

        var copyright = background.selectAll('.copyright-notice')
            .data(function(d) {
                var notice = d.copyrightNotices(context.map().zoom(), context.map().extent());
                return notice ? [notice] : [];
            });

        copyright.enter()
            .append('span')
            .attr('class', 'copyright-notice');

        copyright.text(String);

        copyright.exit()
            .remove();
    }

    function update() {
        attribution([context.background().baseLayerSource()], 'base-layer-attribution');
        attribution(context.background().overlayLayerSources().filter(function (s) {
            return s.validZoom(context.map().zoom());
        }), 'overlay-layer-attribution');

        // Get the unit code
        d3.json(iD.npmap.settings.connection.api + '/api/data/park/' + context.map().center()[0] + '/' + context.map().center()[1] + '/1.json?suppress_status_codes=true', function(error, json) {
            if (error || !json || !json.osm || (json.osm && json.osm.error)) {
                d3.select('.current-park').style('display', 'none');
            } else {
                d3.select('.current-park').style('display', 'block');
                d3.select('.current-park-name').text(json.osm.short_name);
                d3.select('.current-park-name').attr('full-name', json.osm.long_name);
                d3.select('.current-park').select('a').attr('href', 'http://nps.gov/' + json.osm.unit_code);
            }
        });
    }

    return function(select) {
        selection = select;

        context.background()
            .on('change.attribution', update);

        context.map()
            .on('move.attribution', _.throttle(update, 400, {leading: false}));

        update();
    };
};
