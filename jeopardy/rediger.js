(async function () {
  const $ = s => document.querySelector(s);
  let quiz = await Q.loadQuiz();

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
    quiz.categories.forEach(k => { k.questions = Array.from({ length: rows }, (_, r) => k.questions[r] || { q: '', url: '' }); });
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
    g.style.gridTemplateColumns = `90px repeat(${quiz.categories.length}, 220px)`;
    let h = '<div class="corner">Point</div>';
    quiz.categories.forEach((k, c) => { h += `<input type="text" class="cat" data-cat="${c}" value="${Q.esc(k.name)}" aria-label="Kategori ${c + 1}">`; });
    quiz.values.forEach((v, r) => {
      h += `<input type="number" class="val" data-val="${r}" value="${v}" step="100" aria-label="Point række ${r + 1}">`;
      quiz.categories.forEach((k, c) => {
        const q = k.questions[r];
        h += `<div class="ed-cell">
          <textarea data-c="${c}" data-r="${r}" data-f="q" placeholder="Spørgsmål (valgfrit)">${Q.esc(q.q)}</textarea>
          <input type="url" data-c="${c}" data-r="${r}" data-f="url" placeholder="Spotify-link" value="${Q.esc(q.url)}">
          <span data-st="${c}-${r}">${status(q.url)}</span>
        </div>`;
      });
    });
    g.innerHTML = h;
  }

  $('#grid').addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.cat != null) quiz.categories[+t.dataset.cat].name = t.value;
    else if (t.dataset.val != null) quiz.values[+t.dataset.val] = Number(t.value) || 0;
    else if (t.dataset.f) {
      quiz.categories[+t.dataset.c].questions[+t.dataset.r][t.dataset.f] = t.value;
      if (t.dataset.f === 'url') document.querySelector(`[data-st="${t.dataset.c}-${t.dataset.r}"]`).innerHTML = status(t.value);
    }
    save();
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

  render();
})();
