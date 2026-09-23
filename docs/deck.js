/* Built Live deck engine.
   Deck content lives in decks/<name>.js as DECK({...}) so it loads from a local file
   (file://) as well as from the public site. ?deck=live|closing|backup picks the deck.
   Modes: read (default), ?present=1, ?speaker=1 (opened by present mode), ?print=1. */
(function () {
  var SITE = 'https://pathableai.github.io/star-live/';
  var SITE_SHORT = 'pathableai.github.io/star-live';
  var POLL_MS = 15000;

  var params = new URLSearchParams(location.search);
  var deckName = (params.get('deck') || 'live').replace(/[^a-z0-9-]/gi, '');
  var mode = params.get('print') ? 'print' : params.get('speaker') ? 'speaker' : params.get('present') ? 'present' : 'read';
  document.body.className = 'mode-' + mode;

  var app = document.getElementById('app');
  var announce = document.getElementById('announce');
  var data = null, lastJson = '', current = 0, notesWin = null, startedAt = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  // Plain text with **bold** support only; everything else is escaped.
  function t(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); }

  window.DECK = function (d) {
    var j = JSON.stringify(d);
    if (j === lastJson) return;
    var wasBuilding = !data || isBuilding(data);
    lastJson = j; data = d;
    render();
    if (lastJson && wasBuilding && !isBuilding(d) && mode === 'read') say('The deck is ready. ' + d.slides.length + ' slides.');
  };

  function isBuilding(d) { return d.status === 'building' || !d.slides || !d.slides.length; }
  function say(msg) { announce.textContent = ''; setTimeout(function () { announce.textContent = msg; }, 50); }

  function load() {
    var s = document.createElement('script');
    s.src = 'decks/' + deckName + '.js?t=' + Date.now();
    s.onload = function () { s.remove(); };
    s.onerror = function () {
      s.remove();
      if (!data) app.innerHTML = '<p class="loading">No deck named "' + esc(deckName) + '" yet.</p>';
    };
    document.head.appendChild(s);
  }

  /* ---------- Slide markup ---------- */
  function head(s, id) {
    return (s.kicker ? '<p class="kicker">' + t(s.kicker) + '</p>' : '') +
      '<h2 id="' + id + '">' + t(s.title) + '</h2>';
  }
  function list(items) { return (items || []).map(function (b) { return '<li>' + t(b) + '</li>'; }).join(''); }

  function slideHTML(s, i, n) {
    var L = s.layout || 'bullets', id = 's' + (i + 1) + '-title', body;
    switch (L) {
      case 'title':
        body = head(s, id) + (s.subtitle ? '<p class="subtitle">' + t(s.subtitle) + '</p>' : '');
        break;
      case 'steps':
        body = head(s, id) + '<ol class="steps">' + (s.steps || []).map(function (x, k) {
          return '<li><span class="num" aria-hidden="true">' + (k + (s.start || 1)) + '</span><div><strong>' + t(x.h) + '</strong>' +
            (x.p ? '<span>' + t(x.p) + '</span>' : '') + '</div></li>';
        }).join('') + '</ol>';
        break;
      case 'split':
        body = head(s, id) + '<div class="split">' + [s.left, s.right].map(function (c) {
          return c ? '<div class="col"><h3>' + t(c.h) + '</h3><ul class="bullets">' + list(c.items) + '</ul></div>' : '';
        }).join('') + '</div>';
        break;
      case 'big':
        body = head(s, id) + '<p class="big">' + t(s.big) + '</p>' + (s.caption ? '<p class="caption">' + t(s.caption) + '</p>' : '');
        break;
      case 'quote':
        body = '<h2 id="' + id + '" class="sr-only">' + t(s.title || 'Quote') + '</h2><blockquote class="quote"><p>' + t(s.quote) + '</p>' +
          (s.by ? '<footer>' + t(s.by) + '</footer>' : '') + '</blockquote>';
        break;
      case 'qr':
        body = head(s, id) + '<div class="qrwrap"><img src="assets/qr.svg" width="420" height="420" alt="QR code that opens ' + SITE_SHORT + '">' +
          '<div><p class="url">' + SITE_SHORT + '</p>' + (s.caption ? '<p class="caption">' + t(s.caption) + '</p>' : '') + '</div></div>';
        break;
      default:
        L = 'bullets';
        body = head(s, id) + '<ul class="bullets">' + list(s.bullets) + '</ul>';
    }
    var logo = L === 'title' ? 'assets/logo-white.svg' : 'assets/logo.svg';
    return '<section class="slide layout-' + L + '" aria-labelledby="' + id + '" data-i="' + i + '">' +
      '<div class="body">' + body + '</div>' +
      '<div class="foot"><img src="' + logo + '" alt="PathAble AI" width="106" height="38"><span class="tag">' + t(data.footer || 'Built live at STAR 2026') +
      '</span><span>' + (i + 1) + ' / ' + n + '</span></div></section>';
  }

  /* ---------- Views ---------- */
  function render() {
    if (mode !== 'speaker' && isBuilding(data)) return renderWaiting();
    if (mode === 'read') return renderRead();
    if (mode === 'present') return renderPresent();
    if (mode === 'print') return renderPrint();
    if (mode === 'speaker') return renderSpeaker();
  }

  function renderWaiting() {
    document.title = 'Being Built Live | PathAble AI';
    var done = (data && data.progress) || [];
    app.innerHTML = '<div class="waiting"><img src="assets/logo.svg" alt="PathAble AI" width="146" height="52">' +
      '<h1>' + t((data && data.title) || 'This deck is being built live') + '</h1>' +
      '<p class="status" role="status"><span class="dot" aria-hidden="true"></span>' + t((data && data.statusText) || 'Being built live, right now') + '</p>' +
      (done.length ? '<ul class="steps-done">' + done.map(function (p) { return '<li>✔ ' + t(p) + '</li>'; }).join('') + '</ul>' : '') +
      '<p class="meta">' + t((data && data.event) || 'ACCSES NJ STAR Conference 2026') + '</p>' +
      '<p class="meta">Keep this page open. It updates by itself when the deck is ready.</p></div>';
  }

  function renderRead() {
    var n = data.slides.length, y = window.scrollY;
    var openNotes = {};
    app.querySelectorAll('details.notes[open]').forEach(function (d) { openNotes[d.dataset.i] = 1; });
    document.title = data.title + ' | PathAble AI';
    app.innerHTML =
      '<header class="top"><div class="inner"><img src="assets/logo-white.svg" alt="PathAble AI" width="123" height="44">' +
      '<h1>' + t(data.title) + '</h1><p>' + t(data.event || '') + '</p>' +
      '<div class="actions"><a class="btn presentonly" href="?deck=' + deckName + '&present=1">Present full screen</a>' +
      (data.related ? '<a class="btn ghost" href="?deck=' + esc(data.related.deck) + '">' + t(data.related.label) + '</a>' : '') +
      '</div></div></header>' +
      '<div class="deckwrap">' + data.slides.map(function (s, i) {
        return slideHTML(s, i, n) + (s.notes ? '<details class="notes" data-i="' + i + '"' + (openNotes[i] ? ' open' : '') +
          '><summary>Presenter notes, slide ' + (i + 1) + '</summary><p>' + t(s.notes) + '</p></details>' : '');
      }).join('') + '</div>' +
      '<footer class="pagefoot"><p>' + t(data.about || 'Planned and built live by the people in the room, with Claude doing the typing. Nothing was prepared in advance except the design template.') +
      '</p><p><a href="https://github.com/PathAbleAI/star-live/blob/main/CLAUDE.md">See exactly what Claude was told</a>. Made by <a href="https://pathableai.com">PathAble AI</a>.</p></footer>';
    window.scrollTo(0, y);
  }

  function renderPresent() {
    var n = data.slides.length;
    current = Math.min(current || slideFromHash(), n - 1);
    document.title = data.title + ' | Presenting';
    app.innerHTML = '<div class="stage">' + data.slides.map(function (s, i) { return slideHTML(s, i, n); }).join('') + '</div>' +
      '<div class="notesbar" aria-live="off"></div><div class="hint">← → move · N notes · S speaker window · F full screen</div>';
    fit(); show(current);
    setTimeout(function () { var h = app.querySelector('.hint'); if (h) h.classList.add('gone'); }, 5000);
  }

  function renderPrint() {
    var n = data.slides.length;
    app.innerHTML = '<div class="stage">' + data.slides.map(function (s, i) { return slideHTML(s, i, n); }).join('') + '</div>';
  }

  function renderSpeaker() {
    if (!data || isBuilding(data)) { app.innerHTML = '<p class="loading">Waiting for slides…</p>'; return; }
    var s = data.slides[current] || {}, nx = data.slides[current + 1];
    app.innerHTML = '<div class="row"><span class="clock" id="clock">0:00</span>' +
      '<button id="prev">← Back</button><button id="next">Next →</button>' +
      '<span>Slide ' + (current + 1) + ' of ' + data.slides.length + '</span></div>' +
      '<h1>' + t(s.title) + '</h1><p class="next">Next: ' + (nx ? t(nx.title) : 'end of deck') + '</p>' +
      '<div class="spnotes">' + t(s.notes || 'No notes for this slide.') + '</div>';
    document.getElementById('prev').onclick = function () { tell('prev'); };
    document.getElementById('next').onclick = function () { tell('next'); };
    tick();
  }

  /* ---------- Present-mode behavior ---------- */
  function slideFromHash() { var h = parseInt(location.hash.slice(1), 10); return h > 0 ? h - 1 : 0; }
  function fit() {
    var st = app.querySelector('.stage'); if (!st) return;
    var k = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
    st.style.transform = 'translate(-50%,-50%) scale(' + k + ')';
  }
  function show(i) {
    var n = data.slides.length;
    current = Math.max(0, Math.min(n - 1, i));
    app.querySelectorAll('.slide').forEach(function (el, k) { el.classList.toggle('on', k === current); });
    var nb = app.querySelector('.notesbar'); if (nb) nb.textContent = data.slides[current].notes || '';
    history.replaceState(null, '', '#' + (current + 1));
    if (!startedAt) startedAt = Date.now();
    if (notesWin && !notesWin.closed) notesWin.postMessage({ slide: current, startedAt: startedAt }, '*');
  }
  function tell(cmd) { if (window.opener) window.opener.postMessage({ cmd: cmd }, '*'); }
  function tick() {
    var c = document.getElementById('clock'); if (!c || !startedAt) return;
    var s = Math.floor((Date.now() - startedAt) / 1000);
    c.textContent = Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }

  if (mode === 'present') {
    window.addEventListener('resize', fit);
    document.addEventListener('keydown', function (e) {
      if (!data || isBuilding(data)) return;
      var k = e.key;
      if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Enter') { show(current + 1); e.preventDefault(); }
      else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') { show(current - 1); e.preventDefault(); }
      else if (k === 'Home') show(0);
      else if (k === 'End') show(data.slides.length - 1);
      else if (k === 'n' || k === 'N') document.body.classList.toggle('shownotes');
      else if (k === 'f' || k === 'F') { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); }
      else if (k === 's' || k === 'S') {
        notesWin = window.open('?deck=' + deckName + '&speaker=1', 'speaker', 'width=900,height=700');
        setTimeout(function () { show(current); }, 800);
      }
    });
    app.addEventListener('click', function (e) {
      if (!data || isBuilding(data) || e.target.closest('a,button')) return;
      show(current + (e.clientX > window.innerWidth / 2 ? 1 : -1));
    });
    window.addEventListener('message', function (e) {
      if (e.data && e.data.cmd === 'next') show(current + 1);
      if (e.data && e.data.cmd === 'prev') show(current - 1);
    });
  }
  if (mode === 'speaker') {
    window.addEventListener('message', function (e) {
      if (e.data && typeof e.data.slide === 'number') { current = e.data.slide; startedAt = e.data.startedAt; if (data) renderSpeaker(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === ' ') tell('next');
      if (e.key === 'ArrowLeft') tell('prev');
    });
    setInterval(tick, 1000);
  }

  load();
  // Only the live deck changes during the talk; phones and the projector pick up each publish.
  if (deckName === 'live' && mode !== 'print') setInterval(load, POLL_MS);
})();
