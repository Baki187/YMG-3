/* ============================================================
   Slayta özel animasyonlar. Her biri Deck.register(ad, fabrika) ile kaydedilir.
   Fabrika { steps, interval, go(step, animate), enter(), leave() } döndürür.
   SVG içerikleri innerHTML ile kurulur (namespace URL'si gerekmez).
   ============================================================ */
(function () {
  'use strict';
  var D = window.Deck;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function fmt(v, dec) {
    var s = (typeof dec === 'number') ? Math.abs(v).toFixed(dec) : String(Math.abs(v));
    s = s.replace('.', ',');
    return (v < 0 ? '−' : '') + s;
  }
  function fmtDot(v, dec) { // kod/hesap gösterimi için nokta ondalık
    var s = (typeof dec === 'number') ? Math.abs(v).toFixed(dec) : String(Math.abs(v));
    return (v < 0 && parseFloat(s) !== 0 ? '−' : '') + s;
  }
  function arrowDef(id) {
    return '<defs><marker id="' + id + '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
      '<path d="M0 0 L10 5 L0 10 z" fill="#8e97a8"/></marker></defs>';
  }

  function Timers() {
    var list = [];
    return {
      later: function (ms, fn) { list.push(setTimeout(fn, ms)); },
      clear: function () { list.forEach(clearTimeout); list = []; }
    };
  }

  function makeGrid(host, rows, cols, w, h, font, cls, vals, fmtFn) {
    host.className = 'grid-n ' + cls;
    host.style.gridTemplateColumns = 'repeat(' + cols + ',' + w + 'px)';
    host.style.gridAutoRows = h + 'px';
    var html = '';
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      html += '<div class="cell" style="font-size:' + font + 'px">' + (vals ? (fmtFn || fmtDot)(vals[r][c]) : '') + '</div>';
    }
    host.innerHTML = html;
    return $$('.cell', host);
  }

  /* Bir değeri kaynaktan hedef hücreye "uçurur" */
  function fly(slide, from, to, text, green, done) {
    var a = D.rectIn(from, slide), b = D.rectIn(to, slide);
    var f = document.createElement('div');
    f.className = 'fly' + (green ? ' green' : '');
    f.textContent = text;
    f.style.left = a.x + 'px'; f.style.top = a.y + 'px';
    f.style.width = Math.max(a.w, 60) + 'px'; f.style.height = Math.max(a.h, 50) + 'px';
    f.style.fontSize = '34px';
    slide.appendChild(f);
    void f.offsetWidth;
    f.style.left = b.x + 'px'; f.style.top = b.y + 'px';
    f.style.width = b.w + 'px'; f.style.height = b.h + 'px';
    var t = setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); if (done) done(); }, 620);
    return { el: f, t: t };
  }
  function clearFlies(slide) { $$('.fly', slide).forEach(function (f) { f.parentNode.removeChild(f); }); }

  /* ============================================================
     1) Konvolüsyon: 7×7 giriş, 3×3 filtre, 5×5 çıktı
     ============================================================ */
  D.register('conv', function (el) {
    var IN = [
      [1, 2, 0, 3, 1, 0, 2],
      [0, 1, 3, 1, 0, 2, 1],
      [2, 3, 1, 0, 2, 1, 0],
      [1, 0, 2, 3, 1, 0, 3],
      [3, 1, 0, 2, 3, 1, 0],
      [0, 2, 1, 0, 1, 3, 2],
      [1, 0, 3, 2, 0, 1, 1]
    ];
    var K = [[1, 0, -1], [1, 0, -1], [1, 0, -1]];
    var B = 1, CS = 84;
    var T = Timers(), pending = null;

    var inCells = makeGrid($('#cv-in', el), 7, 7, CS, CS, 34, 'inp', IN);
    makeGrid($('#cv-k', el), 3, 3, 72, 72, 30, 'ker', K);
    var pCells = makeGrid($('#cv-p', el), 3, 3, 124, 72, 25, 'prod', null);
    var outCells = makeGrid($('#cv-out', el), 5, 5, CS, CS, 32, 'outg', null);
    var win = document.createElement('div'); win.className = 'win';
    win.style.width = win.style.height = (3 * CS) + 'px';
    $('#cv-in', el).appendChild(win);
    var sumEl = $('#cv-sum', el), bEl = $('#cv-b', el), posEl = $('#cv-pos', el);

    var V = [];
    for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) {
      var sum = 0, prods = [];
      for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) {
        var x = IN[r + i][c + j], w = K[i][j];
        sum += x * w;
        prods.push(x + '·' + (w < 0 ? '(' + fmtDot(w) + ')' : w));
      }
      V.push({ r: r, c: c, sum: sum, out: sum + B, prods: prods });
    }

    function setOut(i, on) {
      var cell = outCells[i];
      cell.textContent = on ? fmtDot(V[i].out) : '';
      cell.classList.toggle('done', on);
      cell.classList.toggle('neg', on && V[i].out < 0);
    }

    function go(s, anim) {
      T.clear(); clearFlies(el);
      var filled = anim ? s - 1 : s;
      for (var i = 0; i < 25; i++) { setOut(i, i < filled); outCells[i].classList.remove('cur'); }
      inCells.forEach(function (c) { c.classList.remove('inwin'); });
      if (s === 0) {
        win.style.opacity = 0;
        pCells.forEach(function (c) { c.textContent = ''; c.classList.remove('show'); });
        sumEl.classList.add('hidden'); bEl.classList.add('hidden');
        posEl.textContent = 'Başlamak için → tuşuna ya da ▶ Oynat düğmesine basın';
        return;
      }
      var p = s - 1, v = V[p];
      win.style.opacity = 1;
      if (!anim) win.style.transition = 'none';
      win.style.transform = 'translate(' + (v.c * CS) + 'px,' + (v.r * CS) + 'px)';
      if (!anim) { void win.offsetWidth; win.style.transition = ''; }
      for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) inCells[(v.r + a) * 7 + v.c + b].classList.add('inwin');
      outCells[p].classList.add('cur');
      posEl.textContent = 'Konum ' + (p + 1) + ' / 25  ·  satır ' + (v.r + 1) + ', sütun ' + (v.c + 1);
      pCells.forEach(function (c, k) { c.textContent = v.prods[k]; });
      sumEl.innerHTML = 'Toplam Σ = <b>' + fmtDot(v.sum) + '</b>';
      bEl.innerHTML = 'Σ + b = ' + fmtDot(v.sum) + ' + ' + B + ' = <b class="cv-res c-out">' + fmtDot(v.out) + '</b>';
      if (!anim) {
        pCells.forEach(function (c) { c.classList.add('show'); c.style.opacity = 1; });
        sumEl.classList.remove('hidden'); bEl.classList.remove('hidden');
        return;
      }
      pCells.forEach(function (c) { c.classList.remove('show'); c.style.opacity = 0; c.style.transition = 'opacity .25s'; });
      sumEl.classList.add('hidden'); bEl.classList.add('hidden');
      pCells.forEach(function (c, k) { T.later(300 + k * 65, function () { c.style.opacity = 1; c.classList.add('show'); }); });
      T.later(950, function () { sumEl.classList.remove('hidden'); });
      T.later(1250, function () { bEl.classList.remove('hidden'); });
      T.later(1550, function () {
        var src = $('.cv-res', bEl);
        fly(el, src, outCells[p], fmtDot(v.out), false, function () { setOut(p, true); });
      });
    }
    return { steps: 25, interval: 2300, go: go, leave: function () { T.clear(); clearFlies(el); } };
  });

  /* ============================================================
     2) 2×2 Max Pooling — ödevdeki gerçek matris
     ============================================================ */
  D.register('maxpool', function (el) {
    var M = [[1, 3, 2, 4], [5, 6, 1, 2], [7, 2, 8, 3], [4, 1, 5, 9]];
    var CS = 120, T = Timers();
    var names = ['Sol üst', 'Sağ üst', 'Sol alt', 'Sağ alt'];
    var inCells = makeGrid($('#mp-in', el), 4, 4, CS, CS, 52, 'inp', M);
    var outCells = makeGrid($('#mp-out', el), 2, 2, CS, CS, 52, 'outg', null);
    var win = document.createElement('div'); win.className = 'win';
    win.style.borderColor = 'var(--accent)';
    win.style.width = win.style.height = (2 * CS) + 'px';
    $('#mp-in', el).appendChild(win);
    var info = $('#mp-info', el);

    var blocks = [];
    for (var b = 0; b < 4; b++) {
      var br = Math.floor(b / 2) * 2, bc = (b % 2) * 2, best = -1, bi = 0, vals = [];
      for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) {
        var v = M[br + i][bc + j]; vals.push(v);
        if (v > best) { best = v; bi = (br + i) * 4 + bc + j; }
      }
      blocks.push({ r: br, c: bc, max: best, idx: bi, vals: vals });
    }
    function done(k, on) {
      inCells[blocks[k].idx].classList.toggle('mx', on);
      outCells[k].textContent = on ? blocks[k].max : '';
      outCells[k].classList.toggle('mxo', on);
    }
    function go(s, anim) {
      T.clear(); clearFlies(el);
      if (s > 4) { // tüm bloklar bitti; sonraki adımlar sadece metin kartları
        for (var q = 0; q < 4; q++) done(q, true);
        win.style.opacity = 0;
        info.innerHTML = 'Sonuç: <b class="c-max mono">[[6, 4], [7, 9]]</b>';
        return;
      }
      var filled = anim ? s - 1 : s;
      for (var k = 0; k < 4; k++) done(k, k < filled);
      if (s === 0) { win.style.opacity = 0; info.innerHTML = '&nbsp;'; return; }
      var bl = blocks[s - 1];
      win.style.opacity = 1;
      if (!anim) win.style.transition = 'none';
      win.style.transform = 'translate(' + (bl.c * CS) + 'px,' + (bl.r * CS) + 'px)';
      if (!anim) { void win.offsetWidth; win.style.transition = ''; }
      info.innerHTML = '<b>' + names[s - 1] + ':</b> ' + bl.vals.join(', ') + ' → en büyük = <b class="c-max">' + bl.max + '</b>';
      if (!anim) return;
      var kk = s - 1;
      T.later(450, function () { inCells[bl.idx].classList.add('mx'); });
      T.later(900, function () {
        fly(el, inCells[bl.idx], outCells[kk], String(bl.max), true, function () { done(kk, true); });
      });
    }
    return { steps: 4, interval: 1900, go: go, leave: function () { T.clear(); clearFlies(el); } };
  });

  /* ============================================================
     3) Birden fazla filtre — gerçek konvolüsyon hesaplanır
     ============================================================ */
  D.register('multifilter', function (el) {
    var art = [
      '................',
      '....###..###....',
      '..############..',
      '.##############.',
      '.##############.',
      '.###.######.###.',
      '.....######.....',
      '.....######.....',
      '.....######.....',
      '.....######.....',
      '.....######.....',
      '.....######.....',
      '.....######.....',
      '.....######.....',
      '.....######.....',
      '................'
    ];
    var IMG = art.map(function (row) { return row.split('').map(function (ch) { return ch === '#' ? 1 : 0; }); });
    var F = [
      { name: 'Yatay kenar (üst)', k: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]] },
      { name: 'Dikey kenar (sol)', k: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]] },
      { name: 'Köşe (sol üst)', k: [[-1, -1, -1], [-1, 1, 1], [-1, 1, 1]] }
    ];
    function conv(img, k) {
      var n = img.length - 2, out = [], mx = 0;
      for (var r = 0; r < n; r++) {
        out.push([]);
        for (var c = 0; c < n; c++) {
          var s = 0;
          for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) s += img[r + i][c + j] * k[i][j];
          s = Math.max(0, s); // ReLU
          out[r].push(s); if (s > mx) mx = s;
        }
      }
      return { m: out, mx: mx };
    }
    var svg = $('#mf-svg', el), h = '';
    var IC = 22, ix = 20, iy = 170;
    h += '<text x="' + ix + '" y="' + (iy - 22) + '" font-size="28" font-weight="700" fill="#4a5263">Giriş resmi (16×16)</text>';
    for (var r = 0; r < 16; r++) for (var c = 0; c < 16; c++) {
      h += '<rect x="' + (ix + c * IC) + '" y="' + (iy + r * IC) + '" width="' + IC + '" height="' + IC + '" fill="' + (IMG[r][c] ? '#4a5263' : '#e7eaf0') + '" stroke="#fff" stroke-width="1"/>';
    }
    var KC = 40, FC = 15;
    F.forEach(function (f, n) {
      var y0 = 20 + n * 250, kx = 560, fx = 900;
      var res = conv(IMG, f.k);
      var g = '<g data-show="' + (n + 1) + '">';
      g += '<path d="M' + (ix + 16 * IC + 10) + ' ' + (iy + 176) + ' C 470 ' + (iy + 176) + ', 480 ' + (y0 + 80) + ', ' + (kx - 14) + ' ' + (y0 + 80) + '" fill="none" stroke="#b5bdcb" stroke-width="4"/>';
      g += '<text x="' + kx + '" y="' + (y0 + 8) + '" font-size="26" font-weight="700" fill="#e67700">' + f.name + '</text>';
      for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) {
        var v = f.k[i][j];
        g += '<rect x="' + (kx + j * KC) + '" y="' + (y0 + 22 + i * KC) + '" width="' + KC + '" height="' + KC + '" fill="#fff1df" stroke="#e67700" stroke-width="2"/>';
        g += '<text class="mono" x="' + (kx + j * KC + KC / 2) + '" y="' + (y0 + 22 + i * KC + KC / 2 + 8) + '" font-size="22" text-anchor="middle" fill="#9a4d00" font-weight="700">' + fmtDot(v) + '</text>';
      }
      g += '<text x="' + (kx + 160) + '" y="' + (y0 + 100) + '" font-size="44" fill="#8e97a8">→</text>';
      for (var a = 0; a < 14; a++) for (var b = 0; b < 14; b++) {
        var val = res.mx ? res.m[a][b] / res.mx : 0;
        g += '<rect x="' + (fx + b * FC) + '" y="' + (y0 + 12 + a * FC) + '" width="' + FC + '" height="' + FC + '" fill="#2563c9" fill-opacity="' + (0.06 + 0.94 * val).toFixed(2) + '" stroke="#fff" stroke-width="0.6"/>';
      }
      g += '<text x="' + (fx + 14 * FC + 30) + '" y="' + (y0 + 96) + '" font-size="26" font-weight="700" fill="#2563c9">Özellik haritası ' + (n + 1) + '</text>';
      g += '<text x="' + (fx + 14 * FC + 30) + '" y="' + (y0 + 132) + '" font-size="24" fill="#5b6475">14×14 · kanal ' + (n + 1) + '</text>';
      g += '</g>';
      h += g;
    });
    svg.innerHTML = h;
    return { steps: 0, interval: 1500 };
  });

  /* ============================================================
     4) ReLU grafiği + fareyle değer okuma
     ============================================================ */
  D.register('relu', function (el) {
    var XS = [-5, -2, -1, 0, 2, 4, 6];
    var svg = $('#relu-svg', el);
    var X0 = 70, X1 = 870, Y0 = 600, Y1 = 40; // x: -6..6, y: -6..6
    function px(x) { return X0 + (x + 6) / 12 * (X1 - X0); }
    function py(y) { return Y0 - (y + 6) / 12 * (Y0 - Y1); }
    var h = '';
    for (var t = -6; t <= 6; t += 2) {
      h += '<line x1="' + px(t) + '" y1="' + Y1 + '" x2="' + px(t) + '" y2="' + Y0 + '" stroke="#eef1f7" stroke-width="2"/>';
      h += '<line x1="' + X0 + '" y1="' + py(t) + '" x2="' + X1 + '" y2="' + py(t) + '" stroke="#eef1f7" stroke-width="2"/>';
      h += '<text x="' + px(t) + '" y="' + (py(0) + 34) + '" font-size="22" text-anchor="middle" fill="#5b6475">' + fmtDot(t) + '</text>';
      if (t !== 0) h += '<text x="' + (px(0) - 12) + '" y="' + (py(t) + 8) + '" font-size="22" text-anchor="end" fill="#5b6475">' + fmtDot(t) + '</text>';
    }
    h += '<line x1="' + X0 + '" y1="' + py(0) + '" x2="' + X1 + '" y2="' + py(0) + '" stroke="#5b6475" stroke-width="2.5"/>';
    h += '<line x1="' + px(0) + '" y1="' + Y1 + '" x2="' + px(0) + '" y2="' + Y0 + '" stroke="#5b6475" stroke-width="2.5"/>';
    h += '<text x="' + (X1 + 10) + '" y="' + (py(0) + 8) + '" font-size="26" font-style="italic">x</text>';
    h += '<text x="' + (px(0) + 12) + '" y="' + (Y1 + 6) + '" font-size="26" font-style="italic">ReLU(x)</text>';
    // y = x kesik çizgisi (giriş)
    h += '<line data-show="2" class="fade" x1="' + px(-6) + '" y1="' + py(-6) + '" x2="' + px(6) + '" y2="' + py(6) + '" stroke="#8e97a8" stroke-width="3" stroke-dasharray="10 9"/>';
    h += '<text data-show="2" class="fade" x="' + px(-3.4) + '" y="' + py(-5.3) + '" font-size="22" fill="#8e97a8">y = x (giriş)</text>';
    // ReLU eğrisi
    var len = (px(0) - px(-6)) + Math.hypot(px(6) - px(0), py(6) - py(0));
    h += '<path class="draw" style="--len:' + Math.ceil(len) + '" data-show="1" d="M' + px(-6) + ' ' + py(0) + ' L' + px(0) + ' ' + py(0) + ' L' + px(6) + ' ' + py(6) + '" fill="none" stroke="#1f3a8a" stroke-width="7" stroke-linejoin="round"/>';
    // örnek noktalar
    XS.forEach(function (x, i) {
      h += '<g class="rpt" data-i="' + i + '" style="transition: transform .9s cubic-bezier(.4,.1,.2,1) ' + (i * 0.08) + 's, opacity .4s">' +
        '<circle r="13" fill="' + (x < 0 ? '#d64545' : '#2563c9') + '" stroke="#fff" stroke-width="3"/>' +
        '<text y="-22" font-size="22" text-anchor="middle" font-weight="700" fill="' + (x < 0 ? '#d64545' : '#2563c9') + '">' + fmtDot(x) + '</text></g>';
    });
    // fare ile okuma
    h += '<g id="relu-hover" style="display:none"><line id="rh-v" stroke="#e67700" stroke-width="2" stroke-dasharray="6 6"/>' +
      '<circle id="rh-c" r="10" fill="#e67700"/>' +
      '<rect id="rh-bg" rx="10" fill="#fff" stroke="#e67700" stroke-width="2" height="44"/>' +
      '<text id="rh-t" class="mono" font-size="24" font-weight="700" fill="#1b2233"></text></g>';
    h += '<rect id="relu-hit" x="' + X0 + '" y="' + Y1 + '" width="' + (X1 - X0) + '" height="' + (Y0 - Y1) + '" fill="transparent" style="cursor:crosshair"/>';
    svg.innerHTML = h;

    var pts = $$('.rpt', svg);
    var hover = $('#relu-hover', svg), hv = $('#rh-v', svg), hc = $('#rh-c', svg), hbg = $('#rh-bg', svg), ht = $('#rh-t', svg);
    var hit = $('#relu-hit', svg);
    hit.addEventListener('mousemove', function (e) {
      var m = svg.getScreenCTM(); if (!m) return;
      var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      var p = pt.matrixTransform(m.inverse());
      var x = (p.x - X0) / (X1 - X0) * 12 - 6;
      x = Math.max(-6, Math.min(6, x));
      var y = Math.max(0, x);
      hover.style.display = '';
      hv.setAttribute('x1', px(x)); hv.setAttribute('x2', px(x));
      hv.setAttribute('y1', py(0)); hv.setAttribute('y2', py(y));
      hc.setAttribute('cx', px(x)); hc.setAttribute('cy', py(y));
      var label = 'x = ' + fmtDot(x, 2) + '  →  ReLU(x) = ' + fmtDot(y, 2);
      ht.textContent = label;
      var tw = label.length * 13.2 + 24;
      var lx = Math.min(px(x) + 16, X1 - tw), ly = Math.max(py(y) - 70, Y1);
      hbg.setAttribute('x', lx); hbg.setAttribute('y', ly); hbg.setAttribute('width', tw);
      ht.setAttribute('x', lx + 12); ht.setAttribute('y', ly + 30);
    });
    hit.addEventListener('mouseleave', function () { hover.style.display = 'none'; });

    function go(s, anim) {
      pts.forEach(function (g, i) {
        var x = XS[i], y = s >= 3 ? Math.max(0, x) : x;
        if (!anim) g.style.transition = 'none';
        g.style.transform = 'translate(' + px(x) + 'px,' + py(y) + 'px)';
        g.style.opacity = s >= 2 ? 1 : 0;
        if (!anim) { void g.getBoundingClientRect(); g.style.transition = 'transform .9s cubic-bezier(.4,.1,.2,1) ' + (i * 0.08) + 's, opacity .4s'; }
      });
    }
    return { steps: 3, interval: 1800, go: go };
  });

  /* ============================================================
     5) Softmax — kaydırıcılarla canlı olasılıklar
     ============================================================ */
  D.register('softmax', function (el) {
    var init = [2.0, 1.0, 0.1];
    var inputs = [1, 2, 3].map(function (i) { return $('#sm-z' + i, el); });
    var vals = [1, 2, 3].map(function (i) { return $('#sm-v' + i, el); });
    var exps = [1, 2, 3].map(function (i) { return $('#sm-e' + i, el); });
    var rows = $$('.bar-row', el);
    var sumEl = $('#sm-sum', el), esum = $('#sm-esum', el);
    function update() {
      var z = inputs.map(function (inp) { return parseFloat(inp.value); });
      var e = z.map(function (v) { return Math.exp(v); });
      var S = e[0] + e[1] + e[2];
      var p = e.map(function (v) { return v / S; });
      var arg = p.indexOf(Math.max.apply(null, p));
      var tot = 0;
      for (var i = 0; i < 3; i++) {
        vals[i].textContent = z[i].toFixed(1);
        exps[i].textContent = e[i].toFixed(3);
        rows[i].querySelector('.fill').style.width = (p[i] * 100).toFixed(2) + '%';
        rows[i].querySelector('.pct').textContent = p[i].toFixed(3);
        rows[i].classList.toggle('arg', i === arg);
        tot += parseFloat(p[i].toFixed(3));
      }
      esum.textContent = S.toFixed(2);
      sumEl.textContent = 'Toplam = ' + (p[0] + p[1] + p[2]).toFixed(2);
    }
    inputs.forEach(function (inp) { inp.addEventListener('input', update); });
    $('#sm-reset', el).addEventListener('click', function (e) {
      inputs.forEach(function (inp, i) { inp.value = init[i]; }); update(); e.currentTarget.blur();
    });
    update();
    return { steps: 0, enter: update };
  });

  /* ============================================================
     6) Flatten + Dense
     ============================================================ */
  D.register('flatten', function (el) {
    var svg = $('#fl-svg', el), h = '';
    h += arrowDef('fl-arr');
    // 5×5×16 küp
    var cx = 70, cy = 250, C = 36;
    for (var s = 15; s >= 0; s--) {
      var ox = cx + s * 9, oy = cy - s * 9;
      h += '<rect x="' + ox + '" y="' + oy + '" width="' + (5 * C) + '" height="' + (5 * C) + '" fill="#2563c9" fill-opacity="' + (s === 0 ? 0.25 : 0.10 + 0.02 * (15 - s)) + '" stroke="#2563c9" stroke-width="1.6"/>';
    }
    for (var i = 1; i < 5; i++) {
      h += '<line x1="' + (cx + i * C) + '" y1="' + cy + '" x2="' + (cx + i * C) + '" y2="' + (cy + 5 * C) + '" stroke="#2563c9" stroke-width="1.5"/>';
      h += '<line x1="' + cx + '" y1="' + (cy + i * C) + '" x2="' + (cx + 5 * C) + '" y2="' + (cy + i * C) + '" stroke="#2563c9" stroke-width="1.5"/>';
    }
    h += '<text x="' + (cx + 150) + '" y="' + (cy + 5 * C + 60) + '" font-size="30" font-weight="700" text-anchor="middle" fill="#2563c9">5×5×16</text>';
    h += '<text x="' + (cx + 150) + '" y="' + (cy + 5 * C + 96) + '" font-size="24" text-anchor="middle" fill="#5b6475">16 özellik haritası</text>';

    // Flatten şeridi
    var SX = 560, SY = 30, SH = 560, SW = 40;
    var g1 = '<g data-show="1"><path d="M' + (cx + 5 * C + 150) + ' ' + (cy + 90) + ' L' + (SX - 20) + ' ' + (cy + 90) + '" stroke="#8e97a8" stroke-width="4" marker-end="url(#fl-arr)"/>';
    for (var b = 0; b < 16; b++) {
      g1 += '<rect x="' + SX + '" y="' + (SY + b * SH / 16) + '" width="' + SW + '" height="' + (SH / 16) + '" fill="#2563c9" fill-opacity="' + (b % 2 ? 0.55 : 0.30) + '" stroke="#fff" stroke-width="1"/>';
    }
    g1 += '<text x="' + (SX + SW / 2) + '" y="' + (SY + SH + 44) + '" font-size="28" font-weight="700" text-anchor="middle">Flatten</text>';
    g1 += '<text x="' + (SX + SW / 2) + '" y="' + (SY + SH + 78) + '" font-size="24" text-anchor="middle" fill="#5b6475">400 değer</text>';
    g1 += '</g>';
    h += g1;

    // Dense(64)
    var NX = 1020, ny = function (k) { return SY + 5 + k * (SH - 10) / 63; };
    var seed = 7; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    var g2 = '<g data-show="2">';
    for (var l = 0; l < 160; l++) {
      var y1 = SY + rnd() * SH, k = Math.floor(rnd() * 64);
      g2 += '<line x1="' + (SX + SW) + '" y1="' + y1.toFixed(1) + '" x2="' + NX + '" y2="' + ny(k).toFixed(1) + '" stroke="#5b7bd0" stroke-opacity=".22" stroke-width="1.2"/>';
    }
    for (var n = 0; n < 64; n++) g2 += '<circle cx="' + NX + '" cy="' + ny(n).toFixed(1) + '" r="4.5" fill="#1f3a8a"/>';
    g2 += '<text x="' + NX + '" y="' + (SY + SH + 44) + '" font-size="28" font-weight="700" text-anchor="middle">Dense (64)</text>';
    g2 += '<text x="' + NX + '" y="' + (SY + SH + 78) + '" font-size="24" text-anchor="middle" fill="#5b6475">her nöron 400 girişe bağlı</text>';
    g2 += '</g>';
    h += g2;

    // Dense(10)
    var OX = 1400, oy = function (k) { return SY + 20 + k * 58; };
    var names = ['T-shirt/top', 'Trouser', 'Pullover', 'Dress', 'Coat', 'Sandal', 'Shirt', 'Sneaker', 'Bag', 'Ankle boot'];
    var g3 = '<g data-show="3">';
    for (var a = 0; a < 64; a++) for (var o = 0; o < 10; o++) {
      g3 += '<line x1="' + NX + '" y1="' + ny(a).toFixed(1) + '" x2="' + OX + '" y2="' + oy(o) + '" stroke="#2b9348" stroke-opacity=".07" stroke-width="1"/>';
    }
    for (var q = 0; q < 10; q++) {
      g3 += '<circle cx="' + OX + '" cy="' + oy(q) + '" r="15" fill="#2b9348"/>';
      g3 += '<text x="' + (OX + 28) + '" y="' + (oy(q) + 8) + '" font-size="22" fill="#1b2233">' + q + ': ' + names[q] + '</text>';
    }
    g3 += '<text x="' + OX + '" y="' + (SY + SH + 44) + '" font-size="28" font-weight="700" text-anchor="middle">Dense (10)</text>';
    g3 += '<text x="' + OX + '" y="' + (SY + SH + 78) + '" font-size="24" text-anchor="middle" fill="#5b6475">softmax</text>';
    g3 += '</g>';
    h += g3;
    svg.innerHTML = h;
    return { steps: 0 };
  });

  /* ============================================================
     7) Model mimarisi — boru hattı
     ============================================================ */
  D.register('arch', function (el) {
    var svg = $('#ar-svg', el), h = '', YC = 220, PX = 7, DP = 3;
    h += arrowDef('ar-arr');
    var L = [
      { x: 20, t: 'box', s: 28, c: 1, col: '#8e97a8', n: 'Input', d: '28×28×1', p: '—' },
      { x: 300, t: 'box', s: 26, c: 8, col: '#2563c9', n: 'Conv2D (8)', d: '26×26×8', p: '80' },
      { x: 560, t: 'box', s: 13, c: 8, col: '#2b9348', n: 'MaxPool', d: '13×13×8', p: '0' },
      { x: 760, t: 'box', s: 11, c: 16, col: '#2563c9', n: 'Conv2D (16)', d: '11×11×16', p: '1.168' },
      { x: 950, t: 'box', s: 5, c: 16, col: '#2b9348', n: 'MaxPool', d: '5×5×16', p: '0' },
      { x: 1120, t: 'bar', w: 18, hh: 330, col: '#5b6475', n: 'Flatten', d: '400', p: '0' },
      { x: 1300, t: 'bar', w: 18, hh: 170, col: '#1f3a8a', n: 'Dense (64)', d: '64 · ReLU', p: '25.664' },
      { x: 1500, t: 'dots', col: '#e67700', n: 'Dense (10)', d: '10 · softmax', p: '650' }
    ];
    var prevRight = null;
    L.forEach(function (l, i) {
      var g = '<g data-show="' + (i + 1) + '" class="fade">', w, cxm, right;
      if (l.t === 'box') {
        var S = l.s * PX, d = Math.max(6, l.c * DP), x = l.x, y = YC - S / 2;
        g += '<polygon points="' + x + ',' + y + ' ' + (x + d) + ',' + (y - d) + ' ' + (x + S + d) + ',' + (y - d) + ' ' + (x + S) + ',' + y + '" fill="' + l.col + '" fill-opacity=".35" stroke="' + l.col + '" stroke-width="2"/>';
        g += '<polygon points="' + (x + S) + ',' + y + ' ' + (x + S + d) + ',' + (y - d) + ' ' + (x + S + d) + ',' + (y + S - d) + ' ' + (x + S) + ',' + (y + S) + '" fill="' + l.col + '" fill-opacity=".5" stroke="' + l.col + '" stroke-width="2"/>';
        g += '<rect x="' + x + '" y="' + y + '" width="' + S + '" height="' + S + '" fill="' + l.col + '" fill-opacity=".18" stroke="' + l.col + '" stroke-width="3"/>';
        w = S + d; cxm = x + S / 2 + d / 2; right = x + S + d;
      } else if (l.t === 'bar') {
        g += '<rect x="' + l.x + '" y="' + (YC - l.hh / 2) + '" width="' + l.w + '" height="' + l.hh + '" fill="' + l.col + '" fill-opacity=".55" stroke="' + l.col + '" stroke-width="2" rx="4"/>';
        w = l.w; cxm = l.x + l.w / 2; right = l.x + l.w;
      } else {
        for (var k = 0; k < 10; k++) g += '<circle cx="' + (l.x + 12) + '" cy="' + (YC - 135 + k * 30) + '" r="11" fill="' + l.col + '"/>';
        w = 24; cxm = l.x + 12; right = l.x + 24;
      }
      if (prevRight !== null) {
        g += '<line x1="' + (prevRight + 12) + '" y1="' + YC + '" x2="' + (l.x - 16) + '" y2="' + YC + '" stroke="#8e97a8" stroke-width="4" marker-end="url(#ar-arr)"/>';
      }
      g += '<text x="' + cxm + '" y="430" font-size="26" font-weight="700" text-anchor="middle" fill="' + l.col + '">' + l.n + '</text>';
      g += '<text class="mono" x="' + cxm + '" y="470" font-size="24" text-anchor="middle" fill="#1b2233">' + l.d + '</text>';
      g += '<text x="' + cxm + '" y="508" font-size="22" text-anchor="middle" fill="#5b6475">' + (l.p === '—' ? 'giriş' : l.p + ' param') + '</text>';
      g += '</g>';
      h += g; prevRight = right;
    });
    svg.innerHTML = h;
    return { steps: 0 };
  });

  /* ============================================================
     8) he_normal — çan eğrisi
     ============================================================ */
  D.register('henormal', function (el) {
    var svg = $('#hn-svg', el), SIG = Math.sqrt(2 / 9);
    var X0 = 60, X1 = 940, BASE = 430, R = 1.6;
    function px(x) { return X0 + (x + R) / (2 * R) * (X1 - X0); }
    function pdf(x) { return Math.exp(-x * x / (2 * SIG * SIG)) / (SIG * Math.sqrt(2 * Math.PI)); }
    function py(y) { return BASE - y * 420; }
    var d = '', len = 0, lx = null, ly = null;
    for (var i = 0; i <= 200; i++) {
      var x = -R + i * (2 * R / 200), y = py(pdf(x)), X = px(x);
      d += (i ? ' L' : 'M') + X.toFixed(1) + ' ' + y.toFixed(1);
      if (lx !== null) len += Math.hypot(X - lx, y - ly);
      lx = X; ly = y;
    }
    var h = '';
    h += '<line x1="' + X0 + '" y1="' + BASE + '" x2="' + X1 + '" y2="' + BASE + '" stroke="#5b6475" stroke-width="2.5"/>';
    [-1.5, -1, -0.5, 0, 0.5, 1, 1.5].forEach(function (t) {
      h += '<line x1="' + px(t) + '" y1="' + BASE + '" x2="' + px(t) + '" y2="' + (BASE + 10) + '" stroke="#5b6475" stroke-width="2"/>';
      h += '<text x="' + px(t) + '" y="' + (BASE + 40) + '" font-size="22" text-anchor="middle" fill="#5b6475">' + fmt(t) + '</text>';
    });
    h += '<text x="' + X1 + '" y="' + (BASE + 76) + '" font-size="22" text-anchor="end" fill="#5b6475">ağırlık değeri</text>';
    // kesilen kuyruklar
    var c2 = 2 * SIG;
    h += '<g data-show="3" class="fade">' +
      '<rect x="' + X0 + '" y="40" width="' + (px(-c2) - X0) + '" height="' + (BASE - 40) + '" fill="#d64545" fill-opacity=".10"/>' +
      '<rect x="' + px(c2) + '" y="40" width="' + (X1 - px(c2)) + '" height="' + (BASE - 40) + '" fill="#d64545" fill-opacity=".10"/>' +
      '<line x1="' + px(-c2) + '" y1="40" x2="' + px(-c2) + '" y2="' + BASE + '" stroke="#d64545" stroke-width="3"/>' +
      '<line x1="' + px(c2) + '" y1="40" x2="' + px(c2) + '" y2="' + BASE + '" stroke="#d64545" stroke-width="3"/>' +
      '<text x="' + (px(-c2) - 10) + '" y="78" font-size="22" text-anchor="end" fill="#d64545">−2σ ≈ −0,94</text>' +
      '<text x="' + (px(c2) + 10) + '" y="78" font-size="22" fill="#d64545">+2σ ≈ 0,94</text>' +
      '<text x="' + ((X0 + px(-c2)) / 2) + '" y="300" font-size="22" text-anchor="middle" fill="#d64545">kesilir</text>' +
      '<text x="' + ((X1 + px(c2)) / 2) + '" y="300" font-size="22" text-anchor="middle" fill="#d64545">kesilir</text></g>';
    h += '<path class="draw" data-show="1" style="--len:' + Math.ceil(len) + '" d="' + d + '" fill="none" stroke="#1f3a8a" stroke-width="6"/>';
    // σ işaretleri
    h += '<g data-show="2" class="fade">' +
      '<line x1="' + px(0) + '" y1="' + py(pdf(0)) + '" x2="' + px(0) + '" y2="' + BASE + '" stroke="#1f3a8a" stroke-width="2.5" stroke-dasharray="8 7"/>' +
      '<text x="' + px(0) + '" y="' + (py(pdf(0)) - 14) + '" font-size="24" text-anchor="middle" font-weight="700" fill="#1f3a8a">ortalama = 0</text>' +
      '<line x1="' + px(-SIG) + '" y1="' + py(pdf(SIG)) + '" x2="' + px(SIG) + '" y2="' + py(pdf(SIG)) + '" stroke="#e67700" stroke-width="4"/>' +
      '<text x="' + px(SIG) + '" y="' + (py(pdf(SIG)) - 14) + '" font-size="24" font-weight="700" fill="#e67700">σ ≈ 0,47</text></g>';
    // İlk filtrenin gerçek 9 ağırlığı (notebook çıktısı)
    var Wt = [-0.25283593, 0.12861036, -0.75786656, -0.21681367, -0.15182823, -0.702172, 0.23038778, 0.76512676, -0.74278826];
    var g4 = '<g data-show="4" class="fade">';
    Wt.forEach(function (w) {
      g4 += '<line x1="' + px(w) + '" y1="' + (BASE - 30) + '" x2="' + px(w) + '" y2="' + BASE + '" stroke="#e67700" stroke-width="5"/>';
    });
    g4 += '<text x="' + X0 + '" y="' + (BASE + 76) + '" font-size="22" fill="#e67700">▮ ilk filtrenin 9 gerçek ağırlığı (notebook)</text></g>';
    h += g4;
    svg.innerHTML = h;
    return { steps: 0 };
  });

  /* ============================================================
     9) Kenar kaybı (128 → 126) şeması
     ============================================================ */
  D.register('dims', function (el) {
    var svg = $('#dm-svg', el), h = '', C = 38, N = 10, x0 = 30, y0 = 60;
    h += arrowDef('dm-arr');
    h += '<text x="' + x0 + '" y="36" font-size="26" font-weight="700" fill="#4a5263">Giriş 128×128×1 (temsili)</text>';
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      var edge = r === 0 || c === 0 || r === N - 1 || c === N - 1;
      h += '<rect x="' + (x0 + c * C) + '" y="' + (y0 + r * C) + '" width="' + C + '" height="' + C + '" fill="#e7eaf0" stroke="#fff" stroke-width="2"/>';
      if (edge) h += '<rect data-show="2" class="fade" x="' + (x0 + c * C + 2) + '" y="' + (y0 + r * C + 2) + '" width="' + (C - 4) + '" height="' + (C - 4) + '" fill="#d64545" fill-opacity=".35"/>';
    }
    // kayan filtre
    h += '<g data-show="1" class="fade"><g class="kslide">' +
      '<rect x="' + x0 + '" y="' + y0 + '" width="' + (3 * C) + '" height="' + (3 * C) + '" fill="#e67700" fill-opacity=".18" stroke="#e67700" stroke-width="5"/>' +
      '<circle cx="' + (x0 + 1.5 * C) + '" cy="' + (y0 + 1.5 * C) + '" r="8" fill="#e67700"/></g></g>';
    h += '<text data-show="2" class="fade" x="' + x0 + '" y="' + (y0 + N * C + 40) + '" font-size="24" fill="#d64545">Kırmızı kenar: filtrenin merkezi buraya gelemez</text>';
    // çıktı yığını
    var ox = 760, OC = 28, M = 8, FY = 230;
    var g = '<g data-show="3" class="fade">';
    for (var s = 15; s >= 0; s--) {
      g += '<rect x="' + (ox + s * 8) + '" y="' + (FY - s * 8) + '" width="' + (M * OC) + '" height="' + (M * OC) + '" fill="' + (s === 0 ? '#cfe0fa' : '#2563c9') + '" fill-opacity="' + (s === 0 ? 1 : 0.06) + '" stroke="#2563c9" stroke-width="1.5"/>';
    }
    g += '<text x="' + (ox + 4 * OC + 60) + '" y="' + (FY + M * OC + 46) + '" font-size="28" font-weight="700" text-anchor="middle" fill="#2563c9">Çıkış 126×126×16</text>';
    g += '<text x="' + (ox + 4 * OC + 60) + '" y="' + (FY + M * OC + 80) + '" font-size="22" text-anchor="middle" fill="#5b6475">her filtre bir kanal → 16 kanal</text>';
    g += '<text x="' + (ox + 15 * 8 + M * OC + 20) + '" y="' + (FY - 15 * 8 + 24) + '" font-size="24" fill="#2563c9" font-weight="700">16 özellik haritası</text>';
    g += '<path d="M' + (x0 + N * C + 30) + ' ' + (y0 + N * C / 2) + ' L' + (ox - 30) + ' ' + (y0 + N * C / 2) + '" stroke="#8e97a8" stroke-width="4" marker-end="url(#dm-arr)"/>';
    g += '<text x="' + ((x0 + N * C + ox) / 2) + '" y="' + (y0 + N * C / 2 - 16) + '" font-size="24" text-anchor="middle" fill="#5b6475">Conv2D(16, 3×3)</text>';
    g += '</g>';
    h += g;
    svg.innerHTML = h;
    return { steps: 0 };
  });

  /* ============================================================
     10) Deney çubuk grafiği
     ============================================================ */
  D.register('bars', function (el) {
    var svg = $('#bc-svg', el), h = '';
    function chart(x0, title, vals, max, ticks, lab) {
      var Y0 = 470, HH = 380, BW = 120, out = '';
      out += '<text x="' + (x0 + 150) + '" y="30" font-size="28" font-weight="700" text-anchor="middle">' + title + '</text>';
      ticks.forEach(function (t) {
        var y = Y0 - t / max * HH;
        out += '<line x1="' + x0 + '" y1="' + y + '" x2="' + (x0 + 330) + '" y2="' + y + '" stroke="#e7eaf0" stroke-width="2"/>';
        out += '<text x="' + (x0 - 10) + '" y="' + (y + 8) + '" font-size="22" text-anchor="end" fill="#5b6475">' + lab(t, true) + '</text>';
      });
      vals.forEach(function (v, i) {
        var bh = v / max * HH, bx = x0 + 30 + i * (BW + 40);
        out += '<rect class="bar' + (i ? ' b2' : '') + '" x="' + bx + '" y="' + (Y0 - bh) + '" width="' + BW + '" height="' + bh + '" rx="6" fill="' + (i ? '#1f3a8a' : '#9fb3d9') + '"/>';
        out += '<text class="vl mono" x="' + (bx + BW / 2) + '" y="' + (Y0 - bh - 14) + '" font-size="26" font-weight="700" text-anchor="middle" fill="' + (i ? '#1f3a8a' : '#5b6475') + '">' + lab(v) + '</text>';
        out += '<text x="' + (bx + BW / 2) + '" y="' + (Y0 + 36) + '" font-size="24" text-anchor="middle">' + (i ? '16 filtre' : '8 filtre') + '</text>';
      });
      out += '<line x1="' + x0 + '" y1="' + Y0 + '" x2="' + (x0 + 330) + '" y2="' + Y0 + '" stroke="#5b6475" stroke-width="2.5"/>';
      return out;
    }
    h += chart(80, 'Test doğruluğu', [0.8691, 0.8744], 1, [0, 0.25, 0.5, 0.75, 1], function (v, tick) {
      return tick ? '%' + Math.round(v * 100) : '%' + (v * 100).toFixed(2).replace('.', ',');
    });
    h += chart(560, 'Eğitim süresi', [11.4, 15.7], 20, [0, 5, 10, 15, 20], function (v, tick) {
      return tick ? v + ' sn' : String(v).replace('.', ',') + ' sn';
    });
    svg.innerHTML = h;
    return { steps: 1, interval: 1000 };
  });
})();
