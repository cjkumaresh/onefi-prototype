// Atlas — the simulated AI money copilot
const PROMPTS = [
  ['coffee', 'How much did I spend on dining this month?', 'dining'],
  ['plane', 'Can I afford a $3,000 trip in March?', 'afford'],
  ['coins', 'Find ways for me to save more each month', 'save'],
  ['pie', 'Is my portfolio too risky?', 'risk'],
  ['flame', 'When could I reach financial independence?', 'fire'],
];

function intentOf(q) {
  q = q.toLowerCase();
  if (/din|food|restaurant|eat|coffee|spend|spent/.test(q)) return 'dining';
  if (/afford|trip|travel|vacation|holiday|japan/.test(q)) return 'afford';
  if (/save|saving|cut|subscript|cheaper|budget/.test(q)) return 'save';
  if (/risk|portfolio|invest|rebalanc|stock|crypto/.test(q)) return 'risk';
  if (/retire|fire|independ|freedom|million/.test(q)) return 'fire';
  if (/score|credit/.test(q)) return 'credit';
  if (/bill|due|rent/.test(q)) return 'bills';
  if (/freeze|lost|stolen|card/.test(q)) return 'card';
  if (/balance|how much (do|have)|net worth|money do i/.test(q)) return 'balance';
  return 'general';
}

const ANSWERS = {
  dining: {
    steps: ['Reading 24 transactions from November', 'Grouping by category', 'Comparing with October'],
    text: () => `You’ve spent <b>${moneyT(156.20)}</b> on food and dining so far in November, across 5 visits. That’s <b>18% less</b> than this point in October.\n\nBrewline Coffee is your most frequent stop, but Casa Verde is the biggest share at ${moneyT(110.50)}. At this pace you’ll finish the month around ${moneyT(270, { noCents: true })}, well under your ${moneyT(350, { noCents: true })} budget.`,
    widget: () => `<div class="panel pad">${[['Casa Verde', 110.5], ['Noodle Theory', 27.3], ['Brewline Coffee', 18.4]].map(([n, v]) => `<div style="margin:6px 0 12px"><div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px"><span>${n}</span><span class="num muted">${moneyT(v)}</span></div><div class="bar-track"><i style="width:${v / 110.5 * 100}%"></i></div></div>`).join('')}<div style="display:flex;justify-content:space-between;font-size:13px" class="muted"><span>Budget used</span><span class="num">45% of $350</span></div></div>
      <div style="display:flex;gap:8px;margin-top:10px"><button class="chip" data-ask="Find ways for me to save more each month">Ways to save</button><button class="chip" data-push="insights">All spending</button></div>`,
  },
  afford: {
    steps: ['Checking income and fixed costs', 'Looking at your Japan in spring goal', 'Projecting balances to March'],
    text: () => `Yes, comfortably. After rent, bills and your usual spending you have about <b>${moneyT(2180, { noCents: true })} left over each month</b>.\n\nYour Japan in spring goal already has ${moneyT(D.goals[0].saved, { noCents: true })}. Saving <b>${moneyT(110, { noCents: true })} a week</b> until March gets you to $3,000 with room to spare, and your emergency fund stays untouched.`,
    widget: () => `<div class="panel pad"><div style="display:flex;justify-content:space-between;align-items:center"><div><div class="label">Projected by March 1</div><div class="amount" style="font-size:calc(28px*var(--display-scale));margin-top:6px">${money(D.goals[0].saved + 1540, { noCents: true })}</div></div><span class="delta up">On track</span></div>
      <div class="progress" style="margin:14px 0 4px"><i style="width:${Math.min(100, (D.goals[0].saved + 1540) / 6000 * 100)}%"></i></div><div class="muted" style="font-size:12.5px">Goal ${moneyT(6000, { noCents: true })}, trip budget $3,000 covered</div></div>
      <button class="btn primary act" style="margin-top:10px" data-done="Weekly saving set: $110 every Monday into Japan in spring">Save $110 a week</button>`,
  },
  save: {
    steps: ['Scanning recurring payments', 'Checking idle cash', 'Estimating yearly impact'],
    text: () => `I found three easy wins worth about <b>${moneyT(612, { noCents: true })} a year</b>:\n\n<b>StreamBox charged you twice</b> on Nov 14. I can ask for a ${moneyT(15.99)} refund.\n\n<b>${moneyT(8000, { noCents: true })} is sitting in Everyday</b> earning nothing. In High‑yield savings it would earn about ${moneyT(368, { noCents: true })} a year.\n\n<b>Cloudnest and Tunely</b> overlap with features you already pay for. Cancelling both saves ${moneyT(167, { noCents: true })} a year.`,
    widget: () => `<div style="display:flex;flex-direction:column;gap:8px">
      <button class="btn secondary act" data-done="Refund requested from StreamBox. Usually takes 3 days.">${ic('receipt', 'sm')} Request $15.99 refund</button>
      <button class="btn secondary act" data-done="Moved $8,000 to High‑yield savings" data-move="8000">${ic('swap', 'sm')} Move $8,000 to savings</button>
      <button class="btn secondary act" data-done="Cloudnest and Tunely cancelled. Last charge was this month.">${ic('x', 'sm')} Cancel 2 subscriptions</button></div>`,
  },
  risk: {
    steps: ['Loading 8 holdings', 'Measuring allocation against your target', 'Stress‑testing a 20% market drop'],
    text: () => `A little, yes. Your target is <b>Balanced</b>, which means about 20% in individual stocks and crypto. You’re at <b>26%</b>, mostly because Nova Robotics and Bitcoin grew fast this year.\n\nIn a 20% market drop your portfolio would fall about <b>${moneyT(14300, { noCents: true })}</b>, versus ${moneyT(11900, { noCents: true })} if rebalanced. Moving ${moneyT(4800, { noCents: true })} into bonds fixes it in one step.`,
    widget: () => `<div class="panel pad" style="display:flex;gap:16px;align-items:center">${donut(allocation().map(a => ({ v: a.v, c: a.c })), 96, 12)}<div class="legend" style="flex:1">${allocation().slice(0, 4).map(a => `<div class="li" style="font-size:13px"><i class="sw" style="background:${a.c}"></i>${a.k}<span class="v">${Math.round(a.v / D.investTotal * 100)}%</span></div>`).join('')}</div></div>
      <button class="btn primary" style="margin-top:10px" data-sheet="rebalance">Review rebalance</button>`,
  },
  fire: {
    steps: ['Estimating yearly spending', 'Adding up investable assets', 'Simulating 1,000 market paths'],
    text: () => `Based on your spending of about <b>${moneyT(58000, { noCents: true })} a year</b>, your financial independence number is around <b>${moneyT(1450000, { noCents: true })}</b> (25× spending).\n\nYou have ${moneyT(D.investTotal + D.accounts[1].bal, { noCents: true })} invested or saved today and add roughly ${moneyT(2900, { noCents: true })} a month. At a 6% real return, you’d get there in <b>about 17 years, around age 51</b>. Raising monthly investing by $500 brings that to 15 years.`,
    widget: () => `<div class="panel pad"><div style="display:flex;justify-content:space-between"><div><div class="label">Financial independence</div><div class="amount" style="font-size:calc(28px*var(--display-scale));margin-top:6px">2043</div></div><div style="text-align:right"><div class="label">Chance of success</div><div style="font-weight:600;margin-top:6px">86%</div></div></div><div id="firec" style="height:110px;margin:12px -18px -18px"></div></div>
      <div style="display:flex;gap:8px;margin-top:10px"><button class="chip act" data-done="Auto‑invest raised by $500 a month">Invest $500 more a month</button></div>`,
    after: el => { const c = $('#firec', el); if (c) { const v = []; let x = 115360; for (let i = 0; i < 18; i++) { v.push(x); x = x * 1.06 + 34800; } areaChart(c, v, { h: 110, sw: 2 }); } },
  },
  credit: {
    steps: ['Pulling your latest score', 'Checking what changed'],
    text: () => `Your score is <b>782</b>, up 12 points since October. The jump came from paying OneFI Metal in full two months in a row, which dropped your utilization to 9%.\n\nKeep utilization under 10% and you should cross 800 by April.`,
    widget: () => `<button class="btn secondary" data-push="credit">See score details</button>`,
  },
  bills: {
    steps: ['Checking upcoming bills', 'Matching against your balance'],
    text: () => `You have <b>${D.bills.length} bills</b> due in the next 30 days, totalling <b>${moneyT(D.bills.reduce((s, b) => s + b.amt, 0))}</b>. The next one is City Power & Light (${moneyT(86.40)}) in 3 days.\n\nEverything is covered by your Everyday balance, with ${moneyT(D.accounts[0].bal - D.bills.reduce((s, b) => s + b.amt, 0), { noCents: true })} to spare.`,
    widget: () => `<button class="btn secondary" data-push="bills">Open bills</button>`,
  },
  card: {
    steps: ['Finding your cards'],
    text: () => `If a card is lost or you spot something odd, freezing it blocks new payments instantly and you can unfreeze any time. Recurring bills on that card keep working.`,
    widget: () => `<button class="btn primary" data-tab="cards">Go to card controls</button>`,
  },
  balance: {
    steps: ['Adding up your accounts'],
    text: () => `You have <b>${moneyT(D.cashTotal())}</b> in cash across 3 accounts and <b>${moneyT(D.investTotal)}</b> invested. After your card balance and auto loan, your net worth is <b>${moneyT(D.netWorth())}</b>.`,
    widget: () => `<div class="list flat">${D.accounts.map(a => `<div class="row"><div class="logo soft">${ic(a.icon)}</div><div class="main"><div class="t1">${a.name}</div></div><div class="end"><div class="t1">${moneyT(a.bal, { cur: a.cur || '$' })}</div></div></div>`).join('')}</div>`,
  },
  general: {
    steps: ['Thinking about your question', 'Looking across your accounts'],
    text: q => `Here’s what I can do with your money right now: answer questions about spending, plan for goals, review investments, find savings, and move money for you once you confirm.\n\nTry asking it another way, or pick one of these.`,
    widget: () => `<div style="display:flex;flex-wrap:wrap;gap:8px">${PROMPTS.slice(0, 3).map(p => `<button class="chip" data-ask="${p[1]}">${p[1]}</button>`).join('')}</div>`,
  },
};

SB.reg('atlas', {
  tab: true, cls: 'ai-screen',
  render() {
    return `<div class="hello"><div class="orb"></div><div class="who"><div class="t1">Atlas</div><div class="t2">Your money copilot</div></div>
      <button class="iconbtn" data-push="insights" aria-label="Insights">${ic('pie', 'sm')}</button><button class="iconbtn" id="newc" aria-label="New chat">${ic('plus', 'sm')}</button></div>
    <div class="body" id="cb">${SB._chat || `<div class="ai-hero" id="welcome"><div class="orb xl"></div><h1>What would you like to know about your money?</h1><p>I can see your accounts, cards and investments. I never move money without asking you.</p></div>
      <div class="prompts">${PROMPTS.map(([i, t]) => `<button class="prompt" data-ask="${t}">${ic(i, 'sm')}<span>${t}</span></button>`).join('')}</div>`}<div class="msgs" id="msgs"></div></div>
    <div class="composer"><div class="field"><input id="ask" placeholder="Ask Atlas anything" enterkeyhint="send"><button class="iconbtn" id="mic" style="width:36px;height:36px;border:0;background:none">${ic('mic', 'sm')}</button></div><button class="send" id="snd" aria-label="Send">${ic('up', 'sm')}</button></div>`;
  },
  mount(el) {
    const body = $('#cb', el), inp = $('#ask', el);
    const msgs = () => $('#msgs', el);
    const save = () => { SB._chat = body.innerHTML.replace('<div class="msgs" id="msgs"></div>', ''); };
    let busy = false;
    const scroll = () => body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
    const ask = async q => {
      q = q.trim(); if (!q || busy) return; busy = true; haptic(8);
      inp.value = '';
      const w = $('#welcome', el); if (w) { w.remove(); $('.prompts', el)?.remove(); }
      const m = msgs();
      m.insertAdjacentHTML('beforeend', `<div class="msg user fade-in">${q.replace(/</g, '&lt;')}</div>`);
      const it = intentOf(q), A = ANSWERS[it];
      const bot = document.createElement('div'); bot.className = 'msg bot';
      bot.innerHTML = `<div class="orb sm think"></div><div class="content"><div class="think"></div></div>`;
      m.appendChild(bot); scroll();
      const th = $('.content > .think', bot);
      for (const s of A.steps) {
        th.insertAdjacentHTML('beforeend', `<div class="st"><span class="ck"><span class="ld"></span></span>${s}…</div>`); scroll();
        await wait(650 + Math.random() * 450);
        const last = th.lastElementChild; last.classList.add('done'); last.querySelector('.ck').innerHTML = ic('check', 'xs');
      }
      await wait(250);
      th.style.transition = 'opacity .3s'; th.style.opacity = .55;
      const content = $('.content', bot);
      const ans = document.createElement('div'); content.appendChild(ans);
      const paras = A.text(q).split('\n\n');
      for (let pi = 0; pi < paras.length; pi++) {
        const p = document.createElement('p'); ans.appendChild(p);
        const toks = paras[pi].split(/(\s+|<[^>]+>)/).filter(Boolean);
        let html = '';
        for (const t of toks) { html += t; if (/^</.test(t) || /^\s+$/.test(t)) continue; p.innerHTML = html + '<span class="caret"></span>'; await wait(16 + Math.random() * 26); if (Math.random() < .2) scroll(); }
        p.innerHTML = html;
      }
      th.remove();
      $('.orb', bot).classList.remove('think');
      const wd = document.createElement('div'); wd.className = 'widget'; wd.innerHTML = A.widget(q); content.appendChild(wd);
      A.after && A.after(wd);
      animateDonuts(wd);
      $$('.act', wd).forEach(b => b.onclick = async () => {
        if (b.dataset.used) return;
        const ok = await pinSheet('Confirm with Atlas', b.textContent.trim()); if (!ok) return;
        b.dataset.used = 1; b.innerHTML = '<div class="spin"></div>'; await wait(1000);
        if (b.dataset.move) { D.accounts[0].bal -= +b.dataset.move; D.accounts[1].bal += +b.dataset.move; }
        b.innerHTML = ic('check', 'sm') + ' Done'; b.classList.add('done'); b.style.color = 'var(--pos)';
        toast(b.dataset.done); save();
      });
      $$('[data-ask]', wd).forEach(b => b.onclick = () => ask(b.dataset.ask));
      $$('.msg.bot .content', el).forEach(c => c.querySelectorAll('[data-ask]').forEach(b => b.onclick = () => ask(b.dataset.ask)));
      bot.insertAdjacentHTML('beforeend', '');
      content.insertAdjacentHTML('beforeend', `<div style="display:flex;gap:4px;margin-top:10px;color:var(--text-3)"><button class="iconbtn fb" style="width:30px;height:30px;border:0;background:none">${ic('copy', 'xs')}</button><button class="iconbtn fb" style="width:30px;height:30px;border:0;background:none">${ic('repeat', 'xs')}</button></div>`);
      $$('.fb', content).forEach((b, i) => b.onclick = () => i ? ask(q) : toast('Copied', 'copy'));
      scroll(); haptic(6); busy = false; save();
    };
    $$('[data-ask]', el).forEach(b => b.onclick = () => ask(b.dataset.ask));
    $('#snd', el).onclick = () => ask(inp.value);
    inp.onkeydown = e => { if (e.key === 'Enter') ask(inp.value); };
    $('#newc', el).onclick = () => { SB._chat = null; SB.replace('atlas'); };
    $('#mic', el).onclick = () => {
      const phrase = PROMPTS[Math.floor(Math.random() * PROMPTS.length)][1];
      Sheet.open(`<div style="text-align:center;padding:16px 0 10px"><div class="orb xl think" style="margin:0 auto"></div><h3 style="margin-top:22px">Listening…</h3><div class="sub" id="heard" style="min-height:44px;margin:8px auto 0;max-width:280px"></div><div class="wave">${Array.from({ length: 9 }, (_, i) => `<i style="animation-delay:${i * .09}s"></i>`).join('')}</div></div>`, {
        async mount(sh) {
          await wait(700); const h = $('#heard', sh); const words = phrase.split(' ');
          for (let i = 0; i < words.length; i++) { if (!h.isConnected) return; h.textContent = words.slice(0, i + 1).join(' '); await wait(140); }
          await wait(500); if (!h.isConnected) return; Sheet.close(); ask(phrase);
        },
      });
    };
    if (SB._chat) { $$('.act', el).forEach(b => b.dataset.used = 1); setTimeout(() => body.scrollTop = body.scrollHeight, 30); }
    if (SB._pendingAsk) { const q = SB._pendingAsk; SB._pendingAsk = null; setTimeout(() => ask(q), 400); }
  },
});

SB.reg('insights', {
  render() {
    const tot = D.spend.month.reduce((s, x) => s + x.v, 0), last = Object.values(D.spend.last).reduce((a, b) => a + b, 0);
    const segs = D.spend.month.map(x => ({ v: x.v, c: D.cats[x.cat].c }));
    return `${topbar('Spending')}
    <div class="body">
      <div class="seg" style="margin-top:2px"><button class="on">November</button><button>October</button><button>September</button></div>
      <div style="display:flex;justify-content:center;margin-top:22px">${donut(segs, 200, 20, `<div><div class="label">Spent so far</div><div class="amount" style="font-size:calc(30px*var(--display-scale));margin-top:6px">${money(tot, { noCents: true })}</div><div class="${tot > last ? 'neg' : 'pos'}" style="font-size:12.5px;margin-top:6px;font-weight:600">${tot > last ? '+' : '−'}${Math.abs(Math.round((tot - last) / last * 100))}% vs Oct</div></div>`)}</div>
      <div class="list flat" style="margin-top:22px">${D.spend.month.slice().sort((a, b) => b.v - a.v).map(x => { const c = D.cats[x.cat], l = D.spend.last[x.cat], d = (x.v - l) / l * 100; return `<div class="row"><div class="logo soft" style="color:${c.c}">${ic(c.icon)}</div><div class="main"><div class="t1">${c.name}</div><div class="t2 ${d > 5 ? 'neg' : d < -5 ? 'pos' : ''}">${Math.abs(d) < 1 ? 'Same as last month' : (d > 0 ? '+' : '−') + Math.abs(Math.round(d)) + '% vs last month'}</div></div><div class="end"><div class="t1">${moneyT(x.v)}</div></div></div>`; }).join('')}</div>
      <h2 class="sec">Daily spending</h2>
      <div class="panel pad">${bars(D.spend.daily.slice(-14), Array.from({ length: 14 }, (_, i) => i % 2 ? '' : String(5 + i)), 120, 13)}</div>
      <h2 class="sec">OneFI found</h2>
      <div class="list">${[['alert', 'Duplicate charge', 'StreamBox billed you twice on Nov 14', 'Find ways for me to save more each month'], ['repeat', '6 subscriptions', '$45.96 a month, 2 overlap', 'Find ways for me to save more each month'], ['plane', 'Travel is up', 'Flights and stays for December, one‑off', 'Can I afford a $3,000 trip in March?']].map(([i, t, d, q]) => `<button class="row" data-q="${q}"><div class="logo soft">${ic(i)}</div><div class="main"><div class="t1">${t}</div><div class="t2">${d}</div></div>${ic('right', 'sm chev')}</button>`).join('')}</div>
    </div>`;
  },
  mount(el) {
    requestAnimationFrame(() => animateDonuts(el));
    $$('.seg button', el).forEach(b => b.onclick = () => { $$('.seg button', el).forEach(x => x.classList.remove('on')); b.classList.add('on'); haptic(5); animateDonuts(el); });
    $$('[data-q]', el).forEach(b => b.onclick = () => { SB._pendingAsk = b.dataset.q; SB.replace('assistant'); });
  },
});
