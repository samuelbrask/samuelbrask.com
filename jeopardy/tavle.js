(async function () {
  const $ = s => document.querySelector(s);
  const { sb, code, esc } = JP;

  // Tilbage fra Spotify-login?
  if (new URLSearchParams(location.search).has('state')) {
    if (await JPSpotify.handleRedirect()) return;
  }

  let C, S, teams = [];
  let lastSig = '', lastMusicN = null, lastBuzzKey = '', lastOpen = false;
  let cdEnd = 0, cdTotal = 10000, cdWarned = false;
  const played = new Set();
  function once(key, fn) { if (!played.has(key)) { played.add(key); fn(); } }

  if (!code) {
    $('#stage').innerHTML = '<section class="msg"><h1>Mangler spilkode</h1><p>Åbn tavlen fra forsiden, så kommer koden med i adressen.</p></section>';
    $('#startOverlay').hidden = true;
    return;
  }

  try {
    const g = await JP.loadGame();
    if (!g) throw new Error('Der findes ikke et spil med koden ' + code + '.');
    C = g.config; S = g.state; lastMusicN = S.music.n;
    teams = await JP.loadTeams();
  } catch (e) {
    $('#stage').innerHTML = '<section class="msg"><h1>Tavlen kunne ikke åbne</h1><p>' + esc(e.message) + '</p></section>';
    $('#startOverlay').hidden = true;
    return;
  }

  JP.subscribe({
    onGame: r => { C = r.config; S = r.state; update(); },
    onTeams: async () => { teams = await JP.loadTeams(); update(); }
  });
  // Sikkerhedsnet hvis live-forbindelsen hikker
  setInterval(async () => {
    const { data } = await sb.from('jp_games').select('state,config').eq('code', code).maybeSingle();
    if (!data) return;
    const ns = JP.normState(data.state);
    if (JSON.stringify(ns) !== JSON.stringify(S)) { S = ns; C = JP.normConfig(data.config); update(); }
  }, 4000);
  setInterval(async () => { teams = await JP.loadTeams(); renderScores(); }, 8000);

  JPSpotify.init(renderSpotify);

  $('#startBtn').addEventListener('click', () => {
    JP.unlockAudio();
    JPSpotify.activate();
    $('#startOverlay').hidden = true;
    goFullscreen();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'f' || e.key === 'F') { document.fullscreenElement ? document.exitFullscreen() : goFullscreen(); }
  });
  document.addEventListener('click', () => { JP.unlockAudio(); JPSpotify.activate(); });
  function goFullscreen() { try { document.documentElement.requestFullscreen(); } catch (e) { /* ok */ } }

  update();
  setInterval(tickCountdown, 100);

  // ---------- rendering ----------

  function update() {
    document.title = C.title + ' – tavle';
    renderScores();
    const showTeams = ['lobby', 'end', 'question'].includes(S.phase);
    const sig = JSON.stringify([S.phase, S.cur, S.splash, S.dd, S.open, S.buzz, S.locked, S.used, S.winner, C,
      showTeams ? teams.map(t => [t.id, t.name, t.color, S.phase === 'end' ? t.score : 0]) : 0]);
    if (sig !== lastSig) { lastSig = sig; renderStage(); }
    handleBuzzFx();
    handleMusic();
  }

  function teamStyle(t) {
    return t ? '--team:' + t.color + ';--team-ink:' + JP.inkFor(t.color) : '';
  }

  function renderScores() {
    const el = $('#scores');
    el.hidden = S.phase === 'lobby' || S.phase === 'end' || !teams.length;
    el.innerHTML = teams.map(t => {
      const cls = ['score'];
      if (S.control === t.id) cls.push('in-control');
      if (S.phase === 'question' && S.locked.includes(t.id)) cls.push('out');
      return '<div class="' + cls.join(' ') + '" style="' + teamStyle(t) + '">' +
        '<span class="s-name">' + esc(t.name) + '</span>' +
        '<span class="s-pts' + (t.score < 0 ? ' neg' : '') + '">' + t.score + '</span></div>';
    }).join('');
  }

  function renderStage() {
    const st = $('#stage');
    if (S.phase === 'lobby') return renderLobby(st);
    if (S.phase === 'end') return renderEnd(st);
    if ((S.phase === 'question' || S.phase === 'reveal') && JP.qAt(C, S.cur)) return renderQuestion(st);
    return renderBoard(st);
  }

  function renderLobby(st) {
    const joinUrl = JP.pageUrl('hold.html');
    st.innerHTML =
      '<section class="lobby">' +
        '<div class="lobby-left">' +
          '<h1 class="lobby-title">' + esc(C.title) + '</h1>' +
          '<p class="lobby-sub">Scan koden med telefonen, giv holdet et navn og vælg en farve.</p>' +
          (teams.length
            ? '<ul class="lobby-teams">' + teams.map(t => '<li style="' + teamStyle(t) + '">' + esc(t.name) + '</li>').join('') + '</ul>'
            : '<p class="lobby-empty">Ingen hold endnu.</p>') +
        '</div>' +
        '<div class="qr-wrap"><div id="qr"></div><div class="qr-url">' + esc(joinUrl.replace(/^https?:\/\//, '')) + '</div></div>' +
      '</section>';
    try {
      new QRCode(document.getElementById('qr'), {
        text: joinUrl, width: 512, height: 512, colorDark: '#040A2E', colorLight: '#FFFFFF',
        correctLevel: QRCode.CorrectLevel.M
      });
    } catch (e) { $('#qr').textContent = joinUrl; }
  }

  function renderBoard(st) {
    const cats = C.categories, rows = cats[0].questions.length;
    let html = '<section class="board" style="--cols:' + cats.length + ';--rows:' + rows + '">';
    cats.forEach(c => { html += '<div class="cat"><span>' + esc(c.name) + '</span></div>'; });
    for (let r = 0; r < rows; r++) {
      cats.forEach((c, ci) => {
        const used = S.used.includes(ci + '-' + r);
        html += '<div class="cell' + (used ? ' used' : '') + '">' + (used ? '' : esc(c.questions[r].value)) + '</div>';
      });
    }
    st.innerHTML = html + '</section>';
  }

  function renderQuestion(st) {
    const q = JP.qAt(C, S.cur), cat = C.categories[S.cur.c];
    const dd = C.settings.bonusMode === 'dd';

    if (S.phase === 'question' && S.splash) {
      st.innerHTML =
        '<section class="q-view splash">' +
          '<div class="splash-word">' + (dd ? 'Daily<br>Double' : 'Dobbelt<br>point') + '</div>' +
          '<div class="splash-cat">' + esc(cat.name) + '</div>' +
        '</section>';
      once('splash' + JP.keyOf(S.cur) + ':' + S.round, () => {
        JP.tone(523, 0.12, 'triangle', 0.15); JP.tone(784, 0.12, 'triangle', 0.15, 0.12); JP.tone(1047, 0.3, 'triangle', 0.15, 0.24);
      });
      return;
    }

    const val = S.dd ? S.dd.wager : JP.valueAt(C, S.cur);
    const len = (q.q || '').length;
    const sizeCls = len > 150 ? ' long' : len > 75 ? ' mid' : '';
    const media =
      (q.type === 'image' && q.img ? '<img class="q-img" src="' + esc(q.img) + '" alt="">' : '') +
      (q.type === 'music' ? '<div class="eq' + (S.buzz || S.phase === 'reveal' ? ' still' : '') + '" aria-hidden="true">' + '<i></i>'.repeat(7) + '</div>' : '');

    if (S.phase === 'reveal') {
      const w = JP.teamById(teams, S.winner);
      st.innerHTML =
        '<section class="q-view reveal">' +
          '<header class="q-head"><span>' + esc(cat.name) + '</span><span class="q-val">' + val + '</span></header>' +
          '<div class="q-body">' +
            '<p class="q-text small">' + esc(q.q) + '</p>' +
            '<p class="a-text">' + esc(q.a || '—') + '</p>' +
            (w ? '<p class="winner-line" style="' + teamStyle(w) + '">+' + val + ' til ' + esc(w.name) + '</p>' : '') +
          '</div>' +
        '</section>';
      return;
    }

    const bt = S.buzz ? JP.teamById(teams, S.buzz.team) : null;
    const ddt = S.dd ? JP.teamById(teams, S.dd.team) : null;
    const chips = S.dd ? '' : teams.map(t =>
      '<span class="chip' + (S.locked.includes(t.id) ? ' out' : '') + '" style="' + teamStyle(t) + '">' + esc(t.name) + '</span>').join('');

    st.innerHTML =
      '<section class="q-view' + (S.open ? ' armed' : '') + '">' +
        '<header class="q-head"><span>' + esc(cat.name) + '</span><span class="q-val">' + val + '</span></header>' +
        '<div class="q-body">' + media + '<p class="q-text' + sizeCls + '">' + esc(q.q) + '</p></div>' +
        '<footer class="q-foot">' + (S.open ? '<span class="armed-label">Summerne er åbne</span>' : '') + chips + '</footer>' +
        (ddt ? '<div class="dd-banner" style="' + teamStyle(ddt) + '">' + esc(ddt.name) + ' satser ' + S.dd.wager + '</div>' : '') +
        (bt ? '<div class="buzz" style="' + teamStyle(bt) + '">' +
                '<div class="buzz-name">' + esc(bt.name) + '</div>' +
                '<div class="buzz-count" id="cdNum"></div>' +
                '<div class="buzz-bar"><i id="cdBar"></i></div>' +
              '</div>' : '') +
      '</section>';
  }

  function renderEnd(st) {
    const sorted = teams.slice().sort((a, b) => b.score - a.score);
    st.innerHTML =
      '<section class="end">' +
        '<h1>Slutstilling</h1>' +
        '<ol class="podium">' + sorted.map((t, i) =>
          '<li style="' + teamStyle(t) + '"><span class="p-rank">' + (i + 1) + '</span><span class="p-name">' + esc(t.name) +
          '</span><span class="p-pts">' + t.score + '</span></li>').join('') + '</ol>' +
      '</section>';
    if (sorted.length) once('end' + S.round, () => { [523, 659, 784, 1047].forEach((f, i) => JP.tone(f, 0.25, 'triangle', 0.14, i * 0.14)); });
  }

  // ---------- summer-effekter og nedtælling ----------

  function handleBuzzFx() {
    const key = S.phase === 'question' && S.buzz ? S.buzz.team + ':' + S.buzz.round : '';
    if (key && key !== lastBuzzKey) {
      cdTotal = (Number(C.settings.seconds) || 10) * 1000;
      cdEnd = Date.now() + cdTotal;
      cdWarned = false;
      JP.tone(880, 0.09, 'square', 0.16); JP.tone(1175, 0.22, 'square', 0.16, 0.09);
    }
    if (!key) cdEnd = 0;
    lastBuzzKey = key;
    if (S.open && !lastOpen && S.phase === 'question') JP.tone(660, 0.08, 'sine', 0.1);
    lastOpen = S.open;
    tickCountdown();
  }

  function tickCountdown() {
    const num = document.getElementById('cdNum'), bar = document.getElementById('cdBar');
    if (!cdEnd || !num || !bar) return;
    const left = Math.max(0, cdEnd - Date.now());
    num.textContent = Math.ceil(left / 1000);
    bar.style.transform = 'scaleX(' + (left / cdTotal) + ')';
    if (left === 0 && !cdWarned) { cdWarned = true; JP.tone(196, 0.6, 'sawtooth', 0.14); }
  }

  // ---------- musik ----------

  function handleMusic() {
    const m = S.music || {};
    if (m.n === lastMusicN) return;
    lastMusicN = m.n;
    const q = JP.qAt(C, S.cur);
    const run = p => p.catch(e => JP.toast(e.message, 6000));
    if (m.cmd === 'play') {
      if (!q || q.type !== 'music') return;
      const id = JP.spotifyId(q.spotify);
      if (!id) { JP.toast('Spørgsmålet har ikke et gyldigt Spotify-link'); return; }
      if (!JPSpotify.loggedIn) { JP.toast('Spotify er ikke forbundet på tavlen'); return; }
      const len = q.len == null || q.len === '' ? C.settings.clip : q.len;
      run(JPSpotify.play(id, q.start || 0, len));
    } else if (m.cmd === 'pause') run(JPSpotify.pause());
    else if (m.cmd === 'resume') run(JPSpotify.resume());
    else if (m.cmd === 'stop') run(JPSpotify.stop());
  }

  // ---------- Spotify-panel ----------

  $('#spBtn').addEventListener('click', e => {
    e.stopPropagation();
    const p = $('#spPanel');
    p.hidden = !p.hidden;
    if (!p.hidden) renderSpotify(JPSpotify.status);
  });

  async function renderSpotify(status, msg) {
    $('#spBtn').dataset.status = status;
    const sEl = $('#spStatus'), body = $('#spBody');
    const labels = {
      off: 'Spotify er ikke forbundet.',
      nocfg: msg,
      connecting: msg || 'Forbinder til Spotify…',
      ready: 'Spotify er klar. Musikken spiller skjult.',
      error: msg
    };
    sEl.textContent = labels[status] || '';
    if ($('#spPanel').hidden) return;
    if (status === 'off') {
      body.innerHTML = '<button class="btn primary" id="spLogin" type="button">Log ind med Spotify</button>';
      $('#spLogin').onclick = () => JPSpotify.login(code);
      return;
    }
    if (status === 'nocfg') { body.innerHTML = ''; return; }
    let opts = '<option value="">Denne browser (tavlen)</option>';
    try {
      const devs = await JPSpotify.devices();
      const cur = localStorage.getItem('jp-sp-device') || '';
      devs.filter(d => d.id !== JPSpotify.browserDevice).forEach(d => {
        opts += '<option value="' + esc(d.id) + '"' + (d.id === cur ? ' selected' : '') + '>' + esc(d.name) + ' (' + esc(d.type) + ')</option>';
      });
    } catch (e) { /* vis bare browseren */ }
    body.innerHTML =
      '<label class="sp-label">Afspil på<select id="spDev">' + opts + '</select></label>' +
      '<p class="sp-hint">Telefonen dukker op her, når Spotify-appen er åben på den.</p>' +
      '<div class="sp-row"><button class="btn" id="spRefresh" type="button">Opdater enheder</button>' +
      '<button class="btn ghost" id="spOut" type="button">Log ud</button></div>';
    $('#spDev').onchange = e => { JPSpotify.setTarget(e.target.value); JP.toast('Afspilningsenhed gemt'); };
    $('#spRefresh').onclick = () => renderSpotify(JPSpotify.status);
    $('#spOut').onclick = () => { JPSpotify.logout(); renderSpotify('off'); };
  }
  document.addEventListener('click', e => {
    const p = $('#spPanel');
    if (!p.hidden && !p.contains(e.target) && e.target !== $('#spBtn')) p.hidden = true;
  });
})();
