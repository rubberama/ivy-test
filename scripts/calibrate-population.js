#!/usr/bin/env node
/**
 * 인구집단 기준점 보정  (실행: node scripts/calibrate-population.js)
 *
 * 왜 필요한가
 *   이 테스트는 "이론적 중립"에서 얼마나 벗어났는지로 학교를 고른다.
 *   그런데 실제 응답자는 중립이 아니다. 한국 학생·학부모는 실용·커리어와
 *   STEM·응용 쪽으로 뚜렷하게 쏠려 있고, 그 방향을 소유한 학교(유펜, 코넬)가
 *   결과를 독식한다. 실측으로 유펜 41% + 코넬 28% = 69% 까지 갔다.
 *
 *   고치는 방법은 앞에서 두 번 쓴 것과 같다. 학교 행렬은 축마다 8개교 평균을
 *   빼서 "학교 간 상대 차이"만 남겼고, 사용자 벡터는 문항 편향을 빼서
 *   "찍었을 때 기대되는 값"을 0으로 만들었다. 여기서 한 겹 더 나아가
 *   "보통의 응답자"를 0으로 만든다. 그러면 매칭이 절대 위치가 아니라
 *   또래 대비 어느 쪽으로 특이한지를 재게 된다.
 *
 * 이 스크립트가 하는 일
 *   가정한 응답자 집단을 시뮬레이션해서 평균 사용자 벡터를 구한다.
 *   그 값이 곧 scoring.js 의 POPULATION_BIAS 다. 출력된 숫자를 옮겨 적으면 된다.
 *
 * 가정을 바꾸고 싶으면 아래 AUDIENCE 를 고치면 된다.
 * 실제 응답 데이터가 쌓이면 그 평균으로 대체하는 게 가장 정확하다.
 */

var path = require('path');
var ROOT = path.join(__dirname, '..');
var load = function (p) { return require(path.join(ROOT, p)); };

var axes = load('js/data/axes.js');
var schools = load('js/data/schools.js');
var questions = load('js/data/questions.js');
global.AXES = axes.AXES;
global.AXIS_IDS = axes.AXIS_IDS;
global.SCHOOLS = schools.SCHOOLS;
global.SCHOOLS_BY_ID = schools.SCHOOLS_BY_ID;
global.QUESTIONS = questions.QUESTIONS;
var scoring = load('js/scoring.js');

var Q = questions.QUESTIONS;
var AX = axes.AXIS_IDS;
var IDS = schools.SCHOOLS.map(function (s) { return s.id; });

/**
 * 가정하는 응답자 집단.
 * 축마다 "보통 사람이 이쪽으로 이만큼 기울어 있다"는 값이다(표준편차 단위).
 * 유학 테스트를 하는 한국 학생·학부모 기준으로 잡았다.
 */
var AUDIENCE = {
  orientation: 0.8,   // 실용·커리어를 먼저 따진다
  field: 0.8,         // STEM·응용 선호가 강하다
  scale: 0.4,         // 큰 학교를 기본값으로 생각한다
  setting: 0.0,
  curriculum: 0.0,
  pace: 0.0,
  community: 0.0,
};

var N = 40000;
var NOISE = 1.1;

var seed = 20260810;
function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
function gauss() { var s = 0; for (var i = 0; i < 6; i++) s += rnd(); return s - 3; }

// 잠재 성향에서 답을 고르는 가상의 응답자
function answerAs(latent) {
  return Q.map(function (q) {
    var bi = 0, bs = -1e9;
    q.options.forEach(function (o, i) {
      var s = 0;
      Object.keys(o.weights).forEach(function (id) {
        var j = AX.indexOf(id);
        if (j >= 0) s += o.weights[id] * latent[j];
      });
      s += gauss() * NOISE;
      if (s > bs) { bs = s; bi = i; }
    });
    return bi;
  });
}

function sample(bias) {
  var sums = {}; AX.forEach(function (a) { sums[a] = 0; });
  var wins = {}; IDS.forEach(function (i) { wins[i] = 0; });
  // 학교별 원점수(코사인) 분포도 같이 모은다
  var cs = {}, cs2 = {}; IDS.forEach(function (i) { cs[i] = 0; cs2[i] = 0; });
  var tops = [];
  for (var n = 0; n < N; n++) {
    var latent = AX.map(function (a) { return gauss() + (bias[a] || 0); });
    var ans = answerAs(latent);
    var r = scoring.scoreAnswers(ans);
    wins[r.ranked[0].id]++;
    r.axes.forEach(function (e) { sums[e.axis.id] += e.value; });
    r.ranked.forEach(function (x) { cs[x.id] += x.raw; cs2[x.id] += x.raw * x.raw; });
    tops.push(r.ranked[0].score);
  }
  var mean = {}; AX.forEach(function (a) { mean[a] = sums[a] / N; });
  var calib = {};
  IDS.forEach(function (i) {
    var m = cs[i] / N;
    var v = Math.max(1e-6, cs2[i] / N - m * m);
    calib[i] = { mean: m, std: Math.sqrt(v) };
  });
  tops.sort(function (a, b) { return a - b; });
  return { mean: mean, wins: wins, calib: calib, tops: tops };
}

function show(title, wins) {
  console.log('\n' + title);
  var rows = IDS.map(function (i) { return [i, wins[i] / N]; })
    .sort(function (a, b) { return b[1] - a[1]; });
  rows.forEach(function (r) {
    console.log('   ' + r[0].padEnd(11) + (r[1] * 100).toFixed(1).padStart(5) + '%  ' +
      '#'.repeat(Math.round(r[1] * 150)));
  });
  var lo = rows[rows.length - 1][1], hi = rows[0][1];
  console.log('   최저 ' + (lo * 100).toFixed(1) + '% ~ 최고 ' + (hi * 100).toFixed(1) +
    '%  (배율 ' + (hi / lo).toFixed(1) + '배)');
  return { lo: lo, hi: hi };
}

console.log('가정한 응답자 집단:');
AX.forEach(function (a) {
  if (AUDIENCE[a]) console.log('   ' + a.padEnd(12) + (AUDIENCE[a] > 0 ? '+' : '') + AUDIENCE[a]);
});

var res = sample(AUDIENCE);
show('=== 보정 전: 이 집단에서의 1위 점유율 ===', res.wins);

console.log('\n=== js/scoring.js 에 옮겨 적을 값 ===');
console.log('\n// 이 집단의 평균 사용자 벡터 = 새 기준점');
console.log('var POPULATION_BIAS = {');
AX.forEach(function (a) {
  console.log('  ' + a + ': ' + res.mean[a].toFixed(3) + ',');
});
console.log('};');

console.log('\n// 이 집단에서 학교별 원점수 분포');
console.log('var SCHOOL_CALIB = {');
IDS.forEach(function (i) {
  console.log('  ' + i + ': { mean: ' + res.calib[i].mean.toFixed(4) +
    ', std: ' + res.calib[i].std.toFixed(4) + ' },');
});
console.log('};');

var q = function (p) { return res.tops[Math.floor(res.tops.length * p)]; };
console.log('\n// 1위 표준화 점수의 분포 — CALIB 의 COS_LO / COS_HI 를 여기에 맞춘다');
console.log('//   p05 ' + q(0.05).toFixed(3) +
  '   중앙 ' + q(0.5).toFixed(3) +
  '   p95 ' + q(0.95).toFixed(3));
