// Profile, onboarding, lock screen, boot
function themeThumb(t, on) {
  const P = {
    noir: { bg: '#0D0C0B', fg: '#F3EDE1', acc: 'linear-gradient(135deg,#EFDDB1,#A9844E)', card: 'linear-gradient(135deg,#2b2822,#0c0b0a)', font: '"Instrument Serif"', w: 400, line: 'rgba(243,237,225,.12)' },
    porcelain: { bg: '#F2F3F5', fg: '#101114', acc: '#0F7A5C', card: 'linear-gradient(140deg,#16946f,#09503d)', font: '"Inter Display"', w: 700, line: 'rgba(16,17,20,.1)' },
    aurora: { bg: 'radial-gradient(90% 60% at 0 0,rgba(140,107,255,.55),transparent 70%),#070A1C', fg: '#EDF0FF', acc: 'linear-gradient(120deg,#8C6BFF,#3DD5F3)', card: 'linear-gradient(125deg,#6B4DFF,#2BB8E8,#5CF0D8)', font: 'Outfit', w: 600, line: 'rgba(255,255,255,.14)' },
  }[t];
  return `<button class="thumb ${on ? 'on' : ''}" data-theme-pick="${t}">
    <div class="pv" style="background:${P.bg};color:${P.fg}">
      <div class="l1" style="background:${P.fg}"></div>
      <div class="big" style="font-family:${P.font};font-weight:${P.w};letter-spacing:-.02em">$128k</div>
      <div class="l1" style="background:${P.fg};width:62%;opacity:.25"></div>
      <div class="card" style="background:${P.card}"></div>
      <div class="tb" style="background:${P.acc};width:38%;margin:0 auto"></div>
    </div>
    <div class="nm">${THEMES[t].name}</div><div class="ds">${THEMES[t].desc}</div></button>`;
}
function paletteThumb(k, on) {
  const P = { aura: ['radial-gradient(70% 50% at 0% 20%,rgba(176,196,255,.8),transparent 70%),radial-gradient(70% 50% at 100% 50%,rgba(214,236,226,.95),transparent 70%),radial-gradient(70% 50% at 50% 100%,rgba(255,214,228,.9),transparent 70%),#F3F3F7', '#1C1C1F', 'linear-gradient(135deg,rgba(255,255,255,.85),rgba(255,255,255,.55))', '#1C1C1F'], glass: ['radial-gradient(70% 50% at 0% 30%,rgba(110,155,255,.7),transparent 70%),radial-gradient(70% 50% at 100% 60%,rgba(255,140,200,.6),transparent 70%),radial-gradient(70% 50% at 30% 100%,rgba(90,225,195,.55),transparent 70%),#EEF1F7', '#0A0F1E', 'linear-gradient(140deg,rgba(10,132,255,.86),rgba(94,92,230,.8))', '#0A84FF'], 'glass-dark': ['radial-gradient(70% 50% at 0% 30%,rgba(60,90,255,.6),transparent 70%),radial-gradient(70% 50% at 100% 60%,rgba(190,60,210,.5),transparent 70%),radial-gradient(70% 50% at 30% 100%,rgba(0,170,160,.45),transparent 70%),#05060B', '#F5F7FF', 'linear-gradient(140deg,rgba(10,132,255,.62),rgba(94,92,230,.55))', '#0A84FF'], azure: ['#F2F6FA', '#0B1B2B', 'radial-gradient(130% 120% at 0% 0%,#22A6EE,#0079C1 42%,#004A79)', '#0079C1'], midnight: ['#0B0E14', '#EDF1F7', 'radial-gradient(130% 120% at 0% 0%,#2B3D5E,#182131 48%,#0F141D)', '#3D8BFF'], mono: ['#F2F3F5', '#101114', 'radial-gradient(120% 100% at 0% 0%,#2e3036,#131417 55%,#08090a)', '#101114'] }[k];
  return `<button class="thumb ${on ? 'on' : ''}" data-pal="${k}"><div class="pv" style="background:${P[0]};color:${P[1]}"><div class="card" style="background:${P[2]};height:46px;margin-top:0;border-radius:9px;padding:7px;color:${k === 'aura' ? '#1C1C1F' : '#fff'};font:700 13px 'Inter Display';${k === 'aura' ? 'border:1px solid rgba(28,28,31,.08)' : ''}">$114k</div><div class="l1" style="background:${P[1]};width:70%;opacity:.25"></div><div class="l1" style="background:${P[1]};width:45%;opacity:.15"></div><div class="tb" style="background:${P[3]};width:44%;margin:auto auto 0;opacity:1"></div></div><div class="nm">${PALETTES[k].name}</div><div class="ds">${PALETTES[k].desc}</div></button>`;
}
function bindThemePick(root, after) {
  $$('[data-theme-pick]', root).forEach(b => b.onclick = () => {
    const t = b.dataset.themePick; setTheme(t); haptic(12);
    $$('[data-theme-pick]', root).forEach(x => x.classList.toggle('on', x === b));
    after && after(t);
  });
}

SB.reg('profile', {
  tab: true,
  render() {
    const t = store.get('theme', 'noir');
    return `${topbar('Profile')}
    <div class="body">
      <div style="display:flex;flex-direction:column;align-items:center;padding:6px 0 22px">
        <div class="me" style="width:84px;height:84px;font-size:28px">${initials(D.user.first + ' ' + D.user.last)}</div>
        <div style="font-size:20px;font-weight:600;margin-top:14px;letter-spacing:-.01em">${D.user.first} ${D.user.last}</div>
        <div class="muted" style="font-size:13.5px;margin-top:2px">${D.user.email}</div>
        <span class="badge" style="margin-top:10px">${D.user.tier} member since ${D.user.since}</span>
      </div>
      <h2 class="sec" style="margin-top:4px">Appearance</h2>
      <div class="themes" id="pp" style="grid-template-columns:repeat(3,1fr)">${Object.keys(PALETTES).map(k => paletteThumb(k, k === store.get('palette', 'aura'))).join('')}</div>
      <h2 class="sec">Security</h2>
      <div class="list flat">
        <div class="row"><div class="logo soft">${ic('finger')}</div><div class="main"><div class="t1">Fingerprint unlock</div><div class="t2">Use biometrics to open the app</div></div>${sw(true)}</div>
        <div class="row"><div class="logo soft">${ic('eyeoff')}</div><div class="main"><div class="t1">Hide balances on open</div><div class="t2">Tap the eye to show them</div></div>${sw(store.get('masked', false), 'id="mk"')}</div>
        <button class="row" id="cpin"><div class="logo soft">${ic('key')}</div><div class="main"><div class="t1">Change app PIN</div></div>${ic('right', 'sm chev')}</button>
        <button class="row" data-push="devices"><div class="logo soft">${ic('phone')}</div><div class="main"><div class="t1">Signed‑in devices</div><div class="t2">2 devices</div></div>${ic('right', 'sm chev')}</button>
      </div>
      <h2 class="sec">Preferences</h2>
      <div class="list flat">
        <div class="row"><div class="logo soft">${ic('bell')}</div><div class="main"><div class="t1">Push notifications</div></div>${sw(true)}</div>
        <div class="row"><div class="logo soft">${ic('spark')}</div><div class="main"><div class="t1">Assistant suggestions</div><div class="t2">Proactive insights on Home</div></div>${sw(true)}</div>
        <button class="row" id="meet"><div class="logo soft">${halo('ready', 22, 'still')}</div><div class="main"><div class="t1">Meet OneFI</div><div class="t2">What the dot means</div></div>${ic('right', 'sm chev')}</button>
        <button class="row" id="replay"><div class="logo soft">${ic('repeat')}</div><div class="main"><div class="t1">Replay welcome tour</div></div>${ic('right', 'sm chev')}</button>
        <button class="row" id="help"><div class="logo soft">${ic('help')}</div><div class="main"><div class="t1">Help and support</div><div class="t2">Chat with us, 24/7</div></div>${ic('right', 'sm chev')}</button>
      </div>
      <button class="btn secondary" style="margin-top:22px" id="lockb">${ic('logout', 'sm')} Lock app</button>
      <div class="faint" style="text-align:center;font-size:12px;margin-top:18px">OneFI prototype 1.7, simulated data</div>
    </div>`;
  },
  mount(el) {
    $$('[data-pal]', el).forEach(b => b.onclick = () => { setPalette(b.dataset.pal); haptic(12); $$('[data-pal]', el).forEach(x => x.classList.toggle('on', x === b)); toast(`${PALETTES[b.dataset.pal].name} applied`, 'palette'); });
    bindSwitches(el, (s, on) => { if (s.id === 'mk') store.set('masked', on); toast(on ? 'Turned on' : 'Turned off', on ? 'check' : 'x'); });
    $('#cpin', el).onclick = () => pinSheet('New app PIN', 'Choose 4 digits').then(ok => ok && toast('App PIN changed', 'key'));
    $('#help', el).onclick = () => { SB._pendingAsk = null; toast('Connecting you to a specialist…', 'help'); };
    $('#lockb', el).onclick = () => showLock();
    $('#replay', el).onclick = () => showIntro();
    $('#meet', el).onclick = () => meetOneFI();
  },
});
SB.reg('devices', {
  render() {
    return `${topbar('Signed‑in devices')}<div class="body"><div class="list">${[['phone', 'This phone', 'San Francisco, active now', true], ['globe', 'Chrome on Mac', 'San Francisco, 2 days ago']].map(([i, t, s, me]) => `<div class="row"><div class="logo soft">${ic(i)}</div><div class="main"><div class="t1">${t}</div><div class="t2">${s}</div></div>${me ? '<span class="badge">This device</span>' : '<button class="btn sm secondary so">Sign out</button>'}</div>`).join('')}</div></div>`;
  },
  mount(el) { $$('.so', el).forEach(b => b.onclick = () => { b.closest('.row').remove(); toast('Signed out of Chrome on Mac', 'logout'); }); },
});

/* ───────── onboarding & lock ───────── */
function overlayEl(cls) { const o = document.createElement('div'); o.className = 'screen ' + cls; o.style.zIndex = 15; $('#app').appendChild(o); return o; }

function showIntro() {
  const o = overlayEl('intro-wrap');
  const t = store.get('theme', 'noir');
  o.innerHTML = `<div class="intro">
    <div class="slides" id="sl">
      <div class="slide"><div class="art"><div style="width:250px">${cardArt(D.cards[0])}</div></div><h1>All your money, one calm place.</h1><p>Banking, cards, investing, loans and insurance, together in one app.</p></div>
      <div class="slide"><div class="art">${meetHTML(104)}</div><h1>Meet OneFI.</h1><p>Ask it to pay people, pay bills, open term deposits or place trades. The dot shows you what it’s doing.</p></div>
      <div class="slide"><div class="art"><div class="amark xl alt">${ic('shield')}</div></div><h1>Private and secure.</h1><p>Your conversations are encrypted, and nothing moves without your fingerprint or PIN when you choose.</p></div>
    </div>
    <div class="dots" id="dts"><i class="on"></i><i></i><i></i></div>
    <div class="footer-actions" style="padding-top:0"><button class="btn primary" id="nx">Continue</button></div></div>`;
  const sl = $('#sl', o), dots = $$('#dts i', o), nx = $('#nx', o);
  haloShowcase($('.meet', o));
  let i = 0;
  const upd = () => { dots.forEach((d, j) => d.classList.toggle('on', j === i)); nx.textContent = i === 2 ? 'Get started' : 'Continue'; };
  sl.addEventListener('scroll', () => { const n = Math.round(sl.scrollLeft / sl.clientWidth); if (n !== i) { i = n; upd(); haptic(4); } }, { passive: true });
  nx.onclick = () => {
    if (i < 2) { i++; sl.scrollTo({ left: i * sl.clientWidth, behavior: 'smooth' }); upd(); return; }
    store.set('onboarded', true);
    o.style.transition = 'opacity .35s'; o.style.opacity = 0; setTimeout(() => o.remove(), 360);
    showLock();
  };
  SB.overlay = () => { if (i > 0) { i--; sl.scrollTo({ left: i * sl.clientWidth, behavior: 'smooth' }); upd(); } else { document.title = '__exit__'; setTimeout(syncBars, 300); } };
}

function showLock() {
  Sheet.close(true);
  const o = overlayEl('lock-wrap');
  let code = '';
  o.innerHTML = `<div class="lock">
    ${halo('ready', 76, 'lockhalo')}
    <div class="who">Welcome back</div><h1>${D.user.first}</h1>
    <div class="pins" id="lp">${'<i></i>'.repeat(4)}</div>
    <div class="keypad" style="width:100%;max-width:340px">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'fp', 0, 'del'].map(k => `<button class="key" data-k="${k}">${k === 'del' ? ic('left') : k === 'fp' ? `<div class="fp" style="width:52px;height:52px;margin:0" id="fpb">${ic('finger', 'lg')}</div>` : k}</button>`).join('')}</div>
    <button class="btn ghost" style="margin-top:10px;width:auto" id="forgot">Forgot PIN?</button>
    <div class="faint" style="font-size:12.5px;margin-top:4px">Demo: any 4 digits, or tap the fingerprint</div></div>`;
  const pins = $$('#lp i', o);
  const unlock = async () => {
    haptic(20); pins.forEach(p => p.classList.add('on'));
    await wait(350);
    SB.overlay = null;
    SB._homeSeen = false; SB.tab = 'home'; SB._chat = SB._chat || null;
    landOneFI(o);
  };
  $$('.key', o).forEach(b => b.onclick = async () => {
    const k = b.dataset.k; haptic(5);
    if (k === 'fp') { const f = $('#fpb', o); f.classList.add('scanning'); await wait(1000); f.classList.remove('scanning'); f.classList.add('ok'); return unlock(); }
    if (k === 'del') code = code.slice(0, -1); else if (code.length < 4) code += k;
    pins.forEach((p, i) => p.classList.toggle('on', i < code.length));
    if (code.length === 4) { await wait(150); unlock(); }
  });
  $('#forgot', o).onclick = () => toast('A reset link was sent to your email', 'key');
  SB.overlay = () => { document.title = '__exit__'; setTimeout(syncBars, 300); };
  // auto biometric prompt
  setTimeout(() => { const f = $('#fpb', o); if (f && o.isConnected && !code) f.classList.add('scanning'); }, 600);
  setTimeout(() => { const f = $('#fpb', o); if (f && o.isConnected) f.classList.remove('scanning'); }, 1500);
}

/* Launch moment: the halo on the lock screen glides into OneFI's header, then OneFI starts talking */
function landOneFI(o) {
  const lh = $('.lockhalo', o), from = lh ? lh.getBoundingClientRect() : null;
  SB.root('home', {}, null);
  SB.busy = false; SB._landing = true;
  const a = SB.push('assistant', {}, 'fade');
  SB._landing = false;
  o.style.transition = 'opacity .45s'; o.style.opacity = 0; setTimeout(() => o.remove(), 470);
  const target = a && $('.chathead .hq', a);
  if (!from || !target || matchMedia('(prefers-reduced-motion: reduce)').matches) { haptic(14); return SB._brief && SB._brief(); }
  const fly = lh.cloneNode(true); fly.classList.remove('lockhalo'); fly.classList.add('flyhalo');
  Object.assign(fly.style, { left: from.left + 'px', top: from.top + 'px' });
  document.body.appendChild(fly); lh.style.visibility = 'hidden'; target.style.visibility = 'hidden';
  requestAnimationFrame(() => {
    const to = target.getBoundingClientRect();
    const k = to.width / from.width, dx = to.left - from.left, dy = to.top - from.top;
    const anim = fly.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${dx * .55}px,${dy * .35}px) scale(${1 - (1 - k) * .45})`, offset: .45 }, { transform: `translate(${dx}px,${dy}px) scale(${k})` }], { duration: 900, delay: 120, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
    anim.onfinish = () => { target.style.visibility = ''; haloSet(target, 'done'); fly.remove(); haptic(14); setTimeout(() => { haloSet(target, 'ready'); SB._brief && SB._brief(); }, 900); };
  });
}

function boot() {
  setTheme('porcelain', false); setPalette(store.get('palette', 'aura'), false);
  const splash = document.createElement('div'); splash.className = 'splash';
  splash.innerHTML = `<div class="mark">${halo('thinking', 96)}<div class="wordmark">OneFI</div><div class="tagline">Your money, handled.</div></div>`;
  setTimeout(() => haloSet($('.splash .hq'), 'ready'), 1100);
  $('#app').appendChild(splash);
  $('#tabbar').classList.add('hide');
  const q = new URLSearchParams(location.search);
  setTimeout(() => {
    splash.style.transition = 'opacity .4s'; splash.style.opacity = 0; setTimeout(() => splash.remove(), 420);
    if (q.get('land')) { showLock(); return; }
    if (q.get('skip')) { SB.tab = q.get('tab') || 'home'; SB.root(SB.tab, {}, null); if (q.get('push')) SB.push(q.get('push'), JSON.parse(q.get('p') || '{}')); return; }
    if (!store.get('onboarded', false)) showIntro(); else showLock();
  }, q.get('skip') ? 0 : 1900);
}

document.addEventListener('DOMContentLoaded', () => {
  $('#tabbar').innerHTML = `
    <button class="tab" data-tab="home" aria-label="Home">${ic('home')}<span class="tl">Home</span></button>
    <button class="tab" data-tab="cards" aria-label="Cards">${ic('card')}<span class="tl">Cards</span></button>
    <button class="tab" data-push="assistant" aria-label="OneFI">${halo('ready', 26, 'still')}<span class="tl">OneFI</span></button>
    <button class="tab" data-tab="invest" aria-label="Invest">${ic('bars')}<span class="tl">Invest</span></button>
    <button class="tab" data-tab="profile" aria-label="Profile">${ic('user')}<span class="tl">Profile</span></button>`;
  boot();
});
