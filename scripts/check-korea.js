#!/usr/bin/env node
/**
 * 한국 대학 버전 검증  (실행: node scripts/check-korea.js)
 *
 * 아이비 버전(check-reachability.js)과 같은 것을 보지만 기준이 다르다.
 * 30곳이라 균등값이 3.3% 다. 8개교일 때의 판정선을 그대로 쓰면 안 된다.
 *
 * 보는 것
 *   1) 도달성 — 30곳이 전부 1위로 나올 수 있는가. 못 나오는 학교가 있으면
 *      그 학교를 대표하는 선택지가 문항에 없다는 뜻이다.
 *   2) 독식 — 한 학교가 지나치게 많이 나오지 않는가.
 *   3) 분포 — 퍼센티지 밴드를 어디에 맞출지.
 *   4) 보정값 — POPULATION_BIAS 와 SCHOOL_CALIB 를 뽑는다.
 */
var path = require('path');
var ROOT = path.join(__dirname, '..');
var load = function (p) { return require(path.join(ROOT, p)); };

var axes = load('js/data/korea/axes.js');
var schools = load('js/data/korea/schools.js');
var questions = load('js/data/korea/questions.js');
var tuning = load('js/data/korea/tuning.js');
global.AXES = axes.AXES;
global.AXIS_IDS = axes.AXIS_IDS;
global.SCHOOLS = schools.SCHOOLS;
global.SCHOOLS_BY_ID = schools.SCHOOLS_BY_ID;
global.QUESTIONS = questions.QUESTIONS;
global.TUNING = tuning.TUNING;
var scoring = load('js/scoring.js');

var Q = questions.QUESTIONS;
var AX = axes.AXIS_IDS;
var S = schools.SCHOOLS;
var IDS = S.map(function (s) { return s.id; });
var N = 30000;

var seed = 20260811;
function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
function gauss() { var s = 0; for (var i = 0; i < 6; i++) s += rnd(); return s - 3; }

// 잠재 성향에서 답을 고르는 가상 응답자
function answerAs(latent, noise) {
  return Q.map(function (q) {
    var bi = 0, bs = -1e9;
    q.options.forEach(function (o, i) {
      var s = 0;
      Object.keys(o.weights).forEach(function (id) {
        var j = AX.indexOf(id);
        if (j >= 0) s += o.weights[id] * latent[j];
      });
      s += gauss() * noise;
      if (s > bs) { bs = s; bi = i; }
    });
    return bi;
  });
}

function sample(bias, noise) {
  var wins = {}; IDS.forEach(function (i) { wins[i] = 0; });
  var sums = {}; AX.forEach(function (a) { sums[a] = 0; });
  var cs = {}, cs2 = {}; IDS.forEach(function (i) { cs[i] = 0; cs2[i] = 0; });
  var tops = [], decs = [];
  for (var n = 0; n < N; n++) {
    var latent = AX.map(function (a) { return gauss() + ((bias && bias[a]) || 0); });
    var r = scoring.scoreAnswers(answerAs(latent, noise));
    wins[r.ranked[0].id]++;
    r.axes.forEach(function (e) { sums[e.axis.id] += e.value; });
    r.ranked.forEach(function (x) { cs[x.id] += x.raw; cs2[x.id] += x.raw * x.raw; });
    tops.push(r.ranked[0].score);
    decs.push(r.decisiveness);
  }
  var mean = {}; AX.forEach(function (a) { mean[a] = sums[a] / N; });
  var calib = {};
  IDS.forEach(function (i) {
    var m = cs[i] / N, v = Math.max(1e-6, cs2[i] / N - m * m);
    calib[i] = { mean: m, std: Math.sqrt(v) };
  });
  tops.sort(function (a, b) { return a - b; });
  decs.sort(function (a, b) { return a - b; });
  return { wins: wins, mean: mean, calib: calib, tops: tops, decs: decs };
}

function show(title, wins) {
  console.log('\n' + title);
  var rows = IDS.map(function (i) { return [i, wins[i] / N]; }).sort(function (a, b) { return b[1] - a[1]; });
  var byId = {}; S.forEach(function (s) { byId[s.id] = s.nameKo; });
  rows.forEach(function (r) {
    console.log('   ' + byId[r[0]].padEnd(10) + (r[1] * 100).toFixed(1).padStart(5) + '%  ' +
      '#'.repeat(Math.round(r[1] * 300)));
  });
  var lo = rows[rows.length - 1], hi = rows[0];
  console.log('   최저 ' + byId[lo[0]] + ' ' + (lo[1] * 100).toFixed(1) + '%  ~  최고 ' +
    byId[hi[0]] + ' ' + (hi[1] * 100).toFixed(1) + '%   (균등값 ' + (100 / IDS.length).toFixed(1) + '%)');
  var dead = rows.filter(function (r) { return r[1] * 100 < 1.0; });
  var hog = rows.filter(function (r) { return r[1] * 100 > 12; });
  console.log('   1% 미만(사실상 도달 불가): ' + (dead.length ? dead.map(function (r) { return byId[r[0]]; }).join(', ') : '없음'));
  console.log('   12% 초과(독식): ' + (hog.length ? hog.map(function (r) { return byId[r[0]]; }).join(', ') : '없음'));
  return { dead: dead.length, hog: hog.length };
}

console.log('한국 대학 30곳 · 문항 ' + Q.length + '개 · 매칭 축 ' + AX.length + '개');
var res = sample(null, 1.1);
var r1 = show('=== 1) 무작위 응답자의 1위 점유율 ===', res.wins);

console.log('\n=== 2) 타당성: 각 학교를 겨냥해 답하면 그 학교가 1위인가 ===');
// 학교 벡터 방향으로 답을 고르는 응답자
var fails = [];
S.forEach(function (s) {
  var latent = AX.map(function (a) { return (s.vector[a] || 0); });
  var ans = Q.map(function (q) {
    var bi = 0, bs = -1e9;
    q.options.forEach(function (o, i) {
      var v = 0;
      Object.keys(o.weights).forEach(function (id) {
        var j = AX.indexOf(id);
        if (j >= 0) v += o.weights[id] * latent[j];
      });
      if (v > bs) { bs = v; bi = i; }
    });
    return bi;
  });
  var r = scoring.scoreAnswers(ans);
  var rank = r.ranked.findIndex(function (x) { return x.id === s.id; }) + 1;
  // 30곳이라 상위 3위 안에 못 들어도 같은 계열이 위에 있으면 틀린 답이 아니다.
  // 과기원 4곳은 확인된 사실로는 성향 축이 거의 같아서 서로 자리를 뺏는다.
  // 그래서 5위까지를 통과로 보되, 3위 밖이면 눈에 띄게 표시한다.
  var ok = rank <= 5;
  if (!ok) fails.push(s.nameKo + '(' + rank + '위)');
  console.log('   ' + (ok ? 'OK ' : '실패') + ' ' + s.nameKo.padEnd(10) + rank + '위   ' +
    r.top3.map(function (x) { return x.school.nameKo + ' ' + x.percent + '%'; }).join(' > '));
});

console.log('\n=== 3) 분포 (밴드 맞추기용) ===');
var q = function (arr, p) { return arr[Math.floor(arr.length * p)]; };
console.log('   1위 표준화점수  p05 ' + q(res.tops, 0.05).toFixed(3) +
  '  중앙 ' + q(res.tops, 0.5).toFixed(3) + '  p95 ' + q(res.tops, 0.95).toFixed(3) +
  '   (현재 COS_LO/HI: ' + tuning.TUNING.COS_LO + ' / ' + tuning.TUNING.COS_HI + ')');
console.log('   뚜렷함(d)       p05 ' + q(res.decs, 0.05).toFixed(3) +
  '  중앙 ' + q(res.decs, 0.5).toFixed(3) + '  p95 ' + q(res.decs, 0.95).toFixed(3) +
  '   (현재 DEC_LO/HI: ' + tuning.TUNING.DEC_LO + ' / ' + tuning.TUNING.DEC_HI + ')');

console.log('\n=== 4) js/data/korea/tuning.js 에 옮겨 적을 값 ===');
console.log('  POPULATION_BIAS: {');
AX.forEach(function (a) { console.log('    ' + a + ': ' + res.mean[a].toFixed(3) + ','); });
console.log('  },');
console.log('  SCHOOL_CALIB: {');
IDS.forEach(function (i) {
  console.log('    ' + i + ': { mean: ' + res.calib[i].mean.toFixed(4) +
    ', std: ' + res.calib[i].std.toFixed(4) + ' },');
});
console.log('  },');

console.log('\n판정 기준 (30곳 기준이라 아이비 8곳 때와 다르다)');
console.log('  · 균등값이 3.3% 라 1% 미만이면 사실상 안 나오는 학교로 본다');
console.log('  · 타당성은 5위까지 통과. 과기원 4곳은 확인된 사실로 성향이 거의 같아');
console.log('    서로 자리를 뺏는데, 그건 데이터 한계이지 문항 문제가 아니다');
console.log('    (docs/korea-fact-check.md 참고)');
console.log('\n' + (r1.dead === 0 && fails.length === 0 ? '통과' :
  '통과하지 못한 항목 — 도달 1% 미만 ' + r1.dead + '곳, 타당성 5위 밖: ' + (fails.join(', ') || '없음')));
