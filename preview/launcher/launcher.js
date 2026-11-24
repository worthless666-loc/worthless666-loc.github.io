/* Лаунчер «Переведено.» — макет интерфейса, этап 1.
   Логики установки нет: кнопки ничего не делают. Состояния переключаются панелью «Демо» под окном. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* Данные игр. % перевода никогда не 100 — как на сайте. */
  var GAMES = {
    ps: {
      name: 'Psycho-Sleuth', tag: '', kind: 'Steam · ПК',
      sub: 'Детективная новелла про Отбор, Патосинки и Бога Логики',
      art: 'img/art-psycho-sleuth.jpg', ap: '18% 22%', path: 'D:\\SteamLibrary\\steamapps\\common\\Psycho-Sleuth', credit: 'Арт: © PHOSEPO',
      pct: 90, ver: '1.3', next: '1.4', date: '23.11.2026',
      url: 'https://perevedeno.com/psycho-sleuth.html',
      news: ['Весь сюжет: 5 глав, ≈24 700 строк', 'Исследование локаций и интерфейс', 'Правки после вычитки по главам']
    },
    fa: {
      name: 'The False Alice', tag: 'демо', kind: 'Steam · ПК · демо',
      sub: 'Мрачная сказка от VISUAL ARTS про трёх Ложных Алис',
      art: 'img/art-false-alice.jpg', ap: '60px -265px', as: '680px auto', path: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\The False Alice Demo', credit: 'Арт: © VISUAL ARTS',
      pct: 87, ver: '1.0', next: '1.1', date: '24.11.2026',
      url: 'https://perevedeno.com/false-alice.html',
      news: ['Весь сюжет демо: 5 сцен, 1285 строк', 'Имена персонажей и текстовое меню', 'Родная кириллица в шрифте игры']
    }
  };
  var S = { game: 'ps', screen: 'lib', st: { ps: 'installed', fa: 'none' }, prog: { ps: 0, fa: 0 } };
  var timers = { inst: null, tour: [] };

  var win = $('#win'), lib = $('#scrLib'), set = $('#scrSet'), gsel = $('#gsel'), toast = $('#toast');

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- статус в списке слева ---------- */
  function sideStatus(id) {
    var g = GAMES[id], s = S.st[id];
    switch (s) {
      case 'installed': return ['ok', 'Установлено · ' + g.ver];
      case 'update': return ['upd', 'Доступно ' + g.next];
      case 'installing': return ['run', 'Установка… ' + Math.round(S.prog[id]) + '%'];
      case 'err-nf': return ['err', 'Игра не найдена'];
      case 'err-ver': return ['err', 'Нужна проверка'];
      default: return ['', 'Не установлено'];
    }
  }
  function paintSide() {
    $$('.gi[data-game]').forEach(function (b) {
      var id = b.getAttribute('data-game'), st = sideStatus(id), el = $('.gi-st', b);
      el.setAttribute('data-k', st[0]); el.textContent = st[1];
      b.setAttribute('aria-current', S.screen === 'lib' && id === S.game ? 'page' : 'false');
    });
    $('#setBtn').classList.toggle('on', S.screen === 'set');
    moveSel();
  }
  function moveSel() {
    var b = $('.gi[data-game="' + S.game + '"]');
    gsel.style.setProperty('--sy', b.offsetTop + 'px');
    gsel.style.setProperty('--sh', b.offsetHeight + 'px');
    gsel.style.setProperty('--so', S.screen === 'lib' ? '1' : '0');
  }

  /* ---------- блок действия ---------- */
  function actHTML(id) {
    var g = GAMES[id], s = S.st[id], h = '';
    var sec = function (en) {
      return '<div class="act-sec"><button type="button" class="btn btn-ghost btn-s"' + (en ? '' : ' aria-disabled="true"') + '>Вернуть английский</button>' +
        '<button type="button" class="btn btn-ghost btn-s" data-news>Что нового</button></div>';
    };
    if (s === 'none') {
      h = '<div class="act-row"><button type="button" class="btn btn-primary btn-big">Установить перевод</button></div>' +
        '<p class="act-hint">Найдём игру в Steam, сохраним копию оригинальных файлов и поставим перевод ' + g.ver + '.</p>' + sec(false);
    } else if (s === 'installing') {
      h = '<div class="prog-h"><strong>Ставим перевод ' + g.ver + '</strong><b data-pct>0%</b></div>' +
        '<div class="bar"><i data-bar></i></div>' +
        '<ol class="steps"><li data-step="0"><span class="si"></span>Ищем игру…</li><li data-step="1"><span class="si"></span>Делаем копию…</li><li data-step="2"><span class="si"></span>Ставим перевод…</li></ol>' +
        '<p class="act-hint">Не закрывайте игру и лаунчер — это займёт пару секунд.</p>';
    } else if (s === 'installed') {
      h = '<div class="act-row"><span class="btn btn-big btn-done pop" role="status">Установлено <span class="ck">✓</span></span></div>' +
        '<p class="act-hint">Версия ' + g.ver + ' · запускайте игру как обычно, через Steam.</p>' + sec(true);
    } else if (s === 'update') {
      h = '<div class="act-row"><button type="button" class="btn btn-primary btn-big">Обновить до ' + g.next + '</button><span class="badge">Новая версия</span></div>' +
        '<p class="act-hint">Сейчас стоит ' + g.ver + '. Сохранения и настройки игры не трогаем.</p>' + sec(true);
    } else if (s === 'err-nf') {
      h = '<div class="err"><span class="err-ic">!</span><div><h3>Игра не найдена</h3><p>Не нашли ' + esc(g.name) + ' в библиотеках Steam. Если игра стоит в другом месте — укажите её папку вручную.</p>' +
        '<div class="act-row"><button type="button" class="btn btn-primary btn-m">Указать папку</button><button type="button" class="btn btn-ghost btn-m">Проверить снова</button></div></div></div>';
    } else if (s === 'err-ver') {
      h = '<div class="err"><span class="err-ic">!</span><div><h3>Эта версия игры пока не поддерживается</h3><p>Похоже, игра обновилась в Steam. Перевод для новой сборки ещё не готов — файлы игры мы не трогали.</p>' +
        '<div class="act-row"><button type="button" class="btn btn-ghost btn-m">Проверить снова</button><a class="btn btn-ghost btn-m" href="https://t.me/perevedeno_w" target="_blank" rel="noopener">Новости в Telegram <span class="arr">↗</span></a></div></div></div>';
    }
    return '<div class="act-in swap">' + h + '</div>';
  }

  function pathHTML(id) {
    var g = GAMES[id], nf = S.st[id] === 'err-nf';
    return '<div class="gpath ap" style="--i:7"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>' +
      '<code>' + (nf ? 'Папка игры не найдена' : esc(g.path)) + '</code>' + (nf ? '<b class="no">✕ нет</b>' : '<b>✓ найдена</b>') + '</div>';
  }
  function libHTML(id) {
    var g = GAMES[id], s = S.st[id];
    var verTile = s === 'update' ? g.ver + '<span class="nv">→ ' + g.next + '</span>' : g.ver;
    return '<div class="hero"><div class="hero-art" style="background-image:url(' + g.art + ');--ap:' + g.ap + (g.as ? ';--as:' + g.as : '') + '"></div>' +
      '<div class="hero-t"><span class="hero-k ap" style="--i:0">' + esc(g.kind) + '</span>' +
      '<h1 class="ap" style="--i:1">' + esc(g.name) + (g.tag ? '<small>' + g.tag + '</small>' : '') + '</h1>' +
      '<p class="ap" style="--i:2">' + esc(g.sub) + '</p></div><span class="hero-cr">' + esc(g.credit) + '</span></div>' +
      '<div class="gbody"><div>' +
      '<div class="tiles"><div class="tile ap" style="--i:3"><b>' + g.pct + '%</b><span>Перевод</span><div class="mb"><i style="width:' + g.pct + '%"></i></div></div>' +
      '<div class="tile ap" style="--i:4"><b>' + verTile + '</b><span>Версия перевода</span></div>' +
      '<div class="tile ap" style="--i:5"><b class="sm">' + g.date + '</b><span>Последнее обновление</span></div></div>' +
      '<div class="act ap" style="--i:6" data-s="' + s + '">' + actHTML(id) + '</div>' + pathHTML(id) + '</div>' +
      '<div><div class="news ap" style="--i:7"><h3>Что нового<span>в ' + g.ver + '</span></h3><ul>' +
      g.news.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="side-links ap" style="--i:8"><a href="' + g.url + '" target="_blank" rel="noopener">Страница игры на сайте <span class="arr">↗</span></a>' +
      '<small>Скриншоты, вопросы и команда перевода</small></div></div></div>';
  }

  /* ---------- переходы ---------- */
  function swapScreen(el, html) {
    if (html != null) el.innerHTML = html;
    el.hidden = false; el.scrollTop = 0;
    el.classList.remove('leave', 'enter'); void el.offsetWidth; el.classList.add('enter');
  }
  function hideScreen(el) {
    if (el.hidden) return;
    if (reduce) { el.hidden = true; return; }
    el.classList.remove('enter'); el.classList.add('leave');
    setTimeout(function () { if (el.classList.contains('leave')) { el.hidden = true; el.classList.remove('leave'); } }, 240);
  }
  function render(anim) {
    if (S.screen === 'lib') {
      hideScreen(set);
      if (anim === false) { lib.innerHTML = libHTML(S.game); lib.hidden = false; }
      else swapScreen(lib, libHTML(S.game));
      if (S.st[S.game] === 'installing') runInstall(S.game);
    } else {
      hideScreen(lib);
      swapScreen(set, null);
    }
    paintSide(); paintDemo();
  }
  /* Меняется только блок действия — без перерисовки всей страницы */
  function renderAct() {
    var a = $('.act', lib); if (!a || S.screen !== 'lib') { paintSide(); paintDemo(); return; }
    a.setAttribute('data-s', S.st[S.game]);
    a.innerHTML = actHTML(S.game);
    var t = $$('.tile b', lib)[1], g = GAMES[S.game];
    if (t) t.innerHTML = S.st[S.game] === 'update' ? g.ver + '<span class="nv">→ ' + g.next + '</span>' : g.ver;
    var gp = $('.gpath', lib); if (gp) { var d = document.createElement('div'); d.innerHTML = pathHTML(S.game); gp.replaceWith(d.firstChild); }
    if (S.st[S.game] === 'installing') runInstall(S.game);
    paintSide(); paintDemo();
  }

  /* ---------- «установка» для показа: полоса и шаги ---------- */
  function runInstall(id) {
    clearInterval(timers.inst);
    S.prog[id] = 0;
    var t0 = performance.now(), dur = reduce ? 1200 : 5200;
    var tick = function () {
      var p = Math.min(1, (performance.now() - t0) / dur);
      var e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      var v = Math.min(99, e * 100);
      S.prog[id] = v;
      var bar = $('[data-bar]', lib), pc = $('[data-pct]', lib);
      if (S.game === id && S.screen === 'lib' && bar) {
        bar.style.transform = 'scaleX(' + (v / 100).toFixed(3) + ')';
        pc.textContent = Math.round(v) + '%';
        var step = v < 22 ? 0 : v < 52 ? 1 : 2;
        $$('.steps li', lib).forEach(function (li, i) { li.className = i < step ? 'ok' : i === step ? 'on' : ''; });
      }
      var st = sideStatus(id), el = $('.gi[data-game="' + id + '"] .gi-st');
      el.setAttribute('data-k', st[0]); el.textContent = st[1];
      if (p >= 1) {
        clearInterval(timers.inst);
        if (S.game === id && S.screen === 'lib') $$('.steps li', lib).forEach(function (li) { li.className = 'ok'; });
        setTimeout(function () { if (S.st[id] === 'installing') { S.st[id] = 'installed'; renderAct(); } }, 450);
      }
    };
    timers.inst = setInterval(tick, 50); tick();
  }

  /* ---------- тост ---------- */
  var toastT;
  function showToast() {
    toast.classList.remove('show'); void toast.offsetWidth; toast.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(hideToast, 7000);
  }
  function hideToast() { toast.classList.remove('show'); clearTimeout(toastT); }

  /* ---------- события в окне ---------- */
  $('#glist').addEventListener('click', function (e) {
    var b = e.target.closest('.gi[data-game]'); if (!b) return;
    var id = b.getAttribute('data-game');
    if (id === S.game && S.screen === 'lib') return;
    S.game = id; S.screen = 'lib'; render();
  });
  $('#setBtn').addEventListener('click', function () { if (S.screen !== 'set') { S.screen = 'set'; render(); } });
  win.addEventListener('click', function (e) {
    var sw = e.target.closest('.sw');
    if (sw) { sw.setAttribute('aria-checked', sw.getAttribute('aria-checked') === 'true' ? 'false' : 'true'); return; }
    if (e.target.closest('[data-toast-x]')) { hideToast(); return; }
    if (e.target.closest('[data-news]')) {
      var n = $('.news', lib); if (!n) return;
      n.classList.remove('flash'); void n.offsetWidth; n.classList.add('flash');
      setTimeout(function () { n.classList.remove('flash'); }, 900);
    }
  });

  /* перетаскивание окна за шапку (в настоящем окне Windows это сделает оболочка) */
  (function () {
    var tb = $('#tb'), sx, sy, ox = 0, oy = 0, on = false;
    tb.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.tb-btn') || document.documentElement.classList.contains('embed')) return;
      on = true; sx = e.clientX - ox; sy = e.clientY - oy; tb.setPointerCapture(e.pointerId); tb.classList.add('dragging');
    });
    tb.addEventListener('pointermove', function (e) {
      if (!on) return; ox = e.clientX - sx; oy = e.clientY - sy;
      win.style.setProperty('--wx', ox + 'px'); win.style.setProperty('--wy', oy + 'px');
    });
    var end = function () { on = false; tb.classList.remove('dragging'); };
    tb.addEventListener('pointerup', end); tb.addEventListener('pointercancel', end);
    tb.addEventListener('dblclick', function () { ox = oy = 0; win.style.setProperty('--wx', '0px'); win.style.setProperty('--wy', '0px'); });
  })();

  /* окно 1100×700 целиком помещается на экране: при нехватке места уменьшаем */
  function fit() {
    if (document.documentElement.classList.contains('embed')) return;
    var d = $('#demo'), dh = d ? d.offsetHeight + 28 : 0;
    document.documentElement.style.setProperty('--demo-h', dh + 'px');
    var k = Math.min(1, (innerWidth - 32) / 1100, (innerHeight - dh - 32) / 700);
    win.style.setProperty('--ws', Math.max(.4, k).toFixed(3));
  }
  addEventListener('resize', fit);

  /* ---------- панель «Демо» ---------- */
  function paintDemo() {
    $$('.demo .dg[data-g]').forEach(function (g) {
      var k = g.getAttribute('data-g'), v = k === 'game' ? S.game : k === 'screen' ? S.screen : S.st[S.game];
      $$('.dc', g).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-v') === v ? 'true' : 'false'); });
    });
  }
  function stopTour() { timers.tour.forEach(clearTimeout); timers.tour = []; $('[data-act=tour]').setAttribute('aria-pressed', 'false'); }
  function setState(v) {
    clearInterval(timers.inst);
    S.st[S.game] = v;
    if (S.screen !== 'lib') { S.screen = 'lib'; render(); } else renderAct();
  }
  $('#demo').addEventListener('click', function (e) {
    var b = e.target.closest('.dc'); if (!b) return;
    var g = b.parentNode.getAttribute('data-g'), v = b.getAttribute('data-v'), act = b.getAttribute('data-act');
    if (act !== 'tour' && act !== 'toast') stopTour();
    if (g === 'game') { if (v !== S.game || S.screen !== 'lib') { S.game = v; S.screen = 'lib'; render(); } }
    else if (g === 'screen') { if (v !== S.screen) { S.screen = v; render(); } }
    else if (g === 'state') setState(v);
    else if (act === 'toast') showToast();
    else if (act === 'tour') {
      if (timers.tour.length) { stopTour(); return; }
      b.setAttribute('aria-pressed', 'true');
      var seq = [[0, function () { S.game = 'ps'; S.screen = 'lib'; S.st.ps = 'none'; render(); }],
        [2200, function () { setState('installing'); }],
        [9000, showToast],
        [11500, function () { hideToast(); setState('update'); }],
        [15000, function () { setState('err-nf'); }],
        [18500, function () { setState('err-ver'); }],
        [22000, function () { S.game = 'fa'; S.st.fa = 'none'; render(); }],
        [25000, function () { S.screen = 'set'; render(); }],
        [28500, function () { S.screen = 'lib'; S.game = 'ps'; S.st.ps = 'installed'; render(); stopTour(); }]];
      seq.forEach(function (s) { timers.tour.push(setTimeout(s[1], s[0])); });
    }
  });

  /* старт: ?game=fa&state=update&screen=set&toast=1 — удобно для скриншотов */
  (function () {
    var q = new URLSearchParams(location.search);
    if (GAMES[q.get('game')]) S.game = q.get('game');
    if (/^(none|installing|installed|update|err-nf|err-ver)$/.test(q.get('state') || '')) S.st[S.game] = q.get('state');
    if (q.get('screen') === 'set') S.screen = 'set';
    fit(); render(false);
    if (S.screen === 'set') { lib.hidden = true; set.hidden = false; }
    if (q.get('toast') === '1') setTimeout(showToast, 600);
    requestAnimationFrame(moveSel);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveSel(); fit(); });
  })();
})();
