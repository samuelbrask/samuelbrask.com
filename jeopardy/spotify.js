// Spotify: login med PKCE (ingen server nødvendig) + Web Playback SDK,
// så selve tavle-siden bliver en usynlig Spotify-afspiller.
window.JPSpotify = (function () {
  const CID = (window.JP_CONFIG || {}).SPOTIFY_CLIENT_ID;
  const REDIRECT = location.origin + location.pathname;
  const SCOPES = 'streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state';
  const TOK = 'jp-sp-token', VER = 'jp-sp-verifier', DEV = 'jp-sp-device';

  let player = null, browserDevice = null, status = 'off', statusMsg = '', onStatus = () => {};
  let clipTimer = null, clipLimited = false, clipRemaining = 0, clipStartedAt = 0, playing = false;

  function setStatus(s, msg) { status = s; statusMsg = msg || ''; onStatus(status, statusMsg); }

  function randomString(n) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const a = new Uint8Array(n); crypto.getRandomValues(a);
    return Array.from(a, b => chars[b % chars.length]).join('');
  }
  async function challenge(v) {
    const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v));
    return btoa(String.fromCharCode(...new Uint8Array(d))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async function login(gameCode) {
    const v = randomString(64);
    localStorage.setItem(VER, v);
    const p = new URLSearchParams({
      response_type: 'code', client_id: CID, scope: SCOPES, redirect_uri: REDIRECT,
      code_challenge_method: 'S256', code_challenge: await challenge(v), state: gameCode || ''
    });
    location.href = 'https://accounts.spotify.com/authorize?' + p.toString();
  }

  // Kaldes når Spotify sender os tilbage med ?code=...
  async function handleRedirect() {
    const q = new URLSearchParams(location.search);
    const c = q.get('code');
    if (!c && !q.get('error')) return false;
    const game = q.get('state') || '';
    if (c) {
      const r = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code', code: c, redirect_uri: REDIRECT,
          client_id: CID, code_verifier: localStorage.getItem(VER) || ''
        })
      });
      const j = await r.json();
      if (j.access_token) storeToken(j);
    }
    location.replace(REDIRECT + '?g=' + encodeURIComponent(game));
    return true;
  }

  function storeToken(j) {
    const old = readToken() || {};
    localStorage.setItem(TOK, JSON.stringify({
      access: j.access_token,
      refresh: j.refresh_token || old.refresh,
      exp: Date.now() + ((j.expires_in || 3600) - 60) * 1000
    }));
  }
  function readToken() {
    try { return JSON.parse(localStorage.getItem(TOK)); } catch (e) { return null; }
  }
  async function token() {
    const t = readToken();
    if (!t) return null;
    if (Date.now() < t.exp) return t.access;
    if (!t.refresh) return null;
    const r = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: t.refresh, client_id: CID })
    });
    const j = await r.json();
    if (!j.access_token) { localStorage.removeItem(TOK); setStatus('off'); return null; }
    storeToken(j);
    return j.access_token;
  }

  async function api(method, path, body) {
    const tk = await token();
    if (!tk) throw new Error('Spotify er ikke forbundet');
    const r = await fetch('https://api.spotify.com/v1' + path, {
      method,
      headers: { Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    if (r.status === 204 || r.status === 202) return null;
    const txt = await r.text();
    if (!r.ok) {
      let msg = txt;
      try { msg = JSON.parse(txt).error.message; } catch (e) { /* tekst */ }
      throw new Error('Spotify ' + r.status + ': ' + msg);
    }
    return txt ? JSON.parse(txt) : null;
  }

  function init(cb) {
    onStatus = cb || onStatus;
    if (!CID || /^DI[NT]-/.test(CID)) { setStatus('nocfg', 'Spotify Client ID mangler i config.js'); return; }
    if (!readToken()) { setStatus('off'); return; }
    setStatus('connecting');
    if (window.Spotify) { createPlayer(); return; }
    window.onSpotifyWebPlaybackSDKReady = createPlayer;
    const s = document.createElement('script');
    s.src = 'https://sdk.scdn.co/spotify-player.js';
    document.head.appendChild(s);
  }

  function createPlayer() {
    player = new window.Spotify.Player({
      name: 'Quiz-tavle',
      getOAuthToken: cb => { token().then(t => cb(t || '')); },
      volume: 0.9
    });
    player.addListener('ready', ({ device_id }) => { browserDevice = device_id; setStatus('ready'); });
    player.addListener('not_ready', () => setStatus('connecting', 'Genforbinder…'));
    player.addListener('initialization_error', e => setStatus('error', 'Browseren kan ikke afspille: ' + e.message));
    player.addListener('authentication_error', () => setStatus('error', 'Log ind på Spotify igen'));
    player.addListener('account_error', () => setStatus('error', 'Kræver Spotify Premium'));
    player.addListener('autoplay_failed', () => setStatus('error', 'Klik på tavlen, så browseren må spille lyd'));
    player.connect();
  }

  function activate() { try { if (player && player.activateElement) player.activateElement(); } catch (e) { /* ok */ } }

  // Valgt afspilningsenhed: tom = denne browser
  function targetDevice() { return localStorage.getItem(DEV) || browserDevice || ''; }
  function setTarget(id) { if (id) localStorage.setItem(DEV, id); else localStorage.removeItem(DEV); }
  function devQ() { const d = targetDevice(); return d ? '?device_id=' + encodeURIComponent(d) : ''; }

  async function devices() {
    const j = await api('GET', '/me/player/devices');
    return (j && j.devices) || [];
  }

  function armClip() {
    clearTimeout(clipTimer);
    clipStartedAt = Date.now();
    if (clipLimited) clipTimer = setTimeout(() => { pause(); clipRemaining = 0; }, clipRemaining);
  }

  async function play(trackId, startSec, lenSec) {
    clearTimeout(clipTimer);
    await api('PUT', '/me/player/play' + devQ(), {
      uris: ['spotify:track:' + trackId],
      position_ms: Math.max(0, Math.round((Number(startSec) || 0) * 1000))
    });
    playing = true;
    clipLimited = Number(lenSec) > 0;
    clipRemaining = clipLimited ? Number(lenSec) * 1000 : 0;
    armClip();
  }
  async function pause() {
    if (playing && clipLimited) clipRemaining -= Date.now() - clipStartedAt;
    clearTimeout(clipTimer);
    if (!playing) return;
    playing = false;
    try { await api('PUT', '/me/player/pause' + devQ()); } catch (e) { /* allerede stoppet */ }
  }
  async function resume() {
    if (playing) return;
    if (clipLimited && clipRemaining <= 0) return; // klippet er spillet færdigt
    await api('PUT', '/me/player/play' + devQ());
    playing = true;
    armClip();
  }
  async function stop() {
    clipRemaining = 0;
    await pause();
  }
  function logout() {
    localStorage.removeItem(TOK);
    localStorage.removeItem(DEV);
    try { if (player) player.disconnect(); } catch (e) { /* ok */ }
    player = null; browserDevice = null;
    setStatus('off');
  }

  return {
    init, login, handleRedirect, activate, devices, play, pause, resume, stop, logout,
    setTarget, targetDevice,
    get browserDevice() { return browserDevice; },
    get status() { return status; },
    get playing() { return playing; },
    get loggedIn() { return !!readToken(); }
  };
})();
