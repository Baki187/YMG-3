/* Küçük Python sözdizimi renklendirici: anahtar kelime, string, yorum, sayı, fonksiyon */
(function () {
  'use strict';
  var KW = 'import|from|as|def|return|for|in|if|elif|else|while|True|False|None|and|or|not|with|lambda|class|pass|break|continue';
  var BI = 'print|range|len|enumerate|zip|min|max|sum|abs';
  var RE = new RegExp(
    '(#[^\\n]*)' +                                          // 1 yorum
    '|((?:[fFrRbB])?"(?:[^"\\\\\\n]|\\\\.)*"|(?:[fFrRbB])?\'(?:[^\'\\\\\\n]|\\\\.)*\')' + // 2 string
    '|\\b(\\d+(?:\\.\\d*)?(?:[eE][-+]?\\d+)?)\\b' +          // 3 sayı
    '|\\b(' + KW + ')\\b' +                                 // 4 anahtar kelime
    '|\\b(' + BI + ')\\b(?=\\s*\\()' +                      // 5 yerleşik
    '|([A-Za-z_]\\w*)(?=\\s*\\()',                          // 6 fonksiyon çağrısı
    'g');

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function highlight(src) {
    var out = '', last = 0, m;
    RE.lastIndex = 0;
    while ((m = RE.exec(src)) !== null) {
      out += esc(src.slice(last, m.index));
      var cls = m[1] ? 'com' : m[2] ? 'str' : m[3] ? 'num' : m[4] ? 'kw' : m[5] ? 'bi' : 'fn';
      out += '<span class="tok-' + cls + '">' + esc(m[0]) + '</span>';
      last = m.index + m[0].length;
      if (m[0].length === 0) RE.lastIndex++;
    }
    return out + esc(src.slice(last));
  }

  function run(root) {
    var pres = root.querySelectorAll('pre.code');
    for (var i = 0; i < pres.length; i++) {
      var pre = pres[i];
      var src = pre.textContent.replace(/^\n+/, '').replace(/\s+$/, '');
      var lines = highlight(src).split('\n');
      pre.innerHTML = lines.map(function (l) { return '<span class="ln">' + (l || ' ') + '</span>'; }).join('');
    }
  }

  window.CodeHL = { run: run, highlight: highlight };
})();
