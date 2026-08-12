/**
 * 인트로 단계 검증
 * 테스트 선택과 모드 선택을 한 화면에 같이 두니 헷갈려서 한 번에 하나만 묻는다.
 */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = process.env.BASE || 'http://127.0.0.1:8765';
const fails = [];
const check = (n, c, x) => { console.log((c ? '  OK   ' : '  FAIL ') + n + (x ? '  ' + x : '')); if (!c) fails.push(n); };

(async () => {
  const b = await chromium.launch({ executablePath: CHROME });
  for (const [name, url, who] of [['아이비', BASE + '/', '미국 아이비리그'], ['한국', BASE + '/korea-uni/', '한국 대학']]) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(url);

    check(name + ' 처음엔 1단계만', await p.locator('#step-test').isVisible() &&
      !(await p.locator('#step-mode').isVisible()));
    check(name + ' 모드 버튼 안 보임', !(await p.locator('#mode-student').isVisible()));

    await p.click('#pick-here');
    await p.waitForTimeout(200);
    check(name + ' 고르면 2단계', !(await p.locator('#step-test').isVisible()) &&
      await p.locator('#step-mode').isVisible());
    const chosen = await p.locator('#chosen-test').innerText();
    check(name + ' 고른 것 요약', chosen.includes(who), '"' + chosen.replace(/\n/g, ' ') + '"');

    // 되돌아가기
    await p.locator('#chosen-test .link-btn').click();
    await p.waitForTimeout(200);
    check(name + ' 바꾸기로 1단계 복귀', await p.locator('#step-test').isVisible() &&
      !(await p.locator('#step-mode').isVisible()));

    // 다시 진행해서 퀴즈까지
    await p.click('#pick-here');
    await p.click('#mode-student');
    await p.waitForSelector('#screen-quiz:not(.hidden)');
    check(name + ' 2단계에서 시작됨', true, await p.locator('#quiz-mode-label').innerText());

    // 중간에 그만두고 다시 들어오면 1단계를 건너뛴다
    await p.locator('#options .option').nth(0).click();
    await p.waitForTimeout(400);
    await p.goto(url);
    check(name + ' 하던 게 있으면 2단계로', await p.locator('#step-mode').isVisible() &&
      !(await p.locator('#step-test').isVisible()));
    check(name + ' 이어서 하기 보임', await p.locator('#btn-resume').isVisible(),
      await p.locator('#btn-resume').innerText());
    check(name + ' JS 에러 없음', errs.length === 0, errs[0] || '');
    await p.close();
  }
  await b.close();
  console.log(fails.length ? '\n실패 ' + fails.length + '건: ' + fails.join(', ') : '\n전부 통과');
})();
