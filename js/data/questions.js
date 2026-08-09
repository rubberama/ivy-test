/**
 * 18개 질문
 *
 * 각 문항은 1개의 주축(primary)을 -2 / -1 / +1 / +2 로 훑고,
 * 보조축(secondary)을 ±1 로 얹어서 결과에 결이 생기게 한다.
 * 선택지 순서 자체에는 의미가 없다(A가 항상 음수 쪽인 건 아님).
 *
 * 주축 배분: curriculum 3 · orientation 3 · setting 3 ·
 *            scale 2 · pace 3 · community 2 · field 2  = 18
 *
 * 성적·시험·스펙을 묻는 문항은 의도적으로 하나도 넣지 않았다.
 * 이건 성향 매칭이지 합격 예측이 아니다.
 */
const QUESTIONS = [
  {
    id: 'q1',
    primary: 'curriculum',
    text: '개강 첫 주, 시간표를 짜는 나는',
    options: [
      { label: '듣고 싶은 것만 골라 담는다. 필수 과목이란 게 없었으면 좋겠다', weights: { curriculum: -2, community: 1 } },
      { label: '학교가 정해준 필수부터 채우고 남는 자리를 고른다', weights: { curriculum: 2, pace: -1 } },
      { label: '전공 로드맵 순서대로 착실히 밟는다', weights: { curriculum: 1, orientation: 1 } },
      { label: '관심 가는 분야를 일단 여기저기 찔러본다', weights: { curriculum: -1, scale: 1 } },
    ],
  },
  {
    id: 'q2',
    primary: 'orientation',
    text: '전공을 고를 때 가장 먼저 떠오르는 생각은',
    options: [
      { label: '이거 진짜 재밌겠다', weights: { orientation: -2, field: -1 } },
      { label: '졸업하고 뭘 하게 되는지가 분명하다', weights: { orientation: 2, pace: -1 } },
      { label: '아직 모르겠고 일단 넓게 배우고 싶다', weights: { orientation: -1, scale: 1 } },
      { label: '배운 걸 바로 써먹을 수 있는 게 좋다', weights: { orientation: 1, field: 1 } },
    ],
  },
  {
    id: 'q3',
    primary: 'setting',
    text: '수업 없는 토요일, 내 기본값은',
    options: [
      { label: '지하철 타고 시내 한복판으로 나간다', weights: { setting: -2, community: 1 } },
      { label: '도시는 도시인데 조용한 동네 카페에 있는다', weights: { setting: -1, pace: 1 } },
      { label: '학교랑 붙어 있는 동네에서 소소하게 보낸다', weights: { setting: 1, scale: -1 } },
      { label: '산이든 강이든 자연 있는 데로 나간다', weights: { setting: 2, community: -1 } },
    ],
  },
  {
    id: 'q4',
    primary: 'scale',
    text: '새 학기 첫 수업, 강의실에 들어갔을 때 마음이 편한 쪽은',
    options: [
      { label: '열댓 명. 교수님이 내 이름을 안다', weights: { scale: -2, pace: 1 } },
      { label: '서른 명쯤. 적당히 묻히고 적당히 참여한다', weights: { scale: -1, orientation: -1 } },
      { label: '200명 대형 강의. 다양한 사람 구경하는 맛이 있다', weights: { scale: 1, setting: -1 } },
      { label: '수업마다 사람이 싹 달라서 매번 새로 만난다', weights: { scale: 2, community: 1 } },
    ],
  },
  {
    id: 'q5',
    primary: 'pace',
    text: '팀 프로젝트에서 나는',
    options: [
      { label: '내가 제일 잘하고 싶다. 결과가 눈에 보여야 한다', weights: { pace: -2, orientation: 1 } },
      { label: '잘하는 사람 옆에 붙어서 같이 수준을 올린다', weights: { pace: -1, scale: 1 } },
      { label: '마감은 지키되 서로 감정 상하지 않게 조율한다', weights: { pace: 1, community: -1 } },
      { label: '다 같이 잘 되는 게 제일 좋다. 점수는 그다음', weights: { pace: 2, field: -1 } },
    ],
  },
  {
    id: 'q6',
    primary: 'community',
    text: '학교 응원전이나 축제 같은 전통 행사에 대해 나는',
    options: [
      { label: '무조건 간다. 이런 게 대학 다니는 맛이다', weights: { community: -2, setting: 1 } },
      { label: '친한 애들이 가면 나도 간다', weights: { community: -1, scale: -1 } },
      { label: '한 번쯤은 가보는데 매년 챙기지는 않는다', weights: { community: 1, orientation: 1 } },
      { label: '그 시간에 내 일정을 소화한다', weights: { community: 2, setting: -1 } },
    ],
  },
  {
    id: 'q7',
    primary: 'field',
    text: '밤새 봐도 안 지겨울 것 같은 건',
    options: [
      { label: '소설, 영화, 다큐. 결국 사람 이야기', weights: { field: -2, orientation: -1 } },
      { label: '그림, 음악, 무대. 뭔가 표현하는 것', weights: { field: -1, pace: 1 } },
      { label: '데이터랑 그래프. 왜 이렇게 되는지', weights: { field: 1, orientation: -1 } },
      { label: '직접 조립하고 코딩해서 굴러가게 만드는 것', weights: { field: 2, orientation: 1 } },
    ],
  },
  {
    id: 'q8',
    primary: 'curriculum',
    text: '전공 상관없이 전교생이 똑같이 듣는 고전 읽기 수업이 있다면',
    options: [
      { label: '왜 내 시간을 거기에 써야 하는지 모르겠다', weights: { curriculum: -2, orientation: 1 } },
      { label: '필수 말고 선택이면 들어볼 수도 있다', weights: { curriculum: -1, pace: 1 } },
      { label: '평생 안 읽었을 책을 읽게 되니 나쁘지 않다', weights: { curriculum: 1, field: -1 } },
      { label: '다 같이 같은 걸 읽는다는 게 오히려 좋다', weights: { curriculum: 2, scale: 1 } },
    ],
  },
  {
    id: 'q9',
    primary: 'orientation',
    text: '방학 3개월이 통으로 비었다. 나는',
    options: [
      { label: '인턴에 지원한다. 실무를 겪어봐야 안다', weights: { orientation: 2, pace: -1 } },
      { label: '관심 있는 주제를 혼자 끝까지 파본다', weights: { orientation: -2, scale: -1 } },
      { label: '뭐가 됐든 남는 결과물 하나는 만든다', weights: { orientation: 1, community: 1 } },
      { label: '여행 가고 사람 만나면서 경험을 넓힌다', weights: { orientation: -1, setting: 1 } },
    ],
  },
  {
    id: 'q10',
    primary: 'setting',
    text: '앞으로 4년 동안 살 동네를 고른다면',
    options: [
      { label: '새벽에도 뭐든 열려 있는 대도시', weights: { setting: -2, community: 1 } },
      { label: '학교랑 도시가 적당히 섞여 있는 곳', weights: { setting: -1, pace: -1 } },
      { label: '학교가 곧 동네인 조용한 캠퍼스타운', weights: { setting: 1, community: -1 } },
      { label: '창밖에 나무랑 강이 보이는 곳', weights: { setting: 2, pace: 1 } },
    ],
  },
  {
    id: 'q11',
    primary: 'scale',
    text: '동아리를 고를 때 나는',
    options: [
      { label: '소수정예로 오래 갈 사람들을 만나는 곳', weights: { scale: -2, community: -1 } },
      { label: '하나만 제대로, 대신 깊게 하는 곳', weights: { scale: -1, orientation: -1 } },
      { label: '여러 개 걸쳐두고 상황 따라 움직이는 편', weights: { scale: 1, curriculum: -1 } },
      { label: '규모 크고 매년 사람이 바뀌는 곳', weights: { scale: 2, setting: -1 } },
    ],
  },
  {
    id: 'q12',
    primary: 'pace',
    text: '주변에 나보다 잘하는 사람이 많을 때',
    options: [
      { label: '자극받아서 나도 더 한다', weights: { pace: -2, scale: 1 } },
      { label: '좀 위축되긴 하는데 결국 배우게 된다', weights: { pace: -1, field: 1 } },
      { label: '그 사람들이랑 친해져서 같이 한다', weights: { pace: 1, community: -1 } },
      { label: '비교하지 않으려 한다. 나는 내 속도가 있다', weights: { pace: 2, curriculum: -1 } },
    ],
  },
  {
    id: 'q13',
    primary: 'community',
    text: '졸업하고 10년 뒤, 학교와 나의 관계는',
    options: [
      { label: '동문 모임 챙기고 후배들도 끌어준다', weights: { community: -2, scale: -1 } },
      { label: '친했던 몇 명하고만 계속 연락한다', weights: { community: -1, pace: 1 } },
      { label: '필요할 때 네트워크로 잘 활용한다', weights: { community: 1, scale: 1 } },
      { label: '학교보다는 내가 하는 일로 사람을 만난다', weights: { community: 2, orientation: 1 } },
    ],
  },
  {
    id: 'q14',
    primary: 'field',
    text: '어려운 문제를 만났을 때 내 첫 동작은',
    options: [
      { label: '이 문제에 대해 사람들이 뭐라고 했는지부터 읽는다', weights: { field: -2, orientation: -1 } },
      { label: '일단 내 생각을 글로 정리해본다', weights: { field: -1, curriculum: -1 } },
      { label: '일단 만들어보고 안 되면 고친다', weights: { field: 1, orientation: 1 } },
      { label: '숫자로 바꿔서 계산해본다', weights: { field: 2, orientation: -1 } },
    ],
  },
  {
    id: 'q15',
    primary: 'curriculum',
    text: "'이건 원래 이렇게 하는 거야'라는 말 앞에서 나는",
    options: [
      { label: '납득이 안 되면 안 따른다', weights: { curriculum: -2, community: 1 } },
      { label: '적당히 지키되 결국 내 방식대로 튼다', weights: { curriculum: -1, field: 1 } },
      { label: '일단 따라해보고 나중에 판단한다', weights: { curriculum: 1, pace: -1 } },
      { label: '정해진 게 있으면 오히려 마음이 편하다', weights: { curriculum: 2, scale: 1 } },
    ],
  },
  {
    id: 'q16',
    primary: 'orientation',
    text: '지금까지 들었던 수업 중 가장 만족스러웠던 건',
    options: [
      { label: '답이 없는 질문을 갖고 끝까지 토론한 수업', weights: { orientation: -2, field: -1 } },
      { label: '실제 회사나 시장 사례를 뜯어본 수업', weights: { orientation: 2, scale: 1 } },
      { label: '이론이 딱 맞아떨어지는 순간을 본 수업', weights: { orientation: -1, field: 1 } },
      { label: '뭔가를 직접 만들어서 제출한 수업', weights: { orientation: 1, curriculum: -1 } },
    ],
  },
  {
    id: 'q17',
    primary: 'setting',
    text: '겨울에 눈이 아주 많이 오는 곳이라면',
    options: [
      { label: '눈보다는 사람 많고 불빛 많은 쪽이 좋다', weights: { setting: -2, scale: 1 } },
      { label: '별로다. 건물끼리 실내로 이어졌으면 좋겠다', weights: { setting: -1, pace: -1 } },
      { label: '춥긴 해도 실내에서 잘 지내면 된다', weights: { setting: 1, scale: -1 } },
      { label: '낭만적이다. 눈 쌓인 캠퍼스 좋아한다', weights: { setting: 2, community: -1 } },
    ],
  },
  {
    id: 'q18',
    primary: 'pace',
    text: "'잘 살았다'는 말을 들으면 떠오르는 건",
    options: [
      { label: '누가 봐도 인정하는 자리에 올라간 것', weights: { pace: -2, community: 1 } },
      { label: '내 분야에서 실력으로 증명해낸 것', weights: { pace: -1, field: 1 } },
      { label: '좋은 사람들이랑 오래 같이 해온 것', weights: { pace: 1, community: -1 } },
      { label: '하루하루가 나한테 만족스러웠던 것', weights: { pace: 2, setting: 1 } },
    ],
  },
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QUESTIONS: QUESTIONS };
}
