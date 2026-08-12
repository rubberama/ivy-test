/**
 * 한국 대학 30곳 성향 프로필
 *
 * vector 의 각 값은 -2 ~ +2. korea/axes.js 의 축 id 를 키로 쓴다.
 * "좋다/나쁘다"가 아니라 "어느 쪽 성향이냐"만 나타낸다.
 *
 * ── 이 값들이 어디서 왔는가 ────────────────────────────────────
 * docs/korea-fact-check.md 에 30곳 전부의 확인 결과가 있다.
 * 축은 그 확인된 사실에서만 뽑았고, 산정 기준은 아래에 적어둔 대로
 * 30곳에 똑같이 적용했다. 값을 먼저 정하고 근거를 나중에 붙이지 않았다 —
 * 조사 단계에서 그렇게 했다가 인하대(2만명대로 잘못 추정) 같은 오류가 났다.
 *
 * scaleBasis 는 규모를 무엇으로 정했는지다.
 *   '확인'   검색으로 학부 재학생 수가 확인됐다
 *   '환산'   연간 모집인원 × 4 로 환산했다 (휴학 때문에 과소추정 쪽이다)
 *   '구간'   "2만~2.5만" 처럼 구간만 확인됐다
 *   '추정'   확인 실패. 버킷만 잡았고 화면에 숫자를 쓰지 않는다
 *
 * ── 축 산정 기준 (30곳 공통) ──────────────────────────────────
 * scale      학부 재학생 수 순위를 -2 ~ +2 구간에 고르게 편다.
 *            인원 자체를 그대로 쓰지 않는 이유는 분포가 한쪽으로 몰려 있어서다 —
 *            30곳 중 절반이 1만~2만 명대라, 인원을 그대로 축에 넣으면 그 절반이
 *            한 덩어리가 되어 서로 안 갈린다. 순위로 펴면 "이 학교가 다른 곳보다
 *            큰가 작은가"라는 실제로 묻고 싶은 것에 값이 대응한다.
 *            확인된 인원은 15곳이고 나머지는 순위를 매기기 위한 추정이다.
 *            추정치는 화면에 숫자로 쓰지 않는다(scaleBasis 참고).
 * distance   서울·수도권 통학권이면 음수, 이주가 필요하면 양수.
 *            지역명이 아니라 "집을 떠나야 하는가"로 매긴다. 그래야 결과가
 *            지역 서열로 안 읽힌다.
 * immersion  기숙사 의무 거주와 캠퍼스 주변 상권으로 매긴다.
 * openness   무전공 규모(모집인원 대비 비율)와 선택 제한 여부로 매긴다.
 *            2025년부터 전 대학이 무전공을 도입해서 "있다/없다"로는 변별이
 *            안 된다. 제한 없이 고를 수 있는지가 실제 차이다.
 * horizon    취업률로 매기지 않는다. 30곳의 취업률이 산출 기준과 연도가
 *            제각각이라 비교가 성립하지 않는다(같은 서울대가 42.7% 와 71%
 *            둘 다로 보도된다). 제도로만 매긴다 — 과기원·연구중심 여부,
 *            계약학과·창업 트랙 유무, 전문직 자격 학과 보유 여부.
 * cost       설립 유형으로 구간을 잡고 특수 지원(과기원 전액 등)을 반영한다.
 *            실제 등록금은 15곳만 확인돼서 유형 기반이 차선이다.
 *
 * ── 상징색을 쓰지 않는 이유 ───────────────────────────────────
 * 조사에서 나온 색은 30곳 전부 추정치였고 확인 경로가 없었다. 건국대는
 * 새 UI 메인이 "헤리티지 그린"인 것까지 찾았지만 공식 HEX 는 UI매뉴얼
 * 페이지가 막혀 못 읽었다. 틀린 색을 30곳에 칠하느니 안 쓰는 게 맞다고 봤다.
 * 그래서 학교색 대신 계열(type)별 팔레트를 쓴다. color 필드가 없는 이유다.
 *
 * ── filter ───────────────────────────────────────────────────
 * 성향 축으로 처리하면 안 되는 조건들이다. 코사인 계산 이전에 거른다.
 *   womenOnly     여대. 남학생 응답자에게 나오면 안 된다.
 *   practicalExam 실기·오디션 입시. 일반 트랙 학생에게 추천하면 무의미하다.
 *   dualCampus    학부생이 캠퍼스에 따라 완전히 다른 4년을 보낸다.
 *                 결과에 그 사실을 같이 띄운다.
 */
const SCHOOLS = [
  {
    id: 'snu', nameKo: '서울대', nameEn: 'Seoul National University',
    url: 'https://www.snu.ac.kr', region: '서울 관악', type: '국립',
    tagline: '뭘 하겠다고 하면 대체로 자원이 이미 있는 곳',
    keywords: ['국립대학법인', '연구 중심', '개인주의'],
    scaleBasis: '확인', scaleNote: '학부 재학생 약 14,639명',
    vector: {
      distance: -1, immersion: 1, scale: 0.3, bond: -1.5, legacy: 2,
      horizon: -2, domain: 0, making: -0.5, openness: 0.5, intensity: 0.5, cost: 1,
    },
    facts: {
      scale: '학부 재학생 **약 1만 4천 명**. 학내 이동이 일이라는 말이 나올 만큼 캠퍼스가 넓고 언덕이에요.',
      campus: '관악(학부 대부분) · 연건(의학계열·서울대병원) · 시흥(연구 단지).',
      choice: '2025년 **학부대학**이 생겼지만 **무전공** 모집은 자유전공학부 수준인 123~124명이에요. 한때 400명 안팎으로 늘린다고 보도됐지만 그 규모로 시행되지는 않았어요.',
    },
    detail: {
      student: {
        vibe: '**각자 알아서 하는 분위기**라는 말이 가장 많이 나오는 학교예요. 대신 뭘 물어볼 사람이 늘 있어서, 방학에 다음 학기 예습 스터디를 구하는 게 어렵지 않아요. 경영대·법대·의대가 다 있는 종합대인데도 진로가 취업 한 방향으로 몰리지 않고 대학원·전문직·공직·기업으로 넓게 갈려요.',
        fitsWho: '혼자 파고드는 시간이 아깝지 않은 사람. 답이 정해진 문제보다 아직 답이 없는 문제가 궁금한 사람. 챙겨주기를 기다리기보다 필요한 걸 직접 찾아 나서는 사람.',
      },
      parent: {
        vibe: '**학생 자율**에 크게 기대는 학교예요. **대학원 진학 비중**이 높고 진로가 한 방향으로 몰리지 않아요. 다만 캠퍼스가 넓고 각자 알아서 하는 분위기라, 스스로 방향을 잡는 힘이 아직 부족한 아이라면 첫 학기에 적응 시간이 필요할 수 있어요.',
        fitsWho: '혼자 오래 파고드는 걸 힘들어하지 않는 아이. 연구나 전문직처럼 시간이 걸리는 진로를 생각하는 아이. 촘촘히 관리받는 것보다 알아서 하는 걸 편해하는 아이.',
      },
    },
    filter: {},
  },
  {
    id: 'yonsei', nameKo: '연세대', nameEn: 'Yonsei University',
    url: 'https://www.yonsei.ac.kr', region: '서울 신촌', type: '사립',
    tagline: '1학년은 송도에서, 나머지는 신촌에서',
    keywords: ['1학년 RC', '이원 생활', '신촌 상권'],
    scaleBasis: '추정', scaleNote: '학부 재학생 수는 확인하지 못했다',
    vector: {
      distance: -0.5, immersion: 0, scale: 0.8, bond: 0.5, legacy: 2,
      horizon: 0.5, domain: -0.5, making: -0.5, openness: 0, intensity: 0, cost: -2,
    },
    facts: {
      scale: '서울 주요 사립 중 큰 편이에요. 정확한 학부 재학생 수는 확인하지 못해 숫자를 쓰지 않았어요.',
      campus: '신촌이 본 캠퍼스. 신입생은 음악대학·일부 체육 특기자를 빼고 전원이 1년간 인천 송도 **국제캠퍼스**에서 기숙 생활(RC)을 해요. 약학대학은 6년 내내 송도예요. 건축 관련 학과는 송도가 아니라 신촌이에요.',
      choice: '2025년 **광역모집단위**로 상경계열 **70명**·생명과학부 20명, 합쳐 90명을 신설했어요. 전체 모집인원 대비로는 작은 편이에요.',
    },
    detail: {
      student: {
        vibe: '1학년을 **송도**에서 기숙사 생활로 시작하고 2학년부터 **신촌**으로 올라와요. 시작은 캠퍼스 안에서 다 해결하는 생활이었다가, 그다음부터는 정문을 나서면 바로 신촌인 도시 생활로 바뀌어요. 한 학교 안에서 두 가지를 다 겪는 셈이에요.',
        fitsWho: '첫 1년은 같이 살면서 친해지고, 그다음엔 도시로 나가고 싶은 사람. 학교 밖에서 보내는 시간이 대학 생활의 절반이라고 생각하는 사람.',
      },
      parent: {
        vibe: '신입생이 **1년간 송도에서 기숙 생활**을 해요. 유학이나 자취를 처음 시작하는 아이에게 완충 구간이 되기도 하고, 반대로 집에서 다니길 원했다면 1년은 그럴 수 없다는 뜻이기도 해요. 2학년부터는 신촌이라 생활 방식이 한 번 크게 바뀌어요.',
        fitsWho: '기숙사 생활을 부담스러워하지 않는 아이. 1학년과 2학년의 생활이 크게 달라지는 걸 오히려 재밌어할 아이.',
      },
    },
    filter: { dualCampus: '신입생 전원이 1년간 인천 송도에서 기숙 생활을 해요. 약학대학은 6년 내내 송도예요.' },
  },
  {
    id: 'korea', nameKo: '고려대', nameEn: 'Korea University',
    url: 'https://www.korea.ac.kr', region: '서울 안암', type: '사립',
    tagline: '안암 대학가가 곧 생활권인 곳',
    keywords: ['안암 상권', '동문 결속', '전통 행사'],
    scaleBasis: '추정', scaleNote: '학부 재학생 수는 확인하지 못했다',
    vector: {
      distance: -1, immersion: -1, scale: 1.2, bond: 2, legacy: 2,
      horizon: 0.5, domain: -0.5, making: -0.5, openness: 0.5, intensity: 0, cost: -2,
    },
    facts: {
      scale: '서울 주요 사립 중 큰 편이에요. 정확한 학부 재학생 수는 확인하지 못해 숫자를 쓰지 않았어요.',
      campus: '서울 성북구 안암이에요. 캠퍼스와 대학가가 붙어 있어 학교 밖 생활이 자연스러워요.',
      choice: '2025년부터 **학부대학** 36명과 **자유전공학부** 95명, 합쳐 131명 규모예요. 학부대학 36명은 정시 다군에서 처음 뽑았어요.',
    },
    detail: {
      student: {
        vibe: '**동문 관계와 단체 행사**가 학교 성격을 크게 규정하는 곳이에요. 모임에 안 나가도 뭐라 할 사람은 없지만, 나가면 얻는 게 확실히 있는 쪽이에요. 캠퍼스와 대학가 경계가 흐려서 수업 끝나고 그대로 학교 앞에서 시간을 보내게 돼요.',
        fitsWho: '사람들과 계속 엮이는 게 피곤하기보다 재밌는 사람. 학교 이름으로 이어지는 관계를 나중에도 쓸 생각이 있는 사람.',
      },
      parent: {
        vibe: '**선배·동문 관계**가 뚜렷하게 작동하는 학교로 알려져 있어요. 졸업 후에도 그 관계가 이어지는 편이에요. 다만 단체 활동이 부담스러운 아이라면 그 밀도가 오히려 피로할 수 있어요.',
        fitsWho: '사람들 사이에서 힘을 얻는 아이. 혼자보다 같이 할 때 더 하는 아이.',
      },
    },
    filter: {},
  },
  {
    id: 'kaist', nameKo: 'KAIST', nameEn: 'Korea Advanced Institute of Science and Technology',
    url: 'https://www.kaist.ac.kr', region: '대전 유성', type: '과기원',
    tagline: '학과 없이 들어와 제한 없이 고르는 곳',
    keywords: ['새내기과정학부', '제한 없는 전공 선택', '대학원 중심'],
    scaleBasis: '확인', scaleNote: '학사과정 재학생 4,009명 (2024년)',
    vector: {
      distance: 2, immersion: 2, scale: -1.4, bond: 1.5, legacy: -0.5,
      horizon: -1.5, domain: 1.5, making: 1.5, openness: 2, intensity: 1.5, cost: 2,
    },
    facts: {
      scale: '학사과정 재학생 **4,009명**이에요. 대학원이 학부의 두 배가 넘는 연구 중심 구조예요(전체 **12,348명**).',
      campus: '대전 유성이에요. 기숙사 생활이 기본이라 생활이 캠퍼스 안에서 거의 끝나요.',
      choice: '신입생 전원이 학과 없이 **새내기과정학부**로 들어와 1년 뒤 학과를 골라요. 학과별 정원 제한도 성적 제한도 없어요 — 이게 다른 대학 **무전공**과 결정적으로 다른 점이에요.',
    },
    detail: {
      student: {
        vibe: '1년을 학과 없이 보내고 2학년에 원하는 학과로 가요. **인원 제한도 학점 커트도 없어서** "성적이 안 되면 못 간다"는 게 없어요. 대학원생이 학부생보다 훨씬 많아서 연구실이 가깝고, 학부 때부터 연구에 붙는 게 자연스러워요.',
        fitsWho: '아직 뭘 할지 못 정했는데 이공계인 건 확실한 사람. 성적으로 전공이 갈리는 구조가 싫은 사람. 대학원까지 생각하고 있는 사람.',
      },
      parent: {
        vibe: '학과를 정하지 않고 입학해 1년 뒤 제한 없이 골라요. **성적으로 전공이 막히지 않는다**는 점이 아이에게 실질적인 차이가 돼요. 대전 소재라 기숙 생활이 기본이고, 연구 중심이라 대학원 진학이 자연스러운 경로예요.',
        fitsWho: '이공계인 건 분명한데 세부 전공을 아직 못 정한 아이. 연구 쪽을 생각하는 아이. 집을 떠나 지내는 걸 힘들어하지 않는 아이.',
      },
    },
    filter: {},
  },
  {
    id: 'postech', nameKo: '포스텍', nameEn: 'POSTECH',
    url: 'https://www.postech.ac.kr', region: '경북 포항', type: '과기원',
    tagline: '학과 정원 자체가 없는 소수정예',
    keywords: ['무은재학부', '학과 정원 폐지', '학부 1,400명'],
    scaleBasis: '확인', scaleNote: '학부 재학생 1,409명',
    vector: {
      distance: 2, immersion: 2, scale: -1.9, bond: 1.5, legacy: -1,
      horizon: -2, domain: 2, making: 0.3, openness: 2, intensity: 2, cost: 2,
    },
    facts: {
      scale: '학부 재학생 **1,409명**으로 30곳 중 가장 작아요. 입학정원은 **320명대**예요.',
      campus: '경북 포항이에요. 기숙사 생활이 기본이고 생활이 캠퍼스 안에서 끝나요.',
      choice: '2018학년도부터 신입생 전원이 **무은재학부**로 들어와요. 학과별 정원이 아예 폐지돼서 전공 선택이 **100%** 자율이고 학점 커트도 없어요.',
    },
    detail: {
      student: {
        vibe: '한 학년이 **300명대**라 서로 얼굴을 다 알게 돼요. 교수가 이름을 아는 정도가 아니라 그냥 아는 사이가 돼요. 학과 정원이 없어서 원하는 전공에 그냥 가면 되고, 대학원생이 학부생보다 많아서 연구실 문턱이 낮아요.',
        fitsWho: '익명으로 숨을 곳이 없어도 괜찮은 사람. 오히려 그게 편한 사람. 한 가지를 끝까지 파는 쪽이 성격에 맞는 사람.',
      },
      parent: {
        vibe: '**학부 규모가 가장 작아서** 학생 한 명 한 명이 눈에 들어오는 구조예요. **학과 정원이 없어** 전공 선택에 경쟁이 없어요. 다만 포항 소재에 기숙 생활이라 생활 반경이 좁고, 번화한 곳을 좋아하는 아이라면 답답해할 수 있어요.',
        fitsWho: '작은 규모에서 안정을 얻는 아이. 연구나 대학원을 생각하는 아이. 조용한 환경을 답답해하지 않는 아이.',
      },
    },
    filter: {},
  },
  {
    id: 'skku', nameKo: '성균관대', nameEn: 'Sungkyunkwan University',
    url: 'https://www.skku.edu', region: '서울 혜화 · 경기 수원', type: '사립',
    tagline: '인문사회는 서울, 자연과학은 수원',
    keywords: ['이원 캠퍼스', '1398년', '기업 연계'],
    scaleBasis: '추정', scaleNote: '학부 재학생 수는 확인하지 못했다',
    vector: {
      distance: -0.5, immersion: 0, scale: 0.6, bond: 0.5, legacy: 2,
      horizon: 1.5, domain: 0.5, making: 0, openness: 1.5, intensity: 0.5, cost: -2,
    },
    facts: {
      scale: '서울 주요 사립 중 큰 편이에요. 정확한 학부 재학생 수는 확인하지 못해 숫자를 쓰지 않았어요.',
      campus: '인문사회과학캠퍼스(서울 혜화)와 자연과학캠퍼스(경기 수원)로 나뉘어요. 전공에 따라 생활권이 아예 달라요.',
      choice: '2025년 신설, 총 **280명**이에요. 1학년 교양기초를 이수하면 인원·학점 제한 없이 전공을 골라요.',
    },
    detail: {
      student: {
        vibe: '전공에 따라 서울에서 다니느냐 수원에서 다니느냐가 갈려요. 같은 학교인데 통학 시간도 생활권도 완전히 달라지니, 지원 전에 내 전공이 어느 캠퍼스인지 꼭 확인해야 해요. **무전공**으로 들어오면 1년 뒤 제한 없이 고를 수 있어요.',
        fitsWho: '배운 걸 어디에 쓸 수 있는지가 먼저 궁금한 사람. 전공을 1년 미뤄두고 결정하고 싶은 사람.',
      },
      parent: {
        vibe: '전공에 따라 **서울 혜화와 경기 수원**으로 생활권이 갈려요. 통학 거리와 자취 여부가 전공 선택에 딸려오므로 미리 확인이 필요해요. 기업 연계 과정이 뚜렷해서 진로가 비교적 일찍 그려지는 편이에요.',
        fitsWho: '진로를 빨리 구체화하고 싶은 아이. 캠퍼스가 갈리는 구조를 미리 알고 고를 수 있는 경우.',
      },
    },
    filter: { dualCampus: '인문사회는 서울 혜화, 자연과학은 경기 수원이에요. 전공에 따라 생활권이 완전히 달라져요.' },
  },
  {
    id: 'hanyang', nameKo: '한양대', nameEn: 'Hanyang University',
    url: 'https://www.hanyang.ac.kr', region: '서울 성동', type: '사립',
    tagline: '만들어서 내놓는 걸로 증명하는 곳',
    keywords: ['공대', '창업', '실용'],
    scaleBasis: '확인', scaleNote: '서울캠퍼스 학부 재학생 11,828명',
    vector: {
      distance: -1.5, immersion: -1, scale: -0.2, bond: 1, legacy: 1.5,
      horizon: 2, domain: 1.5, making: 1, openness: 0.5, intensity: 0.5, cost: -2,
    },
    facts: {
      scale: '서울캠퍼스 학부 재학생 **11,828명**이에요. 경기 안산의 **ERICA** 캠퍼스는 입시부터 별도로 뽑아요.',
      campus: '서울 성동구 왕십리예요. 지하철이 캠퍼스에 붙어 있어 접근이 쉬워요.',
      choice: '**한양YK인터칼리지 250명**이에요(2025년 신설). 2학년에 주전공을 고르고 다중전공을 하나 이상 필수로 해요. 다만 주전공 선택에 석차에 따른 제한이 있어요.',
    },
    detail: {
      student: {
        vibe: '공학과 창업 쪽 색이 뚜렷해요. 이론을 정리하는 것보다 뭔가 만들어서 굴러가게 하는 걸 높게 치는 분위기예요. **무전공**으로 들어와도 다중전공을 하나 이상 반드시 해야 해서, 전공을 하나만 파는 구조는 아니에요.',
        fitsWho: '배운 걸 바로 써먹고 싶은 사람. 결과물이 눈에 보여야 힘이 나는 사람. 전공 하나로는 부족하다고 느끼는 사람.',
      },
      parent: {
        vibe: '실용·취업 지향이 뚜렷하고 창업 지원이 잘 갖춰져 있어요. **무전공** 트랙은 다중전공이 필수라 전공을 두 개 이상 하게 돼요. 다만 주전공을 고를 때 석차 제한이 있어 완전 자유는 아니에요.',
        fitsWho: '진로가 비교적 뚜렷한 아이. 만들고 실행하는 걸 좋아하는 아이.',
      },
    },
    filter: { dualCampus: '경기 안산의 ERICA 캠퍼스는 입시부터 별도로 모집해요. 서울캠퍼스와 다른 학교로 보시면 돼요.' },
  },
  {
    id: 'sogang', nameKo: '서강대', nameEn: 'Sogang University',
    url: 'https://www.sogang.ac.kr', region: '서울 마포', type: '사립',
    tagline: '작은 규모에서 깊게 파는 곳',
    keywords: ['학부 6천 명대', '예수회', '전공 심화'],
    scaleBasis: '확인', scaleNote: '학부 재학생 6,432~6,517명',
    vector: {
      distance: -1.5, immersion: -0.5, scale: -1.3, bond: 1, legacy: 1,
      horizon: 0.5, domain: -0.5, making: -1.5, openness: 1, intensity: 2, cost: -2,
    },
    facts: {
      scale: '학부 재학생 **6,400명대**로 서울 주요 사립 중 가장 작은 편이에요.',
      campus: '서울 마포구 신촌이에요. **단일 캠퍼스**예요.',
      choice: '2025년 **자유전공학부**를 인문학기반·SCIENCE기반·AI기반 세 종류로 신설했어요. 각각의 모집 규모는 작은 편이에요.',
    },
    detail: {
      student: {
        vibe: '규모가 작아서 같은 학번끼리 금방 서로 알게 돼요. **예체능 단과대학**이 없어서 학교 전체가 읽고 쓰고 따지는 쪽으로 기울어 있고, 학점을 후하게 주지 않는 것으로도 알려져 있어요.',
        fitsWho: '넓게 훑기보다 하나를 끝까지 파는 사람. 몰아서 집중하는 리듬이 맞는 사람. 큰 학교에서 익명으로 있는 것보다 서로 아는 규모가 편한 사람.',
      },
      parent: {
        vibe: '**학부 규모가 작아** 관리가 촘촘한 편이에요. **학업 강도가 높은** 학교로 알려져 있어요. 예체능 계열이 없어 학문 성격이 한쪽으로 뚜렷해요.',
        fitsWho: '작은 규모를 편해하는 아이. 한 분야를 깊게 파는 성향의 아이.',
      },
    },
    filter: {},
  },
  {
    id: 'cau', nameKo: '중앙대', nameEn: 'Chung-Ang University',
    url: 'https://www.cau.ac.kr', region: '서울 동작 · 경기 안성', type: '사립',
    tagline: '예술과 경영이 한 학교에 있는 곳',
    keywords: ['연극영화', '이원 캠퍼스', '미디어'],
    scaleBasis: '확인', scaleNote: '학부 재학생 21,413명 (서울 약 12,393 + 다빈치 9,020)',
    vector: {
      distance: -1, immersion: -0.5, scale: 1.4, bond: 0.5, legacy: 1,
      horizon: 1, domain: -0.5, making: 1.5, openness: 1, intensity: 0.5, cost: -2,
    },
    facts: {
      scale: '학부 재학생 **2만 명대**예요. 서울캠퍼스가 약 1만 2천, 경기 안성 **다빈치캠퍼스**가 약 9천이에요.',
      campus: '서울 동작구 흑석동과 경기 안성 **다빈치캠퍼스**로 나뉘어요.',
      choice: '**전공개방모집** 총 **389명** 규모예요(2025년). 서울캠 28개 학과가 대상이에요.',
    },
    detail: {
      student: {
        vibe: '**연극영화·미디어** 쪽 색이 뚜렷한데 경영·약학도 같이 있어요. 그래서 옆자리 사람이 하는 일이 나랑 완전히 다른 경우가 많아요. 만들어서 남에게 보여주는 걸 업으로 삼는 사람과 숫자로 따지는 사람이 같은 캠퍼스에 있어요.',
        fitsWho: '작품이든 영상이든 뭔가 만들어 내놓는 게 즐거운 사람. 서로 다른 분야 사람들 사이에 섞이는 게 좋은 사람.',
      },
      parent: {
        vibe: '예술 계열과 경영·약학이 한 학교에 있어요. 전공에 따라 **서울과 안성**으로 캠퍼스가 갈리므로 미리 확인이 필요해요.',
        fitsWho: '표현하고 만드는 걸 좋아하는 아이. 진로가 예술 쪽이면서도 선택지를 넓게 두고 싶은 경우.',
      },
    },
    filter: { dualCampus: '전공에 따라 서울 흑석동과 경기 안성으로 갈려요.' },
  },
  {
    id: 'khu', nameKo: '경희대', nameEn: 'Kyung Hee University',
    url: 'https://www.khu.ac.kr', region: '서울 동대문 · 경기 용인', type: '사립',
    tagline: '다른 데 없는 학문 조합을 가진 곳',
    keywords: ['한의과대학', '이원 캠퍼스', '학부 2만 5천'],
    scaleBasis: '확인', scaleNote: '학부 재학생 25,573명 (2025년)',
    vector: {
      distance: -0.5, immersion: 0.5, scale: 2.0, bond: 1, legacy: 1.5,
      horizon: 0.5, domain: 0, making: 0.5, openness: 1, intensity: -0.5, cost: -2,
    },
    facts: {
      scale: '학부 재학생 **25,573명**으로 30곳 중 가장 큰 편이에요.',
      campus: '서울캠퍼스(동대문)와 **국제캠퍼스**(경기 용인)로 나뉘어요.',
      choice: '2025년 **무전공** 406명으로 입학정원의 약 10%예요. 서울캠 자율전공학부 165명, 국제캠 **자유전공학부** 241명이에요. 1년 전공탐색 후 2학년에 학과를 정해요.',
    },
    detail: {
      student: {
        vibe: '**한의과대학**처럼 다른 학교에 없거나 드문 학문이 있어요. 규모가 커서 4년 내내 모르는 얼굴이 계속 생기고, 안 겹치기로 하면 안 마주칠 수도 있어요. 캠퍼스가 넓고 학교 안에서 해결되는 게 많은 편이에요.',
        fitsWho: '관심사가 특이해서 일반적인 전공 목록에서 못 찾는 사람. 큰 규모에서 다양한 사람과 섞이는 게 좋은 사람.',
      },
      parent: {
        vibe: '학부 규모가 큰 종합대학이고 **한의과대학** 등 희소 학문을 갖고 있어요. 전공에 따라 서울과 용인으로 캠퍼스가 갈려요. 규모가 큰 만큼 세심하게 챙겨주는 환경을 원한다면 부담이 될 수 있어요.',
        fitsWho: '관심 분야가 구체적이거나 특이한 아이. 큰 규모를 부담스러워하지 않는 아이.',
      },
    },
    filter: { dualCampus: '전공에 따라 서울과 경기 용인 국제캠퍼스로 갈려요.' },
  },
  {
    id: 'hufs', nameKo: '한국외대', nameEn: 'Hankuk University of Foreign Studies',
    url: 'https://www.hufs.ac.kr', region: '서울 동대문 · 경기 용인', type: '사립',
    tagline: '전공 선택 폭이 가장 넓게 열린 곳',
    keywords: ['무전공 26%', '어학·지역학', '이원 캠퍼스'],
    scaleBasis: '확인', scaleNote: '학부 재학생 17,101명 (서울 9,823 + 글로벌 7,278)',
    vector: {
      distance: -0.5, immersion: 0, scale: 0.9, bond: -2, legacy: 1,
      horizon: 1, domain: -2, making: -2, openness: 2, intensity: 0, cost: -1.5,
    },
    facts: {
      scale: '학부 재학생 **17,101명**이에요. 서울캠퍼스 **9,823명**, 경기 용인 글로벌캠퍼스 7,278명이에요.',
      campus: '서울 동대문구와 경기 용인으로 나뉘어요.',
      choice: '2025년 **무전공** 835명으로 전체 모집의 **26%**예요. 30곳 중 비율이 가장 높아요. 전년 116명에서 7배 넘게 늘었어요.',
    },
    detail: {
      student: {
        vibe: '전공을 정하지 않고 들어오는 사람이 **넷 중 한 명**이에요. 그만큼 "아직 안 정했다"는 게 이상하지 않은 학교예요. 언어와 지역을 다루는 학과가 워낙 많아서, 관심 있는 나라가 있으면 그 언어를 전공으로 할 수 있어요.',
        fitsWho: '아직 하나로 못 정했고 그게 답답한 사람. 언어나 다른 나라 이야기에 시간을 많이 쓰는 사람. 각자 알아서 하는 분위기가 편한 사람.',
      },
      parent: {
        vibe: '**무전공** 선발 비율이 30곳 중 가장 높아요. 전공을 늦게 정하고 싶은 아이에게 선택지가 넓어요. 전공에 따라 서울과 용인으로 캠퍼스가 갈려요.',
        fitsWho: '진로를 아직 못 정한 아이. 언어나 국제 분야에 관심이 있는 아이.',
      },
    },
    filter: { dualCampus: '전공에 따라 서울과 경기 용인 글로벌캠퍼스로 갈려요.' },
  },
  {
    id: 'uos', nameKo: '서울시립대', nameEn: 'University of Seoul',
    url: 'https://www.uos.ac.kr', region: '서울 동대문', type: '공립',
    tagline: '유일한 공립, 제한 없는 전공 선택',
    keywords: ['공립', '반값등록금', '인원 제한 없음'],
    scaleBasis: '확인', scaleNote: '학부 재학생 8,796명 (2024년)',
    vector: {
      distance: -2, immersion: 1, scale: -1.0, bond: 0, legacy: 0.5,
      horizon: 0.5, domain: 0.5, making: 0, openness: 2, intensity: -0.5, cost: 2,
    },
    facts: {
      scale: '학부 재학생 **8,796명**이에요. **8개 단과대학**이에요.',
      campus: '서울 동대문구예요. **단일 캠퍼스**이고 주변 상권이 크지 않아 학교 안에서 시간을 보내는 편이에요.',
      choice: '**자유전공학부**에서 2학년 진급 시 예술체육대학·융합전공학부·계약학과를 뺀 모든 학부를 인원 제한 없이 골라요. 계열을 넘어가는 선택도 열려 있어요.',
    },
    detail: {
      student: {
        vibe: '전국에서 유일한 4년제 **공립 종합대학**이에요. 서울시가 운영해서 등록금이 사립의 절반 아래고, 그만큼 학비 때문에 진로를 좁힐 일이 적어요. 전공을 고를 때 인원 제한이 없어서 정원 경쟁이 없어요.',
        fitsWho: '학비 부담을 줄이고 그만큼 진로를 자유롭게 고르고 싶은 사람. 서울에서 집을 안 떠나고 다니고 싶은 사람.',
      },
      parent: {
        vibe: '서울시가 설립·운영하는 유일한 **공립 대학**이라 등록금 부담이 사립의 절반 아래예요. 전공 선택에 인원 제한이 없어 원하는 학과에 갈 수 있어요. 서울 소재라 통학도 가능해요.',
        fitsWho: '학비 부담을 실질적으로 줄이고 싶은 경우. 집에서 다니길 원하는 아이.',
      },
    },
    filter: {},
  },
  {
    id: 'ewha', nameKo: '이화여대', nameEn: 'Ewha Womans University',
    url: 'https://www.ewha.ac.kr', region: '서울 서대문', type: '사립',
    tagline: '규모와 학과 폭을 다 갖춘 여대',
    keywords: ['여대', '호크마 통합선발', '의약·사범'],
    scaleBasis: '추정', scaleNote: '학부 재학생 수는 확인하지 못했다',
    vector: {
      distance: -2, immersion: -0.5, scale: -0.1, bond: 0.5, legacy: 2,
      horizon: 0, domain: -1, making: 0, openness: 1, intensity: 0, cost: -2,
    },
    facts: {
      scale: '여대 중 가장 크고 학과 폭이 넓어요. 정확한 학부 재학생 수는 확인하지 못해 숫자를 쓰지 않았어요.',
      campus: '서울 서대문구가 주 캠퍼스지만 **단일 캠퍼스**는 아니에요. 의과대학 본과와 간호대학 고학년은 이대서울병원 쪽에서 수업해요.',
      choice: '**호크마 통합선발**로 들어오면 1학년 말에 전공을 정해요. 다만 선택 범위가 7개 대학 41개 전공으로 한정돼 있어 완전 자유는 아니에요.',
    },
    detail: {
      student: {
        vibe: '여대 중에서 규모와 학과 폭이 가장 넓어요. 의대·약대·사범대가 다 있어서 자격증으로 이어지는 진로와 인문·예술 쪽이 한 학교에 같이 있어요. **통합선발**로 들어오면 1년 뒤 전공을 고르는데, 고를 수 있는 범위가 정해져 있으니 미리 확인하는 게 좋아요.',
        fitsWho: '여대라는 환경을 원하거나 개의치 않는 사람. 인문·예술 쪽에 무게가 있는 사람. 전공을 1년 미뤄두고 정하고 싶은 사람.',
      },
      parent: {
        vibe: '여대 중 규모가 가장 크고 의약·사범 계열을 갖추고 있어요. **통합선발** 트랙은 1학년 말에 전공을 정하지만 선택 범위에 제한이 있어요. 의예·간호 계열은 고학년에 병원 쪽 캠퍼스로 옮겨요.',
        fitsWho: '여대 진학을 고려하는 경우. 전문직 자격으로 이어지는 진로를 생각하는 아이.',
      },
    },
    filter: { womenOnly: true },
  },
  {
    id: 'sookmyung', nameKo: '숙명여대', nameEn: 'Sookmyung Women\'s University',
    url: 'https://www.sookmyung.ac.kr', region: '서울 용산', type: '사립',
    tagline: '전공을 정원 상관없이 고르는 여대',
    keywords: ['여대', '자유전공 303명', '단일 캠퍼스'],
    scaleBasis: '추정', scaleNote: '학부 재학생 수는 확인하지 못했다',
    vector: {
      distance: -2, immersion: -0.5, scale: -1.2, bond: 0.5, legacy: 1.5,
      horizon: 1, domain: -0.5, making: 0, openness: 1.5, intensity: 0, cost: -2,
    },
    facts: {
      scale: '이화여대보다 작아요. 정확한 학부 재학생 수는 확인하지 못해 숫자를 쓰지 않았어요.',
      campus: '서울 용산구 청파동 단일 소재지예요. 별도 캠퍼스가 없어요.',
      choice: '2025년 **자유전공학부**를 신설해 **303명**을 뽑아요. 2학년에 인문·사회·자연·공학 계열에서 학과 정원과 무관하게 골라요. 사범·약학·예체능은 제외예요.',
    },
    detail: {
      student: {
        vibe: '**자유전공학부**로 들어오면 2학년에 전공을 고르는데, 학과 정원과 상관없이 갈 수 있어요. 인원 경쟁이 없다는 뜻이에요. 캠퍼스가 한 군데라 4년 동안 생활 반경이 바뀌지 않아요.',
        fitsWho: '여대라는 환경을 원하거나 개의치 않는 사람. 전공을 정원 경쟁 없이 고르고 싶은 사람. 서울에서 집을 안 떠나고 다니고 싶은 사람.',
      },
      parent: {
        vibe: '**자유전공학부** 학생은 학과 정원과 무관하게 전공을 선택해요. **단일 캠퍼스**라 4년간 생활 반경이 일정해요.',
        fitsWho: '여대 진학을 고려하는 경우. 전공 선택에서 성적 경쟁을 겪지 않게 하고 싶은 경우.',
      },
    },
    filter: { womenOnly: true },
  },
  {
    id: 'konkuk', nameKo: '건국대', nameEn: 'Konkuk University',
    url: 'https://www.konkuk.ac.kr', region: '서울 광진', type: '사립',
    tagline: '수의대와 부동산학이 있는 실용 종합',
    keywords: ['수의과대학', '이원 캠퍼스', '건대입구'],
    scaleBasis: '추정', scaleNote: '학부 재학생 수는 확인하지 못했다',
    vector: {
      distance: -1, immersion: -1.5, scale: 0.5, bond: 0.5, legacy: 1,
      horizon: 1.5, domain: 0.5, making: 0.5, openness: 0, intensity: 0, cost: -2,
    },
    facts: {
      scale: '서울캠퍼스 기준 중대형이에요. 정확한 학부 재학생 수는 확인하지 못해 숫자를 쓰지 않았어요.',
      campus: '서울 광진구와 충북 충주 **글로컬캠퍼스**로 나뉘어요. 의과대학은 서울이 아니라 글로컬 소속이에요.',
      choice: '무전공 규모는 확인하지 못했어요.',
    },
    detail: {
      student: {
        vibe: '건대입구 상권이 캠퍼스에 붙어 있어서 학교 밖 생활이 자연스러워요. **수의과대학**과 **부동산학과**처럼 다른 데서 찾기 어려운 학과가 있어요.',
        fitsWho: '관심 분야가 구체적이라 일반적인 전공 목록에서 안 나오는 사람. 학교 밖 도시가 생활의 절반인 게 좋은 사람.',
      },
      parent: {
        vibe: '수의과대학·부동산학과 등 희소 학과를 갖고 있어요. 의과대학은 서울이 아니라 충주 **글로컬캠퍼스** 소속이니 확인이 필요해요.',
        fitsWho: '전공이 구체적으로 정해진 아이. 서울에서 통학하려는 경우.',
      },
    },
    filter: { dualCampus: '충북 충주 글로컬캠퍼스가 따로 있고, 의과대학은 글로컬 소속이에요.' },
  },
  {
    id: 'dongguk', nameKo: '동국대', nameEn: 'Dongguk University',
    url: 'https://www.dongguk.edu', region: '서울 중구', type: '사립',
    tagline: '불교 종립에 문예·영상이 얹힌 곳',
    keywords: ['종립대', '문예창작·영상', '충무로'],
    scaleBasis: '추정', scaleNote: '학부 재학생 수는 확인하지 못했다',
    vector: {
      distance: -1, immersion: -1.5, scale: -0.3, bond: 1, legacy: 2,
      horizon: 0.5, domain: -1, making: 1, openness: 0, intensity: 0, cost: -2,
    },
    facts: {
      scale: '서울캠퍼스 기준 중형이에요. 정확한 학부 재학생 수는 확인하지 못해 숫자를 쓰지 않았어요.',
      campus: '서울 중구 필동이에요. 경주 **WISE캠퍼스**가 따로 있고 신입생을 별도로 뽑아요.',
      choice: '무전공 규모는 확인하지 못했어요.',
    },
    detail: {
      student: {
        vibe: '불교 **종립대**라는 정체성 위에 **문예창작·영화영상** 같은 창작 계열이 얹혀 있어요. 충무로가 가까워서 영상 쪽은 학교 밖과 이어지는 게 자연스러워요.',
        fitsWho: '글이나 영상으로 뭔가 만들어 내놓는 게 즐거운 사람. 학교의 오래된 색깔을 부담이 아니라 배경으로 받아들이는 사람.',
      },
      parent: {
        vibe: '불교 **종립대학**이고 **문예창작·영화영상** 계열이 강해요. 경주 WISE캠퍼스는 별도 모집이라 서울캠퍼스와 구분해서 보시면 돼요.',
        fitsWho: '창작 쪽 진로를 생각하는 아이.',
      },
    },
    filter: { dualCampus: '경주 WISE캠퍼스는 별도로 모집해요.' },
  },
  {
    id: 'hongik', nameKo: '홍익대', nameEn: 'Hongik University',
    url: 'https://www.hongik.ac.kr', region: '서울 마포', type: '사립',
    tagline: '홍대 앞이 그대로 캠퍼스인 곳',
    keywords: ['미술·디자인', '실기고사 폐지', '홍대 앞'],
    scaleBasis: '환산', scaleNote: '서울캠퍼스 연간 모집 2,372명 → 학부 약 9천 명대',
    vector: {
      distance: -1.5, immersion: -2, scale: -0.9, bond: -1.5, legacy: 1,
      horizon: 0.5, domain: -0.5, making: 2, openness: 0, intensity: 1.5, cost: -2,
    },
    facts: {
      scale: '서울캠퍼스 연간 모집인원이 2,372명이에요. 학부 재학생 수는 직접 확인되지 않아 모집인원으로 규모만 가늠했어요.',
      campus: '서울 마포구 상수동이에요. 정문을 나서면 바로 홍대 앞이라 학교와 도시의 경계가 거의 없어요. 세종캠퍼스가 따로 있어요.',
      choice: '미술계열은 실기고사 없이 뽑아요. 2013학년도 입시부터 실기고사를 완전히 폐지했어요.',
    },
    detail: {
      student: {
        vibe: '학교 밖이 곧 생활이에요. 정문을 나서면 **홍대 앞**이라 작업하고 전시 보고 사람 만나는 게 전부 걸어서 돼요. 미대가 실기고사 없이 뽑는 것도 특징이에요 — 그림 실력을 시험장에서 재지 않는다는 뜻이에요.',
        fitsWho: '손으로 만들어서 남에게 보여주는 게 즐거운 사람. 밤새 작업하는 리듬이 오히려 맞는 사람. 학교 안보다 밖에서 시간을 보내는 사람.',
      },
      parent: {
        vibe: '**미술·디자인** 계열이 강한 학교이고, 미술계열도 실기고사 없이 선발해요. 홍대 앞 상권이 캠퍼스에 붙어 있어 학교 밖 활동이 많은 편이에요.',
        fitsWho: '만들고 표현하는 쪽으로 진로를 생각하는 아이. 실기 준비 부담 없이 미술 계열을 지원하려는 경우.',
      },
    },
    filter: { dualCampus: '세종캠퍼스가 따로 있어요.' },
  },
  {
    id: 'kookmin', nameKo: '국민대', nameEn: 'Kookmin University',
    url: 'https://www.kookmin.ac.kr', region: '서울 성북', type: '사립',
    tagline: '자동차와 디자인, 북한산 자락에서',
    keywords: ['자동차공학', '조형대학', '역이 멀다'],
    scaleBasis: '추정', scaleNote: '학부 재학생 수는 확인하지 못했다',
    vector: {
      distance: -1, immersion: 1, scale: 0.1, bond: 0.5, legacy: 0.5,
      horizon: 1, domain: 0.5, making: 1.5, openness: 0, intensity: 0, cost: -2,
    },
    facts: {
      scale: '서울 중형 사립이에요. 정확한 학부 재학생 수는 확인하지 못해 숫자를 쓰지 않았어요.',
      campus: '서울 성북구 정릉, 북한산 자락이에요. 지하철역에서 떨어져 있어 학교 안에서 시간을 보내는 편이에요.',
      choice: '무전공 규모는 확인하지 못했어요.',
    },
    detail: {
      student: {
        vibe: '**자동차공학**과 디자인 두 축이 뚜렷해요. 만드는 쪽이라는 점은 같은데, 하나는 기계고 하나는 조형이라 학교 안에 결이 다른 두 무리가 있어요. 북한산 자락이라 역에서 좀 걸어야 하고, 그만큼 캠퍼스 안에서 지내게 돼요.',
        fitsWho: '손으로 만들어서 굴러가게 하거나 보여주는 게 즐거운 사람. 번화가보다 조용한 동네가 편한 사람.',
      },
      parent: {
        vibe: '**자동차공학**과 디자인 계열이 특화돼 있어요. 북한산 자락이라 주변이 조용하고 캠퍼스 안에서 생활이 이뤄지는 편이에요.',
        fitsWho: '만드는 쪽 진로가 뚜렷한 아이. 조용한 환경을 좋아하는 아이.',
      },
    },
    filter: {},
  },
  {
    id: 'sejong', nameKo: '세종대', nameEn: 'Sejong University',
    url: 'https://www.sejong.ac.kr', region: '서울 광진', type: '사립',
    tagline: '호텔관광과 항공, 바로 직업으로',
    keywords: ['호텔관광', '항공시스템', '어린이대공원'],
    scaleBasis: '추정', scaleNote: '학부 재학생 수는 확인하지 못했다',
    vector: {
      distance: -1, immersion: -0.5, scale: -0.6, bond: 0, legacy: 0.5,
      horizon: 2, domain: 0.5, making: 0.5, openness: 0, intensity: 0, cost: -2,
    },
    facts: {
      scale: '서울 중형 사립이에요. 정확한 학부 재학생 수는 확인하지 못해 숫자를 쓰지 않았어요.',
      campus: '서울 광진구 군자동이에요. **단일 캠퍼스**예요.',
      choice: '무전공 규모는 확인하지 못했어요.',
    },
    detail: {
      student: {
        vibe: '**호텔관광경영**, **항공시스템공학**처럼 학과 이름이 곧 직업인 곳이 많아요. 그래서 "졸업하면 뭘 하지"라는 질문이 다른 학교보다 일찍 정리되는 편이에요.',
        fitsWho: '전공과 직업이 바로 이어지는 게 좋은 사람. 목표가 이미 꽤 뚜렷한 사람.',
      },
      parent: {
        vibe: '**학과와 직업이 직접 연결되는** 실무 계열이 많아요. 진로가 비교적 일찍 그려지는 편이에요.',
        fitsWho: '진로가 구체적으로 정해진 아이.',
      },
    },
    filter: {},
  },
  {
    id: 'seoultech', nameKo: '서울과기대', nameEn: 'Seoul National University of Science and Technology',
    url: 'https://www.seoultech.ac.kr', region: '서울 노원', type: '국립',
    tagline: '서울에 있는 국립, 만드는 공학',
    keywords: ['국립', '실용공학', '넓은 캠퍼스'],
    scaleBasis: '환산', scaleNote: '연간 모집 2,470명 → 학부 약 1만 명 안팎',
    vector: {
      distance: -1.5, immersion: 1, scale: -0.8, bond: 0, legacy: 0.5,
      horizon: 2, domain: 1.5, making: 1.5, openness: 0, intensity: -0.5, cost: 1.5,
    },
    facts: {
      scale: '연간 모집인원이 2,470명이에요. 학부 재학생 수는 직접 확인되지 않아 모집인원으로 규모만 가늠했어요.',
      campus: '서울 노원구 공릉이에요. 캠퍼스가 넓고 주변 상권이 크지 않아 학교 안에서 시간을 보내는 편이에요.',
      choice: '무전공 규모는 확인하지 못했어요.',
    },
    detail: {
      student: {
        vibe: '**서울에 있는 국립대**라 등록금이 사립보다 낮아요. 실용 공학과 디자인 쪽에 무게가 실려 있고, 이론보다 만들어서 굴러가게 하는 쪽을 높게 쳐요. 캠퍼스가 넓고 주변이 조용해서 학교 안에서 지내게 돼요.',
        fitsWho: '만드는 쪽 공학이 맞는 사람. 서울에서 다니면서 학비 부담은 줄이고 싶은 사람.',
      },
      parent: {
        vibe: '**서울 소재 국립대**라 등록금 부담이 사립보다 낮아요. 실용 공학 중심이고 캠퍼스가 넓은 편이에요.',
        fitsWho: '공학 쪽 진로를 생각하면서 학비 부담도 고려하는 경우. 서울에서 통학하려는 아이.',
      },
    },
    filter: {},
  },
  {
    id: 'ajou', nameKo: '아주대', nameEn: 'Ajou University',
    url: 'https://www.ajou.ac.kr', region: '경기 수원', type: '사립',
    tagline: '수원에서 의대와 공대를 함께',
    keywords: ['무전공 454명', '의대·공대', '수원'],
    scaleBasis: '확인', scaleNote: '재학생 약 10,080명',
    vector: {
      distance: 0.5, immersion: 0.5, scale: -0.5, bond: 0.5, legacy: -0.5,
      horizon: 1.5, domain: 1.5, making: 1, openness: 1.5, intensity: 0, cost: -2,
    },
    facts: {
      scale: '재학생 약 1만 명이에요. 출처에 학부 단독인지 명시가 없어 대략의 규모로만 썼어요.',
      campus: '경기 수원시예요. 서울에서 통학하기는 애매해서 근처에 자리를 잡는 경우가 많아요.',
      choice: '2025년 **무전공** 총 454명이에요. **자유전공학부** 166명과 첨단바이오융합대학 75명 등으로 나뉘어요.',
    },
    detail: {
      student: {
        vibe: '수원에 있어서 서울에서 다니기엔 애매하고 근처에 자리를 잡는 경우가 많아요. 의대와 공대가 같이 있고 **산학협력**이 활발해서, 배운 걸 실제로 써보는 기회가 자주 생겨요.',
        fitsWho: '집을 떠나 근처에 자리 잡는 게 괜찮은 사람. 이공계인데 전공을 아직 좁히기 싫은 사람.',
      },
      parent: {
        vibe: '경기 수원 소재로 서울 통학은 쉽지 않아 자취를 고려하게 돼요. 의대와 공대를 함께 갖추고 산학협력이 활발해요. **무전공** 규모도 큰 편이에요.',
        fitsWho: '수도권 안에서 이공계 진로를 생각하는 아이. 전공을 늦게 정하고 싶은 아이.',
      },
    },
    filter: {},
  },
  {
    id: 'inha', nameKo: '인하대', nameEn: 'Inha University',
    url: 'https://www.inha.ac.kr', region: '인천 미추홀', type: '사립',
    tagline: '공항과 항만 옆의 항공·물류',
    keywords: ['항공우주', '물류', '학부 1만 4천'],
    scaleBasis: '확인', scaleNote: '학부 재학생 14,452명',
    vector: {
      distance: 0.5, immersion: 0, scale: 0.2, bond: 0.5, legacy: 1,
      horizon: 1.5, domain: 1.5, making: 1, openness: 0, intensity: 0, cost: -2,
    },
    facts: {
      scale: '학부 재학생 14,452명이에요. 조사 단계에서 2만 명대로 추정했지만 실제로는 1만 4천 명대예요.',
      campus: '인천 미추홀구예요.',
      choice: '무전공 규모는 확인하지 못했어요.',
    },
    detail: {
      student: {
        vibe: '**항공우주**와 물류 쪽 색이 뚜렷해요. 인천공항과 항만이 가까워서 그 산업과 이어지는 게 자연스럽고, 전공과 일할 곳이 지리적으로 붙어 있어요.',
        fitsWho: '항공·물류처럼 분야가 이미 정해진 사람. 배운 걸 실제 현장에서 써보고 싶은 사람.',
      },
      parent: {
        vibe: '**항공우주**·물류 분야가 특화돼 있고 인천공항·항만 산업과 연계가 뚜렷해요. 전공과 진로가 비교적 직접 이어져요.',
        fitsWho: '진로 분야가 정해진 아이. 수도권에서 공학 계열을 생각하는 경우.',
      },
    },
    filter: {},
  },
  {
    id: 'pnu', nameKo: '부산대', nameEn: 'Pusan National University',
    url: 'https://www.pusan.ac.kr', region: '부산 금정', type: '국립',
    tagline: '부산권 거점, 넓은 학과 폭',
    keywords: ['거점국립대', '학부 1만 7천', '부산대 앞'],
    scaleBasis: '확인', scaleNote: '학부 재학생 17,324명',
    vector: {
      distance: 2, immersion: -0.5, scale: 1.0, bond: 1.5, legacy: 1.5,
      horizon: 0.5, domain: 0, making: 0, openness: 0.5, intensity: -0.5, cost: 2,
    },
    facts: {
      scale: '학부 재학생 **17,324명**이에요.',
      campus: '부산 금정구예요. 대학가 상권이 크게 형성돼 있어요.',
      choice: '학부대학 아래 첨단융합학부가 있고, 1학년 공통 과정을 이수한 뒤 2학년에 전공을 골라요. 모집 규모는 확인하지 못했어요.',
    },
    detail: {
      student: {
        vibe: '부산·영남권 **거점 국립대**예요. 등록금이 사립의 절반 아래고 학과 폭이 넓어요. 대학가 상권이 커서 학교 밖에서 보내는 시간도 적지 않아요.',
        fitsWho: '집을 떠나 다른 도시에서 새로 시작하는 게 끌리는 사람. 학비 부담을 줄이고 싶은 사람. 지역에 연고가 있는 사람.',
      },
      parent: {
        vibe: '영남권 **거점 국립대**로 등록금 부담이 사립보다 크게 낮아요. 학과 폭이 넓어 선택지가 많아요. 다만 수도권에서 간다면 자취가 전제돼요.',
        fitsWho: '지역에 연고가 있거나 학비 부담을 줄이려는 경우.',
      },
    },
    filter: {},
  },
  {
    id: 'knu', nameKo: '경북대', nameEn: 'Kyungpook National University',
    url: 'https://www.knu.ac.kr', region: '대구 북구', type: '국립',
    tagline: '대구·경북 거점, 전자가 간판',
    keywords: ['거점국립대', '전자공학', '학부 2만'],
    scaleBasis: '확인', scaleNote: '학부 재학생 19,526명',
    vector: {
      distance: 2, immersion: 0, scale: 1.3, bond: 1, legacy: 1.5,
      horizon: 0.5, domain: 1.5, making: 0.3, openness: 1.5, intensity: -0.5, cost: 2,
    },
    facts: {
      scale: '학부 재학생 **19,526명**으로 거점국립대 중 큰 편이에요.',
      campus: '대구 북구예요.',
      choice: '2025년부터 전공자율선택 모집을 신입생의 **약 25%**까지 늘렸어요. 자율전공학부로 **282명**을 통합 모집하고 2개 학기 뒤 전공을 골라요.',
    },
    detail: {
      student: {
        vibe: '대구·경북 거점 국립대이고 전자 쪽이 간판이에요. **무전공** 비율을 **25%**까지 올려서 전공을 늦게 정하는 선택지가 넓은 편이에요. 등록금은 사립의 절반 아래예요.',
        fitsWho: '이공계 쪽인데 세부 전공을 아직 못 정한 사람. 집을 떠나는 게 괜찮고 학비도 고려하는 사람.',
      },
      parent: {
        vibe: '대구·경북 거점 국립대이고 전자·공학 계열이 강해요. **무전공** 비율이 **25%**로 높은 편이라 전공을 늦게 정할 수 있어요.',
        fitsWho: '지역 연고가 있거나 학비를 고려하는 경우. 이공계 진로를 생각하는 아이.',
      },
    },
    filter: {},
  },
  {
    id: 'jnu', nameKo: '전남대', nameEn: 'Chonnam National University',
    url: 'https://www.jnu.ac.kr', region: '광주 북구', type: '국립',
    tagline: '광주·호남 거점, 결속이 강한 곳',
    keywords: ['거점국립대', '용봉캠퍼스', '지역 결속'],
    scaleBasis: '구간', scaleNote: '학부 재학생 2만~2만 5천 명대',
    vector: {
      distance: 2, immersion: 0, scale: 1.6, bond: 2, legacy: 2,
      horizon: 0.5, domain: -0.5, making: 0, openness: 0, intensity: -1, cost: 2,
    },
    facts: {
      scale: '학부 재학생 **2만~2만 5천 명대**예요. 정확한 수치는 구간까지만 확인됐어요.',
      campus: '광주 북구 용봉캠퍼스가 본교예요. 광주 동구 학동, 전남 여수에도 캠퍼스가 있어요.',
      choice: '무전공 규모는 확인하지 못했어요.',
    },
    detail: {
      student: {
        vibe: '광주·호남권 **거점 국립대**예요. 지역과의 관계가 깊고 동문 결속이 강한 편이에요. 등록금은 사립의 절반 아래고 학과 폭이 넓어요.',
        fitsWho: '집을 떠나 다른 도시에서 새로 시작하는 게 끌리는 사람. 사람들과 계속 엮이는 게 편한 사람. 지역에 연고가 있는 사람.',
      },
      parent: {
        vibe: '호남권 **거점 국립대**로 등록금 부담이 낮고 학과 폭이 넓어요. 지역 사회와의 연결이 강한 편이에요.',
        fitsWho: '지역 연고가 있거나 학비 부담을 줄이려는 경우.',
      },
    },
    filter: {},
  },
  {
    id: 'cnu', nameKo: '충남대', nameEn: 'Chungnam National University',
    url: 'https://plus.cnu.ac.kr', region: '대전 유성', type: '국립',
    tagline: '대덕연구단지 옆의 거점 국립',
    keywords: ['거점국립대', '대덕특구 인접', '연구 연계'],
    scaleBasis: '구간', scaleNote: '학부 재학생 2만~2만 5천 명대',
    vector: {
      distance: 2, immersion: 0.5, scale: 1.7, bond: 0.5, legacy: 1, 
      horizon: -1.5, domain: 1, making: 0, openness: 0, intensity: 0, cost: 2,
    },
    facts: {
      scale: '학부 재학생 **2만~2만 5천 명대**예요. 정확한 수치는 구간까지만 확인됐어요.',
      campus: '대전 유성구 대덕캠퍼스가 본교로 대부분의 단과대학이 있어요. 중구 보운캠퍼스에는 의과대학 계열이 있어요.',
      choice: '무전공 규모는 확인하지 못했어요.',
    },
    detail: {
      student: {
        vibe: '**대덕연구단지**가 가까워서 연구기관과 이어지는 게 다른 **거점국립대**보다 자연스러워요. 그래서 취업보다 연구·대학원 쪽으로 가는 흐름이 상대적으로 뚜렷한 편이에요.',
        fitsWho: '연구 쪽을 생각하고 있는 사람. 집을 떠나는 게 괜찮고 학비도 고려하는 사람.',
      },
      parent: {
        vibe: '**대덕연구단지**에 인접해 연구기관 연계가 강한 **거점 국립대**예요. 등록금 부담이 낮아요.',
        fitsWho: '연구·대학원 쪽을 생각하는 아이. 학비를 고려하는 경우.',
      },
    },
    filter: {},
  },
  {
    id: 'jbnu', nameKo: '전북대', nameEn: 'Jeonbuk National University',
    url: 'https://www.jbnu.ac.kr', region: '전북 전주', type: '국립',
    tagline: '전주에서 여유 있게, 수의·농생명',
    keywords: ['거점국립대', '3개 캠퍼스', '수의·농생명'],
    scaleBasis: '구간', scaleNote: '학부 재학생 2만~2만 5천 명대',
    vector: {
      distance: 2, immersion: 1, scale: 1.9, bond: 2, legacy: 1.5,
      horizon: 0.5, domain: 1, making: 0.5, openness: 0, intensity: -2, cost: 2,
    },
    facts: {
      scale: '학부 재학생 **2만~2만 5천 명대**예요. 학부 입학정원은 **3,848명**이에요.',
      campus: '전주·익산·고창 세 곳이에요. 익산에 **수의과대학**과 환경생명자원대학이 있어요.',
      choice: '무전공 규모는 확인하지 못했어요.',
    },
    detail: {
      student: {
        vibe: '전주라는 도시 자체가 서울보다 속도가 느려서 생활 리듬이 여유로운 편이에요. **수의·농생명** 쪽이 강하고, 그쪽은 익산 캠퍼스에 있어요.',
        fitsWho: '몰아치는 리듬보다 균형이 맞는 사람. 수의·농생명처럼 분야가 정해진 사람. 집을 떠나는 게 괜찮은 사람.',
      },
      parent: {
        vibe: '전북 **거점 국립대**로 **수의·농생명** 분야가 강해요. 캠퍼스가 전주·익산·고창 세 곳이라 전공에 따라 소재지가 달라요.',
        fitsWho: '수의·농생명 쪽 진로를 생각하는 아이. 학비 부담을 줄이려는 경우.',
      },
    },
    filter: { dualCampus: '전주·익산·고창 세 곳이고, 수의과대학은 익산이에요.' },
  },
  {
    id: 'unist', nameKo: 'UNIST', nameEn: 'Ulsan National Institute of Science and Technology',
    url: 'https://www.unist.ac.kr', region: '울산 울주', type: '과기원',
    tagline: '가장 최근에 만들어진 과기원',
    keywords: ['2009년 개교', '이차전지·에너지', '학부 2,194명'],
    scaleBasis: '확인', scaleNote: '학부 재학생 2,194명',
    vector: {
      distance: 2, immersion: 2, scale: -1.6, bond: 1.5, legacy: -2,
      horizon: -1, domain: 1.5, making: 1.2, openness: 1, intensity: 0.8, cost: 2,
    },
    facts: {
      scale: '학부 재학생 **2,194명**, 대학원생 **2,358명**이에요. 대학원이 더 큰 연구 중심 구조예요.',
      campus: '울산 울주군이에요. 기숙사 생활이 기본이고 생활이 캠퍼스 안에서 끝나요.',
      choice: '1학년을 학과 없이 보내고 1학년 2학기 말에 학부와 트랙을 골라요. 다만 입학한 계열(공학·경영) 안에서만 고를 수 있어 완전 자유는 아니에요.',
    },
    detail: {
      student: {
        vibe: '2009년에 문을 열어서 30곳 중 가장 새 학교예요. 그만큼 굳어진 규칙이 적고 만들어지는 중인 느낌이 있어요. **이차전지·에너지** 쪽이 강하고 울산 산업단지와 이어져 있어요.',
        fitsWho: '전통이 쌓인 곳보다 아직 만들어지는 중인 곳이 끌리는 사람. 이공계이고 대학원까지 생각하는 사람.',
      },
      parent: {
        vibe: '2009년 개교한 **과학기술원**으로 이차전지·에너지 분야가 강해요. 기숙 생활이 기본이고 연구 중심 구조예요. 학비 부담이 낮아요.',
        fitsWho: '이공계 연구 쪽을 생각하는 아이. 집을 떠나 기숙 생활을 할 수 있는 아이.',
      },
    },
    filter: {},
  },
  {
    id: 'gist', nameKo: 'GIST', nameEn: 'Gwangju Institute of Science and Technology',
    url: 'https://www.gist.ac.kr', region: '광주 북구', type: '과기원',
    tagline: '한 학년 200명, 무학과로 시작',
    keywords: ['학년당 200명', '기초교육학부', '광주'],
    scaleBasis: '확인', scaleNote: '학부 정원 800명 (학년당 200명)',
    vector: {
      distance: 2, immersion: 2, scale: -2.0, bond: 2, legacy: -1.5,
      horizon: -2, domain: 2, making: 0.2, openness: 1.5, intensity: 0.8, cost: 2,
    },
    facts: {
      scale: '학부 정원 **800명**, 학년당 **200명**이에요. 대학원이 1,200명으로 더 커요.',
      campus: '광주 북구예요. 기숙사 생활이 기본이에요.',
      choice: '2010년부터 **무전공**으로 뽑아요. 전원이 기초교육학부로 들어와 1학년에 기초과학을 이수하고 2학년에 전공을 골라요.',
    },
    detail: {
      student: {
        vibe: '한 학년이 **200명**이라 서로 다 알게 돼요. 1학년은 학과 없이 기초과학을 같이 배우고 2학년에 전공을 정해요. 대학원이 학부보다 커서 연구실이 가까워요.',
        fitsWho: '아주 작은 규모가 편한 사람. 이공계이고 연구 쪽을 생각하는 사람. 기초부터 다지고 전공을 정하고 싶은 사람.',
      },
      parent: {
        vibe: '학년당 **200명** 규모의 **과학기술원**이에요. 1학년은 전공 없이 기초과학을 배우고 2학년에 전공을 정해요. 학비 부담이 낮고 연구 중심이에요.',
        fitsWho: '소규모 환경에서 안정을 얻는 아이. 이공계 연구 진로를 생각하는 아이.',
      },
    },
    filter: {},
  },
  {
    id: 'karts', nameKo: '한예종', nameEn: 'Korea National University of Arts',
    url: 'https://www.karts.ac.kr', region: '서울 성북 · 서초', type: '국립 특수',
    tagline: '실기로 들어가 실기로 졸업하는 곳',
    keywords: ['국립 예술학교', '실기 입시', '원 단위 선발'],
    scaleBasis: '추정', scaleNote: '예술사 과정 재학생 수는 확인하지 못했다',
    vector: {
      distance: -1.5, immersion: 0, scale: -1.7, bond: 1, legacy: -0.5,
      horizon: 0, domain: -1, making: 2, openness: -2, intensity: 2, cost: 1.5,
    },
    facts: {
      scale: '원 단위로 소수를 뽑아요. 정확한 재학생 수는 확인하지 못해 숫자를 쓰지 않았어요.',
      campus: '석관동(성북)에 본부·연극원·영상원·미술원·전통예술원·예술교양학부가 있고, 서초동에 음악원·무용원이 있어요.',
      choice: '원 단위 실기 선발이라 입학할 때 전공이 정해지고 바꾸기 어려워요. 30곳 중 전공 선택 폭이 가장 좁아요.',
    },
    detail: {
      student: {
        vibe: '교육부가 아니라 **문화체육관광부** 소관인 국립 예술학교예요. 입시가 **실기와 오디션**이라 준비 과정부터 다른 학교와 완전히 달라요. 들어오면 4년 내내 그 분야를 하고, 평가도 계속 실기로 받아요.',
        fitsWho: '이미 그 분야를 오래 해왔고 계속할 사람. 작품으로 평가받는 게 당연한 사람. 전공을 바꿀 생각이 없는 사람.',
      },
      parent: {
        vibe: '**문화체육관광부** 소관 국립 예술학교로 **실기·오디션**으로 선발해요. 일반 수능 트랙과 준비 과정이 완전히 달라요. 국립이라 학비 부담은 낮아요.',
        fitsWho: '예술 실기를 오래 해왔고 그 길로 갈 아이. 전공을 바꿀 가능성을 두지 않아도 되는 경우.',
      },
    },
    filter: { practicalExam: '실기·오디션으로 선발해요. 일반 수능 트랙과 준비 과정이 완전히 달라요.' },
  },
];

const SCHOOLS_BY_ID = {};
SCHOOLS.forEach(function (s) { SCHOOLS_BY_ID[s.id] = s; });

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SCHOOLS: SCHOOLS, SCHOOLS_BY_ID: SCHOOLS_BY_ID };
}

/**
 * ── 엔진이 기대하는 형태로 맞춰준다 ───────────────────────────
 *
 * js/app.js 와 js/resultImage.js 는 아이비 버전과 공유한다. 그쪽이 기대하는
 * 필드 이름(location, color, detail.strength, forParents)에 맞춰
 * 위에서 쓴 데이터를 옮겨 담는다. 위쪽 데이터를 그 형태로 직접 쓰지 않은 건
 * 읽고 고치기 좋은 모양을 유지하기 위해서다.
 *
 * color 는 학교 상징색이 아니다. 30곳 전부 확인이 안 돼서 쓰지 않기로 했고
 * (docs/korea-fact-check.md 참고), 대신 설립 유형별 팔레트를 쓴다.
 * 학교색으로 오해하지 않도록 실제 교색과 겹치지 않는 색으로 골랐다.
 */
var TYPE_COLOR = {
  '국립': '#1F5B41',
  '공립': '#2E6E8E',
  '사립': '#8C4A3C',
  '과기원': '#3B4E8C',
  '국립 특수': '#6B4A8C',
};

/**
 * 세 줄을 한 문단으로 이어 붙이면 같은 말이 두 번 굵어진다 —
 * 중앙대는 규모 줄과 캠퍼스 줄에 '다빈치캠퍼스'가 둘 다 나온다.
 * 한 문단 안에서 같은 말은 처음 한 번만 굵게 남긴다.
 */
function dedupeEmphasis(text) {
  var seen = {};
  return text.replace(/\*\*(.+?)\*\*/g, function (whole, inner) {
    if (seen[inner]) return inner;
    seen[inner] = 1;
    return whole;
  });
}

SCHOOLS.forEach(function (s) {
  s.location = s.region;
  s.color = TYPE_COLOR[s.type] || '#5A5A5A';
  s.taglineParent = s.tagline;

  // 세 번째 해설 칸: 확인된 사실을 그대로 보여준다.
  // 여기만 문장이 아니라 사실 나열인 게 의도다 — 나머지 두 칸은 해석이고
  // 이 칸은 근거다. 근거와 해석을 섞지 않으려고 분리했다.
  //
  // 학부모 모드에서는 캠퍼스·전공선택을 빼고 규모만 남긴다. 바로 아래
  // 학부모 블록이 그 두 가지를 '환경과 규모'·'졸업 후'라는 제목을 달고
  // 다시 보여주기 때문이다. 같은 문장이 한 화면에 두 번 나오면
  // 자료가 많은 게 아니라 대충 만든 것처럼 읽힌다.
  s.detail.student.strength = dedupeEmphasis(
    [s.facts.scale, s.facts.campus, s.facts.choice].filter(Boolean).join(' ')
  );
  s.detail.parent.strength = s.facts.scale;

  // 학부모 모드 전용 블록
  s.forParents = {
    aid: s.type + '. ' + (
      s.type === '국립' || s.type === '공립' || s.type === '과기원' || s.type === '국립 특수'
        ? '사립보다 등록금 부담이 낮아요.'
        : '등록금은 사립 수준이에요.'
    ) + ' 정확한 금액은 학교 홈페이지에서 확인하세요.',
    place: s.facts.campus,
    after: s.facts.choice,
  };
});
