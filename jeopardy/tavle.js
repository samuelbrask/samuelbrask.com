(async function () {
  const $ = s => document.querySelector(s);

  // Tilbage fra Spotify-login?
  const qs = new URLSearchParams(location.search);
  if (qs.has('code') || qs.has('error')) { if (await JPSpotify.handleRedirect()) return; }

  const quiz = await Q.loadQuiz();
  let game = Q.loadGame();
  let cur = null;          // { c, r } for det åbne felt
  let paused = false;

  const key = (c, r) => c + '-' + r;
  const value = () => (cur ? quiz.values[cur.r] : game.last) || 0;
  const save = () => Q.saveGame(game);

  /* ---------- Tavlen ---------- */
  function renderBoard() {
    $('#title').textContent = quiz.title;
    document.title = quiz.title;
    const b = $('#board');
    const nc = quiz.categories.length, nr = quiz.values.length;
    b.style.gridTemplateColumns = `repeat(${nc}, minmax(0, 1fr))`;
    b.style.gridTemplateRows = `minmax(0, .8fr) repeat(${nr}, minmax(0, 1fr))`;
    let h = quiz.categories.map(k => `<div class="cat">${Q.esc(k.name)}</div>`).join('');
    quiz.values.forEach((v, r) => quiz.categories.forEach((k, c) => {
      const used = game.used[key(c, r)];
      h += `<button class="tile${used ? ' used' : ''}" data-c="${c}" data-r="${r}" type="button">${v}</button>`;
    }));
    b.innerHTML = h;
  }

  /* ---------- Hold og point ---------- */
  function renderScores() {
    const v = value();
    $('#scores').innerHTML = game.teams.map((t, i) => `
      <div class="team">
        <span class="chip" style="background:${t.color}"></span>
        <button class="name" data-rename="${i}" type="button" title="Klik for at omdøbe">${Q.esc(t.name)}</button>
        <span class="pts">${t.score}</span>
        <div class="btns">
          <button class="minus" data-minus="${i}" type="button" ${v ? '' : 'disabled'}>−${v}</button>
          <button class="plus" data-plus="${i}" type="button" ${v ? '' : 'disabled'}>+${v}</button>
          <button class="del" data-del="${i}" type="button" aria-label="Fjern ${Q.esc(t.name)}">×</button>
        </div>
      </div>`).join('') +
      (game.teams.length < 6 ? '<button class="btn ghost add-team" id="btnAdd" type="button">+ Hold</button>' : '');
  }

  $('#scores').addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    const d = t.dataset;
    if (d.plus != null) { game.teams[+d.plus].score += value(); }
    else if (d.minus != null) { game.teams[+d.minus].score -= value(); }
    else if (d.rename != null) {
      const n = prompt('Holdets navn', game.teams[+d.rename].name);
      if (n && n.trim()) game.teams[+d.rename].name = n.trim();
    } else if (d.del != null) {
      if (!confirm('Fjern ' + game.teams[+d.del].name + '?')) return;
      game.teams.splice(+d.del, 1);
    } else if (t.id === 'btnAdd') {
      const i = game.teams.length;
      game.teams.push({ name: Q.NAMES[i] || 'Hold ' + (i + 1), color: Q.COLORS[i % Q.COLORS.length], score: 0 });
    } else return;
    save(); renderScores();
  });

  /* ---------- Åbn et felt ---------- */
  $('#board').addEventListener('click', e => {
    const t = e.target.closest('.tile'); if (!t) return;
    openTile(+t.dataset.c, +t.dataset.r);
  });

  function openTile(c, r) {
    cur = { c, r };
    game.used[key(c, r)] = true;
    game.last = quiz.values[r];
    save();
    const k = quiz.categories[c], q = k.questions[r];
    $('#oCat').textContent = k.name;
    $('#oVal').textContent = quiz.values[r];
    $('#oQ').textContent = q.q;
    $('#oQ').hidden = !q.q.trim();
    $('#oErr').hidden = true;
    $('#overlay').hidden = false;
    renderBoard(); renderScores();
    play();
  }

  async function play() {
    const q = quiz.categories[cur.c].questions[cur.r];
    const id = Q.spotifyId(q.url);
    setPaused(false);
    if (!id) { showErr(q.url.trim() ? 'Linket er ikke et link til en sang.' : 'Der er ikke sat musik på dette felt.'); setPaused(true); return; }
    if (!JPSpotify.loggedIn) { showErr('Spotify er ikke forbundet. Klik ♪ øverst til højre og log ind.'); setPaused(true); return; }
    try { await JPSpotify.play(id, 0, 0); $('#oErr').hidden = true; }
    catch (e) { showErr(e.message); setPaused(true); }
  }

  function showErr(msg) { $('#oErr').textContent = msg; $('#oErr').hidden = false; }
  function setPaused(p) {
    paused = p;
    $('#eq').classList.toggle('paused', p);
    $('#btnPause').textContent = p ? 'Afspil' : 'Pause';
  }

  async function togglePause() {
    if (!cur) return;
    try {
      if (paused) { await JPSpotify.resume(); setPaused(false); }
      else { await JPSpotify.pause(); setPaused(true); }
    } catch (e) { showErr(e.message); }
  }

  function back() {
    if (!cur) return;
    JPSpotify.stop().catch(() => {});
    cur = null;
    $('#overlay').hidden = true;
    renderScores();
  }

  $('#btnPause').addEventListener('click', togglePause);
  $('#btnRestart').addEventListener('click', play);
  $('#btnBack').addEventListener('click', back);

  document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea')) return;
    if (e.key === 'f' || e.key === 'F') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {}); }
    else if (e.key === 'Escape' && cur) back();
    else if (e.key === ' ' && cur) { e.preventDefault(); togglePause(); }
  });

  $('#btnReset').addEventListener('click', () => {
    if (!confirm('Starte et nyt spil? Alle point nulstilles, og alle felter bliver åbne igen.')) return;
    game = Q.newGame(game); save(); renderBoard(); renderScores();
  });

  /* ---------- Spotify ---------- */
  $('#btnStart').addEventListener('click', () => {
    JPSpotify.activate();
    $('#start').hidden = true;
    document.documentElement.requestFullscreen?.().catch(() => {});
  });
  document.addEventListener('click', () => JPSpotify.activate());

  $('#spBtn').addEventListener('click', e => {
    e.stopPropagation();
    $('#spPanel').hidden = !$('#spPanel').hidden;
    renderSpotify(JPSpotify.status);
  });
  document.addEventListener('click', e => {
    if (!$('#spPanel').hidden && !$('#spPanel').contains(e.target) && e.target !== $('#spBtn')) $('#spPanel').hidden = true;
  });

  function renderSpotify(status, msg) {
    $('#spBtn').dataset.status = status;
    const labels = {
      off: 'Spotify er ikke forbundet.',
      nocfg: msg,
      connecting: msg || 'Forbinder til Spotify…',
      ready: 'Spotify er klar. Musikken spiller skjult.',
      error: msg
    };
    $('#spStatus').textContent = labels[status] || '';
    if ($('#spPanel').hidden) return;
    const body = $('#spBody');
    if (status === 'off') {
      body.innerHTML = '<button class="btn primary" id="spLogin" type="button">Log ind med Spotify</button>';
      $('#spLogin').onclick = () => JPSpotify.login('');
      return;
    }
    if (status === 'nocfg') { body.innerHTML = ''; return; }
    body.innerHTML =
      '<div class="sp-row"><button class="btn primary" id="spTest" type="button">Test lyd (10 sek)</button>' +
      '<button class="btn ghost" id="spOut" type="button">Log ud</button></div><p class="sp-hint" id="spMsg"></p>';
    $('#spOut').onclick = () => { JPSpotify.logout(); renderSpotify('off'); };
    $('#spTest').onclick = async () => {
      JPSpotify.activate();
      let id = null;
      quiz.categories.forEach(k => k.questions.forEach(q => { if (!id) id = Q.spotifyId(q.url); }));
      id = id || '4uLU6hMCjMI75M1A2tKUQC';
      $('#spMsg').textContent = 'Starter…';
      try { await JPSpotify.play(id, 0, 10); $('#spMsg').textContent = 'Spiller i 10 sekunder.'; }
      catch (e) { $('#spMsg').textContent = e.message; }
    };
  }
  JPSpotify.init(renderSpotify);

  renderBoard();
  renderScores();
})();
