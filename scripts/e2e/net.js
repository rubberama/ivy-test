const { chromium } = require('playwright');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
// Fast 3G 비슷하게: 1.6Mbps 다운, 150ms RTT
const NET={offline:false,downloadThroughput:1.6*1024*1024/8,uploadThroughput:750*1024/8,latency:150};
(async()=>{
  const b=await chromium.launch({executablePath:CHROME});
  for(const label of ['현재(블로킹)','비동기 폰트']){
    const p=await b.newPage({viewport:{width:390,height:844}});
    const cdp=await p.context().newCDPSession(p);
    await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions',NET);
    if(label==='비동기 폰트'){
      await p.route('**/korea-uni/', async route=>{
        const r=await route.fetch(); let html=await r.text();
        html=html.replace('<link rel="stylesheet" href="../fonts/suit.css">',
          '<link rel="stylesheet" href="../fonts/suit.css" media="print" onload="this.media=\'all\'">');
        await route.fulfill({response:r, body:html});
      });
    }
    await p.goto('http://127.0.0.1:8765/korea-uni/',{waitUntil:'load'});
    const m=await p.evaluate(()=>{const o={};performance.getEntriesByType('paint').forEach(e=>o[e.name]=Math.round(e.startTime));
      const n=performance.getEntriesByType('navigation')[0]||{};return {fcp:o['first-contentful-paint'],load:Math.round(n.loadEventEnd||0)};});
    console.log('  '+label.padEnd(12)+'FCP '+String(m.fcp).padStart(5)+'ms   load '+String(m.load).padStart(5)+'ms');
    await p.close();
  }
  await b.close();
})();
