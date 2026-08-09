/**
 * 매칭 점수 계산
 *
 * 흐름:
 *   답변 인덱스 배열
 *     -> 축별 가중치 합산 -> 축별 최대치로 나눠 사용자 벡터 u (-1 ~ 1)
 *     -> 학교 벡터를 [-1,1]로 줄이고 축마다 8개교 평균을 뺀 s'
 *     -> cos(u, s') 로 순위 결정
 *     -> cos 최댓값과 답변의 뚜렷함(d)을 섞어 1위 퍼센티지를 84~97 사이에 배치
 *
 * s' 의 크기로 나누는 것(=코사인)이 중요하다. 안 그러면 축 값이 극단적인
 * 학교가 방향과 무관하게 유리해진다.
 *
 * 아래 보정 상수는 scripts/check-reachability.js 로 실제 분포를 뽑아
 * 맞춘 값이다. 질문이나 학교 벡터를 고치면 그 스크립트를 다시 돌릴 것.
 */

/* ── 보정 상수 ─────────────────────────────────────────────── */
var CALIB = {
  // 1위 퍼센티지가 놓이는 구간
  P_MIN: 84,
  P_RANGE: 13, // 84 ~ 97

  // 1위 퍼센티지를 정하는 두 재료의 비중
  W_COS: 0.65, // 1위 학교와 방향이 얼마나 맞는가
  W_DEC: 0.35, // 답변이 얼마나 한쪽으로 뚜렷했는가

  // 각 재료를 0~1로 펴는 구간 (실제 관측 분포 기준)
  COS_LO: 0.35, COS_HI: 0.92,
  DEC_LO: 0.15, DEC_HI: 0.55,

  // 2·3위가 1위에서 얼마나 빨리 멀어지는가
  GAP_K: 0.35,
  MIN_STEP: 2,  // 순위 간 최소 격차
  FLOOR: 52,    // 3위 하한

  // u 가 사실상 0일 때(모든 축에서 답이 상쇄) 동점 처리로 넘어가는 기준
  FLAT_EPS: 0.05,
};

/* ── 준비: 축 최대치 / 센터링된 학교 행렬 ───────────────────── */

/**
 * 축별 표준편차. u 를 정규화할 때 이론상 최대치가 아니라 이 값을 쓴다.
 *
 * 최대치로 나누면 축마다 영향력이 크게 달라진다. 어떤 축은 주축으로 2번만
 * 등장하는데 보조 가중치로는 12번 실린다. 그러면 최대치는 커지는데 실제
 * 합계는 ±1 이 여러 개 상쇄돼서 작게 나오고, 결과적으로 그 축의 사용자
 * 값이 늘 0 근처에 눌린다. 그 축에 정체성이 걸린 학교(예: 컬럼비아의
 * '독립적' 성향)는 아무리 답해도 신호가 안 올라온다.
 *
 * 각 문항에서 선택지가 균등하게 뽑힌다고 보고 분산을 더해 표준편차를 구하면,
 * 축마다 "보통 이 정도까지 기운다"는 실제 폭을 기준으로 삼을 수 있다.
 *
 * 평균(mean)도 같이 구해서 빼준다. 어떤 축은 네 선택지의 가중치 합이 0이
 * 아니라 한쪽으로 쏠려 있는데(예: +2, +1, -1, 0 이면 평균이 +0.5),
 * 그러면 아무렇게나 찍어도 그 축이 양수로 나온다. 그 편향을 빼야
 * "이 사람이 평균보다 어느 쪽으로 기울었나"를 재게 된다.
 */
function computeAxisStats() {
  var stats = {};
  AXIS_IDS.forEach(function (id) {
    var variance = 0, drift = 0;
    QUESTIONS.forEach(function (q) {
      var n = q.options.length;
      var sum = 0, sumSq = 0;
      q.options.forEach(function (o) {
        var w = o.weights[id] || 0;
        sum += w;
        sumSq += w * w;
      });
      var mean = sum / n;
      drift += mean;                          // 아무렇게나 찍었을 때 기대되는 합계
      variance += sumSq / n - mean * mean;    // 선택에 따라 실제로 흔들리는 폭
    });
    stats[id] = { mean: drift, std: Math.sqrt(variance) || 1 };
  });
  return stats;
}

// 표준편차 몇 배까지를 "완전히 기울었다(±1)"로 볼지.
// 2.2 면 대략 상·하위 1~2% 지점이 양 끝에 닿는다.
var Z_SPAN = 2.2;

// 학교 벡터를 [-1,1]로 줄이고, 축마다 8개교 평균을 빼서 상대 차이만 남긴다.
// 이렇게 해야 "아이비는 대체로 도시적" 같은 공통 성분이 순위에 안 섞인다.
function computeCenteredSchools() {
  var raw = SCHOOLS.map(function (s) {
    return AXIS_IDS.map(function (id) { return (s.vector[id] || 0) / 2; });
  });
  AXIS_IDS.forEach(function (id, k) {
    var mean = raw.reduce(function (a, v) { return a + v[k]; }, 0) / raw.length;
    raw.forEach(function (v) { v[k] -= mean; });
  });
  return SCHOOLS.map(function (s, i) {
    return { id: s.id, vec: raw[i], norm: vectorNorm(raw[i]) };
  });
}

function vectorNorm(v) {
  return Math.sqrt(v.reduce(function (a, x) { return a + x * x; }, 0));
}

var AXIS_STATS = computeAxisStats();
var CENTERED = computeCenteredSchools();

/* ── 사용자 벡터 ───────────────────────────────────────────── */

/**
 * 답변 인덱스 배열 -> 축별 -1~1 벡터(객체 형태)
 * 아직 답하지 않은 문항(null/undefined)은 그냥 건너뛴다.
 */
function buildUserVector(answers) {
  var sums = {};
  AXIS_IDS.forEach(function (id) { sums[id] = 0; });

  QUESTIONS.forEach(function (q, i) {
    var pick = answers[i];
    if (pick === null || pick === undefined) return;
    var opt = q.options[pick];
    if (!opt) return;
    Object.keys(opt.weights).forEach(function (id) {
      if (sums[id] === undefined) return; // 오타로 들어간 축 이름 방어
      sums[id] += opt.weights[id];
    });
  });

  // 답한 문항 수에 비례해 편향도 줄여야 한다. 중간에 그만둔 상태로
  // 계산하면 18문항치 편향을 통째로 빼서 엉뚱한 쪽으로 쏠린다.
  var answered = 0;
  QUESTIONS.forEach(function (q, i) {
    var pick = answers[i];
    if (pick !== null && pick !== undefined && q.options[pick]) answered++;
  });
  var ratio = QUESTIONS.length ? answered / QUESTIONS.length : 0;

  var u = {};
  AXIS_IDS.forEach(function (id) {
    var st = AXIS_STATS[id];
    var v = (sums[id] - st.mean * ratio) / (Z_SPAN * st.std);
    u[id] = v < -1 ? -1 : v > 1 ? 1 : v;
  });
  return u;
}

/* ── 보조 함수 ─────────────────────────────────────────────── */

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

function stretch(x, lo, hi) { return clamp01((x - lo) / (hi - lo)); }

// 답변 배열로부터 결정론적인 정수를 만든다.
// u 가 0이라 8개교가 전부 동점일 때 순서를 흔드는 용도.
// 이게 없으면 항상 SCHOOLS 배열 선언 순서대로(brown, columbia...) 나온다.
function answersHash(answers) {
  var h = 2166136261;
  for (var i = 0; i < answers.length; i++) {
    h ^= ((answers[i] === null || answers[i] === undefined) ? 9 : answers[i]) + i * 31;
    h = (h * 16777619) >>> 0;
  }
  return h;
}

/* ── 메인 ──────────────────────────────────────────────────── */

/**
 * @param {Array<number|null>} answers 문항별 선택지 인덱스(0~3)
 * @returns {{
 *   ranked: Array<{id, school, percent, cos}>,
 *   top3: Array<...>,
 *   axes: Array<{axis, value}>,
 *   reasons: Array<{axis, side, label, weight}>,
 *   decisiveness: number,
 *   isFlat: boolean
 * }}
 */
function scoreAnswers(answers) {
  var u = buildUserVector(answers);
  var uVec = AXIS_IDS.map(function (id) { return u[id]; });
  var uNorm = vectorNorm(uVec);
  var isFlat = uNorm < CALIB.FLAT_EPS;

  // 동점 방지용 아주 작은 결정론적 흔들림. 순위에만 영향을 주고
  // 퍼센티지에는 사실상 영향이 없는 크기다.
  var h = answersHash(answers);

  var scored = CENTERED.map(function (c, i) {
    var dot = 0;
    for (var k = 0; k < uVec.length; k++) dot += c.vec[k] * uVec[k];
    var cos = (uNorm > 0 && c.norm > 0) ? dot / (uNorm * c.norm) : 0;
    var jitter = (((h >>> (i * 3)) & 7) - 3.5) * 1e-6;
    return { id: c.id, school: SCHOOLS_BY_ID[c.id], cos: cos, sort: cos + jitter };
  });

  scored.sort(function (a, b) { return b.sort - a.sort; });

  var cosTop = scored[0].cos;
  var d = uNorm / Math.sqrt(AXIS_IDS.length);

  var q = clamp01(
    CALIB.W_COS * stretch(cosTop, CALIB.COS_LO, CALIB.COS_HI) +
    CALIB.W_DEC * stretch(d, CALIB.DEC_LO, CALIB.DEC_HI)
  );
  var p1 = Math.round(CALIB.P_MIN + CALIB.P_RANGE * q);

  var percents = [p1];
  for (var i = 1; i < scored.length; i++) {
    var p = Math.round(p1 * (1 - CALIB.GAP_K * (cosTop - scored[i].cos)));
    p = Math.min(p, percents[i - 1] - CALIB.MIN_STEP);
    p = Math.max(p, CALIB.FLOOR);
    percents.push(p);
  }

  var ranked = scored.map(function (s, i) {
    return { id: s.id, school: s.school, percent: percents[i], cos: s.cos };
  });

  return {
    ranked: ranked,
    top3: ranked.slice(0, 3),
    axes: AXIS_IDS.map(function (id, k) {
      return { axis: AXES[k], value: u[id] };
    }),
    reasons: explainMatch(uVec, ranked[0].id),
    decisiveness: d,
    isFlat: isFlat,
  };
}

/**
 * 1위 학교가 나온 이유를 축 단위로 뽑는다.
 * 기여도 = 사용자의 축 값 × 그 학교의 센터링된 축 값.
 * 양수이고 클수록 "이 축 때문에 이 학교가 올라왔다"는 뜻이다.
 */
function explainMatch(uVec, schoolId) {
  var c = null;
  for (var i = 0; i < CENTERED.length; i++) {
    if (CENTERED[i].id === schoolId) { c = CENTERED[i]; break; }
  }
  if (!c) return [];

  return AXIS_IDS.map(function (id, k) {
    var axis = AXES[k];
    var side = uVec[k] < 0 ? 'neg' : 'pos';
    return {
      axis: axis,
      side: side,
      label: side === 'neg' ? axis.negShort : axis.posShort,
      weight: c.vec[k] * uVec[k],
    };
  })
    .filter(function (r) { return r.weight > 0.01; })
    .sort(function (a, b) { return b.weight - a.weight; })
    .slice(0, 3);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CALIB: CALIB,
    AXIS_STATS: AXIS_STATS,
    CENTERED: CENTERED,
    buildUserVector: buildUserVector,
    scoreAnswers: scoreAnswers,
    explainMatch: explainMatch,
  };
}
