(async function () {
  const $ = s => document.querySelector(s);
  const { sb, code, esc } = JP;
  const LS = 'jp-team-' + code;

  let C, S, teams = [], me = null;
  let penaltyUntil = 0, pending = false, sentRound = -1;
  let cdEnd = 0, lastBuzzKey = '', flashT = null, wakeLock = null;

  if (!code) { document.body.innerHTML = '<p class="phone-msg">Scan QR-koden på tv\'et igen – koden mangler i linket.</p>'; return; }

  try {
    const g = await JP.loadGame();
    if (!g) throw new Error('Spillet findes ikke. Scan QR-koden igen.');
    C = g.config; S = g.state;
    teams = await JP.loadTeams();
  } catch (e) { document.body.innerHTML = '<p class="phone-msg">' + esc(e.message) + '</p>'; return; }

  me = JP.teamById(teams, localStorage.getItem(LS));

  JP.subscribe({
    onGame: r => { C = r.config; S = r.state; render(); },
    onTeams: async () => { await refreshTeams(); }
  });
  // Telefoner sover og mister forbindelsen – hent tilstand jævnligt og når skærmen tændes igen
  async function refreshState() {
    const { data } = await sb.from('jp_games').select('state').eq('code', code).maybeSingle();
    if (data) { S = JP.normState(data.state); render(); }
  }
  async function refreshTeams() {
    teams = await JP.loadTeams();
    const id = localStorage.getItem(LS);
    me = JP.teamById(teams, id);
    if (id && !me) localStorage.removeItem(LS);
    render();
  }
  setInterval(refreshState, 2500);
  setInterval(refreshTeams, 7000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { refreshState(); refreshTeams(); keepAwake(); }
  });
  setInterval(tickCountdown, 200);

  // ---------- tilmelding ----------

  function renderJoin() {
    $('#join').hidden = false; $('#play').hidden = true;
    $('#joinTitle').textContent = C.title;
    const taken = teams.map(t => t.color);
    const box = $('#swatches');
    const prev = (box.querySelector('input:checked') || {}).value;
    box.innerHTML = JP.COLORS.map((c, i) => {
      const dis = taken.includes(c.hex);
      return '<label class="sw' + (dis ? ' taken' : '') + '" style="--team:' + c.hex + '">' +
        '<input type="radio" name="color" value="' + c.hex + '"' + (dis ? ' disabled' : '') + '>' +
        '<span>' + c.name + '</span></label>';
    }).join('');
    const pick = box.querySelector('input[value="' + prev + '"]:not(:disabled)') || box.querySelector('input:not(:disabled)');
    if (pick) pick.checked = true;
  }

  $('#joinForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('#teamName').value.trim();
    const color = (document.querySelector('input[name="color"]:checked') || {}).value || JP.COLORS[0].hex;
    if (!name) return;
    const { data, error } = await sb.from('jp_teams').insert({ game_code: code, name: name, color: color }).select().single();
    if (error) { JP.toast('Holdet blev ikke oprettet: ' + error.message); return; }
    localStorage.setItem(LS, data.id);
    me = data;
    keepAwake();
    await refreshTeams();
  });

  $('#leave').addEventListener('click', () => {
    if (!confirm('Forlad holdet på denne telefon? Holdet og dets point bliver i spillet.')) return;
    localStorage.removeItem(LS); me = null; render();
  });

  async function keepAwake() {
    try { if ('wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } }
    catch (e) { /* ikke understøttet */ }
  }

  // ---------- summer ----------

  $('#buzz').addEventListener('pointerdown', async e => {
    e.preventDefault();
    keepAwake();
    if (!me || !S || S.phase !== 'question' || S.splash || S.dd || S.buzz) return;
    if (S.locked.includes(me.id)) return;
    if (Date.now() < penaltyUntil) return;
    if (!S.open) {
      penaltyUntil = Date.now() + 1000;
      flash('For tidligt! Vent et sekund.');
      render();
      setTimeout(render, 1050);
      return;
    }
    if (pending || sentRound === S.round) return;
    pending = true;
    const round = S.round;
    $('#bzSmall').textContent = 'Sender…';
    const { error } = await sb.from('jp_buzzes').insert({ game_code: code, round: round, team_id: me.id });
    pending = false;
    if (error) {
      if (error.code === '23505') flash('Et andet hold var hurtigere');
      else flash('Trykket kom ikke igennem: ' + error.message);
    } else {
      sentRound = round;
      if (navigator.vibrate) navigator.vibrate(120);
    }
    render();
  });

  function flash(msg) {
    const el = $('#flash');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(flashT);
    flashT = setTimeout(() => el.classList.remove('show'), 1800);
  }

  // ---------- visning ----------

  function render() {
    if (!me) return renderJoin();
    $('#join').hidden = true; $('#play').hidden = false;
    const fresh = JP.teamById(teams, me.id) || me;
    me = fresh;
    document.body.style.setProperty('--team', me.color);
    document.body.style.setProperty('--team-ink', JP.inkFor(me.color));
    $('#phName').textContent = me.name;
    $('#phScore').textContent = me.score + ' point';

    let state = 'wait', big = '', small = '';
    const ph = S.phase;
    const other = id => { const t = JP.teamById(teams, id); return t ? t.name : 'Et hold'; };

    if (ph === 'lobby') { big = 'I er med'; small = 'Kig på tv\'et. Spillet starter snart.'; }
    else if (ph === 'board') { big = 'Klar'; small = S.control === me.id ? 'I vælger næste spørgsmål' : 'Næste spørgsmål bliver valgt'; }
    else if (ph === 'reveal') { big = S.winner === me.id ? 'Point!' : 'Svaret'; small = 'Kig på tv\'et'; if (S.winner === me.id) state = 'mine'; }
    else if (ph === 'end') { big = 'Slut'; small = 'I sluttede med ' + me.score + ' point'; }
    else if (ph === 'question') {
      if (S.splash) { big = 'Bonus'; small = 'Kig på tv\'et'; }
      else if (S.dd) {
        if (S.dd.team === me.id) { state = 'mine'; big = 'I svarer'; small = 'Indsats: ' + S.dd.wager; }
        else { state = 'other'; big = other(S.dd.team); small = 'svarer på bonus'; }
      }
      else if (S.buzz) {
        if (S.buzz.team === me.id) { state = 'mine'; big = 'Svar nu!'; small = ''; }
        else { state = 'other'; big = other(S.buzz.team); small = 'svarer'; }
      }
      else if (S.locked.includes(me.id)) { state = 'out'; big = 'I er ude'; small = 'Vent på næste spørgsmål'; }
      else if (sentRound === S.round && S.open) { state = 'mine'; big = 'I var først!'; small = 'Vent på værten'; }
      else if (Date.now() < penaltyUntil) { state = 'out'; big = 'Vent…'; small = 'I trykkede for tidligt'; }
      else if (S.open) { state = 'go'; big = 'Tryk!'; small = ''; }
      else { state = 'ready'; big = 'Lyt'; small = 'Tryk først, når værten åbner'; }
    }

    const key = ph === 'question' && S.buzz && S.buzz.team === me.id ? S.buzz.round + '' : '';
    if (key && key !== lastBuzzKey) cdEnd = Date.now() + (Number(C.settings.seconds) || 10) * 1000;
    if (!key) cdEnd = 0;
    lastBuzzKey = key;

    const btn = $('#buzz');
    btn.className = 'buzz-btn ' + state;
    $('#bzBig').textContent = big;
    if (!cdEnd) $('#bzSmall').textContent = small;
    tickCountdown();
  }

  function tickCountdown() {
    if (!cdEnd) return;
    const left = Math.max(0, cdEnd - Date.now());
    $('#bzSmall').textContent = left > 0 ? Math.ceil(left / 1000) + ' sekunder' : 'Tiden er gået';
  }

  render();
})();
