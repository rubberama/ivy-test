/**
 * 한국 대학 버전 — 성향 축 11개
 *
 * 아이비 버전은 7개였다. 학교가 8곳에서 30곳으로 늘면서 축이 모자라
 * 여러 학교가 벡터 공간의 같은 자리에 겹쳤다. 조사 단계의 8축으로는
 * 과기원 4곳이 코사인 0.97~0.99 로 사실상 한 학교였다.
 *
 * 그래서 세 가지를 했다.
 *   1) 두 가지가 섞여 있던 축을 쪼갰다 (culture -> bond + legacy).
 *      포스텍은 관계가 초밀착인데 전통은 얕다. 한 축에 두면 표현이 안 된다.
 *   2) 30곳을 가르는 데 필요한 축을 새로 넣었다 (immersion, making).
 *      서울 소재만 17곳이라 거리 축만으로는 서울 안이 통째로 뭉개진다.
 *   3) 축 이름에 우열이 실리지 않게 다시 지었다. 한국에서 대학 30곳에
 *      점수를 매기면 곧바로 서열로 읽히기 때문에, '성취 압력'처럼
 *      한쪽이 우월해 보이는 이름을 전부 버렸다.
 *
 * neg 가 음수 쪽, pos 가 양수 쪽이다. 둘 사이에 우열은 없다.
 *
 * negShort / posShort 는 그래프 양끝 라벨이면서 결과 근거 문장에
 * "OO 쪽으로 기울었어요" 형태로 그대로 들어간다. 그래서 관형사형
 * ('독립적' 같은)이 아니라 온전한 명사구여야 한다. 아이비 버전에서
 * '독립적 쪽으로'가 되어 문장이 깨진 적이 있다.
 */
const AXES_ALL = [
  {
    id: 'distance',
    name: '거리',
    neg: '집에서 다닐 수 있는 곳',
    pos: '집을 떠나 옮겨가는 곳',
    negShort: '집 가까이',
    posShort: '멀리 떠나',
  },
  {
    id: 'immersion',
    name: '생활 무대',
    neg: '학교 밖 도시가 절반',
    pos: '학교가 곧 생활권',
    negShort: '도시형',
    posShort: '캠퍼스형',
  },
  {
    id: 'scale',
    name: '규모',
    neg: '서로 다 아는 사이',
    pos: '모르는 얼굴이 계속',
    negShort: '소수정예',
    posShort: '대규모',
  },
  {
    id: 'bond',
    name: '관계 밀도',
    neg: '각자 알아서',
    pos: '계속 엮이는 사이',
    negShort: '개인주의',
    posShort: '공동체',
  },
  {
    id: 'legacy',
    name: '역사의 무게',
    neg: '아직 만들어지는 중',
    pos: '쌓인 계보 위에',
    negShort: '신생·실험',
    posShort: '전통·계보',
  },
  {
    id: 'horizon',
    name: '졸업 이후',
    neg: '질문을 붙잡는 쪽',
    pos: '일로 나가는 쪽',
    negShort: '연구·학문',
    posShort: '실무·취업',
  },
  {
    id: 'domain',
    name: '다루는 대상',
    neg: '언어·사회·사람',
    pos: '수식·기계·물질',
    negShort: '인문·사회',
    posShort: '이공·기술',
  },
  {
    id: 'making',
    name: '내놓는 것',
    neg: '읽고 따져서 낸 결론',
    pos: '손으로 만든 결과물',
    negShort: '분석·논증',
    posShort: '제작·창작',
  },
  {
    id: 'openness',
    name: '전공 선택',
    neg: '입학할 때 정해진다',
    pos: '나중에 고르거나 얹는다',
    negShort: '학과 고정',
    posShort: '전공 자유',
  },
  {
    id: 'intensity',
    name: '생활 리듬',
    neg: '여러 개를 벌여놓고',
    pos: '하나에 갈아 넣고',
    negShort: '균형·여유',
    posShort: '고강도 몰입',
  },
  /**
   * cost 는 성향이 아니라 제약이다. 그래서 코사인에서 뺀다.
   *
   * 다른 축과 같이 넣으면 distance 와 상관이 생겨서(집에서 멀리 가겠다는
   * 답만으로 저비용 학교가 끌려온다) 가짜 매칭이 나온다. 더 중요한 건,
   * "학비가 부담된다"고 답한 사람에게 국공립만 골라 보여주는 결과는
   * 성향 매칭이 아니라 형편 분류로 읽힌다는 점이다.
   *
   * 값은 매기되 순위 계산에는 쓰지 않고, 결과를 보여줄 때 참고 정보로만 쓴다.
   * COSINE_AXES 에서 빠져 있는 것이 그 뜻이다.
   */
  {
    id: 'cost',
    name: '비용 부담',
    neg: '학비가 선택 기준은 아니다',
    pos: '학비가 선택지를 좌우한다',
    negShort: '비용 비민감',
    posShort: '비용 민감',
    excludeFromMatch: true,
  },
];

/**
 * 엔진(js/scoring.js)은 AXES[k] 와 AXIS_IDS[k] 가 같은 축이라고 보고 인덱스로
 * 짝을 짓는다. 그래서 매칭에 쓰는 축만 담은 AXES 를 따로 만들어 넘긴다.
 * cost 를 AXES 에 남겨두고 AXIS_IDS 에서만 빼면 그 순간 축이 어긋난다.
 */
const AXES = AXES_ALL.filter(function (a) { return !a.excludeFromMatch; });
const AXIS_IDS = AXES.map(function (a) { return a.id; });

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AXES: AXES, AXIS_IDS: AXIS_IDS, AXES_ALL: AXES_ALL };
}
