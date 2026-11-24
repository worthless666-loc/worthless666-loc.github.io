/* Переведено — анимации сайта (превью). Без библиотек. */
(function () {
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  root.classList.add('js');

  /* ---------- появление при прокрутке, ступеньками ---------- */
  var io = ('IntersectionObserver' in window) && !reduce ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
      if (e.target.__onIn) e.target.__onIn();
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }) : null;

  function reveal(list, step) {
    Array.prototype.forEach.call(list, function (el, i) {
      el.classList.add('rv');
      el.style.setProperty('--d', (i * (step || 0.08)).toFixed(2) + 's');
      if (io) io.observe(el); else el.classList.add('in');
    });
  }
  document.querySelectorAll('main > section').forEach(function (sec, si) {
    var direct = Array.prototype.filter.call(sec.children, function (c) {
      return !c.querySelector('article') && !c.classList.contains('tiles') && !c.classList.contains('vt-fa');
    });
    reveal(direct, 0.07);
    reveal(sec.querySelectorAll('article'), 0.12);
    reveal(sec.querySelectorAll('.tiles > div'), 0.09);
    reveal(sec.querySelectorAll('ol > li'), 0.09);
  });

  /* ---------- полосы прогресса заполняются при появлении ---------- */
  document.querySelectorAll('div[style*="height: 8px; background: #F2B84B"]').forEach(function (bar) {
    bar.classList.add('bar-fill');
    if (!io) { bar.classList.add('in'); return; }
    io.observe(bar);
  });

  /* ---------- счётчики в плитках (87%, 1285) ---------- */
  document.querySelectorAll('.tile-v').forEach(function (el) {
    var txt = el.textContent.trim();
    var m = /^(\d[\d\s]*)(%?)$/.exec(txt);
    if (!m || reduce || !io) return;
    var target = parseInt(m[1].replace(/\s/g, ''), 10);
    el.setAttribute('aria-label', txt);
    el.style.fontVariantNumeric = 'tabular-nums';
    el.textContent = '0' + m[2];
    el.__onIn = function () {
      var t0 = performance.now(), dur = 1300;
      (function tick(t) {
        var p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 3);
        el.textContent = (p < 1 ? Math.round(target * k) : txt.replace(/%$/, '').trim()) + m[2];
        if (p < 1) requestAnimationFrame(tick); else el.textContent = txt;
      })(t0);
      setTimeout(function () { el.textContent = txt; }, dur + 400);
    };
    io.observe(el);
  });

  /* ---------- стрелки → ---------- */
  document.querySelectorAll('a').forEach(function (a) {
    var n = a.lastChild;
    if (n && n.nodeType === 3 && /→\s*$/.test(n.nodeValue)) {
      n.nodeValue = n.nodeValue.replace(/\s*→\s*$/, ' ');
      var s = document.createElement('span'); s.className = 'arr'; s.textContent = '→'; s.setAttribute('aria-hidden', 'true');
      a.appendChild(s);
      if (!a.classList.contains('btn')) a.classList.add('arrow-link');
    }
  });

  /* ---------- кнопки: волна при нажатии + «магнит» ---------- */
  document.querySelectorAll('.btn').forEach(function (b) {
    b.addEventListener('pointerdown', function (e) {
      if (reduce) return;
      var r = b.getBoundingClientRect(), s = document.createElement('span');
      s.className = 'ripple';
      s.style.left = (e.clientX - r.left) + 'px'; s.style.top = (e.clientY - r.top) + 'px';
      s.style.setProperty('--rs', (Math.hypot(r.width, r.height) / 10).toFixed(1));
      b.appendChild(s);
      setTimeout(function () { s.remove(); }, 700);
    });
    if (!fine || reduce) return;
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
      b.style.translate = (x * 4).toFixed(1) + 'px ' + (y * 3).toFixed(1) + 'px';
    });
    b.addEventListener('pointerleave', function () { b.style.translate = ''; });
  });

  /* ---------- карточки: наклон, блик, параллакс арта ---------- */
  document.querySelectorAll('.gcard').forEach(function (c) {
    var gc = document.createElement('span'); gc.className = 'glare-clip'; gc.setAttribute('aria-hidden', 'true');
    var g = document.createElement('span'); g.className = 'glare'; gc.appendChild(g); c.appendChild(gc);
    setTimeout(function () { c.style.setProperty('--d', '0s'); }, 1600);
    var raf = 0, ev = null;
    function apply() {
      raf = 0; if (!ev) return;
      var r = c.getBoundingClientRect();
      var x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
      c.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg');
      c.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
      c.style.setProperty('--gx', (ev.clientX - r.left).toFixed(0) + 'px');
      c.style.setProperty('--gy', (ev.clientY - r.top).toFixed(0) + 'px');
      c.style.setProperty('--px', ((0.5 - x) * 14).toFixed(1) + 'px');
      c.style.setProperty('--py', ((0.5 - y) * 10).toFixed(1) + 'px');
    }
    function reset() {
      c.classList.remove('is-hot', 'tilting', 'pressed');
      ['--rx', '--ry', '--px', '--py'].forEach(function (p) { c.style.removeProperty(p); });
    }
    if (fine && !reduce) {
      c.addEventListener('pointerenter', function () { c.classList.add('is-hot'); });
      c.addEventListener('pointermove', function (e) {
        ev = e; c.classList.add('tilting', 'is-hot');
        if (!raf) raf = requestAnimationFrame(apply);
      });
      c.addEventListener('pointerleave', reset);
    } else if (!reduce) {
      /* касание: подсветка и «продавливание» вместо наведения */
      c.addEventListener('pointerdown', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--gx', (e.clientX - r.left).toFixed(0) + 'px');
        c.style.setProperty('--gy', (e.clientY - r.top).toFixed(0) + 'px');
        c.classList.add('is-hot', 'pressed');
      }, { passive: true });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) {
        c.addEventListener(t, function () { c.classList.remove('pressed'); setTimeout(reset, 350); });
      });
    }
    if (fine && !reduce) {
      c.addEventListener('pointerdown', function (e) { if (!e.target.closest('.gcard-tg')) c.classList.add('pressed'); });
      c.addEventListener('pointerup', function () { c.classList.remove('pressed'); });
    }
    /* для перелёта баннера на страницу игры */
    var link = c.querySelector('.gcard-link');
    if (link && /false-alice/.test(link.getAttribute('href'))) {
      link.addEventListener('click', function () { var s = c.querySelector('.gbanner'); if (s) s.classList.add('vt-fa'); });
    }
  });
  window.addEventListener('pageshow', function () {
    document.querySelectorAll('.vt-fa.gbanner').forEach(function (s) { s.classList.remove('vt-fa'); });
    root.classList.remove('leaving');
    document.querySelectorAll('.gcard').forEach(function (c) { c.classList.remove('is-hot', 'pressed', 'tilting'); });
  });

  /* ---------- плавный переход между страницами там, где нет View Transitions ---------- */
  if (!window.CSSViewTransitionRule && !reduce) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target) return;
      var u = new URL(a.href, location.href);
      if (u.origin !== location.origin || !/\.html$|\/$/.test(u.pathname) || u.pathname === location.pathname) return;
      e.preventDefault();
      root.classList.add('leaving');
      setTimeout(function () { location.href = a.href; }, 170);
    });
  }
})();
