/* Переведено — анимации сайта. Без библиотек. */
(function () {
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  root.classList.add('js');
  window.__siteReady = true;

  /* ---------- цели Яндекс Метрики (счётчик 114653532) ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a || typeof window.ym !== 'function') return;
    var h = a.getAttribute('href'), goal = '';
    if (/\.zip(\?|$)/.test(h)) goal = /False-Alice/i.test(h) ? 'download-false-alice' : /Psycho-Sleuth/i.test(h) ? 'download-psycho-sleuth' : 'download';
    else if (a.getAttribute('data-goatcounter-click') === 'tg-subscribe') goal = 'tg-subscribe';
    if (goal) { try { window.ym(114653532, 'reachGoal', goal); } catch (err) {} }
  }, true);

  /* ---------- полоска прогресса прокрутки ---------- */
  var sp = document.createElement('div'); sp.className = 'scroll-prog'; sp.setAttribute('aria-hidden', 'true');
  document.body.appendChild(sp);
  var spq = 0;
  function spUpd() {
    spq = 0;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    sp.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0).toFixed(4) + ')';
  }
  window.addEventListener('scroll', function () { if (!spq) spq = requestAnimationFrame(spUpd); }, { passive: true });
  window.addEventListener('resize', function () { if (!spq) spq = requestAnimationFrame(spUpd); });
  spUpd();

  /* ---------- мягкое свечение за курсором (только мышь, без reduced-motion) ---------- */
  var wrapEl = document.querySelector('body > div');
  if (fine && !reduce && wrapEl) {
    var cg = document.createElement('div'); cg.className = 'cursor-glow'; cg.setAttribute('aria-hidden', 'true');
    wrapEl.appendChild(cg);
    var tx = -999, ty = -999, cx = -999, cy = -999, cgq = 0;
    function cgTick() {
      cx += (tx - cx) * 0.14; cy += (ty - cy) * 0.14;
      cg.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      cgq = (Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5) ? requestAnimationFrame(cgTick) : 0;
    }
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      if (cx < -900) { cx = e.clientX; cy = e.clientY; }
      tx = e.clientX; ty = e.clientY; cg.classList.add('on');
      if (!cgq) cgq = requestAnimationFrame(cgTick);
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', function () { cg.classList.remove('on'); });
  }

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
      return !c.querySelector('article') && !c.classList.contains('tiles') && !c.classList.contains('vt-fa') && !c.classList.contains('vt-ps') && !c.classList.contains('split') && !c.classList.contains('steps');
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
  var NUM = /^(\d[\d\s ]*)(%|\+)?$/;
  function fmt(n, big) { return big ? n.toLocaleString('ru-RU') : String(n); }
  function counter(el) {
    var txt = el.textContent.trim(), m = NUM.exec(txt);
    if (!m) return null;
    var suf = m[2] || '', big = /[\s ]/.test(m[1]);
    var target = parseInt(m[1].replace(/[\s ]/g, ''), 10), cur = 0, done = false, running = false;
    el.setAttribute('aria-label', txt); el.style.fontVariantNumeric = 'tabular-nums';
    el.textContent = '0' + suf;
    function anim(from, dur) {
      running = true; var t0 = performance.now();
      (function tick(t) {
        var p = Math.min(1, (t - t0) / dur);
        cur = Math.round(from + (target - from) * easeOut(p));
        el.textContent = p < 1 ? fmt(cur, big) + suf : txt;
        if (p < 1) requestAnimationFrame(tick); else { running = false; done = true; }
      })(t0);
      setTimeout(function () { if (running || !done) { el.textContent = txt; running = false; done = true; cur = target; } }, dur + 500);
    }
    var run = function (dur) { anim(0, dur); };
    run.set = function (newTxt) {           /* живое число пришло позже: плавно доводим до него */
      var mm = NUM.exec(newTxt); if (!mm) return;
      txt = newTxt; el.setAttribute('aria-label', txt);
      target = parseInt(mm[1].replace(/[\s ]/g, ''), 10);
      if (done) anim(cur, 700);
    };
    return run;
  }

  /* ---------- «О нас»: число скачиваний патчей из GitHub (кэш в sessionStorage, при ошибке — число из HTML) ---------- */
  var ghEl = document.querySelector('[data-live="gh-downloads"]'), GH_KEY = 'perevedeno:gh-downloads';
  if (ghEl) {
    try {
      var c0 = JSON.parse(sessionStorage.getItem(GH_KEY) || 'null');
      if (c0 && Date.now() - c0.t < 30 * 60 * 1000 && c0.v > 0) { ghEl.textContent = String(c0.v); ghEl.__fresh = true; }
    } catch (e) {}
  }

  /* страховка: если наблюдатель не сработал, показать то, что уже на экране */
  function failsafe() {
    if (document.visibilityState !== 'visible') return;
    document.querySelectorAll('.rv:not(.in), .bar-fill:not(.in), .tile-v:not(.in), .steps:not(.in)').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) { if (el.__onIn) el.__onIn(); el.classList.add('in'); if (io) io.unobserve(el); }
    });
  }
  setTimeout(failsafe, 2500);
  document.addEventListener('visibilitychange', function () { setTimeout(failsafe, 1500); });

  /* ---------- «Как установить»: линия рисуется, шаги загораются по очереди ---------- */
  document.querySelectorAll('.steps').forEach(function (ol) {
    if (!io) { ol.classList.add('in'); return; }
    io.observe(ol);
  });

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
    el.__counter = run;
    el.__onIn = function () { run(randDur()); };
    io.observe(el);
  });
  if (ghEl && !ghEl.__fresh && window.fetch) {
    fetch('https://api.github.com/repos/worthless666-loc/worthless666-loc.github.io/releases?per_page=100')
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (list) {
        var sum = 0;
        list.forEach(function (rel) { (rel.assets || []).forEach(function (a) { sum += a.download_count || 0; }); });
        if (!(sum > 0)) return;
        try { sessionStorage.setItem(GH_KEY, JSON.stringify({ v: sum, t: Date.now() })); } catch (e) {}
        if (ghEl.__counter) ghEl.__counter.set(String(sum)); else ghEl.textContent = String(sum);
      })
      .catch(function () { /* остаётся запасное число из HTML */ });
  }

  /* ---------- раскрывающиеся блоки: плавная высота, проявление, поворот стрелки ---------- */
  document.querySelectorAll('details').forEach(function (d) {
    var s = d.querySelector(':scope > summary'); if (!s) return;
    var body = document.createElement('div'); body.className = 'dt-body';
    while (s.nextSibling) body.appendChild(s.nextSibling);
    d.appendChild(body);
    d.classList.toggle('is-open', d.open);
    d.addEventListener('toggle', function () { if (!d.classList.contains('closing')) d.classList.toggle('is-open', d.open); });
    if (reduce || !d.animate) return;
    var anim = null;
    function closedH() {
      var cs = getComputedStyle(d);
      return s.getBoundingClientRect().height + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) +
        parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    }
    function run(from, to, opening) {
      if (anim) anim.cancel();
      d.style.overflow = 'hidden'; d.style.boxSizing = 'border-box';
      anim = d.animate({ height: [from + 'px', to + 'px'] }, { duration: opening ? 380 : 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
      body.animate(opening ? { opacity: [0, 1], transform: ['translateY(-6px)', 'none'] } : { opacity: [1, 0] },
        { duration: opening ? 420 : 200, easing: 'ease' });
      var a = anim;
      a.onfinish = function () {
        if (a !== anim) return;
        if (!opening) { d.open = false; d.classList.remove('closing'); }
        d.style.overflow = ''; d.style.boxSizing = ''; anim = null;
      };
    }
    s.addEventListener('click', function (e) {
      e.preventDefault();
      var from = d.getBoundingClientRect().height;
      if (!d.open || d.classList.contains('closing')) {
        d.classList.remove('closing'); d.open = true; d.classList.add('is-open');
        run(from, d.getBoundingClientRect().height, true);
      } else {
        d.classList.add('closing'); d.classList.remove('is-open');
        run(from, closedH(), false);
      }
    });
  });

  /* ---------- галерея скриншотов: стрелки ленты + просмотр на весь экран ---------- */
  document.querySelectorAll('.gal-wrap').forEach(function (wrap) {
    var gal = wrap.querySelector('.gal');
    var links = Array.prototype.slice.call(wrap.querySelectorAll('.gal-link'));
    if (!gal || !links.length) return;
    var items = links.map(function (a) {
      var fig = a.closest('figure'), cap = fig && fig.querySelector('figcaption');
      return { full: a.getAttribute('href'), thumb: a.querySelector('img').getAttribute('src'), cap: cap ? cap.textContent.trim() : '', alt: a.querySelector('img').alt, link: a };
    });

    /* стрелки ленты */
    var prev = wrap.querySelector('.gal-nav.prev'), next = wrap.querySelector('.gal-nav.next');
    function step() { var it = gal.querySelector('.gal-item'); return it ? it.getBoundingClientRect().width + 16 : 300; }
    function upd() {
      if (!prev || !next) return;
      prev.hidden = gal.scrollLeft < 8;
      next.hidden = gal.scrollLeft + gal.clientWidth > gal.scrollWidth - 8;
    }
    if (prev) prev.addEventListener('click', function () { gal.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }); });
    if (next) next.addEventListener('click', function () { gal.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }); });
    gal.addEventListener('scroll', function () { requestAnimationFrame(upd); }, { passive: true });
    window.addEventListener('resize', upd); upd();

    /* просмотр */
    var lb = null, img, cap, cnt, cur = 0, lastFocus = null, busy = false;
    var D = reduce ? 0 : 1, EASE = 'cubic-bezier(.2,.8,.2,1)';
    function build() {
      lb = document.createElement('div');
      lb.className = 'lb'; lb.hidden = true;
      lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Скриншоты перевода');
      lb.innerHTML = '<div class="lb-bg"></div><div class="lb-count" aria-live="polite"></div>' +
        '<button type="button" class="lb-btn lb-close" aria-label="Закрыть">✕</button>' +
        '<button type="button" class="lb-btn lb-prev" aria-label="Предыдущий скриншот">‹</button>' +
        '<button type="button" class="lb-btn lb-next" aria-label="Следующий скриншот">›</button>' +
        '<figure class="lb-fig"><img class="lb-img" alt="" width="1456" height="819" draggable="false"><figcaption class="lb-cap"></figcaption></figure>';
      document.body.appendChild(lb);
      img = lb.querySelector('.lb-img'); cap = lb.querySelector('.lb-cap'); cnt = lb.querySelector('.lb-count');
      lb.querySelector('.lb-close').addEventListener('click', close);
      lb.querySelector('.lb-prev').addEventListener('click', function () { go(-1); });
      lb.querySelector('.lb-next').addEventListener('click', function () { go(1); });
      lb.querySelector('.lb-bg').addEventListener('click', close);
      /* свайп: влево/вправо — листать, вниз — закрыть */
      var sx = 0, sy = 0, down = false;
      lb.addEventListener('pointerdown', function (e) { if (e.target.closest('.lb-btn')) return; down = true; sx = e.clientX; sy = e.clientY; });
      lb.addEventListener('pointermove', function (e) {
        if (!down || reduce) return;
        var dx = e.clientX - sx, dy = e.clientY - sy;
        img.style.transform = Math.abs(dx) > Math.abs(dy) ? 'translateX(' + dx * 0.6 + 'px)' : (dy > 0 ? 'translateY(' + dy * 0.6 + 'px)' : '');
      });
      function up(e) {
        if (!down) return; down = false;
        var dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { go(dx < 0 ? 1 : -1); }
        else if (dy > 90) { close(); }
        else if (img.style.transform) { img.animate([{ transform: img.style.transform }, { transform: 'none' }], { duration: 220 * D, easing: EASE }); img.style.transform = ''; }
      }
      lb.addEventListener('pointerup', up); lb.addEventListener('pointercancel', up);
      lb.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
        else if (e.key === 'Tab') { /* фокус остаётся внутри окна */
          var b = Array.prototype.slice.call(lb.querySelectorAll('.lb-btn')).filter(function (x) { return x.offsetParent; });
          var i = b.indexOf(document.activeElement);
          e.preventDefault(); b[(i + (e.shiftKey ? -1 : 1) + b.length) % b.length].focus();
        }
      });
    }
    function preload(i) { var im = new Image(); im.src = items[(i + items.length) % items.length].full; }
    function show(i) {
      cur = (i + items.length) % items.length;
      var it = items[cur];
      img.src = it.thumb;                       /* сразу превью, затем полный кадр */
      var full = new Image(); full.onload = function () { if (items[cur] === it) img.src = it.full; }; full.src = it.full;
      img.alt = it.alt; cap.textContent = it.cap;
      cnt.textContent = (cur + 1) + ' / ' + items.length;
      preload(cur + 1); preload(cur - 1);
    }
    function rectFrom(el) {                     /* transform от миниатюры к большому кадру */
      var a = el.getBoundingClientRect(), b = img.getBoundingClientRect();
      if (!a.width || !b.width) return null;
      return 'translate(' + (a.left - b.left) + 'px,' + (a.top - b.top) + 'px) scale(' + (a.width / b.width) + ')';
    }
    function open(i) {
      if (!lb) build();
      lastFocus = document.activeElement;
      show(i);
      lb.hidden = false;
      root.style.overflow = 'hidden';
      var from = rectFrom(items[cur].link);
      img.style.transformOrigin = '0 0';
      lb.querySelector('.lb-bg').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320 * D, easing: 'ease' });
      lb.querySelectorAll('.lb-btn,.lb-count,.lb-cap').forEach(function (el) { el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 * D, delay: 120 * D, easing: 'ease', fill: 'backwards' }); });
      img.animate(from ? [{ transform: from, borderRadius: '12px' }, { transform: 'none' }] : [{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }],
        { duration: 420 * D, easing: EASE });
      lb.querySelector('.lb-close').focus({ preventScroll: true });
    }
    function close() {
      if (!lb || lb.hidden || busy) return;
      busy = true;
      var link = items[cur].link, item = link.closest('.gal-item');
      if (item) {                                /* лента доезжает до текущего кадра, чтобы он «влетел» в свою миниатюру */
        var gr = gal.getBoundingClientRect(), ir = item.getBoundingClientRect();
        if (ir.left < gr.left || ir.right > gr.right) {
          var sb = gal.style.scrollBehavior; gal.style.scrollBehavior = 'auto';
          gal.scrollLeft += ir.left - gr.left; gal.style.scrollBehavior = sb;
        }
      }
      lastFocus = link;
      var r = link.getBoundingClientRect();
      var visible = r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
      img.style.transformOrigin = '0 0';
      var from = visible ? rectFrom(link) : null;
      var cs = img.style.transform || 'none';
      var a = img.animate(from ? [{ transform: cs }, { transform: from }] : [{ transform: cs, opacity: 1 }, { transform: 'scale(.94)', opacity: 0 }],
        { duration: 340 * D, easing: EASE, fill: 'forwards' });
      lb.querySelector('.lb-bg').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 340 * D, easing: 'ease', fill: 'forwards' });
      lb.querySelectorAll('.lb-btn,.lb-count,.lb-cap').forEach(function (el) { el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180 * D, fill: 'forwards' }); });
      function done() {
        lb.hidden = true; busy = false; img.style.transform = '';
        lb.getAnimations({ subtree: true }).forEach(function (x) { x.cancel(); });
        root.style.overflow = '';
        if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
      }
      if (D) a.onfinish = done; else done();
    }
    function go(d) {
      if (busy) return;
      if (!D) { show(cur + d); img.style.transform = ''; return; }
      busy = true;
      var cs = img.style.transform || 'none';
      var out = img.animate([{ transform: cs, opacity: 1 }, { transform: 'translateX(' + (-d * 60) + 'px)', opacity: 0 }], { duration: 160, easing: 'ease-in', fill: 'forwards' });
      out.onfinish = function () {
        show(cur + d); img.style.transform = ''; out.cancel();
        img.animate([{ transform: 'translateX(' + (d * 60) + 'px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: EASE });
        busy = false;
      };
    }
    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault(); open(i);
      });
    });
  });

  /* ---------- стрелки → ---------- */
  /* «Наверх ↑» — плавно */
  document.querySelectorAll('.ft-top').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  });

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
    var vt = link && (/false-alice/.test(link.getAttribute('href')) ? 'vt-fa' : /psycho-sleuth/.test(link.getAttribute('href')) ? 'vt-ps' : '');
    if (vt) link.addEventListener('click', function () { var s = c.querySelector('.gbanner'); if (s) s.classList.add(vt); });
  });
  window.addEventListener('pageshow', function () {
    document.querySelectorAll('.gbanner').forEach(function (s) { s.classList.remove('vt-fa', 'vt-ps'); });
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
