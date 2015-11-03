iD.ui.Modes = function(context) {
    var modes = [];
    if (iD.npmap.settings.editing.point) {modes.push(iD.modes.AddPoint(context));}
    if (iD.npmap.settings.editing.line) {modes.push(iD.modes.AddLine(context));}
    if (iD.npmap.settings.editing.area) {modes.push(iD.modes.AddArea(context));}

    function editable() {
        return context.editable() && context.mode().id !== 'save';
    }

    return function(selection) {
        var buttons = selection.selectAll('button.add-button')
            .data(modes);

       buttons.enter().append('button')
           .attr('tabindex', -1)
           .attr('class', function(mode) { return mode.id + ' add-button col4'; })
           .on('click.mode-buttons', function(mode) {
               if (mode.id === context.mode().id) {
                   context.enter(iD.modes.Browse(context));
               } else {
                   context.enter(mode);
               }
           })
           .call(bootstrap.tooltip()
               .placement('bottom')
               .html(true)
               .title(function(mode) {
                   return iD.ui.tooltipHtml(mode.description, mode.key);
               }));

        context.map()
            .on('move.modes', _.debounce(update, 500));

        context
            .on('enter.modes', update);

        buttons.append('span')
            .attr('class', function(mode) { return mode.id + ' icon icon-pre-text'; });

        buttons.append('span')
            .attr('class', 'label')
            .text(function(mode) { return mode.title; });

        context.on('enter.editor', function(entered) {
            buttons.classed('active', function(mode) { return entered.button === mode.button; });
            context.container()
                .classed('mode-' + entered.id, true);
        });

        context.on('exit.editor', function(exited) {
            context.container()
                .classed('mode-' + exited.id, false);
        });

        var keybinding = d3.keybinding('mode-buttons');

        modes.forEach(function(m) {
            keybinding.on(m.key, function() { if (editable()) context.enter(m); });
        });

        d3.select(document)
            .call(keybinding);

        function update() {
            buttons.property('disabled', !editable());

            /* Other items not available in edit mode */
            var attrib = d3.select('#content #attrib'),
              attribs = {
                'base-layer-attribution': true,
                'preview-layer-attribution': false,
                'overlay-layer-attribution': true
              },
              bar = d3.select('#bar'),
              mapInMap = d3.select('#content .map-in-map'),
              parkName = d3.select('.park-name'),
              controls = ['limiter', 'background-control','map-data-control','help-control'];

              bar.style('background-color', editable() ? '' : 'transparent');
              for (var i = 0; i < controls.length; i++) {
                bar.select('.' + controls[i]).style('display', editable() ? 'block' : 'none');
              }
              mapInMap.style('top', editable() ? '' : '0px');
              parkName.style('top', editable() ? '56px' : '-4px');

              for (var attr in attribs) {
                attrib.select('.' + attr).style('display', (editable() && attribs[attr]) || (!editable() && !attribs[attr]) ? 'block' : 'none');
              }

        }
    };
};
