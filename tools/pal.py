import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); errs=[]
        for pal in sys.argv[1:]:
            ctx=await b.new_context(viewport={'width':393,'height':852},device_scale_factor=2,has_touch=True)
            pg=await ctx.new_page()
            pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
            await pg.add_init_script(f"localStorage.setItem('sb.palette',JSON.stringify('{pal}'))")
            await pg.goto('file:///home/claude/superbank/build/index.html?skip=1&tab=home'); await pg.wait_for_timeout(2600)
            await pg.screenshot(path=f'renders/pal/{pal}_1home.png')
            await pg.evaluate("SB.push('assistant')"); await pg.wait_for_timeout(900)
            await pg.screenshot(path=f'renders/pal/{pal}_2greet.png')
            async def say(t, w):
                await pg.evaluate(f"(()=>{{const i=document.querySelector('#ain');i.value={t!r};document.querySelector('#asend').click()}})()"); await pg.wait_for_timeout(w)
            await say('Pay $1,000 to Shroff', 2900); await pg.screenshot(path=f'renders/pal/{pal}_3progress.png')
            await pg.wait_for_timeout(3600); await pg.evaluate("document.querySelector('#cb').scrollBy(0,-120)"); await pg.wait_for_timeout(300); await pg.screenshot(path=f'renders/pal/{pal}_4ticket.png')
            await say('Make a term deposit with $5,000', 7500); await pg.evaluate("(()=>{const o=[...document.querySelectorAll('.offer')].pop();o.scrollIntoView({block:'start'});document.querySelector('#cb').scrollBy(0,-80)})()"); await pg.wait_for_timeout(400); await pg.screenshot(path=f'renders/pal/{pal}_5offer.png')
            await say('Buy 500 shares of FIS', 7800); await pg.evaluate("(()=>{const o=[...document.querySelectorAll('.ticket')].pop();o.scrollIntoView({block:'start'});document.querySelector('#cb').scrollBy(0,-70)})()"); await pg.wait_for_timeout(400); await pg.screenshot(path=f'renders/pal/{pal}_6fis.png')
            await pg.evaluate("SB.pop()"); await pg.wait_for_timeout(600); await pg.evaluate("SB.push('profile')"); await pg.wait_for_timeout(800); await pg.screenshot(path=f'renders/pal/{pal}_7profile.png')
            await ctx.close()
        print('ERRORS',errs); await b.close()
asyncio.run(main())
