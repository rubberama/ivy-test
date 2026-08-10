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

var MODE_COPY = {
  student: {
    pickLabel: '학생이에요',
    pickSub: '제가 직접 답할게요',

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

    shareTitle: '나에게 맞는 아이비리그는?',
    shareText: function (name, pct) {
      return '저는 ' + name + ' ' + pct + '% 나왔어요. 같이 해볼래요?';
    },

    cardEyebrow: 'Your closest match',
    cardLead: '나랑 제일 잘 맞는 아이비는',
    cardTraits: '이런 성향이 결정적이었어요',
    cardFoot: '18개 질문으로 찾는 나의 아이비리그',
    taglineOf: function (school) { return school.tagline; },
  },

  parent: {
    pickLabel: '학부모예요',
    pickSub: '아이를 떠올리며 답할게요',

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

    shareTitle: '내 아이에게 맞는 아이비리그는?',
    shareText: function (name, pct) {
      return '우리 아이는 ' + name + ' ' + pct + '% 나왔어요. 한번 해보세요.';
    },

    cardEyebrow: 'Closest match for your child',
    cardLead: '우리 아이와 맞는 아이비는',
    cardTraits: '아이의 이런 성향이 결정적이었어요',
    cardFoot: '18개 질문으로 찾는 우리 아이의 아이비리그',
    taglineOf: function (school) { return school.taglineParent || school.tagline; },
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MODES: MODES, MODE_COPY: MODE_COPY };
}
