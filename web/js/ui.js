// Core: formatting, navigation, sheets, toasts, charts, simulation helpers.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const wait = ms => new Promise(r => setTimeout(r, ms));
const haptic = (ms = 8) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
const store = {
  get(k, d) { try { const v = localStorage.getItem('sb.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('sb.' + k, JSON.stringify(v)); } catch (e) {} },
};

function commas(n) { return Math.floor(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function money(n, o = {}) {
  const cur = o.cur || '$';
  const neg = n < 0, sign = o.sign ? (neg ? '−' : '+') : (neg ? '−' : '');
  const cents = Math.round(Math.abs(n) * 100) % 100;
  const whole = commas(Math.round(Math.abs(n) * 100) / 100);
  const c = o.noCents ? '' : `<span class="cents">.${String(cents).padStart(2, '0')}</span>`;
  return `<span class="v">${sign}<span class="cur">${cur}</span>${whole}${c}</span>`;
}
function moneyT(n, o = {}) {
  const neg = n < 0; const sign = o.sign ? (neg ? '−' : '+') : (neg ? '−' : '');
  const abs = Math.abs(n);
  const s = o.noCents ? commas(Math.round(abs)) : commas(abs) + '.' + String(Math.round(abs * 100) % 100).padStart(2, '0');
  return sign + (o.cur || '$') + s;
}
function compact(n) { return n >= 1e6 ? '$' + (n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace(/\.0+$/, '') + 'M' : n >= 1e3 ? '$' + (n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, '') + 'k' : '$' + Math.round(n); }
function initials(name) { return name.split(' ').map(w => w[0]).slice(0, 2).join(''); }
function tint(h, l = 52, s = 42) { return `hsl(${h} ${s}% ${l}%)`; }
function mono(h, base = 16) { return `hsl(225 6% ${base + (Math.abs(h) % 7) * 4}%)`; }
function avatar(c, size = '') { return `<div class="avatar ${size}" style="background:${mono(c.hue, 30)}">${initials(c.name)}</div>`; }
function logo(name, hue, iconName, cls = '') {
  const inner = iconName ? ic(iconName) : initials(name).slice(0, 1);
  return `<div class="logo ${cls}" style="background:${mono(hue)}">${inner}</div>`;
}
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function dayLabel(d) {
  const today = new Date(2026, 10, 18); const diff = Math.round((today - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
  if (diff === 0) return 'Today'; if (diff === 1) return 'Yesterday';
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/* ───────── theme ───────── */
const THEMES = {
  noir: { name: 'Noir', desc: 'Warm black, champagne, serif figures' },
  porcelain: { name: 'Porcelain', desc: 'Clean paper, ink and emerald' },
  aurora: { name: 'Aurora', desc: 'Deep navy glass and light' },
};
function setTheme(t, save = true) {
  document.documentElement.dataset.theme = t;
  if (save) store.set('theme', t);
  syncBars();
}
const PALETTES = { aura: { name: 'Aura', desc: 'Soft pastel, frosted' }, glass: { name: 'Glass', desc: 'Liquid glass, light' }, 'glass-dark': { name: 'Glass dark', desc: 'Liquid glass, dark' }, azure: { name: 'Azure', desc: 'Bright brand blue on white' }, midnight: { name: 'Midnight', desc: 'Dark with blue light' }, mono: { name: 'Mono', desc: 'Black and white' } };
function setPalette(p, save = true) { if (p === 'mono') delete document.documentElement.dataset.palette; else document.documentElement.dataset.palette = p; if (save) store.set('palette', p); syncBars(); }
function syncBars() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--status').trim().replace(/"/g, '');
  if (v) document.title = v;
}
function barsOverride(hex) { document.title = hex; }

/* ───────── navigation ───────── */
const SB = {
  routes: {}, stack: [], tab: 'home', busy: false,
  reg(name, def) { this.routes[name] = def; },
  el(name, params, cls) {
    const def = this.routes[name];
    const s = document.createElement('section');
    s.className = 'screen ' + (cls || '') + (def.cls ? ' ' + def.cls : '');
    s.innerHTML = def.render(params || {});
    s._route = name; s._params = params || {};
    return s;
  },
  mount(s) { const def = this.routes[s._route]; def.mount && def.mount(s, s._params); },
  stage() { return $('#stage'); },
  setTabbar() {
    const tb = $('#tabbar');
    tb.classList.toggle('hide', this.stack.length > 1 || !this.routes[this.stack[0]?._route]?.tab);
    $$('.tab', tb).forEach(t => t.classList.toggle('on', t.dataset.tab === this.tab));
  },
  root(name, params, anim = 'enter-fade') {
    const stage = this.stage();
    const s = this.el(name, params, 'tabroot');
    this.stack.forEach(x => x.remove());
    this.stack = [s];
    if (anim) s.classList.add(anim);
    stage.appendChild(s);
    this.mount(s);
    this.setTabbar();
    return s;
  },
  go(tab) {
    if (this.busy) return;
    if (tab === this.tab && this.stack.length === 1) { const b = $('.body', this.stack[0]); b && b.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    haptic(6);
    this.tab = tab; this.root(tab);
  },
  push(name, params, mode = 'push') {
    if (this.busy) return; this.busy = true;
    const stage = this.stage();
    const prev = this.stack[this.stack.length - 1];
    const s = this.el(name, params, 'pushed');
    s._mode = mode;
    s.classList.add(mode === 'up' ? 'enter-up' : mode === 'fade' ? 'enter-fade' : 'enter-push');
    if (mode === 'push') prev.classList.add('leave-push');
    stage.appendChild(s);
    this.stack.push(s);
    this.setTabbar();
    this.mount(s);
    setTimeout(() => { s.classList.remove('enter-push', 'enter-up'); prev.classList.remove('leave-push'); if (mode !== 'up') prev.style.visibility = 'hidden'; this.busy = false; }, 440);
    return s;
  },
  replace(name, params, mode) { // swap top screen without animation stacking
    const top = this.stack.pop();
    const s = this.el(name, params, 'pushed'); s._mode = mode || top._mode;
    s.classList.add('enter-fade');
    this.stage().appendChild(s); this.stack.push(s); this.mount(s);
    setTimeout(() => top.remove(), 300);
    return s;
  },
  pop(n = 1) {
    if (this.busy || this.stack.length < 2) return; this.busy = true;
    haptic(5);
    const top = this.stack.pop();
    for (let i = 1; i < n && this.stack.length > 1; i++) this.stack.pop().remove();
    const under = this.stack[this.stack.length - 1];
    under.style.visibility = '';
    top.classList.add(top._mode === 'up' ? 'leave-down' : 'leave-pop');
    if (top._mode !== 'up') under.classList.add('enter-pop');
    const def = this.routes[under._route];
    def.onReturn && def.onReturn(under, under._params);
    setTimeout(() => { top.remove(); under.classList.remove('enter-pop'); this.busy = false; this.setTabbar(); }, 380);
    setTimeout(() => this.setTabbar(), 120);
  },
  home() { // close a whole flow
    while (this.stack.length > 2) this.stack.splice(1, 1)[0].remove();
    this.stack[0].style.visibility = '';
    this.pop();
  },
  back() {
    if (Sheet.cur) return Sheet.close();
    if (document.querySelector('.proc')) return;
    if (this.overlay) return this.overlay();
    if (this.stack.length > 1) return this.pop();
    if (this.tab !== 'home') return this.go('home');
    document.title = '__exit__'; setTimeout(syncBars, 300);
  },
};
window.SB = SB;

document.addEventListener('click', e => {
  const t = e.target.closest('[data-push],[data-tab],[data-back],[data-sheet]');
  if (!t) return;
  if (t.dataset.tab) return SB.go(t.dataset.tab);
  if (t.dataset.back !== undefined) return SB.pop();
  if (t.dataset.push) { haptic(5); return SB.push(t.dataset.push, t.dataset.p ? JSON.parse(t.dataset.p) : {}, t.dataset.mode); }
  if (t.dataset.sheet && SHEETS[t.dataset.sheet]) { haptic(5); SHEETS[t.dataset.sheet](t.dataset.p ? JSON.parse(t.dataset.p) : {}); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') SB.back(); });

function topbar(title, right = '<div class="spacer"></div>', backIcon = 'left') {
  return `<div class="topbar"><button class="iconbtn" data-back aria-label="Back">${ic(backIcon)}</button><div class="title">${title}</div>${right}</div>`;
}

/* ───────── sheet ───────── */
const SHEETS = {};
const Sheet = {
  cur: null,
  open(html, opts = {}) {
    if (this.cur) this.close(true);
    const root = $('#sheet-root');
    const scrim = document.createElement('div'); scrim.className = 'scrim';
    const sh = document.createElement('div'); sh.className = 'sheet';
    sh.innerHTML = `<div class="grab"></div><div class="sbody">${html}</div>`;
    root.append(scrim, sh);
    requestAnimationFrame(() => requestAnimationFrame(() => { scrim.classList.add('open'); sh.classList.add('open'); }));
    scrim.onclick = () => !opts.locked && this.close();
    // drag to dismiss
    let y0 = null, dy = 0;
    const grab = $('.grab', sh);
    sh.addEventListener('touchstart', e => { if (e.target === grab || $('.sbody', sh).scrollTop <= 0 && e.target.closest('.grab,h3,.sub')) { y0 = e.touches[0].clientY; sh.style.transition = 'none'; } }, { passive: true });
    sh.addEventListener('touchmove', e => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); sh.style.transform = `translateY(${dy}px)`; }, { passive: true });
    sh.addEventListener('touchend', () => { if (y0 == null) return; sh.style.transition = ''; sh.style.transform = ''; if (dy > 110 && !opts.locked) this.close(); y0 = null; dy = 0; });
    this.cur = { scrim, sh, opts };
    opts.mount && opts.mount(sh);
    haptic(6);
    return sh;
  },
  close(instant) {
    const c = this.cur; if (!c) return; this.cur = null;
    c.opts.onClose && c.opts.onClose();
    if (instant) { c.scrim.remove(); c.sh.remove(); return; }
    c.scrim.classList.remove('open'); c.sh.classList.remove('open');
    setTimeout(() => { c.scrim.remove(); c.sh.remove(); }, 420);
  },
};

/* ───────── toast ───────── */
let toastT;
function toast(msg, iconName = 'check') {
  const t = $('#toast');
  t.innerHTML = `${ic(iconName, 'sm')}<span>${msg}</span>`;
  t.classList.add('show'); haptic(10);
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ───────── simulated processing ───────── */
const PACE = 1.76; // how long simulated work takes (1 = original speed)
async function processing(title, steps, total = 2200) {
  total *= PACE;
  const p = document.createElement('div'); p.className = 'proc';
  p.innerHTML = `<div class="ring"></div><div class="t">${title}</div><div class="s">${steps[0] || ''}</div>`;
  $('#app').appendChild(p);
  const per = total / Math.max(1, steps.length);
  for (let i = 1; i < steps.length; i++) {
    await wait(per);
    const s = $('.s', p); s.style.opacity = 0; await wait(150); s.textContent = steps[i]; s.style.opacity = 1;
  }
  await wait(per);
  return () => { p.style.transition = 'opacity .25s'; p.style.opacity = 0; setTimeout(() => p.remove(), 260); };
}

/* ───────── PIN / biometric ───────── */
function pinSheet(title = 'Enter your PIN', sub = 'Confirm with your 4‑digit PIN or fingerprint') {
  return new Promise(resolve => {
    let code = '';
    const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'fp', 0, 'del'];
    Sheet.open(`
      <h3 style="text-align:center">${title}</h3>
      <div class="sub" style="text-align:center">${sub}</div>
      <div class="pins">${'<i></i>'.repeat(4)}</div>
      <div class="keypad">${keys.map(k => `<button class="key" data-k="${k}">${k === 'del' ? ic('left') : k === 'fp' ? ic('finger', 'lg') : k}</button>`).join('')}</div>
      <div style="height:8px"></div>`, {
      onClose: () => resolve(false),
      mount(sh) {
        const pins = $$('.pins i', sh);
        const done = async () => {
          haptic(14);
          pins.forEach(p => p.classList.add('on'));
          await wait(260);
          const c = Sheet.cur; if (c) { c.opts.onClose = null; }
          Sheet.close(); resolve(true);
        };
        $$('.key', sh).forEach(b => b.onclick = async () => {
          const k = b.dataset.k; haptic(5);
          if (k === 'del') code = code.slice(0, -1);
          else if (k === 'fp') {
            b.innerHTML = '<div class="fp scanning" style="width:44px;height:44px;margin:0">' + ic('finger') + '</div>';
            await wait(900); return done();
          } else if (code.length < 4) code += k;
          pins.forEach((p, i) => p.classList.toggle('on', i < code.length));
          if (code.length === 4) { await wait(180); done(); }
        });
      },
    });
  });
}

/* ───────── hold-to-confirm ───────── */
function holdButton(el, label, onDone, ms = 900) {
  el.className = 'hold';
  el.innerHTML = `<div class="fillh"></div>${ic('finger', 'sm')}<span>${label}</span>`;
  const fill = $('.fillh', el); let t0 = 0, raf = 0, done = false;
  const step = () => {
    const p = Math.min(1, (performance.now() - t0) / ms);
    fill.style.transform = `scaleX(${p})`;
    if (p >= 1) { done = true; haptic(20); onDone(); return; }
    raf = requestAnimationFrame(step);
  };
  const start = e => { if (done) return; e.preventDefault(); t0 = performance.now(); el.classList.add('holding'); haptic(6); raf = requestAnimationFrame(step); };
  const end = () => { if (done) return; cancelAnimationFrame(raf); el.classList.remove('holding'); fill.style.transition = 'transform .3s'; fill.style.transform = 'scaleX(0)'; setTimeout(() => fill.style.transition = '', 300); };
  el.addEventListener('touchstart', start, { passive: false }); el.addEventListener('mousedown', start);
  ['touchend', 'touchcancel', 'mouseup', 'mouseleave'].forEach(ev => el.addEventListener(ev, end));
}

/* ───────── charts ───────── */
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const t = 0.18;
    const c1x = p1[0] + (p2[0] - p0[0]) * t, c1y = p1[1] + (p2[1] - p0[1]) * t;
    const c2x = p2[0] - (p3[0] - p1[0]) * t, c2y = p2[1] - (p3[1] - p1[1]) * t;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}
let gid = 0;
function areaChart(container, values, opts = {}) {
  const W = container.clientWidth || window.innerWidth, H = opts.h || container.clientHeight || 160;
  const pad = opts.pad ?? 6;
  const min = Math.min(...values), max = Math.max(...values), span = (max - min) || 1;
  const pts = values.map((v, i) => [i / (values.length - 1) * W, pad + (1 - (v - min) / span) * (H - pad * 2 - (opts.bottom || 0))]);
  const line = smoothPath(pts);
  const id = 'g' + (++gid);
  const color = opts.color || 'var(--chart)';
  container.classList.add('chart');
  container.innerHTML = `<svg width="${W}" height="${H}" class="${opts.animate === false ? '' : 'draw'}">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity="${opts.fillOpacity ?? .28}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    ${opts.baseline ? `<line x1="0" x2="${W}" y1="${pts[0][1]}" y2="${pts[0][1]}" stroke="var(--line-2)" stroke-dasharray="2 4"/>` : ''}
    <path class="fill" d="${line} L${W},${H} L0,${H} Z" fill="url(#${id})"/>
    <path class="line" d="${line}" fill="none" stroke="${color}" stroke-width="${opts.sw || 2}" stroke-linecap="round"/>
  </svg><div class="cursor"></div><div class="dotc"></div>`;
  const path = $('path.line', container);
  try { path.style.setProperty('--len', Math.ceil(path.getTotalLength())); } catch (e) {}
  if (opts.scrub) {
    const cur = $('.cursor', container), dot = $('.dotc', container);
    let lastI = -1;
    const at = x => {
      const i = Math.max(0, Math.min(values.length - 1, Math.round(x / W * (values.length - 1))));
      const [px, py] = pts[i];
      cur.style.left = px + 'px'; dot.style.left = px + 'px'; dot.style.top = py + 'px';
      if (i !== lastI) { lastI = i; haptic(2); opts.onScrub && opts.onScrub(values[i], i); }
    };
    const rect = () => container.getBoundingClientRect();
    container.addEventListener('touchstart', e => { container.classList.add('scrub'); at(e.touches[0].clientX - rect().left); }, { passive: true });
    container.addEventListener('touchmove', e => at(e.touches[0].clientX - rect().left), { passive: true });
    container.addEventListener('touchend', () => { container.classList.remove('scrub'); lastI = -1; opts.onEnd && opts.onEnd(); });
    container.addEventListener('mousemove', e => { container.classList.add('scrub'); at(e.clientX - rect().left); });
    container.addEventListener('mouseleave', () => { container.classList.remove('scrub'); opts.onEnd && opts.onEnd(); });
  }
}
function donut(segs, size = 170, sw = 18, center = '') {
  const r = (size - sw) / 2, C = 2 * Math.PI * r, tot = segs.reduce((s, x) => s + x.v, 0);
  let off = 0; const gap = segs.length > 1 ? 3 : 0;
  const arcs = segs.map((s, i) => {
    const len = Math.max(0, s.v / tot * C - gap);
    const a = `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${s.c}" stroke-width="${sw}" stroke-dasharray="${len} ${C}" stroke-dashoffset="${-off}" stroke-linecap="butt" style="transition:stroke-dasharray .9s ${i * .06}s cubic-bezier(.2,.8,.2,1)" data-len="${len}"/>`;
    off += s.v / tot * C; return a;
  }).join('');
  return `<div style="position:relative;width:${size}px;height:${size}px;flex-shrink:0"><svg width="${size}" height="${size}" style="transform:rotate(-90deg)" class="donut"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="${sw}"/>${arcs}</svg><div style="position:absolute;inset:0;display:grid;place-items:center;text-align:center">${center}</div></div>`;
}
function animateDonuts(el) {
  $$('svg.donut circle[data-len]', el).forEach(c => { const l = c.dataset.len; const C = c.getAttribute('stroke-dasharray').split(' ')[1]; c.setAttribute('stroke-dasharray', `0 ${C}`); requestAnimationFrame(() => requestAnimationFrame(() => c.setAttribute('stroke-dasharray', `${l} ${C}`))); });
}
function bars(values, labels, h = 120, hl = -1) {
  const max = Math.max(...values);
  return `<div style="display:flex;align-items:flex-end;gap:6px;height:${h}px">${values.map((v, i) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end"><div style="width:100%;height:${Math.max(4, v / max * (h - 22))}px;border-radius:6px;background:${i === hl ? 'var(--accent)' : 'var(--surface-3)'};transform-origin:bottom;animation:growY .8s ${i * .03}s cubic-bezier(.2,.8,.2,1) both"></div>${labels ? `<div style="font-size:11px;color:var(--text-3)">${labels[i]}</div>` : ''}</div>`).join('')}</div>`;
}
function gauge(score, min = 300, max = 850) {
  const W = 260, H = 150, r = 110, cx = W / 2, cy = 130;
  const a0 = Math.PI, a1 = 0, t = (score - min) / (max - min);
  const pt = a => [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
  const L = Math.PI * r;
  return `<svg width="${W}" height="${H}" class="gauge" viewBox="0 0 ${W} ${H}">
    <defs><linearGradient id="gg" x1="0" x2="1"><stop offset="0" stop-color="var(--neg)"/><stop offset=".5" stop-color="var(--warn)"/><stop offset="1" stop-color="var(--pos)"/></linearGradient></defs>
    <path d="M${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1}" stroke="var(--surface-3)" stroke-width="14" fill="none" stroke-linecap="round"/>
    <path d="M${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1}" stroke="url(#gg)" stroke-width="14" fill="none" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="${L}" style="--to:${L * (1 - t)};animation:gauge 1.4s .2s cubic-bezier(.2,.8,.2,1) forwards"/>
  </svg>`;
}
const _st = document.createElement('style');
_st.textContent = '@keyframes growY{from{transform:scaleY(0)}}@keyframes gauge{to{stroke-dashoffset:var(--to)}}';
document.head.appendChild(_st);

function countUp(el, to, ms = 900, o = {}) {
  const from = o.from ?? to * 0.86; const t0 = performance.now();
  const f = now => {
    const p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3);
    el.innerHTML = money(from + (to - from) * e, o);
    if (p < 1) requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
}

function skeletonList(n = 4) {
  return `<div class="list">${Array.from({ length: n }, () => `<div class="row"><div class="sk" style="width:42px;height:42px;border-radius:13px"></div><div class="main"><div class="sk" style="height:13px;width:55%"></div><div class="sk" style="height:11px;width:35%;margin-top:8px"></div></div><div class="sk" style="height:13px;width:56px"></div></div>`).join('')}</div>`;
}
function sw(on, attrs = '') { return `<button class="switch ${on ? 'on' : ''}" role="switch" aria-checked="${on}" ${attrs}></button>`; }
function bindSwitches(el, cb) {
  $$('.switch', el).forEach(s => s.onclick = () => { const on = !s.classList.contains('on'); s.classList.toggle('on', on); s.setAttribute('aria-checked', on); haptic(8); cb && cb(s, on); });
}
function txRow(t) {
  const cat = D.cats[t.cat];
  const left = t.person ? avatar({ name: t.name, hue: t.hue }) : logo(t.name, t.hue, cat.icon);
  return `<button class="row" data-sheet="tx" data-p='{"id":"${t.id}"}'>${left}<div class="main"><div class="t1">${t.name}</div><div class="t2">${t.note || cat.name}, ${t.time}</div></div><div class="end"><div class="t1 ${t.amt > 0 ? 'pos' : ''}">${moneyT(t.amt, { sign: t.amt > 0 })}</div></div></button>`;
}

/* ───────── Halo: the assistant's mark. States follow the work being done. ───────── */
const HALO_IN = '<span class="q-sh"></span><span class="q-ring"></span><span class="q-arc"></span><span class="q-core"><span class="q-field"></span><span class="q-spec"></span><span class="q-okring"></span><i class="q-dt d1"></i><i class="q-dt d2"></i><i class="q-dt d3"></i><i class="q-dt d4"></i><i class="q-dt d5"></i><span class="q-ck"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path pathLength="1" d="m5.5 12.5 4 4L18.5 7.5"></path></svg></span></span>';
const HALO_STATES = ['ready','listening','thinking','search','verify','send','bill','compare','save','invest','answer','done','confirm','confused','offline'];
function halo(state = 'ready', size = 40, cls = '') { return `<div class="hq s-${state} ${cls}" style="--s:${size}px" aria-hidden="true">${HALO_IN}</div>`; }
function haloSet(el, state) {
  if (!el) return;
  HALO_STATES.forEach(s => el.classList.remove('s-' + s));
  void el.offsetWidth; // restart one-shot animations such as the check
  el.classList.add('s-' + state);
}

/* ───────── Halo: introduction, touch, attention ───────── */
const HALO_MEET = [
  ['ready', 'Ready', 'One dot, breathing. I’m here when you need me.'],
  ['thinking', 'Thinking', 'Three dots circling while I work something out.'],
  ['search', 'Looking it up', 'One dot searches; what I find lights up.'],
  ['send', 'Money on its way', 'A dot travels from you to them.'],
  ['compare', 'Finding a better rate', 'Bars rise; the best one stays bright.'],
  ['confirm', 'I need your OK', 'Everything stops until you confirm.'],
  ['done', 'Done', 'A check, then back to ready.'],
];
/* plays the states in order, each with a caption; returns a stop function */
function haloShowcase(root, ms = 2800) {
  const hq = $('.hq', root), t = $('.meet-t', root), s = $('.meet-s', root), dots = $$('.meet-dots i', root);
  let i = -1, timer = 0;
  const step = n => {
    i = (n ?? i + 1) % HALO_MEET.length;
    const [st, title, sub] = HALO_MEET[i];
    haloSet(hq, st);
    if (t) { t.classList.remove('in'); void t.offsetWidth; t.textContent = title; t.classList.add('in'); }
    if (s) { s.classList.remove('in'); void s.offsetWidth; s.textContent = sub; s.classList.add('in'); }
    dots.forEach((d, j) => d.classList.toggle('on', j === i));
    clearTimeout(timer); timer = setTimeout(() => root.isConnected ? step() : 0, st === 'done' ? 2000 : ms);
  };
  root.addEventListener('click', () => { haptic(6); step(); });
  step(0);
  return () => clearTimeout(timer);
}
function meetHTML(size = 120) {
  return `<div class="meet">${halo('ready', size)}<div class="meet-t"></div><div class="meet-s"></div><div class="meet-dots">${HALO_MEET.map(() => '<i></i>').join('')}</div></div>`;
}
function meetOneFI() {
  let stop = () => {};
  Sheet.open(`<h3>Meet OneFI</h3><p class="muted" style="margin-top:4px;font-size:14px">How I show what I’m doing. Tap to see the next one.</p>${meetHTML(132)}`, {
    mount(sh) { stop = haloShowcase($('.meet', sh)); },
    onClose() { stop(); },
  });
}

/* touch: a soft pulse and ripple, wherever the halo is */
document.addEventListener('pointerdown', e => {
  const h = e.target.closest && e.target.closest('.hq');
  if (!h || h.closest('.meet')) return;
  h.classList.remove('tap'); void h.offsetWidth; h.classList.add('tap'); haptic(8);
  setTimeout(() => h.classList.remove('tap'), 750);
}, { passive: true });

/* attention: when idle, the dot glances toward something that deserves a look, then settles */
function haloGlance(hq, target, onPeak) {
  if (!hq || !hq.classList.contains('s-ready') || hq.classList.contains('glance')) return false;
  const a = hq.getBoundingClientRect();
  let dx = (Math.random() - .5) * 2, dy = (Math.random() - .5);
  if (target) { const b = target.getBoundingClientRect(); dx = (b.left + b.width / 2) - (a.left + a.width / 2); dy = (b.top + b.height / 2) - (a.top + a.height / 2); }
  const n = Math.hypot(dx, dy) || 1;
  hq.style.setProperty('--lx', (dx / n * .075).toFixed(3));
  hq.style.setProperty('--ly', (dy / n * .075).toFixed(3));
  hq.style.setProperty('--gx', (50 + dx / n * 16).toFixed(1) + '%');
  hq.style.setProperty('--gy', (50 + dy / n * 16).toFixed(1) + '%');
  hq.classList.add('glance');
  setTimeout(() => onPeak && onPeak(), 700);
  setTimeout(() => { hq.style.removeProperty('--gx'); hq.style.removeProperty('--gy'); }, 2000);
  setTimeout(() => hq.classList.remove('glance'), 2800);
  return true;
}
