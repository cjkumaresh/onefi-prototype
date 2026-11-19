// Home, accounts, transactions, notifications
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }

const BUDGETS = { groceries: 400, shopping: 300, dining: 350, transport: 200, subs: 60, health: 120 };
SB.reg('home', {
  tab: true,
  render() {
    const masked = store.get('masked', false);
    const unread = D.notifs.filter(n => n.unread).length;
    const acct = D.accounts.find(a => a.id === store.get('homeAcct', 'chk')) || D.accounts[0];
    const rows = D.spend.month.filter(x => BUDGETS[x.cat]).sort((a, b) => b.v - a.v).slice(0, 3);
    return `
    <div class="hello2">
      <div><div class="w1">Welcome back,</div><div class="w2">${D.user.first} ${D.user.last}</div></div>
      <button class="iconbtn" data-push="notifs" aria-label="Notifications">${ic('bell')}${unread ? '<i class="dot"></i>' : ''}</button>
    </div>
    <div class="body ${masked ? 'masked' : ''}" id="hb">
      <div class="bal">
        <div class="lbl" style="display:flex;align-items:center;gap:6px">Your balance <button class="eye" id="eye" aria-label="Hide balance">${ic(masked ? 'eyeoff' : 'eye', 'xs')}</button></div>
        <div class="amount" id="nw">${money(acct.bal, { cur: acct.cur || '$' })}</div>
        <div class="meta2"><button class="acctpill" id="acp">${acct.name} ••${acct.num} ${ic('down')}</button><span class="chg">+${moneyT(1240, { noCents: true })} this month</span></div>
      </div>
      <div class="act4">
        <button class="atile dark" data-sheet="addmoney">${ic('plus')}Add</button>
        <button class="atile" data-push="contacts">${ic('send')}Send</button>
        <button class="atile" data-push="request">${ic('request')}Request</button>
        <button class="atile" data-push="scan" data-mode="up">${ic('scan')}Scan</button>
      </div>

      <h2 class="sec">Your spending <button data-push="insights">View all</button></h2>
      <div class="sprows">${rows.map(x => { const c = D.cats[x.cat], l = D.spend.last[x.cat], d = Math.round((x.v - l) / l * 100), bud = BUDGETS[x.cat]; return `
        <button class="sprow" data-push="insights"><div class="ic2">${ic(c.icon)}</div><div class="mn">
          <div class="r1"><b>${c.name}</b><span>${moneyT(x.v, { noCents: true })}</span></div>
          <div class="r2"><span class="${d > 0 ? 'neg' : 'pos'}" style="white-space:nowrap">${d > 0 ? '▲' : '▼'} ${Math.abs(d)}% vs Oct</span><span class="bt"><i style="width:${Math.min(100, x.v / bud * 100)}%"></i></span><span class="of">of ${moneyT(bud, { noCents: true })}</span></div>
        </div></button>`; }).join('')}</div>

      <div class="tipcard">${halo('ready', 38)}<p>Dining is down 18% from October. Moving <b>$250</b> to Japan in spring keeps you on track.</p><button class="askp" id="tipAsk">Ask</button></div>

      <h2 class="sec">Accounts <button data-sheet="addmoney">Add money</button></h2>
      <div class="acct-rail">
        ${D.accounts.map(a => `<button class="acct" data-push="account" data-p='{"id":"${a.id}"}'>
          <div class="top"><span>${a.name}</span>${ic(a.icon, 'xs')}</div>
          <div><div class="amount">${money(a.bal, { cur: a.cur || '$' })}</div><div class="sub">${a.apy ? a.apy.toFixed(2) + '% APY' : a.type} •• ${a.num}</div></div>
        </button>`).join('')}
      </div>

      <h2 class="sec">Upcoming bills <button data-push="bills">See all</button></h2>
      <div class="bills">
        ${D.bills.slice(0, 4).map(b => `<button class="bill" data-push="paybill" data-p='{"id":"${b.id}"}'>
          ${logo(b.name, 30 + b.days * 9, b.icon)}<div class="t1">${b.name.split(' ').slice(0, 2).join(' ')}</div><div class="t2 num">${moneyT(b.amt)}</div>
          <div class="due ${b.days <= 3 ? 'neg' : 'faint'}">${b.due}</div></button>`).join('')}
      </div>

      <h2 class="sec">Recent activity <button data-push="txs">See all</button></h2>
      <div id="recent">${skeletonList(5)}</div>

      <h2 class="sec">Savings goals <button data-push="goals">Manage</button></h2>
      <div class="list flat">${D.goals.slice(0, 2).map(goalRow).join('')}</div>
    </div>`;
  },
  mount(el) {
    const first = !SB._homeSeen; SB._homeSeen = true;
    const acct = D.accounts.find(a => a.id === store.get('homeAcct', 'chk')) || D.accounts[0];
    if (first) countUp($('#nw', el), acct.bal, 1000, { cur: acct.cur || '$' });
    setTimeout(() => { const r = $('#recent', el); if (r) r.innerHTML = `<div class="list fade-in">${D.tx.slice(0, 5).map(txRow).join('')}</div>`; }, first ? 900 : 250);
    $('#eye', el).onclick = () => { const m = !store.get('masked', false); store.set('masked', m); $('#hb', el).classList.toggle('masked', m); $('#eye', el).innerHTML = ic(m ? 'eyeoff' : 'eye', 'xs'); haptic(); };
    $('#acp', el).onclick = () => Sheet.open(`<h3>Show balance for</h3><div class="list flat" style="margin-top:12px">${D.accounts.map(a => `<button class="row" data-id="${a.id}"><div class="logo soft">${ic(a.icon)}</div><div class="main"><div class="t1">${a.name}</div><div class="t2">${a.type} ••${a.num}</div></div><div class="end"><div class="t1">${moneyT(a.bal, { cur: a.cur || '$' })}</div></div>${a.id === acct.id ? ic('check', 'sm') : ''}</button>`).join('')}</div>`, {
      mount(sh) { $$('[data-id]', sh).forEach(r => r.onclick = () => { store.set('homeAcct', r.dataset.id); Sheet.close(); SB._homeSeen = false; SB.root('home', {}, null); }); },
    });
    $('#tipAsk', el).onclick = () => { SB._pendingAsk = 'How much did I spend on dining this month?'; SB.push('assistant'); };
  },
  onReturn(el) { const r = $('#recent', el); if (r && !r.querySelector('.sk')) r.innerHTML = `<div class="list">${D.tx.slice(0, 5).map(txRow).join('')}</div>`; },
});

function goalRow(g) {
  const p = Math.min(100, g.saved / g.target * 100);
  return `<button class="row" data-push="goals"><div class="logo soft">${ic(g.icon)}</div><div class="main"><div style="display:flex;justify-content:space-between"><div class="t1">${g.name}</div><div class="t1 num" style="font-size:14px">${Math.round(p)}%</div></div>
  <div class="progress" style="margin:8px 0 6px"><i style="width:${p}%"></i></div><div class="t2">${moneyT(g.saved, { noCents: true })} of ${moneyT(g.target, { noCents: true })}, ${g.due}</div></div></button>`;
}

SB.reg('account', {
  render({ id }) {
    const a = D.accounts.find(x => x.id === id);
    const txs = D.tx.filter(t => t.acct === 'chk').slice(0, 8);
    return `${topbar(a.name, `<button class="iconbtn" data-sheet="acctinfo" data-p='{"id":"${id}"}'>${ic('info', 'sm')}</button>`)}
    <div class="body">
      <div class="hero" style="padding-top:8px"><div class="label">${a.type} •• ${a.num}</div><div class="amount" style="font-size:calc(46px*var(--display-scale))">${money(a.bal, { cur: a.cur || '$' })}</div>
      <div class="meta">${a.apy ? `<span class="delta up">${a.apy}% APY</span><span>Earned $108.42 this month</span>` : a.usd ? `<span>≈ ${moneyT(a.usd)}</span><span>1 EUR = 1.083 USD</span>` : `<span>Available now</span>`}</div></div>
      <div class="actions" style="grid-template-columns:repeat(3,1fr)">
        <button class="action" data-sheet="addmoney"><div class="disc">${ic('plus')}</div>Add money</button>
        <button class="action" data-push="transfer"><div class="disc">${ic('swap')}</div>Move</button>
        <button class="action" data-sheet="statement"><div class="disc">${ic('receipt')}</div>Statements</button>
      </div>
      <h2 class="sec">Activity</h2>
      <div class="list">${txs.map(txRow).join('')}</div>
    </div>`;
  },
});

SHEETS.acctinfo = ({ id }) => {
  const a = D.accounts.find(x => x.id === id);
  Sheet.open(`<h3>Account details</h3><div class="sub">Share these to receive transfers.</div>
    <div class="panel pad">${[['Account holder', D.user.first + ' ' + D.user.last], ['Account number', '•••• •••• ' + a.num], ['Routing number', '021 000 089'], ['Bank', 'OneFI Bank, N.A.']].map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}</div>
    <div style="display:flex;gap:10px;margin-top:16px"><button class="btn secondary" id="cp">${ic('copy', 'sm')} Copy</button><button class="btn primary" id="sh">${ic('share', 'sm')} Share</button></div>`, {
    mount(sh) { $('#cp', sh).onclick = () => { Sheet.close(); toast('Account details copied', 'copy'); }; $('#sh', sh).onclick = () => { Sheet.close(); toast('Share sheet opened', 'share'); }; },
  });
};
SHEETS.statement = () => {
  Sheet.open(`<h3>Statements</h3><div class="sub">Monthly PDF statements for Everyday •• 4821</div>
    <div class="list flat">${['October 2026', 'September 2026', 'August 2026', 'July 2026'].map(m => `<button class="row st"><div class="logo soft">${ic('receipt')}</div><div class="main"><div class="t1">${m}</div><div class="t2">PDF, 214 KB</div></div>${ic('share', 'sm chev')}</button>`).join('')}</div>`, {
    mount(sh) { $$('.st', sh).forEach(b => b.onclick = async () => { b.querySelector('.chev').outerHTML = '<div class="spin" style="width:18px;height:18px;border:2px solid var(--text-2);border-right-color:transparent;border-radius:50%;animation:spin .7s linear infinite"></div>'; await wait(900); Sheet.close(); toast('Statement downloaded'); }); },
  });
};
SHEETS.addmoney = () => {
  Sheet.open(`<h3>Add money</h3><div class="sub">Top up Everyday •• 4821</div>
    <div class="list flat">
      ${[['bank', 'Bank transfer', 'Free, arrives in 1–2 days'], ['card', 'Debit card', 'Instant, 0.5% fee'], ['wave', 'Tap to add', 'Instant from another phone']].map(([i, t, s]) => `<button class="row am"><div class="logo soft">${ic(i)}</div><div class="main"><div class="t1">${t}</div><div class="t2">${s}</div></div>${ic('right', 'sm chev')}</button>`).join('')}
    </div>`, {
    mount(sh) { $$('.am', sh).forEach(b => b.onclick = () => { Sheet.close(); setTimeout(() => SB.push('amount', { mode: 'add', title: 'Add money' }), 200); }); },
  });
};

SB.reg('txs', {
  render() {
    const cats = ['All', 'dining', 'groceries', 'transport', 'shopping', 'subs', 'travel', 'income'];
    return `${topbar('Transactions', `<button class="iconbtn" data-push="insights">${ic('pie', 'sm')}</button>`)}
    <div class="body">
      <label class="search">${ic('search', 'sm')}<input id="q" placeholder="Search merchants or notes"></label>
      <div class="chips" style="margin-top:12px" id="cf">${cats.map((c, i) => `<button class="chip ${i ? '' : 'on'}" data-c="${c}">${c === 'All' ? 'All' : D.cats[c].name}</button>`).join('')}</div>
      <div id="txl">${skeletonList(6)}</div>
    </div>`;
  },
  mount(el) {
    let cat = 'All', q = '';
    const draw = () => {
      const list = D.tx.filter(t => (cat === 'All' || t.cat === cat) && (!q || (t.name + t.note).toLowerCase().includes(q)));
      if (!list.length) { $('#txl', el).innerHTML = `<div class="empty">No transactions match “${q || D.cats[cat].name}”. Try another search or filter.</div>`; return; }
      const groups = {}; list.forEach(t => { const k = dayLabel(t.date); (groups[k] = groups[k] || []).push(t); });
      $('#txl', el).innerHTML = Object.entries(groups).map(([k, ts]) => `<div class="datehead">${k}</div><div class="list">${ts.map(txRow).join('')}</div>`).join('');
    };
    setTimeout(draw, 650);
    $$('#cf .chip', el).forEach(c => c.onclick = () => { $$('#cf .chip', el).forEach(x => x.classList.remove('on')); c.classList.add('on'); cat = c.dataset.c; haptic(5); draw(); });
    $('#q', el).oninput = e => { q = e.target.value.toLowerCase(); draw(); };
  },
});

SHEETS.tx = ({ id }) => {
  const t = D.tx.find(x => x.id === id); const cat = D.cats[t.cat];
  Sheet.open(`<div style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:8px 0 18px">
      ${t.person ? avatar({ name: t.name, hue: t.hue }, '') : logo(t.name, t.hue, cat.icon)}
      <div style="margin-top:12px;font-weight:600;font-size:17px">${t.name}</div>
      <div class="amount" style="font-size:calc(40px*var(--display-scale));margin-top:10px">${money(t.amt, { sign: t.amt > 0 })}</div>
      <div class="muted" style="margin-top:8px;font-size:14px">${dayLabel(t.date)}, ${t.time}</div></div>
    <div class="panel pad">${[['Status', '<span class="pos">Completed</span>'], ['Category', cat.name], ['Account', 'Everyday •• 4821'], ['Reference', 'SB' + (928341 + t.id.length * 77 + parseInt(t.id.slice(1)) * 131)]].map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}</div>
    <div class="grid2" style="margin-top:14px">
      <button class="btn secondary" id="split">${ic('split', 'sm')} Split</button>
      <button class="btn secondary" id="rep">${ic('alert', 'sm')} Report</button>
    </div>`, {
    mount(sh) {
      $('#split', sh).onclick = () => { Sheet.close(); setTimeout(() => SB.push('contacts', { split: t.id }), 220); };
      $('#rep', sh).onclick = () => { Sheet.close(); toast('Dispute opened. We’ll update you within 24 hours.', 'shield'); };
    },
  });
};

SB.reg('notifs', {
  render() {
    return `${topbar('Notifications', `<button class="iconbtn" id="mr">${ic('check', 'sm')}</button>`)}
    <div class="body"><div class="list">${D.notifs.map(n => `<div class="row"><div class="logo soft">${ic(n.icon)}</div><div class="main"><div class="t1" style="white-space:normal">${n.t}</div><div class="t2" style="white-space:normal">${n.d}</div></div><div class="end faint" style="font-size:12px;align-self:flex-start">${n.ago}${n.unread ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--accent);margin:8px 0 0 auto"></div>' : ''}</div></div>`).join('')}</div></div>`;
  },
  mount(el) { $('#mr', el).onclick = () => { D.notifs.forEach(n => n.unread = false); SB.replace('notifs'); toast('All caught up'); }; },
});

SB.reg('search', {
  render() {
    return `<div class="topbar"><label class="search" style="flex:1">${ic('search', 'sm')}<input id="sq" placeholder="Search payments, funds, settings"></label><button class="btn ghost" data-back style="width:auto;padding:0 4px">Cancel</button></div>
    <div class="body" id="sr"><div class="datehead">Try</div><div class="chips" style="flex-wrap:wrap;margin:0;padding:0">${['Rent', 'Freeze card', 'Japan', 'Coffee', 'Credit score', 'Bitcoin'].map(s => `<button class="chip">${s}</button>`).join('')}</div></div>`;
  },
  mount(el) {
    const inp = $('#sq', el); setTimeout(() => inp.focus(), 450);
    const go = q => {
      q = q.toLowerCase(); if (!q) return;
      const tx = D.tx.filter(t => (t.name + t.note + D.cats[t.cat].name).toLowerCase().includes(q)).slice(0, 5);
      const h = D.holdings.filter(x => (x.name + x.sym).toLowerCase().includes(q));
      const feats = [['Freeze card', 'cards', 'snow'], ['Credit score', 'credit', 'gauge'], ['Savings goals', 'goals', 'target'], ['Appearance', 'profile', 'palette'], ['Loans', 'loans', 'cash'], ['Insurance', 'insurance', 'shield'], ['Spending insights', 'insights', 'pie']].filter(f => f[0].toLowerCase().includes(q) || q.includes(f[0].split(' ')[0].toLowerCase()));
      $('#sr', el).innerHTML = (feats.length ? `<div class="datehead">Features</div><div class="list flat">${feats.map(f => `<button class="row" ${f[1] === 'cards' ? 'data-tab="cards"' : `data-push="${f[1]}"`}><div class="logo soft">${ic(f[2] === 'gauge' ? 'target' : f[2])}</div><div class="main"><div class="t1">${f[0]}</div></div>${ic('right', 'sm chev')}</button>`).join('')}</div>` : '') +
        (h.length ? `<div class="datehead">Investments</div><div class="list">${h.map(holdRow).join('')}</div>` : '') +
        (tx.length ? `<div class="datehead">Transactions</div><div class="list">${tx.map(txRow).join('')}</div>` : '') +
        (!feats.length && !h.length && !tx.length ? `<div class="empty">Nothing found for “${q}”. Check the spelling or ask the assistant.</div>` : '');
    };
    inp.oninput = () => go(inp.value);
    $$('.chip', el).forEach(c => c.onclick = () => { inp.value = c.textContent; go(c.textContent); });
  },
});

SB.reg('goals', {
  render() {
    const tot = D.goals.reduce((s, g) => s + g.saved, 0);
    return `${topbar('Savings goals', `<button class="iconbtn" id="ng">${ic('plus', 'sm')}</button>`)}
    <div class="body"><div class="hero" style="padding-top:6px"><div class="label">Saved across goals</div><div class="amount" style="font-size:calc(44px*var(--display-scale))">${money(tot)}</div><div class="meta"><span class="delta up">4.60% APY</span><span>Round-ups on, $38 this month</span></div></div>
    <div class="list flat" style="margin-top:20px">${D.goals.map(goalRow).join('')}</div>
    <div class="panel pad" style="margin-top:14px;display:flex;gap:14px;align-items:center">${halo('ready', 38, 'still')}<div style="flex:1;font-size:14px">Want the assistant to plan a goal for you? It looks at your income and spending to pick a monthly amount.</div></div>
    <button class="btn secondary" style="margin-top:12px" data-push="assistant">Plan with the assistant</button></div>`;
  },
  mount(el) { $('#ng', el).onclick = () => toast('New goal drafted. Name it in the next step.', 'target'); },
});
