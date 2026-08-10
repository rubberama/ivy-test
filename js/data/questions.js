/**
 * 18개 질문 (학생용 / 학부모용)
 *
 * text 와 label 은 { student, parent } 두 벌이지만 weights 는 하나만 둔다.
 * 두 모드가 같은 가중치를 공유해야 채점 결과가 같은 기준으로 나오고,
 * 검증(scripts/check-reachability.js)도 한 번만 돌리면 된다.
 * 문구를 모드별로 따로 두되 가중치를 따로 두지 말 것.
 *
 * 학생용은 "나는 ~한다", 학부모용은 "아이가 ~해요" 로 쓴다.
 * 학부모가 답하는 건 부모 자신의 성향이 아니라 아이를 관찰한 내용이다.
 * 학교를 아이에게 맞추는 게 목적이지 부모 취향에 맞추는 게 아니기 때문이다.
 *
 * 각 문항은 1개의 주축(primary)을 -2 / -1 / +1 / +2 로 훑고,
 * 보조축을 ±1 로 얹는다. 선택지 순서에는 의미가 없다.
 *
 * 주축 배분: curriculum 3 · orientation 3 · setting 3 ·
 *            scale 2 · pace 3 · community 2 · field 2  = 18
 *
 * 성적·시험·스펙을 묻는 문항은 의도적으로 하나도 없다.
 * 이건 성향 매칭이지 합격 예측이 아니다.
 */
const QUESTIONS = [
  {
    id: 'q1',
    primary: 'curriculum',
    text: {
      student: '개강 첫 주, 시간표를 짜는 나는',
      parent: '아이가 무엇을 배울지 정할 때 보면',
    },
    options: [
      {
        label: {
          student: '듣고 싶은 것만 골라 담는다. 필수 과목이란 게 없었으면 좋겠다',
          parent: '관심 가는 것만 골라서 파요. 정해진 틀을 답답해합니다',
        },
        weights: { curriculum: -2, community: 1 },
      },
      {
        label: {
          student: '학교가 정해준 필수부터 채우고 남는 자리를 고른다',
          parent: '학교가 정해준 순서대로 따라가는 걸 편해합니다',
        },
        weights: { curriculum: 2, pace: -1 },
      },
      {
        label: {
          student: '전공 로드맵 순서대로 착실히 밟는다',
          parent: '목표가 정해지면 필요한 걸 차근차근 밟아갑니다',
        },
        weights: { curriculum: 1, orientation: 1 },
      },
      {
        label: {
          student: '관심 가는 분야를 일단 여기저기 찔러본다',
          parent: '이것저것 넓게 건드려보는 편입니다',
        },
        weights: { curriculum: -1, scale: 1 },
      },
    ],
  },
  {
    id: 'q2',
    primary: 'orientation',
    text: {
      student: '전공을 고를 때 가장 먼저 떠오르는 생각은',
      parent: '아이가 진로 이야기를 할 때 기준은',
    },
    options: [
      {
        label: {
          student: '이거 진짜 재밌겠다',
          parent: '재밌겠다는 말이 먼저 나옵니다',
        },
        weights: { orientation: -2, field: -1 },
      },
      {
        label: {
          student: '졸업하고 뭘 하게 되는지가 분명하다',
          parent: '졸업하고 뭘 할 수 있는지를 먼저 따집니다',
        },
        weights: { orientation: 2, pace: -1 },
      },
      {
        label: {
          student: '아직 모르겠고 일단 넓게 배우고 싶다',
          parent: '아직 모르겠다며 여러 가능성을 열어둡니다',
        },
        weights: { orientation: -1, scale: 1 },
      },
      {
        label: {
          student: '배운 걸 바로 써먹을 수 있는 게 좋다',
          parent: '배운 걸 바로 써먹는 걸 좋아합니다',
        },
        weights: { orientation: 1, field: 1 },
      },
    ],
  },
  {
    id: 'q3',
    primary: 'setting',
    text: {
      student: '수업 없는 토요일, 내 기본값은',
      parent: '아이가 쉬는 날 주로 하는 것은',
    },
    options: [
      {
        label: {
          student: '지하철 타고 시내 한복판으로 나간다',
          parent: '시내로 나가서 사람 많은 곳을 돌아다닙니다',
        },
        weights: { setting: -2, community: 1 },
      },
      {
        label: {
          student: '도시는 도시인데 조용한 동네 카페에 있는다',
          parent: '도시 안에서도 조용한 자리를 찾아갑니다',
        },
        weights: { setting: -1, pace: 1 },
      },
      {
        label: {
          student: '학교랑 붙어 있는 동네에서 소소하게 보낸다',
          parent: '집이나 동네 근처에서 소소하게 보냅니다',
        },
        weights: { setting: 1, scale: -1 },
      },
      {
        label: {
          student: '산이든 강이든 자연 있는 데로 나간다',
          parent: '산이든 바다든 자연 있는 곳을 좋아합니다',
        },
        weights: { setting: 2, community: -1 },
      },
    ],
  },
  {
    id: 'q4',
    primary: 'scale',
    text: {
      student: '새 학기 첫 수업, 강의실에 들어갔을 때 마음이 편한 쪽은',
      parent: '아이가 편해하는 교실 분위기는',
    },
    options: [
      {
        label: {
          student: '열댓 명. 교수님이 내 이름을 안다',
          parent: '인원이 적어서 선생님이 이름을 아는 곳',
        },
        weights: { scale: -2, pace: 1 },
      },
      {
        label: {
          student: '서른 명쯤. 적당히 묻히고 적당히 참여한다',
          parent: '적당한 인원에서 적당히 참여하는 곳',
        },
        weights: { scale: -1, orientation: -1 },
      },
      {
        label: {
          student: '200명 대형 강의. 다양한 사람 구경하는 맛이 있다',
          parent: '사람 많은 큰 강의실도 아무렇지 않아 합니다',
        },
        weights: { scale: 1, setting: -1 },
      },
      {
        label: {
          student: '수업마다 사람이 싹 달라서 매번 새로 만난다',
          parent: '매번 새로운 사람을 만나는 걸 즐깁니다',
        },
        weights: { scale: 2, community: 1 },
      },
    ],
  },
  {
    id: 'q5',
    primary: 'pace',
    text: {
      student: '팀 프로젝트에서 나는',
      parent: '조별 과제를 할 때 아이는',
    },
    options: [
      {
        label: {
          student: '내가 제일 잘하고 싶다. 결과가 눈에 보여야 한다',
          parent: '본인이 제일 잘하고 싶어 합니다',
        },
        weights: { pace: -2, orientation: 1 },
      },
      {
        label: {
          student: '잘하는 사람 옆에 붙어서 같이 수준을 올린다',
          parent: '잘하는 친구 옆에서 같이 수준을 올립니다',
        },
        weights: { pace: -1, scale: 1 },
      },
      {
        label: {
          student: '마감은 지키되 서로 감정 상하지 않게 조율한다',
          parent: '마감은 지키되 서로 감정 상하지 않게 조율합니다',
        },
        weights: { pace: 1, community: -1 },
      },
      {
        label: {
          student: '다 같이 잘 되는 게 제일 좋다. 점수는 그다음',
          parent: '다 같이 잘 되는 걸 더 중요하게 여깁니다',
        },
        weights: { pace: 2, field: -1 },
      },
    ],
  },
  {
    id: 'q6',
    primary: 'community',
    text: {
      student: '학교 응원전이나 축제 같은 전통 행사에 대해 나는',
      parent: '학교 행사나 단체 활동에 대해 아이는',
    },
    options: [
      {
        label: {
          student: '무조건 간다. 이런 게 대학 다니는 맛이다',
          parent: '빠지지 않고 챙깁니다. 그런 데서 힘을 얻습니다',
        },
        weights: { community: -2, setting: 1 },
      },
      {
        label: {
          student: '친한 애들이 가면 나도 간다',
          parent: '친한 친구들이 가면 같이 갑니다',
        },
        weights: { community: -1, scale: -1 },
      },
      {
        label: {
          student: '한 번쯤은 가보는데 매년 챙기지는 않는다',
          parent: '한 번쯤 가보지만 매번 챙기지는 않습니다',
        },
        weights: { community: 1, orientation: 1 },
      },
      {
        label: {
          student: '그 시간에 내 일정을 소화한다',
          parent: '그 시간에 자기 할 일을 합니다',
        },
        weights: { community: 2, setting: -1 },
      },
    ],
  },
  {
    id: 'q7',
    primary: 'field',
    text: {
      student: '밤새 봐도 안 지겨울 것 같은 건',
      parent: '아이가 시간 가는 줄 모르고 보는 것은',
    },
    options: [
      {
        label: {
          student: '소설, 영화, 다큐. 결국 사람 이야기',
          parent: '소설, 영화, 결국 사람 이야기',
        },
        weights: { field: -2, orientation: -1 },
      },
      {
        label: {
          student: '그림, 음악, 무대. 뭔가 표현하는 것',
          parent: '그림, 음악처럼 뭔가 표현하는 것',
        },
        weights: { field: -1, pace: 1 },
      },
      {
        label: {
          student: '데이터랑 그래프. 왜 이렇게 되는지',
          parent: '숫자나 자료에서 규칙을 찾아내는 것',
        },
        weights: { field: 1, orientation: -1 },
      },
      {
        label: {
          student: '직접 조립하고 코딩해서 굴러가게 만드는 것',
          parent: '직접 만들고 코딩해서 굴러가게 하는 것',
        },
        weights: { field: 2, orientation: 1 },
      },
    ],
  },
  {
    id: 'q8',
    primary: 'curriculum',
    text: {
      student: '전공 상관없이 전교생이 똑같이 듣는 고전 읽기 수업이 있다면',
      parent: '전교생이 똑같이 듣는 고전 읽기 필수 수업이 있다면 아이는',
    },
    options: [
      {
        label: {
          student: '왜 내 시간을 거기에 써야 하는지 모르겠다',
          parent: '왜 그걸 해야 하냐고 할 것 같습니다',
        },
        weights: { curriculum: -2, orientation: 1 },
      },
      {
        label: {
          student: '필수 말고 선택이면 들어볼 수도 있다',
          parent: '필수만 아니면 들어볼 것 같습니다',
        },
        weights: { curriculum: -1, pace: 1 },
      },
      {
        label: {
          student: '평생 안 읽었을 책을 읽게 되니 나쁘지 않다',
          parent: '평생 안 읽었을 책을 읽게 되니 좋아할 것 같습니다',
        },
        weights: { curriculum: 1, field: -1 },
      },
      {
        label: {
          student: '다 같이 같은 걸 읽는다는 게 오히려 좋다',
          parent: '다 같이 같은 걸 읽는 걸 오히려 좋아할 것 같습니다',
        },
        weights: { curriculum: 2, scale: 1 },
      },
    ],
  },
  {
    id: 'q9',
    primary: 'orientation',
    text: {
      student: '방학 3개월이 통으로 비었다. 나는',
      parent: '방학이 통으로 비면 아이는',
    },
    options: [
      {
        label: {
          student: '인턴에 지원한다. 실무를 겪어봐야 안다',
          parent: '인턴이든 실무든 경험할 자리를 찾습니다',
        },
        weights: { orientation: 2, pace: -1 },
      },
      {
        label: {
          student: '관심 있는 주제를 혼자 끝까지 파본다',
          parent: '관심 있는 주제를 혼자 끝까지 팝니다',
        },
        weights: { orientation: -2, scale: -1 },
      },
      {
        label: {
          student: '뭐가 됐든 남는 결과물 하나는 만든다',
          parent: '뭐가 됐든 남는 결과물을 하나 만듭니다',
        },
        weights: { orientation: 1, community: 1 },
      },
      {
        label: {
          student: '여행 가고 사람 만나면서 경험을 넓힌다',
          parent: '여행하고 사람 만나며 경험을 넓힙니다',
        },
        weights: { orientation: -1, setting: 1 },
      },
    ],
  },
  {
    id: 'q10',
    primary: 'setting',
    text: {
      student: '앞으로 4년 동안 살 동네를 고른다면',
      parent: '아이가 4년을 지낼 동네를 고른다면',
    },
    options: [
      {
        label: {
          student: '새벽에도 뭐든 열려 있는 대도시',
          parent: '새벽에도 뭐든 열려 있는 대도시',
        },
        weights: { setting: -2, community: 1 },
      },
      {
        label: {
          student: '학교랑 도시가 적당히 섞여 있는 곳',
          parent: '학교와 도시가 적당히 섞여 있는 곳',
        },
        weights: { setting: -1, pace: -1 },
      },
      {
        label: {
          student: '학교가 곧 동네인 조용한 캠퍼스타운',
          parent: '학교가 곧 동네인 조용한 캠퍼스타운',
        },
        weights: { setting: 1, community: -1 },
      },
      {
        label: {
          student: '창밖에 나무랑 강이 보이는 곳',
          parent: '창밖에 나무와 강이 보이는 곳',
        },
        weights: { setting: 2, pace: 1 },
      },
    ],
  },
  {
    id: 'q11',
    primary: 'scale',
    text: {
      student: '동아리를 고를 때 나는',
      parent: '아이가 모임이나 동아리를 고를 때는',
    },
    options: [
      {
        label: {
          student: '소수정예로 오래 갈 사람들을 만나는 곳',
          parent: '소수라도 오래 갈 사람들을 만나는 곳',
        },
        weights: { scale: -2, community: -1 },
      },
      {
        label: {
          student: '하나만 제대로, 대신 깊게 하는 곳',
          parent: '하나만 제대로, 대신 깊게 하는 곳',
        },
        weights: { scale: -1, orientation: -1 },
      },
      {
        label: {
          student: '여러 개 걸쳐두고 상황 따라 움직이는 편',
          parent: '여러 개 걸쳐두고 상황 따라 움직입니다',
        },
        weights: { scale: 1, curriculum: -1 },
      },
      {
        label: {
          student: '규모 크고 매년 사람이 바뀌는 곳',
          parent: '규모가 크고 사람이 계속 바뀌는 곳',
        },
        weights: { scale: 2, setting: -1 },
      },
    ],
  },
  {
    id: 'q12',
    primary: 'pace',
    text: {
      student: '주변에 나보다 잘하는 사람이 많을 때',
      parent: '주변에 아이보다 잘하는 친구가 많을 때',
    },
    options: [
      {
        label: {
          student: '자극받아서 나도 더 한다',
          parent: '자극받아서 더 열심히 합니다',
        },
        weights: { pace: -2, scale: 1 },
      },
      {
        label: {
          student: '좀 위축되긴 하는데 결국 배우게 된다',
          parent: '좀 위축되긴 해도 결국 배웁니다',
        },
        weights: { pace: -1, field: 1 },
      },
      {
        label: {
          student: '그 사람들이랑 친해져서 같이 한다',
          parent: '그 친구들과 친해져서 같이 합니다',
        },
        weights: { pace: 1, community: -1 },
      },
      {
        label: {
          student: '비교하지 않으려 한다. 나는 내 속도가 있다',
          parent: '비교하지 않고 자기 속도대로 갑니다',
        },
        weights: { pace: 2, curriculum: -1 },
      },
    ],
  },
  {
    id: 'q13',
    primary: 'community',
    text: {
      student: '졸업하고 10년 뒤, 학교와 나의 관계는',
      parent: '아이가 졸업하고 10년 뒤, 학교와의 관계는',
    },
    options: [
      {
        label: {
          student: '동문 모임 챙기고 후배들도 끌어준다',
          parent: '동문 모임을 챙기고 후배도 끌어줄 것 같습니다',
        },
        weights: { community: -2, scale: -1 },
      },
      {
        label: {
          student: '친했던 몇 명하고만 계속 연락한다',
          parent: '친했던 몇 명하고만 계속 연락할 것 같습니다',
        },
        weights: { community: -1, pace: 1 },
      },
      {
        label: {
          student: '필요할 때 네트워크로 잘 활용한다',
          parent: '필요할 때 네트워크로 잘 쓸 것 같습니다',
        },
        weights: { community: 1, scale: 1 },
      },
      {
        label: {
          student: '학교보다는 내가 하는 일로 사람을 만난다',
          parent: '학교보다는 자기 일로 사람을 만날 것 같습니다',
        },
        weights: { community: 2, orientation: 1 },
      },
    ],
  },
  {
    id: 'q14',
    primary: 'field',
    text: {
      student: '어려운 문제를 만났을 때 내 첫 동작은',
      parent: '아이가 어려운 문제를 만나면 먼저 하는 것은',
    },
    options: [
      {
        label: {
          student: '이 문제에 대해 사람들이 뭐라고 했는지부터 읽는다',
          parent: '관련된 글부터 찾아 읽습니다',
        },
        weights: { field: -2, orientation: -1 },
      },
      {
        label: {
          student: '일단 내 생각을 글로 정리해본다',
          parent: '자기 생각을 글로 정리해봅니다',
        },
        weights: { field: -1, curriculum: -1 },
      },
      {
        label: {
          student: '일단 만들어보고 안 되면 고친다',
          parent: '일단 만들어보고 안 되면 고칩니다',
        },
        weights: { field: 1, orientation: 1 },
      },
      {
        label: {
          student: '숫자로 바꿔서 계산해본다',
          parent: '숫자로 바꿔서 계산해봅니다',
        },
        weights: { field: 2, orientation: -1 },
      },
    ],
  },
  {
    id: 'q15',
    primary: 'curriculum',
    text: {
      student: "'이건 원래 이렇게 하는 거야'라는 말 앞에서 나는",
      parent: "'원래 이렇게 하는 거야'라는 말에 아이는",
    },
    options: [
      {
        label: {
          student: '납득이 안 되면 안 따른다',
          parent: '납득이 안 되면 안 따릅니다',
        },
        weights: { curriculum: -2, community: 1 },
      },
      {
        label: {
          student: '적당히 지키되 결국 내 방식대로 튼다',
          parent: '적당히 지키다가 결국 자기 방식대로 합니다',
        },
        weights: { curriculum: -1, field: 1 },
      },
      {
        label: {
          student: '일단 따라해보고 나중에 판단한다',
          parent: '일단 따라해보고 나중에 판단합니다',
        },
        weights: { curriculum: 1, pace: -1 },
      },
      {
        label: {
          student: '정해진 게 있으면 오히려 마음이 편하다',
          parent: '정해진 게 있으면 오히려 편해합니다',
        },
        weights: { curriculum: 2, scale: 1 },
      },
    ],
  },
  {
    id: 'q16',
    primary: 'orientation',
    text: {
      student: '지금까지 들었던 수업 중 가장 만족스러웠던 건',
      parent: '아이가 가장 재밌어했던 수업은',
    },
    options: [
      {
        label: {
          student: '답이 없는 질문을 갖고 끝까지 토론한 수업',
          parent: '답이 없는 질문을 끝까지 토론한 수업',
        },
        weights: { orientation: -2, field: -1 },
      },
      {
        label: {
          student: '실제 회사나 시장 사례를 뜯어본 수업',
          parent: '실제 회사나 시장 사례를 뜯어본 수업',
        },
        weights: { orientation: 2, scale: 1 },
      },
      {
        label: {
          student: '이론이 딱 맞아떨어지는 순간을 본 수업',
          parent: '이론이 딱 맞아떨어지는 걸 본 수업',
        },
        weights: { orientation: -1, field: 1 },
      },
      {
        label: {
          student: '뭔가를 직접 만들어서 제출한 수업',
          parent: '뭔가를 직접 만들어서 제출한 수업',
        },
        weights: { orientation: 1, curriculum: -1 },
      },
    ],
  },
  {
    id: 'q17',
    primary: 'setting',
    text: {
      student: '겨울에 눈이 아주 많이 오는 곳이라면',
      parent: '눈이 아주 많이 오는 추운 곳이라면 아이는',
    },
    options: [
      {
        label: {
          student: '눈보다는 사람 많고 불빛 많은 쪽이 좋다',
          parent: '눈보다 사람 많고 불빛 많은 쪽을 좋아합니다',
        },
        weights: { setting: -2, scale: 1 },
      },
      {
        label: {
          student: '별로다. 건물끼리 실내로 이어졌으면 좋겠다',
          parent: '추운 걸 싫어합니다. 실내로 이어지면 좋겠다고 할 겁니다',
        },
        weights: { setting: -1, pace: -1 },
      },
      {
        label: {
          student: '춥긴 해도 실내에서 잘 지내면 된다',
          parent: '춥긴 해도 실내에서 잘 지냅니다',
        },
        weights: { setting: 1, scale: -1 },
      },
      {
        label: {
          student: '낭만적이다. 눈 쌓인 캠퍼스 좋아한다',
          parent: '눈 쌓인 풍경을 좋아합니다',
        },
        weights: { setting: 2, community: -1 },
      },
    ],
  },
  {
    id: 'q18',
    primary: 'pace',
    text: {
      student: "'잘 살았다'는 말을 들으면 떠오르는 건",
      parent: '아이가 어떻게 살았으면 하시나요',
    },
    options: [
      {
        label: {
          student: '누가 봐도 인정하는 자리에 올라간 것',
          parent: '누가 봐도 인정하는 자리에 올라갔으면',
        },
        weights: { pace: -2, community: 1 },
      },
      {
        label: {
          student: '내 분야에서 실력으로 증명해낸 것',
          parent: '자기 분야에서 실력으로 증명했으면',
        },
        weights: { pace: -1, field: 1 },
      },
      {
        label: {
          student: '좋은 사람들이랑 오래 같이 해온 것',
          parent: '좋은 사람들과 오래 함께했으면',
        },
        weights: { pace: 1, community: -1 },
      },
      {
        label: {
          student: '하루하루가 나한테 만족스러웠던 것',
          parent: '하루하루가 본인에게 만족스러웠으면',
        },
        weights: { pace: 2, setting: 1 },
      },
    ],
  },
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QUESTIONS: QUESTIONS };
}
