// Full-screen voice mode: wavy bars that follow your voice level, live transcript.
// On the phone, speech recognition runs inside the app (Android SpeechRecognizer);
// the native shell reports events through SB.vr(event, value).
const VOICE = { el: null, state: 'idle', amp: .35, text: '', rec: null, sim: 0, done: false };
const isWebView = () => /; wv\)/.test(navigator.userAgent);
const WV_COLORS = [[110, 140, 255], [150, 110, 250], [236, 120, 200], [255, 160, 120], [90, 210, 190], [110, 170, 255]];

function voiceBars() {
  const n = 34, out = [];
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1), env = Math.sin(Math.PI * x), wave = .55 + .45 * Math.abs(Math.sin(i * .62));
    const h = Math.round(26 + 196 * env * wave);
    const seg = x * (WV_COLORS.length - 1), k = Math.min(WV_COLORS.length - 2, Math.floor(seg)), f = seg - k;
    const c = WV_COLORS[k].map((v, j) => Math.round(v + (WV_COLORS[k + 1][j] - v) * f)).join(',');
    out.push(`<span class="wvcol"><i class="wvbar" style="height:${h}px;background:linear-gradient(180deg,rgba(${c},.95),rgba(${c},.55));animation-delay:${(-i * .07).toFixed(2)}s;animation-duration:${(.9 + (i % 5) * .08).toFixed(2)}s"></i></span>`);
  }
  return out.join('');
}
function boldify(t) {
  return esc(t).replace(/(\$?\d[\d,.]*|dining|bills?|savings|shares?|deposit|Shroff|FIS|internet|portfolio|retire\w*)/gi, '<b>$1</b>');
}
function vSet(state, status) {
  VOICE.state = state;
  const el = VOICE.el; if (!el) return;
  el.classList.remove('idle', 'listening', 'thinking', 'starting');
  el.classList.add(state);
  const hs = state === 'listening' ? 'listening' : state === 'thinking' ? 'thinking' : /catch|No speech|stopped|off|problem|connection|Busy/i.test(status || '') ? 'confused' : 'ready';
  haloSet($('.vbrand .hq', el), hs);
  $('#vst', el).textContent = status || { idle: 'Tap the mic to speak', starting: 'Starting…', listening: 'Listening…', thinking: 'Got it…' }[state];
  $('#vmb', el).setAttribute('aria-label', state === 'listening' ? 'Stop listening' : 'Start listening');
}
function vText(t, hint) {
  const el = VOICE.el; if (!el) return;
  const box = $('#vtx', el);
  box.classList.toggle('hint', !!hint);
  box.innerHTML = hint ? esc(t) : boldify(t);
}
function vAmp(target) {
  VOICE.amp = VOICE.amp * .45 + target * .55;
  if (VOICE.el) VOICE.el.style.setProperty('--amp', VOICE.amp.toFixed(3));
}
function vStart() {
  VOICE.text = ''; VOICE.done = false;
  vText('Try “Pay $1,000 to Shroff” or “How much did I spend on dining?”', true);
  vSet('starting'); haptic(10);
  if (isWebView()) { document.title = '__listen__'; setTimeout(syncBars, 450); return; }
  const SRc = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SRc) { vSet('idle', 'Voice works in the Android app'); vText('Speech recognition isn’t available in this preview.', true); return; }
  try {
    const r = new SRc(); VOICE.rec = r; r.lang = 'en-US'; r.interimResults = true;
    r.onstart = () => SB.vr('ready');
    r.onresult = e => { let t = '', fin = false; for (const x of e.results) { t += x[0].transcript; fin = x.isFinal; } SB.vr(fin ? 'final' : 'partial', t); };
    r.onerror = e => SB.vr('error', e.error === 'no-speech' ? 6 : e.error === 'not-allowed' ? 9 : 7);
    r.onend = () => { if (!VOICE.done && VOICE.state !== 'idle') SB.vr('final', VOICE.text || null); };
    r.start();
    clearInterval(VOICE.sim); VOICE.sim = setInterval(() => { if (VOICE.state === 'listening') SB.vr('rms', Math.random() * 9 - 1); }, 90);
  } catch (e) { vSet('idle', 'Voice isn’t available'); }
}
function vStop() { if (isWebView()) { document.title = '__stoplisten__'; setTimeout(syncBars, 450); } else if (VOICE.rec) try { VOICE.rec.stop(); } catch (e) {} vSet('thinking'); }
function vCancel() {
  VOICE.done = true; clearInterval(VOICE.sim);
  if (isWebView()) { document.title = '__cancellisten__'; setTimeout(syncBars, 450); } else if (VOICE.rec) try { VOICE.rec.abort(); } catch (e) {}
  VOICE.rec = null;
}
function vClose(after) { vCancel(); SB.pop(); if (after) setTimeout(after, 420); }

SB.vr = (ev, v) => {
  if (!VOICE.el || !document.body.contains(VOICE.el)) return;
  switch (ev) {
    case 'ready': case 'begin': vSet('listening'); if (ev === 'begin') haptic(6); break;
    case 'rms': if (VOICE.state === 'listening' || VOICE.state === 'starting') { if (VOICE.state === 'starting') vSet('listening'); vAmp(Math.max(.18, Math.min(1.12, (v + 2) / 11))); } break;
    case 'partial': if (v) { VOICE.text = v; vText(v); if (VOICE.state !== 'listening') vSet('listening'); } break;
    case 'end': vSet('thinking'); vAmp(.2); break;
    case 'final': {
      clearInterval(VOICE.sim);
      if (VOICE.done) return; VOICE.done = true;
      const t = (v || VOICE.text || '').trim();
      if (!t) { vSet('idle', 'Didn’t catch that'); vText('Tap the mic and try again.', true); VOICE.done = false; return; }
      vText(t); vSet('thinking', 'Sending…'); haptic(14);
      setTimeout(() => { const d = SB._voiceDeliver; vClose(() => d && d(t)); }, 650);
      break;
    }
    case 'error': {
      clearInterval(VOICE.sim);
      const msg = { 6: ['No speech heard', 'Tap the mic and try again.'], 7: ['Didn’t catch that', 'Tap the mic and try again.'], 9: ['Microphone is off', 'Allow microphone access for OneFI in Settings.'], 1: ['No connection', 'Speech recognition needs internet on this phone.'], 2: ['No connection', 'Speech recognition needs internet on this phone.'], 3: ['Microphone problem', 'Another app may be using the mic.'], 8: ['Busy', 'Tap the mic again in a moment.'] }[v] || ['Voice stopped', 'Tap the mic to try again.'];
      vSet('idle', msg[0]); vText(msg[1], true); vAmp(.14); break;
    }
    case 'denied': vSet('idle', 'Microphone is off'); vText('Allow microphone access to talk to the assistant. Tap the mic to ask again.', true); break;
    case 'unavailable': {
      // no in-app recognizer on this phone: fall back to the system voice prompt
      const d = SB._voiceDeliver;
      vClose(() => { SB.voice = t => { if (t) d && d(t); else toast('Didn’t catch that. Try again.', 'mic'); syncBars(); }; document.title = '__voice__'; setTimeout(syncBars, 500); });
      break;
    }
  }
};

SB.reg('voice', {
  cls: 'voicescr idle',
  render() {
    return `<div class="vbrand">${halo('ready', 30)}<span>OneFI</span></div>
      <p class="vhi">Hi <b>${D.user.first}</b>, ask me anything about your money.</p>
      <div class="wvbox"><div class="wvbars" role="img" aria-label="Voice level">${voiceBars()}</div></div>
      <div class="vstat"><i></i><span id="vst">Tap the mic to speak</span></div>
      <div class="vtx hint" id="vtx" aria-live="polite"></div>
      <div class="vctl">
        <button class="side" id="vkb" aria-label="Type instead">${ic('kbd')}</button>
        <div class="vmicwrap"><span class="rg"></span><span class="rg"></span><span class="rg"></span><span class="plate"></span>
          <button class="vmicbtn" id="vmb" aria-label="Start listening">${ic('mic')}</button></div>
        <button class="side" id="vx" aria-label="Close voice mode">${ic('x')}</button>
      </div>`;
  },
  mount(el) {
    VOICE.el = el; VOICE.amp = .3;
    syncBars();
    $('#vmb', el).onclick = () => { if (VOICE.state === 'listening' || VOICE.state === 'starting') vStop(); else vStart(); };
    $('#vx', el).onclick = () => vClose();
    $('#vkb', el).onclick = () => vClose(SB._voiceType);
    setTimeout(vStart, 380);
  },
});
// leaving voice mode by Android back also stops listening
const _popV = SB.pop.bind(SB);
SB.pop = function (n) { const top = this.stack[this.stack.length - 1]; if (top && top._route === 'voice' && !VOICE.done) vCancel(); return _popV(n); };
