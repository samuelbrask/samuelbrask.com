(async function () {
  const $ = s => document.querySelector(s);
  let quiz = await Q.loadQuiz();
  const fmt = ms => { const s = Math.max(0, ms) / 1000; return Math.floor(s / 60) + ':' + (s % 60).toFixed(1).padStart(4, '0'); };
  const r1 = n => Math.round(n * 10) / 10;

  function opts(sel, n) { $(sel).innerHTML = Array.from({ length: 8 }, (_, i) => i + 1).map(v => `<option${v === n ? ' selected' : ''}>${v}</option>`).join(''); }

  let savedT;
  function save() {
    Q.saveQuiz(quiz);
    $('#saved').textContent = 'Gemt ✓';
    clearTimeout(savedT); savedT = setTimeout(() => ($('#saved').textContent = ''), 1500);
  }

  function resize(cols, rows) {
    while (quiz.categories.length < cols) quiz.categories.push({ name: 'Kategori ' + (quiz.categories.length + 1), questions: [] });
    quiz.categories.length = cols;
    quiz.values = Array.from({ length: rows }, (_, i) => quiz.values[i] ?? (i + 1) * 100);
    quiz.categories.forEach(k => { k.questions = Array.from({ length: rows }, (_, r) => k.questions[r] || Q.blankQ()); });
    save(); render();
  }

  function status(url) {
    if (!url.trim()) return '<span class="st">Intet link</span>';
    return Q.spotifyId(url) ? '<span class="st ok">♪ Link OK</span>' : '<span class="st bad">Ikke et link til en sang</span>';
  }

  function render() {
    $('#title').value = quiz.title;
    opts('#cols', quiz.categories.length);
    opts('#rows', quiz.values.length);
    const g = $('#grid');
    g.style.gridTemplateColumns = `90px repeat(${quiz.categories.length}, 250px)`;
    let h = '<div class="corner">Point</div>';
    quiz.categories.forEach((k, c) => {
      h += `<div class="cat-head">
        <input type="text" class="cat" data-cat="${c}" value="${Q.esc(k.name)}" aria-label="Kategori ${c + 1}">
        <label class="clip-toggle"><input type="checkbox" data-clip="${c}"${k.clip ? ' checked' : ''}> Stop musikken automatisk</label>
      </div>`;
    });
    quiz.values.forEach((v, r) => {
      h += `<input type="number" class="val" data-val="${r}" value="${v}" step="100" aria-label="Point række ${r + 1}">`;
      quiz.categories.forEach((k, c) => {
        const q = k.questions[r];
        const at = `data-c="${c}" data-r="${r}"`;
        h += `<div class="ed-cell">
          <textarea ${at} data-f="q" placeholder="Spørgsmål (valgfrit)">${Q.esc(q.q)}</textarea>
          <input type="text" ${at} data-f="a" placeholder="Svar" value="${Q.esc(q.a)}">
          <div class="url-row">
            <input type="url" ${at} data-f="url" placeholder="Spotify-link" value="${Q.esc(q.url)}">
            <button class="btn ghost ic" ${at} data-act="search" type="button" title="Søg i Spotify" aria-label="Søg i Spotify">🔍</button>
          </div>
          <div class="st-row">
            <button class="btn ghost ic" ${at} data-act="play" type="button" title="Afprøv" aria-label="Afprøv">▶</button>
            <span data-st="${c}-${r}">${status(q.url)}</span>
          </div>
          <div class="tm-row"${k.clip ? '' : ' hidden'}>
            <label>Start <input type="number" ${at} data-f="start" min="0" step="0.1" value="${q.start || 0}"></label>
            <label>Stop <input type="number" ${at} data-f="stop" min="0" step="0.1" value="${q.stop || 0}"></label>
          </div>
        </div>`;
      });
    });
    g.innerHTML = h;
  }

  const qAt = (c, r) => quiz.categories[c].questions[r];
  function setField(c, r, f, v) {
    const el = document.querySelector(`[data-c="${c}"][data-r="${r}"][data-f="${f}"]`);
    if (el) el.value = v;
  }

  $('#grid').addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.cat != null) quiz.categories[+t.dataset.cat].name = t.value;
    else if (t.dataset.val != null) quiz.values[+t.dataset.val] = Number(t.value) || 0;
    else if (t.dataset.f) {
      const q = qAt(+t.dataset.c, +t.dataset.r);
      q[t.dataset.f] = (t.dataset.f === 'start' || t.dataset.f === 'stop') ? (Number(t.value) || 0) : t.value;
      if (t.dataset.f === 'url') document.querySelector(`[data-st="${t.dataset.c}-${t.dataset.r}"]`).innerHTML = status(t.value);
    }
    save();
  });
  $('#grid').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const c = +b.dataset.c, r = +b.dataset.r;
    if (b.dataset.act === 'search') openSearch(c, r);
    if (b.dataset.act === 'play') preview(c, r);
  });
  $('#grid').addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.clip == null) return;
    quiz.categories[+t.dataset.clip].clip = t.checked;
    save(); render();
  });
  $('#title').addEventListener('input', e => { quiz.title = e.target.value; save(); });
  $('#cols').addEventListener('change', e => resize(+e.target.value, quiz.values.length));
  $('#rows').addEventListener('change', e => resize(quiz.categories.length, +e.target.value));

  $('#btnExport').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(quiz, null, 2)], { type: 'application/json' }));
    a.download = 'quiz.json'; a.click();
  });
  $('#btnImport').addEventListener('click', () => {
    const raw = prompt('Indsæt quizzen (JSON). Den erstatter den nuværende quiz.');
    if (!raw) return;
    try { quiz = Q.fix(JSON.parse(raw.replace(/```json|```/g, '').trim())); save(); render(); Q.toast('Quizzen er indlæst'); }
    catch (e) { Q.toast('Det kunne ikke læses. Kopiér hele teksten og prøv igen.'); }
  });

  /* ---------- Spotify ---------- */
  function needLogin() {
    if (JPSpotify.loggedIn) return false;
    Q.toast('Log ind på Spotify på tavlen først (♪ øverst til højre), og kom så tilbage hertil.', 6000);
    return true;
  }
  JPSpotify.init(st => {
    const t = { ready: 'Spotify: klar ✓', connecting: 'Spotify: forbinder…', off: 'Spotify: log ind på tavlen', nocfg: 'Spotify: mangler Client ID', error: 'Spotify: fejl' };
    $('#spMini').textContent = t[st] || '';
    $('#spMini').dataset.status = st;
  });
  document.addEventListener('click', () => JPSpotify.activate());

  /* Afprøv + sæt start/stop */
  let pv = null, pvTick = null;
  async function preview(c, r) {
    if (needLogin()) return;
    const q = qAt(c, r), id = Q.spotifyId(q.url);
    if (!id) { Q.toast('Feltet har ikke et gyldigt Spotify-link.'); return; }
    JPSpotify.activate();
    pv = { c, r };
    $('#pvWhat').textContent = quiz.categories[c].name + ' – ' + quiz.values[r];
    $('#pvBar').hidden = false;
    const clip = quiz.categories[c].clip;
    $('#pvStart').hidden = $('#pvStop').hidden = !clip;
    try { await JPSpotify.play(id, clip ? q.start : 0, clip ? q.stop : 0); }
    catch (e) { Q.toast(e.message, 8000); }
    pvRender();
  }
  function pvRender() {
    $('#pvPause').textContent = JPSpotify.playing ? 'Pause' : 'Afspil';
    clearInterval(pvTick);
    pvTick = setInterval(() => {
      $('#pvTime').textContent = fmt(JPSpotify.position);
      $('#pvPause').textContent = JPSpotify.playing ? 'Pause' : 'Afspil';
    }, 100);
  }
  JPSpotify.onClipEnd(() => { Q.toast('Klippet stoppede ved ' + fmt(JPSpotify.position)); });

  $('#pvStart').addEventListener('click', () => {
    if (!pv) return;
    const v = r1(JPSpotify.position / 1000);
    qAt(pv.c, pv.r).start = v; setField(pv.c, pv.r, 'start', v); save();
    Q.toast('Start sat til ' + v + ' sek');
  });
  $('#pvStop').addEventListener('click', async () => {
    if (!pv) return;
    const v = r1(JPSpotify.position / 1000);
    await JPSpotify.stop();
    qAt(pv.c, pv.r).stop = v; setField(pv.c, pv.r, 'stop', v); save();
    Q.toast('Stop sat til ' + v + ' sek. Tryk ▶ for at høre klippet.');
  });
  $('#pvPause').addEventListener('click', async () => {
    if (!pv) return;
    if (JPSpotify.playing) await JPSpotify.pause();
    else if (!(await JPSpotify.resume())) preview(pv.c, pv.r);
  });
  $('#pvClose').addEventListener('click', async () => {
    await JPSpotify.stop(); clearInterval(pvTick); pv = null; $('#pvBar').hidden = true;
  });

  /* Søg i Spotify */
  let sTarget = null, sTimer = null;
  function openSearch(c, r) {
    if (needLogin()) return;
    sTarget = { c, r };
    $('#sQ').value = quiz.categories[c].questions[r].a || '';
    $('#sList').innerHTML = ''; $('#sMsg').textContent = 'Skriv kunstner og sangtitel.';
    $('#sDlg').showModal(); $('#sQ').focus();
    if ($('#sQ').value) search();
  }
  $('#sClose').addEventListener('click', () => $('#sDlg').close());
  $('#sQ').addEventListener('input', () => { clearTimeout(sTimer); sTimer = setTimeout(search, 350); });
  async function search() {
    const term = $('#sQ').value.trim();
    if (term.length < 2) return;
    $('#sMsg').textContent = 'Søger…';
    try {
      const j = await JPSpotify.api('GET', '/search?type=track&limit=10&market=DK&q=' + encodeURIComponent(term));
      const items = (j && j.tracks && j.tracks.items) || [];
      $('#sMsg').textContent = items.length ? 'Klik på den rigtige sang:' : 'Ingen sange fundet. Prøv andre ord.';
      $('#sList').innerHTML = items.map(t => `<li><button type="button" data-id="${t.id}">
        <strong>${Q.esc(t.name)}</strong><span>${Q.esc(t.artists.map(a => a.name).join(', '))} · ${Q.esc((t.album.release_date || '').slice(0, 4))} · ${Q.esc(t.album.name)}</span>
      </button></li>`).join('');
    } catch (e) { $('#sMsg').textContent = e.message; }
  }
  $('#sList').addEventListener('click', e => {
    const b = e.target.closest('button[data-id]'); if (!b || !sTarget) return;
    const url = 'https://open.spotify.com/track/' + b.dataset.id;
    const { c, r } = sTarget;
    qAt(c, r).url = url; setField(c, r, 'url', url);
    document.querySelector(`[data-st="${c}-${r}"]`).innerHTML = status(url);
    save(); $('#sDlg').close();
  });

  render();
})();
