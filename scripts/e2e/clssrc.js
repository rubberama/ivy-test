const { chromium } = require('playwright');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const NET={offline:false,downloadThroughput:1.6*1024*1024/8,uploadThroughput:750*1024/8,latency:150};
(async()=>{
  const b=await chromium.launch({executablePath:CHROME});
  const p=await b.newPage({viewport:{width:390,height:844}});
  const cdp=await p.context().newCDPSession(p); await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions',NET);
  await p.addInitScript(()=>{window.__shifts=[];
    new PerformanceObserver(l=>{for(const e of l.getEntries()){ if(e.hadRecentInput) continue;
      window.__shifts.push({v:Math.round(e.value*1000)/1000,t:Math.round(e.startTime),
        src:(e.sources||[]).map(s=>{const n=s.node; return n? (n.id? '#'+n.id : (n.tagName||'?')+'.'+((n.className||'')+'').split(' ')[0]) : '?';}).slice(0,3)});}
    }).observe({type:'layout-shift',buffered:true});});
  await p.goto('http://127.0.0.1:8765/korea-uni/',{waitUntil:'load'});
  await p.waitForTimeout(2500);
  const sh=await p.evaluate(()=>window.__shifts);
  console.log('레이아웃 이동 ' + sh.length + '건, 합계 ' + Math.round(sh.reduce((a,x)=>a+x.v,0)*1000)/1000);
  sh.forEach(x=>console.log('  '+String(x.t).padStart(5)+'ms  '+String(x.v).padStart(6)+'  '+x.src.join(', ')));
  await p.close(); await b.close();
})();
