import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':393,'height':852},device_scale_factor=2,has_touch=True)
        pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
        await pg.goto('file:///home/claude/superbank/build/index.html?skip=1&tab=home&push=assistant'); await pg.wait_for_timeout(1200)
        n=[0]
        async def shot(name,w=0):
            if w: await pg.wait_for_timeout(int(w*1.76))
            n[0]+=1; await pg.screenshot(path=f'renders/story16/{n[0]:02d}_{name}.png')
        async def typenext():
            await pg.evaluate("(()=>{const i=document.querySelector('#ain');i.blur();i.focus();})()"); await pg.wait_for_timeout(2800)
        async def send(): await pg.evaluate("document.querySelector('#asend').click()")
        await typenext(); await shot('1_ask_pay_shroff')
        await send(); await shot('2_payment_in_progress',3000); await shot('3_payment_success',3600); await shot('3b_citi_password_alert',5200)
        await typenext(); await send(); await pg.wait_for_timeout(4200)
        await pg.fill('#pwo','OldPass#2025'); await pg.fill('#pwn','Harvest#Moon26'); await pg.fill('#pwc','Harvest#Moon26'); await shot('3c_citi_password_form',300)
        await pg.click('#pwgo'); await shot('3d_citi_updating',1200); await shot('3e_citi_password_updated',9000)
        await typenext(); await send(); await shot('4_bill_in_progress',3000); await shot('5_bill_success',3600)
        await typenext(); await send(); await shot('6_td_analysing',3000); await shot('7_amex_recommendation',4200)
        await pg.evaluate("[...document.querySelectorAll('[data-t=\"Yes, go ahead\"]')].pop().click()"); await shot('8_creating_td',3000); await shot('9_td_success',3600)
        await typenext(); await send(); await shot('10_fis_in_progress',3000); await shot('11_fis_success',4000)
        await pg.evaluate("[...document.querySelectorAll('[data-a=\"portfolio\"]')].pop().click()"); await shot('12_portfolio',2200)
        await pg.evaluate("SB.push('assistant')"); await pg.wait_for_timeout(800)
        await pg.evaluate("(()=>{const i=document.querySelector('#ain');i.value='Pay $20 to Zed';document.querySelector('#asend').click()})()"); await shot('13_unknown_payee',2500)
        await pg.evaluate("(()=>{const i=document.querySelector('#ain');i.value='Buy 5000 shares of FIS';document.querySelector('#asend').click()})()"); await shot('14_over_buying_power',2500)
        await pg.evaluate("(()=>{const i=document.querySelector('#ain');i.value='How much did I spend on dining?';document.querySelector('#asend').click()})()"); await shot('15_analytics',7500)
        await pg.evaluate("(()=>{const i=document.querySelector('#ain');i.value='Order a turkey for each of my team members for Thanksgiving';document.querySelector('#asend').click()})()"); await shot('16_turkey_finding',2600); await shot('17_turkey_found',4600)
        await pg.evaluate("document.querySelector('.tkcard [data-t=\"Place order\"]').click()"); await shot('18_turkey_ordering',3600); await shot('19_happy_thanksgiving',4200)
        print('ERRORS', errs); await b.close()
asyncio.run(main())
