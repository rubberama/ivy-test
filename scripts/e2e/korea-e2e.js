const { chromium } = require('playwright');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = 'http://127.0.0.1:8765/korea-uni/';
// 스크린샷은 저장소가 아니라 임시 폴더로. 여기 두면 실행할 때마다
// 저장소가 더러워지고, 실제로 커밋까지 딸려 들어간 적이 있다.
const OUT = process.env.SHOT_DIR || require('os').tmpdir();
const out = f => require('path').join(OUT, f);
const fails = [];
const check = (n, c, x) => { console.log((c ? '  OK   ' : '  FAIL ') + n + (x ? '  ' + x : '')); if (!c) fails.push(n); };
(async () => {
  const b = await chromium.launch({ executablePath: CHROME });
  const errs = [];
  const np = async () => { const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); }); return p; };
  for (const mode of ['student','parent']) {
    const p = await np();
    await p.goto(BASE);
    check(mode+' 인트로', (await p.locator('#roster li').count()) === 30, '학교 '+(await p.locator('#roster li').count())+'곳');
    check(mode+' 축 목록', (await p.locator('#axis-preview li').count()) === 10);
    await p.click('#pick-here');
    await p.click('#mode-'+mode);
    await p.waitForSelector('#screen-quiz:not(.hidden)');
    check(mode+' 총 문항', (await p.locator('#progress-total').innerText()) === '20');
    for (let i=0;i<20;i++){
      await p.locator('#options .option').nth([0,3,1,2][i%4]).click();
      await p.click('#btn-next');
      if (i<19) await p.waitForFunction(n=>document.getElementById('q-index').textContent===String(n), i+2);
    }
    await p.waitForSelector('#screen-result:not(.hidden)', { timeout: 8000 });
    const name = await p.locator('#result-name').innerText();
    const pct = await p.locator('#result-percent').innerText();
    check(mode+' 결과 도달', !!name, name.split('\n')[0]+' '+pct);
    check(mode+' 상위 3곳', (await p.locator('#ranking .rank-row, #ranking > div').count()) >= 3);
    check(mode+' 성향 그래프', (await p.locator('#axis-chart > *').count()) === 10);
    check(mode+' 학부모 블록', (await p.locator('#parent-facts-block').isVisible()) === (mode==='parent'));
    const url = p.url();
    check(mode+' 공유 해시', /#r=v3\./.test(url), url.split('#')[1]);
    // 링크 왕복
    const sp = await np(); await sp.goto(url);
    await sp.waitForSelector('#screen-result:not(.hidden)', { timeout: 8000 });
    check(mode+' 링크 재현', (await sp.locator('#result-name').innerText()) === name);
    check(mode+' 링크 버튼 문구', (await sp.locator('#btn-restart').innerText()) === '나도 해보기');
    await sp.close();
    await p.screenshot({ path: out(`korea-${mode}.png`), fullPage: true });
    if (mode==='student') require('fs').writeFileSync(out('korea-result.txt'), await p.locator('#screen-result').innerText());
    await p.close();
  }
  const px = await np(); await px.goto('http://127.0.0.1:8765/');
  check('아이비 버전 영향 없음', (await px.locator('#roster li').count()) === 8);
  await px.close();
  check('JS 에러 없음', errs.length===0, errs.slice(0,2).join(' | '));
  await b.close();
  console.log(fails.length? '\n실패 '+fails.length+'건: '+fails.join(', ') : '\n전부 통과');
})();
