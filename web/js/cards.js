// Cards, credit, loans, insurance
const cardState = { k1: { frozen: false, online: true, intl: false, tap: true, atm: true, limit: 5000 }, k2: { frozen: false, online: true, intl: true, tap: true, atm: true, limit: 2500 }, k3: { frozen: false, online: true, intl: true, tap: false, atm: false, limit: 800 } };
function cardArt(c, reveal = false) {
  return `<div class="ccard ${cardState[c.id].frozen ? 'frozen' : ''}" data-card="${c.id}">
    <div class="r1"><div><div class="brand">OneFI</div><div class="kind">${c.name}</div></div>${c.id === 'k3' ? ic('globe') : '<div class="chip-ic"></div>'}</div>
    <div class="r2"><div><div class="pan">${reveal ? '4532 7781 0094 ' + c.num : '•••• ' + c.num}</div><div class="holder">${D.user.first.toUpperCase()} ${D.user.last.toUpperCase()}${reveal ? '  ·  ' + c.exp + '  ·  CVV 318' : ''}</div></div><div class="net"><i></i><i></i></div></div>
    <div class="frost">${ic('snow', 'lg')}</div></div>`;
}

SB.reg('cards', {
  tab: true,
  render() {
    const k = D.cards[0];
    return `<div class="hello"><div class="who"><div class="t1" style="font-size:22px">Cards & credit</div></div><button class="iconbtn" id="addc">${ic('plus', 'sm')}</button></div>
    <div class="body">
      <div class="acct-rail" id="rail" style="gap:14px;padding-top:6px;padding-bottom:40px;margin-bottom:-22px">${D.cards.map(c => `<div style="flex:0 0 calc(100% - 28px);scroll-snap-align:center">${cardArt(c)}</div>`).join('')}</div>
      <div class="dots" style="justify-content:center;padding:0 0 6px" id="cdots">${D.cards.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>
      <div id="cpanel"></div>

      <h2 class="sec">Credit & borrowing</h2>
      <div class="grid2">
        <button class="tile" data-push="credit"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div class="logo soft">${ic('target')}</div><span class="badge">+12</span></div><div><div class="amount" style="font-size:calc(28px*var(--display-scale))">782</div><div class="t2" style="margin-top:4px">Credit score, excellent</div></div></button>
        <button class="tile" data-push="loans"><div class="logo soft">${ic('cash')}</div><div><div class="t1">Loans</div><div class="t2" style="margin-top:2px">Pre‑approved up to $25k</div></div></button>
        <button class="tile" data-push="insurance"><div class="logo soft">${ic('shield')}</div><div><div class="t1">Insurance</div><div class="t2" style="margin-top:2px">1 renewal due</div></div></button>
        <button class="tile" data-push="rewards"><div class="logo soft">${ic('gift')}</div><div><div class="t1">Rewards</div><div class="t2" style="margin-top:2px">18,420 points</div></div></button>
      </div>
    </div>`;
  },
  mount(el) {
    let idx = 0;
    const drawPanel = () => {
      const c = D.cards[idx], s = cardState[c.id];
      const credit = c.kind === 'Credit';
      $('#cpanel', el).innerHTML = `<div class="fade-in">
        ${credit ? `<div class="panel pad" style="margin-top:8px"><div style="display:flex;justify-content:space-between;align-items:flex-end"><div><div class="label">Current balance</div><div class="amount" style="font-size:calc(30px*var(--display-scale));margin-top:8px">${money(c.used)}</div></div><div style="text-align:right"><div class="label">Available</div><div style="font-weight:600;margin-top:8px" class="num">${moneyT(c.limit - c.used, { noCents: true })}</div></div></div>
          <div class="progress" style="margin:14px 0 10px"><i style="width:${c.used / c.limit * 100}%"></i></div>
          <div style="display:flex;justify-content:space-between;align-items:center"><span class="muted" style="font-size:13px">Statement due ${c.due}, minimum $${c.min}</span><button class="btn sm primary" id="paycc">Pay</button></div></div>` : ''}
        <div class="actions" style="grid-template-columns:repeat(4,1fr);margin-top:18px">
          <button class="action" id="frz"><div class="disc">${ic(s.frozen ? 'lock' : 'snow')}</div>${s.frozen ? 'Unfreeze' : 'Freeze'}</button>
          <button class="action" id="rev"><div class="disc">${ic('eye')}</div>Details</button>
          <button class="action" id="pinb"><div class="disc">${ic('key')}</div>PIN</button>
          <button class="action" id="lim"><div class="disc">${ic('sliders')}</div>Limits</button>
        </div>
        <h2 class="sec">Controls</h2>
        <div class="list flat">
          ${[['online', 'globe', 'Online payments', 'Shopping on websites and in apps'], ['intl', 'plane', 'Use abroad', 'Payments outside the US'], ['tap', 'wave', 'Contactless', 'Tap to pay in stores'], ['atm', 'cash', 'ATM withdrawals', 'Up to $800 a day']].map(([k, i, t, d]) => `<div class="row"><div class="logo soft">${ic(i)}</div><div class="main"><div class="t1">${t}</div><div class="t2">${d}</div></div>${sw(s[k], `data-k="${k}"`)}</div>`).join('')}
        </div>
        <h2 class="sec">Recent on this card</h2>
        <div class="list">${D.tx.filter(t => t.amt < 0 && !t.person).slice(idx * 3, idx * 3 + 4).map(txRow).join('')}</div>
      </div>`;
      bindSwitches($('#cpanel', el), (sw_, on) => { s[sw_.dataset.k] = on; toast(`${sw_.closest('.row').querySelector('.t1').textContent} ${on ? 'on' : 'off'}`, on ? 'check' : 'lock'); });
      $('#frz', el).onclick = () => {
        s.frozen = !s.frozen; haptic(18);
        $(`.ccard[data-card="${c.id}"]`, el).classList.toggle('frozen', s.frozen);
        toast(s.frozen ? `${c.name} frozen. No new payments will go through.` : `${c.name} is active again`, s.frozen ? 'snow' : 'check');
        drawPanel();
      };
      $('#rev', el).onclick = async () => {
        const ok = await pinSheet('Show card details', 'Verify it’s you to see the full number'); if (!ok) return;
        const wrap = $(`.ccard[data-card="${c.id}"]`, el).parentElement;
        wrap.innerHTML = cardArt(c, true); toast('Details hidden again in 30 seconds', 'eye');
        setTimeout(() => { if (document.body.contains(wrap)) wrap.innerHTML = cardArt(c); }, 30000);
      };
      $('#pinb', el).onclick = () => pinSheet('Set a new card PIN', 'Choose 4 digits you’ll remember').then(ok => ok && toast('Card PIN updated', 'key'));
      $('#lim', el).onclick = () => SHEETS.limit({ id: c.id });
      const pc = $('#paycc', el); if (pc) pc.onclick = () => SB.push('review', { amt: c.used, biller: 'Super Metal •• 8842' });
    };
    const rail = $('#rail', el);
    rail.addEventListener('scroll', () => {
      const i = Math.round(rail.scrollLeft / (rail.clientWidth - 14)); if (i !== idx && i >= 0 && i < D.cards.length) { idx = i; $$('#cdots i', el).forEach((d, j) => d.classList.toggle('on', j === i)); haptic(4); drawPanel(); }
    }, { passive: true });
    drawPanel();
    $('#addc', el).onclick = async () => {
      const done = await processing('Creating virtual card', ['Generating card number…', 'Adding to wallet…'], 1500); done();
      toast('New virtual card ready to use', 'card');
    };
  },
});

SHEETS.limit = ({ id }) => {
  const s = cardState[id];
  Sheet.open(`<h3>Monthly spending limit</h3><div class="sub">We’ll decline payments once you reach it.</div>
    <div style="text-align:center;padding:10px 0 6px"><div class="amount" id="lv" style="font-size:calc(46px*var(--display-scale))">${money(s.limit, { noCents: true })}</div></div>
    <input type="range" min="100" max="10000" step="100" value="${s.limit}" id="lr" style="--p:${s.limit / 100}%">
    <div style="display:flex;justify-content:space-between" class="faint"><span style="font-size:12px">$100</span><span style="font-size:12px">$10,000</span></div>
    <div style="margin-top:20px"><button class="btn primary" id="sv">Save limit</button></div>`, {
    mount(sh) {
      const r = $('#lr', sh);
      r.oninput = () => { r.style.setProperty('--p', ((r.value - 100) / 9900 * 100) + '%'); $('#lv', sh).innerHTML = money(+r.value, { noCents: true }); if (+r.value % 1000 === 0) haptic(4); };
      $('#sv', sh).onclick = () => { s.limit = +r.value; Sheet.close(); toast(`Limit set to ${moneyT(s.limit, { noCents: true })} a month`, 'sliders'); };
    },
  });
};

SB.reg('credit', {
  render() {
    return `${topbar('Credit score', `<button class="iconbtn" id="rf">${ic('repeat', 'sm')}</button>`)}
    <div class="body">
      <div style="display:flex;flex-direction:column;align-items:center;position:relative;margin-top:6px">${gauge(782)}
        <div style="position:absolute;top:58px;text-align:center"><div class="amount" style="font-size:calc(56px*var(--display-scale))" id="sc">782</div><div class="pos" style="font-weight:600;margin-top:6px">Excellent</div></div></div>
      <div class="muted" style="text-align:center;font-size:13px">Updated today, up 12 points since October. Checking never affects your score.</div>
      <h2 class="sec">What shapes it</h2>
      <div class="list flat">${[['Payment history', '100% on time', 'High', 'pos'], ['Card utilization', '9% of limits', 'High', 'pos'], ['Credit age', '7 yrs 4 mos', 'Medium', ''], ['Hard inquiries', '1 in 2 years', 'Low', ''], ['Total accounts', '6 open', 'Low', '']].map(([t, v, imp, c]) => `<div class="row"><div class="main"><div class="t1">${t}</div><div class="t2">${imp} impact</div></div><div class="end"><div class="t1 ${c}" style="font-size:14px">${v}</div></div></div>`).join('')}</div>
      <div class="insight" style="margin-top:16px"><div class="head">${halo('ready', 22, 'still')}How to reach 800</div><p>Keep card use under 10% and avoid new credit applications until April. The assistant projects 800+ by then.</p></div>
    </div>`;
  },
  mount(el) {
    const s = $('#sc', el); let n = 300; const t0 = performance.now();
    const f = now => { const p = Math.min(1, (now - t0) / 1400); n = Math.round(300 + (782 - 300) * (1 - Math.pow(1 - p, 3))); s.textContent = n; if (p < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
    $('#rf', el).onclick = async () => { const done = await processing('Checking your score', ['Contacting credit bureau…', 'Soft check, no impact'], 1400); done(); toast('Score is up to date', 'check'); };
  },
});

SB.reg('loans', {
  render() {
    const l = D.loans[0];
    return `${topbar('Loans')}
    <div class="body">
      <div class="label" style="margin:4px 0 10px">Active</div>
      <div class="panel pad"><div style="display:flex;gap:12px;align-items:center"><div class="logo soft">${ic('car')}</div><div style="flex:1"><div style="font-weight:600">${l.name}</div><div class="muted" style="font-size:13px">${l.rate}% APR, ${l.paid} of ${l.months} payments made</div></div></div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:18px"><div><div class="label">Remaining</div><div class="amount" style="font-size:calc(30px*var(--display-scale));margin-top:6px">${money(l.left)}</div></div><div style="text-align:right"><div class="label">Next payment</div><div style="font-weight:600;margin-top:6px" class="num">${moneyT(l.emi)}, ${l.next}</div></div></div>
        <div class="progress" style="margin-top:14px"><i style="width:${(l.total - l.left) / l.total * 100}%"></i></div>
        <div style="display:flex;gap:10px;margin-top:16px"><button class="btn sm secondary" style="flex:1" id="pp">Pay extra</button><button class="btn sm secondary" style="flex:1" id="sched">Schedule</button></div></div>
      <div class="label" style="margin:24px 0 10px">Pre‑approved for you</div>
      <div class="insight"><div class="head">${ic('spark', 'sm')} Personal loan</div><p>Borrow up to <b>$25,000</b> at <b>8.9% APR</b>. Money arrives today, no paperwork.</p><div class="acts"><button class="btn primary" data-push="loancalc">Check my rate</button></div></div>
      <div class="grid2" style="margin-top:12px">
        <button class="tile" data-push="loancalc" data-p='{"kind":"Home"}'><div class="logo soft">${ic('house')}</div><div><div class="t1">Mortgage</div><div class="t2" style="margin-top:2px">From 6.1% APR</div></div></button>
        <button class="tile" data-push="loancalc" data-p='{"kind":"Auto"}'><div class="logo soft">${ic('car')}</div><div><div class="t1">Auto refinance</div><div class="t2" style="margin-top:2px">Save ~$38/mo</div></div></button>
      </div>
    </div>`;
  },
  mount(el) { $('#pp', el).onclick = () => SB.push('review', { amt: 500, biller: 'Auto loan, extra principal' }); $('#sched', el).onclick = () => toast('31 payments left, last one Jun 2029', 'cal'); },
});

SB.reg('loancalc', {
  render(p) {
    const rate = p.kind === 'Home' ? 6.1 : p.kind === 'Auto' ? 5.2 : 8.9;
    return `${topbar((p.kind || 'Personal') + ' loan')}
    <div class="body">
      <div style="text-align:center;padding:10px 0 4px"><div class="label">Monthly payment</div><div class="amount" id="emi" style="font-size:calc(52px*var(--display-scale));margin-top:12px"></div><div class="muted" style="margin-top:10px;font-size:14px">${rate}% APR, fixed</div></div>
      <div class="panel pad" style="margin-top:22px">
        <div style="display:flex;justify-content:space-between"><span class="label">Amount</span><b class="num" id="av"></b></div>
        <input type="range" id="a" min="1000" max="${p.kind === 'Home' ? 400000 : 25000}" step="${p.kind === 'Home' ? 5000 : 500}" value="${p.kind === 'Home' ? 250000 : 12000}">
        <div style="display:flex;justify-content:space-between;margin-top:10px"><span class="label">Term</span><b class="num" id="tv"></b></div>
        <input type="range" id="t" min="12" max="${p.kind === 'Home' ? 360 : 72}" step="12" value="${p.kind === 'Home' ? 360 : 36}">
      </div>
      <div class="stats" style="margin-top:12px"><div><div class="label">Total interest</div><div class="v" id="ti"></div></div><div><div class="label">Total cost</div><div class="v" id="tc"></div></div></div>
      <div class="muted" style="font-size:12.5px;margin-top:14px">Checking your rate is a soft inquiry and won’t affect your credit score.</div>
    </div>
    <div class="footer-actions"><button class="btn primary" id="apply">Check my rate</button></div>`;
  },
  mount(el, p) {
    const rate = (p.kind === 'Home' ? 6.1 : p.kind === 'Auto' ? 5.2 : 8.9) / 1200;
    const a = $('#a', el), t = $('#t', el);
    const calc = () => {
      const P = +a.value, n = +t.value, e = P * rate * Math.pow(1 + rate, n) / (Math.pow(1 + rate, n) - 1);
      $('#emi', el).innerHTML = money(e); $('#av', el).textContent = moneyT(P, { noCents: true }); $('#tv', el).textContent = n % 12 ? n + ' months' : n / 12 + ' years';
      $('#ti', el).textContent = moneyT(e * n - P, { noCents: true }); $('#tc', el).textContent = moneyT(e * n, { noCents: true });
      [a, t].forEach(r => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%'));
      return e;
    };
    a.oninput = t.oninput = () => { calc(); haptic(2); }; calc();
    $('#apply', el).onclick = async () => {
      const e = calc();
      const done = await processing('Checking your rate', ['Verifying income from deposits…', 'Running a soft credit check…', 'Matching your best offer…'], 2700);
      SB.replace('success', { title: 'You’re approved', sub: `Money can be in Everyday within minutes once you accept.`, amt: +a.value, rows: [['Monthly payment', moneyT(e)], ['APR', (rate * 1200).toFixed(1) + '% fixed'], ['Term', t.value / 12 + ' years'], ['Offer valid', '30 days']] });
      done();
    };
  },
});

SB.reg('insurance', {
  render() {
    return `${topbar('Insurance')}
    <div class="body">
      <div class="label" style="margin:4px 0 10px">Your policies</div>
      <div class="list">${D.policies.map(p => `<button class="row pol" data-id="${p.id}"><div class="logo soft">${ic(p.icon)}</div><div class="main"><div class="t1">${p.name}</div><div class="t2">${compact(p.cover)} cover, ${moneyT(p.prem, { noCents: true })}/mo</div></div><div class="end"><span class="badge" style="${p.status === 'Active' ? '' : 'background:var(--neg-soft);color:var(--neg)'}">${p.status}</span><div class="t2" style="margin-top:6px;font-size:12px">${p.renew}</div></div></button>`).join('')}</div>
      <div class="label" style="margin:24px 0 10px">Get covered</div>
      <div class="grid2">${[['plane', 'Travel', 'From $4/trip'], ['house', 'Home', 'From $18/mo'], ['phone', 'Gadgets', 'From $6/mo'], ['heart', 'Life', 'From $21/mo']].map(([i, t, s]) => `<button class="tile q" data-t="${t}"><div class="logo soft">${ic(i)}</div><div><div class="t1">${t}</div><div class="t2" style="margin-top:2px">${s}</div></div></button>`).join('')}</div>
    </div>`;
  },
  mount(el) {
    $$('.q', el).forEach(b => b.onclick = async () => {
      const t = b.dataset.t;
      const done = await processing(`Getting ${t.toLowerCase()} quotes`, ['Reading your profile…', 'Comparing 6 insurers…', 'Best price found'], 2100); done();
      Sheet.open(`<h3>${t} insurance</h3><div class="sub">Best match from 6 insurers, based on your profile.</div>
        <div class="list flat">${[['Essential', 4, 'Basic cover'], ['Plus', 9, 'Recommended for you'], ['Premier', 16, 'Maximum cover']].map(([n, pr, d], i) => `<button class="row plan ${i === 1 ? 'on' : ''}"><div class="main"><div class="t1">${n}</div><div class="t2">${d}</div></div><div class="end"><div class="t1">$${pr * (t === 'Travel' ? 1 : 3)}${t === 'Travel' ? '/trip' : '/mo'}</div></div><span class="ck">${i === 1 ? ic('check', 'sm pos') : ''}</span></button>`).join('')}</div>
        <div style="margin-top:16px"><button class="btn primary" id="buyp">Get covered</button></div>`, {
        mount(sh) {
          $$('.plan', sh).forEach((r, i) => r.onclick = () => { $$('.plan .ck', sh).forEach((c, j) => c.innerHTML = i === j ? ic('check', 'sm pos') : ''); haptic(5); });
          $('#buyp', sh).onclick = async () => { Sheet.close(); const ok = await pinSheet(); if (!ok) return; const d = await processing('Issuing policy', ['Confirming cover…', 'Emailing your documents…'], 1600); SB.push('success', { title: 'You’re covered', sub: `${t} insurance starts today. Documents are in your email.`, amt: t === 'Travel' ? 9 : 27, rows: [['Plan', 'Plus'], ['Starts', 'Nov 18, 2026'], ['Policy no.', 'SBI‑' + Math.floor(100000 + Math.random() * 899999)]] }); d(); };
        },
      });
    });
    $$('.pol', el).forEach(b => b.onclick = () => {
      const p = D.policies.find(x => x.id === b.dataset.id);
      Sheet.open(`<h3>${p.name}</h3><div class="sub">${p.kind} insurance, ${p.renew.toLowerCase()}</div>
        <div class="panel pad">${[['Cover', moneyT(p.cover, { noCents: true })], ['Premium', moneyT(p.prem, { noCents: true }) + ' a month'], ['Deductible', '$500'], ['Policy no.', 'SBI‑' + (448120 + p.prem)]].map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}</div>
        <div class="grid2" style="margin-top:14px"><button class="btn secondary" id="claim">File a claim</button><button class="btn primary" id="ren">${p.status === 'Active' ? 'View card' : 'Renew now'}</button></div>`, {
        mount(sh) {
          $('#claim', sh).onclick = () => { Sheet.close(); toast('Claim started. An advisor will call you within 2 hours.', 'shield'); };
          $('#ren', sh).onclick = async () => { Sheet.close(); if (p.status === 'Active') return toast('Insurance card added to wallet', 'card'); const d = await processing('Renewing', ['Locking in your price…'], 1200); d(); p.status = 'Active'; p.renew = 'Renews Dec 2027'; SB.replace('insurance'); toast('Policy renewed for 12 months'); };
        },
      });
    });
  },
});

SB.reg('rewards', {
  render() {
    return `${topbar('Rewards')}
    <div class="body">
      <div class="hero" style="padding-top:6px"><div class="label">Points balance</div><div class="amount" style="font-size:calc(48px*var(--display-scale))">18,420</div><div class="meta">Worth $184.20 as cash back</div></div>
      <div class="grid2" style="margin-top:16px">${[['cash', 'Cash back', '$184.20'], ['plane', 'Travel', '$230 value'], ['gift', 'Gift cards', 'From 2,500'], ['heart', 'Donate', '1:1 match']].map(([i, t, s]) => `<button class="tile rd"><div class="logo soft">${ic(i)}</div><div><div class="t1">${t}</div><div class="t2" style="margin-top:2px">${s}</div></div></button>`).join('')}</div>
      <h2 class="sec">Earning on OneFI Metal</h2>
      <div class="list flat">${[['plane', '4×', 'Travel and hotels'], ['coffee', '3×', 'Dining'], ['cart', '2×', 'Groceries'], ['card', '1×', 'Everything else']].map(([i, m, t]) => `<div class="row"><div class="logo soft">${ic(i)}</div><div class="main"><div class="t1">${t}</div></div><div class="end"><div class="t1">${m}</div></div></div>`).join('')}</div>
    </div>`;
  },
  mount(el) { $$('.rd', el).forEach(b => b.onclick = async () => { const d = await processing('Redeeming', ['Converting points…'], 1100); d(); toast('Redeemed. $184.20 lands in Everyday today.', 'gift'); }); },
});
