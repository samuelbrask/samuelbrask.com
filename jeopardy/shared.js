(function () {
  const cfg = window.JP_CONFIG || {};
  const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    realtime: { params: { eventsPerSecond: 20 } }
  });
  const qs = new URLSearchParams(location.search);
  const code = (qs.get('g') || '').trim().toUpperCase();

  const COLORS = [
    { hex: '#FF4D6D', name: 'Hindbær' },
    { hex: '#FF9F1C', name: 'Appelsin' },
    { hex: '#FFE45E', name: 'Citron' },
    { hex: '#7BD389', name: 'Græs' },
    { hex: '#2EC4B6', name: 'Hav' },
    { hex: '#5BC0EB', name: 'Himmel' },
    { hex: '#B388FF', name: 'Lavendel' },
    { hex: '#F15BB5', name: 'Bubblegum' }
  ];

  function blankQuestion(value) {
    return { value: value, type: 'text', q: '', a: '', img: '', spotify: '', start: 0, len: null, bonus: false };
  }
  function blankCategory(name, rows, step) {
    return { name: name, questions: Array.from({ length: rows }, (_, r) => blankQuestion((r + 1) * step)) };
  }
  function defaultConfig() {
    return {
      title: 'Sommerhus-Jeopardy',
      settings: { minus: false, seconds: 10, bonusMode: 'double', autoTimeout: true, clip: 30, step: 100 },
      categories: Array.from({ length: 6 }, (_, i) => blankCategory('Kategori ' + (i + 1), 5, 100))
    };
  }
  function defaultState() {
    return {
      phase: 'lobby', cur: null, round: 0, open: false, locked: [], buzz: null, used: [],
      control: null, splash: false, dd: null, winner: null, music: { cmd: null, n: 0 }
    };
  }
  function normState(s) {
    const st = Object.assign(defaultState(), s || {});
    if (!Array.isArray(st.locked)) st.locked = [];
    if (!Array.isArray(st.used)) st.used = [];
    if (!st.music) st.music = { cmd: null, n: 0 };
    return st;
  }
  function normConfig(c) {
    const d = defaultConfig();
    if (!c || !Array.isArray(c.categories) || !c.categories.length) return d;
    c.title = c.title || d.title;
    c.settings = Object.assign({}, d.settings, c.settings || {});
    const rows = Math.max(1, ...c.categories.map(cat => (cat.questions || []).length));
    c.categories.forEach(cat => {
      cat.name = cat.name || '';
      const qsx = (cat.questions || []).map(q => Object.assign(blankQuestion(0), q || {}));
      while (qsx.length < rows) qsx.push(blankQuestion((qsx.length + 1) * c.settings.step));
      cat.questions = qsx;
    });
    return c;
  }

  async function loadGame() {
    const { data, error } = await sb.from('jp_games').select('*').eq('code', code).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    data.config = normConfig(data.config);
    data.state = normState(data.state);
    return data;
  }
  async function loadTeams() {
    const { data, error } = await sb.from('jp_teams').select('*').eq('game_code', code).order('created_at');
    if (error) throw error;
    return data || [];
  }

  function subscribe(h) {
    const ch = sb.channel('jp-' + code + '-' + Math.random().toString(36).slice(2, 8));
    if (h.onGame) {
      ch.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'jp_games', filter: 'code=eq.' + code }, p => {
        const r = p.new;
        r.config = normConfig(r.config);
        r.state = normState(r.state);
        h.onGame(r);
      });
    }
    if (h.onTeams) {
      ch.on('postgres_changes', { event: '*', schema: 'public', table: 'jp_teams' }, () => h.onTeams());
    }
    if (h.onBuzz) {
      ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'jp_buzzes', filter: 'game_code=eq.' + code }, p => h.onBuzz(p.new));
    }
    ch.subscribe(st => { if (h.onStatus) h.onStatus(st); });
    return ch;
  }

  function qAt(config, cur) {
    if (!cur) return null;
    const c = config.categories[cur.c];
    return c ? (c.questions[cur.q] || null) : null;
  }
  function valueAt(config, cur) {
    const q = qAt(config, cur);
    if (!q) return 0;
    const v = Number(q.value) || 0;
    return (q.bonus && config.settings.bonusMode === 'double') ? v * 2 : v;
  }
  function keyOf(cur) { return cur ? cur.c + '-' + cur.q : ''; }
  function teamById(teams, id) { return teams.find(t => t.id === id) || null; }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }
  function spotifyId(u) {
    const m = String(u || '').match(/track[\/:]([A-Za-z0-9]{22})/);
    return m ? m[1] : null;
  }
  function fmtTime(sec) {
    sec = Math.max(0, Math.round(Number(sec) || 0));
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  }
  function parseTime(str) {
    str = String(str == null ? '' : str).trim();
    if (!str) return 0;
    if (str.includes(':')) {
      const [m, s] = str.split(':');
      return (parseInt(m, 10) || 0) * 60 + (parseFloat(s) || 0);
    }
    return parseFloat(str) || 0;
  }
  // Mørk eller lys tekst oven på en holdfarve
  function inkFor(hex) {
    const h = String(hex || '#888888').replace('#', '');
    const r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.62 ? '#08103A' : '#FFFFFF';
  }

  let actx = null;
  function unlockAudio() {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
    } catch (e) { /* ingen lyd */ }
  }
  function tone(freq, dur, type, vol, when) {
    if (!actx) return;
    dur = dur || 0.18; type = type || 'square'; vol = vol || 0.12; when = when || 0;
    const t0 = actx.currentTime + when;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(actx.destination);
    o.start(t0); o.stop(t0 + dur + 0.03);
  }

  function toast(msg, ms) {
    let el = document.getElementById('jp-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'jp-toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), ms || 3200);
  }

  function pageUrl(file) {
    return new URL(file + '?g=' + encodeURIComponent(code), location.href).href;
  }

  window.JP = {
    sb, code, COLORS, blankQuestion, blankCategory, defaultConfig, defaultState, normState, normConfig,
    loadGame, loadTeams, subscribe, qAt, valueAt, keyOf, teamById, esc, spotifyId, fmtTime, parseTime,
    inkFor, unlockAudio, tone, toast, pageUrl
  };
})();
