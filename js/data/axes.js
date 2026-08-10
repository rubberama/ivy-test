/**
 * 성향 축 정의
 *
 * 7개의 양극(bipolar) 축. 모든 값은 -2 ~ +2 스케일을 쓴다.
 * neg 라벨이 음수 쪽, pos 라벨이 양수 쪽이다.
 *
 * 이 배열의 순서가 곧 벡터의 축 순서다. 순서를 바꾸면
 * schools.js 의 벡터 해석이 달라지지 않도록 모든 접근은
 * id 키 기반으로만 한다.
 */
const AXES = [
  {
    id: 'curriculum',
    name: '커리큘럼',
    neg: '내가 짜는 자유 학제',
    pos: '정해진 필수 과정',
    negShort: '자유 설계',
    posShort: '정해진 틀',
  },
  {
    id: 'orientation',
    name: '지향점',
    neg: '순수 학문·지적 탐구',
    pos: '실용·커리어 직결',
    negShort: '학문 탐구',
    posShort: '실용·커리어',
  },
  {
    id: 'setting',
    name: '환경',
    neg: '대도시 한복판',
    pos: '자연·캠퍼스타운',
    negShort: '대도시',
    posShort: '자연',
  },
  {
    id: 'scale',
    name: '규모',
    neg: '소수정예·다 아는 사이',
    pos: '대규모·다양성',
    negShort: '소수정예',
    posShort: '대규모',
  },
  {
    id: 'pace',
    name: '분위기',
    neg: '경쟁·야망·성취',
    pos: '협력·여유·내 페이스',
    negShort: '경쟁·야망',
    posShort: '협력·여유',
  },
  {
    id: 'community',
    name: '소속감',
    neg: '끈끈한 전통·학교 자부심',
    pos: '독립적·개인주의',
    negShort: '끈끈한 공동체',
    // negShort/posShort 는 그래프 라벨로만 쓰이는 게 아니라 결과 근거 문장에
    // "OO 쪽으로 기울었어요" 형태로 그대로 끼워진다. '독립적'은 관형사형이라
    // 의존명사 '쪽' 앞에서 문장이 깨진다("독립적 쪽으로"). 온전한 명사구로 둔다.
    posShort: '독립·개인주의',
  },
  {
    id: 'field',
    name: '관심사',
    neg: '인문·예술·글쓰기',
    pos: 'STEM·수리·응용',
    negShort: '인문·예술',
    posShort: 'STEM·응용',
  },
];

const AXIS_IDS = AXES.map(function (a) { return a.id; });

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AXES: AXES, AXIS_IDS: AXIS_IDS };
}
