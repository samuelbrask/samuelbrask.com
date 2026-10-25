(async function () {
  const $ = s => document.querySelector(s);
  const { sb, code, esc } = JP;

  let C, S, teams = [];
  let timerEnd = 0, timerFired = false, musicPlaying = false, musicWasPlaying = false;
  let saveChain = Promise.resolve(), lastRenderSig = '';

  if (!code) { $('#now').innerHTML = '<p>Mangler spilkode. Åbn værtspanelet fra forsiden.</p>'; return; }
  $('#code').textContent = code;
  $('#lnkBoard').href = JP.pageUrl('tavle.html');
  $('#lnkEdit').href = JP.pageUrl('editor.html');

  try {
    const g = await JP.loadGame();
    if (!g) throw new Error('Der findes ikke et spil med koden ' + code + '.');
    C = g.config; S = g.state;
    teams = await JP.loadTeams();
  } catch (e) { $('#now').innerHTML = '<p>' + esc(e.message) + '</p>'; return; }

  JP.subscribe({
    onGame: r => { C = r.config; render(); },          // kun spørgsmål udefra – værten ejer spillets tilstand
    onTeams: async () => { teams = await JP.loadTeams(); render(); },
    onBuzz: handleBuzz
  });
  setInterval(pollBuzz, 1000);
  setInterval(async () => { teams = await JP.loadTeams(); render(); }, 6000);
  setInterval(tickTimer, 200);
  if (S.buzz) startTimer();
  render();

  // ---------- gem ----------

  function save() {
    render(true);
    const snapshot = JSON.parse(JSON.stringify(S));
    saveChain = saveChain.then(async () => {
      const { error } = await sb.from('jp_games').update({ state: snapshot, updated_at: new Date().toISOString() }).eq('code', code);
      if (error) JP.toast('Kunne ikke gemme: ' + error.message, 6000);
    });
  }

  async function addScore(teamId, delta) {
    const t = JP.teamById(teams, teamId);
    if (!t || !delta) return;
    t.score += delta;
    const { error } = await sb.from('jp_teams').update({ score: t.score }).eq('id', teamId);
    if (error) JP.toast('Point blev ikke gemt: ' + error.message, 6000);
  }

  // ---------- summere ----------

  function handleBuzz(b) {
    if (!S || S.phase !== 'question' || !S.open || S.buzz || S.splash || S.dd) return;
    if (b.round !== S.round) return;
    if (S.locked.includes(b.team_id) || !JP.teamById(teams, b.team_id)) {
      S.round++;           // ugyldigt tryk: åbn en frisk runde
      save();
      return;
    }
    S.open = false;
    S.buzz = { team: b.team_id, round: b.round };
    if (musicPlaying) { musicWasPlaying = true; music('pause'); }
    startTimer();
    save();
  }

  async function pollBuzz() {
    if (!S || S.phase !== 'question' || !S.open || S.buzz) return;
    const { data } = await sb.from('jp_buzzes').select('*').eq('game_code', code).eq('round', S.round).maybeSingle();
    if (data) handleBuzz(data);
  }

  function startTimer() {
    timerEnd = Date.now() + (Number(C.settings.seconds) || 10) * 1000;
    timerFired = false;
  }
  function stopTimer() { timerEnd = 0; }
  function tickTimer() {
    const el = document.getElementById('hostCd');
    if (!timerEnd) return;
    const left = Math.max(0, timerEnd - Date.now());
    if (el) el.textContent = left > 0 ? Math.ceil(left / 1000) + ' sek.' : 'Tiden er gået';
    if (left === 0 && !timerFired) {
      timerFired = true;
      if (C.settings.autoTimeout && S.buzz) judge(false);
    }
  }

  // ---------- musik ----------

  function music(cmd) {
    S.music = { cmd: cmd, n: (S.music && S.music.n || 0) + 1 };
    musicPlaying = cmd === 'play' || cmd === 'resume';
  }

  // ---------- spillets handlinger ----------

  function pick(c, r) {
    const key = c + '-' + r;
    if (S.used.includes(key) && !confirm('Det spørgsmål er brugt. Vil du åbne det igen?')) return;
    const q = C.categories[c].questions[r];
    stopTimer();
    if (musicPlaying) music('stop');
    musicWasPlaying = false;
    S.used = S.used.filter(k => k !== key);
    S.phase = 'question';
    S.cur = { c: c, q: r };
    S.open = false; S.buzz = null; S.locked = []; S.winner = null;
    S.splash = !!q.bonus;
    S.dd = (q.bonus && C.settings.bonusMode === 'dd')
      ? { team: S.control || (teams[0] && teams[0].id) || null, wager: Number(q.value) || 0 }
      : null;
    save();
  }

  function showQuestion() {
    if (S.dd && !JP.teamById(teams, S.dd.team)) { JP.toast('Vælg hvilket hold der svarer'); return; }
    S.splash = false;
    save();
  }

  function openBuzzers(withMusic) {
    if (!teams.length) { JP.toast('Der er ingen hold med endnu'); return; }
    S.round++;
    S.open = true;
    S.buzz = null;
    if (withMusic) music('play');
    save();
  }

  function judge(correct) {
    stopTimer();
    if (S.dd) {
      const t = S.dd.team;
      addScore(t, correct ? S.dd.wager : -S.dd.wager);
      if (correct) S.control = t;
      reveal(correct ? t : null);
      return;
    }
    if (!S.buzz) return;
    const t = S.buzz.team, val = JP.valueAt(C, S.cur);
    if (correct) {
      addScore(t, val);
      S.control = t;
      reveal(t);
      return;
    }
    if (C.settings.minus) addScore(t, -val);
    S.locked = S.locked.concat(t);
    S.buzz = null;
    const left = teams.filter(x => !S.locked.includes(x.id));
    if (!left.length) { S.open = false; save(); return; }
    S.round++;
    S.open = true;
    if (musicWasPlaying) { music('resume'); musicWasPlaying = false; }
    save();
  }

  function reveal(winner) {
    stopTimer();
    S.phase = 'reveal';
    S.open = false;
    S.buzz = null;
    S.winner = winner || null;
    const k = JP.keyOf(S.cur);
    if (!S.used.includes(k)) S.used = S.used.concat(k);
    if (musicPlaying) music('pause');
    save();
  }

  function toBoard() {
    stopTimer();
    if (musicPlaying) music('stop');
    S.phase = 'board'; S.cur = null; S.dd = null; S.splash = false; S.open = false;
    S.buzz = null; S.locked = []; S.winner = null;
    save();
  }

  async function reset(deleteTeams) {
    const msg = deleteTeams
      ? 'Slet alle hold og start helt forfra? Holdene skal scanne QR-koden igen.'
      : 'Sæt alle hold til 0 point og gør hele tavlen ubrugt?';
    if (!confirm(msg)) return;
    stopTimer();
    const n = (S.music && S.music.n) || 0;
    S = JP.defaultState();
    S.music = { cmd: 'stop', n: n + 1 };
    musicPlaying = false; musicWasPlaying = false;
    await sb.from('jp_buzzes').delete().eq('game_code', code);
    if (deleteTeams) await sb.from('jp_teams').delete().eq('game_code', code);
    else await sb.from('jp_teams').update({ score: 0 }).eq('game_code', code);
    teams = await JP.loadTeams();
    save();
  }

  const actions = {
    start: () => { S.phase = 'board'; save(); },
    pick: d => pick(+d.c, +d.r),
    showQ: showQuestion,
    open: () => openBuzzers(false),
    openMusic: () => openBuzzers(true),
    close: () => { S.open = false; save(); },
    right: () => judge(true),
    wrong: () => judge(false),
    reveal: () => reveal(null),
    back: toBoard,
    toBoard: toBoard,
    mPlay: () => { music('play'); save(); },
    mPause: () => { music('pause'); musicWasPlaying = false; save(); },
    mResume: () => { music('resume'); save(); },
    plus: d => { addScore(d.id, stepValue()); render(true); },
    minus: d => { addScore(d.id, -stepValue()); render(true); },
    ctrl: d => { S.control = d.id; save(); },
    del: async d => {
      const t = JP.teamById(teams, d.id);
      if (!t || !confirm('Fjern holdet ' + t.name + '?')) return;
      await sb.from('jp_teams').delete().eq('id', d.id);
      teams = await JP.loadTeams(); render(true);
    },
    lobby: () => { S.phase = 'lobby'; save(); },
    end: () => { stopTimer(); if (musicPlaying) music('stop'); S.phase = 'end'; S.open = false; S.buzz = null; save(); },
    resetScores: () => reset(false),
    resetAll: () => reset(true)
  };

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const fn = actions[b.dataset.act];
    if (fn) fn(b.dataset);
  });
  document.addEventListener('input', e => {
    if (e.target.dataset.in === 'ddWager' && S.dd) S.dd.wager = Math.max(0, parseInt(e.target.value, 10) || 0);
  });
  document.addEventListener('change', e => {
    const k = e.target.dataset.in;
    if (k === 'ddTeam' && S.dd) { S.dd.team = e.target.value; save(); }
    if (k === 'ddWager' && S.dd) save();
  });
  $('#addTeam').addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('#addName').value.trim();
    if (!name) return;
    const used = teams.map(t => t.color);
    const color = (JP.COLORS.find(c => !used.includes(c.hex)) || JP.COLORS[teams.length % JP.COLORS.length]).hex;
    const { error } = await sb.from('jp_teams').insert({ game_code: code, name: name, color: color });
    if (error) { JP.toast('Holdet blev ikke tilføjet: ' + error.message); return; }
    $('#addName').value = '';
    teams = await JP.loadTeams(); render(true);
  });

  function stepValue() {
    if (S.cur && (S.phase === 'question' || S.phase === 'reveal')) return S.dd ? (S.dd.wager || 100) : (JP.valueAt(C, S.cur) || 100);
    return Number(C.settings.step) || 100;
  }

  // ---------- rendering ----------

  function render(force) {
    const sig = JSON.stringify([S, C, teams]);
    if (!force && sig === lastRenderSig) return;
    lastRenderSig = sig;
    $('#title').textContent = C.title;
    document.title = 'Vært – ' + C.title;
    const typing = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.in;
    if (!typing || force) renderNow();
    renderTeams(); renderMini();
    tickTimer();
  }

  function teamStyle(t) { return t ? '--team:' + t.color + ';--team-ink:' + JP.inkFor(t.color) : ''; }
  function teamName(id) { const t = JP.teamById(teams, id); return t ? esc(t.name) : 'Ukendt hold'; }

  function renderNow() {
    const el = $('#now');
    if (S.phase === 'lobby') {
      el.innerHTML = '<h2>Holdene melder sig</h2><p class="hint">Tv\'et viser QR-koden. ' + teams.length + ' hold er med.</p>' +
        '<button class="btn primary big" data-act="start" type="button">Start spillet</button>';
      return;
    }
    if (S.phase === 'end') {
      el.innerHTML = '<h2>Slutstillingen vises på tv\'et</h2><button class="btn" data-act="toBoard" type="button">Tilbage til tavlen</button>';
      return;
    }
    if (S.phase === 'board' || !S.cur || !JP.qAt(C, S.cur)) {
      el.innerHTML = '<h2>Vælg et spørgsmål</h2><p class="hint">' +
        (S.control ? teamName(S.control) + ' vælger næste kategori.' : 'Tryk på et felt i tavlen nedenfor.') + '</p>';
      return;
    }

    const q = JP.qAt(C, S.cur), cat = C.categories[S.cur.c];
    const val = S.dd ? S.dd.wager : JP.valueAt(C, S.cur);
    const head =
      '<div class="now-meta"><span>' + esc(cat.name) + '</span><span class="now-val">' + val + (q.bonus ? ' ★' : '') + '</span></div>' +
      '<p class="host-q">' + (q.q ? esc(q.q) : '<em>Intet spørgsmål skrevet</em>') + '</p>' +
      (q.type === 'image' && q.img ? '<img class="host-img" src="' + esc(q.img) + '" alt="">' : '') +
      '<div class="answer"><span>Svar</span><strong>' + (q.a ? esc(q.a) : '—') + '</strong></div>';

    if (S.phase === 'reveal') {
      el.innerHTML = head + '<p class="status">' + (S.winner ? teamName(S.winner) + ' fik pointene.' : 'Ingen fik point.') + '</p>' +
        musicRow(q) + '<button class="btn primary big" data-act="back" type="button">Tilbage til tavlen</button>';
      return;
    }

    let ctl = '';
    if (S.splash) {
      if (S.dd) {
        ctl = '<div class="dd-form">' +
          '<label>Hold<select data-in="ddTeam">' + teams.map(t =>
            '<option value="' + t.id + '"' + (t.id === S.dd.team ? ' selected' : '') + '>' + esc(t.name) + ' (' + t.score + ')</option>').join('') + '</select></label>' +
          '<label>Indsats<input type="number" inputmode="numeric" min="0" step="100" data-in="ddWager" value="' + S.dd.wager + '"></label>' +
          '</div><button class="btn primary big" data-act="showQ" type="button">Vis spørgsmålet</button>';
      } else {
        ctl = '<p class="hint">Bonus: dobbelt point. Alle kan summe.</p><button class="btn primary big" data-act="showQ" type="button">Vis spørgsmålet</button>';
      }
    } else if (S.dd) {
      ctl = '<p class="status">' + teamName(S.dd.team) + ' svarer for ' + S.dd.wager + ' point</p>' + judgeRow();
    } else if (S.buzz) {
      const t = JP.teamById(teams, S.buzz.team);
      ctl = '<div class="buzzed" style="' + teamStyle(t) + '"><span class="bz-name">' + teamName(S.buzz.team) + '</span><span id="hostCd" class="bz-cd"></span></div>' + judgeRow();
    } else if (S.open) {
      ctl = '<p class="status live">Summerne er åbne</p><button class="btn" data-act="close" type="button">Luk summerne</button>';
    } else {
      const allOut = teams.length && teams.every(x => S.locked.includes(x.id));
      if (allOut) ctl = '<p class="status">Alle hold har svaret forkert.</p>';
      else if (q.type === 'music') ctl = '<button class="btn primary big" data-act="openMusic" type="button">Spil musik og åbn summerne</button>' +
        '<button class="btn" data-act="open" type="button">Åbn summerne uden musik</button>';
      else ctl = '<p class="hint">Læs spørgsmålet op, og åbn så summerne.</p><button class="btn primary big" data-act="open" type="button">Åbn summerne</button>';
    }

    const out = S.locked.length ? '<p class="hint">Ude: ' + S.locked.map(teamName).join(', ') + '</p>' : '';
    el.innerHTML = head + ctl + (S.splash ? '' : musicRow(q)) + out +
      '<button class="btn ghost" data-act="reveal" type="button">Vis svaret uden point</button>';
  }

  function judgeRow() {
    return '<div class="judge"><button class="btn ok big" data-act="right" type="button">Rigtigt</button>' +
      '<button class="btn bad big" data-act="wrong" type="button">Forkert</button></div>';
  }
  function musicRow(q) {
    if (q.type !== 'music') return '';
    return '<div class="music-row"><button class="btn" data-act="mPlay" type="button">Spil fra start</button>' +
      '<button class="btn" data-act="mPause" type="button">Pause</button>' +
      '<button class="btn" data-act="mResume" type="button">Fortsæt</button></div>';
  }

  function renderTeams() {
    const step = stepValue();
    $('#teams').innerHTML = teams.length ? teams.map(t =>
      '<li class="team" style="' + teamStyle(t) + '">' +
        '<span class="t-dot"></span>' +
        '<span class="t-name">' + esc(t.name) + (S.control === t.id ? ' <em>vælger</em>' : '') + '</span>' +
        '<span class="t-score' + (t.score < 0 ? ' neg' : '') + '">' + t.score + '</span>' +
        '<span class="t-btns">' +
          '<button class="mini" data-act="minus" data-id="' + t.id + '" type="button" aria-label="Træk ' + step + ' fra">−' + step + '</button>' +
          '<button class="mini" data-act="plus" data-id="' + t.id + '" type="button" aria-label="Giv ' + step + '">+' + step + '</button>' +
          '<button class="mini" data-act="ctrl" data-id="' + t.id + '" type="button" title="Lad holdet vælge næste">Vælger</button>' +
          '<button class="mini x" data-act="del" data-id="' + t.id + '" type="button" aria-label="Fjern hold">✕</button>' +
        '</span></li>').join('')
      : '<li class="hint">Ingen hold endnu. De melder sig ved at scanne QR-koden på tv\'et.</li>';
  }

  function renderMini() {
    const cats = C.categories, rows = cats[0].questions.length;
    let h = '<div class="mb-grid" style="--cols:' + cats.length + '">';
    cats.forEach(c => { h += '<div class="mb-cat" title="' + esc(c.name) + '">' + esc(c.name) + '</div>'; });
    for (let r = 0; r < rows; r++) {
      cats.forEach((c, ci) => {
        const q = c.questions[r], key = ci + '-' + r;
        const cls = ['mb-cell'];
        if (S.used.includes(key)) cls.push('used');
        if (JP.keyOf(S.cur) === key && S.phase !== 'board') cls.push('current');
        if (!q.q && !q.spotify && !q.img) cls.push('empty');
        const icons = (q.bonus ? '★' : '') + (q.type === 'music' ? '♪' : '') + (q.type === 'image' ? '▣' : '');
        h += '<button class="' + cls.join(' ') + '" data-act="pick" data-c="' + ci + '" data-r="' + r + '" type="button">' +
          '<span>' + esc(q.value) + '</span>' + (icons ? '<i>' + icons + '</i>' : '') + '</button>';
      });
    }
    $('#miniBoard').innerHTML = h + '</div>';
  }
})();
