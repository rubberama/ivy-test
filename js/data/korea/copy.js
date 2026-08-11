/**
 * 한국 대학 버전 — 모드별 화면 문구
 *
 * 말투는 두 모드 모두 해요체다. 달라지는 건 "나"냐 "아이"냐뿐이다.
 *
 * 아이비 버전과 다르게 쓴 것
 *   결과를 "1위"라고 부르지 않는다. 한국에서 대학 30곳을 늘어놓고 순위를
 *   매기면 성향 매칭이 아니라 서열 확인으로 읽힌다. 그래서 "가장 가까운 곳"
 *   으로 부르고, 문구 어디에도 합격 가능성이나 지원 추천을 암시하지 않는다.
 */
var MODES = ['student', 'parent'];

var REASON_TAILS = [
  function (name, josa) { return josa(name, '이', '가') + ' 딱 그런 학교예요.'; },
  function (name) { return name + '도 그쪽에 가까워요.'; },
  function (name) { return name + '에서 그 부분이 잘 맞아요.'; },
];

var MODE_COPY = {
  student: {
    pickLabel: '학생이에요',
    pickSub: '제가 직접 답할게요',
    shortLabel: '학생용',

    quizNote: '정답은 없어요. 더 나답게 느껴지는 쪽, 4년 내내 해도 덜 지칠 것 같은 쪽을 골라주세요.',
    loading: '답변을 서른 곳의 성향과 맞춰보고 있어요…',

    whyTitle: function (name, josa) { return josa(name, '이', '가') + ' 나온 이유'; },
    resultLabel: '나와 결이 가장 가까운 곳',
    axisLabel: '내 성향 축',
    axisNote: '가운데에서 멀수록 그쪽 성향이 뚜렷하다는 뜻이에요.',
    detailHeads: ['분위기', '확인된 사실', '이런 사람이 잘 맞아요'],

    flatReason: '성향이 어느 쪽으로도 크게 기울지 않아서 세 곳이 비슷하게 나왔어요. ' +
      '아래 세 곳을 모두 살펴보면 좋아요.',

    reasons: [
      function (pole) { return pole + ' 쪽으로 가장 뚜렷하게 기울었어요.'; },
      function (pole) { return pole + ' 쪽에 무게를 두는 편이에요.'; },
      function (pole) { return pole + ' 쪽 답을 여러 번 골랐어요.'; },
    ],
    reasonTails: REASON_TAILS,

    shareTitle: '나와 결이 맞는 대학은?',
    shareText: function (name, pct) {
      return '나는 ' + name + ' ' + pct + '% 나왔어요. 같이 해볼래요?';
    },

    cardMark: 'UNIV',
    cardMarkSub: '대학 성향 매칭',
    cardEyebrow: 'Your closest match',
    cardLead: '나랑 결이 제일 가까운 대학은',
    cardTraits: '이런 성향이 결정적이었어요',
    cardFoot: '20개 질문으로 찾는 나의 대학',
    taglineOf: function (school) { return school.tagline; },
  },

  parent: {
    pickLabel: '학부모예요',
    pickSub: '아이를 떠올리며 답할게요',
    shortLabel: '학부모용',

    quizNote: '정답은 없어요. 아이를 떠올리면서 더 가까운 쪽을 골라주세요. ' +
      '바라는 모습이 아니라 실제 모습으로 답하실수록 결과가 정확해요.',
    loading: '답변을 서른 곳의 성향과 맞춰보고 있어요…',

    whyTitle: function (name, josa) { return josa(name, '이', '가') + ' 나온 이유'; },
    resultLabel: '아이와 결이 가장 가까운 곳',
    axisLabel: '아이의 성향 축',
    axisNote: '가운데에서 멀수록 그쪽 성향이 뚜렷하다는 뜻이에요.',
    detailHeads: ['분위기', '확인된 사실', '이런 아이가 잘 맞아요'],

    flatReason: '성향이 어느 쪽으로도 크게 기울지 않아서 세 곳이 비슷하게 나왔어요. ' +
      '아래 세 곳을 함께 살펴보시면 좋아요.',

    reasons: [
      function (pole) { return pole + ' 쪽으로 아이가 가장 뚜렷하게 기울어 있어요.'; },
      function (pole) { return pole + ' 쪽에 무게를 두는 아이예요.'; },
      function (pole) { return pole + ' 쪽 답을 여러 번 고르셨어요.'; },
    ],
    reasonTails: REASON_TAILS,

    shareTitle: '내 아이와 결이 맞는 대학은?',
    shareText: function (name, pct) {
      return '우리 아이는 ' + name + ' ' + pct + '% 나왔어요. 한번 해보세요.';
    },

    cardMark: 'UNIV',
    cardMarkSub: '대학 성향 매칭',
    cardEyebrow: 'Closest match for your child',
    cardLead: '우리 아이와 결이 가까운 대학은',
    cardTraits: '아이의 이런 성향이 결정적이었어요',
    cardFoot: '20개 질문으로 찾는 우리 아이의 대학',
    taglineOf: function (school) { return school.taglineParent || school.tagline; },
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MODES: MODES, MODE_COPY: MODE_COPY, REASON_TAILS: REASON_TAILS };
}
