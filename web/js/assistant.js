// OneFI — conversational banking (storyboard flow + analytics), fully simulated.
const SCRIPT = ['Pay $1,000 to Shroff', 'Update my Citi password', 'Now pay my internet bill', 'Make a term deposit with $5,000', 'I am bullish on FIS, can you buy 500 shares for me?', 'Order a turkey for each of my team members for Thanksgiving'];
const AS = { html: null, busy: false, pending: null, script: 0, demo: store.get('demo', true), confirm: store.get('askFirst', false), seq: 0 };

const clock = (d = new Date()) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const longDate = (d = new Date()) => `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
const addMonths = (n, d = new Date()) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
const addDays = (n, d = new Date()) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const ref = (p, n = 7) => p + Array.from({ length: n }, () => '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 34)]).join('');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const chq = () => D.accounts[0];
const BOT = (cls = '') => `<div class="botmark ${cls}">${ic('spark')}</div>`;

/* ───────── intent parsing ───────── */
function parseAmount(q) { const m = q.match(/\$\s?([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s?(?:dollars|usd|bucks)/i); return m ? parseFloat((m[1] || m[2]).replace(/,/g, '')) : null; }
function findContact(q) {
  const ql = q.toLowerCase();
  return D.contacts.find(c => ql.includes(c.name.toLowerCase()) || ql.includes(c.name.split(' ')[0].toLowerCase()));
}
function intent(q) {
  const ql = q.toLowerCase().trim();
  if (AS.pending && AS.pending.k === 'turkey' && /^(place order|order it|yes|yep|sure|ok|okay|go ahead|do it|confirm)\b/.test(ql)) return { k: 'turkeyOrder' };
  if (/\bpassword\b/.test(ql)) return { k: 'citipw' };
  if (/\btrack\b.*\b(turkey|deliver)/.test(ql)) return { k: 'turkeyTrack' };
  if (/\bturkey|\bthanksgiving\b/.test(ql)) return { k: 'turkey' };
  if (AS.pending && /^(yes|yep|yeah|sure|ok|okay|go ahead|yes,? go ahead|do it|confirm|please do)\b/.test(ql)) return { k: 'yes' };
  if (AS.pending && /^(no|nope|not now|cancel|stop|don'?t)\b/.test(ql)) return { k: 'no' };
  let m = ql.match(/\b(?:buy|purchase|get)\s+(\d[\d,]*)\s*(?:shares?|stocks?|units?)?\s*(?:of\s+)?([a-z]{1,5})?\b/);
  if (m || /\bbullish on\b|\bshares?\b/.test(ql)) {
    const qty = m ? parseInt(m[1].replace(/,/g, '')) : null;
    const tick = Object.keys(D.quotes).find(t => new RegExp(`\\b${t.toLowerCase()}\\b`).test(ql)) || (m && m[2] ? m[2].toUpperCase() : null);
    return { k: 'buy', qty, tick };
  }
  if (/\b(term deposit|gic|fixed deposit|\bfd\b|cd\b|certificate of deposit)/.test(ql)) {
    const months = (ql.match(/(\d+)\s*(month|mo)/) || [])[1] ? +ql.match(/(\d+)\s*(month|mo)/)[1] : (ql.match(/(\d+)\s*year/) || [])[1] ? 12 * ql.match(/(\d+)\s*year/)[1] : 12;
    return { k: 'td', amt: parseAmount(q), months };
  }
  if (/\bbill\b|\binternet\b|\bhydro\b|\belectric|\bphone bill|\bwater bill|\brent\b/.test(ql) && /\bpay|bill/.test(ql)) {
    const map = [['internet', 'Rogers'], ['wifi', 'Rogers'], ['rogers', 'Rogers'], ['electric', 'City Power'], ['power', 'City Power'], ['hydro', 'City Power'], ['water', 'Metro Water'], ['phone', 'Orbit'], ['mobile', 'Orbit'], ['rent', 'Parkside'], ['parkside', 'Parkside'], ['apartment', 'Parkside'], ['city power', 'City Power'], ['orbit', 'Orbit'], ['metro', 'Metro Water']];
    const hit = map.find(([w]) => ql.includes(w));
    return { k: 'bill', biller: hit ? hit[1] : null };
  }
  if (/\b(pay|send|transfer|e-?transfer|give)\b/.test(ql) && !/\bmy (card|credit)/.test(ql)) {
    return { k: 'pay', amt: parseAmount(q), to: findContact(q), raw: (ql.match(/\bto\s+([a-z]+)/) || [])[1] };
  }
  if (/^send money$/.test(ql)) return { k: 'pay' };
  if (/^pay a bill$/.test(ql)) return { k: 'bill' };
  if (/^invest$/.test(ql)) return { k: 'invest' };
  if (/my accounts|balance|how much (do|have) i|net worth/.test(ql)) return { k: 'balance' };
  const old = typeof intentOf === 'function' ? intentOf(q) : 'general';
  return { k: old };
}

/* ───────── rendering helpers ───────── */
function thread() { return $('#thread'); }
function scrollEnd(smooth = true) { const b = $('#cb'); if (b) b.scrollTo({ top: b.scrollHeight, behavior: smooth ? 'smooth' : 'auto' }); }
function save() { const t = thread(); if (t) AS.html = t.innerHTML; const r = $('#rail'); if (r) AS.rail = r.innerHTML; }
/* Halo mood: the header mark and its line follow what the assistant is doing */
const MOOD_LINE = { ready: 'Online · Secure', listening: 'Listening…', thinking: 'Thinking…', answer: 'Replying…', search: 'Looking it up…', verify: 'Verifying…', send: 'Sending securely…', bill: 'Paying your bill…', compare: 'Comparing rates…', save: 'Opening your deposit…', invest: 'Placing your order…', done: 'Done', confirm: 'Waiting for your OK', confused: 'Didn’t catch that' };
let moodT = 0;
function mood(state, line) {
  AS.mood = state; clearTimeout(moodT);
  const h = $('.chathead'); if (!h) return;
  haloSet($('.hq', h), state);
  $('.who .t2', h).textContent = line || MOOD_LINE[state] || MOOD_LINE.ready;
  h.classList.toggle('working', !['ready', 'done'].includes(state));
  if (state === 'done' || state === 'confused') moodT = setTimeout(() => mood('ready'), state === 'done' ? 1800 : 2600);
}
function working(on) { if (!on && ['done', 'confused'].includes(AS.mood)) return; mood(on ? 'thinking' : 'ready'); }
const MARK = (cls = '') => { const sz = { head: 40, xl: 76, mini: 28, tiny: 22 }[cls] || 40; return halo('ready', sz, cls + (cls === 'mini' || cls === 'tiny' ? ' still' : '')); };
const BOTAV = () => MARK('mini');

function userMsg(text) {
  const id = 'u' + (++AS.seq);
  thread().insertAdjacentHTML('beforeend', `<div class="urow" id="${id}"><div class="uline"><div class="ubub">${esc(text)}</div><div class="uav">${initials(D.user.first + ' ' + D.user.last)}</div></div><div class="mmeta">${clock()} · <span class="st">Sent</span> <span class="ticks">✓</span></div></div>`);
  setTimeout(() => { const r = document.getElementById(id); if (r) { const t = $('.ticks', r); t.textContent = '✓✓'; t.classList.add('read'); $('.st', r).textContent = 'Read'; save(); } }, 700);
  scrollEnd();
}
function botRow() {
  const row = document.createElement('div'); row.className = 'brow';
  row.innerHTML = `${BOTAV()}<div class="bcol"></div>`;
  thread().appendChild(row);
  return $('.bcol', row);
}
function rowHalo(col, state) {
  const av = col && col.parentElement && col.parentElement.querySelector(':scope > .hq'); if (!av) return;
  if (state === 'still') { haloSet(av, 'ready'); av.classList.add('still'); return; }
  av.classList.remove('still'); haloSet(av, state);
}
async function typingDots(col, ms = 650) {
  rowHalo(col, 'thinking'); if (!['send', 'bill', 'verify', 'search', 'compare', 'save', 'invest', 'confirm'].includes(AS.mood)) mood('thinking');
  const t = document.createElement('div'); t.className = 'bub typing'; t.innerHTML = '<i></i><i></i><i></i>';
  col.appendChild(t); scrollEnd(); await wait(ms * PACE); t.remove();
}
async function botSay(col, html, opts = {}) {
  if (!opts.noDots) await typingDots(col, opts.dots || 600);
  rowHalo(col, 'answer'); if (['thinking', 'ready', 'answer'].includes(AS.mood)) mood('answer');
  const b = document.createElement('div'); b.className = 'bub'; col.appendChild(b);
  for (const para of html.split('\n\n')) {
    const p = document.createElement('p'); b.appendChild(p);
    const toks = para.split(/(\s+|<[^>]+>)/).filter(Boolean); let acc = '';
    for (const t of toks) { acc += t; if (/^</.test(t) || /^\s+$/.test(t)) continue; p.innerHTML = acc + '<span class="caret"></span>'; await wait(14 + Math.random() * 20); }
    p.innerHTML = acc;
  }
  rowHalo(col, 'still'); if (AS.mood === 'answer') mood(AS.busy ? 'thinking' : 'ready');
  scrollEnd(); return b;
}
function stamp(col) { col.insertAdjacentHTML('beforeend', `<div class="mmeta" style="margin-top:-2px">${clock()}</div>`); }
function quickReplies(col, items) {
  col.insertAdjacentHTML('beforeend', `<div class="qrs">${items.map(i => `<button class="qr" data-a="say" data-t="${esc(i)}">${esc(i)}</button>`).join('')}</div>`);
  scrollEnd();
}
function setRail(items, noNext) {
  const r = $('#rail'); if (!r) return;
  const nxt = !noNext && AS.demo && AS.script < SCRIPT.length ? [{ t: SCRIPT[AS.script], i: 'spark', next: 1 }] : [];
  const all = [...nxt, ...items.filter(x => !nxt.length || x.t !== nxt[0].t)];
  r.innerHTML = all.map((x, n) => `<button class="${x.next ? 'next' : ''}" data-a="say" data-t="${esc(x.t)}" style="animation-delay:${n * .05}s">${x.i ? ic(x.i) : ''}${esc(x.t)}</button>`).join('');
  r.scrollLeft = 0; AS.rail = r.innerHTML;
}

/* live activity card: ring + timeline */
const STEP_ICONS = { send: ['shield', 'coins', 'send'], bill: ['receipt', 'bank', 'send'], td: ['user', 'bank', 'percent'], tdc: ['finger', 'swap', 'shield'], buy: ['bank', 'invest', 'repeat'], look: ['search', 'pie', 'spark'] };
const SUMMARY = { pw: 'Secure handoff, Citi confirmed, connection refreshed', turkey: 'Kroger checked, turkeys in stock, slots open', tord: 'Addresses verified, paid, 6 deliveries scheduled', send: 'Payee verified, funds checked, sent securely', bill: 'Bill found, paid from Chequing, submitted', td: 'Accounts reviewed, 5 rates compared', tdc: 'Consent confirmed, funds moved, deposit opened', buy: 'E*TRADE linked, quote checked, order placed', look: 'Accounts analysed' };
const STEP_STATES = { pw: ['verify', 'search', 'verify'], turkey: ['search', 'search', 'compare'], tord: ['verify', 'send', 'send'], send: ['verify', 'search', 'send'], bill: ['search', 'bill', 'send'], td: ['search', 'search', 'compare'], tdc: ['verify', 'send', 'save'], buy: ['search', 'thinking', 'invest'], look: ['search', 'compare', 'thinking'] };
function flowHTML(f) {
  return `<div class="mflow"><div class="mf-in">
    <div class="mf-end">${f.a.av}<div class="mf-k">${f.a.t}</div><div class="mf-v" data-bal>${moneyT(f.a.bal)}</div></div>
    <div class="mf-track"><svg viewBox="0 0 112 34" aria-hidden="true"><path d="M6 27 Q56 -3 106 27"/></svg><i class="mf-dot"></i><i class="mf-dot t1"></i><i class="mf-dot t2"></i></div>
    <div class="mf-end r">${f.b.av}<div class="mf-k">${f.b.t}</div><div class="mf-v mf-plus">+${moneyT(f.amt)}</div></div></div></div>`;
}
async function moneyMoves(card, f, ms) {
  const m = $('.mflow', card); if (!m) return;
  m.classList.add('show'); scrollEnd();
  await wait(380); scrollEnd();
  m.classList.add('go'); m.style.setProperty('--d', (ms * .62) + 'ms');
  const bal = $('[data-bal]', m); countUp(bal, f.a.bal - f.amt, ms * .62, { from: f.a.bal });
  setTimeout(() => { m.classList.add('landed'); haptic(14); }, ms * .62 + 60);
}
async function progressCard(col, title, sub, steps, kind = 'send', flow = null) {
  const ST = STEP_STATES[kind] || STEP_STATES.look;
  mood(ST[0]);
  const card = document.createElement('div'); card.className = 'live';
  card.innerHTML = `<div class="lhead">${halo(ST[0], 40)}
    <div style="min-width:0"><div class="t1">${title}</div><div class="t2">${sub}</div></div></div>
    <div class="tl"></div>${flow ? flowHTML(flow) : ''}<div class="lbar"><i style="width:4%"></i></div><div class="lfoot">${ic('lock')} Bank‑grade encryption<span class="meta">Step 1 of ${steps.length}</span></div>`;
  col.appendChild(card); scrollEnd();
  const tl = $('.tl', card), bar = $('.lbar i', card), hq = $('.lhead .hq', card), meta = $('.meta', card);
  for (let i = 0; i < steps.length; i++) {
    const [m, ...rest] = steps[i].split(' · ');
    tl.insertAdjacentHTML('beforeend', `<div class="ts"><div class="dot"><span class="mini"></span></div><div class="tx"><div class="m">${m}</div>${rest.length ? `<div class="s">${rest.join(' · ')}</div>` : ''}</div></div>`);
    meta.textContent = `Step ${i + 1} of ${steps.length}`;
    const st = ST[Math.min(i, ST.length - 1)]; if (i) { haloSet(hq, st); mood(st); }
    const half = (i + .5) / steps.length;
    bar.style.width = `${Math.round(half * 100)}%`; scrollEnd();
    const dur = (i === steps.length - 1 ? (flow ? 1900 : 1300) : 950 + Math.random() * 300) * PACE;
    if (flow && i === steps.length - 1) moneyMoves(card, flow, dur);
    await wait(dur);
    const s = tl.lastElementChild; s.classList.add('done'); s.querySelector('.dot').innerHTML = ic('check');
    const full = (i + 1) / steps.length;
    bar.style.width = `${Math.round(full * 100)}%`; haptic(6);
  }
  meta.textContent = 'Complete';
  haloSet(hq, 'done'); if (kind !== 'look') mood('done');
  await wait(kind === 'look' ? 300 : 1100);
  card.style.transition = 'opacity .25s, transform .25s'; card.style.opacity = 0; card.style.transform = 'scale(.98)';
  await wait(220);
  const pill = document.createElement('button'); pill.className = 'donepill'; pill.dataset.a = 'steps';
  pill.dataset.steps = steps.map(x => x.split(' · ')[0].replace(/…$/, '')).join('|');
  pill.innerHTML = `<span class="dk">${ic('check')}</span>${SUMMARY[kind] || 'Done'}${ic('down', 'xs')}`;
  col.insertBefore(pill, card);
  return card;
}

/* ticket receipt */
function barcode(seed) {
  let x = 0, out = ''; let h = 0; for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const r = rng(h);
  while (x < 200) { const w = 1 + Math.floor(r() * 3); if (r() > .35) out += `<rect x="${x}" y="0" width="${w}" height="30" style="fill:var(--text)"/>`; x += w + 1; }
  return `<svg viewBox="0 0 200 30" preserveAspectRatio="none">${out}</svg>`;
}
function burst() {
  return `<div class="burst">${Array.from({ length: 18 }, (_, i) => { const a = (i / 18) * Math.PI * 2 + Math.random() * .3, d = 60 + Math.random() * 60; return `<i style="--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d - 10}px;--r:${Math.random() * 360}deg;${i % 3 ? '' : 'border-radius:50%;'}${i % 4 ? '' : 'width:4px;height:9px;'}"></i>`; }).join('')}</div>`;
}
function amtHTML(v) { const t = moneyT(v); const [w, c] = t.split('.'); return `${w}<span class="c">.${c}</span>`; }
/* institution marks: the owner-supplied logos, or a plain text badge where none was supplied */
function BLOGO(k, cls = '') { return LOGOS[k] ? `<span class="blogo ${k} ${cls}"><img src="${LOGOS[k]}" alt="${k}"></span>` : `<span class="blogo ${k} txt ${cls}"><b>${k.toUpperCase()}</b></span>`; }
function INST(k, text) { return `<span class="inst">${LOGOS[k] ? `<img class="ilogo ${k}" src="${LOGOS[k]}" alt="${k}">` : `<b class="ibadge ${k}">${k.toUpperCase()}</b>`}<span>${text}</span></span>`; }
function ticket({ amount, big, label, who, rows, extra, ref: rf, note, actions, status = 'Completed' }) {
  return `<div class="ticket">
    <div class="tk-top"><div class="tk-row"><div class="tk-brand">${halo('ready', 18, 'still')}OneFI</div><div class="tk-pill"><b></b>${status}</div></div>
      <div class="tk-mid"><div class="tk-ok"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>${burst()}
        <div class="tk-amt" ${amount != null ? `data-v="${amount}"` : ''}>${amount != null ? amtHTML(amount) : big}</div><div class="tk-lbl">${label}</div>
        ${who ? `<div class="tk-who">${who.av}<span>${who.t}</span></div>` : ''}</div></div>
    <div class="tk-perf"></div>
    <div class="tk-body">${rows.map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}</div>
    ${extra ? `<div class="tk-extra">${extra}</div>` : ''}
    <div class="tk-foot"><div class="barcode">${barcode(rf || label)}<div class="rf">${rf || ''}<br>${longDate()}</div></div>${note ? `<div class="tk-note">${note}</div>` : ''}
      <div class="cacts">${actions.map(([t, a, f, data]) => `<button class="${f ? 'f' : 'o'}" data-a="${a}" ${data || ''}>${t}</button>`).join('')}</div></div>
  </div>`;
}
function animateTicket(col) {
  const el = [...col.querySelectorAll('.tk-amt[data-v]')].pop(); if (!el) return;
  const to = +el.dataset.v, t0 = performance.now();
  const f = now => { const p = Math.min(1, (now - t0) / 900), e = 1 - Math.pow(1 - p, 3); el.innerHTML = amtHTML(to * e); if (p < 1) requestAnimationFrame(f); else el.innerHTML = amtHTML(to); };
  requestAnimationFrame(f);
}
async function finish(col, _unused, card, after) {
  col.insertAdjacentHTML('beforeend', card); stamp(col); haptic(25);
  animateTicket(col); after && after(col);
  scrollEnd(); working(false); save();
}

/* confirm-before-moving-money (optional) */
function confirmCard(col, title, rows, cta) {
  return new Promise(resolve => {
    const id = 'cf' + (++AS.seq);
    col.insertAdjacentHTML('beforeend', `<div class="offer" id="${id}"><div class="of-top"><div class="of-h"><div class="mk">${ic('shield', 'sm')}</div><div><div class="t1">${title}</div><div class="t2">Check the details before I continue</div></div></div></div>
      <div class="of-body"><div class="kvs" style="border-top:0;margin-top:0">${rows.map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}</div>
      <div class="cacts"><button class="o" data-r="0"><span>Cancel</span></button><button class="f" data-r="1">${ic('finger', 'sm')}<span>${cta}</span></button></div></div></div>`);
    scrollEnd(); mood('confirm');
    const el = document.getElementById(id);
    $$('[data-r]', el).forEach(b => b.onclick = async () => {
      $('.cacts', el).classList.add('dim'); b.classList.add('chosen');
      if (b.dataset.r === '1') { const ok = await pinSheet('Confirm with fingerprint', title); if (!ok) { $('.cacts', el).classList.remove('dim'); b.classList.remove('chosen'); return; } }
      mood(b.dataset.r === '1' ? 'verify' : 'ready'); resolve(b.dataset.r === '1');
    });
  });
}

/* term deposit offer */
const TD_RATES = [
  ['AMEX Bank', { 6: 4.40, 12: 4.85, 24: 4.60 }],
  ['OneFI', { 6: 3.90, 12: 4.10, 24: 4.00 }],
  ['Northfield Trust', { 6: 3.75, 12: 3.95, 24: 3.85 }],
  ['Harbor CU', { 6: 3.60, 12: 3.80, 24: 3.90 }],
  ['Your savings', { 6: 2.25, 12: 2.25, 24: 2.25 }],
];
function offerInner(p) {
  const rate = TD_RATES[0][1][p.months], next = TD_RATES[1][1][p.months];
  const interest = p.amt * rate / 100 * p.months / 12;
  p.rate = rate; p.interest = interest;
  const rows = TD_RATES.map(([n, r]) => [n, r[p.months]]).sort((a, b) => b[1] - a[1]);
  const max = rows[0][1];
  return `<div class="of-top"><div class="of-h"><div class="mk">AMEX</div><div><div class="t1">AMEX Bank</div><div class="t2">Savings •• ${D.linked.amex.num} · via aggregator</div></div><span class="best">BEST RATE</span></div>
      <div class="of-rate"><b>${rate.toFixed(2)}<small>%</small></b><span>p.a. fixed<br>${p.months} months</span></div>
      <div class="of-seg">${[6, 12, 24].map(m => `<button class="${m === p.months ? 'on' : ''}" data-a="term" data-m="${m}">${m} months</button>`).join('')}</div></div>
    <div class="of-body">
      <div class="tk-sec" style="margin-top:14px"><span>Your ${moneyT(p.amt, { noCents: true })} over ${p.months} months</span><span style="color:var(--text)">+${moneyT(interest)}</span></div>
      <div class="of-proj"></div>
      <div class="of-ends"><div>Today<b>${moneyT(p.amt)}</b></div><div style="text-align:right">${longDate(addMonths(p.months))}<b>${moneyT(p.amt + interest)}</b></div></div>
      <div class="tk-sec" style="margin-top:16px"><span>Rates found across your banks</span><span>${p.months} mo</span></div>
      <div class="cmp">${rows.map(([n, r], i) => `<div class="r ${i === 0 ? 'top' : ''}"><span class="n">${n}</span><span class="b"><i style="width:${r / max * 100}%;animation-delay:${i * .07}s"></i></span><span class="p">${r.toFixed(2)}%</span></div>`).join('')}</div>
      <div class="kvs">${[['Deposit amount', moneyT(p.amt)], ['Est. interest earned', '+' + moneyT(interest)], ['Next best rate', next.toFixed(2) + '%']].map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v ${k.startsWith('Est') ? 'pos' : ''}">${v}</span></div>`).join('')}</div>
      <div class="cacts"><button class="o" data-a="say" data-t="Not now">Not now</button><button class="f" data-a="say" data-t="Yes, go ahead">Yes, go ahead</button></div></div>`;
}
function drawProjection(el, p) {
  const c = $('.of-proj', el); if (!c) return;
  const v = Array.from({ length: p.months + 1 }, (_, i) => p.amt + p.interest * i / p.months);
  v.unshift(p.amt - p.interest * .15);
  areaChart(c, v, { h: 84, color: 'var(--primary)', sw: 2.2, fillOpacity: .14, pad: 10 });
}

/* FIS market data (real closes, Nov 2026) */
const FIS_NOV = [['Nov 2', 40.15], ['Nov 3', 38.99], ['Nov 4', 29.76], ['Nov 6', 28.73], ['Nov 9', 28.34], ['Nov 10', 28.31], ['Nov 11', 30.21], ['Nov 12', 28.36], ['Nov 13', 29.54], ['Nov 16', 28.30], ['Nov 17', 27.47], ['Nov 18', 27.07]];
function fisQuote(qty, cost) {
  const lo = 26.77, hi = 68.37, px = D.quotes.FIS.price;
  return `<div class="tk-sec"><span>FIS this month</span><span class="neg">−32.6% since Nov 2</span></div>
    <div class="qhead"><div class="px">${moneyT(px)}</div><div class="neg" style="font-size:12.5px;font-weight:600">−$0.40 (−1.47%) today</div></div>
    <div class="qchart"></div><div class="qaxis"><span>Nov 2</span><span>Nov 4 earnings</span><span>Nov 18</span></div>
    <div class="rng52"><div style="font-size:11px;color:var(--text-2)">52‑week range</div><div class="bar"><i style="left:${(px - lo) / (hi - lo) * 100}%"></i></div><div class="ends"><span>${moneyT(lo)}</span><span>${moneyT(hi)}</span></div></div>
    <div class="qstats">${[['Day range', '$26.77 – $27.45'], ['Market cap', '$13.9B'], ['P/E (TTM)', '4.0'], ['Dividend yield', '6.41%'], ['Your shares', qty.toLocaleString()], ['Position value', moneyT(cost)]].map(([k, v]) => `<div><div class="k">${k}</div><div class="v">${v}</div></div>`).join('')}</div>`;
}

/* ───────── flows ───────── */
const NB = ' ';
const FLOWS = {
  async pay(col, it) {
    let c = it.to, amt = it.amt;
    if (!c && it.raw && !['my', 'the', 'a'].includes(it.raw)) {
      await botSay(col, `I couldn’t find <b>${esc(it.raw[0].toUpperCase() + it.raw.slice(1))}</b> in your payees. Who would you like to pay?`);
      quickReplies(col, D.contacts.slice(0, 4).map(x => `Pay ${amt ? moneyT(amt, { noCents: amt % 1 === 0 }) + ' ' : ''}to ${x.name.split(' ')[0]}`)); return;
    }
    if (!c) { await botSay(col, 'Sure. Who would you like to pay?'); quickReplies(col, D.contacts.slice(0, 4).map(x => x.name)); AS.pending = { k: 'payWho', amt }; return; }
    if (!amt) { await botSay(col, `How much would you like to send to <b>${c.name}</b>?`); quickReplies(col, [50, 100, 250, 1000].map(v => `Pay $${v.toLocaleString()} to ${c.name.split(' ')[0]}`)); return; }
    if (amt > chq().bal) {
      await botSay(col, `You have <b>${moneyT(chq().bal)}</b> in Everyday Chequing, which isn’t enough for ${moneyT(amt)}. I can move the difference from High‑yield savings first.`);
      quickReplies(col, [`Pay ${moneyT(Math.floor(chq().bal), { noCents: true })} to ${c.name.split(' ')[0]}`, 'My accounts']); return;
    }
    const email = c.handle.includes('@') && c.handle.includes('.') ? c.handle : c.handle.replace('@', '') + '@email.com';
    if (AS.confirm && !(await confirmCard(col, `Send ${moneyT(amt)} to ${c.name}`, [['From', `Citi Checking ••${NB}6120`], ['To', `${c.name} (${email})`], ['Method', 'Interac e‑Transfer®']], `Send ${moneyT(amt)}`))) { await botSay(col, 'Okay, I’ve cancelled that. Nothing was sent.'); working(false); return; }
    const card = await progressCard(col, 'Sending payment', `Interac e‑Transfer® to ${c.name}`, [
      `Payee verified · ${c.name} (${email})`, `Funds available in Citi Checking ••${NB}6120 · Balance ${moneyT(D.linked.citi.bal)}`, `Sending ${moneyT(amt)} securely… · Encrypted end to end`], 'send', { a: { av: BLOGO('citi'), t: 'Citi Checking', bal: D.linked.citi.bal }, b: { av: avatar(c), t: c.name.split(' ')[0] }, amt });
    card.remove();
    D.linked.citi.bal -= amt;
    D.tx.unshift({ id: 't' + Date.now(), name: c.name, amt: -amt, date: new Date(2026, 10, 18), time: clock(), note: 'Interac e‑Transfer', cat: 'transfer', hue: c.hue, acct: 'citi', person: true });
    await botSay(col, `Done! Your money is on its way to ${c.name}. ✅`, { dots: 250 });
    const rf = ref('ET-', 7);
    await finish(col, '', ticket({ amount: amt, label: `Sent to ${c.name}`, who: { av: avatar(c), t: email }, rows: [['From', INST('citi', `Checking ••${NB}6120`)], ['Method', 'Interac e‑Transfer®'], ['Confirmation', rf], ['Date', `${longDate()} · ${clock()}`], ['Citi balance', moneyT(D.linked.citi.bal)]], ref: rf, note: `${c.name.split(' ')[0]} gets an email and can deposit right away.`, actions: [['Share receipt', 'share'], ['Done', 'done', 1]] }));
    if (/shroff/i.test(c.name)) AS.script = Math.max(AS.script, 1);
    setRail([{ t: 'Send another payment', i: 'send' }, { t: 'My accounts', i: 'bank' }]);
    if (!D.linked.citi.pwOk) await pwAlert(col);
  },

  async bill(col, it) {
    if (!it.biller) {
      if (!D.bills.length) { await botSay(col, 'You’re all paid up. There are no bills due right now.'); return; }
      await botSay(col, 'Which bill would you like to pay?'); quickReplies(col, D.bills.slice(0, 4).map(b => `Pay my ${b.name} bill`)); return;
    }
    const b = D.bills.find(x => x.name.startsWith(it.biller));
    if (!b) { await botSay(col, `Your ${it.biller === 'Rogers' ? 'Rogers Internet' : it.biller} bill is already paid. I’ll remind you when the next one arrives.`); return; }
    const due = addDays(b.days), dueS = `${MONTHS[due.getMonth()]} ${due.getDate()}`;
    const acct = b.acct || (2000 + b.amt * 7 | 0).toString().slice(-4);
    if (AS.confirm && !(await confirmCard(col, `Pay ${b.name} ${moneyT(b.amt)}`, [['From', `BMO Harris Checking ••${NB}3307`], ['Account', `••${NB}` + acct], ['Due', dueS]], `Pay bill · ${moneyT(b.amt)}`))) { await botSay(col, 'No problem, the bill is still unpaid.'); working(false); return; }
    const card = await progressCard(col, 'Paying your bill', `${b.name} · Acct ••${NB}${acct}`, [
      `Latest bill found · ${moneyT(b.amt)} due ${dueS}`, `Paying from BMO Harris Checking ••${NB}3307 · Balance ${moneyT(D.linked.bmo.bal)}`, 'Submitting payment to payee… · Posts in 1 business day'], 'bill', { a: { av: BLOGO('bmo'), t: 'BMO Harris', bal: D.linked.bmo.bal }, b: { av: LOGO(b.name[0], 'rg'), t: b.name.split(' ')[0] }, amt: b.amt });
    card.remove();
    D.linked.bmo.bal -= b.amt; D.bills = D.bills.filter(x => x !== b);
    D.tx.unshift({ id: 't' + Date.now(), name: b.name, amt: -b.amt, date: new Date(2026, 10, 18), time: clock(), note: 'Bill payment', cat: 'bills', hue: 12, acct: 'bmo', person: false });
    const kind = /internet/i.test(b.name) ? 'internet' : /power/i.test(b.name) ? 'electricity' : /water/i.test(b.name) ? 'water' : /mobile/i.test(b.name) ? 'phone' : 'rent';
    await botSay(col, `Your ${kind} bill is paid. You’re all set until next month. 🎉`, { dots: 250 });
    const hist = [['Jun', +(b.amt * .944).toFixed(2)], ['Jul', b.amt], ['Aug', +(b.amt * 1.05).toFixed(2)], ['Sep', b.amt], ['Oct', +(b.amt * .97).toFixed(2)], ['Nov', b.amt]];
    const mn = Math.min(...hist.map(h => h[1])) * .9;
    const mx = Math.max(...hist.map(h => h[1]));
    const extra = `<div class="tk-sec"><span>Last 6 bills</span><span>Avg ${moneyT(hist.reduce((s2, h) => s2 + h[1], 0) / 6)}</span></div>
      <div class="minibars">${hist.map(([m, v], i) => `<div><i style="height:${Math.round(14 + (v - mn) / (mx - mn) * 34)}px;animation-delay:${i * .05}s"></i><span>${m}</span></div>`).join('')}</div>
      <div class="inline-sug">${ic('repeat')}<div>Turn on autopay so ${b.name} is paid on the due date.</div><button data-a="autopay" data-n="${esc(b.name)}">Turn on</button></div>`;
    const rf = ref('BP-', 7);
    await finish(col, '', ticket({ amount: b.amt, label: `Paid to ${b.name}`, who: { av: `<div class="avatar" style="width:26px;height:26px">${ic(b.icon, 'xs')}</div>`, t: `Account ••${NB}${acct}` }, rows: [['Account', `••${NB}` + acct], ['From', INST('bmo', `Checking ••${NB}3307`)], ['Confirmation', rf], ['Posted', longDate()]], extra, ref: rf, actions: [['View bill', 'bill', 0, `data-n="${esc(b.name)}" data-v="${b.amt}" data-acct="${acct}"`], ['Done', 'done', 1]] }));
    if (/Rogers/.test(b.name)) AS.script = Math.max(AS.script, 3);
    setRail([{ t: 'What bills are left?', i: 'bill' }, { t: 'My accounts', i: 'bank' }]);
  },

  async td(col, it) {
    const amt = it.amt;
    if (!amt) { await botSay(col, 'How much would you like to put in a term deposit?'); quickReplies(col, ['Make a term deposit with $5,000', 'Make a term deposit with $10,000']); return; }
    const months = [6, 12, 24].includes(it.months) ? it.months : 12;
    const card = await progressCard(col, 'Finding your best option', 'Analysing accounts & rates', ['Reviewed your accounts & balances · 3 accounts, 2 linked', 'Checked linked accounts via aggregator · AMEX, E*TRADE', 'Comparing term deposit rates… · 5 offers found'], 'td');
    card.remove();
    const amex = D.linked.amex;
    if (amt > amex.bal + D.accounts[1].bal) { await botSay(col, `That’s more than you have available across your savings (${moneyT(amex.bal + D.accounts[1].bal, { noCents: true })}). Try a smaller amount.`); working(false); return; }
    await botSay(col, `Based on information provided by the aggregator, you have an <b>AMEX Savings account</b> and they are offering the <b>best interest rate</b>.\n\nWould you like me to create a term deposit with AMEX Bank?`, { dots: 300 });
    stamp(col);
    const id = 'of' + (++AS.seq);
    const p = { k: 'td', amt, months, card: id };
    col.insertAdjacentHTML('beforeend', `<div class="offer" id="${id}">${offerInner(p)}</div>`);
    drawProjection(document.getElementById(id), p);
    scrollEnd(); working(false); save();
    AS.pending = p;
    setRail([{ t: 'Yes, go ahead', i: 'check', next: 1 }, { t: 'Not now', i: 'x' }, { t: 'What if I choose 24 months?', i: 'cal' }], true);
  },

  async tdCreate(col, p) {
    const offer = document.getElementById(p.card); if (offer) { $$('.cacts', offer).forEach(c => c.classList.add('dim')); const f = $('.cacts .f', offer); f && f.classList.add('chosen'); }
    if (AS.confirm && !(await confirmCard(col, `Open ${moneyT(p.amt)} term deposit`, [['Bank', 'AMEX Bank'], ['Rate', p.rate.toFixed(2) + '% p.a. (fixed)'], ['Term', p.months + ' months']], 'Open deposit'))) { await botSay(col, 'Okay, I didn’t open it. The offer is valid for 7 days.'); working(false); return; }
    const card = await progressCard(col, 'Creating term deposit', `AMEX Bank · ${p.months} months @ ${p.rate.toFixed(2)}%`, ['Identity & consent confirmed · Open banking consent ✓', `${moneyT(p.amt)} moved from AMEX Savings ••${NB}${D.linked.amex.num}`, 'Opening your term deposit… · Rate locked'], 'tdc', { a: { av: BLOGO('amex'), t: 'AMEX Savings', bal: D.linked.amex.bal }, b: { av: LOGO(ic('lock'), 'vault'), t: 'Term deposit' }, amt: p.amt });
    card.remove();
    D.linked.amex.bal -= p.amt;
    const mat = addMonths(p.months), refn = 'TD-AX-' + Math.floor(10000 + Math.random() * 89999);
    D.deposits.push({ amt: p.amt, rate: p.rate, months: p.months, mat, ref: refn });
    await botSay(col, `All done! 🎉 Your ${moneyT(p.amt, { noCents: p.amt % 1 === 0 })} term deposit with AMEX Bank is now active and earning ${p.rate.toFixed(2)}%.`, { dots: 250 });
    const extra = `<div class="inline-sug">${ic('bell')}<div>I’ll remind you 7 days before it matures on ${longDate(mat)}.</div><button data-a="remind">Got it</button></div>`;
    await finish(col, '', ticket({ amount: p.amt, label: 'Term deposit created with AMEX Bank', status: 'Active', who: { av: BLOGO('amex', 'sm'), t: `${p.rate.toFixed(2)}% p.a. · ${p.months} months` }, rows: [['Bank', INST('amex', 'AMEX Bank')], ['Rate', p.rate.toFixed(2) + '% p.a. (fixed)'], ['Term', p.months + ' months'], ['Maturity date', longDate(mat)], ['Value at maturity', moneyT(p.amt + p.interest)], ['Reference', refn]], extra, ref: refn, actions: [['View details', 'td', 0, `data-i="${D.deposits.length - 1}"`], ['Done', 'done', 1]] }));
    AS.script = Math.max(AS.script, 4);
    setRail([{ t: 'My accounts', i: 'bank' }, { t: 'Is my portfolio too risky?', i: 'pie' }]);
  },

  async buy(col, it) {
    const et = D.linked.etrade;
    if (!it.tick || !D.quotes[it.tick]) {
      await botSay(col, it.tick ? `I couldn’t find a stock with the symbol <b>${esc(it.tick)}</b>. Check the ticker and try again.` : 'Which stock would you like to buy, and how many shares?');
      if (!it.tick) quickReplies(col, ['Buy 500 shares of FIS', 'Buy 10 shares of NOVA']); return;
    }
    const q = D.quotes[it.tick];
    if (!it.qty) { await botSay(col, `${q.name} is trading at <b>${moneyT(q.price)}</b>. How many shares would you like?`); quickReplies(col, [100, 250, 500].map(n => `Buy ${n} shares of ${it.tick}`)); return; }
    const cost = it.qty * q.price;
    if (cost > et.buyingPower) { await botSay(col, `That order would cost about <b>${moneyT(cost)}</b>, more than your E*TRADE buying power of ${moneyT(et.buyingPower)}. You could buy up to <b>${Math.floor(et.buyingPower / q.price).toLocaleString()} shares</b>.`); quickReplies(col, [`Buy ${Math.floor(et.buyingPower / q.price)} shares of ${it.tick}`]); return; }
    if (AS.confirm && !(await confirmCard(col, `Buy ${it.qty} × ${it.tick}`, [['Est. cost', moneyT(cost)], ['Order type', 'Market · Day'], ['Account', `E*TRADE ••${NB}` + et.num]], 'Place order'))) { await botSay(col, 'Order cancelled. Nothing was placed.'); working(false); return; }
    const card = await progressCard(col, 'Placing your order', `E*TRADE · Brokerage ••${NB}${et.num}`, ['Found linked E*TRADE account via aggregator', `${it.tick} quote ${moneyT(q.price)} · Buying power ${moneyT(et.buyingPower, { noCents: true })}`, `Placing market order for ${it.qty.toLocaleString()} shares… · NYSE`], 'buy', { a: { av: BLOGO('etrade'), t: 'Buying power', bal: et.buyingPower }, b: { av: LOGO(it.tick, 'tk'), t: `${it.qty.toLocaleString()} shares` }, amt: cost });
    card.remove();
    et.buyingPower -= cost;
    let h = D.holdings.find(x => x.sym === it.tick);
    if (h && h.qty) { h.qty += it.qty; h.val += cost; } else { h = { id: 'h' + it.tick, sym: it.tick, name: q.name, kind: 'Stock', val: cost, chg: q.chg, ret: 0, hue: 4, qty: it.qty, risk: 'High', broker: 'E*TRADE', about: q.real ? `${q.name} provides banking and payments technology to financial institutions. Price shown is the last trade on ${q.asOf}.` : '' }; D.holdings.unshift(h); }
    D.investTotal += cost;
    await botSay(col, `Your order was placed through your linked <b>E*TRADE</b> account and has been filled.`, { dots: 250 });
    const oid = 'ET-ORD-' + Math.floor(100000 + Math.random() * 899999);
    const real = it.tick === 'FIS';
    await finish(col, '', ticket({ big: `${it.qty.toLocaleString()} × ${it.tick}`, label: 'Bought via E*TRADE · Filled', status: 'Filled', who: { av: BLOGO('etrade', 'sm'), t: `Brokerage ••${NB}${et.num}` }, rows: [['Company', q.short || q.name], ['Order type', 'Market · Day'], ['Avg. fill price', moneyT(q.price)], ['Total cost', moneyT(cost)], ['Broker', INST('etrade', `Brokerage ••${NB}` + et.num)], ['Order ID', oid]], extra: real ? fisQuote(it.qty, cost) : '', ref: oid, note: real ? `Market data as of ${q.asOf}. Live quotes in production.` : 'Simulated price.', actions: [['View portfolio', 'portfolio'], ['Done', 'done', 1]] }),
      c2 => { if (!real) return; const qc = [...c2.querySelectorAll('.qchart')].pop(); if (qc) areaChart(qc, FIS_NOV.map(x => x[1]), { h: 96, color: 'var(--primary)', sw: 2, fillOpacity: .12, pad: 8 }); });
    AS.script = Math.max(AS.script, 5);
    setRail([{ t: 'Is my portfolio too risky?', i: 'pie' }, { t: 'My accounts', i: 'bank' }]);
  },

  async citipw(col) {
    const L = D.linked.citi;
    if (L.pwOk) { await botSay(col, `Your Citi password is up to date. The next change is due ${L.pwNext}.`); return; }
    $$('.pwcard').forEach(x => x.classList.add('locked'));
    await botSay(col, 'I’ll open Citi’s secure page. You set the new password there, and OneFI only learns that it worked.', { dots: 200 });
    await handoff();
    const card = await progressCard(col, 'Refreshing your Citi connection', `Citi Checking ••${NB}${L.num}`, ['Secure handoff to Citi · Encrypted · OneFI never sees your password', 'Citi confirmed your new password · Changed on Citi’s secure page', 'Connection refreshed · Payments from Citi keep working'], 'pw');
    card.remove();
    L.pwOk = true; L.pwNext = 'Feb 17, 2027';
    await botSay(col, 'All set. Your Citi password is updated and the connection is refreshed. 🔒', { dots: 200 });
    await finish(col, '', `<div class="pwcard done"><div class="pw-top">${BLOGO('citi', 'lg')}<span class="pw-pill ok"><b></b>Connected</span></div>
      <div class="pw-h">Citi password updated</div><div class="pw-s">Changed on Citi’s secure page. Payments from Citi keep working.</div>
      <div class="pw-kv"><div><span>Account</span><span>Citi Checking ••${NB}${L.num}</span></div><div><span>Updated</span><span>${longDate()} · ${clock()}</span></div><div><span>Next change due</span><span>${L.pwNext}</span></div></div></div>`);
    AS.script = Math.max(AS.script, 2);
    setRail([{ t: 'Now pay my internet bill', i: 'bill' }, { t: 'My accounts', i: 'bank' }]);
  },

  async turkey(col) {
    if (D.turkeyOrder) { await botSay(col, `Your team’s turkeys are already ordered. Kroger delivers on Nov 24 and 25. Want to track them?`); quickReplies(col, ['Track my turkey deliveries']); return; }
    const card = await progressCard(col, 'Finding turkeys near you', `Kroger · delivery to ${D.team.length} addresses`, ['Checked Kroger stores near you · Kroger Marketplace · 1.2 mi', 'Fresh whole turkeys in stock · 12–14 lb, enough for 8–10 people', 'Delivery slots open · Tue Nov 24 and Wed Nov 25, before Thanksgiving'], 'turkey');
    card.remove();
    await botSay(col, `Found them. Kroger Marketplace has fresh turkeys and can deliver to all ${D.team.length} of your team before Thanksgiving. Here’s the plan, check the addresses:`, { dots: 200 });
    const p = { k: 'turkey', card: 'tk' + (++AS.seq), size: 1, on: D.team.map(() => true), note: 'Thanks for a great year. Happy Thanksgiving! — Milind' };
    AS.pending = p;
    col.insertAdjacentHTML('beforeend', `<div class="tkcard" id="${p.card}">${turkeyInner(p)}</div>`);
    stamp(col); scrollEnd(); AS.script = Math.max(AS.script, 5);
    setRail([{ t: 'Place order', i: 'check' }, { t: 'Track my turkey deliveries', i: 'truck' }].slice(0, 1), true);
  },

  async turkeyOrder(col) {
    const p = AS.pending; if (!p || p.k !== 'turkey') return FLOWS.turkey(col);
    const T = turkeyTotals(p);
    if (!T.n) { await botSay(col, 'Turn on at least one teammate and I’ll place the order.'); return; }
    const o = document.getElementById(p.card); if (o) o.classList.add('locked');
    if (AS.confirm && !(await pinSheet('Place order', `${moneyT(T.total)} to Kroger with OneFI Metal`))) { if (o) o.classList.remove('locked'); await botSay(col, 'Okay, nothing was ordered. The turkeys are still available.'); return; }
    AS.pending = null;
    const metal = D.cards[0], avail = metal.limit - metal.used;
    const card = await progressCard(col, 'Placing your order', `Kroger · ${T.n} deliver${T.n === 1 ? 'y' : 'ies'}`, [`Addresses verified · ${T.n} of ${T.n}, all deliverable`, `Paid with OneFI Metal ••${NB}${metal.num} · +${T.pts} points`, `Scheduling ${T.n} deliver${T.n === 1 ? 'y' : 'ies'}… · Tue Nov 24 and Wed Nov 25, 10 AM–2 PM`], 'tord',
      { a: { av: LOGO('', 'metal'), t: 'OneFI Metal', bal: avail }, b: { av: LOGO('K', 'kr'), t: 'Kroger' }, amt: T.total });
    card.remove();
    metal.used += T.total;
    const oid = 'KR‑' + Math.floor(40000000 + Math.random() * 9999999);
    D.turkeyOrder = { id: oid, total: T.total, people: D.team.filter((_, i) => p.on[i]), note: p.note, pts: T.pts };
    D.tx.unshift({ id: 't' + Date.now(), name: 'Kroger', amt: -T.total, date: new Date(2026, 10, 19), time: clock(), note: 'Thanksgiving turkeys · OneFI Metal', cat: 'groceries', hue: 214, acct: 'card', person: false });
    await botSay(col, `Done. Each of your ${T.n === 6 ? 'six' : T.n} teammates gets a fresh turkey before Thursday, with your note. I’ll tell you when they’re delivered.`, { dots: 250 });
    await finish(col, '', ticket({ amount: T.total, label: `Kroger order · ${T.n} turkeys`, status: 'Confirmed', who: { av: LOGO('K', 'kr sm'), t: 'Kroger Marketplace · delivery' }, rows: [['Paid with', `OneFI Metal ••${NB}${metal.num}`], ['Points earned', `+${T.pts}`], ['Deliveries', 'Nov 24–25 · 10 AM–2 PM'], ['Order number', oid]], ref: oid, note: 'Each delivery includes your gift note.', actions: [['Track deliveries', 'ttrack'], ['Done', 'done', 1]] }),
      c2 => { c2.insertAdjacentHTML('beforeend', thanksCard(D.turkeyOrder)); });
    AS.script = Math.max(AS.script, 6);
    setRail([{ t: 'Track my turkey deliveries', i: 'truck' }, { t: 'My accounts', i: 'bank' }]);
  },

  async turkeyTrack(col) {
    const o = D.turkeyOrder;
    if (!o) { await botSay(col, 'You haven’t ordered turkeys yet. Want me to find some for your team?'); quickReplies(col, ['Order a turkey for each of my team members for Thanksgiving']); return; }
    await botSay(col, `All ${o.people.length} deliveries are scheduled with Kroger. I’ll let you know as each one arrives.`);
    col.insertAdjacentHTML('beforeend', trackHTML(o)); stamp(col); save();
  },

  async invest(col) { await botSay(col, 'What would you like to do with your money?'); quickReplies(col, ['Make a term deposit with $5,000', 'Buy 500 shares of FIS', 'Is my portfolio too risky?']); },

  async balance(col) {
    await botSay(col, 'Here’s where your money is right now, including accounts linked through the aggregator.');
    const rows = [['Everyday Chequing', `••${NB}4821`, chq().bal, 'bank'], ['High‑yield savings', `••${NB}0937`, D.accounts[1].bal, 'coins'], ['Citi Checking', `••${NB}${D.linked.citi.num} · linked`, D.linked.citi.bal, 'L:citi'], ['BMO Harris Checking', `••${NB}${D.linked.bmo.num} · linked`, D.linked.bmo.bal, 'L:bmo'], ['AMEX Savings', `••${NB}${D.linked.amex.num} · linked`, D.linked.amex.bal, 'L:amex'], ...D.deposits.map(d => ['AMEX term deposit', `${d.rate}% · matures ${longDate(d.mat)}`, d.amt, 'lock']), ['E*TRADE buying power', `••${NB}${D.linked.etrade.num} · linked`, D.linked.etrade.buyingPower, 'L:etrade']];
    const tot = rows.reduce((a, r) => a + r[2], 0);
    col.insertAdjacentHTML('beforeend', `<div class="offer"><div class="of-top"><div style="position:relative;font-size:12.5px;opacity:.7">Total across ${rows.length} accounts</div><div class="of-rate" style="margin-top:8px"><b style="font-size:40px">${moneyT(tot, { noCents: true })}</b><span>Updated<br>just now</span></div></div>
      <div class="of-body" style="padding-top:4px">${rows.map(([n, s2, v, i]) => `<div class="row" style="padding:12px 0">${i.startsWith('L:') ? BLOGO(i.slice(2), 'alogo') : `<div class="logo soft" style="width:38px;height:38px">${ic(i)}</div>`}<div class="main"><div class="t1" style="font-size:14px">${n}</div><div class="t2">${s2}</div></div><div class="end"><div class="t1" style="font-size:14px">${moneyT(v)}</div></div></div>`).join('')}</div></div>`);
    stamp(col); save();
  },

  async yes(col) { const p = AS.pending; AS.pending = null; if (p && p.k === 'td') return FLOWS.tdCreate(col, p); await botSay(col, 'Okay!'); },
  async no(col) {
    const p = AS.pending; AS.pending = null;
    if (p && p.card) { const o = document.getElementById(p.card); if (o) { $$('.cacts', o).forEach(c => c.classList.add('dim')); const b = $('.cacts .o', o); b && b.classList.add('chosen'); } }
    await botSay(col, 'No problem. Your money stays in AMEX Savings. I’ll let you know if a better rate comes up.'); stamp(col);
    setRail([{ t: 'My accounts', i: 'bank' }]);
  },
};

async function analytic(col, k, q) {
  if (/24 months|2 years/.test(q) && AS.pending && AS.pending.k === 'td') {
    const p = AS.pending; p.months = 24; const o = document.getElementById(p.card);
    if (o) { o.innerHTML = offerInner(p); drawProjection(o, p); }
    await botSay(col, `At 24 months AMEX pays <b>${p.rate.toFixed(2)}%</b>, so you’d earn about <b>${moneyT(p.interest)}</b>. I’ve updated the offer above. Rates are highest at 12 months right now.`);
    stamp(col); save(); return;
  }
  const A = ANSWERS[k] || ANSWERS.general;
  const card = await progressCard(col, 'Looking into it', 'Reading your accounts', A.steps, 'look');
  card.remove(); working(false);
  await botSay(col, A.text(q), { dots: 200 });
  const wd = document.createElement('div'); wd.className = 'widget'; wd.style.width = '100%'; wd.innerHTML = A.widget(q); col.appendChild(wd);
  A.after && A.after(wd); animateDonuts(wd);
  $$('[data-ask]', wd).forEach(b => { b.dataset.a = 'say'; b.dataset.t = b.dataset.ask; b.removeAttribute('data-ask'); });
  $$('.act', wd).forEach(b => { b.dataset.a = 'act'; });
  stamp(col); scrollEnd(); save();
  setRail([{ t: 'My accounts', i: 'bank' }, { t: 'Find ways for me to save more each month', i: 'coins' }]);
}

async function handle(text) {
  text = (text || '').trim(); if (!text || AS.busy) return;
  AS.busy = true; haptic(8);
  $$('.qrs:not(.used), .tiles:not(.used)', thread()).forEach(q => q.classList.add('used'));
  const r = $('#rail'); if (r) r.innerHTML = '';
  userMsg(text);
  await wait(450 * PACE);
  const col = botRow();
  try {
    const it = intent(text);
    if (AS.pending && AS.pending.k === 'payWho' && it.k !== 'pay') { const c = findContact(text); if (c) { const amt = AS.pending.amt; AS.pending = null; await FLOWS.pay(col, { to: c, amt }); AS.busy = false; return; } }
    const tdTweak = AS.pending && AS.pending.k === 'td' && /24 months|2 years/.test(text.toLowerCase());
    if (!tdTweak && !['yes', 'no'].includes(it.k) && AS.pending && AS.pending.k === 'td') { const o = document.getElementById(AS.pending.card); if (o) $$('.cacts', o).forEach(c => c.classList.add('dim')); AS.pending = null; }
    if (tdTweak) await analytic(col, 'td24', text);
    else if (FLOWS[it.k]) await FLOWS[it.k](col, it); else await analytic(col, it.k, text);
  } catch (e) { console.error(e); mood('confused'); await botSay(col, 'Something went wrong on my side. Please try that again.'); }
  if (!col.children.length) col.parentElement.remove();
  if (r && !r.innerHTML) setRail([{ t: 'My accounts', i: 'bank' }, { t: 'How much did I spend on dining this month?', i: 'coffee' }]);
  working(false); AS.busy = false; save(); scrollEnd();
}

/* ───────── Citi password: alert and secure handoff ───────── */
async function pwAlert(col) {
  const L = D.linked.citi;
  await wait(500 * PACE);
  await botSay(col, `One more thing: your Citi password expires in ${L.pwDays} days. If it lapses, payments from Citi stop until it’s updated.`, { dots: 300 });
  col.insertAdjacentHTML('beforeend', `<div class="pwcard"><div class="pw-top">${BLOGO('citi', 'lg')}<span class="pw-pill"><b></b>Expires in ${L.pwDays} days</span></div>
    <div class="pw-h">Citi password expires soon</div><div class="pw-s">You’ll change it on Citi’s own secure page. OneFI never sees your password.</div>
    <div class="cacts"><button class="o" data-a="pwlater"><span>Later</span></button><button class="f" data-a="say" data-t="Update my Citi password">${ic('lock', 'sm')}<span>Update on Citi</span></button></div></div>`);
  stamp(col); scrollEnd();
  setRail([{ t: 'Update my Citi password', i: 'lock' }, { t: 'Now pay my internet bill', i: 'bill' }]);
}
/* the bank's page is where the password changes; here we only show the handoff and its result */
function handoff() {
  return new Promise(res => {
    Sheet.open(`<div class="ho">${BLOGO('citi', 'xl')}<h3>Continue on Citi</h3><p>You’ll set your new password on Citi’s own secure page. OneFI never sees it.</p>
      <div class="ho-st">${halo('verify', 30)}<span id="hot">Waiting for Citi to confirm…</span></div><div class="ho-lock">${ic('lock', 'xs')} Encrypted handoff · citi.com</div></div>`, {
      mount(sh) {
        setTimeout(() => { const t = $('#hot', sh); if (!t) return; haloSet($('.ho-st .hq', sh), 'done'); t.textContent = 'Citi confirmed your new password'; haptic(14); }, 2600);
        setTimeout(() => { Sheet.close(); setTimeout(res, 320); }, 3700);
      },
      onClose() { setTimeout(res, 330); },
    });
  });
}

/* ───────── Thanksgiving: turkeys for the team ───────── */
const TK_SIZES = [['10–12 lb', 18.90], ['12–14 lb', 22.40], ['16–18 lb', 29.60]];
const TK_DELIVERY = 5.99;
function turkeyTotals(p) {
  const n = p.on.filter(Boolean).length, price = TK_SIZES[p.size][1];
  const total = Math.round(n * (price + TK_DELIVERY) * 100) / 100;
  return { n, price, goods: n * price, del: n * TK_DELIVERY, total, pts: Math.round(total * 3) };
}
const teamAv = (m, sz = 34) => `<span class="tm-av" style="width:${sz}px;height:${sz}px;background:hsl(${m.hue} 55% 91%)">${m.ini}</span>`;
function turkeyInner(p) {
  const T = turkeyTotals(p), metal = D.cards[0];
  return `<div class="tk-prod"><span class="tk-img">🦃</span><div class="tk-pi"><div class="t1">Fresh whole turkey</div><div class="t2">Kroger Marketplace · 1.2 mi · in stock</div><div class="t3">${moneyT(T.price)} <span>each · about ${moneyT(T.price / [11, 13, 17][p.size])}/lb</span></div></div></div>
    <div class="tk-seg">${TK_SIZES.map(([s], i) => `<button data-a="tsize" data-i="${i}" class="${i === p.size ? 'on' : ''}">${s}</button>`).join('')}</div>
    <div class="tk-sec"><span>Delivering to your team</span><span>${T.n} of ${D.team.length}</span></div>
    <div class="tk-team">${D.team.map((m, i) => `<div class="tm-row ${p.on[i] ? '' : 'off'}">${teamAv(m)}<div class="tm-tx"><div class="tm-n">${m.name}</div><div class="tm-a">${m.addr} · ${m.day}</div></div><button class="tm-sw ${p.on[i] ? 'on' : ''}" data-a="tmem" data-i="${i}" role="switch" aria-checked="${p.on[i]}" aria-label="Send to ${m.name}"><i></i></button></div>`).join('')}</div>
    <button class="tk-note" data-a="tnote">${ic('gift', 'sm')}<div><div class="k">Gift note</div><div class="v">“${esc(p.note)}”</div></div>${ic('pen', 'sm')}</button>
    <div class="tk-sum"><div><span>${T.n} turkey${T.n === 1 ? '' : 's'} × ${moneyT(T.price)}</span><span>${moneyT(T.goods)}</span></div><div><span>Delivery × ${T.n}</span><span>${moneyT(T.del)}</span></div><div class="tot"><span>Total</span><span>${moneyT(T.total)}</span></div></div>
    <div class="tk-pay"><span class="tk-cardart"></span><div><div class="t1">${metal.name} ••${NB}${metal.num}</div><div class="t2">3× points on groceries · +${T.pts} points</div></div></div>
    <div class="cacts"><button class="o" data-a="tedit"><span>Edit team</span></button><button class="f" data-a="say" data-t="Place order" ${T.n ? '' : 'disabled'}>${AS.confirm ? ic('finger', 'sm') : ''}<span>Place order · ${moneyT(T.total)}</span></button></div>`;
}
function thanksCard(o) {
  return `<div class="tgcard"><div class="tg-glow"></div><div class="tg-top">${halo('done', 40)}<span class="tg-e">🦃</span></div>
    <div class="tg-h">Happy Thanksgiving, ${D.user.first}</div><div class="tg-s">${o.people.length === 6 ? 'Six' : o.people.length} turkey${o.people.length === 1 ? ' is' : 's are'} on ${o.people.length === 1 ? 'its' : 'their'} way to your team.</div>
    <div class="tg-avs">${o.people.map(m => teamAv(m, 38)).join('')}</div>
    <div class="tg-note">“${esc(o.note)}”</div>
    <div class="tg-acts"><button data-a="tmsg">${ic('chat', 'sm')}<span>Message the team</span></button><button data-a="ttrack">${ic('truck', 'sm')}<span>Track deliveries</span></button></div></div>`;
}
function trackHTML(o) {
  return `<div class="tktrack">${o.people.map(m => `<div class="tm-row">${teamAv(m)}<div class="tm-tx"><div class="tm-n">${m.name}</div><div class="tm-a">${m.addr}</div></div><div class="tt-st"><b>Scheduled</b><span>${m.day.replace(/^\w+, /, '')} · 10–2</span></div></div>`).join('')}</div>`;
}

/* ───────── briefing: what OneFI noticed before you asked ───────── */
const ME = () => `<div class="mf-ini">${D.user.first[0]}${D.user.last[0]}</div>`;
const LOGO = (t, cls = '') => `<div class="mf-logo ${cls}">${t}</div>`;
function briefItems() {
  const items = [];
  const rb = D.bills.find(b => /rogers/i.test(b.name));
  if (rb) { const d = addDays(rb.days); items.push({ i: 'bill', h: `<b>${rb.name}</b> ${moneyT(rb.amt)} is due ${MONTHS[d.getMonth()]} ${d.getDate()}`, s: 'Paying now avoids a $5 late fee', b: 'Pay', t: 'Now pay my internet bill' }); }
  if (!D.deposits.length) items.push({ i: 'percent', h: `<b>${moneyT(chq().bal, { noCents: true })}</b> in Chequing is earning 0%`, s: 'AMEX pays 4.85% for 12 months', b: 'Grow it', t: 'Make a term deposit with $5,000' });
  const fis = D.quotes.FIS; if (fis && !D.holdings.find(h => h.sym === 'FIS' && h.qty)) items.push({ i: 'invest', h: `<b>FIS</b> is down 32% this month to ${moneyT(fis.price)}`, s: 'Near its 52‑week low of $26.77', b: 'Buy', t: 'I am bullish on FIS, can you buy 500 shares for me?' });
  if (!D.turkeyOrder) items.push({ e: '🦃', warm: 1, h: '<b>Thanksgiving</b> is next Thursday, Nov 26', s: `Send each of your ${D.team.length} teammates a turkey?`, b: 'Send', t: 'Order a turkey for each of my team members for Thanksgiving' });
  return items;
}
function briefRow(x) { return `<div class="br-row ${x.warm ? 'warm' : ''}"><div class="br-ic">${x.e || ic(x.i)}</div><div class="br-tx"><div class="br-h">${x.h}</div><div class="br-s">${x.s}</div></div><button class="br-go" data-a="say" data-t="${esc(x.t)}">${x.b}</button></div>`; }
async function runBriefing() {
  const t = thread(); if (!t || AS.briefed || AS.html) return;
  const items = briefItems(); if (!items.length) return;
  AS.briefed = true;
  const col = $('.brow .bcol', t), tiles = $('.tiles', col);
  const card = document.createElement('div'); card.className = 'brief';
  card.innerHTML = `<div class="br-head">${halo('search', 30)}<div><div class="br-t">Looking over your accounts…</div><div class="br-st">3 accounts · 4 linked institutions</div></div></div><div class="br-rows"></div>`;
  col.insertBefore(card, tiles); mood('search', 'Looking over your accounts…');
  const hq = $('.hq', card), rows = $('.br-rows', card);
  await wait(1700);
  for (const x of items) { rows.insertAdjacentHTML('beforeend', briefRow(x)); haptic(4); scrollEnd(); await wait(420); }
  setTimeout(scrollEnd, 120);
  haloSet(hq, 'ready'); $('.br-t', card).textContent = `${items.length} things I noticed`; $('.br-st', card).textContent = 'Tap one and I’ll handle it';
  mood('ready'); save();
}
SB._brief = runBriefing;

/* idle attention: every 20–30 s of quiet, OneFI glances at something that needs you */
let idleT = 0, lastAct = Date.now();
['pointerdown', 'keydown', 'scroll'].forEach(ev => document.addEventListener(ev, () => { lastAct = Date.now(); }, { passive: true, capture: true }));
function idleTick() {
  clearTimeout(idleT); idleT = setTimeout(idleTick, 20000 + Math.random() * 10000);
  const top = SB.stack[SB.stack.length - 1];
  if (!top || top._route !== 'assistant' || AS.busy || AS.mood !== 'ready' || document.hidden || $('.sheet') || Date.now() - lastAct < 8000) return;
  const view = $('#cb', top), vr = view.getBoundingClientRect();
  const visible = el => { const r = el.getBoundingClientRect(); return r.bottom > vr.top + 40 && r.top < vr.bottom - 140; };
  const row = $$('.br-row', top).find(r => visible(r) && !r.classList.contains('acted'));
  const hero = $('.ghero .hq', top), useHero = hero && visible(hero);
  const hq = useHero ? hero : $('.chathead .hq', top);
  haloGlance(hq, row || null, () => { if (row) { row.classList.remove('nudge'); void row.offsetWidth; row.classList.add('nudge'); } });
}
idleT = setTimeout(idleTick, 14000);

/* ───────── screen ───────── */
function greetingHTML() {
  const h = new Date().getHours(), g = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const nb = D.bills[0];
  return `<div class="ghero">${MARK('xl')}<h2>${g}, ${D.user.first}</h2><div class="sec2">${ic('lock')} Private and secure · Linked to 2 institutions</div>
    <div class="snap"><div><div class="k">Chequing</div><div class="v">${moneyT(chq().bal, { noCents: true })}</div><div class="s">Available now</div></div>
      <div><div class="k">Due soon</div><div class="v">${nb ? moneyT(nb.amt) : '$0'}</div><div class="s">${nb ? nb.name : 'All paid'}</div></div>
      <div><div class="k">Portfolio</div><div class="v pos">+0.71%</div><div class="s">Today</div></div></div></div>
  <div class="dayline">Today</div>
  <div class="brow">${BOTAV()}<div class="bcol"><div class="bub">Hi ${D.user.first} 👋 I’m OneFI. I can pay people, pay bills and help you grow your savings. What would you like to do?</div><div class="mmeta" style="margin-top:-2px">${clock()}</div>
  <div class="tiles">${[['send', 'Send money', 'Interac e‑Transfer'], ['bill', 'Pay a bill', nb ? `${D.bills.length} due this month` : 'All paid'], ['invest', 'Invest', 'Deposits and stocks'], ['bank', 'My accounts', '5 accounts, 2 linked']].map(([i, t, s2]) => `<button class="tilec" data-a="say" data-t="${t}"><div class="ti">${ic(i)}</div><div class="tx"><div class="tt">${t}</div><div class="ts">${s2}</div></div></button>`).join('')}</div></div></div>`;
}

SB.reg('assistant', {
  cls: 'chat',
  render() {
    return `<div class="chathead"><button class="iconbtn" data-back aria-label="Back">${ic('left')}</button>${MARK('head')}
      <div class="who"><div class="t1">OneFI</div><div class="t2">Online · Secure</div></div>
      <button class="iconbtn" id="amenu" aria-label="More">${ic('dots')}</button></div>
    <div class="body" id="cb"><div class="thread" id="thread">${AS.html || greetingHTML()}</div></div>
    <div class="footzone"><div class="rail" id="rail">${AS.rail || ''}</div>
    <div class="composer"><div class="field"><button class="plus" id="aplus" aria-label="Attach">${ic('plus', 'sm')}</button><input id="ain" placeholder="Ask to pay, transfer or invest" enterkeyhint="send" autocomplete="off"></div><button class="vmic" id="amic" aria-label="Speak">${ic('mic', 'sm')}</button><button class="send idle" id="asend" aria-label="Send">${ic('plane', 'sm')}</button></div>
    <div class="secure">${ic('lock')} Your conversation is private and secure</div></div>`;
  },
  mount(el) {
    const inp = $('#ain', el), send = $('#asend', el);
    chatBars();
    if (!AS.rail) setRail([{ t: 'How much did I spend on dining this month?', i: 'coffee' }, { t: 'My accounts', i: 'bank' }]);
    // redraw charts restored from saved HTML
    $$('.offer', el).forEach(o => { const p = AS.pending && AS.pending.card === o.id ? AS.pending : null; if (p) drawProjection(o, p); });
    if (AS.html) setTimeout(() => scrollEnd(false), 30);
    if (SB._pendingAsk) { const q = SB._pendingAsk; SB._pendingAsk = null; setTimeout(() => handle(q), 500); }
    else if (!AS.html && !AS.briefed && !SB._landing) setTimeout(runBriefing, 900);
    const upd = () => send.classList.toggle('idle', !inp.value.trim());
    inp.oninput = upd;
    const go = () => { const t = inp.value; inp.value = ''; upd(); handle(t); };
    send.onclick = go;
    inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
    let typing = false;
    inp.addEventListener('focus', async () => {
      if (!AS.demo || typing || inp.value || AS.busy || AS.script >= SCRIPT.length) return;
      typing = true; const line = SCRIPT[AS.script];
      for (let i = 1; i <= line.length; i++) { if (!inp.isConnected || (i > 1 && inp.value !== line.slice(0, i - 1))) break; inp.value = line.slice(0, i); upd(); await wait(28); }
      typing = false;
    });
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b || !el.contains(b)) return;
      const a = b.dataset.a;
      if (a === 'say') { const r = b.closest('.br-row'); if (r) r.classList.add('acted'); return handle(b.dataset.t); }
      if (a === 'share') return toast('Receipt saved. Share sheet opened.', 'share');
      if (a === 'pwlater') { const c = b.closest('.pwcard'); if (c) c.classList.add('locked'); save(); return toast('I’ll remind you tomorrow', 'bell'); }
      if (a === 'tsize' || a === 'tmem') {
        const p = AS.pending; if (!p || p.k !== 'turkey' || AS.busy) return;
        if (a === 'tsize') p.size = +b.dataset.i; else p.on[+b.dataset.i] = !p.on[+b.dataset.i];
        const o = document.getElementById(p.card); if (o) o.innerHTML = turkeyInner(p); haptic(6); save(); return;
      }
      if (a === 'tedit') { const o = AS.pending && document.getElementById(AS.pending.card); if (o) { $$('.tm-row', o).forEach((r, i) => setTimeout(() => { r.classList.remove('nudge'); void r.offsetWidth; r.classList.add('nudge'); }, i * 70)); } return toast('Use the switches to choose who gets one', 'user'); }
      if (a === 'tnote') {
        const p = AS.pending; if (!p || p.k !== 'turkey') return;
        return Sheet.open(`<h3>Gift note</h3><div class="sub">Printed on a card with each delivery.</div><textarea class="tk-ta" id="tkn" maxlength="140">${esc(p.note)}</textarea><button class="btn primary" id="tks" style="margin-top:14px">Save note</button>`, { mount(sh) { $('#tks', sh).onclick = () => { p.note = $('#tkn', sh).value.trim() || p.note; Sheet.close(); const o = document.getElementById(p.card); if (o) o.innerHTML = turkeyInner(p); save(); toast('Note updated', 'gift'); }; } });
      }
      if (a === 'tmsg') { if (b.dataset.done) return; b.dataset.done = 1; b.innerHTML = `${ic('check', 'sm')}<span>Message sent</span>`; haptic(12); save(); return toast('Message sent to your team', 'chat'); }
      if (a === 'ttrack') { const o = D.turkeyOrder; if (!o) return; return Sheet.open(`<h3>Turkey deliveries</h3><div class="sub">Kroger order ${o.id} · Nov 24–25</div>${trackHTML(o)}`); }
      if (a === 'steps') return Sheet.open(`<h3>What I did</h3><div class="sub">Every step was checked before moving on.</div><div class="tl" style="padding:4px 0 0">${b.dataset.steps.split('|').map(t => `<div class="ts done"><div class="dot">${ic('check')}</div><div class="tx"><div class="m">${t}</div></div></div>`).join('')}</div>`);
      if (a === 'done') { const c = b.closest('.cacts'); c.classList.add('dim'); b.classList.add('chosen'); haptic(6); save(); return; }
      if (a === 'autopay') { b.textContent = 'On'; b.disabled = true; haptic(10); toast(`Autopay on for ${b.dataset.n}`, 'repeat'); save(); return; }
      if (a === 'remind') { b.textContent = 'Set'; b.disabled = true; toast('Maturity reminder set', 'bell'); save(); return; }
      if (a === 'term') { const p = AS.pending; if (!p || p.k !== 'td') return; p.months = +b.dataset.m; const o = document.getElementById(p.card); o.innerHTML = offerInner(p); drawProjection(o, p); haptic(6); save(); return; }
      if (a === 'bill') return Sheet.open(`<h3>${b.dataset.n}</h3><div class="sub">Statement for account •• ${b.dataset.acct}</div><div class="panel pad">${[['Billing period', 'Oct 18 – Nov 17'], ['Plan', 'Internet 1 Gbps'], ['Amount', moneyT(+b.dataset.v)], ['Status', '<span class="pos">Paid</span>']].map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}</div><div style="margin-top:14px"><button class="btn secondary" onclick="Sheet.close();toast('Bill PDF downloaded','share')">${ic('share', 'sm')} Download PDF</button></div>`);
      if (a === 'td') { const d = D.deposits[+b.dataset.i]; return Sheet.open(`<h3>AMEX term deposit</h3><div class="sub">${d.ref}</div><div class="panel pad">${[['Principal', moneyT(d.amt)], ['Rate', d.rate.toFixed(2) + '% p.a. (fixed)'], ['Term', d.months + ' months'], ['Opened', longDate()], ['Matures', longDate(d.mat)], ['At maturity', 'Renew automatically'], ['Early withdrawal', 'Interest reduced to 1.00%'], ['Deposit insurance', 'Covered up to $100,000']].map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}</div>`); }
      if (a === 'portfolio') { SB.pop(); setTimeout(() => SB.go('invest'), 420); return; }
      if (a === 'act') { if (b.dataset.used) return; pinSheet('Confirm', b.textContent.trim()).then(async ok => { if (!ok) return; b.dataset.used = 1; b.innerHTML = '<div class="spin"></div>'; await wait(900); if (b.dataset.move) { chq().bal -= +b.dataset.move; D.accounts[1].bal += +b.dataset.move; } b.innerHTML = ic('check', 'sm') + ' Done'; toast(b.dataset.done); save(); }); }
    });
    $('#aplus', el).onclick = () => Sheet.open(`<h3>Add to chat</h3><div class="list flat" style="margin-top:12px">${[['scan', 'Scan a bill', 'I’ll read it and set up the payment'], ['qr', 'Scan a payment QR', 'Pay a person or store'], ['receipt', 'Share a statement', 'Ask questions about it']].map(([i, t, s2], n) => `<button class="row" data-n="${n}"><div class="logo soft">${ic(i)}</div><div class="main"><div class="t1">${t}</div><div class="t2">${s2}</div></div></button>`).join('')}</div>`, {
      mount(sh) { $$('.row', sh).forEach(r => r.onclick = () => { Sheet.close(); if (r.dataset.n === '0') setTimeout(() => handle('Now pay my internet bill'), 350); else if (r.dataset.n === '1') setTimeout(() => SB.push('scan', {}, 'up'), 350); else toast('Choose a file to share', 'receipt'); }); },
    });
    const mic = $('#amic', el);
    const isWV = /; wv\)/.test(navigator.userAgent);
    let rec = null;
    const stopUI = () => { AS.listening = false; mic.classList.remove('rec'); inp.placeholder = 'Ask to pay, transfer or invest'; };
    SB.voice = (t, unavailable) => {
      chatBars(); stopUI(); if (rec) { try { rec.abort(); } catch (e) {} rec = null; }
      if (t && t.trim()) { inp.value = t.trim(); upd(); haptic(10); setTimeout(() => { if (inp.value.trim()) go(); }, 450); }
      else toast(unavailable ? 'Voice input needs Google speech services on this phone' : 'Didn’t catch that. Tap the mic and try again.', 'mic');
    };
    mic.onclick = () => {
      if (AS.busy) return;
      haptic(12);
      SB._voiceDeliver = t => { inp.value = t; upd(); setTimeout(go, 350); };
      SB._voiceType = () => setTimeout(() => inp.focus(), 420);
      mood('listening'); setTimeout(() => SB.push('voice', {}, 'up'), 200);
    };
    $('#amenu', el).onclick = () => Sheet.open(`<h3>Assistant settings</h3><div class="list flat" style="margin-top:12px">
        <div class="row"><div class="logo soft">${ic('shield')}</div><div class="main"><div class="t1">Ask before moving money</div><div class="t2">Show a confirm step with fingerprint</div></div>${sw(AS.confirm, 'data-k="confirm"')}</div>
        <div class="row"><div class="logo soft">${ic('spark')}</div><div class="main"><div class="t1">Demo mode</div><div class="t2">Suggest and type the next demo step</div></div>${sw(AS.demo, 'data-k="demo"')}</div>
        <button class="row" id="lk"><div class="logo soft">${ic('bank')}</div><div class="main"><div class="t1">Linked accounts</div><div class="t2">AMEX Savings, E*TRADE via aggregator</div></div>${ic('right', 'sm chev')}</button>
        <button class="row" id="mt"><div class="logo soft">${halo('ready', 22, 'still')}</div><div class="main"><div class="t1">Meet OneFI</div><div class="t2">How I show what I’m doing</div></div>${ic('right', 'sm chev')}</button>
        <button class="row" id="rs"><div class="logo soft">${ic('repeat')}</div><div class="main"><div class="t1">Restart demo</div><div class="t2">Clear the chat and start from step 1</div></div></button></div>`, {
      mount(sh) {
        bindSwitches(sh, (s2, on) => { if (s2.dataset.k === 'confirm') { AS.confirm = on; store.set('askFirst', on); } else { AS.demo = on; store.set('demo', on); } });
        $('#rs', sh).onclick = () => { Sheet.close(); AS.html = null; AS.rail = null; AS.pending = null; AS.script = 0; AS.briefed = false; SB.replace('assistant'); toast('Demo restarted', 'repeat'); };
        $('#lk', sh).onclick = () => { Sheet.close(); setTimeout(() => handle('My accounts'), 300); };
        $('#mt', sh).onclick = () => { Sheet.close(); setTimeout(meetOneFI, 320); };
      },
    });
  },
});
function chatBars() { const v = getComputedStyle(document.documentElement).getPropertyValue('--status-chat').trim().replace(/"/g, ''); if (v) barsOverride(v); }
const _popA = SB.pop.bind(SB);
SB.pop = function (n) { const top = this.stack[this.stack.length - 1]; const r = _popA(n); if (top && top._route === 'assistant') setTimeout(syncBars, 60); if (top && top._route === 'voice') setTimeout(() => { if (AS.mood === 'listening') mood('ready'); }, 120); return r; };
