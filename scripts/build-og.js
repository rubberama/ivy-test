#!/usr/bin/env node
/**
 * 링크 미리보기 카드 이미지 생성  (실행: node scripts/build-og.js)
 *
 * 카카오톡·인스타·트위터에 링크를 붙였을 때 뜨는 1200x630 이미지를 만든다.
 * og:image 는 크롤러가 직접 받아가야 해서 data URI 를 쓸 수 없다.
 * 절대 https 주소로 접근 가능한 진짜 파일이어야 하므로 PNG 로 저장해 커밋한다.
 *
 * 앱과 같은 디자인 토큰과 SUIT 서브셋을 그대로 써서 화면과 결이 맞게 만든다.
 *
 * 필요:  npm i -D playwright   (없으면 그냥 안내만 하고 끝난다)
 * 결과:  og.png
 */

var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var OUT = path.join(ROOT, 'og.png');

var W = 1200, H = 630;

var chromium;
try {
  chromium = require('playwright').chromium;
} catch (e) {
  console.error('playwright 가 없습니다.  npm i -D playwright  후 다시 실행하세요.');
  process.exit(1);
}

var suitCss = '';
try {
  suitCss = fs.readFileSync(path.join(ROOT, 'fonts', 'suit.css'), 'utf8');
} catch (e) {
  console.error('fonts/suit.css 가 없습니다. 먼저 python3 scripts/build-font.py 를 돌리세요.');
  process.exit(1);
}

// 앱 styles.css 와 같은 값. 여기 바꾸면 저기도 바꿀 것.
var HTML = `<!doctype html><meta charset="utf-8">
<style>
${suitCss}
:root{
  --paper:#f4f3ee; --card:#fffefb; --ink:#16302a; --ink-soft:#5b6b63;
  --ink-faint:#93a099; --rule:#ddddd4; --rule-soft:#e9e8e1;
  --ivy:#1f5b41; --brass:#a8823c;
  --sans:'SUIT',-apple-system,system-ui,sans-serif;
}
*{box-sizing:border-box;margin:0;padding:0}
body{
  width:${W}px;height:${H}px;background:var(--paper);
  font-family:var(--sans);color:var(--ink);
  word-break:keep-all;-webkit-font-smoothing:antialiased;
}
.frame{
  position:absolute;inset:26px;background:var(--card);
  border:1px solid var(--rule);
  display:grid;grid-template-columns:1fr 380px;
}
.frame::before{
  content:'';position:absolute;left:0;right:0;top:0;height:7px;
  background:linear-gradient(90deg,var(--ivy) 0 55%,var(--brass) 55% 100%);
}
.left{padding:52px 46px 44px;display:flex;flex-direction:column}
.brand{display:flex;align-items:baseline;gap:11px;margin-bottom:auto}
.mark{font-size:23px;font-weight:800;letter-spacing:.18em;color:var(--ivy);line-height:1}
.brand-sub{font-size:14px;font-weight:600;color:var(--ink-faint)}
.eyebrow{
  font-size:14px;font-weight:700;letter-spacing:.11em;
  text-transform:uppercase;color:var(--brass);margin-bottom:16px;
}
h1{
  font-size:60px;font-weight:800;line-height:1.24;letter-spacing:-.04em;
  margin-bottom:20px;
}
.sub{font-size:20px;line-height:1.6;color:var(--ink-soft);max-width:22em}
.meta{
  display:flex;gap:9px;margin-top:26px;flex-wrap:wrap;
}
.chip{
  border:1px solid var(--rule);border-radius:999px;
  padding:7px 15px;font-size:15px;font-weight:600;color:var(--ink-soft);
}
.right{
  border-left:1px solid var(--rule-soft);padding:52px 40px;
  display:flex;flex-direction:column;justify-content:center;gap:0;
}
.right-label{
  font-size:12px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;
  color:var(--brass);margin-bottom:16px;
}
.row{
  display:grid;grid-template-columns:auto 1fr auto;align-items:center;
  gap:10px;padding:13px 0;border-bottom:1px solid var(--rule-soft);
}
.row:first-of-type{border-top:1px solid var(--rule)}
.n{font-size:14px;color:var(--brass);font-weight:700}
.nm{font-size:19px;font-weight:700;letter-spacing:-.02em}
.pc{
  font-size:26px;font-weight:700;letter-spacing:-.03em;
  font-variant-numeric:tabular-nums;
}
.row.top .nm,.row.top .pc{color:#990000}
.bar{grid-column:1/-1;height:3px;background:var(--rule-soft);margin-top:9px}
.bar i{display:block;height:100%;background:var(--ink-faint)}
.row.top .bar i{background:#990000}
.foot{
  margin-top:22px;font-size:13px;color:var(--ink-faint);line-height:1.6;
}
</style>
<div class="frame">
  <div class="left">
    <div class="brand"><span class="mark">IVY</span><span class="brand-sub">성향 매칭</span></div>
    <p class="eyebrow">Which Ivy fits?</p>
    <h1>결이 맞는<br>아이비리그는 어디일까</h1>
    <p class="sub">성적이 아니라 <b>성향</b>으로 찾는 나와 맞는 학교 세 곳.</p>
    <div class="meta">
      <span class="chip">질문 18개</span>
      <span class="chip">약 2분</span>
      <span class="chip">학생 · 학부모</span>
    </div>
  </div>
  <div class="right">
    <p class="right-label">이렇게 나와요</p>
    <div class="row top"><span class="n">1</span><span class="nm">유펜</span><span class="pc">94%</span>
      <span class="bar"><i style="width:94%"></i></span></div>
    <div class="row"><span class="n">2</span><span class="nm">하버드</span><span class="pc">85%</span>
      <span class="bar"><i style="width:85%"></i></span></div>
    <div class="row"><span class="n">3</span><span class="nm">코넬</span><span class="pc">79%</span>
      <span class="bar"><i style="width:79%"></i></span></div>
    <p class="foot">재미로 보는 성향 매칭이에요<br>합격 가능성 예측이 아닙니다</p>
  </div>
</div>`;

(async function () {
  var exe = process.env.CHROME_PATH || undefined;
  var browser = await chromium.launch(exe ? { executablePath: exe } : {});
  var page = await browser.newPage({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
  });
  await page.setContent(HTML, { waitUntil: 'load' });
  await page.evaluate(function () { return document.fonts.ready; });
  await page.screenshot({ path: OUT });
  await browser.close();

  var kb = (fs.statSync(OUT).size / 1024).toFixed(0);
  console.log('og.png  ' + W + 'x' + H + '  ' + kb + 'KB');
  if (fs.statSync(OUT).size > 5 * 1024 * 1024) {
    console.log('경고: 5MB 가 넘으면 일부 메신저가 미리보기를 안 띄웁니다.');
  }
})();
