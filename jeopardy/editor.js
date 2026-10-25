(async function () {
  const $ = s => document.querySelector(s);
  const { sb, code, esc } = JP;
  let C, saveT = null, editing = null;

  if (!code) { location.href = './'; return; }
  $('#lnkHost').href = JP.pageUrl('vaert.html');
  $('#lnkBoard').href = JP.pageUrl('tavle.html');

  try {
    const g = await JP.loadGame();
    if (!g) throw new Error('Der findes ikke et spil med koden ' + code + '.');
    C = g.config;
  } catch (e) { $('#grid').innerHTML = '<p class="hint">' + esc(e.message) + '</p>'; return; }

  // ---------- gem ----------

  function changed() {
    $('#saveState').textContent = 'Gemmer…';
    clearTimeout(saveT);
    saveT = setTimeout(saveNow, 700);
  }
  async function saveNow() {
    const { error } = await sb.from('jp_games').update({ config: C, title: C.title, updated_at: new Date().toISOString() }).eq('code', code);
    $('#saveState').textContent = error ? 'Ikke gemt: ' + error.message : 'Gemt';
  }
  window.addEventListener('beforeunload', e => { if (saveT && $('#saveState').textContent === 'Gemmer…') { e.preventDefault(); e.returnValue = ''; } });

  // ---------- indstillinger ----------

  const set = C.settings;
  $('#title').value = C.title;
  $('#catCount').innerHTML = [4, 5, 6, 7, 8].map(n => '<option>' + n + '</option>').join('');
  $('#rowCount').innerHTML = [3, 4, 5, 6, 7].map(n => '<option>' + n + '</option>').join('');
  function fillSettings() {
    $('#catCount').value = C.categories.length;
    $('#rowCount').value = C.categories[0].questions.length;
    $('#step').value = set.step; $('#seconds').value = set.seconds; $('#clip').value = set.clip;
    $('#bonusMode').value = set.bonusMode; $('#minus').checked = !!set.minus; $('#autoTimeout').checked = !!set.autoTimeout;
  }
  fillSettings();

  $('#title').addEventListener('input', e => { C.title = e.target.value; changed(); });
  ['step', 'seconds', 'clip'].forEach(id => $('#' + id).addEventListener('change', e => { set[id] = Math.max(0, parseInt(e.target.value, 10) || 0); changed(); }));
  $('#bonusMode').addEventListener('change', e => { set.bonusMode = e.target.value; changed(); });
  $('#minus').addEventListener('change', e => { set.minus = e.target.checked; changed(); });
  $('#autoTimeout').addEventListener('change', e => { set.autoTimeout = e.target.checked; changed(); });

  function hasContent(q) { return !!(q.q || q.a || q.spotify || q.img); }

  $('#catCount').addEventListener('change', e => {
    const n = +e.target.value, rows = C.categories[0].questions.length;
    const removed = C.categories.slice(n);
    if (removed.some(c => c.questions.some(hasContent)) &&
        !confirm('De sidste kategorier har spørgsmål, som bliver slettet. Fortsæt?')) { fillSettings(); return; }
    C.categories = C.categories.slice(0, n);
    while (C.categories.length < n) C.categories.push(JP.blankCategory('Kategori ' + (C.categories.length + 1), rows, set.step));
    changed(); renderGrid();
  });
  $('#rowCount').addEventListener('change', e => {
    const n = +e.target.value;
    if (C.categories.some(c => c.questions.slice(n).some(hasContent)) &&
        !confirm('De nederste spørgsmål bliver slettet. Fortsæt?')) { fillSettings(); return; }
    C.categories.forEach(c => {
      c.questions = c.questions.slice(0, n);
      while (c.questions.length < n) c.questions.push(JP.blankQuestion((c.questions.length + 1) * set.step));
    });
    changed(); renderGrid();
  });
  $('#applyValues').addEventListener('click', () => {
    C.categories.forEach(c => c.questions.forEach((q, r) => { q.value = (r + 1) * set.step; }));
    changed(); renderGrid();
  });

  // ---------- gitter ----------

  function renderGrid() {
    const cats = C.categories, rows = cats[0].questions.length;
    let h = '<div class="ed-cols" style="--cols:' + cats.length + '">';
    cats.forEach((c, ci) => {
      h += '<div class="ed-col"><input class="cat-input" data-ci="' + ci + '" value="' + esc(c.name) + '" aria-label="Kategori ' + (ci + 1) + '">';
      for (let r = 0; r < rows; r++) {
        const q = c.questions[r];
        const icons = (q.bonus ? '★ ' : '') + (q.type === 'music' ? '♪ ' : '') + (q.type === 'image' ? '▣ ' : '');
        const warn = q.type === 'music' && !JP.spotifyId(q.spotify);
        h += '<button class="ed-cell' + (hasContent(q) ? '' : ' empty') + (warn ? ' warn' : '') + '" data-ci="' + ci + '" data-r="' + r + '" type="button">' +
          '<span class="ec-val">' + esc(q.value) + ' <i>' + icons + '</i></span>' +
          '<span class="ec-q">' + (q.q ? esc(q.q) : 'Tomt – klik for at skrive') + '</span>' +
          (q.a ? '<span class="ec-a">' + esc(q.a) + '</span>' : '') +
          '</button>';
      }
      h += '</div>';
    });
    $('#grid').innerHTML = h + '</div>';
  }
  renderGrid();

  $('#grid').addEventListener('input', e => {
    if (e.target.classList.contains('cat-input')) { C.categories[+e.target.dataset.ci].name = e.target.value; changed(); }
  });
  $('#grid').addEventListener('click', e => {
    const b = e.target.closest('.ed-cell');
    if (b) openQuestion(+b.dataset.ci, +b.dataset.r);
  });

  // ---------- spørgsmålsdialog ----------

  const dlg = $('#qDialog');
  function setType(t) {
    dlg.querySelectorAll('input[name="type"]').forEach(i => { i.checked = i.value === t; });
    dlg.dataset.type = t;
  }
  dlg.querySelectorAll('input[name="type"]').forEach(i => i.addEventListener('change', () => setType(i.value)));

  function openQuestion(ci, r) {
    editing = { ci, r };
    const q = C.categories[ci].questions[r];
    $('#qHead').textContent = (C.categories[ci].name || 'Kategori ' + (ci + 1)) + ' – ' + q.value;
    setType(q.type || 'text');
    $('#fQ').value = q.q || ''; $('#fA').value = q.a || ''; $('#fImg').value = q.img || '';
    $('#fSp').value = q.spotify || ''; $('#fStart').value = q.start ? JP.fmtTime(q.start) : '';
    $('#fLen').value = q.len == null ? '' : q.len;
    $('#fVal').value = q.value; $('#fBonus').checked = !!q.bonus;
    dlg.showModal();
    $('#fQ').focus();
  }
  dlg.addEventListener('close', () => {
    if (dlg.returnValue !== 'save' || !editing) return;
    const q = C.categories[editing.ci].questions[editing.r];
    q.type = dlg.dataset.type || 'text';
    q.q = $('#fQ').value.trim(); q.a = $('#fA').value.trim(); q.img = $('#fImg').value.trim();
    q.spotify = $('#fSp').value.trim(); q.start = JP.parseTime($('#fStart').value);
    q.len = $('#fLen').value === '' ? null : Math.max(0, parseInt($('#fLen').value, 10) || 0);
    q.value = Math.max(0, parseInt($('#fVal').value, 10) || 0); q.bonus = $('#fBonus').checked;
    if (q.type === 'music' && q.spotify && !JP.spotifyId(q.spotify)) JP.toast('Spotify-linket ligner ikke et nummer. Brug Del → Kopiér link til sang.', 5000);
    editing = null;
    changed(); renderGrid();
  });

  // ---------- import/eksport ----------

  const pd = $('#pasteDialog');
  $('#pasteBtn').addEventListener('click', () => { $('#pasteText').value = ''; pd.showModal(); });
  pd.addEventListener('close', () => {
    if (pd.returnValue !== 'ok') return;
    let raw = $('#pasteText').value.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    try {
      const j = JSON.parse(raw);
      const cats = Array.isArray(j) ? j : j.categories;
      if (!Array.isArray(cats) || !cats.length) throw new Error('Der er ingen "categories" i teksten.');
      if (cats.length > 8) throw new Error('Højst 8 kategorier.');
      const merged = JP.normConfig({ title: (!Array.isArray(j) && j.title) || C.title, settings: Object.assign({}, set, (!Array.isArray(j) && j.settings) || {}), categories: cats });
      C.title = merged.title; Object.assign(set, merged.settings); C.categories = merged.categories;
      $('#title').value = C.title;
      fillSettings(); renderGrid(); changed();
      JP.toast('Spørgsmålene er indsat');
    } catch (e) { JP.toast('Kunne ikke læse JSON: ' + e.message, 6000); }
  });
  $('#exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(C, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (C.title || 'quiz').replace(/[^\wæøåÆØÅ-]+/g, '-') + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
})();
