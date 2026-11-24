/* Лаунчер «Переведено.» — макет интерфейса, этап 1 (+ «Каталог и библиотека», этап 5).
   Логики установки нет: кнопки ничего не делают по-настоящему. Навигация, добавление/удаление
   из библиотеки и состояния показываются для просмотра; переключатель — панель «Демо» под окном. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var TG = 'https://t.me/perevedeno_w';

  /* Данные игр. % перевода никогда не 100 — как на сайте. */
  var GAMES = {
    ps: {
      name: 'Psycho-Sleuth', tag: '', kind: 'Steam · ПК', status: 'Готово',
      sub: 'Детективная новелла про Отбор, Патосинки и Бога Логики',
      art: 'img/art-psycho-sleuth.jpg', cover: 'img/cover-psycho-sleuth.webp', ap: '18% 22%',
      path: 'D:\\SteamLibrary\\steamapps\\common\\Psycho-Sleuth', credit: 'Арт: © PHOSEPO',
      pct: 90, ver: '1.3', next: '1.4', date: '23.11.2026',
      url: 'https://perevedeno.com/psycho-sleuth.html',
      news: ['Весь сюжет: 5 глав, ≈24 700 строк', 'Исследование локаций и интерфейс', 'Правки после вычитки по главам'],
      nextNews: ['Правки по итогам вычитки последних глав', 'Исправлены переносы строк в длинных репликах', 'Уточнены термины и имена по глоссарию']
    },
    fa: {
      name: 'The False Alice', tag: 'демо', kind: 'Steam · ПК · демо', status: 'Демо готово',
      sub: 'Мрачная сказка от VISUAL ARTS про трёх Ложных Алис',
      art: 'img/art-false-alice.jpg', cover: 'img/cover-false-alice.webp', ap: '60px -265px', as: '680px auto',
      path: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\The False Alice Demo', credit: 'Арт: © VISUAL ARTS',
      pct: 87, ver: '1.0', next: '1.1', date: '24.11.2026',
      url: 'https://perevedeno.com/false-alice.html',
      news: ['Весь сюжет демо: 5 сцен, 1285 строк', 'Имена персонажей и текстовое меню', 'Родная кириллица в шрифте игры'],
      nextNews: ['Исправлены опечатки из сообщений игроков', 'Поправлены переносы в длинных репликах']
    }
  };
  /* Игра «в работе» для каталога. Число глав и прогресс — ЗАГЛУШКА, заменить реальными данными из манифеста. */
  var WIP = { name: 'The False Alice', tag: 'полная версия', sub: 'Полная игра выходит 26.11 — переводим дальше демо', art: 'img/art-false-alice.jpg', total: 6, done: 2, part: .4 };
  var ORDER = ['ps', 'fa'];
  /* lib — что игрок добавил в библиотеку; game — выбранная игра (null, если библиотека пуста) */
  var S = { lib: ['ps', 'fa'], game: 'ps', screen: 'lib', st: { ps: 'installed', fa: 'none' }, prog: { ps: 0, fa: 0 },
    ver: { ps: GAMES.ps.ver, fa: GAMES.fa.ver }, morph: false, notify: false };
  var timers = { inst: null, tour: [] };

  var win = $('#win'), glist = $('#glist'), gsel = $('#gsel'), toast = $('#toast'), dlg = $('#dlg');
  var SCR = { lib: $('#scrLib'), cat: $('#scrCat'), set: $('#scrSet') }, lib = SCR.lib;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function inLib(id) { return S.lib.indexOf(id) >= 0; }
  function busy(id) { return /ing$/.test(S.st[id]); }
  function hasPatch(id) { return S.st[id] === 'installed' || S.st[id] === 'update' || S.st[id] === 'updating'; }

  /* ---------- список слева ---------- */
  function sideStatus(id) {
    var g = GAMES[id], s = S.st[id];
    switch (s) {
      case 'installed': return ['ok', 'Установлено · ' + S.ver[id]];
      case 'updating': return ['run', 'Обновление… ' + Math.round(S.prog[id]) + '%'];
      case 'update': return ['upd', 'Доступно ' + g.next];
      case 'installing': return ['run', 'Установка… ' + Math.round(S.prog[id]) + '%'];
      case 'err-nf': return ['err', 'Игра не найдена'];
      case 'reinstall': return ['upd', 'Поставить заново'];
      case 'wait': return ['', 'Ждём перевод'];
      default: return ['', 'Не установлено'];
    }
  }
  /* Перестраивает список по S.lib; flyId — игра, которая «влетает» */
  function buildSide(flyId) {
    $$('.gi', glist).forEach(function (b) { b.remove(); });
    S.lib.forEach(function (id) {
      var g = GAMES[id], b = document.createElement('button');
      b.type = 'button'; b.className = 'gi' + (id === flyId ? ' fly' : ''); b.setAttribute('data-game', id);
      b.innerHTML = '<span class="gi-cov" style="background-image:url(' + g.cover + ')"></span><span class="gi-t"><strong>' + esc(g.name) +
        (g.tag ? ' <small>' + g.tag + '</small>' : '') + '</strong><span class="gi-st"></span></span>';
      glist.appendChild(b);
    });
    glist.classList.toggle('is-empty', !S.lib.length);
  }
  function paintSide() {
    $$('.gi[data-game]', glist).forEach(function (b) {
      var id = b.getAttribute('data-game'), st = sideStatus(id), el = $('.gi-st', b);
      el.setAttribute('data-k', st[0]); el.textContent = st[1];
      b.setAttribute('aria-current', S.screen === 'lib' && id === S.game ? 'page' : 'false');
    });
    $('#setBtn').classList.toggle('on', S.screen === 'set');
    $('#catBtn').classList.toggle('on', S.screen === 'cat');
    moveSel();
  }
  function moveSel() {
    var b = S.game && $('.gi[data-game="' + S.game + '"]', glist);
    if (b) { gsel.style.setProperty('--sy', b.offsetTop + 'px'); gsel.style.setProperty('--sh', b.offsetHeight + 'px'); }
    gsel.style.setProperty('--so', b && S.screen === 'lib' ? '1' : '0');
  }

  /* ---------- блок действия на странице игры ---------- */
  var PLAY = '<svg class="pl" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.6v10.8a.6.6 0 0 0 .9.5l9-5.4a.6.6 0 0 0 0-1L3.9 1.1a.6.6 0 0 0-.9.5z" fill="currentColor"/></svg>';
  function actHTML(id) {
    var g = GAMES[id], s = S.st[id], h = '';
    var sec = function (en) {
      return '<div class="act-sec"><button type="button" class="btn btn-ghost btn-s"' + (en ? '' : ' aria-disabled="true"') + '>Вернуть английский</button>' +
        '<button type="button" class="btn btn-ghost btn-s" data-news>Что нового</button></div>';
    };
    if (s === 'none') {
      h = '<div class="act-row"><button type="button" class="btn btn-primary btn-big">Установить перевод</button></div>' +
        '<p class="act-hint">Найдём игру в Steam, сохраним копию оригинальных файлов и поставим перевод ' + g.ver + '.</p>' + sec(false);
    } else if (s === 'installing' || s === 'updating') {
      h = '<div class="prog-h"><strong>' + (s === 'updating' ? 'Обновляем до ' + g.next : 'Ставим перевод ' + g.ver) + '</strong><b data-pct>0%</b></div>' +
        '<div class="bar"><i data-bar></i></div>' +
        '<ol class="steps"><li data-step="0"><span class="si"></span>Ищем игру…</li><li data-step="1"><span class="si"></span>Делаем копию…</li><li data-step="2"><span class="si"></span>Ставим перевод…</li></ol>' +
        '<p class="act-hint">Не закрывайте игру и лаунчер — это займёт пару секунд.</p>';
    } else if (s === 'installed') {
      var mc = S.morph ? ' morph' : ''; S.morph = false;
      h = '<div class="act-row"><button type="button" class="btn btn-primary btn-big btn-play' + mc + '">' + PLAY + 'Играть</button>' +
        '<span class="st-tag' + mc + '" role="status">Установлено <span class="ck">✓</span></span></div>' +
        '<p class="act-hint">Перевод ' + S.ver[id] + ' актуален · игра запустится через Steam.</p>' + sec(true);
    } else if (s === 'update') {
      h = '<div class="act-row"><button type="button" class="btn btn-primary btn-big">Обновить до ' + g.next + '</button>' +
        '<button type="button" class="btn btn-ghost btn-play2">' + PLAY + 'Играть</button></div>' +
        '<p class="act-hint"><span class="badge">Новая версия</span> Сейчас стоит ' + g.ver + ' — играть можно и на ней. Сохранения и настройки игры не трогаем.</p>' + sec(true);
    } else if (s === 'err-nf') {
      h = '<div class="err"><span class="err-ic">!</span><div><h3>Игра не найдена</h3><p>Не нашли ' + esc(g.name) + ' в библиотеках Steam. Если игра стоит в другом месте — укажите её папку вручную.</p>' +
        '<div class="act-row"><button type="button" class="btn btn-primary btn-m">Указать папку</button><button type="button" class="btn btn-ghost btn-m">Проверить снова</button></div></div></div>';
    } else if (s === 'reinstall') {
      h = '<div class="err warn"><span class="err-ic">↻</span><div><h3>Игра обновилась — перевод нужно поставить заново</h3><p>Steam обновил ' + esc(g.name) + ', и русский текст слетел. Новая сборка уже поддерживается — это один клик.</p>' +
        '<div class="act-row"><button type="button" class="btn btn-primary btn-m">Поставить перевод заново</button><button type="button" class="btn btn-ghost btn-m">' + PLAY + 'Играть на английском</button></div></div></div>';
    } else if (s === 'wait') {
      h = '<div class="err warn"><span class="err-ic">…</span><div><h3>Ждём обновление перевода</h3><p>Игра обновилась в Steam, а перевод для новой сборки ещё не готов. Файлы игры мы не трогали — пока можно играть на английском. Когда перевод выйдет, лаунчер сообщит.</p>' +
        '<div class="act-row"><button type="button" class="btn btn-primary btn-m">' + PLAY + 'Играть на английском</button><a class="btn btn-ghost btn-m" href="' + TG + '" target="_blank" rel="noopener">Новости в Telegram <span class="arr">↗</span></a></div></div></div>';
    }
    return '<div class="act-in swap">' + h + '</div>';
  }
  function pathHTML(id) {
    var g = GAMES[id], nf = S.st[id] === 'err-nf';
    return '<div class="gpath ap" style="--i:7"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>' +
      '<code>' + (nf ? 'Папка игры не найдена' : esc(g.path)) + '</code>' + (nf ? '<b class="no">✕ нет</b>' : '<b>✓ найдена</b>') + '</div>';
  }
  function verTile(id) {
    var g = GAMES[id];
    return /^updat/.test(S.st[id]) ? g.ver + '<span class="nv">→ ' + g.next + '</span>' : S.ver[id];
  }
  function libHTML(id) {
    var g = GAMES[id], s = S.st[id];
    return '<div class="hero"><div class="hero-art" style="background-image:url(' + g.art + ');--ap:' + g.ap + (g.as ? ';--as:' + g.as : '') + '"></div>' +
      '<div class="hero-t"><span class="hero-k ap" style="--i:0">' + esc(g.kind) + '</span>' +
      '<h1 class="ap" style="--i:1">' + esc(g.name) + (g.tag ? '<small>' + g.tag + '</small>' : '') + '</h1>' +
      '<p class="ap" style="--i:2">' + esc(g.sub) + '</p></div><span class="hero-cr">' + esc(g.credit) + '</span></div>' +
      '<div class="gbody"><div>' +
      '<div class="tiles"><div class="tile ap" style="--i:3"><b>' + g.pct + '%</b><span>Перевод</span><div class="mb"><i style="width:' + g.pct + '%"></i></div></div>' +
      '<div class="tile ap" style="--i:4"><b>' + verTile(id) + '</b><span>Версия перевода</span></div>' +
      '<div class="tile ap" style="--i:5"><b class="sm">' + g.date + '</b><span>Последнее обновление</span></div></div>' +
      '<div class="act ap" style="--i:6" data-s="' + s + '">' + actHTML(id) + '</div>' + pathHTML(id) + '</div>' +
      '<div><div class="news ap" style="--i:7"><h3>Что нового<span>в ' + g.ver + '</span></h3><ul>' +
      g.news.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="side-links ap" style="--i:8"><a href="' + g.url + '" target="_blank" rel="noopener">Страница игры на сайте <span class="arr">↗</span></a>' +
      '<small>Скриншоты, вопросы и команда перевода</small>' +
      '<button type="button" class="lk" data-bug="' + id + '">Нашли ошибку в переводе? <span class="arr">→</span></button>' +
      '<button type="button" class="rm" data-remove="' + id + '">Убрать из библиотеки</button></div></div></div>';
  }

  /* ---------- пустая библиотека: первый запуск, поиск игр в Steam ---------- */
  function emptyHTML() {
    var g = GAMES.ps;
    return '<div class="empty"><div class="empty-in">' +
      '<div class="scan"><span class="scan-r"></span><span class="scan-r r2"></span><span class="scan-ic">RU</span></div>' +
      '<div class="scan-t"><h1>Ищем ваши игры в Steam…</h1><p>Смотрим, для каких из них у нас уже есть перевод.</p></div>' +
      '<div class="found"><span class="hero-k">Первый запуск</span><h1>Нашли у вас в Steam</h1>' +
      '<p>Для этой игры есть наш перевод. В программе найденные игры попадут в библиотеку сами.</p>' +
      '<div class="found-row"><span class="gi-cov" style="background-image:url(' + g.cover + ')"></span><span class="found-n"><strong>' + esc(g.name) + '</strong><small>Перевод ' + g.pct + '% · версия ' + g.ver + '</small></span>' +
      '<button type="button" class="btn btn-primary btn-m" data-add="ps">Добавить в библиотеку</button></div>' +
      '<button type="button" class="btn btn-ghost btn-m" data-go="cat">Открыть каталог <span class="arr">→</span></button>' +
      '<button type="button" class="chk" role="checkbox" aria-checked="true"><span class="chk-b"></span>Запускать вместе с Windows и сворачивать в трей</button>' +
      '<small class="chk-n">Так лаунчер сам сообщит о новых версиях. Можно выключить в настройках.</small>' +
      '</div></div></div>';
  }

  /* ---------- каталог ---------- */
  function notifyHTML() {
    return S.notify ? '<span class="st-tag morph">Сообщим в лаунчере <span class="ck">✓</span></span>'
      : '<button type="button" class="btn btn-ghost btn-m" data-notify>Сообщить, когда выйдет</button>';
  }
  function wipHTML(n) {
    var seg = '';
    for (var i = 0; i < WIP.total; i++) seg += '<i' + (i < WIP.done ? ' class="on"' : i === WIP.done ? ' class="part" style="--p:' + WIP.part + '"' : '') + '></i>';
    return '<article class="cc wip ap" style="--i:' + n + '"><div class="cc-art" style="background-image:url(' + WIP.art + ')"><span class="pill work">В работе</span></div>' +
      '<div class="cc-b"><h3>' + esc(WIP.name) + ' <small>' + WIP.tag + '</small></h3><p>' + esc(WIP.sub) + '</p>' +
      '<div class="cc-pr"><span>Главы</span><span>' + WIP.done + ' из ' + WIP.total + '</span></div><div class="segs">' + seg + '</div>' +
      '<div class="cc-steam dim">Сроков не обещаем — сообщим, когда выйдет</div><div class="cc-act" data-notify-box>' + notifyHTML() + '</div></div></article>';
  }
  function catHTML() {
    var cards = ORDER.map(function (id, n) {
      var g = GAMES[id], inl = inLib(id), act;
      if (inl && (hasPatch(id) || busy(id))) {
        act = '<span class="st-tag">В библиотеке <span class="ck">✓</span></span><button type="button" class="btn btn-ghost btn-s" data-open="' + id + '">Открыть <span class="arr">→</span></button>';
      } else if (inl) {
        act = '<button type="button" class="btn btn-primary btn-m" data-add="' + id + '" data-install>Установить перевод</button><span class="cc-in">В библиотеке ✓</span>';
      } else {
        act = '<button type="button" class="btn btn-primary btn-m" data-add="' + id + '" data-install>Установить перевод</button>' +
          '<button type="button" class="btn btn-ghost btn-s" data-add="' + id + '">Добавить в библиотеку</button>';
      }
      return '<article class="cc ap" style="--i:' + (n + 2) + '"><div class="cc-art" style="background-image:url(' + g.art + ')"><span class="pill">' + g.status + '</span></div>' +
        '<div class="cc-b"><h3>' + esc(g.name) + (g.tag ? ' <small>' + g.tag + '</small>' : '') + '</h3><p>' + esc(g.sub) + '</p>' +
        '<div class="cc-pr"><span>Перевод</span><span>' + g.pct + '%</span></div><div class="mb"><i style="width:' + g.pct + '%"></i></div>' +
        '<div class="cc-steam">✓ Есть у вас в Steam</div><div class="cc-act">' + act + '</div></div></article>';
    }).join('');
    return '<div class="cat-w"><div class="cat-h"><div><h1 class="ap" style="--i:0">Каталог</h1><p class="ap" style="--i:1">Все наши переводы. Добавьте новеллу — она появится в библиотеке слева.</p></div>' +
      '<span class="cat-n ap" style="--i:1">' + ORDER.length + ' перевода · 1 в работе</span></div><div class="cat-g">' + cards +
      wipHTML(ORDER.length + 2) +
      '<article class="cc soon ap" style="--i:' + (ORDER.length + 3) + '"><span class="pill dim">Скоро</span><h3>Что переводить дальше?</h3>' +
      '<p>Предложите новеллу без русского языка — посмотрим движок и возьмём в работу, если получится.</p>' +
      '<a class="btn btn-ghost btn-m" href="' + TG + '" target="_blank" rel="noopener">Предложить новеллу <span class="arr">↗</span></a></article>' +
      '</div></div>';
  }

  /* ---------- фон окна: размытый арт выбранной игры ---------- */
  var bg = { cur: null, n: 0 };
  function paintBg() {
    var id = S.game || null; if (id === bg.cur) return;
    bg.cur = id;
    var L = $$('.wbg', win), a = L[bg.n], b = L[bg.n = 1 - bg.n];
    if (id) { b.style.backgroundImage = 'url(' + GAMES[id].art + ')'; b.classList.add('on'); }
    a.classList.remove('on');
  }

  /* ---------- переходы между экранами ---------- */
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
  function screenHTML() {
    return S.screen === 'lib' ? (S.game ? libHTML(S.game) : emptyHTML()) : S.screen === 'cat' ? catHTML() : null;
  }
  function render(anim) {
    Object.keys(SCR).forEach(function (k) { if (k !== S.screen) hideScreen(SCR[k]); });
    var el = SCR[S.screen], html = screenHTML();
    if (anim === false) { if (html != null) el.innerHTML = html; el.classList.remove('leave'); el.hidden = false; }
    else swapScreen(el, html);
    if (S.screen === 'lib' && S.game && busy(S.game)) syncProgress(S.game);
    paintSide(); paintDemo(); paintBg();
  }
  /* Меняется только блок действия — без перерисовки всей страницы */
  function renderAct() {
    var a = $('.act', lib), id = S.game;
    if (a && id && S.screen === 'lib') {
      a.setAttribute('data-s', S.st[id]);
      a.innerHTML = actHTML(id);
      var t = $$('.tile b', lib)[1]; if (t) t.innerHTML = verTile(id);
      var gp = $('.gpath', lib); if (gp) { var d = document.createElement('div'); d.innerHTML = pathHTML(id); gp.replaceWith(d.firstChild); }
      if (busy(id)) syncProgress(id);
    }
    paintSide(); paintDemo();
  }

  /* ---------- «установка» для показа: полоса и шаги ---------- */
  var inst = { id: null, t0: 0, dur: 0 };
  function syncProgress(id) {
    var v = S.prog[id], bar = $('[data-bar]', lib), pc = $('[data-pct]', lib);
    if (S.game === id && S.screen === 'lib' && bar) {
      bar.style.transform = 'scaleX(' + (v / 100).toFixed(3) + ')';
      pc.textContent = Math.round(v) + '%';
      var step = v >= 99.5 ? 3 : v < 22 ? 0 : v < 52 ? 1 : 2;
      $$('.steps li', lib).forEach(function (li, i) { li.className = i < step ? 'ok' : i === step ? 'on' : ''; });
    }
    var st = sideStatus(id), el = $('.gi[data-game="' + id + '"] .gi-st', glist);
    if (el) { el.setAttribute('data-k', st[0]); el.textContent = st[1]; }
  }
  function runInstall(id) {
    clearInterval(timers.inst);
    S.prog[id] = 0; inst = { id: id, t0: performance.now(), dur: reduce ? 1200 : 5200 };
    var tick = function () {
      var p = Math.min(1, (performance.now() - inst.t0) / inst.dur);
      var e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      S.prog[id] = p >= 1 ? 100 : Math.min(99, e * 100);
      syncProgress(id);
      if (p >= 1) {
        clearInterval(timers.inst);
        setTimeout(function () {
          if (!busy(id)) return;
          if (S.st[id] === 'updating') S.ver[id] = GAMES[id].next;
          S.st[id] = 'installed';
          if (S.game === id && S.screen === 'lib') { S.morph = true; renderAct(); S.morph = false; }
          else if (S.screen === 'cat') { SCR.cat.innerHTML = catHTML(); paintSide(); paintDemo(); }
          else { paintSide(); paintDemo(); }
        }, 450);
      }
    };
    timers.inst = setInterval(tick, 50); tick();
  }
  function stopInstall() {
    clearInterval(timers.inst);
    ORDER.forEach(function (id) { if (busy(id)) S.st[id] = S.st[id] === 'updating' ? 'update' : 'none'; });
  }

  /* ---------- библиотека: добавить / убрать ---------- */
  function addGame(id, install) {
    var isNew = !inLib(id);
    if (isNew) S.lib.push(id);
    if (install && !hasPatch(id)) { stopInstall(); S.st[id] = 'installing'; }
    S.game = id; S.screen = 'lib';
    buildSide(isNew ? id : null);
    render();
    if (install && S.st[id] === 'installing') runInstall(id);
  }
  function removeGame(id, revert) {
    closeDlg();
    if (busy(id)) stopInstall();
    if (revert || !hasPatch(id)) { S.st[id] = 'none'; S.ver[id] = GAMES[id].ver; }
    var b = $('.gi[data-game="' + id + '"]', glist);
    var done = function () {
      S.lib = S.lib.filter(function (x) { return x !== id; });
      if (S.game === id) S.game = S.lib[0] || null;
      buildSide(); S.screen = 'lib'; render();
    };
    if (b && !reduce) { b.classList.add('out'); gsel.style.setProperty('--so', '0'); setTimeout(done, 320); } else done();
  }
  function openDlg(id) {
    var g = GAMES[id], has = hasPatch(id);
    $('#dlgC').innerHTML = '<h2 id="dlgT">Убрать «' + esc(g.name) + '» из библиотеки?</h2>' +
      (has ? '<p>Перевод сейчас установлен. Вернуть игре английский язык? Сама игра и сохранения останутся на месте.</p>'
           : '<p>Новелла исчезнет из списка слева. Вернуть её можно в любой момент через каталог.</p>') +
      '<div class="dlg-b">' + (has
        ? '<button type="button" class="btn btn-primary btn-m" data-dlg="revert" data-id="' + id + '">Убрать и вернуть английский</button><button type="button" class="btn btn-ghost btn-m" data-dlg="keep" data-id="' + id + '">Убрать, перевод оставить</button>'
        : '<button type="button" class="btn btn-primary btn-m" data-dlg="keep" data-id="' + id + '">Убрать</button>') +
      '<button type="button" class="btn btn-ghost btn-m" data-dlg="cancel">Отмена</button></div>';
    dlg.hidden = false; dlg.classList.remove('hide'); void dlg.offsetWidth; dlg.classList.add('show');
    var f = $('[data-dlg=cancel]', dlg); if (f) f.focus({ preventScroll: true });
  }
  function showDlg(html) {
    $('#dlgC').innerHTML = html;
    dlg.hidden = false; dlg.classList.remove('hide'); void dlg.offsetWidth; dlg.classList.add('show');
    var f = $('[data-dlg=cancel]', dlg); if (f) f.focus({ preventScroll: true });
  }
  function bugText(id) { return 'Игра: ' + GAMES[id].name + (GAMES[id].tag ? ' (' + GAMES[id].tag + ')' : '') + '\nВерсия перевода: ' + S.ver[id] + '\nГде ошибка (глава, сцена, реплика): \nСкриншот: приложите к сообщению'; }
  function bugDlg(id) {
    showDlg('<h2 id="dlgT">Нашли ошибку в переводе?</h2><p>Напишите нам в Telegram — исправим в следующей версии. Шаблон уже заполнен, останется приложить скриншот.</p>' +
      '<pre class="tpl">' + esc(bugText(id)) + '</pre>' +
      '<div class="dlg-b"><a class="btn btn-primary btn-m" href="' + TG + '" target="_blank" rel="noopener" data-copy="' + id + '">Скопировать и открыть Telegram <span class="arr">↗</span></a>' +
      '<button type="button" class="btn btn-ghost btn-m" data-dlg="cancel">Закрыть</button></div>');
  }
  function newsDlg(id) {
    var g = GAMES[id];
    showDlg('<span class="badge">Новая версия</span><h2 id="dlgT" class="big">Что нового в ' + g.next + '</h2><p>' + esc(g.name) + ' · сейчас стоит ' + g.ver + '</p>' +
      '<ul class="nl">' + g.nextNews.map(function (n, i) { return '<li style="--i:' + (i + 1) + '">' + esc(n) + '</li>'; }).join('') + '</ul>' +
      '<div class="dlg-b row"><button type="button" class="btn btn-primary btn-m" data-dlg="update">Обновить до ' + g.next + '</button>' +
      '<button type="button" class="btn btn-ghost btn-m" data-dlg="cancel">Позже</button></div>');
  }
  /* уведомление Windows из трея (макет, вне окна) и заставка */
  var wn = $('#winnotif'), wnT;
  function showWn() { if (!wn) return; wn.classList.remove('show'); void wn.offsetWidth; wn.classList.add('show'); clearTimeout(wnT); wnT = setTimeout(hideWn, 9000); }
  function hideWn() { if (wn) wn.classList.remove('show'); clearTimeout(wnT); }
  function splash() { var s = $('#splash'); s.classList.remove('go'); void s.offsetWidth; s.classList.add('go'); }
  function closeDlg() {
    if (dlg.hidden) return;
    dlg.classList.remove('show');
    if (reduce) { dlg.hidden = true; return; }
    dlg.classList.add('hide'); setTimeout(function () { dlg.hidden = true; dlg.classList.remove('hide'); }, 220);
  }

  /* ---------- тост ---------- */
  var toastT;
  function showToast() {
    toast.classList.remove('show'); void toast.offsetWidth; toast.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(hideToast, 7000);
  }
  function hideToast() { toast.classList.remove('show'); clearTimeout(toastT); }

  /* ---------- события в окне ---------- */
  function go(screen) { if (S.screen !== screen) { S.screen = screen; render(); } }
  win.addEventListener('click', function (e) {
    var t = e.target, b;
    if ((b = t.closest('.gi[data-game]'))) {
      var id = b.getAttribute('data-game');
      if (id !== S.game || S.screen !== 'lib') { S.game = id; S.screen = 'lib'; render(); }
      return;
    }
    if (t.closest('#setBtn')) return go('set');
    if (t.closest('#catBtn') || t.closest('#addBtn') || t.closest('[data-go=cat]')) return go('cat');
    if ((b = t.closest('[data-add]'))) return addGame(b.getAttribute('data-add'), b.hasAttribute('data-install'));
    if ((b = t.closest('[data-open]'))) { S.game = b.getAttribute('data-open'); S.screen = 'lib'; return render(); }
    if ((b = t.closest('[data-remove]'))) return openDlg(b.getAttribute('data-remove'));
    if ((b = t.closest('[data-dlg]'))) {
      var k = b.getAttribute('data-dlg');
      if (k === 'cancel') return closeDlg();
      if (k === 'update') { closeDlg(); hideToast(); return setState('updating'); }
      return removeGame(b.getAttribute('data-id'), k === 'revert');
    }
    if (t === dlg) return closeDlg();
    if ((b = t.closest('[data-bug]'))) return bugDlg(b.getAttribute('data-bug'));
    if ((b = t.closest('[data-copy]'))) {
      try { navigator.clipboard.writeText(bugText(b.getAttribute('data-copy'))); } catch (err) {}
      return;
    }
    if ((b = t.closest('[data-notify]'))) { S.notify = true; b.parentNode.innerHTML = notifyHTML(); return; }
    if ((b = t.closest('.chk'))) { b.setAttribute('aria-checked', b.getAttribute('aria-checked') === 'true' ? 'false' : 'true'); return; }
    if (t.closest('[data-toast-news]')) { hideToast(); return openNews(); }
    if ((b = t.closest('.sw'))) { b.setAttribute('aria-checked', b.getAttribute('aria-checked') === 'true' ? 'false' : 'true'); return; }
    if (t.closest('[data-toast-x]')) return hideToast();
    if (t.closest('[data-news]')) {
      if (S.game && S.st[S.game] === 'update') return newsDlg(S.game);
      var n = $('.news', lib); if (!n) return;
      n.classList.remove('flash'); void n.offsetWidth; n.classList.add('flash');
      setTimeout(function () { n.classList.remove('flash'); }, 900);
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDlg(); });

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

  function openNews() {
    if (!S.game) { S.lib = ['ps']; S.game = 'ps'; buildSide('ps'); }
    if (S.st[S.game] !== 'update' || S.screen !== 'lib') setState('update');
    newsDlg(S.game);
  }
  if (wn) wn.addEventListener('click', function (e) {
    if (e.target.closest('[data-wn-go]')) { hideWn(); openNews(); } else if (e.target.closest('button')) hideWn();
  });

  /* ---------- панель «Демо» ---------- */
  function paintDemo() {
    $$('.demo .dg[data-g]').forEach(function (g) {
      var k = g.getAttribute('data-g');
      var v = k === 'lib' ? String(S.lib.length) : k === 'game' ? (S.screen === 'lib' ? S.game : '') : k === 'screen' ? S.screen : (S.game && S.screen === 'lib' ? S.st[S.game] : '');
      $$('.dc', g).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-v') === v ? 'true' : 'false'); });
    });
  }
  function stopTour() { timers.tour.forEach(clearTimeout); timers.tour = []; $('[data-act=tour]').setAttribute('aria-pressed', 'false'); }
  function setLib(n) {
    closeDlg(); stopInstall(); if (n === 0) S.notify = false;
    S.lib = ORDER.slice(0, n);
    S.game = inLib(S.game) ? S.game : (S.lib[0] || null);
    if (n === 0) { S.st = { ps: 'none', fa: 'none' }; S.ver = { ps: GAMES.ps.ver, fa: GAMES.fa.ver }; }
    S.screen = 'lib'; buildSide(); render();
  }
  function setState(v) {
    stopInstall(); closeDlg();
    if (!S.game) { S.lib = ['ps']; S.game = 'ps'; buildSide('ps'); }
    var id = S.game;
    if (v !== 'installed' && v !== 'updating') S.ver[id] = GAMES[id].ver;
    S.st[id] = v;
    if (S.screen !== 'lib') { S.screen = 'lib'; render(); } else renderAct();
    if (busy(id)) runInstall(id);
  }
  $('#demo').addEventListener('click', function (e) {
    var b = e.target.closest('.dc'); if (!b) return;
    var g = b.parentNode.getAttribute('data-g'), v = b.getAttribute('data-v'), act = b.getAttribute('data-act');
    if (act !== 'tour' && act !== 'toast' && act !== 'wn') stopTour();
    if (g === 'lib') setLib(+v);
    else if (g === 'game') { if (!inLib(v)) addGame(v, false); else if (v !== S.game || S.screen !== 'lib') { S.game = v; S.screen = 'lib'; render(); } }
    else if (g === 'screen') go(v);
    else if (g === 'state') setState(v);
    else if (act === 'toast') showToast();
    else if (act === 'wn') showWn();
    else if (act === 'news') openNews();
    else if (act === 'bug') { if (!S.game) setState('installed'); else if (S.screen !== 'lib') go('lib'); bugDlg(S.game); }
    else if (act === 'splash') splash();
    else if (act === 'tour') {
      if (timers.tour.length) { stopTour(); return; }
      b.setAttribute('aria-pressed', 'true');
      var seq = [[0, function () { setLib(0); }],
        [5000, function () { addGame('ps', false); }],
        [7500, function () { setState('installing'); }],
        [14500, showToast],
        [17000, function () { hideToast(); setState('update'); }],
        [20000, function () { setState('updating'); }],
        [27500, function () { go('cat'); }],
        [30500, function () { addGame('fa', true); }],
        [38000, function () { setState('err-nf'); }],
        [41000, function () { setState('reinstall'); }],
        [44000, function () { setState('none'); go('set'); }],
        [47500, function () { S.game = 'ps'; S.screen = 'lib'; render(); stopTour(); }]];
      seq.forEach(function (s) { timers.tour.push(setTimeout(s[1], s[0])); });
    }
  });

  /* старт: ?lib=0|1|2&game=fa&state=update&screen=set|cat&toast=1 — удобно для скриншотов */
  (function () {
    var q = new URLSearchParams(location.search);
    if (/^[012]$/.test(q.get('lib') || '')) { S.lib = ORDER.slice(0, +q.get('lib')); if (!S.lib.length) S.st.ps = 'none'; }
    if (GAMES[q.get('game')] && inLib(q.get('game'))) S.game = q.get('game');
    if (!inLib(S.game)) S.game = S.lib[0] || null;
    if (S.game && /^(none|installing|installed|update|updating|err-nf|reinstall|wait)$/.test(q.get('state') || '')) S.st[S.game] = q.get('state');
    if (/^(set|cat)$/.test(q.get('screen') || '')) S.screen = q.get('screen');
    fit(); buildSide(); render(false);
    Object.keys(SCR).forEach(function (k) { SCR[k].hidden = k !== S.screen; });
    if (S.game && busy(S.game)) runInstall(S.game);
    if (q.get('toast') === '1') setTimeout(showToast, 600);
    if (q.get('wn') === '1') setTimeout(showWn, 600);
    if (q.get('dlg') === 'news') openNews(); else if (q.get('dlg') === 'bug' && S.game) bugDlg(S.game);
    if (q.get('splash') !== '0') splash();
    requestAnimationFrame(moveSel);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveSel(); fit(); });
  })();
})();
