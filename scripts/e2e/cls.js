const { chromium } = require('playwright');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const NET={offline:false,downloadThroughput:1.6*1024*1024/8,uploadThroughput:750*1024/8,latency:150};
(async()=>{
  const b=await chromium.launch({executablePath:CHROME});
  for(const [n,u] of [['아이비','http://127.0.0.1:8765/'],['한국','http://127.0.0.1:8765/korea-uni/']]){
    const p=await b.newPage({viewport:{width:390,height:844}});
    const cdp=await p.context().newCDPSession(p);
    await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions',NET);
    await p.addInitScript(()=>{window.__cls=0;new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__cls+=e.value;}).observe({type:'layout-shift',buffered:true});});
    await p.goto(u,{waitUntil:'load'});
    await p.waitForTimeout(2500);
    const m=await p.evaluate(()=>{const o={};performance.getEntriesByType('paint').forEach(e=>o[e.name]=Math.round(e.startTime));
      return {fcp:o['first-contentful-paint'],cls:Math.round((window.__cls||0)*1000)/1000,
              font:(document.fonts&&document.fonts.check('700 40px SUIT'))||false};});
    console.log('  '+n.padEnd(5)+'FCP '+String(m.fcp).padStart(5)+'ms   CLS '+String(m.cls).padStart(5)+'   SUIT 적용 '+m.font);
    await p.close();
  }
  await b.close();
})();
