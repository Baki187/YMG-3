/* ============================================================
   Sunum motoru — sade JS, file:// altında çalışır (modül yok, fetch yok)
   ============================================================ */
(function () {
  'use strict';

  var W = 1920, H = 1080;
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var factories = {};

  var Deck = window.Deck = {
    reduced: reduced,
    scale: 1,
    register: function (name, factory) { factories[name] = factory; },
    /* Bir öğenin, slayt içindeki (1920×1080 koordinatlı) konumunu verir */
    rectIn: function (el, container) {
      var a = el.getBoundingClientRect(), b = container.getBoundingClientRect(), s = Deck.scale || 1;
      return { x: (a.left - b.left) / s, y: (a.top - b.top) / s, w: a.width / s, h: a.height / s };
    }
  };

  var viewport, stage, slides = [], infos = [], cur = -1, step = 0, timer = null;
  var notesEl, overviewEl, progressEl, slidenoEl, helpEl;

  /* ---------- Yardımcılar ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function parseRanges(str) {
    var set = {};
    if (!str) return set;
    str.split(',').forEach(function (part) {
      part = part.trim(); if (!part) return;
      var m = part.split('-');
      var a = parseInt(m[0], 10), b = m.length > 1 ? parseInt(m[1], 10) : a;
      for (var i = a; i <= b; i++) set[i] = true;
    });
    return set;
  }

  /* ---------- Ölçekleme ---------- */
  function layout() {
    var iw = window.innerWidth;
    var ih = window.innerHeight - (notesEl.classList.contains('open') ? notesEl.offsetHeight : 0);
    if (ih < 100) ih = 100;
    var s = Math.min(iw / W, ih / H);
    Deck.scale = s;
    var x = (iw - W * s) / 2, y = (ih - H * s) / 2;
    stage.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')';
  }

  /* ---------- Slayt bilgisi ---------- */
  function buildInfo(el, idx) {
    var info = { el: el, idx: idx, ctrl: null, steps: 0, frags: [], hls: [] };

    // Önce animasyon fabrikası: JS ile üretilen [data-show] öğeleri de sayılsın
    var animName = el.getAttribute('data-anim');
    if (animName && factories[animName]) {
      try { info.ctrl = factories[animName](el, Deck); }
      catch (e) { if (window.console) console.error('Animasyon hatası (' + animName + '):', e); }
      if (info.ctrl && info.ctrl.steps > info.steps) info.steps = info.ctrl.steps;
    }

    $$('[data-show]', el).forEach(function (f) {
      var n = parseInt(f.getAttribute('data-show'), 10);
      info.frags.push({ el: f, n: n, hide: parseInt(f.getAttribute('data-hide') || '0', 10) });
      if (!f.classList.contains('frag')) f.classList.add('frag');
      if (n > info.steps) info.steps = n;
    });

    $$('pre.code[data-hl]', el).forEach(function (pre) {
      var list = pre.getAttribute('data-hl').split('|');
      info.hls.push({ el: pre, list: list.map(parseRanges) });
      if (list.length - 1 > info.steps) info.steps = list.length - 1;
    });

    var forced = el.getAttribute('data-steps');
    if (forced) info.steps = Math.max(info.steps, parseInt(forced, 10));

    // Bölüm etiketi
    var sec = el.getAttribute('data-sec');
    if (sec) {
      var k = document.createElement('div'); k.className = 'kicker'; k.textContent = sec;
      el.insertBefore(k, el.firstChild);
    }

    // Oynat / Duraklat / Başa al düğmeleri
    if (info.steps > 0) {
      var c = document.createElement('div'); c.className = 'ctrls';
      c.innerHTML = '<button type="button" data-act="play">▶ Oynat</button>' +
        '<button type="button" data-act="reset">⟲ Başa al</button>' +
        '<span class="stepinfo"></span>';
      el.appendChild(c);
      info.playBtn = $('[data-act=play]', c);
      info.stepInfo = $('.stepinfo', c);
      c.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        b.blur();
        if (b.getAttribute('data-act') === 'play') togglePlay();
        else resetSlide();
      });
    }
    return info;
  }

  /* ---------- Adım uygulama ---------- */
  function applyStep(info, s, animate) {
    var el = info.el;
    if (!animate) el.classList.add('no-anim');
    for (var k = 1; k <= info.steps; k++) {
      el.classList.toggle('s-' + k, s >= k);
      el.classList.toggle('at-' + k, s === k);
    }
    el.classList.toggle('at-0', s === 0);
    info.frags.forEach(function (f) {
      var on = s >= f.n && !(f.hide && s >= f.hide);
      f.el.classList.toggle('on', on);
    });
    info.hls.forEach(function (h) {
      var set = h.list[Math.min(s, h.list.length - 1)];
      var any = false;
      $$('.ln', h.el).forEach(function (ln, i) {
        var on = !!set[i + 1]; ln.classList.toggle('hl', on); if (on) any = true;
      });
      h.el.classList.toggle('has-hl', any);
    });
    if (info.ctrl && info.ctrl.go) {
      try { info.ctrl.go(s, animate && !reduced); }
      catch (e) { if (window.console) console.error(e); }
    }
    if (info.stepInfo) info.stepInfo.textContent = 'Adım ' + s + ' / ' + info.steps;
    if (!animate) {
      void el.offsetWidth; // reflow
      requestAnimationFrame(function () { el.classList.remove('no-anim'); });
    }
  }

  function setStep(s, animate) {
    var info = infos[cur];
    step = Math.max(0, Math.min(info.steps, s));
    applyStep(info, step, animate);
  }

  /* ---------- Gezinme ---------- */
  function go(i, dir) {
    if (i < 0 || i >= slides.length) return;
    stopPlay();
    if (cur >= 0 && infos[cur]) {
      slides[cur].classList.remove('active');
      if (infos[cur].ctrl && infos[cur].ctrl.leave) infos[cur].ctrl.leave();
    }
    cur = i;
    var info = infos[cur];
    slides[cur].classList.add('active');
    var startStep = (dir === 'back' || reduced) ? info.steps : 0;
    step = startStep;
    applyStep(info, step, false);
    if (info.ctrl && info.ctrl.enter) info.ctrl.enter();

    progressEl.style.width = (slides.length > 1 ? (cur / (slides.length - 1)) * 100 : 100) + '%';
    slidenoEl.textContent = (cur + 1) + ' / ' + slides.length;
    updateNotes();
    var h = '#' + (cur + 1);
    if (location.hash !== h) {
      try { history.replaceState(null, '', h); } catch (e) { location.hash = h; }
    }
    if (overviewEl.classList.contains('open')) markOverview();
  }

  function next() {
    var info = infos[cur];
    if (step < info.steps) setStep(step + 1, true);
    else go(cur + 1, 'fwd');
  }
  function prev() {
    if (step > 0) setStep(step - 1, false);
    else go(cur - 1, 'back');
  }

  /* ---------- Oynat / Duraklat ---------- */
  function togglePlay() { if (timer) stopPlay(); else startPlay(); }
  function startPlay() {
    var info = infos[cur];
    if (!info.steps) return;
    if (step >= info.steps) setStep(0, false);
    var iv = (info.ctrl && info.ctrl.interval) || parseInt(info.el.getAttribute('data-interval') || '1400', 10);
    var tick = function () {
      if (step < infos[cur].steps) {
        setStep(step + 1, true);
        if (step >= infos[cur].steps) stopPlay();
      } else stopPlay();
    };
    tick();
    if (step < info.steps) timer = setInterval(tick, iv);
    if (info.playBtn) info.playBtn.textContent = timer ? '❚❚ Duraklat' : '▶ Oynat';
  }
  function stopPlay() {
    if (timer) { clearInterval(timer); timer = null; }
    var info = infos[cur];
    if (info && info.playBtn) info.playBtn.textContent = '▶ Oynat';
  }
  function resetSlide() { stopPlay(); setStep(0, false); }

  /* ---------- Notlar ---------- */
  function updateNotes() {
    var n = $('aside.notes', slides[cur]);
    var title = $('h2, h1', slides[cur]);
    var t = title ? title.textContent.replace(/\s+/g, ' ').trim() : '';
    notesEl.querySelector('.hd').textContent = 'Konuşmacı notu — Slayt ' + (cur + 1) + (t ? ' · ' + t : '');
    notesEl.querySelector('.body').innerHTML = n ? n.innerHTML : '<p>(Not yok)</p>';
  }
  function toggleNotes() {
    notesEl.classList.toggle('open');
    setTimeout(layout, 260); layout();
  }

  /* ---------- Genel görünüm ---------- */
  function buildOverview() {
    var grid = overviewEl.querySelector('.grid');
    grid.innerHTML = '';
    slides.forEach(function (sl, i) {
      var th = document.createElement('div'); th.className = 'thumb'; th.setAttribute('data-i', i);
      var inner = document.createElement('div'); inner.className = 'inner';
      var clone = sl.cloneNode(true);
      clone.classList.add('active');
      $$('[id]', clone).forEach(function (x) { if (!x.closest('defs')) x.removeAttribute('id'); });
      $$('.ctrls, aside.notes', clone).forEach(function (x) { x.parentNode.removeChild(x); });
      // genel görünümde slaytın son hâli gösterilsin
      $$('.frag', clone).forEach(function (f) { f.classList.add('on'); });
      inner.appendChild(clone);
      th.appendChild(inner);
      var no = document.createElement('div'); no.className = 'no'; no.textContent = (i + 1);
      th.appendChild(no);
      grid.appendChild(th);
    });
    sizeThumbs();
  }
  function sizeThumbs() {
    $$('.thumb', overviewEl).forEach(function (th) {
      var s = th.clientWidth / W;
      th.querySelector('.inner').style.transform = 'scale(' + s + ')';
    });
  }
  function markOverview() {
    $$('.thumb', overviewEl).forEach(function (th, i) { th.classList.toggle('cur', i === cur); });
  }
  function toggleOverview(force) {
    var open = typeof force === 'boolean' ? force : !overviewEl.classList.contains('open');
    if (open) {
      stopPlay();
      overviewEl.classList.add('open');
      buildOverview(); markOverview();
      var c = overviewEl.querySelector('.thumb.cur');
      if (c && c.scrollIntoView) c.scrollIntoView({ block: 'center' });
    } else {
      overviewEl.classList.remove('open');
      overviewEl.querySelector('.grid').innerHTML = '';
    }
  }

  /* ---------- Tam ekran ---------- */
  function toggleFull() {
    if (!document.fullscreenElement) {
      var d = document.documentElement;
      if (d.requestFullscreen) d.requestFullscreen().catch(function () {});
    } else if (document.exitFullscreen) document.exitFullscreen();
  }

  /* ---------- Klavye ---------- */
  function onKey(e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    var t = e.target, tag = t && t.tagName;
    var inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    var k = e.key;

    if (overviewEl.classList.contains('open')) {
      if (k === 'Escape' || k === 'o' || k === 'O') { e.preventDefault(); toggleOverview(false); }
      return;
    }
    if (inInput && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || k === 'Home' || k === 'End' || k === 'PageUp' || k === 'PageDown')) return;

    switch (k) {
      case 'ArrowRight': case ' ': case 'PageDown': case 'Spacebar':
        e.preventDefault(); stopPlay(); next(); break;
      case 'ArrowLeft': case 'PageUp':
        e.preventDefault(); stopPlay(); prev(); break;
      case 'Home': e.preventDefault(); go(0, 'fwd'); break;
      case 'End': e.preventDefault(); go(slides.length - 1, 'fwd'); break;
      case 'f': case 'F': e.preventDefault(); toggleFull(); break;
      case 'n': case 'N': e.preventDefault(); toggleNotes(); break;
      case 'o': case 'O': e.preventDefault(); toggleOverview(); break;
      case 'Escape': if (notesEl.classList.contains('open')) toggleNotes(); break;
      default: return;
    }
    if (inInput && t.blur) t.blur();
  }

  function hashIndex() {
    var n = parseInt((location.hash || '').replace('#', ''), 10);
    if (isNaN(n)) return 0;
    return Math.max(0, Math.min(slides.length - 1, n - 1));
  }

  /* ---------- Başlat ---------- */
  function init() {
    viewport = $('#viewport'); stage = $('#stage');
    notesEl = $('#notes'); overviewEl = $('#overview');
    slides = $$('#stage > .slide');

    if (window.CodeHL) window.CodeHL.run(document);

    progressEl = document.createElement('div'); progressEl.id = 'progress';
    var pbg = document.createElement('div'); pbg.id = 'progress-bg';
    slidenoEl = document.createElement('div'); slidenoEl.id = 'slideno';
    stage.appendChild(pbg); stage.appendChild(progressEl); stage.appendChild(slidenoEl);

    infos = slides.map(buildInfo);

    // tüm slaytları başlangıç durumuna getir
    infos.forEach(function (info) { applyStep(info, 0, false); });

    layout();
    window.addEventListener('resize', function () { layout(); if (overviewEl.classList.contains('open')) sizeThumbs(); });
    document.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', function () {
      var i = hashIndex(); if (i !== cur) go(i, 'fwd');
    });
    overviewEl.addEventListener('click', function (e) {
      var th = e.target.closest('.thumb');
      if (th) { toggleOverview(false); go(parseInt(th.getAttribute('data-i'), 10), 'fwd'); }
    });
    // İçerik slaytındaki bağlantılar
    stage.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (a) { e.preventDefault(); var n = parseInt(a.getAttribute('href').slice(1), 10); if (!isNaN(n)) go(n - 1, 'fwd'); }
    });

    go(hashIndex(), 'fwd');

    helpEl = $('#help');
    if (helpEl) { helpEl.classList.add('show'); setTimeout(function () { helpEl.classList.remove('show'); }, 4000); }
  }

  Deck.go = function (i) { go(i, 'fwd'); };
  Deck.state = function () { return { cur: cur, step: step, steps: infos[cur] ? infos[cur].steps : 0, total: slides.length }; };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
