// Simulated data. Everything here is fictional.
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function series(n, start, end, vol, seed) {
  const r = rng(seed); const out = []; let v = start;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const target = start + (end - start) * t;
    v += (target - v) * 0.18 + (r() - 0.5) * vol;
    out.push(v);
  }
  out[n - 1] = end;
  return out;
}

const D = {
  user: { first: 'Milind', last: 'Pandya', email: 'milind.pandya@mail.com', phone: '+1 (415) 555‑0142', tier: 'Private', since: 2019, pin: '1234' },
  accounts: [
    { id: 'chk', name: 'Everyday Chequing', type: 'Chequing', num: '4821', bal: 12480.20, icon: 'bank' },
    { id: 'sav', name: 'High‑yield savings', type: 'Savings', num: '0937', bal: 28940.00, apy: 4.6, icon: 'coins' },
    { id: 'eur', name: 'Euro wallet', type: 'Multi‑currency', num: '7710', bal: 2140.55, cur: '€', usd: 2318.31, icon: 'globe' },
  ],
  team: [
    { ini: 'PS', name: 'Priya Shah', addr: '214 Maple Ave, Columbus', day: 'Tue, Nov 24', hue: 262 },
    { ini: 'JL', name: 'Jordan Lee', addr: '88 Grant St, Dublin', day: 'Tue, Nov 24', hue: 205 },
    { ini: 'SR', name: 'Sam Rivera', addr: '1520 Oak Park Dr, Westerville', day: 'Wed, Nov 25', hue: 24 },
    { ini: 'AK', name: 'Aisha Khan', addr: '37 Linden Ct, Worthington', day: 'Tue, Nov 24', hue: 150 },
    { ini: 'TB', name: 'Tom Becker', addr: '902 N High St, Columbus', day: 'Wed, Nov 25', hue: 330 },
    { ini: 'MC', name: 'Mei Chen', addr: '4410 Riverside Rd, Hilliard', day: 'Wed, Nov 25', hue: 48 },
  ],
  goals: [
    { id: 'g1', name: 'Japan in spring', target: 6000, saved: 4120, icon: 'plane', due: 'Mar 2027', color: 'var(--cat-3)' },
    { id: 'g2', name: 'Home down payment', target: 60000, saved: 25200, icon: 'house', due: 'Jun 2028', color: 'var(--cat-2)' },
    { id: 'g3', name: 'Emergency fund', target: 18000, saved: 18000, icon: 'shield', due: 'Done', color: 'var(--cat-1)' },
  ],
  contacts: [
    { id: 'c0', name: 'Shroff', handle: 'shroff@email.com', hue: 3 },
    { id: 'c1', name: 'Sam Rivera', handle: '@samr', hue: 18 },
    { id: 'c2', name: 'Priya Shah', handle: '@priya', hue: 280 },
    { id: 'c3', name: 'Jordan Lee', handle: '@jlee', hue: 200 },
    { id: 'c4', name: 'Mia Chen', handle: '@miachen', hue: 340 },
    { id: 'c5', name: 'Leo Park', handle: '@leo.p', hue: 150 },
    { id: 'c6', name: 'Ava Brooks', handle: '@avab', hue: 40 },
    { id: 'c7', name: 'Noah Kim', handle: '@noahk', hue: 230 },
    { id: 'c8', name: 'Emma Davis', handle: '@emmad', hue: 100 },
  ],
  cats: {
    dining: { name: 'Food & dining', icon: 'coffee', c: 'var(--cat-1)' },
    groceries: { name: 'Groceries', icon: 'cart', c: 'var(--cat-2)' },
    transport: { name: 'Transport', icon: 'car', c: 'var(--cat-3)' },
    shopping: { name: 'Shopping', icon: 'bag', c: 'var(--cat-4)' },
    subs: { name: 'Subscriptions', icon: 'film', c: 'var(--cat-5)' },
    bills: { name: 'Bills & rent', icon: 'building', c: 'var(--cat-6)' },
    travel: { name: 'Travel', icon: 'plane', c: 'var(--cat-3)' },
    health: { name: 'Health', icon: 'gym', c: 'var(--cat-2)' },
    income: { name: 'Income', icon: 'brief', c: 'var(--pos)' },
    transfer: { name: 'Transfers', icon: 'swap', c: 'var(--text-2)' },
  },
  merchants: {
    'Brewline Coffee': { hue: 30, cat: 'dining' }, 'FreshMart': { hue: 140, cat: 'groceries' }, 'RideNow': { hue: 220, cat: 'transport' },
    'StreamBox': { hue: 350, cat: 'subs' }, 'Northwind Corp': { hue: 160, cat: 'income' }, 'Skyway Airlines': { hue: 205, cat: 'travel' },
    'Urban Fuel': { hue: 15, cat: 'transport' }, 'Tunely': { hue: 130, cat: 'subs' }, 'Shopora': { hue: 260, cat: 'shopping' },
    'Pulse Fitness': { hue: 300, cat: 'health' }, 'Casa Verde': { hue: 100, cat: 'dining' }, 'Parkside Apartments': { hue: 45, cat: 'bills' },
    'City Power & Light': { hue: 50, cat: 'bills' }, 'Haven Stays': { hue: 0, cat: 'travel' }, 'Lumen Books': { hue: 190, cat: 'shopping' },
    'Noodle Theory': { hue: 25, cat: 'dining' }, 'Cloudnest': { hue: 210, cat: 'subs' }, 'Greenleaf Pharmacy': { hue: 120, cat: 'health' },
  },
  bills: [
    { id: 'b0', name: 'Rogers Internet', amt: 89.99, due: 'Due Nov 25', days: 7, icon: 'wifi', acct: '5530' },
    { id: 'b1', name: 'City Power & Light', amt: 86.40, due: 'Due in 3 days', days: 3, icon: 'bolt' },
    { id: 'b2', name: 'Parkside Apartments', amt: 2350.00, due: 'Due Dec 1', days: 13, icon: 'building' },
    
    { id: 'b4', name: 'Metro Water', amt: 38.12, due: 'Due Dec 9', days: 21, icon: 'drop' },
    { id: 'b5', name: 'Orbit Mobile', amt: 45.00, due: 'Due Dec 12', days: 24, icon: 'phone' },
  ],
  cards: [
    { id: 'k1', name: 'OneFI Metal', kind: 'Credit', num: '8842', exp: '09/30', limit: 15000, used: 1284.33, due: 'Dec 4', min: 35 },
    { id: 'k2', name: 'OneFI Debit', kind: 'Debit · Everyday', num: '4821', exp: '04/29' },
    { id: 'k3', name: 'Virtual', kind: 'Online only', num: '1290', exp: '11/27' },
  ],
  loans: [{ id: 'l1', name: 'Auto loan', left: 14200, total: 24000, emi: 412.6, paid: 28, months: 60, rate: 5.9, next: 'Dec 15' }],
  policies: [
    { id: 'p1', name: 'Health Plus', kind: 'Health', cover: 500000, prem: 212, status: 'Active', renew: 'Renews Mar 2027', icon: 'heart' },
    { id: 'p2', name: 'Auto Comprehensive', kind: 'Auto', cover: 50000, prem: 96, status: 'Renew soon', renew: 'Renews in 12 days', icon: 'car' },
  ],
  holdings: [
    { id: 'h1', sym: 'SPX500', name: 'OneFI S&P 500 Index Fund', kind: 'Fund', val: 31240.50, chg: 0.84, ret: 18.2, hue: 210, risk: 'Moderate', er: 0.03 },
    { id: 'h2', sym: 'GLEQ', name: 'Global Equity Fund', kind: 'Fund', val: 12880.10, chg: 0.42, ret: 11.4, hue: 160, risk: 'Moderate', er: 0.12 },
    { id: 'h3', sym: 'NOVA', name: 'Nova Robotics', kind: 'Stock', val: 9420.00, chg: 2.31, ret: 34.6, hue: 270, qty: 42, risk: 'High' },
    { id: 'h4', sym: 'ORBT', name: 'Orbit Cloud', kind: 'Stock', val: 7315.40, chg: -1.12, ret: 22.1, hue: 195, qty: 31, risk: 'High' },
    { id: 'h5', sym: 'AGGB', name: 'Aggregate Bond Fund', kind: 'Bonds', val: 14100.00, chg: 0.06, ret: 4.1, hue: 40, risk: 'Low', er: 0.04 },
    { id: 'h6', sym: 'GOLD', name: 'Digital Gold', kind: 'Gold', val: 5210.80, chg: 0.37, ret: 26.8, hue: 45, risk: 'Moderate' },
    { id: 'h7', sym: 'BTC', name: 'Bitcoin', kind: 'Crypto', val: 3720.18, chg: 3.84, ret: 41.2, hue: 28, risk: 'Very high' },
    { id: 'h8', sym: 'VRDE', name: 'Verde Energy', kind: 'Stock', val: 2533.20, chg: 0.95, ret: -3.4, hue: 120, qty: 64, risk: 'High' },
  ],
  explore: [
    { id: 'e1', sym: 'AITX', name: 'AI & Automation ETF', ret: 28.4, risk: 'High', er: 0.35, hue: 260, tag: 'Trending' },
    { id: 'e2', sym: 'DIVQ', name: 'Quality Dividend Fund', ret: 12.7, risk: 'Moderate', er: 0.08, hue: 150, tag: 'Income' },
    { id: 'e3', sym: 'CLNE', name: 'Clean Energy Fund', ret: 9.1, risk: 'High', er: 0.4, hue: 110, tag: 'Thematic' },
    { id: 'e4', sym: 'TRES', name: 'Treasury 0–1yr', ret: 5.2, risk: 'Low', er: 0.05, hue: 45, tag: 'Low risk' },
    { id: 'e5', sym: 'EMKT', name: 'Emerging Markets Fund', ret: 14.9, risk: 'High', er: 0.18, hue: 20, tag: 'Global' },
  ],
  sips: [
    { id: 's1', fund: 'OneFI S&P 500 Index Fund', amt: 500, day: '5th', next: 'Dec 5' },
    { id: 's2', fund: 'Global Equity Fund', amt: 250, day: '15th', next: 'Dec 15' },
  ],
  linked: {
    citi: { name: 'Citi Checking', bank: 'Citi', num: '6120', bal: 9842.17, pwDays: 3, pwOk: false },
    bmo: { name: 'BMO Harris Checking', bank: 'BMO Harris', num: '3307', bal: 6215.40 },
    amex: { name: 'AMEX Savings', bank: 'AMEX Bank', num: '7731', bal: 18400.00 },
    etrade: { name: 'E*TRADE Brokerage', num: '2209', buyingPower: 52380.00 },
  },
  deposits: [],
  quotes: { // FIS: last trade Nov 18, 2026 (≈ $27.07); others are fictional
    FIS: { name: 'Fidelity National Information Services', short: 'Fidelity National Info Services', price: 27.07, chg: -1.47, asOf: 'Nov 18, 2026, 1:37 PM ET', real: true },
    NOVA: { name: 'Nova Robotics', price: 224.29, chg: 2.31 }, ORBT: { name: 'Orbit Cloud', price: 235.98, chg: -1.12 }, VRDE: { name: 'Verde Energy', price: 39.58, chg: 0.95 },
  },
  notifs: [
    { t: 'Salary received', d: 'Northwind Corp credited $6,250.00 to Everyday.', ago: '2h', icon: 'brief', unread: true },
    { t: 'Atlas spotted a duplicate charge', d: 'StreamBox charged you twice on Nov 14. Tap to review.', ago: '5h', icon: 'spark', unread: true },
    { t: 'Bill due soon', d: 'City Power & Light, $86.40 due in 3 days.', ago: '1d', icon: 'bolt' },
    { t: 'Auto-invest complete', d: '$500 invested in OneFI S&P 500 Index Fund.', ago: '13d', icon: 'invest' },
  ],
};

// transactions (most recent first)
D.tx = (() => {
  const L = [
    ['Northwind Corp', 6250.00, 0, '09:00', 'Salary'], ['Brewline Coffee', -6.80, 0, '08:12'], ['RideNow', -18.40, 0, '07:55'],
    ['FreshMart', -84.32, 1, '19:20'], ['StreamBox', -15.99, 1, '06:00'], ['Casa Verde', -62.50, 1, '20:41'],
    ['Sam Rivera', -45.00, 2, '13:10', 'Dinner split', 'transfer'], ['Shopora', -129.00, 2, '11:02'], ['Urban Fuel', -52.10, 3, '17:45'],
    ['Pulse Fitness', -49.00, 3, '06:30'], ['Noodle Theory', -27.30, 4, '13:05'], ['StreamBox', -15.99, 4, '06:00'],
    ['Lumen Books', -34.90, 5, '16:20'], ['FreshMart', -112.48, 6, '18:05'], ['Tunely', -10.99, 6, '06:00'],
    ['Priya Shah', 120.00, 7, '10:00', 'Concert tickets', 'transfer'], ['Haven Stays', -386.00, 8, '22:10'], ['Skyway Airlines', -642.20, 8, '21:58'],
    ['Brewline Coffee', -5.60, 9, '08:20'], ['Greenleaf Pharmacy', -23.75, 10, '12:40'], ['Cloudnest', -2.99, 11, '06:00'],
    ['Parkside Apartments', -2350.00, 17, '09:00', 'November rent'], ['City Power & Light', -91.12, 18, '10:30'], ['Casa Verde', -48.00, 19, '20:10'],
  ];
  const base = new Date(2026, 10, 18);
  return L.map((r, i) => {
    const [name, amt, daysAgo, time, note, cat] = r;
    const d = new Date(base); d.setDate(d.getDate() - daysAgo);
    const m = D.merchants[name];
    return { id: 't' + i, name, amt, date: d, time, note: note || '', cat: cat || (m ? m.cat : 'transfer'), hue: m ? m.hue : (D.contacts.find(c => c.name === name) || { hue: 200 }).hue, acct: 'chk', person: !m };
  });
})();

D.investTotal = D.holdings.reduce((s, h) => s + h.val, 0);
D.cashTotal = () => D.accounts.reduce((s, a) => s + (a.usd || a.bal), 0);
D.netWorth = () => D.cashTotal() + D.investTotal - D.cards[0].used - D.loans[0].left;

D.charts = {
  networth: series(36, 110490, D.netWorth(), 520, 3),
  invest: {
    '1D': series(48, D.investTotal - 612.4, D.investTotal, 70, 11),
    '1W': series(42, D.investTotal - 1480, D.investTotal, 420, 12),
    '1M': series(60, D.investTotal - 3920, D.investTotal, 820, 13),
    '1Y': series(80, D.investTotal - 13210, D.investTotal, 1900, 14),
    'All': series(90, 31000, D.investTotal, 2600, 15),
  },
  investChg: { '1D': 612.40, '1W': 1480, '1M': 3920, '1Y': 13210, 'All': D.investTotal - 31000 },
};

D.spend = { // this month vs last
  month: [
    { cat: 'bills', v: 2441.12 }, { cat: 'travel', v: 1028.20 }, { cat: 'dining', v: 156.20 }, { cat: 'groceries', v: 196.80 },
    { cat: 'shopping', v: 163.90 }, { cat: 'transport', v: 70.50 }, { cat: 'subs', v: 45.96 }, { cat: 'health', v: 72.75 },
  ],
  last: { bills: 2441.12, travel: 210.00, dining: 190.40, groceries: 231.00, shopping: 288.10, transport: 96.20, subs: 30.0, health: 49.0 },
  daily: series(18, 40, 160, 120, 21).map(v => Math.max(12, v)),
};
