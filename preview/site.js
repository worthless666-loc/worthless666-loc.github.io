/* Переведено — анимации сайта (превью). Без библиотек. */
(function () {
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  root.classList.add('js');

  /* ---------- шапка: фон и линия появляются при прокрутке ---------- */
  var hdr = document.querySelector('.hdr'), hq = 0;
  function hcheck() { hq = 0; if (hdr) hdr.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', function () { if (!hq) hq = requestAnimationFrame(hcheck); }, { passive: true });
  document.addEventListener('DOMContentLoaded', hcheck);

  /* ---------- фон первого экрана: высота до конца hero ---------- */
  var hbg = document.querySelector('.hero-bg');
  if (hbg) {
    var hero = document.querySelector('main > section');
    var setH = function () { hbg.style.setProperty('--hero-h', (hero.getBoundingClientRect().bottom + window.scrollY) + 'px'); };
    setH(); window.addEventListener('resize', setH);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setH);
  }

  /* ---------- заголовок появляется по словам ---------- */
  document.querySelectorAll('h1.split').forEach(function (h) {
    if (reduce) return;
    var words = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', h.textContent.trim());
    h.textContent = '';
    words.forEach(function (w, i) {
      var s = document.createElement('span'); s.className = 'w'; s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--i', i); s.textContent = w;
      h.appendChild(s); if (i < words.length - 1) h.appendChild(document.createTextNode(' '));
    });
  });

  /* ---------- появление при прокрутке, ступеньками ---------- */
  var io = ('IntersectionObserver' in window) && !reduce ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      if (e.target.__onIn) e.target.__onIn();
      e.target.getBoundingClientRect();
      e.target.classList.add('in');
      io.unobserve(e.target);
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
      return !c.querySelector('article') && !c.classList.contains('tiles') && !c.classList.contains('vt-fa') && !c.classList.contains('split');
    });
    reveal(direct, 0.07);
    reveal(sec.querySelectorAll('article'), 0.12);
    reveal(sec.querySelectorAll('.tiles > div'), 0.09);
    reveal(sec.querySelectorAll('ol > li'), 0.09);
  });

  /* ---------- набегание чисел (ease-out, синхронно с полосой) ---------- */
  var EASE = 'cubic-bezier(.33,1,.68,1)';            /* = easeOutCubic */
  function easeOut(p) { return 1 - Math.pow(1 - p, 3); }
  function randDur() { return 5000 + Math.random() * 3000; }  /* 5–8 с, своя для каждой */
  function counter(el) {
    var txt = el.textContent.trim(), m = /^(\d[\d\s]*)(%?)$/.exec(txt);
    if (!m) return null;
    var target = parseInt(m[1].replace(/\s/g, ''), 10);
    el.setAttribute('aria-label', txt); el.style.fontVariantNumeric = 'tabular-nums';
    el.textContent = '0' + m[2];
    return function (dur) {
      var t0 = performance.now();
      (function tick(t) {
        var p = Math.min(1, (t - t0) / dur);
        el.textContent = p < 1 ? Math.round(target * easeOut(p)) + m[2] : txt;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
      setTimeout(function () { el.textContent = txt; }, dur + 500);
    };
  }

  /* ---------- полосы прогресса: каждая со своей случайной длительностью ---------- */
  document.querySelectorAll('div[style*="height: 8px; background: #F2B84B"]').forEach(function (bar) {
    if (reduce || !io) return;
    var row = bar.parentElement && bar.parentElement.previousElementSibling;
    var lab = row ? Array.prototype.filter.call(row.querySelectorAll('span'), function (s) { return /^\d+%$/.test(s.textContent.trim()); })[0] : null;
    var run = lab ? counter(lab) : null;
    bar.classList.add('bar-fill');
    bar.__onIn = function () {
      var d = randDur();
      bar.style.transition = 'transform ' + Math.round(d) + 'ms ' + EASE;
      if (run) run(d);
    };
    io.observe(bar);
  });

  /* ---------- счётчики в плитках (87%, 1285) ---------- */
  document.querySelectorAll('.tile-v').forEach(function (el) {
    if (reduce || !io) return;
    var run = counter(el);
    if (!run) return;
    el.__onIn = function () { run(randDur()); };
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
