const { chromium } = require('playwright');
const path = require('path');

const APP = require('path').join(__dirname, '..', '..');
const OUT = process.env.SHOT_DIR || require('os').tmpdir();
const BASE = process.env.BASE || 'http://127.0.0.1:8765';
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const fails = [];
function check(name, cond, extra) {
  console.log((cond ? '  OK   ' : '  FAIL ') + name + (extra ? '  ' + extra : ''));
  if (!cond) fails.push(name);
}

// 18문항을 주어진 패턴으로 완주한다.
// 선택하면 자동으로 다음 문항으로 넘어가므로 '다음'을 누르지 않는다.
// 마지막 문항만 자동 전진하지 않고 '결과 보기'를 눌러야 한다.
async function runQuiz(page, pattern) {
  const total = await page.evaluate(() => QUESTIONS.length);
  for (let i = 0; i < total; i++) {
    await page.locator('#options .option').nth(pattern(i)).click();
    if (i < total - 1) {
      await page.waitForFunction(n => document.getElementById('q-index').textContent === String(n),
        i + 2, { timeout: 3000 });
    }
  }
  await page.click('#btn-next');   // 결과 보기
  await page.waitForSelector('#screen-result:not(.hidden)', { timeout: 8000 });
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const errors = [];
  const newPage = async (opts = {}) => {
    const ctx = await browser.newContext(Object.assign(
      { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'ko-KR' }, opts));
    const p = await ctx.newPage();
    p.on('pageerror', e => errors.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    return p;
  };

  console.log('\n=== 인트로 · 모드 선택 ===');
  const page = await newPage();
  await page.goto(BASE + '/index.html');
  await page.waitForSelector('#screen-intro:not(.hidden)');
  check('모드 버튼 2개', (await page.locator('.mode-btn').count()) === 2);
  check('학생 버튼 문구', (await page.locator('#mode-student .mode-name').innerText()) === '학생이에요');
  check('학부모 버튼 문구', (await page.locator('#mode-parent .mode-name').innerText()) === '학부모예요');
  check('학교 8곳 나열', (await page.locator('#roster li').count()) === 8);
  check('성향 축 7개', (await page.locator('#axis-preview li').count()) === 7);
  check('엠블럼 SVG 없음', (await page.locator('svg.emblem').count()) === 0);
  await page.screenshot({ path: path.join(OUT, 'shot-1-intro.png'), fullPage: true });

  // ── 학생 모드 ─────────────────────────────────────────────
  console.log('\n=== 학생 모드 ===');
  await page.click('#mode-student');
  await page.waitForSelector('#screen-quiz:not(.hidden)');
  const sQ1 = await page.locator('#question-text').innerText();
  check('학생용 문항 (1인칭)', sQ1.includes('나는'), '"' + sQ1 + '"');
  check('진행률 라벨에 학생 표시', (await page.locator('#quiz-mode-label').innerText()).includes('학생용'));
  const sNote = await page.locator('#progress-note').innerText();
  check('학생용 안내문', sNote.startsWith('정답은 없어요.'), '"' + sNote.slice(0, 24) + '…"');
  await page.locator('#options .option').nth(0).click();
  await page.screenshot({ path: path.join(OUT, 'shot-2-quiz-student.png'), fullPage: true });

  await runQuiz(page, i => i % 4);
  const sName = await page.locator('#result-name').innerText();
  const sPct = await page.locator('#result-percent').innerText();
  check('학생 결과 도달', await page.isVisible('#screen-result'), sName + ' ' + sPct);
  check('학생 라벨', (await page.locator('#result-label').innerText()) === '나와 가장 잘 맞는 학교');
  check('학생 축 라벨', (await page.locator('#axis-label').innerText()) === '내 성향 축');
  check('학부모 전용 블록 숨김', await page.locator('#parent-facts-block').isHidden());
  const sHead = await page.locator('#detail-block .detail-head').last().innerText();
  check('학생용 해설 제목', sHead === '이런 사람이 잘 맞아요', sHead);
  const sUrl = page.url();
  check('학생 해시 s', /#r=v3\.s/.test(sUrl), sUrl.split('#')[1]);
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, 'shot-3-result-student.png'), fullPage: true });

  // ── 학부모 모드 ───────────────────────────────────────────
  console.log('\n=== 학부모 모드 ===');
  const pp = await newPage();
  await pp.goto(BASE + '/index.html');
  await pp.click('#mode-parent');
  await pp.waitForSelector('#screen-quiz:not(.hidden)');
  const pQ1 = await pp.locator('#question-text').innerText();
  check('학부모용 문항 (아이 주어)', pQ1.includes('아이'), '"' + pQ1 + '"');
  check('진행률 라벨에 학부모 표시', (await pp.locator('#quiz-mode-label').innerText()).includes('학부모'));
  const pNote = await pp.locator('#progress-note').innerText();
  check('학부모용 안내문', pNote.includes('아이를 떠올리'), '"' + pNote.slice(0, 24) + '…"');
  const pOpt = await pp.locator('#options .option').first().innerText();
  check('학부모용 선택지 존댓말', /습니다|해요|합니다/.test(pOpt), '"' + pOpt.trim() + '"');
  await pp.locator('#options .option').nth(0).click();
  await pp.screenshot({ path: path.join(OUT, 'shot-2-quiz-parent.png'), fullPage: true });

  await runQuiz(pp, i => i % 4);
  const pName = await pp.locator('#result-name').innerText();
  const pPct = await pp.locator('#result-percent').innerText();
  check('학부모 결과 도달', await pp.isVisible('#screen-result'), pName + ' ' + pPct);
  check('같은 답 → 같은 학교', pName === sName, pName + ' vs ' + sName);
  check('같은 답 → 같은 퍼센트', pPct === sPct, pPct + ' vs ' + sPct);
  check('학부모 라벨', (await pp.locator('#result-label').innerText()) === '아이와 가장 잘 맞는 학교');
  check('학부모 축 라벨', (await pp.locator('#axis-label').innerText()) === '아이의 성향 축');
  const pHead = await pp.locator('#detail-block .detail-head').last().innerText();
  check('학부모용 해설 제목', pHead === '이런 아이가 잘 맞아요', pHead);

  check('학부모 전용 블록 표시', await pp.locator('#parent-facts-block').isVisible());
  const dts = await pp.locator('#parent-facts dt').allInnerTexts();
  check('현실 조건 3항목', dts.length === 3, dts.join(' / '));
  const aidText = await pp.locator('#parent-facts dd').first().innerText();
  check('재정지원 문구 존재', /need-blind|need-aware/.test(aidText), '"' + aidText.slice(0, 40) + '…"');
  const pUrl = pp.url();
  check('학부모 해시 p', /#r=v3\.p/.test(pUrl), pUrl.split('#')[1]);
  await pp.waitForTimeout(900);
  await pp.screenshot({ path: path.join(OUT, 'shot-3-result-parent.png'), fullPage: true });

  // 학부모 모드 재정지원 문구가 need-blind 4곳 / need-aware 4곳으로 맞는지
  console.log('\n=== 학교 홈페이지 링크 ===');
  const heroLink = await pp.locator('#result-name a').first();
  check('1위 이름이 링크', (await heroLink.count()) === 1 ||
    (await pp.locator('#result-name a').count()) === 1);
  const href = await pp.locator('#result-name a').getAttribute('href');
  const tgt = await pp.locator('#result-name a').getAttribute('target');
  const rel = await pp.locator('#result-name a').getAttribute('rel');
  check('링크가 .edu 절대주소', /^https:\/\/www\.[a-z]+\.edu\/$/.test(href), href);
  check('새 탭으로 열림', tgt === '_blank', String(tgt));
  check('rel 에 noopener', /noopener/.test(rel || '') && /noreferrer/.test(rel || ''), String(rel));
  const rankLinks = await pp.locator('#ranking a.school-link').count();
  check('순위 3곳 모두 링크', rankLinks === 3, rankLinks + '개');
  const allUrls = await pp.evaluate(() => SCHOOLS.map(s => s.id + '=' + s.url));
  const missing = await pp.evaluate(() => SCHOOLS.filter(s => !/^https:\/\//.test(s.url || '')).map(s => s.id));
  check('8곳 모두 url 보유', missing.length === 0, missing.join(',') || allUrls.length + '곳');
  const extMark = await pp.locator('#result-name a .ext').innerText();
  check('바깥 링크 표시', extMark === '↗', extMark);

  console.log('\n=== 헤더 ===');
  const hdr = await pp.evaluate(() => {
    const h = document.querySelector('.site-header');
    const brand = document.querySelector('.brand').getBoundingClientRect();
    const inner = document.querySelector('.header-inner').getBoundingClientRect();
    const cs = getComputedStyle(h);
    const above = inner.top - brand.top === 0 ? 0 : brand.top - inner.top;
    return {
      bg: cs.backgroundColor,
      backdrop: cs.backdropFilter,
      above: Math.round(above),
      below: Math.round(inner.bottom - brand.bottom),
    };
  });
  check('헤더 배경 불투명', !/rgba|\/ 0\./.test(hdr.bg) || /\/ 1\)/.test(hdr.bg), hdr.bg);
  check('backdrop-filter 없음', hdr.backdrop === 'none', hdr.backdrop);
  check('브랜드 세로 중앙', Math.abs(hdr.above - hdr.below) <= 1,
    '위 ' + hdr.above + 'px / 아래 ' + hdr.below + 'px');

  console.log('\n=== 재정지원 정보 정확성 ===');
  const aid = await pp.evaluate(() => SCHOOLS.map(s => ({
    id: s.id, blind: /need-blind/.test(s.forParents.aid), aware: /need-aware/.test(s.forParents.aid),
  })));
  const blind = aid.filter(a => a.blind).map(a => a.id).sort();
  const aware = aid.filter(a => a.aware).map(a => a.id).sort();
  // 브라운은 Class of 2029(2025년 가을 입학)부터 국제학생 need-blind 로 전환했다.
  // 2024-01 발표, 1억 2천만 달러 모금 완료 후 시행. 그래서 5곳 / 3곳이다.
  check('need-blind 5곳', blind.join(',') === 'brown,dartmouth,harvard,princeton,yale', blind.join(','));
  check('need-aware 3곳', aware.join(',') === 'columbia,cornell,penn', aware.join(','));
  // 코넬 학부 지원 단위는 Brooks School of Public Policy 신설로 8개다
  const cornellK = await pp.evaluate(() => SCHOOLS_BY_ID.cornell.keywords.join(','));
  check('코넬 단과대 8개', cornellK.includes('8개 단과대'), cornellK);

  // ── 공유 링크가 모드까지 재현하는지 ───────────────────────
  console.log('\n=== 공유 링크 왕복 (모드 보존) ===');
  for (const [tag, url, wantMode, wantName] of [
    ['학생', sUrl, '나와 가장 잘 맞는 학교', sName],
    ['학부모', pUrl, '아이와 가장 잘 맞는 학교', pName],
  ]) {
    const sp = await newPage();
    await sp.goto(url);
    await sp.waitForSelector('#screen-result:not(.hidden)', { timeout: 6000 });
    check(tag + ' 링크 → 결과 직행', await sp.isVisible('#screen-result'));
    check(tag + ' 링크가 모드 보존', (await sp.locator('#result-label').innerText()) === wantMode);
    check(tag + ' 링크가 학교 재현', (await sp.locator('#result-name').innerText()) === wantName);
    await sp.context().close();
  }

  console.log('\n=== 예전 버전(v1) 링크 처리 ===');
  const p3 = await newPage();
  await p3.goto(BASE + '/index.html#r=v2.GxsbGxAq');
  await p3.waitForSelector('#screen-intro:not(.hidden)');
  const notice = await p3.locator('#boot-notice').innerText().catch(() => '');
  check('예전 버전 안내', notice.includes('예전 버전'), '"' + notice + '"');
  check('예전 버전으로 결과 안 보임', await p3.locator('#screen-result').isHidden());
  await p3.context().close();

  console.log('\n=== 이어서 하기 (모드 기억) ===');
  const p4 = await newPage();
  await p4.goto(BASE + '/index.html');
  await p4.click('#mode-parent');
  for (let i = 0; i < 5; i++) {
    await p4.locator('#options .option').nth(1).click();
    await p4.click('#btn-next');
    await p4.waitForFunction(n => document.getElementById('q-index').textContent === String(n), i + 2);
  }
  await p4.goto(BASE + '/index.html');
  await p4.waitForSelector('#screen-intro:not(.hidden)');
  const resumeText = await p4.locator('#btn-resume').innerText();
  check('이어서 하기에 모드 표시', resumeText.includes('학부모'), resumeText);
  await p4.click('#btn-resume');
  await p4.waitForSelector('#screen-quiz:not(.hidden)');
  check('복원 위치', (await p4.locator('#q-index').innerText()) === '6');
  check('복원 후에도 학부모 모드', (await p4.locator('#question-text').innerText()).includes('아이'));
  await p4.context().close();

  console.log('\n=== 이미지 저장 ===');
  for (const [tag, target] of [['학생', page], ['학부모', pp]]) {
    const dl = target.waitForEvent('download', { timeout: 9000 }).catch(() => null);
    await target.click('#btn-image');
    const d = await dl;
    check(tag + ' PNG 다운로드', !!d, d ? d.suggestedFilename() : '(없음)');
    if (d) {
      const f = path.join(OUT, 'card-' + (tag === '학생' ? 'student' : 'parent') + '.png');
      await d.saveAs(f);
      check(tag + ' PNG 크기', require('fs').statSync(f).size > 20000,
        (require('fs').statSync(f).size / 1024).toFixed(0) + 'KB');
      // 카드 문구가 모드에 맞는지 (캔버스라 픽셀은 못 읽으니 그린 값으로 확인)
      const cardCopy = await target.evaluate(m => ({
        lead: MODE_COPY[m].cardLead,
        tag: MODE_COPY[m].taglineOf(SCHOOLS_BY_ID[
          document.querySelector('#result-name').textContent === '유펜' ? 'penn' : 'cornell']),
      }), tag === '학생' ? 'student' : 'parent');
      check(tag + ' 카드 문구 모드 일치',
        tag === '학생' ? cardCopy.lead.includes('나랑') : cardCopy.lead.includes('아이'),
        cardCopy.lead + ' / ' + cardCopy.tag);
    }
  }

  console.log('\n=== 접근성 · 레이아웃 ===');
  const p5 = await newPage();
  await p5.goto(BASE + '/index.html');
  await p5.click('#mode-student');
  await p5.locator('#options input[type=radio]').first().focus();
  await p5.keyboard.press('ArrowDown');
  const idx = await p5.evaluate(() =>
    Array.from(document.querySelectorAll('#options input')).findIndex(i => i.checked));
  check('방향키 선택 이동', idx === 1, 'index=' + idx);
  await p5.keyboard.press('Enter');
  await p5.waitForFunction(() => document.getElementById('q-index').textContent === '2');
  check('Enter 로 다음', true);
  await p5.context().close();

  const overflow = await pp.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('가로 스크롤 없음', overflow <= 0, 'overflow=' + overflow + 'px');

  console.log('\n=== file:// 로 열기 (두 모드) ===');
  const p6 = await newPage();
  const fileErrors = [];
  p6.on('pageerror', e => fileErrors.push(e.message));
  await p6.goto('file://' + APP + '/index.html');
  await p6.waitForSelector('#screen-intro:not(.hidden)', { timeout: 6000 });
  await p6.click('#mode-parent');
  await runQuiz(p6, i => (i * 3) % 4);
  check('file:// 학부모 완주', await p6.isVisible('#screen-result'),
    await p6.locator('#result-name').innerText());
  check('file:// 학부모 블록 표시', await p6.locator('#parent-facts-block').isVisible());
  check('file:// JS 에러 없음', fileErrors.length === 0, fileErrors.join(' | '));
  await p6.context().close();

  console.log('\n=== 콘솔 에러 ===');
  check('JS 에러 없음', errors.length === 0, errors.slice(0, 4).join(' | '));

  await browser.close();
  console.log('\n' + '='.repeat(58));
  if (fails.length) {
    console.log('실패 ' + fails.length + '건:');
    fails.forEach(f => console.log('  - ' + f));
    process.exit(1);
  }
  console.log('두 모드 전부 통과');
})();
