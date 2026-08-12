const { chromium } = require('playwright');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = process.env.SHOT_DIR || require('os').tmpdir();   // 저장소에 남기지 않는다
const fails=[]; const check=(n,c,x)=>{console.log((c?'  OK   ':'  FAIL ')+n+(x?'  '+x:'')); if(!c)fails.push(n);};
(async()=>{
  const b=await chromium.launch({executablePath:CHROME});
  for(const [name,base] of [['아이비','http://127.0.0.1:8765/'],['한국','http://127.0.0.1:8765/korea-uni/']]){
    const p=await b.newPage({viewport:{width:390,height:844}});
    const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
    await p.goto(base);
    const bar=p.locator('#result-bar');
    check(name+' 인트로에선 숨김', !(await bar.evaluate(e=>e.classList.contains('is-on'))));
    await p.click('#pick-here');            // 1단계: 테스트 확정
    await p.click('#mode-student');
    await p.waitForSelector('#screen-quiz:not(.hidden)');
    check(name+' 문항에서도 숨김', !(await bar.evaluate(e=>e.classList.contains('is-on'))));
    const n = await p.locator('#options').evaluate(()=>QUESTIONS.length);
    for(let i=0;i<n;i++){
      await p.locator('#options .option').nth(i%4).click();
      if(i<n-1) await p.waitForFunction(k=>document.getElementById('q-index').textContent===String(k), i+2,{timeout:3000});
    }
    await p.click('#btn-next');
    await p.waitForSelector('#screen-result:not(.hidden)',{timeout:8000});
    await p.waitForTimeout(400);
    check(name+' 결과에서 보임', await bar.evaluate(e=>e.classList.contains('is-on')));
    // 바가 화면 안에 있고 마지막 내용을 안 덮는지
    const box=await bar.boundingBox();
    check(name+' 바가 화면 하단에', box && Math.abs((box.y+box.height)-844)<2, box? Math.round(box.y)+'~'+Math.round(box.y+box.height):'없음');
    await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
    await p.waitForTimeout(300);
    const restart=await p.locator('#btn-restart').boundingBox();
    check(name+' 다시 하기가 안 가려짐', restart && restart.y+restart.height <= box.y+1,
          restart? '버튼 끝 '+Math.round(restart.y+restart.height)+' vs 바 위 '+Math.round(box.y):'없음');
    // 공유가 실제로 동작하는지
    await p.click('#btn-share');
    await p.waitForTimeout(500);
    const hint=await p.locator('#share-hint').innerText();
    check(name+' 공유 눌리고 안내 뜸', hint.length>0, '"'+hint+'"');
    check(name+' JS 에러 없음', errs.length===0, errs[0]||'');
    if(name==='한국') await p.screenshot({path:require('path').join(OUT,'bar-result.png')});
    await p.close();
  }
  await b.close();
  console.log(fails.length? '\n실패 '+fails.length+'건: '+fails.join(', ') : '\n전부 통과');
})();
