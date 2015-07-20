/* globals $, alertify, App, buildDeleteQuery, buildInsertQuery, devMode, saveToCartoDb, user */
/* jshint camelcase: false */

App.categories = (function() {
  var hidden = [
      'AR'
    ],
    unorderable = [
      'Highlights',
      'Favorites',
      'Nearby'
    ];

  function appendRow(data) {
    var orderable = unorderable.indexOf(data.name) === -1;

    $('tbody').append('' +
      '<tr class="' + (orderable ? '' : 'un') + 'orderable" id="' + data.cartodb_id + '">' +
        '<td>' + data.name + '</td>' +
        '<td>' +
          (data.name === 'Highlights' || orderable ? '' +
            '<div class="btn-group">' +
              '<button class="btn btn-default" title="Edit Category" type="button">' +
                '<span class="fa fa-pencil"></span>' +
              '</button>' +
              (data.name === 'Highlights' ? '' : '' +
              '<button class="btn btn-danger" title="Delete Category" type="button">' +
                '<span class="fa fa-trash"></span>' +
              '</button>') +
            '</div>' +
          '' : '<div style="height:34px;"></div>') +
        '</td>' +
      '</tr>' +
    '');
    $('#' + data.cartodb_id + ' .btn').on('mousedown', function(e) {
      e.stopPropagation();
    });
    $('#' + data.cartodb_id + ' .btn-default').click(function() {
      App.updateHash(App.park.unit_code + '/categories/' + data.cartodb_id);
    });
    $('#' + data.cartodb_id + ' .btn-danger')
      .popover({
        container: 'body',
        content: '' +
          '<p>Click "Delete" to confirm. Once deleted, you cannot get this category back.</p>' +
          '<div style="text-align:center;">' +
            '<button class="btn btn-default" onclick="App.categories.handlePopoverHide(' + data.cartodb_id + ');" style="margin-right:5px;" type="button">Cancel</button>' +
            '<button class="btn btn-primary" onclick="App.categories.handlePopoverHide(' + data.cartodb_id + ',true);" type="button">Delete</button></div>' +
          '</div>' +
        '',
        html: true,
        trigger: 'manual'
      })
      .on('hidden.bs.popover', function() {
        $('body .delete-backdrop').remove();
      })
      .on('shown.bs.popover', function() {
        $('body').append('<div class="delete-backdrop in modal-backdrop" style="z-index:1059;"></div>');
      });
    $('#' + data.cartodb_id + ' .btn-danger').click(function() {
      $(this).popover('show');
    });
  }
  function saveOrder(successMsg) {
    if ($('tbody tr').length) {
      var query = 'UPDATE places_mobile_categories' + (devMode ? '_dev' : '') + ' o SET display_order=n.display_order FROM (VALUES ';

      $('tbody tr').each(function(i, row) {
        query += '(' + $(row).attr('id') + ',' + (i + 1) + '),';
      });
      query = query.slice(0, query.length - 1);
      query += ') n (cartodb_id,display_order) WHERE o.cartodb_id=n.cartodb_id;';
      saveToCartoDb(function(data) {
        if (data && data.total_rows) {
          successMsg = successMsg || 'The order was successfully saved!';
          alertify.success(successMsg);
        } else {
          alertify.error('The order could not be saved!');
        }
      }, query);
    }
  }
  function setupDom(data) {
    if (data && data.rows && data.rows.length) {
      $('#categories').show();
      $.each(data.rows, function(i, row) {
        if (hidden.indexOf(row.name === -1)) {
          appendRow(row);
        }
      });
    } else {
      $('#empty').show();
    }

    $('.action-buttons .btn-default').click(function() {
      App.updateHash(App.park.unit_code + '/categories/create');
    });
    $('.table').sortable({
      containerSelector: 'table',
      itemPath: '> tbody',
      itemSelector: 'tr.orderable',
      placeholder: '<tr class="placeholder"/>',
      onDragStart: function(item, group, _super) {
        var $item = $(item);

        $item.parent().parent().removeClass('table-striped');
        $item.css('background-color', '#f9f9f9');
        $($item.children('td')[1]).hide();
        _super(item);
      },
      onDrop: function(item, container, _super) {
        var $item = $(item);

        $item.css('background-color', '');
        $item.parent().parent().addClass('table-striped');
        $($item.children('td')[1]).show();
        _super(item);
        saveOrder();
      }
    });
  }

  return {
    handleDeleteCategory: function(cartodb_id) {
      saveToCartoDb(function(response) {
        if (response && response.total_rows) {
          $('#' + cartodb_id).remove();
          saveOrder('The category was successfully deleted!');
        } else {
          alertify.error('The category could not be deleted.');
        }
      }, buildDeleteQuery('places_mobile_categories', 'WHERE cartodb_id=' + cartodb_id));
    },
    handlePopoverHide: function(cartodb_id, del) {
      $('#' + cartodb_id + ' .btn-danger').popover('hide');

      if (del) {
        App.categories.handleDeleteCategory(cartodb_id);
      }

      return false;
    },
    init: function(callback) {
      if (App.id === null) {
        $.ajax({
          data: {
            q: 'SELECT * FROM places_mobile_categories' + (devMode ? '_dev' : '') + '  WHERE unit_code = \'' + App.park.unit_code + '\' ORDER BY display_order'
          },
          dataType: 'json',
          success: function(data) {
            setupDom(data);
            callback();
          },
          url: 'https://nps.cartodb.com/api/v2/sql'
        });
      }
    }
  };
})();
