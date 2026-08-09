#!/usr/bin/env node
/**
 * 매칭 엔진 검증 스크립트  (실행: node scripts/check-reachability.js)
 *
 * 이 테스트는 앱 번들에 포함되지 않는다. 질문이나 학교 벡터를 고쳤을 때
 * 매칭이 여전히 멀쩡한지 확인하는 용도다.
 *
 * 확인 항목
 *  1) 도달성   무작위 답안지에서 8개교가 모두 1위로 나오는가
 *              (3% 미만이면 사실상 도달 불가, 30% 초과면 특정 학교 독식)
 *  2) 타당성   각 학교를 겨냥해서 답하면 실제로 그 학교가 1위인가  ← 가장 중요
 *  3) 보정     cos_top / decisiveness 의 실제 분포가 scoring.js 의
 *              COS_LO~COS_HI, DEC_LO~DEC_HI 구간과 맞는가
 *  4) 엣지     답이 완전히 상쇄된 경우(u=0) 알파벳 순서로 쏠리지 않는가
 */

var path = require('path');
function load(p) { return require(path.join(__dirname, '..', p)); }

// scoring.js 는 브라우저 전역을 그대로 참조한다. node 에서도 같게 만들어준다.
var axes = load('js/data/axes.js');
var schools = load('js/data/schools.js');
var questions = load('js/data/questions.js');
global.AXES = axes.AXES;
global.AXIS_IDS = axes.AXIS_IDS;
global.SCHOOLS = schools.SCHOOLS;
global.SCHOOLS_BY_ID = schools.SCHOOLS_BY_ID;
global.QUESTIONS = questions.QUESTIONS;

var scoring = load('js/scoring.js');
var scoreAnswers = scoring.scoreAnswers;
var CENTERED = scoring.CENTERED;
var CALIB = scoring.CALIB;

var Q = questions.QUESTIONS;
var IDS = schools.SCHOOLS.map(function (s) { return s.id; });
var N = 40000;

// 재현 가능한 난수 (Math.random 을 쓰면 돌릴 때마다 결과가 달라져서 비교가 안 됨)
var seed = 20260809;
function rand() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

function pct(x) { return (x * 100).toFixed(1); }
function quantile(sorted, p) { return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]; }

var fail = [];

/* ── 1) 도달성 + 3) 분포 ───────────────────────────────────── */
var wins = {}; IDS.forEach(function (id) { wins[id] = 0; });
var cosList = [], decList = [], p1List = [];
var monotonic = 0;

for (var n = 0; n < N; n++) {
  var ans = Q.map(function () { return Math.floor(rand() * 4); });
  var r = scoreAnswers(ans);
  wins[r.ranked[0].id]++;
  cosList.push(r.ranked[0].cos);
  decList.push(r.decisiveness);
  p1List.push(r.top3[0].percent);
  if (r.top3[0].percent > r.top3[1].percent && r.top3[1].percent > r.top3[2].percent) monotonic++;
}

console.log('\n=== 1) 도달성: 무작위 답안지 ' + N.toLocaleString() + '장의 1위 점유율 ===');
console.log('   (이상적 균등값 12.5% / 경고 기준: 3% 미만 또는 30% 초과)\n');
IDS.map(function (id) { return [id, wins[id] / N]; })
  .sort(function (a, b) { return b[1] - a[1]; })
  .forEach(function (row) {
    var flag = row[1] < 0.03 ? '  << 도달 불가' : row[1] > 0.30 ? '  << 독식' : '';
    if (flag) fail.push('도달성: ' + row[0] + ' ' + pct(row[1]) + '%');
    var bar = '#'.repeat(Math.round(row[1] * 200));
    console.log('   ' + row[0].padEnd(10) + (pct(row[1]) + '%').padStart(6) + '  ' + bar + flag);
  });

cosList.sort(function (a, b) { return a - b; });
decList.sort(function (a, b) { return a - b; });
p1List.sort(function (a, b) { return a - b; });

console.log('\n=== 3) 보정용 실제 분포 ===\n');
console.log('   cos_top       p05=' + quantile(cosList, 0.05).toFixed(3) +
            '  중앙=' + quantile(cosList, 0.5).toFixed(3) +
            '  p95=' + quantile(cosList, 0.95).toFixed(3) +
            '   (scoring.js 설정: ' + CALIB.COS_LO + ' ~ ' + CALIB.COS_HI + ')');
console.log('   decisiveness  p05=' + quantile(decList, 0.05).toFixed(3) +
            '  중앙=' + quantile(decList, 0.5).toFixed(3) +
            '  p95=' + quantile(decList, 0.95).toFixed(3) +
            '   (scoring.js 설정: ' + CALIB.DEC_LO + ' ~ ' + CALIB.DEC_HI + ')');
console.log('   1위 퍼센트    최소=' + p1List[0] +
            '  p25=' + quantile(p1List, 0.25) +
            '  중앙=' + quantile(p1List, 0.5) +
            '  p75=' + quantile(p1List, 0.75) +
            '  최대=' + p1List[p1List.length - 1] +
            '   (목표 구간: ' + CALIB.P_MIN + ' ~ ' + (CALIB.P_MIN + CALIB.P_RANGE) + ')');
console.log('   단조성 P1>P2>P3: ' + pct(monotonic / N) + '%');

/* ── 1-b) 현실적인 사용자 시뮬레이션 ───────────────────────────
 * 무작위 답안지는 실제 사용자를 잘 대변하지 못한다. 진짜 사람은 속으로
 * 어떤 성향을 갖고 있고 그 성향에 가까운 선택지를 (가끔 흔들리면서)
 * 고른다. 잠재 성향 벡터를 하나 뽑고 거기에 노이즈를 섞어 답하게 해서
 * 실제 서비스에서 나올 분포에 더 가깝게 본다.
 */
function gauss() {
  var s = 0;
  for (var i = 0; i < 6; i++) s += rand();
  return s - 3;
}

var realWins = {}; IDS.forEach(function (id) { realWins[id] = 0; });
var realP1 = [];
var NOISE = 1.1; // 클수록 변덕스러운 응답자

for (var m = 0; m < N; m++) {
  var latent = axes.AXIS_IDS.map(function () { return gauss(); });
  var ans2 = Q.map(function (q) {
    var bestIdx = 0, bestScore = -Infinity;
    q.options.forEach(function (o, i) {
      var s = 0;
      Object.keys(o.weights).forEach(function (id) {
        var k = axes.AXIS_IDS.indexOf(id);
        if (k >= 0) s += o.weights[id] * latent[k];
      });
      s += gauss() * NOISE;
      if (s > bestScore) { bestScore = s; bestIdx = i; }
    });
    return bestIdx;
  });
  var r2 = scoreAnswers(ans2);
  realWins[r2.ranked[0].id]++;
  realP1.push(r2.top3[0].percent);
}

console.log('\n=== 1-b) 현실적 사용자 시뮬레이션 (일관되게 답하는 응답자) ===\n');
IDS.map(function (id) { return [id, realWins[id] / N]; })
  .sort(function (a, b) { return b[1] - a[1]; })
  .forEach(function (row) {
    var flag = row[1] < 0.03 ? '  << 도달 불가' : row[1] > 0.30 ? '  << 독식' : '';
    if (flag) fail.push('현실 시뮬: ' + row[0] + ' ' + pct(row[1]) + '%');
    console.log('   ' + row[0].padEnd(10) + (pct(row[1]) + '%').padStart(6) + '  ' + '#'.repeat(Math.round(row[1] * 200)) + flag);
  });
realP1.sort(function (a, b) { return a - b; });
console.log('\n   1위 퍼센트    최소=' + realP1[0] + '  p25=' + quantile(realP1, 0.25) +
            '  중앙=' + quantile(realP1, 0.5) + '  p75=' + quantile(realP1, 0.75) +
            '  최대=' + realP1[realP1.length - 1]);

if (monotonic !== N) fail.push('단조성이 깨진 케이스가 있음');

// 밴드를 실제로 다 쓰고 있는지 — 한쪽에 몰려 있으면 보정이 필요하다는 뜻
var spread = p1List[p1List.length - 1] - p1List[0];
if (spread < CALIB.P_RANGE * 0.6) {
  fail.push('1위 퍼센트가 ' + spread + '포인트 폭에만 몰림 — DEC_LO/DEC_HI 재보정 필요');
}

/* ── 2) 타당성: 의도적으로 특정 학교를 겨냥해서 답하기 ─────── */
console.log('\n=== 2) 타당성: 각 학교를 겨냥해 답했을 때 그 학교가 1위인가 ===\n');

var centeredById = {};
CENTERED.forEach(function (c) { centeredById[c.id] = c.vec; });

IDS.forEach(function (target) {
  var t = centeredById[target];
  // 각 문항에서 목표 학교 벡터와 내적이 가장 큰 선택지를 고른다
  var ans = Q.map(function (q) {
    var bestIdx = 0, bestScore = -Infinity;
    q.options.forEach(function (o, i) {
      var s = 0;
      Object.keys(o.weights).forEach(function (id) {
        var k = axes.AXIS_IDS.indexOf(id);
        if (k >= 0) s += o.weights[id] * t[k];
      });
      if (s > bestScore) { bestScore = s; bestIdx = i; }
    });
    return bestIdx;
  });

  var r = scoreAnswers(ans);
  var ok = r.ranked[0].id === target;
  if (!ok) fail.push('타당성: ' + target + ' 겨냥 -> ' + r.ranked[0].id + ' 이 1위로 나옴');
  console.log('   ' + target.padEnd(10) + (ok ? 'OK ' : '실패 ') +
    r.top3.map(function (x) { return x.id + ' ' + x.percent + '%'; }).join('  >  '));
});

/* ── 4) 엣지 케이스 ────────────────────────────────────────── */
console.log('\n=== 4) 엣지 케이스 ===\n');

[['모두 A', 0], ['모두 B', 1], ['모두 C', 2], ['모두 D', 3]].forEach(function (c) {
  var r = scoreAnswers(Q.map(function () { return c[1]; }));
  console.log('   ' + c[0].padEnd(8) + r.top3.map(function (x) { return x.school.nameKo + ' ' + x.percent + '%'; }).join('  '));
});

var alt = Q.map(function (_, i) { return i % 4; });
var rAlt = scoreAnswers(alt);
console.log('   ' + '번갈아'.padEnd(8) + rAlt.top3.map(function (x) { return x.school.nameKo + ' ' + x.percent + '%'; }).join('  '));

// u=0 동점 상황: 답변만 달라도 1위가 달라져야 한다(선언 순서 고정 = 실패)
var flatWinners = {};
for (var t = 0; t < 400; t++) {
  var a = Q.map(function () { return Math.floor(rand() * 4); });
  var rr = scoreAnswers(a);
  if (rr.isFlat) flatWinners[rr.ranked[0].id] = (flatWinners[rr.ranked[0].id] || 0) + 1;
}
var flatKeys = Object.keys(flatWinners);
console.log('   u≈0(성향 상쇄) 케이스에서 1위가 된 학교 종류: ' +
  (flatKeys.length ? flatKeys.length + '개 ' + JSON.stringify(flatWinners) : '샘플 없음(정상 — 극히 드문 경우)'));

var unanswered = scoreAnswers(Q.map(function () { return null; }));
console.log('   전부 미응답 -> isFlat=' + unanswered.isFlat + ', 1위=' + unanswered.ranked[0].id +
  ' (앱에서는 이 상태로 결과 화면에 도달할 수 없어야 함)');

/* ── 결과 ──────────────────────────────────────────────────── */
console.log('\n' + '='.repeat(62));
if (fail.length) {
  console.log('실패 ' + fail.length + '건:');
  fail.forEach(function (f) { console.log('  - ' + f); });
  process.exit(1);
}
console.log('전부 통과');
process.exit(0);
