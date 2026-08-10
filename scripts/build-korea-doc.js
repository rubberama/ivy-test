var fs = require('fs');
var T = '/tmp/claude-0/-home-user-aidatalab-invest-atlanta-g7/a1e03cbb-fc4e-5885-b81a-24f94d799f6e/tasks/w7nakykph.output';
var raw = fs.readFileSync(T, 'utf8');
var R = JSON.parse(raw.slice(raw.indexOf('{'))).result;

var out = [];
function w(s) { out.push(s === undefined ? '' : s); }
function esc(s) { return String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim(); }

var AX = R.design.axes;
var AXID = AX.map(function (a) { return a.id; });

w('# 한국 대학 TOP 30 — 성향 매칭 테스트 리서치');
w('');
w('아이비리그 버전(`/`)과 같은 틀로 한국 대학 버전(`/korea-uni`)을 만들기 위한 사전 조사 문서다.');
w('서브에이전트 15개가 학교를 나눠 조사하고, 별도 에이전트가 사실을 검증하고, 마지막에 축과 문항을');
w('설계했다. **아직 코드로 옮기지 않았다.** 이 문서는 그 전에 무엇이 확인됐고 무엇이 안 됐는지를 남긴 것이다.');
w('');
w('> **먼저 읽을 것:** 30개 학교 레코드 중 15곳은 웹 접근이 막힌 상태에서 모델 내부 지식만으로');
w('> 작성됐다고 조사 에이전트가 스스로 밝혔다. 검증 단계에서 사실 오류 ' + R.issues.length + '건이 나왔고');
w('> 아직 반영하지 않았다. 축 값도 일부는 근거 없이 통념으로 매겨져 있다.');
w('> **이 문서의 숫자를 그대로 코드에 옮기면 안 된다.** 아래 "배포 전 반드시 할 일"을 먼저 보라.');
w('');
w('---');
w('');

/* ── 1. 선정 ───────────────────────────────────────── */
w('## 1. 30곳을 어떻게 골랐나');
w('');
w('“TOP 30”은 단일 랭킹이 아니다. 국내에 합의된 대학 서열표가 없고, 있다 해도 이건 서열 테스트가');
w('아니라 성향 매칭이라 **서로 다른 성향 축을 대표하는 30곳**이 필요했다. 랭킹(QS·THE·ARWU·중앙일보)으로');
w('후보를 넓게 잡은 뒤, 성향이 겹치는 곳을 덜어내고 축이 비는 곳을 채우는 방식으로 골랐다.');
w('');
w('| # | 학교 | 선정 근거 |');
w('|---|---|---|');
R.list.schools.forEach(function (s, i) {
  w('| ' + (i + 1) + ' | **' + esc(s.nameKo) + '** | ' + esc(s.reason) + ' |');
});
w('');
w('### 출처와 시점, 그리고 데이터의 함정');
w('');
R.list.notes.split('\n').forEach(function (line) {
  var t = line.trim();
  if (!t) { w(''); return; }
  if (/^\[.*\]$/.test(t)) { w('#### ' + t.replace(/^\[|\]$/g, '')); w(''); return; }
  w(t.replace(/^- /, '- '));
});
w('');
w('---');
w('');

/* ── 2. 학교 카드 ──────────────────────────────────── */
w('## 2. 학교별 조사 결과');
w('');
w('각 학교의 `axes` 는 아래 3장에서 정의한 11개 축의 값(−2 ~ +2)이다.');
w('`불확실` 항목은 조사 에이전트가 스스로 “확인하지 못했다”고 표시한 것이다.');
w('');
R.schools.forEach(function (s, i) {
  w('### ' + (i + 1) + '. ' + s.nameKo + ' — ' + (s.nameEn || ''));
  w('');
  if (s.nameFull && s.nameFull !== s.nameKo) w('**' + s.nameFull + '**  ');
  w('' + (s.url ? '<' + s.url + '>' : '') + (s.type ? ' · ' + s.type : ''));
  w('');
  if (s.location) { w('- **위치** ' + s.location); }
  if (s.undergrad) { w('- **학부 규모** ' + s.undergrad); }
  if (s.color) { w('- **상징색(추정)** `' + s.color + '`'); }
  w('');
  if (s.strengths && s.strengths.length) {
    w('**강한 분야**');
    w('');
    s.strengths.forEach(function (x) { w('- ' + x); });
    w('');
  }
  if (s.signature && s.signature.length) {
    w('**이 학교만의 것**');
    w('');
    s.signature.forEach(function (x) { w('- ' + x); });
    w('');
  }
  if (s.vibe) { w('**분위기**  '); w(s.vibe); w(''); }
  if (s.careerNote) { w('**졸업 후**  '); w(s.careerNote); w(''); }
  if (s.costNote) { w('**비용**  '); w(s.costNote); w(''); }
  if (s.axes) {
    w('**성향 축**');
    w('');
    w('| ' + AXID.join(' | ') + ' |');
    w('|' + AXID.map(function () { return '---'; }).join('|') + '|');
    w('| ' + AXID.map(function (id) {
      var v = s.axes[id];
      return v === undefined ? '·' : (v > 0 ? '+' : '') + v;
    }).join(' | ') + ' |');
    w('');
  }
  if (s.axisJustification) { w('<details><summary>축 값 근거</summary>'); w(''); w(s.axisJustification); w(''); w('</details>'); w(''); }
  if (s.axes_note) { w('> 축 메모: ' + s.axes_note); w(''); }
  if (s.uncertain && String(s.uncertain).trim()) { w('> **불확실** ' + s.uncertain); w(''); }
  if (s.sources) {
    var src = Array.isArray(s.sources) ? s.sources : [s.sources];
    if (src.length) { w('<details><summary>출처</summary>'); w(''); src.forEach(function (x) { w('- ' + x); }); w(''); w('</details>'); w(''); }
  }
  w('---');
  w('');
});

/* ── 3. 축 ────────────────────────────────────────── */
w('## 3. 성향 축 설계');
w('');
w('아이비 버전은 축이 7개였다. 한국 버전은 **11개**다. 학교 수가 8곳에서 30곳으로 늘면서');
w('축이 부족하면 여러 학교가 벡터 공간에서 같은 자리에 겹쳐 결과가 뭉개지기 때문이다.');
w('조사 단계에서 쓰던 8축을 그대로 두면 과기원 4곳이 코사인 0.97~0.99로 사실상 한 학교가 됐다.');
w('');
w('그래서 세 가지를 했다. 기존 축 중 두 가지가 섞여 있던 것을 쪼개고(`culture` → `bond` + `legacy`),');
w('30곳을 가르는 데 필요한 축을 새로 넣고(`immersion`, `making`), 축 이름에 우열이 실리지 않게 다시 지었다.');
w('');
AX.forEach(function (a, i) {
  w('### ' + (i + 1) + '. `' + a.id + '` — ' + a.name.replace(/\s+—\s+/, ': '));
  w('');
  w('| | |');
  w('|---|---|');
  w('| **−2 쪽** (`' + esc(a.negShort) + '`) | ' + esc(a.neg) + ' |');
  w('| **+2 쪽** (`' + esc(a.posShort) + '`) | ' + esc(a.pos) + ' |');
  w('');
  if (a.rationale) { w('**왜 이 축인가**  '); w(a.rationale); w(''); }
  if (a.discriminates) { w('**무엇을 가르나**  '); w(a.discriminates); w(''); }
});
w('---');
w('');

/* ── 4. 문항 ──────────────────────────────────────── */
w('## 4. 20문항 설계안');
w('');
w('아이비 버전은 18문항 · 7축이라 축당 2~3문항이었다. 한국 버전은 20문항 · 11축(비용 축 제외 시 10축)이라');
w('축당 2문항이 기본이고, 판별력이 큰 축에만 3문항을 준다. 각 문항은 주축 하나를 −2/−1/+1/+2 로 훑고');
w('보조축을 ±1 로 얹는다 — 아이비 버전과 같은 구조라 채점 엔진(`js/scoring.js`)을 그대로 쓸 수 있다.');
w('');
w('아래는 초안이다. 말투는 아이비 버전과 맞춰 **해요체**로 다시 써야 한다(초안은 반말로 적혀 있다).');
w('');
var cnt = {};
R.design.questionPlan.forEach(function (q) { cnt[q.primary] = (cnt[q.primary] || 0) + 1; });
w('**주축 배분** — ' + Object.keys(cnt).map(function (k) { return '`' + k + '` ' + cnt[k]; }).join(' · ') + '  (합계 ' + R.design.questionPlan.length + ')');
w('');
R.design.questionPlan.forEach(function (q) {
  w('#### Q' + q.n + ' — ' + q.theme);
  w('');
  w('주축 `' + q.primary + '`' + (q.secondary ? ' · 보조축 `' + q.secondary + '`' : ''));
  w('');
  var d = String(q.draft || '');
  var parts = d.split(' / ');
  w('> ' + parts[0]);
  w('');
  parts.slice(1).join(' / ').split(/\s*(?=\([A-D]\))/).filter(Boolean).forEach(function (opt) {
    w('- ' + opt.trim());
  });
  w('');
});
w('---');
w('');

/* ── 5. 군집 ──────────────────────────────────────── */
w('## 5. 서로 구별되지 않는 학교들');
w('');
w('11축으로 재산정해도 코사인이 0.86 이상으로 붙어 있는 묶음이 남는다.');
w('이건 데이터 오류가 아니라 **실제로 성향이 같은 것**이다. 축을 더 넣는 걸로는 안 갈린다.');
w('');
(R.design.clusters || []).forEach(function (c, i) {
  w('### ' + (i + 1) + '. ' + (c.schools || []).join(' · '));
  w('');
  if (c.why) { w('**왜 붙는가**  '); w(c.why); w(''); }
  if (c.fix) { w('**처방**  '); w(c.fix); w(''); }
});
w('---');
w('');

/* ── 6. 사실 오류 ─────────────────────────────────── */
w('## 6. 검증에서 나온 사실 오류 (' + R.issues.length + '건, 미반영)');
w('');
w('별도 검증 에이전트가 조사 결과를 훑어 찾아낸 것이다. **아직 위 학교 카드에 반영하지 않았다.**');
w('코드로 옮기기 전에 하나씩 확인해서 고쳐야 한다.');
w('');
var byId = {};
R.issues.forEach(function (x) { (byId[x.id] = byId[x.id] || []).push(x); });
Object.keys(byId).forEach(function (id) {
  var s = R.schools.filter(function (x) { return x.id === id; })[0];
  w('### ' + (s ? s.nameKo : id) + ' (' + byId[id].length + '건)');
  w('');
  byId[id].forEach(function (x) {
    w('- **`' + x.field + '`** — ' + x.problem);
    if (x.correction) w('  - *고칠 것:* ' + x.correction);
  });
  w('');
});
w('---');
w('');

/* ── 7. 리스크 ────────────────────────────────────── */
w('## 7. 배포 전 반드시 할 일');
w('');
w('설계 에이전트가 남긴 위험 목록이다. 아이비 버전에는 없던 문제가 여럿 있다 —');
w('학교가 30곳이고, 한국 대학은 서열 담론이 강하고, 이원화 캠퍼스와 여대·실기 입시 같은');
w('하드 필터가 존재하기 때문이다.');
w('');
(R.design.risks || []).forEach(function (r, i) {
  var t = String(r).trim();
  var head = t.split(/(?<=[.다])\s/)[0].replace(/[.:]$/, '');
  w('### ' + (i + 1) + '. ' + head);
  w('');
  w(t.slice(head.length).replace(/^[.\s]+/, ''));
  w('');
});
w('---');
w('');
w('## 8. 다음 단계');
w('');
w('1. 6장의 사실 오류 ' + R.issues.length + '건을 공식 자료로 확인해 고친다. 특히 축 산정에 직접 쓰이는 항목');
w('   (학부 인원, 무전공 규모와 선택 제한, 캠퍼스 배치, 등록금, 진학/취업 방향)이 우선이다.');
w('2. 축 산정 기준을 축마다 명문화하고 30곳에 일괄 재적용한다. 지금은 값이 근거보다 먼저 정해진');
w('   흔적이 있다(인하 vs 충남 `scale` 역전, 홍익 `openness` 근거 오류).');
w('3. 하드 필터를 코사인 이전 단계에 넣는다 — 여대 2곳, 한예종 실기 트랙, 분교/이원화 캠퍼스.');
w('4. 20문항을 해요체로 다시 쓰고, 선택지 네 개의 사회적 매력도를 맞춘다.');
w('5. `scripts/check-reachability.js` 를 30곳 기준으로 돌려 도달 불가·독식 학교가 없는지 본다.');
w('   아이비 8곳일 때와 달리 30곳이면 균등값이 3.3%라 판정 기준부터 다시 잡아야 한다.');
w('6. `js/data/tuning.js` 를 한국 버전용으로 새로 뽑는다(`POPULATION_BIAS`, `SCHOOL_CALIB`).');
w('');
w('엔진(`js/scoring.js`)·화면(`styles.css`)·공유·결과 이미지는 아이비 버전 것을 그대로 쓴다.');
w('테스트별로 달라지는 건 `js/data/` 아래 데이터와 `TEST_ID` 뿐이다.');
w('');

fs.writeFileSync('/home/user/aidatalab_invest_atlanta_g7/docs/korea-top30.md', out.join('\n'));
console.log('wrote', out.join('\n').length, 'chars,', out.length, 'lines');
