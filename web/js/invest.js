// Investments: portfolio, holdings, fund detail, invest flow, auto-invest, explore
function holdRow(h) {
  const pct = h.chg;
  return `<button class="row" data-push="fund" data-p='{"id":"${h.id}"}'>${logo(h.sym, h.hue, null)}<div class="main"><div class="t1">${h.name}</div><div class="t2">${h.kind}${h.qty ? ', ' + h.qty + ' shares' : ''}</div></div><div class="end"><div class="t1">${moneyT(h.val)}</div><div class="t2 ${pct >= 0 ? 'pos' : 'neg'}">${pct >= 0 ? '+' : '−'}${Math.abs(pct).toFixed(2)}%</div></div></button>`;
}
function allocation() {
  const g = {}; D.holdings.forEach(h => { const k = h.kind === 'Fund' ? 'Funds' : h.kind === 'Stock' ? 'Stocks' : h.kind; g[k] = (g[k] || 0) + h.val; });
  const cols = { Funds: 'var(--cat-1)', Stocks: 'var(--cat-3)', Bonds: 'var(--cat-2)', Gold: 'var(--cat-4)', Crypto: 'var(--cat-5)' };
  return Object.entries(g).map(([k, v]) => ({ k, v, c: cols[k] })).sort((a, b) => b.v - a.v);
}

SB.reg('invest', {
  tab: true,
  render() {
    const tot = D.investTotal;
    const al = allocation();
    return `<div class="hello"><div class="who"><div class="t1" style="font-size:22px">Invest</div></div>
      <button class="iconbtn" data-push="explore">${ic('search', 'sm')}</button><button class="iconbtn" data-push="sips">${ic('repeat', 'sm')}</button></div>
    <div class="body">
      <div class="hero" style="padding-top:10px">
        <div class="label" id="ilabel">Portfolio value</div>
        <div class="amount" id="ival">${money(tot)}</div>
        <div class="meta" id="imeta"><span class="delta up">${ic('up', 'xs')} ${moneyT(D.charts.investChg['1D'])}</span><span>+0.71% today</span></div>
      </div>
      <div id="ichart" style="height:180px;margin:14px -20px 0"></div>
      <div class="seg" id="rng" style="margin-top:12px">${Object.keys(D.charts.invest).map((k, i) => `<button class="${i === 0 ? 'on' : ''}" data-r="${k}">${k}</button>`).join('')}</div>

      <div class="grid2" style="margin-top:18px">
        <button class="tile" data-push="explore"><div class="logo soft">${ic('plus')}</div><div><div class="t1">Invest</div><div class="t2" style="margin-top:2px">Funds, stocks, gold</div></div></button>
        <button class="tile" data-push="sips"><div class="logo soft">${ic('repeat')}</div><div><div class="t1">Auto‑invest</div><div class="t2" style="margin-top:2px">$750 a month</div></div></button>
      </div>

      <h2 class="sec">Allocation</h2>
      <div class="panel pad" style="display:flex;gap:18px;align-items:center">
        ${donut(al.map(a => ({ v: a.v, c: a.c })), 128, 14, `<div><div class="label" style="font-size:11.5px">Risk</div><div style="font-weight:600;margin-top:2px">Balanced</div></div>`)}
        <div class="legend" style="flex:1">${al.map(a => `<div class="li"><i class="sw" style="background:${a.c}"></i>${a.k}<span class="v">${Math.round(a.v / tot * 100)}%</span></div>`).join('')}</div>
      </div>

      <h2 class="sec">Holdings <button data-push="explore">Explore</button></h2>
      <div class="list">${D.holdings.map(holdRow).join('')}</div>

      <div class="insight" style="margin-top:18px"><div class="head">${halo('ready', 22, 'still')}OneFI on your portfolio</div>
        <p>Stocks and crypto are 26% of your portfolio, up from your 20% target. Rebalancing $4,800 into bonds would bring risk back in line.</p>
        <div class="acts"><button class="btn primary" id="rebal">Review rebalance</button><button class="btn secondary" data-push="assistant">Ask why</button></div></div>
    </div>`;
  },
  mount(el) {
    let range = '1D';
    const draw = (animate = true) => {
      const v = D.charts.invest[range];
      areaChart($('#ichart', el), v, {
        h: 180, scrub: true, animate, sw: 2.2, bottom: 6,
        onScrub: (val, i) => { $('#ival', el).innerHTML = money(val); $('#ilabel', el).textContent = range === '1D' ? `${9 + Math.floor(i / 6.5)}:${String((i * 9) % 60).padStart(2, '0')}` : `${i + 1} of ${v.length} points`; },
        onEnd: () => { $('#ival', el).innerHTML = money(D.investTotal); $('#ilabel', el).textContent = 'Portfolio value'; },
      });
      const chg = D.charts.investChg[range]; const pct = chg / (D.investTotal - chg) * 100;
      $('#imeta', el).innerHTML = `<span class="delta up">${ic('up', 'xs')} ${moneyT(chg, { noCents: range !== '1D' })}</span><span>+${pct.toFixed(2)}% ${range === '1D' ? 'today' : range === 'All' ? 'all time' : 'this ' + { '1W': 'week', '1M': 'month', '1Y': 'year' }[range]}</span>`;
    };
    requestAnimationFrame(() => { draw(); animateDonuts(el); });
    $$('#rng button', el).forEach(b => b.onclick = () => { $$('#rng button', el).forEach(x => x.classList.remove('on')); b.classList.add('on'); range = b.dataset.r; haptic(5); draw(); });
    $('#rebal', el).onclick = () => SHEETS.rebalance();
  },
});

SHEETS.rebalance = () => {
  Sheet.open(`<h3>Rebalance plan</h3><div class="sub">The assistant suggests these trades to return to your Balanced target. No tax impact: all sales are in tax‑advantaged accounts.</div>
    <div class="list flat">${[['Sell', 'Nova Robotics', 2400], ['Sell', 'Bitcoin', 900], ['Sell', 'Orbit Cloud', 1500], ['Buy', 'Aggregate Bond Fund', 4800]].map(([a, n, v]) => `<div class="row"><div class="logo soft">${ic(a === 'Buy' ? 'plus' : 'minus')}</div><div class="main"><div class="t1">${n}</div><div class="t2">${a}</div></div><div class="end"><div class="t1 ${a === 'Buy' ? 'pos' : ''}">${moneyT(v, { noCents: true })}</div></div></div>`).join('')}</div>
    <div style="margin-top:16px"><button class="btn primary" id="go">Place 4 orders</button></div>`, {
    mount(sh) {
      $('#go', sh).onclick = async e => {
        e.currentTarget.innerHTML = '<div class="spin"></div>'; await wait(400); Sheet.close();
        const done = await processing('Placing orders', ['Checking market hours…', 'Routing 4 orders…', 'Orders queued for 9:30 AM open'], 2100);
        done(); toast('4 orders placed. They fill at market open.', 'invest');
      };
    },
  });
};

SB.reg('fund', {
  render({ id }) {
    const h = D.holdings.find(x => x.id === id) || D.explore.find(x => x.id === id);
    const own = !!h.val;
    return `${topbar(h.sym, `<button class="iconbtn" id="wl">${ic('heart', 'sm')}</button>`)}
    <div class="body">
      <div style="display:flex;gap:12px;align-items:center;margin-top:4px">${logo(h.sym, h.hue, null)}<div><div style="font-weight:600;font-size:17px">${h.name}</div><div class="muted" style="font-size:13px">${h.kind || 'Fund'}, ${h.risk} risk</div></div></div>
      <div class="hero" style="padding-top:18px"><div class="label" id="fl">${own ? 'Your position' : 'Price'}</div><div class="amount" id="fv">${own ? money(h.val) : money(48.2 + h.ret)}</div>
      <div class="meta"><span class="delta ${h.ret >= 0 ? 'up' : 'down'}">${h.ret >= 0 ? '+' : '−'}${Math.abs(h.ret).toFixed(1)}%</span><span>past year</span></div></div>
      <div id="fc" style="height:170px;margin:14px -20px 6px"></div>
      <div class="stats" style="margin-top:12px">
        ${[['1Y return', (h.ret >= 0 ? '+' : '') + h.ret + '%'], ['Risk', h.risk], h.er != null ? ['Expense ratio', h.er + '%'] : ['Market cap', '$' + (h.hue / 3).toFixed(1) + 'B'], ['Min. investment', '$1'], own ? ['Invested', moneyT(h.val / (1 + h.ret / 100), { noCents: true })] : ['Rating', '4 of 5'], own ? ['Gain', moneyT(h.val - h.val / (1 + h.ret / 100), { sign: true, noCents: true })] : ['Holders', (h.hue * 113).toLocaleString()]].map(([k, v]) => `<div><div class="label">${k}</div><div class="v">${v}</div></div>`).join('')}
      </div>
      <h2 class="sec">About</h2>
      <p class="muted" style="font-size:14.5px;line-height:1.55">${h.kind === 'Stock' ? `${h.name} is a fictional company used in this prototype. Prices are simulated and move every time the app loads.` : `A low‑cost ${h.kind === 'Bonds' ? 'bond' : 'diversified'} fund held by thousands of OneFI investors. Prices and returns in this prototype are simulated.`}</p>
    </div>
    <div class="footer-actions">${own ? '<button class="btn secondary" id="sell">Sell</button>' : ''}<button class="btn primary" id="buy">${own ? 'Buy more' : 'Invest'}</button></div>`;
  },
  mount(el, { id }) {
    const h = D.holdings.find(x => x.id === id) || D.explore.find(x => x.id === id);
    const base = h.val || 48.2 + h.ret;
    const vals = series(70, base / (1 + h.ret / 100), base, base * 0.035, h.hue);
    requestAnimationFrame(() => areaChart($('#fc', el), vals, { h: 170, scrub: true, color: h.ret >= 0 ? 'var(--chart)' : 'var(--neg)', onScrub: v => $('#fv', el).innerHTML = money(v), onEnd: () => $('#fv', el).innerHTML = money(base) }));
    $('#buy', el).onclick = () => SB.push('investamt', { id });
    const s = $('#sell', el); if (s) s.onclick = () => SB.push('investamt', { id, sell: 1 });
    $('#wl', el).onclick = e => { e.currentTarget.style.color = 'var(--neg)'; toast('Added to your watchlist', 'heart'); };
  },
});

SB.reg('investamt', {
  render({ id, sell }) {
    const h = D.holdings.find(x => x.id === id) || D.explore.find(x => x.id === id);
    return `${topbar(sell ? 'Sell' : 'Invest', '<div class="spacer"></div>', 'x')}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden">
      <div>
        <div class="payee">${logo(h.sym, h.hue, null)}<div class="t1">${h.name}</div><div class="t2">${sell ? 'You hold ' + moneyT(h.val) : 'From Everyday •• 4821'}</div></div>
        <div class="amt-entry"><div class="amount" id="amt">${money(0, { noCents: true })}</div></div>
        ${sell ? '' : `<div style="display:flex;justify-content:center;margin-top:4px"><div class="seg" id="freq" style="width:240px"><button class="on" data-f="once">One time</button><button data-f="monthly">Monthly</button></div></div>`}
        <div class="quick-amts" style="margin-top:14px">${[100, 250, 500, 1000].map(v => `<button class="chip mini qa" data-v="${v}">$${v}</button>`).join('')}</div>
      </div>
      <div>
        <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '00', 0, 'del'].map(k => `<button class="key" data-k="${k}">${k === 'del' ? ic('left') : k}</button>`).join('')}</div>
        <div class="footer-actions"><button class="btn primary" id="go" disabled>Review order</button></div>
      </div>
    </div>`;
  },
  mount(el, p) {
    const h = D.holdings.find(x => x.id === p.id) || D.explore.find(x => x.id === p.id);
    let s = '', freq = 'once';
    const draw = () => { $('#amt', el).innerHTML = money(+s || 0, { noCents: true }); $('#go', el).disabled = !(+s > 0); };
    $$('.key', el).forEach(b => b.onclick = () => { const k = b.dataset.k; haptic(4); if (k === 'del') s = s.slice(0, -1); else if (s.length < 6) s = (s + k).replace(/^0+/, ''); if (p.sell && +s > h.val) { s = String(Math.floor(h.val)); toast('Capped at your position', 'info'); } draw(); });
    $$('.qa', el).forEach(b => b.onclick = () => { s = b.dataset.v; haptic(5); draw(); });
    $$('#freq button', el).forEach(b => b.onclick = () => { $$('#freq button', el).forEach(x => x.classList.remove('on')); b.classList.add('on'); freq = b.dataset.f; haptic(5); });
    $('#go', el).onclick = () => {
      const amt = +s;
      Sheet.open(`<h3>${p.sell ? 'Sell' : freq === 'monthly' ? 'Start auto‑invest' : 'Buy'} ${h.sym}</h3><div class="sub">${p.sell ? 'Proceeds land in Everyday in 1 business day.' : freq === 'monthly' ? 'We’ll invest this on the 5th of every month. Pause anytime.' : 'Orders placed now fill at the next market price.'}</div>
        <div class="panel pad">${[['Amount', moneyT(amt)], ['Est. price', '$' + (48.2 + (h.ret || 0)).toFixed(2)], ['Est. units', (amt / (48.2 + (h.ret || 0))).toFixed(3)], ['Fee', 'Free']].map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}</div>
        <div style="margin-top:16px" id="hold"></div>`, {
        mount(sh) {
          holdButton($('#hold', sh), `Hold to ${p.sell ? 'sell' : 'invest'} ${moneyT(amt, { noCents: true })}`, async () => {
            Sheet.close();
            const ok = await pinSheet(); if (!ok) return;
            const done = await processing(p.sell ? 'Placing sell order' : 'Placing order', ['Checking buying power…', 'Sending to exchange…', 'Order confirmed'], 2000);
            if (freq === 'monthly') D.sips.push({ id: 's' + Date.now(), fund: h.name, amt, day: '5th', next: 'Dec 5' });
            else if (D.holdings.includes(h)) { h.val += p.sell ? -amt : amt; D.investTotal += p.sell ? -amt : amt; }
            SB.replace('success', { title: p.sell ? 'Sell order placed' : freq === 'monthly' ? 'Auto‑invest started' : 'Order placed', sub: freq === 'monthly' ? `First investment on Dec 5.` : `${h.name}, filled at market price.`, amt, rows: [['Fund', h.sym], ['Order type', freq === 'monthly' ? 'Monthly, on the 5th' : 'Market'], ['Status', '<span class="pos">Confirmed</span>']] });
            done();
          });
        },
      });
    };
  },
});

SB.reg('explore', {
  render() {
    return `${topbar('Explore')}
    <div class="body">
      <label class="search">${ic('search', 'sm')}<input id="eq" placeholder="Funds, stocks, themes"></label>
      <div class="chips" style="margin-top:12px">${['All', 'Trending', 'Low risk', 'Income', 'Thematic', 'Global'].map((c, i) => `<button class="chip ${i ? '' : 'on'}" data-t="${c}">${c}</button>`).join('')}</div>
      <h2 class="sec">Collections</h2>
      <div class="chips" style="gap:12px">${[['AI & automation', 'rocket', 260], ['Clean energy', 'bolt', 120], ['Dividends', 'coins', 40], ['Gold & metals', 'target', 45]].map(([t, i, h]) => `<button class="tile" style="flex:0 0 150px;background:${mono(h, 14)};color:#fff;border:0"><div class="logo" style="background:rgba(255,255,255,.16)">${ic(i)}</div><div class="t1">${t}</div></button>`).join('')}</div>
      <h2 class="sec">Popular now</h2>
      <div class="list" id="el">${D.explore.map(e => `<button class="row" data-t="${e.tag}" data-push="fund" data-p='{"id":"${e.id}"}'>${logo(e.sym, e.hue, null)}<div class="main"><div class="t1">${e.name}</div><div class="t2">${e.tag}, ${e.risk} risk</div></div><div class="end"><div class="t1 pos">+${e.ret}%</div><div class="t2">1Y</div></div></button>`).join('')}</div>
    </div>`;
  },
  mount(el) {
    $$('.chips .chip', el).forEach(c => c.onclick = () => { $$('.chips .chip', el).forEach(x => x.classList.remove('on')); c.classList.add('on'); const t = c.dataset.t; $$('#el .row', el).forEach(r => r.style.display = t === 'All' || r.dataset.t === t ? '' : 'none'); haptic(5); });
    $('#eq', el).oninput = e => { const q = e.target.value.toLowerCase(); $$('#el .row', el).forEach(r => r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none'); };
  },
});

SB.reg('sips', {
  render() {
    const tot = D.sips.reduce((s, x) => s + x.amt, 0);
    return `${topbar('Auto‑invest')}
    <div class="body">
      <div class="hero" style="padding-top:6px"><div class="label">Invested every month</div><div class="amount" style="font-size:calc(44px*var(--display-scale))">${money(tot, { noCents: true })}</div><div class="meta">${D.sips.length} plans, next on Dec 5</div></div>
      <div class="list" style="margin-top:18px">${D.sips.map(s => `<div class="row"><div class="logo soft">${ic('repeat')}</div><div class="main"><div class="t1">${s.fund}</div><div class="t2">${moneyT(s.amt, { noCents: true })} on the ${s.day}, next ${s.next}</div></div>${sw(true, `data-id="${s.id}"`)}</div>`).join('')}</div>
      <div class="panel pad" style="margin-top:16px"><div style="font-weight:600">If you keep this up</div><div class="muted" style="font-size:13.5px;margin-top:4px">At a 7% average return, ${moneyT(tot, { noCents: true })} a month grows to about</div>
        <div class="amount" style="font-size:calc(32px*var(--display-scale));margin-top:12px">${money(tot * 12 * ((Math.pow(1.07, 20) - 1) / .07), { noCents: true })}</div><div class="muted" style="font-size:13px;margin-top:6px">in 20 years. Projections aren’t guaranteed.</div></div>
      <button class="btn secondary" style="margin-top:14px" data-push="explore">New plan</button>
    </div>`;
  },
  mount(el) { bindSwitches(el, (s, on) => toast(on ? 'Plan resumed' : 'Plan paused. Resume anytime.', 'repeat')); },
});
