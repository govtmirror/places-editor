/* globals App, user */

App.parks = (function() {
  return {
    init: function(callback) {
      if (user.placesmobileSuperUser) {
        $('.action-buttons').show();
        $('.action-buttons .btn-default').click(function() {
          App.updateHash('create');
          return false;
        });
      }

      callback();
    }
  };
})();
