iD.ui.EditAlert = function (context) {
  var map = context.map();

  return function (selection) {
    var mainText = 'Editing Disabled';
    var main = selection.append('div')
      .attr('class', 'edit-alert-main');
    var message = selection.append('div')
      .attr('class', 'edit-alert-text');

    map.on('editalert', function (messageText, parkName) {
      main.text(mainText + (parkName ? ' for ' + parkName : ''));
      if (map.isLocked() && map.editable()) {
        message.html(messageText || '');
        selection
          .style('display', 'block')
          .style('opacity', 1);

        if (!map.isLocked()) {
          selection
            .transition()
            .delay(1250)
            .style('opacity', 0)
            .each('end', function (d) {
              selection
                .style('display', 'none');
              message.text('');
            });
        }
      } else {
        selection
          .style('opacity', 0);
        selection
          .style('display', 'none');
        message.text('');
      }
    });
  };
};
