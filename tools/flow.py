import asyncio, sys
from playwright.async_api import async_playwright
THEME=sys.argv[1] if len(sys.argv)>1 else 'noir'
TOP="document.querySelector('#stage').lastElementChild"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        ctx=await b.new_context(viewport={'width':393,'height':852},device_scale_factor=2)
        pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e: errs.append(str(e)))
        pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
        await pg.add_init_script(f"if(!sessionStorage.x){{sessionStorage.x=1;localStorage.clear();localStorage.setItem('sb.theme',JSON.stringify('{THEME}'))}}")
        n=[0]
        async def shot(name, w=0):
            if w: await pg.wait_for_timeout(int(w*1.76))
            n[0]+=1; await pg.screenshot(path=f'renders/flow15/{THEME}_{n[0]:02d}_{name}.png')
        async def c(sel, w=500, scope='top'):
            js = f"(()=>{{const r=({TOP if scope=='top' else "[...document.querySelectorAll('.sheet')].pop()||[...document.querySelectorAll('#app > .screen')].pop()"})||document;const e=r.querySelector({sel!r})||document.querySelector({sel!r});if(!e)throw new Error('missing '+{sel!r});e.click();}})()"
            await pg.evaluate(js); await pg.wait_for_timeout(int(w*1.76))
        async def keys(ks, scope='top'):
            for k in ks: await c(f'.key[data-k="{k}"]', 120, scope)
        async def hold(sel='.hold'):
            box=await pg.locator(sel).last.bounding_box()
            await pg.mouse.move(box['x']+box['width']/2, box['y']+box['height']/2); await pg.mouse.down(); await pg.wait_for_timeout(1100); await pg.mouse.up(); await pg.wait_for_timeout(600)
        async def back(w=500): await pg.evaluate('SB.back()'); await pg.wait_for_timeout(w)
        await pg.goto('file:///home/claude/superbank/build/index.html')
        await shot('splash',700)
        await shot('intro1',1500)
        await c('#nx',700); await shot('intro2')
        await c('#nx',700); await shot('intro3_theme')
        await c('#nx',800); await shot('lock')
        await c('.key[data-k="1"]',100,'doc'); await c('.key[data-k="2"]',100,'doc'); await shot('lock_pin')
        await c('.key[data-k="3"]',100,'doc'); await c('.key[data-k="4"]',1500,'doc'); await shot('home')
        await pg.evaluate(TOP+".querySelector('.body').scrollTo(0,900)"); await shot('home_scrolled',300)
        await c('#eye',400); await c('#eye',300); await shot('home_eye')
        # send flow
        await c('[data-push="contacts"]',600); await shot('contacts')
        await c('#cl .row',600); await keys('45.5'); await shot('amount')
        await c('#go',700); await shot('review')
        await hold(); await shot('pin_sheet')
        await keys('1234','doc'); await shot('processing',800)
        await shot('success',2400)
        await c('#dn',800); await shot('home_after_pay')
        # scan
        await c('[data-push="scan"]',1200); await shot('scan')
        await shot('scan_found',1700)
        await shot('scan_amount',1500)
        await back(700)
        # pay hub
        await pg.evaluate("SB.push('payhub',{},'up')"); await pg.wait_for_timeout(700); await shot('payhub')
        await c('[data-push="bills"]',700); await shot('bills')
        await c('[data-push="paybill"]',700); await shot('paybill')
        await back(); await back(); await back()
        # transactions
        await c('[data-push="txs"]',1200); await shot('txs')
        await c('#cf .chip[data-c="dining"]',300); await shot('txs_filter')
        await c('#txl .row',700); await shot('tx_sheet')
        await back(); await back()
        await c('[data-push="account"]',800); await shot('account')
        await back(); await c('[data-push="notifs"]',700); await shot('notifs'); await back()
        await pg.evaluate("SB.push('search')"); await pg.wait_for_timeout(700); await pg.fill('#sq','coffee'); await pg.evaluate("document.querySelector('#sq').dispatchEvent(new Event('input'))"); await shot('search',300); await back()
        await c('[data-sheet="addmoney"]',700); await shot('addmoney'); await back()
        await c('[data-push="goals"]',700); await shot('goals'); await back()
        # invest
        await c('.tab[data-tab="invest"]',1600,'doc'); await shot('invest')
        await c('#rng [data-r="1Y"]',1300); await shot('invest_1y')
        await pg.evaluate(TOP+".querySelector('.body').scrollTo(0,800)"); await shot('invest_scrolled',400)
        await c('#rebal',700); await shot('rebalance_sheet'); await back()
        await c('.list [data-push="fund"]',1500); await shot('fund')
        await c('#buy',700); await keys('250'); await c('#freq [data-f="monthly"]',200); await shot('investamt')
        await c('#go',700); await shot('invest_confirm')
        await hold('.sheet .hold'); await keys('1234','doc'); await shot('invest_success',2600)
        await c('#dn',900)
        await c('[data-push="explore"]',700); await shot('explore'); await back()
        await c('[data-push="sips"]',700); await shot('sips'); await back()
        # cards
        await c('.tab[data-tab="cards"]',1200,'doc'); await shot('cards')
        await c('#frz',800); await shot('card_frozen'); await c('#frz',400)
        await c('#lim',700); await shot('limit_sheet'); await back()
        await c('#rev',600); await keys('1234','doc'); await shot('card_revealed',600)
        await c('[data-push="credit"]',1800); await shot('credit'); await back()
        await c('[data-push="loans"]',700); await shot('loans')
        await c('.insight [data-push="loancalc"]',700); await shot('loancalc')
        await c('#apply',3200); await shot('loan_approved',300); await c('#dn',900)
        await c('[data-push="insurance"]',700); await shot('insurance')
        await c('.q',2700); await shot('ins_quote'); await back(); await back()
        await c('[data-push="rewards"]',700); await shot('rewards'); await back()
        # assistant
        await pg.evaluate("SB.push('assistant')"); await pg.wait_for_timeout(900); await shot('assistant')
        await c('[data-t="My accounts"]',3500); await shot('assistant_accounts')
        await back(600)
        await c('.tab[data-tab="home"]',900,'doc'); await c('[data-push="txs"]',1000); await c('[data-push="insights"]',1200); await shot('insights'); await back(); await back()
        # profile + theme switch
        await c('.tab[data-tab="home"]',900,'doc'); await pg.evaluate("SB.go('profile')"); await pg.wait_for_timeout(800); await shot('profile')
        await back(); await back()
        print('ERRORS:',errs)
        await b.close()
asyncio.run(main())
