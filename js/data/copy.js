/**
 * 모드별 화면 문구
 *
 * 학생이 직접 답하는 경우와 학부모가 아이를 떠올리며 답하는 경우는
 * 같은 화면이라도 주어가 달라야 한다. 그 차이를 여기 모아둔다.
 * 문구를 고칠 일이 있으면 app.js 를 뒤지지 말고 이 파일만 보면 된다.
 *
 * 말투는 두 모드 모두 해요체다. 달라지는 건 "나"냐 "아이"냐뿐이고,
 * 문장 끝은 앱 전체가 똑같이 간다. 합니다체를 섞지 말 것.
 */
var MODES = ['student', 'parent'];

/**
 * 근거 세 줄의 꼬리말.
 *
 * reasons 는 앞부분 어투를 일부러 세 가지로 갈라놨는데, 예전에는 app.js 가
 * 뒤에 "OO가 딱 그런 학교예요."를 고정으로 붙여서 세 줄이 결국 같은 문장으로
 * 끝났다. 한 화면에 같은 말이 세 번 나오는 자리라 티가 제일 크게 났다.
 * 꼬리말도 세 벌로 나눠 여기에 둔다.
 *
 * 학교 이름은 데이터에서 오므로 조사를 붙일 때 받침을 봐야 한다("유펜가").
 * 그래서 app.js 의 josa 를 두 번째 인자로 받는다. '도'와 '에서'는 받침과
 * 상관없이 그대로 붙으므로 josa 가 필요 없다.
 * 꼬리말은 학교 얘기라 두 모드가 같은 것을 쓴다.
 */
var REASON_TAILS = [
  function (name, josa) { return josa(name, '이', '가') + ' 딱 그런 학교예요.'; },
  function (name) { return name + '도 그쪽에 가까워요.'; },
  function (name) { return name + '에서 그 부분이 잘 맞아요.'; },
];

/**
 * 근거 한 줄. 축 이름만 대는 것과 실제 답에서 숫자를 뽑아 보여주는 건 다르다.
 *
 * ev 는 scoring.js 의 countPicks 결과다.
 *   total   내 답이 이 축을 건드린 문항 수
 *   picked  그중 이 방향이었던 수
 *   strong  ±2 로 확실하게 고른 수
 *
 * 두 개 이하면 숫자를 대봐야 근거가 안 된다. 절반도 안 되면 아예 안 쓴다 —
 * "5개 중 2개"라고 적어두면 오히려 결과를 못 믿게 만든다.
 */
var EVIDENCE = function (ev, pole) {
  if (!ev || ev.total < 3) return '';
  if (ev.picked === ev.total) {
    return '이 축을 건드린 답 ' + ev.total + '개가 전부 ' + pole + ' 쪽이었어요' +
      (ev.strong >= 2 ? ', 그중 ' + ev.strong + '개는 제일 끝 선택지였고요.' : '.');
  }
  if (ev.picked * 2 > ev.total) {
    return '관련된 답 ' + ev.total + '개 중 ' + ev.picked + '개가 ' + pole + ' 쪽이었어요.';
  }
  return '';
};

var MODE_COPY = {
  student: {
    pickLabel: '학생이에요',
    pickSub: '제가 직접 답할게요',
    // pickLabel 은 인트로 선택 버튼용 완결 문장이다. 진행률·이어서 하기처럼
    // 라벨 조각 사이에 끼우는 자리에는 종결어미가 없는 이 짧은 말을 쓴다.
    shortLabel: '학생용',

    quizNote: '정답은 없어요. 더 나답게 느껴지고, 오래 해도 덜 지칠 것 같은 쪽을 골라주세요.',
    loading: '답변을 여덟 학교의 성향과 맞춰보고 있어요…',

    resultLabel: '나와 가장 잘 맞는 학교',
    axisLabel: '내 성향 축',
    axisNote: '가운데에서 멀수록 그쪽 성향이 뚜렷하다는 뜻이에요.',
    detailHeads: ['분위기', '이 학교가 잘하는 것', '이런 사람이 잘 맞아요'],

    flatReason: '성향이 어느 쪽으로도 크게 기울지 않아서 세 학교가 비슷하게 나왔어요. ' +
      '아래 세 곳을 모두 살펴보면 좋아요.',

    // 세 줄이 전부 같은 문장으로 끝나면 기계가 찍어낸 티가 난다. 순서대로 다른 어투를 쓴다.
    // pole 은 축 라벨이라 받침이 있을 수도 없을 수도 있다. 뒤에 조사를 바로 붙이면
    // "독립적·개인주의을" 같은 게 나온다. 받침이 확실한 '쪽'을 사이에 끼워서 피한다.
    reasons: [
      function (pole) { return pole + ' 쪽으로 가장 뚜렷하게 기울었어요.'; },
      function (pole) { return pole + ' 쪽에 무게를 두는 편이에요.'; },
      function (pole) { return pole + ' 쪽 답을 여러 번 골랐어요.'; },
    ],
    reasonTails: REASON_TAILS,
    evidenceOf: EVIDENCE,

    shareTitle: '나에게 맞는 아이비리그는?',
    shareText: function (name, pct) {
      return '나는 ' + name + ' ' + pct + '% 나왔어요. 같이 해볼래요?';
    },

    cardMark: 'IVY',
    cardMarkSub: '성향 매칭',
    cardEyebrow: 'Your closest match',
    cardLead: '나랑 제일 잘 맞는 아이비는',
    cardTraits: '이런 성향이 결정적이었어요',
    cardFoot: '18개 질문으로 찾는 나의 아이비리그',
    taglineOf: function (school) { return school.tagline; },
  },

  parent: {
    pickLabel: '학부모예요',
    pickSub: '아이를 떠올리며 답할게요',
    shortLabel: '학부모용',

    quizNote: '정답은 없어요. 아이를 떠올리면서 더 가까운 쪽을 골라주세요. ' +
      '바라는 모습이 아니라 실제 모습으로 답하실수록 결과가 정확해요.',
    loading: '답변을 여덟 학교의 성향과 맞춰보고 있어요…',

    resultLabel: '아이와 가장 잘 맞는 학교',
    axisLabel: '아이의 성향 축',
    axisNote: '가운데에서 멀수록 그쪽 성향이 뚜렷하다는 뜻이에요.',
    detailHeads: ['분위기', '이 학교가 잘하는 것', '이런 아이가 잘 맞아요'],

    flatReason: '성향이 어느 쪽으로도 크게 기울지 않아서 세 학교가 비슷하게 나왔어요. ' +
      '아래 세 곳을 함께 살펴보시면 좋아요.',

    // 주어를 pole 뒤로 보낸다. 앞에 두면 "아이가 협력·여유 쪽으로…" 처럼
    // 축 이름보다 주어가 먼저 나와서, 세 줄이 전부 '아이가'로 시작하게 된다.
    reasons: [
      function (pole) { return pole + ' 쪽으로 아이가 가장 뚜렷하게 기울어 있어요.'; },
      function (pole) { return pole + ' 쪽에 무게를 두는 아이예요.'; },
      function (pole) { return pole + ' 쪽 답을 여러 번 고르셨어요.'; },
    ],
    reasonTails: REASON_TAILS,
    evidenceOf: EVIDENCE,

    shareTitle: '내 아이에게 맞는 아이비리그는?',
    shareText: function (name, pct) {
      return '우리 아이는 ' + name + ' ' + pct + '% 나왔어요. 한번 해보세요.';
    },

    cardMark: 'IVY',
    cardMarkSub: '성향 매칭',
    cardEyebrow: 'Closest match for your child',
    cardLead: '우리 아이와 맞는 아이비는',
    cardTraits: '아이의 이런 성향이 결정적이었어요',
    cardFoot: '18개 질문으로 찾는 우리 아이의 아이비리그',
    taglineOf: function (school) { return school.taglineParent || school.tagline; },
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MODES: MODES, MODE_COPY: MODE_COPY, REASON_TAILS: REASON_TAILS };
}
