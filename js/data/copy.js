/**
 * 모드별 화면 문구
 *
 * 학생이 직접 답하는 경우와 학부모가 아이를 떠올리며 답하는 경우는
 * 같은 화면이라도 주어와 말투가 달라야 한다. 그 차이를 여기 모아둔다.
 * 문구를 고칠 일이 있으면 app.js 를 뒤지지 말고 이 파일만 보면 된다.
 */
var MODES = ['student', 'parent'];

var MODE_COPY = {
  student: {
    pickLabel: '학생이에요',
    pickSub: '제가 직접 답할게요',

    quizNote: '정답은 없어요. 더 나 같거나, 오래 해도 덜 지칠 것 같은 쪽을 골라주세요.',
    loading: '답변을 여덟 학교의 성향과 맞춰보는 중…',

    resultLabel: '나와 가장 잘 맞는 학교',
    axisLabel: '내 성향 축',
    axisNote: '가운데에서 멀수록 그쪽 성향이 뚜렷하다는 뜻이에요.',
    detailHeads: ['분위기', '이 학교가 잘하는 것', '이런 사람이 잘 맞아요'],

    flatReason: '성향이 어느 쪽으로도 크게 기울지 않아서 세 학교가 비슷하게 나왔어요. ' +
      '아래 세 곳을 다 살펴보는 걸 추천해요.',

    // 세 줄이 전부 같은 문장으로 끝나면 기계가 찍어낸 티가 난다. 순서대로 다른 어투를 쓴다.
    reasons: [
      function (pole) { return pole + ' 쪽으로 가장 뚜렷하게 기울었어요.'; },
      function (pole) { return pole + '을 중요하게 보는 편이에요.'; },
      function (pole) { return pole + ' 쪽 답을 여러 번 골랐어요.'; },
    ],

    shareTitle: '나에게 맞는 아이비리그는?',
    shareText: function (name, pct) {
      return '나는 ' + name + ' ' + pct + '% 나왔어. 너도 해볼래?';
    },

    cardEyebrow: 'Your closest match',
    cardLead: '나랑 제일 잘 맞는 아이비는',
    cardTraits: '이런 성향이 결정적이었어요',
    cardFoot: '18개 질문으로 알아보는 나와 맞는 아이비리그',
    taglineOf: function (school) { return school.tagline; },
  },

  parent: {
    pickLabel: '학부모예요',
    pickSub: '아이를 떠올리며 답할게요',

    quizNote: '정답은 없어요. 아이를 떠올리면서 더 가까운 쪽을 골라주세요. ' +
      '바라는 모습이 아니라 실제 모습으로 답할수록 결과가 정확해요.',
    loading: '답변을 여덟 학교의 성향과 맞춰보는 중…',

    resultLabel: '아이와 가장 잘 맞는 학교',
    axisLabel: '아이의 성향 축',
    axisNote: '가운데에서 멀수록 그쪽 성향이 뚜렷하다는 뜻이에요.',
    detailHeads: ['분위기', '이 학교가 잘하는 것', '이런 아이가 잘 맞아요'],

    flatReason: '성향이 어느 쪽으로도 크게 기울지 않아서 세 학교가 비슷하게 나왔어요. ' +
      '아래 세 곳을 함께 살펴보시길 권합니다.',

    reasons: [
      function (pole) { return '아이가 ' + pole + ' 쪽으로 가장 뚜렷하게 기울어 있어요.'; },
      function (pole) { return pole + '을 중요하게 보는 아이예요.'; },
      function (pole) { return pole + ' 쪽 답을 여러 번 고르셨어요.'; },
    ],

    shareTitle: '내 아이에게 맞는 아이비리그는?',
    shareText: function (name, pct) {
      return '우리 아이는 ' + name + ' ' + pct + '% 나왔어요.';
    },

    cardEyebrow: 'Closest match for your child',
    cardLead: '우리 아이와 맞는 아이비는',
    cardTraits: '아이의 이런 성향이 결정적이었어요',
    cardFoot: '18개 질문으로 알아보는 우리 아이와 맞는 아이비리그',
    taglineOf: function (school) { return school.taglineParent || school.tagline; },
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MODES: MODES, MODE_COPY: MODE_COPY };
}
