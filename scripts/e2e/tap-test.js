const { chromium } = require('playwright');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const fails=[]; const check=(n,c,x)=>{console.log((c?'  OK   ':'  FAIL ')+n+(x?'  '+x:'')); if(!c)fails.push(n);};
(async()=>{
  const b=await chromium.launch({executablePath:CHROME});
  // 1) 탭 수: 클릭만으로 끝까지 가는가
  const p=await b.newPage({viewport:{width:390,height:844}});
  await p.goto('http://127.0.0.1:8765/korea-uni/');
  await p.click('#mode-student');
  await p.waitForSelector('#screen-quiz:not(.hidden)');
  let taps=0;
  for(let i=0;i<19;i++){
    await p.locator('#options .option').nth(i%4).click(); taps++;
    await p.waitForFunction(n=>document.getElementById('q-index').textContent===String(n), i+2, {timeout:3000});
  }
  check('선택만으로 19문항 전진', true, taps+'탭 (예전 방식이면 '+(taps*2)+'탭)');
  // 마지막 문항은 자동 전진하면 안 된다
  await p.locator('#options .option').nth(0).click(); taps++;
  await p.waitForTimeout(600);
  check('마지막 문항은 자동 전진 안 함', !(await p.locator('#screen-result').isVisible()));
  check('마지막 버튼이 결과 보기', (await p.locator('#btn-next').innerText()).includes('결과 보기'));
  await p.click('#btn-next');
  await p.waitForSelector('#screen-result:not(.hidden)',{timeout:8000});
  check('결과 도달', true, (await p.locator('#result-name').innerText()).split('\n')[0]);
  console.log('  총 탭 ' + (taps+1) + '회 (20문항 + 결과보기)');
  await p.close();

  // 2) 키보드 방향키로는 안 넘어가야 한다
  const k=await b.newPage({viewport:{width:390,height:844}});
  await k.goto('http://127.0.0.1:8765/korea-uni/');
  await k.click('#mode-student');
  await k.waitForSelector('#screen-quiz:not(.hidden)');
  await k.locator('#options input').first().focus();
  await k.keyboard.press('ArrowDown');
  await k.keyboard.press('ArrowDown');
  await k.waitForTimeout(600);
  check('방향키로는 자동 전진 안 함', (await k.locator('#q-index').innerText())==='1',
        'q-index=' + (await k.locator('#q-index').innerText()));
  check('방향키로도 선택은 됨', (await k.locator('#options .is-selected').count())===1);
  await k.close();

  // 3) 뒤로 갔다가 답을 바꾸면 다시 앞으로
  const r=await b.newPage({viewport:{width:390,height:844}});
  await r.goto('http://127.0.0.1:8765/korea-uni/');
  await r.click('#mode-student');
  await r.waitForSelector('#screen-quiz:not(.hidden)');
  await r.locator('#options .option').nth(0).click();
  await r.waitForFunction(()=>document.getElementById('q-index').textContent==='2');
  await r.click('#btn-prev');
  await r.waitForFunction(()=>document.getElementById('q-index').textContent==='1');
  check('이전으로 돌아가면 머무름', (await r.locator('#q-index').innerText())==='1');
  await r.waitForTimeout(500);
  check('돌아간 뒤 튕겨 나가지 않음', (await r.locator('#q-index').innerText())==='1');
  await r.close();
  await b.close();
  console.log(fails.length? '\n실패 '+fails.length+'건: '+fails.join(', ') : '\n전부 통과');
})();
