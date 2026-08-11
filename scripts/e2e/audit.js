const { chromium } = require('playwright');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
(async () => {
  const b = await chromium.launch({ executablePath: CHROME });
  for (const [name, url] of [['아이비','http://127.0.0.1:8765/'],['한국','http://127.0.0.1:8765/korea-uni/']]) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    const res = [];
    p.on('response', async r => { try { const buf = await r.body(); res.push([r.url().split('/').pop()||'/', buf.length, r.request().resourceType()]); } catch(e){} });
    const t0 = Date.now();
    await p.goto(url, { waitUntil: 'load' });
    const loadMs = Date.now() - t0;
    const m = await p.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const paints = {}; performance.getEntriesByType('paint').forEach(e => paints[e.name] = Math.round(e.startTime));
      return { dcl: Math.round(nav.domContentLoadedEventEnd||0), load: Math.round(nav.loadEventEnd||0), paints,
               dom: document.querySelectorAll('*').length };
    });
    const total = res.reduce((a,r)=>a+r[1],0);
    console.log('\n=== ' + name + ' ===');
    console.log('  전송량 ' + (total/1024).toFixed(0) + 'KB / 요청 ' + res.length + '개 / load ' + loadMs + 'ms');
    console.log('  FCP ' + (m.paints['first-contentful-paint']||'?') + 'ms · DCL ' + m.dcl + 'ms · DOM ' + m.dom + '개');
    res.sort((a,b)=>b[1]-a[1]).slice(0,5).forEach(r=>console.log('    ' + String(Math.round(r[1]/1024)).padStart(4) + 'KB  ' + r[0].slice(0,40)));
    // 인터랙션 반응 속도
    await p.click(name==='아이비'?'#mode-student':'#mode-student');
    await p.waitForSelector('#screen-quiz:not(.hidden)');
    const t1 = Date.now();
    await p.locator('#options .option').nth(0).click();
    await p.click('#btn-next');
    await p.waitForFunction(()=>document.getElementById('q-index').textContent==='2');
    console.log('  문항 넘김 ' + (Date.now()-t1) + 'ms');
    await p.close();
  }
  await b.close();
})();
