/**
 * 한국 대학 테스트의 채점 보정값
 *
 * 엔진(js/scoring.js)은 아이비 버전과 공유한다. 보정값만 테스트별로 다르다.
 * 아이비는 8개교라 균등값이 12.5% 였는데 여기는 30곳이라 3.3% 다.
 * 그래서 도달성 판정 기준도, 퍼센티지 밴드도 다시 잡아야 한다.
 *
 * 값을 다시 뽑는 방법:
 *   node scripts/check-korea.js
 */
var TUNING = {
  Z_SPAN: 2.2,

  /* 표시 퍼센티지. 아이비(84~97)보다 약간 낮게 잡는다.
     30곳 중 하나를 고르는 것이라 "딱 맞는다"고 말하기 어렵고,
     퍼센트가 높을수록 서열 확인처럼 읽히기 때문이다. */
  P_MIN: 78,
  P_RANGE: 18, // 78 ~ 96

  W_COS: 0.65,
  W_DEC: 0.35,

  // check-korea.js 로 실제 분포를 뽑아 채운다
  COS_LO: 1.15, COS_HI: 2.45,
  DEC_LO: 0.52, DEC_HI: 0.85,

  GAP_K: 0.09,
  MIN_STEP: 2,
  FLOOR: 45,
  FLAT_EPS: 0.05,

  POPULATION_BIAS: {
    distance: -0.034,
    immersion: -0.024,
    scale: -0.042,
    bond: -0.051,
    legacy: -0.056,
    horizon: -0.055,
    domain: -0.076,
    making: -0.034,
    openness: -0.048,
    intensity: -0.076,
  },
  SCHOOL_CALIB: {
    snu: { mean: 0.0243, std: 0.3066 },
    yonsei: { mean: 0.0150, std: 0.3585 },
    korea: { mean: -0.0005, std: 0.3600 },
    kaist: { mean: -0.0180, std: 0.3751 },
    postech: { mean: -0.0126, std: 0.3679 },
    skku: { mean: -0.0357, std: 0.3002 },
    hanyang: { mean: -0.0249, std: 0.3653 },
    sogang: { mean: 0.0078, std: 0.3313 },
    cau: { mean: -0.0092, std: 0.3468 },
    khu: { mean: -0.0118, std: 0.3137 },
    hufs: { mean: 0.0249, std: 0.3570 },
    uos: { mean: 0.0171, std: 0.2592 },
    ewha: { mean: 0.0248, std: 0.3551 },
    sookmyung: { mean: 0.0175, std: 0.3002 },
    konkuk: { mean: 0.0042, std: 0.3845 },
    dongguk: { mean: 0.0188, std: 0.3352 },
    hongik: { mean: 0.0170, std: 0.3376 },
    kookmin: { mean: 0.0013, std: 0.3036 },
    sejong: { mean: 0.0126, std: 0.3441 },
    seoultech: { mean: -0.0011, std: 0.3213 },
    ajou: { mean: -0.0193, std: 0.3548 },
    inha: { mean: -0.0283, std: 0.3655 },
    pnu: { mean: -0.0105, std: 0.2687 },
    knu: { mean: -0.0327, std: 0.3019 },
    jnu: { mean: -0.0065, std: 0.2976 },
    cnu: { mean: -0.0028, std: 0.2801 },
    jbnu: { mean: -0.0120, std: 0.3106 },
    unist: { mean: -0.0029, std: 0.3754 },
    gist: { mean: -0.0034, std: 0.3713 },
    karts: { mean: 0.0217, std: 0.3222 },
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TUNING: TUNING };
}
