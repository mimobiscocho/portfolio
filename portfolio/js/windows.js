// js/windows.js — fenêtres dynamiques avec chargement de contenu

(function ($) {
  var zTop = 50;
  var winCount = 0;

  /* ─── Drag par le header ─── */
  function makeWindowDraggable($win) {
    var dragging = false, ox, oy, wx, wy;

    $win.find('.header').on('mousedown', function (e) {
      if ($(e.target).is('.close')) return;
      dragging = true;
      ox = e.clientX; oy = e.clientY;
      wx = parseInt($win.css('left')) || 0;
      wy = parseInt($win.css('top'))  || 0;
      e.preventDefault();
    });

    $(document).on('mousemove', function (e) {
      if (!dragging) return;
      $win.css({ left: (wx + e.clientX - ox) + 'px', top: (wy + e.clientY - oy) + 'px' });
    });

    $(document).on('mouseup', function () { dragging = false; });
  }

  /* ─── Créer ou ramener au premier plan une fenêtre ─── */
  function openWindow(id, opts) {
    var $win = $('#' + id);

    if ($win.length) {
      $('.finder.focus').removeClass('focus');
      $win.addClass('focus').css('z-index', ++zTop).show('fast');
      return { win: $win, isNew: false };
    }

    winCount++;
    var openCount = $('.finder:visible').length;
    var offset = (opts.noOffset) ? 0 : openCount * 22;
    var isFolder = opts.type === 'folder';
    var left   = isFolder ? 300 + offset : 280 + offset;
    var top    = isFolder ?  60 + offset :  36 + offset;
    var w      = isFolder ? (opts.w || 420)                    : window.innerWidth  - 280 - 12;
    var h      = isFolder ? (opts.h || 320)                    : window.innerHeight -  36 - 12;

    $win = $([
      '<div class="finder" id="' + id + '">',
      '  <header class="header">',
      '    <span class="title">' + (opts.title || '') + '</span>',
      '    <button class="close">x</button>',
      '  </header>',
      '  <div class="body"></div>',
      '</div>'
    ].join(''));

    $win.css({
      position: 'absolute',
      left:   left + 'px',
      top:    top  + 'px',
      width:  w + 'px',
      height: h + 'px',
      zIndex: ++zTop,
      display: 'none'
    });

    $win.find('.close').on('click', function (e) {
      e.preventDefault();
      $win.hide();
    });

    $win.on('mousedown', function () {
      $('.finder.focus').removeClass('focus');
      $win.addClass('focus').css('z-index', ++zTop);
    });

    makeWindowDraggable($win);
    $('.screen').append($win);
    $win.show('fast');

    return { win: $win, isNew: true };
  }

  /* ─── Charger un dossier (liste de fichiers depuis _files.json) ─── */
  function loadFolder($win, src, title) {
    $win.find('.title').text(title);
    $win.find('.body').html('<p class="finder-loading">…</p>');

    $.getJSON(src + '_files.json')
      .done(function (files) {
        var $list = $('<div class="finder-filelist">');

        files.forEach(function (f) {
          var type  = f.type || 'text';
          var cls   = type === 'folder' ? 'folder' : 'text';
          var label = f.name + (f.ext ? '.' + f.ext : '');
          var $icon = $('<button class="file ' + cls + '"><span>' + label + '</span></button>');

          $icon.on('click', function () {
            var childSrc = src + f.file;
            var childId  = 'win-' + childSrc.replace(/[^a-z0-9]/gi, '-');
            var result   = openWindow(childId, { title: f.name, w: 440, h: 340, type: type, noOffset: type !== 'folder' });
            if (result.isNew) {
              if (type === 'folder') {
                loadFolder(result.win, childSrc + '/', f.name);
              } else {
                loadFile(result.win, childSrc, f.name);
              }
            }
          });

          $list.append($icon);
        });

        $win.find('.body').html($list);
      })
      .fail(function () {
        $win.find('.body').html('<p class="finder-loading">Erreur de chargement.</p>');
      });
  }

  /* ─── Charger un fragment HTML ─── */
  function loadFile($win, src, title) {
    $win.find('.title').text(title);
    $win.find('.body').html('<p class="finder-loading">…</p>');

    $.get(src)
      .done(function (html) { $win.find('.body').html(html); })
      .fail(function () {
        $win.find('.body').html('<p class="finder-loading">Erreur de chargement.</p>');
      });
  }

  /* ─── Câbler les icônes du bureau ─── */
  $(document).ready(function () {
    $('[data-open]').each(function () {
      var $icon = $(this);
      var id    = $icon.attr('id') + '-win';
      var type  = $icon.data('open');
      var src   = $icon.data('src');
      var w     = $icon.data('w') || 400;
      var h     = $icon.data('h') || 320;
      var title = $icon.find('span').text().replace(/\s+/g, ' ').trim();

      $icon.off('click').on('click', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();

        var result = openWindow(id, { title: title, w: w, h: h, type: type });
        if (result.isNew) {
          if (type === 'folder') {
            loadFolder(result.win, src, title);
          } else {
            loadFile(result.win, src, title);
          }
        }
      });
    });
  });

})(jQuery);
