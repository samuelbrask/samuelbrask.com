// Fælles: gemmer quizzen og spillet i browseren (ingen database)
window.Q = (function () {
  const QK = 'jp-simple-quiz', GK = 'jp-simple-game';
  const COLORS = ['#FF4D6D', '#2EA8FF', '#2BD67B', '#FFD23F', '#A77BFF', '#FF9F1C'];
  const NAMES = ['Rødt hold', 'Blåt hold', 'Grønt hold', 'Gult hold', 'Lilla hold', 'Orange hold'];

  const blankQ = () => ({ q: '', a: '', url: '', start: 0, stop: 0 });

  function blank(cols, rows) {
    return {
      title: 'Sommerhus-Jeopardy',
      values: Array.from({ length: rows }, (_, i) => (i + 1) * 100),
      categories: Array.from({ length: cols }, (_, i) => ({
        name: 'Kategori ' + (i + 1),
        questions: Array.from({ length: rows }, () => blankQ())
      }))
    };
  }

  function fix(x) {
    if (!x || !Array.isArray(x.categories) || !x.categories.length) return blank(5, 5);
    const rows = Math.max(1, Math.min(10, (x.values || []).length || x.categories[0].questions.length || 5));
    return {
      title: String(x.title || 'Sommerhus-Jeopardy'),
      values: Array.from({ length: rows }, (_, i) => Number((x.values || [])[i]) || (i + 1) * 100),
      categories: x.categories.slice(0, 10).map((k, i) => ({
        name: String(k.name ?? 'Kategori ' + (i + 1)),
        clip: !!k.clip,
        questions: Array.from({ length: rows }, (_, r) => {
          const q = (k.questions || [])[r] || {};
          return {
            q: String(q.q || ''), a: String(q.a || ''), url: String(q.url || q.spotify || ''),
            start: Number(q.start) || 0, stop: Number(q.stop) || 0
          };
        })
      }))
    };
  }

  async function loadQuiz() {
    try { const s = JSON.parse(localStorage.getItem(QK)); if (s) return fix(s); } catch (e) {}
    try {
      const r = await fetch('quiz.json?v=' + Date.now(), { cache: 'no-store' });
      if (r.ok) return fix(await r.json());
    } catch (e) {}
    return blank(5, 5);
  }
  function saveQuiz(quiz) { localStorage.setItem(QK, JSON.stringify(quiz)); }
  function clearQuiz() { localStorage.removeItem(QK); }

  function loadGame() {
    try {
      const g = JSON.parse(localStorage.getItem(GK));
      if (g && Array.isArray(g.teams)) return g;
    } catch (e) {}
    return newGame();
  }
  function newGame(old) {
    const teams = old && old.teams && old.teams.length
      ? old.teams.map(t => ({ ...t, score: 0 }))
      : [0, 1].map(i => ({ name: NAMES[i], color: COLORS[i], score: 0 }));
    return { teams, used: {}, last: 0 };
  }
  function saveGame(g) { localStorage.setItem(GK, JSON.stringify(g)); }

  function spotifyId(url) {
    const m = String(url || '').match(/(?:track[\/:])([A-Za-z0-9]{22})/);
    return m ? m[1] : null;
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function toast(msg, ms) {
    let el = document.getElementById('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('show');
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), ms || 4000);
  }

  return { COLORS, NAMES, blank, blankQ, fix, loadQuiz, saveQuiz, clearQuiz, loadGame, newGame, saveGame, spotifyId, esc, toast };
})();
