/**
 * 테스트 선택 검증
 * 두 테스트가 같은 도메인에 따로 올라가 있어서 서로 오갈 수 있어야 한다.
 */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = process.env.BASE || 'http://127.0.0.1:8765';
const fails = [];
const check = (n, c, x) => { console.log((c ? '  OK   ' : '  FAIL ') + n + (x ? '  ' + x : '')); if (!c) fails.push(n); };

(async () => {
  const b = await chromium.launch({ executablePath: CHROME });
  for (const [name, url, hereName, goName, goCount] of [
    ['아이비', BASE + '/', '미국 아이비리그', '한국 대학', '30곳 · 질문 20개'],
    ['한국', BASE + '/korea-uni/', '한국 대학', '미국 아이비리그', '8곳 · 질문 18개'],
  ]) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(url);

    check(name + ' 선택 카드 2개', (await p.locator('#test-pick .test-card').count()) === 2);
    const here = p.locator('#test-pick .test-card.is-here');
    check(name + ' 지금 보는 쪽 표시', (await here.count()) === 1 &&
      (await here.locator('.test-name').innerText()) === hereName,
      await here.locator('.test-name').innerText());
    // 지금 보는 쪽은 다른 페이지로 가는 게 아니라 다음 단계로 넘어간다.
    // 링크(<a>)면 안 되고, 눌렀을 때 주소가 바뀌어도 안 된다.
    check(name + ' 지금 보는 쪽은 링크 아님',
      (await here.evaluate(e => e.tagName)) === 'BUTTON');
    var urlBefore = p.url();
    await here.click();
    await p.waitForTimeout(200);
    check(name + ' 눌러도 페이지 이동 없음', p.url() === urlBefore &&
      await p.locator('#step-mode').isVisible(), p.url());
    // 1단계로 되돌려서 나머지 검사를 이어간다
    await p.locator('#chosen-test .link-btn').click();
    await p.waitForTimeout(150);

    const go = p.locator('#test-pick a.test-card');
    check(name + ' 반대쪽은 링크', (await go.count()) === 1 &&
      (await go.locator('.test-name').innerText()) === goName);
    check(name + ' 반대쪽 규모 표시', (await go.locator('.test-meta').innerText()) === goCount,
      await go.locator('.test-meta').innerText());

    // 실제로 눌러서 넘어가는지
    await go.click();
    await p.waitForLoadState('load');
    const nowHere = await p.locator('#test-pick .test-card.is-here .test-name').innerText();
    check(name + ' 눌러서 넘어감', nowHere === goName, p.url() + ' → ' + nowHere);
    // 넘어간 쪽에서 실제 그 테스트가 도는지
    const n = await p.evaluate(() => QUESTIONS.length);
    const s = await p.evaluate(() => SCHOOLS.length);
    check(name + ' 넘어간 쪽 데이터', String(s) + '곳 · 질문 ' + n + '개' === goCount,
      s + '곳 ' + n + '문항');
    check(name + ' JS 에러 없음', errs.length === 0, errs[0] || '');
    await p.close();
  }
  await b.close();
  console.log(fails.length ? '\n실패 ' + fails.length + '건: ' + fails.join(', ') : '\n전부 통과');
})();
