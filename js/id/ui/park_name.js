iD.ui.ParkName = function (context) {
  var map = context.map();

  return function (selection) {
    var txt = selection.append('div')
      .attr('class', 'park-name-text');

    map.on('overpark', function (d) {
      // the overpark feature is currently disabled
      return;
      // if (d) {
      //   // Over a park
      //   txt.text(d);
      //   selection
      //     .style('display', '')
      //     .style('opacity', 1);
      // } else {
      //   // Not over a park
      //   selection
      //     .style('opacity', 0)
      //     .style('display', 'none');
      //   txt.text('');
      // }
    });
  };
};
