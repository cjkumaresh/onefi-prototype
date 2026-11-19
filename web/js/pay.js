// Payments: pay hub, contacts, scan, amount entry, review, success, bills, transfer, request
SB.reg('payhub', {
  render() {
    return `${topbar('Pay & transfer', '<div class="spacer"></div>', 'x')}
    <div class="body">
      <div class="grid2">
        ${[['scan', 'Scan to pay', 'Any QR code', 'scan', 'up'], ['send', 'Send money', 'To anyone, instantly', 'contacts'], ['request', 'Request', 'Get paid back', 'request'], ['bill', 'Pay bills', '5 billers', 'bills'], ['swap', 'Move money', 'Between your accounts', 'transfer'], ['globe', 'Send abroad', '42 currencies', 'contacts']].map(([i, t, s, r, m]) => `<button class="tile" data-push="${r}" ${m ? `data-mode="${m}"` : ''} ${i === 'globe' ? `data-p='{"abroad":1}'` : ''}><div class="logo soft">${ic(i)}</div><div><div class="t1">${t}</div><div class="t2" style="margin-top:2px">${s}</div></div></button>`).join('')}
      </div>
      <h2 class="sec">Recent people</h2>
      <div class="chips" style="gap:16px">${D.contacts.slice(0, 6).map(c => `<button data-push="amount" data-p='{"to":"${c.id}"}' style="display:flex;flex-direction:column;align-items:center;gap:8px;font-size:12.5px;width:58px">${avatar(c)}<span class="muted">${c.name.split(' ')[0]}</span></button>`).join('')}</div>
      <div class="panel pad" style="margin-top:22px;display:flex;align-items:center;gap:14px"><div class="logo soft">${ic('shield')}</div><div style="flex:1"><div style="font-weight:600;font-size:14.5px">Payments are protected</div><div class="muted" style="font-size:13px;margin-top:2px">Every transfer is checked for fraud before it leaves your account.</div></div></div>
    </div>`;
  },
});

SB.reg('contacts', {
  render(p) {
    return `${topbar(p.split ? 'Split with' : p.abroad ? 'Send abroad' : 'Send money')}
    <div class="body">
      <label class="search">${ic('search', 'sm')}<input id="cq" placeholder="Name, @handle, phone or email"></label>
      <h2 class="sec" style="margin-top:22px">Favorites</h2>
      <div class="chips" style="gap:16px">${D.contacts.slice(0, 5).map(c => `<button data-push="amount" data-p='${JSON.stringify({ to: c.id, split: p.split, abroad: p.abroad })}' style="display:flex;flex-direction:column;align-items:center;gap:8px;font-size:12.5px;width:58px">${avatar(c)}<span class="muted">${c.name.split(' ')[0]}</span></button>`).join('')}</div>
      <h2 class="sec">All contacts</h2>
      <div class="list" id="cl">${D.contacts.map(c => `<button class="row" data-push="amount" data-p='${JSON.stringify({ to: c.id, split: p.split, abroad: p.abroad })}'>${avatar(c)}<div class="main"><div class="t1">${c.name}</div><div class="t2">${c.handle}</div></div>${ic('right', 'sm chev')}</button>`).join('')}</div>
    </div>`;
  },
  mount(el) {
    $('#cq', el).oninput = e => { const q = e.target.value.toLowerCase(); $$('#cl .row', el).forEach(r => r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none'); };
  },
});

SB.reg('scan', {
  cls: 'scanscreen',
  render() {
    const qr = Array.from({ length: 21 * 21 }, (_, i) => { const x = i % 21, y = (i / 21) | 0; const f = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13); const fin = f && ((x % 14 < 7 && (x % 14 === 0 || x % 14 === 6 || y % 14 === 0 || y % 14 === 6)) || ((x % 14) >= 2 && (x % 14) <= 4 && (y % 14) >= 2 && (y % 14) <= 4)); return f ? fin : ((x * 7 + y * 13 + x * y) % 5 < 2); });
    return `<div class="scan" id="sc"><div class="cam"></div>
      <div class="bar"><button class="iconbtn" data-back>${ic('x')}</button><button class="iconbtn" id="torch">${ic('bolt')}</button></div>
      <div class="frame"><i></i><i></i><i></i><i></i><div class="laser"></div>
        <svg class="qr" viewBox="0 0 21 21">${qr.map((on, i) => on ? `<rect x="${i % 21}" y="${(i / 21) | 0}" width="1" height="1" fill="#fff"/>` : '').join('')}</svg></div>
      <div class="hint" id="hint">Point at a payment QR code</div>
      <div class="bottom"><button id="gal">${ic('copy', 'sm')} Upload</button><button id="myqr">${ic('qr', 'sm')} My code</button></div>
    </div>`;
  },
  mount(el) {
    barsOverride('#05060AD');
    const sc = $('#sc', el);
    const t = setTimeout(async () => {
      if (!document.body.contains(el)) return;
      sc.classList.add('found'); $('.laser', el).style.display = 'none'; $('#hint', el).textContent = 'Brewline Coffee, verified merchant'; haptic(25);
      await wait(900);
      if (document.body.contains(el)) { syncBars(); SB.replace('amount', { merchant: 'Brewline Coffee', preset: '' }, 'up'); }
    }, 2400);
    SB._scanT = t;
    $('#torch', el).onclick = e => { e.currentTarget.classList.toggle('on'); $('.cam', el).style.filter = e.currentTarget.classList.contains('on') ? 'blur(18px) brightness(1.8)' : ''; haptic(); };
    $('#myqr', el).onclick = () => { clearTimeout(t); syncBars(); SB.replace('myqr', {}, 'up'); };
    $('#gal', el).onclick = () => toast('Choose a QR image from your gallery', 'copy');
  },
});
const _popOrig = SB.pop.bind(SB);
SB.pop = function (n) { clearTimeout(SB._scanT); const top = this.stack[this.stack.length - 1]; if (top && top._route === 'scan') syncBars(); return _popOrig(n); };

SB.reg('myqr', {
  render() {
    const qr = Array.from({ length: 25 * 25 }, (_, i) => { const x = i % 25, y = (i / 25) | 0; const box = (a, b) => x >= a && x < a + 7 && y >= b && y < b + 7; const fb = box(0, 0) || box(18, 0) || box(0, 18); if (fb) { const lx = x % 18 === x ? x : x - 18, ly = y % 18 === y ? y : y - 18; const cx = x >= 18 ? x - 18 : x, cy = y >= 18 ? y - 18 : y; return cx === 0 || cx === 6 || cy === 0 || cy === 6 || (cx >= 2 && cx <= 4 && cy >= 2 && cy <= 4); } return ((x * 3 + y * 11 + x * y * 7) % 7) < 3; });
    return `${topbar('Your payment code', '<div class="spacer"></div>', 'x')}
    <div class="body" style="display:flex;flex-direction:column;align-items:center;padding-top:20px">
      <div style="padding:22px;border-radius:28px;background:#fff;box-shadow:var(--shadow-lg)"><svg width="230" height="230" viewBox="0 0 25 25">${qr.map((on, i) => on ? `<rect x="${i % 25}" y="${(i / 25) | 0}" width="1.02" height="1.02" fill="#101114"/>` : '').join('')}</svg></div>
      <div style="margin-top:22px;font-weight:600;font-size:18px">${D.user.first} ${D.user.last}</div><div class="muted">@milindm, Everyday •• 4821</div>
      <div style="display:flex;gap:10px;width:100%;margin-top:30px"><button class="btn secondary" id="am">Set amount</button><button class="btn primary" id="shq">${ic('share', 'sm')} Share</button></div>
    </div>`;
  },
  mount(el) { $('#shq', el).onclick = () => toast('Payment link copied', 'share'); $('#am', el).onclick = () => SB.push('request'); },
});

/* amount keypad (send, pay merchant, add money, request, pay bill, invest) */
SB.reg('amount', {
  render(p) {
    const c = p.to ? D.contacts.find(x => x.id === p.to) : null;
    const name = c ? c.name : p.merchant || p.title || 'Amount';
    const head = c ? `<div class="payee">${avatar(c)}<div class="t1">${p.request ? 'Request from ' : ''}${c.name}</div><div class="t2">${c.handle}${p.abroad ? ', receives EUR' : ''}</div></div>`
      : p.merchant ? `<div class="payee">${logo(p.merchant, D.merchants[p.merchant]?.hue || 30, 'coffee')}<div class="t1">${p.merchant}</div><div class="t2">Verified merchant ${ic('shield', 'xs')}</div></div>`
        : `<div class="payee"><div class="logo soft" style="width:64px;height:64px;border-radius:20px">${ic(p.mode === 'add' ? 'plus' : 'swap', 'lg')}</div><div class="t1">${p.title || 'Move money'}</div><div class="t2">${p.mode === 'add' ? 'From Linked bank •• 2290' : 'Everyday to High‑yield savings'}</div></div>`;
    const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'del'];
    return `${topbar('', '<div class="spacer"></div>', 'x')}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden">
      <div>${head}
        <div class="amt-entry"><div class="amount" id="amt">${money(0, { noCents: true })}</div>
        ${p.abroad ? '<div class="muted num" id="fx" style="font-size:14px;margin-top:8px">They get €0.00, rate 0.9234, no fee</div>' : `<div class="muted" style="font-size:14px;margin-top:8px">${p.mode === 'add' ? 'Arrives instantly' : 'Balance ' + moneyT(D.accounts[0].bal)}</div>`}</div>
        <div class="quick-amts">${(p.merchant ? [5, 7, 12] : [20, 50, 100]).map(v => `<button class="chip mini qa" data-v="${v}">$${v}</button>`).join('')}</div>
        ${c || p.merchant ? `<div style="display:flex;justify-content:center"><label class="notein">${ic('tag', 'xs')}<input id="note" placeholder="Add a note" value="${p.split ? 'Split' : ''}"></label></div>` : ''}
      </div>
      <div>
        <div class="keypad">${keys.map(k => `<button class="key" data-k="${k}">${k === 'del' ? ic('left') : k}</button>`).join('')}</div>
        <div class="footer-actions"><button class="btn primary" id="go" disabled>${p.request ? 'Request' : 'Review'}</button></div>
      </div>
    </div>`;
  },
  mount(el, p) {
    let s = p.preset || '';
    const amtEl = $('#amt', el), go = $('#go', el);
    const draw = () => {
      const v = parseFloat(s || '0');
      const [w, d] = s.split('.');
      amtEl.innerHTML = `<span class="v"><span class="cur">$</span>${commas(parseInt(w || '0'))}${s.includes('.') ? `<span class="cents">.${(d || '').padEnd(2, '·')}</span>` : ''}</span>`;
      go.disabled = !(v > 0);
      const fx = $('#fx', el); if (fx) fx.textContent = `They get €${(v * 0.9234).toFixed(2)}, rate 0.9234, no fee`;
      amtEl.classList.remove('bump'); void amtEl.offsetWidth; amtEl.classList.add('bump');
    };
    const bad = () => { amtEl.classList.remove('bad'); void amtEl.offsetWidth; amtEl.classList.add('bad'); haptic(30); };
    $$('.key', el).forEach(b => b.onclick = () => {
      const k = b.dataset.k; haptic(4);
      if (k === 'del') s = s.slice(0, -1);
      else if (k === '.') { if (s.includes('.')) return bad(); s = (s || '0') + '.'; }
      else { if (s.includes('.') && s.split('.')[1].length >= 2) return bad(); if (!s.includes('.') && s.replace(/^0/, '').length >= 6) return bad(); s = (s === '0' ? '' : s) + k; }
      if (!p.mode && !p.request && parseFloat(s) > D.accounts[0].bal) { s = s.slice(0, -1); toast('That’s more than your Everyday balance', 'alert'); return bad(); }
      draw();
    });
    $$('.qa', el).forEach(b => b.onclick = () => { s = b.dataset.v; haptic(5); draw(); });
    go.onclick = () => {
      const amt = parseFloat(s); const note = $('#note', el)?.value || '';
      if (p.request) return requestSent(amt, p.to);
      SB.push('review', { ...p, amt, note });
    };
    draw();
  },
});

async function requestSent(amt, to) {
  const c = D.contacts.find(x => x.id === to);
  const done = await processing('Sending request', ['Creating secure link…', `Notifying ${c ? c.name.split(' ')[0] : 'them'}…`], 1400);
  SB.replace('success', { title: 'Request sent', sub: `${c ? c.name : 'They'} will get a notification to pay ${moneyT(amt)}.`, amt, rows: [['To', c ? c.name : 'Payment link'], ['Expires', 'In 7 days']] }); done();
}

SB.reg('review', {
  render(p) {
    const c = p.to ? D.contacts.find(x => x.id === p.to) : null;
    const to = c ? c.name : p.merchant || p.biller || (p.mode === 'add' ? 'Everyday •• 4821' : 'High‑yield savings •• 0937');
    const from = p.mode === 'add' ? 'Linked bank •• 2290' : 'Everyday •• 4821';
    const fee = p.abroad ? 0 : 0;
    return `${topbar('Review')}
    <div class="body">
      <div style="text-align:center;padding:14px 0 26px"><div class="label">You’re ${p.mode === 'add' ? 'adding' : 'sending'}</div><div class="amount" style="font-size:calc(54px*var(--display-scale));margin-top:12px">${money(p.amt)}</div></div>
      <div class="panel pad">
        ${[['To', to], ['From', from], p.abroad ? ['They receive', '€' + (p.amt * 0.9234).toFixed(2)] : null, ['Fee', fee ? moneyT(fee) : 'Free'], ['Arrives', p.abroad ? 'Within 1 hour' : 'Instantly'], p.note ? ['Note', p.note] : null].filter(Boolean).map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}
      </div>
      <div class="panel pad" style="margin-top:12px;display:flex;gap:12px;align-items:center">${halo('ready', 24, 'still')}<div style="font-size:13.5px" class="muted">${c ? `You’ve paid ${c.name.split(' ')[0]} 6 times before. Nothing unusual about this payment.` : 'This merchant is verified and has no reported issues.'}</div></div>
    </div>
    <div class="footer-actions" style="flex-direction:column"><div id="hold"></div><div class="faint" style="text-align:center;font-size:12.5px">Press and hold to confirm</div></div>`;
  },
  mount(el, p) {
    holdButton($('#hold', el), `Hold to ${p.mode === 'add' ? 'add' : 'send'} ${moneyT(p.amt)}`, async () => {
      const ok = await pinSheet('Confirm payment', `${moneyT(p.amt)} to ${p.to ? D.contacts.find(x => x.id === p.to).name : p.merchant || p.biller || 'your account'}`);
      if (!ok) { SB.replace('review', p); return; }
      const c = p.to ? D.contacts.find(x => x.id === p.to) : null;
      const done = await processing(p.mode === 'add' ? 'Adding money' : 'Sending', ['Checking for fraud…', 'Authorizing with your bank…', p.mode === 'add' ? 'Crediting Everyday…' : 'Delivering payment…'], 2100);
      const name = c ? c.name : p.merchant || p.biller || 'Everyday';
      if (p.mode === 'add') D.accounts[0].bal += p.amt; else if (p.mode === 'move') { D.accounts[0].bal -= p.amt; D.accounts[1].bal += p.amt; }
      else {
        D.accounts[0].bal -= p.amt;
        D.tx.unshift({ id: 't' + Date.now(), name, amt: -p.amt, date: new Date(2026, 10, 18), time: 'Now', note: p.note || '', cat: p.biller ? 'bills' : c ? 'transfer' : 'dining', hue: c ? c.hue : 30, acct: 'chk', person: !!c });
        if (p.billId) D.bills = D.bills.filter(b => b.id !== p.billId);
      }
      SB.replace('success', { title: p.mode === 'add' ? 'Money added' : p.mode === 'move' ? 'Money moved' : 'Payment sent', sub: p.mode === 'add' ? 'Your Everyday balance is updated.' : `${name} has received it.`, amt: p.amt, rows: [['To', name], ['Reference', 'SB' + Math.floor(100000 + Math.random() * 899999)], ['Date', 'Nov 18, 2026']] });
      done();
    });
  },
});

SB.reg('success', {
  render(p) {
    return `<div class="body" style="padding-bottom:20px"><div class="success">
      <div class="tick pop"><svg viewBox="0 0 52 52"><path d="M14 27l8 8 16-17"/></svg></div>
      <div style="font-size:22px;font-weight:600;margin-top:28px;letter-spacing:-.015em">${p.title}</div>
      <div class="amount" style="font-size:calc(46px*var(--display-scale));margin-top:14px">${money(p.amt)}</div>
      <div class="muted" style="margin-top:10px;max-width:280px">${p.sub}</div>
      <div class="panel pad receipt">${(p.rows || []).map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}</div>
    </div></div>
    <div class="footer-actions"><button class="btn secondary" id="shr">${ic('share', 'sm')} Receipt</button><button class="btn primary" id="dn">Done</button></div>`;
  },
  mount(el) {
    haptic(30);
    $('#dn', el).onclick = () => { SB.home(); };
    $('#shr', el).onclick = () => toast('Receipt saved to Files', 'share');
  },
});

SB.reg('bills', {
  render() {
    const tot = D.bills.reduce((s, b) => s + b.amt, 0);
    return `${topbar('Bills')}
    <div class="body">
      <div class="hero" style="padding-top:6px"><div class="label">Due in the next 30 days</div><div class="amount" style="font-size:calc(44px*var(--display-scale))">${money(tot)}</div><div class="meta">${D.bills.length} bills, autopay on for 2</div></div>
      <div class="list" style="margin-top:18px">${D.bills.map(b => `<button class="row" data-push="paybill" data-p='{"id":"${b.id}"}'>${logo(b.name, 30 + b.days * 9, b.icon)}<div class="main"><div class="t1">${b.name}</div><div class="t2 ${b.days <= 3 ? 'neg' : ''}">${b.due}</div></div><div class="end"><div class="t1">${moneyT(b.amt)}</div></div></button>`).join('') || '<div class="empty">You’re all paid up. New bills will show here.</div>'}</div>
      <h2 class="sec">Add a biller</h2>
      <div class="grid2">${[['bolt', 'Electricity'], ['wifi', 'Internet'], ['phone', 'Mobile'], ['car', 'Auto loan']].map(([i, t]) => `<button class="tile ab"><div class="logo soft">${ic(i)}</div><div class="t1">${t}</div></button>`).join('')}</div>
    </div>`;
  },
  mount(el) { $$('.ab', el).forEach(b => b.onclick = () => toast('Biller search opened', 'search')); },
});

SB.reg('paybill', {
  render({ id }) {
    const b = D.bills.find(x => x.id === id) || D.bills[0];
    return `${topbar('Pay bill')}
    <div class="body">
      <div style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:12px 0 22px">${logo(b.name, 30 + b.days * 9, b.icon)}<div style="font-weight:600;font-size:17px;margin-top:12px">${b.name}</div><div class="muted" style="font-size:13px">Account 88‑2041‑19</div>
      <div class="amount" style="font-size:calc(52px*var(--display-scale));margin-top:18px">${money(b.amt)}</div><div class="${b.days <= 3 ? 'neg' : 'muted'}" style="margin-top:10px;font-size:14px">${b.due}</div></div>
      <div class="list flat">
        <div class="row"><div class="logo soft">${ic('repeat')}</div><div class="main"><div class="t1">Autopay</div><div class="t2">Pay automatically on the due date</div></div>${sw(false, 'id="ap"')}</div>
        <div class="row"><div class="logo soft">${ic('bank')}</div><div class="main"><div class="t1">Pay from</div><div class="t2">Everyday •• 4821</div></div>${ic('right', 'sm chev')}</div>
      </div>
    </div>
    <div class="footer-actions"><button class="btn primary" id="pb">Pay ${moneyT(b.amt)}</button></div>`;
  },
  mount(el, { id }) {
    const b = D.bills.find(x => x.id === id) || D.bills[0];
    bindSwitches(el, (s, on) => toast(on ? `Autopay on for ${b.name}` : 'Autopay off', 'repeat'));
    $('#pb', el).onclick = () => SB.push('review', { amt: b.amt, biller: b.name, billId: b.id });
  },
});

SB.reg('transfer', {
  render() {
    return `${topbar('Move money')}
    <div class="body">
      <div class="label" style="margin:6px 0 10px">From</div>
      <div class="list flat">${D.accounts.slice(0, 1).map(a => `<div class="row"><div class="logo soft">${ic(a.icon)}</div><div class="main"><div class="t1">${a.name}</div><div class="t2">${moneyT(a.bal)} available</div></div>${ic('check', 'sm pos')}</div>`).join('')}</div>
      <div style="display:grid;place-items:center;margin:-6px 0;position:relative;z-index:1"><div class="iconbtn" style="background:var(--bg)">${ic('dn', 'sm')}</div></div>
      <div class="label" style="margin:0 0 10px">To</div>
      <div class="list flat" id="tos">${[D.accounts[1], ...D.goals.slice(0, 2).map(g => ({ id: g.id, name: g.name, icon: g.icon, bal: g.saved }))].map((a, i) => `<button class="row to" data-i="${i}"><div class="logo soft">${ic(a.icon)}</div><div class="main"><div class="t1">${a.name}</div><div class="t2">${moneyT(a.bal)}</div></div><span class="ck">${i === 0 ? ic('check', 'sm pos') : ''}</span></button>`).join('')}</div>
    </div>
    <div class="footer-actions"><button class="btn primary" id="cont">Continue</button></div>`;
  },
  mount(el) {
    let sel = 0;
    $$('.to', el).forEach(r => r.onclick = () => { sel = +r.dataset.i; $$('.to .ck', el).forEach((c, i) => c.innerHTML = i === sel ? ic('check', 'sm pos') : ''); haptic(5); });
    $('#cont', el).onclick = () => SB.push('amount', { mode: 'move', title: 'Move money' });
  },
});

SB.reg('request', {
  render() {
    return `${topbar('Request money')}
    <div class="body">
      <div class="panel pad" style="display:flex;gap:14px;align-items:center;margin-top:4px"><div class="logo soft">${ic('qr')}</div><div style="flex:1"><div style="font-weight:600">Share a payment link</div><div class="muted" style="font-size:13px">Anyone can pay you, even without OneFI</div></div><button class="btn sm primary" id="lnk">Copy</button></div>
      <h2 class="sec">Ask someone</h2>
      <div class="list">${D.contacts.map(c => `<button class="row" data-push="amount" data-p='{"to":"${c.id}","request":1}'>${avatar(c)}<div class="main"><div class="t1">${c.name}</div><div class="t2">${c.handle}</div></div>${ic('right', 'sm chev')}</button>`).join('')}</div>
    </div>`;
  },
  mount(el) { $('#lnk', el).onclick = () => toast('Link copied: onefi.app/pay/milindm', 'copy'); },
});
