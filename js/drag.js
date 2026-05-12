(function () {
  var GRID = 8;

  var dragTarget = null;
  var startX, startY, startLeft, startTop;
  var dragging = false; // true seulement quand on a vraiment bougé

  function snap(v) {
    return Math.round(v / GRID) * GRID;
  }

  document.querySelectorAll('.file').forEach(function (el) {
    el.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;

      dragTarget = el;
      startX     = e.clientX;
      startY     = e.clientY;
      dragging   = false;

      // pas de preventDefault ici — laisse le click fonctionner normalement
    });
  });

  document.addEventListener('mousemove', function (e) {
    if (!dragTarget) return;

    var dx = e.clientX - startX;
    var dy = e.clientY - startY;

    // Seuil : ne commence le drag qu'après 8px de mouvement
    if (!dragging && Math.abs(dx) < GRID && Math.abs(dy) < GRID) return;

    if (!dragging) {
      // Premier vrai mouvement : convertit la position right/top en left/top
      var screen     = document.querySelector('.screen');
      var rect       = dragTarget.getBoundingClientRect();
      var screenRect = screen.getBoundingClientRect();

      startLeft = rect.left - screenRect.left;
      startTop  = rect.top  - screenRect.top;

      dragTarget.style.setProperty('position', 'absolute', 'important');
      dragTarget.style.setProperty('right',    'auto',     'important');
      dragTarget.style.setProperty('z-index',  '999',      'important');

      dragging = true;
    }

    var newLeft = snap(startLeft + dx);
    var newTop  = snap(startTop  + dy);

    dragTarget.style.setProperty('left', newLeft + 'px', 'important');
    dragTarget.style.setProperty('top',  newTop  + 'px', 'important');
  });

  document.addEventListener('mouseup', function () {
    if (!dragTarget) return;

    if (dragging) {
      var dropped = dragTarget; // capture avant de nullifier
      dropped.style.removeProperty('z-index');

      // Bloque uniquement le click qui suit immédiatement le drop
      dropped.addEventListener('click', function stopClick(ev) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        dropped.removeEventListener('click', stopClick, true);
      }, true);
    }

    dragTarget = null;
    dragging   = false;
  });
})();
