/**
 * 결과 이미지(canvas)를 실제로 그려서 PNG 로 뽑는다.
 *
 * 카드는 화면이 아니라 canvas 에 좌표로 그리기 때문에, 코드만 읽어서는
 * 블록이 겹쳤는지 안 겹쳤는지 알 수가 없다. 눈으로 보려고 만든 스크립트다.
 *
 *   node scripts/e2e/card-shot.js            아이비 · 학생
 *   TEST=korea MODE=parent node scripts/e2e/card-shot.js
 *
 * 태그라인이 두 줄인 학교가 제일 빡빡하다. TAG=2 로 그런 학교를 고른다.
 */
const { chromium } = require('playwright');
const path = require('path');
const os = require('os');

const BASE = process.env.BASE || 'http://127.0.0.1:8765';
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = process.env.SHOT_DIR || os.tmpdir();
const TEST = process.env.TEST || 'ivy';
const MODE = process.env.MODE || 'student';
const PATTERN = process.env.PATTERN || '0';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  const url = TEST === 'korea' ? '/korea-uni/index.html' : '/index.html';
  await page.goto(BASE + url);
  await page.waitForFunction(() => typeof renderResultCard === 'function');
  await page.evaluate(() => document.fonts.ready);

  // 앱 화면을 거치지 않고 점수 엔진만 직접 돌린다. 카드 그림만 보면 되니까.
  const pick = Number(PATTERN);
  const out = await page.evaluate(({ mode, pick }) => {
    const answers = QUESTIONS.map((q, i) => Math.min(q.options.length - 1, (pick + i) % 4));
    const result = scoreAnswers(answers);
    const c = MODE_COPY[mode];
    const cv = document.createElement('canvas');
    cv.width = 1080; cv.height = 1350;
    renderResultCard(cv, result, c);
    return {
      png: cv.toDataURL('image/png'),
      top: result.top3[0].school.nameKo,
      tagline: (c.taglineOf ? c.taglineOf(result.top3[0].school) : result.top3[0].school.tagline),
      reasons: result.reasons.map(r => r.label),
      evidence: result.reasons.map(r => c.evidenceOf ? c.evidenceOf(r.evidence, r.label) : ''),
    };
  }, { mode: MODE, pick });

  const file = path.join(OUT, `card-${TEST}-${MODE}-${PATTERN}.png`);
  require('fs').writeFileSync(file, Buffer.from(out.png.split(',')[1], 'base64'));
  console.log('1위      ' + out.top);
  console.log('태그라인  ' + out.tagline);
  console.log('성향      ' + out.reasons.join(' · '));
  out.evidence.filter(Boolean).forEach(e => console.log('근거      ' + e));
  if (errors.length) console.log('에러      ' + errors.join(' | '));
  console.log(file);
  await browser.close();
})();
