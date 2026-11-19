import sys, json, asyncio
from playwright.async_api import async_playwright
# usage: shot.py out.png theme "query" [js-after]
async def main():
    shots=json.loads(sys.argv[1])
    async with async_playwright() as p:
        b=await p.chromium.launch()
        errs=[]
        for s in shots:
            ctx=await b.new_context(viewport={'width':393,'height':852},device_scale_factor=2,has_touch=True,is_mobile=True)
            pg=await ctx.new_page()
            pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
            pg.on('pageerror',lambda e: errs.append(str(e)))
            await pg.add_init_script(f"localStorage.setItem('sb.theme',JSON.stringify('{s['theme']}'));localStorage.setItem('sb.onboarded','{s.get('onb','true')}');")
            await pg.goto('file:///home/claude/superbank/build/index.html'+s.get('q','?skip=1'))
            await pg.wait_for_timeout(s.get('wait',2200))
            for js in s.get('js',[]):
                if isinstance(js,int): await pg.wait_for_timeout(js)
                else: await pg.evaluate(js)
            await pg.screenshot(path=s['out'])
            await ctx.close()
        await b.close()
        print('errors:',errs[:10])
asyncio.run(main())
