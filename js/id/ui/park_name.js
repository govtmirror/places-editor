iD.ui.ParkName = function (context) {
  var map = context.map();

  return function (selection) {
    var txt = selection.append('div')
      .attr('class', 'park-name-text');

    map.on('overpark', function (d) {
      if (d) {
        // Over a park
        txt.text(d);
        selection
          .style('display', '')
          .transition()
          .style('opacity', 1);
      } else {
        // Not over a park
        selection
          .transition()
          .style('opacity', 0)
          .each('end', function (d) {
            selection
              .style('display', 'none');
            txt.text('');
          });
      }
    });
  };
};
