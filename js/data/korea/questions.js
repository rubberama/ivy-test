/**
 * 20개 질문 (학생용 / 학부모용)
 *
 * 구조는 아이비 버전과 같다. text 와 label 은 { student, parent } 두 벌인데
 * weights 는 하나만 둔다. 두 모드가 같은 가중치를 써야 같은 답에 같은 결과가
 * 나오고, 검증도 한 번만 돌리면 된다.
 *
 * 말투는 앱 전체가 해요체다. 문항은 "~나요?" 로 묻고 선택지는 그 답을
 * 해요체 한 문장으로 적는다. 반말·합니다체·평서형을 섞지 말 것.
 *
 * 주축 배분: 10개 축 × 2문항 = 20.
 * 각 문항은 주축을 -2 / -1 / +1 / +2 로 훑고 보조축을 ±1 로 얹는다.
 *
 * ── 이 테스트에서 특히 조심한 것 ──────────────────────────────
 * 1) 사회적 바람직성 편향.
 *    "열심히 하고 싶다", "사람들과 잘 지내고 싶다" 쪽으로 답이 몰리면
 *    intensity·bond 가 통째로 양수로 눌려서 결과가 몇 개 학교로 수렴한다.
 *    그래서 네 선택지의 사회적 매력도를 비슷하게 맞췄다. 특히 q14 는
 *    "혼자 넘긴다"가 결함으로 읽히지 않게 "혼자 정리하는 게 제일 빨라요"로 썼다.
 * 2) 학비를 묻지 않는다.
 *    cost 축은 매칭에서 빠져 있고 문항도 없다. "학비가 부담된다"고 답한
 *    사람에게 국공립만 골라 보여주면 성향 매칭이 아니라 형편 분류가 된다.
 * 3) 성적·등급·모의고사를 묻는 문항은 하나도 없다.
 *    이건 성향 매칭이지 입시 결과 예측이 아니다.
 */
const QUESTIONS = [
  {
    id: 'q1',
    primary: 'distance',
    text: {
      student: '대학 때문에 집을 떠나야 한다면 어떤가요?',
      parent: '아이가 대학 때문에 집을 떠나야 한다면 어떨까요?',
    },
    options: [
      {
        label: {
          student: '오히려 그게 끌려요. 아는 사람 없는 데서 새로 시작하고 싶어요',
          parent: '오히려 그걸 반길 것 같아요. 새로 시작하는 걸 좋아해요',
        },
        weights: { distance: 2, immersion: 1 },
      },
      {
        label: {
          student: '가는 건 괜찮아요. 대신 방학엔 자주 올라오고 싶어요',
          parent: '가는 건 괜찮아 하는데 방학엔 자주 올 것 같아요',
        },
        weights: { distance: 1, bond: -1 },
      },
      {
        label: {
          student: '주말에는 집에 올 수 있는 거리였으면 좋겠어요',
          parent: '주말에 집에 올 수 있는 거리였으면 좋겠어요',
        },
        weights: { distance: -1, bond: 1 },
      },
      {
        label: {
          student: '매일 집에서 오가는 게 저한테는 훨씬 나아요',
          parent: '집에서 다니는 쪽이 아이한테 훨씬 나을 것 같아요',
        },
        weights: { distance: -2, immersion: -1 },
      },
    ],
  },
  {
    id: 'q2',
    primary: 'immersion',
    text: {
      student: '수업이 끝나고 시간이 비면 어디에 있나요?',
      parent: '아이는 시간이 비면 주로 어디에 있나요?',
    },
    options: [
      {
        label: {
          student: '학교 앞으로 나가요. 카페든 거리든 사람 있는 데로요',
          parent: '학교 앞이든 동네든 사람 있는 곳으로 나가요',
        },
        weights: { immersion: -2, distance: -1 },
      },
      {
        label: {
          student: '지하철 타고 아예 다른 동네까지 나가요',
          parent: '아예 다른 동네까지 나가는 걸 좋아해요',
        },
        weights: { immersion: -1, making: 1 },
      },
      {
        label: {
          student: '도서관이나 과방이요. 있던 자리에서 해결해요',
          parent: '도서관이나 교실처럼 있던 자리에서 해결해요',
        },
        weights: { immersion: 1, scale: -1 },
      },
      {
        label: {
          student: '방에 들어가서 쉬거나 같이 지내는 사람들이랑 있어요',
          parent: '집이나 방에 들어가서 쉬는 편이에요',
        },
        weights: { immersion: 2, bond: 1 },
      },
    ],
  },
  {
    id: 'q3',
    primary: 'scale',
    text: {
      student: '어느 정도 크기의 강의실이 편한가요?',
      parent: '아이는 어느 정도 크기의 교실을 편해하나요?',
    },
    options: [
      {
        label: {
          student: '300명쯤이요. 아무도 저를 모르는 게 오히려 편해요',
          parent: '사람이 아주 많아서 묻혀 있는 쪽을 편해해요',
        },
        weights: { scale: 2, bond: -1 },
      },
      {
        label: {
          student: '사람은 많은데 그 안에 제 무리가 따로 있는 정도요',
          parent: '사람은 많아도 그 안에 자기 무리가 있으면 괜찮아 해요',
        },
        weights: { scale: 1, legacy: 1 },
      },
      {
        label: {
          student: '스무 명쯤이요. 곧 다들 이름을 부르게 될 것 같은 정도요',
          parent: '스무 명 남짓이요. 서로 이름을 아는 정도를 좋아해요',
        },
        weights: { scale: -1, bond: 1 },
      },
      {
        label: {
          student: '열 명 남짓이요. 교수님이 제 이름을 아는 게 좋아요',
          parent: '인원이 아주 적어서 선생님이 이름을 아는 곳을 좋아해요',
        },
        weights: { scale: -2, immersion: 1 },
      },
    ],
  },
  {
    id: 'q4',
    primary: 'bond',
    text: {
      student: '학과 단톡방에 다 같이 모인다는 공지가 뜨면 어떤가요?',
      parent: '아이는 단체 모임 공지가 뜨면 어떤 편인가요?',
    },
    options: [
      {
        label: {
          student: '이런 게 재밌어서 대학 온 거예요. 당연히 가요',
          parent: '이런 걸 재밌어해요. 빠지지 않고 챙겨요',
        },
        weights: { bond: 2, legacy: 1 },
      },
      {
        label: {
          student: '친한 사람들이 가면 저도 가요',
          parent: '친한 친구들이 가면 같이 가요',
        },
        weights: { bond: 1, distance: -1 },
      },
      {
        label: {
          student: '매번은 힘들고 가끔이면 괜찮아요',
          parent: '매번은 힘들어하고 가끔이면 가요',
        },
        weights: { bond: -1, intensity: 1 },
      },
      {
        label: {
          student: '안 가도 아무 일 없는 분위기였으면 좋겠어요',
          parent: '안 가도 아무 일 없는 분위기를 편해해요',
        },
        weights: { bond: -2, openness: 1 },
      },
    ],
  },
  {
    id: 'q5',
    primary: 'legacy',
    text: {
      student: '두 학교가 있다면 어느 쪽이 더 끌리나요?',
      parent: '두 학교가 있다면 아이에게 어느 쪽이 맞을까요?',
    },
    options: [
      {
        label: {
          student: '100년 넘은 곳이요. 쌓인 이야기가 있는 게 좋아요',
          parent: '오래된 곳이요. 쌓인 것이 있는 쪽이 든든해요',
        },
        weights: { legacy: 2, bond: 1 },
      },
      {
        label: {
          student: '역사도 있고 요즘 분위기도 바뀌는 중인 곳이요',
          parent: '역사도 있으면서 지금도 바뀌는 중인 곳이요',
        },
        weights: { legacy: 1, scale: 1 },
      },
      {
        label: {
          student: '생긴 지 얼마 안 됐어도 방향이 확실하면 돼요',
          parent: '생긴 지 얼마 안 됐어도 방향이 확실하면 괜찮아요',
        },
        weights: { legacy: -1, horizon: -1 },
      },
      {
        label: {
          student: '아직 아무것도 안 정해진 데서 제가 만드는 게 좋아요',
          parent: '아직 정해진 게 없는 곳에서 직접 만드는 걸 좋아해요',
        },
        weights: { legacy: -2, making: 1 },
      },
    ],
  },
  {
    id: 'q6',
    primary: 'horizon',
    text: {
      student: '궁금한 게 생기면 어떤 쪽인가요?',
      parent: '아이는 궁금한 게 생기면 어떤 편인가요?',
    },
    options: [
      {
        label: {
          student: '답이 나올 때까지 파요. 써먹을 데가 없어도 상관없어요',
          parent: '답이 나올 때까지 파요. 쓸모를 따지지 않아요',
        },
        weights: { horizon: -2, domain: -1 },
      },
      {
        label: {
          student: '일단 알아보고 재밌으면 더 파요',
          parent: '일단 알아보고 재밌으면 더 파요',
        },
        weights: { horizon: -1, openness: 1 },
      },
      {
        label: {
          student: '이걸 어디에 쓸 수 있는지부터 생각해요',
          parent: '어디에 쓸 수 있는지부터 따져요',
        },
        weights: { horizon: 1, making: 1 },
      },
      {
        label: {
          student: '지금 제 진로에 안 걸리면 나중으로 미뤄요',
          parent: '진로에 안 걸리면 나중으로 미뤄요',
        },
        weights: { horizon: 2, intensity: 1 },
      },
    ],
  },
  {
    id: 'q7',
    primary: 'domain',
    text: {
      student: '나도 모르게 계속 보게 되는 건 어느 쪽인가요?',
      parent: '아이가 시간 가는 줄 모르고 보는 건 어느 쪽인가요?',
    },
    options: [
      {
        label: {
          student: '기계 뜯거나 원리를 뜯어서 설명해주는 것이요',
          parent: '기계나 원리를 뜯어서 설명해주는 걸 좋아해요',
        },
        weights: { domain: 2, making: 1 },
      },
      {
        label: {
          student: '숫자나 자료에서 규칙 찾아내는 것이요',
          parent: '숫자나 자료에서 규칙을 찾아내는 걸 좋아해요',
        },
        weights: { domain: 1, horizon: -1 },
      },
      {
        label: {
          student: '누가 뭔가 만들어내는 과정이요. 그림이든 영상이든요',
          parent: '누가 뭔가 만들어내는 과정을 좋아해요',
        },
        weights: { domain: -1, making: 1 },
      },
      {
        label: {
          student: '사람들이 왜 그렇게 행동하는지, 사회나 역사 이야기요',
          parent: '사람과 사회 이야기를 좋아해요',
        },
        weights: { domain: -2, bond: -1 },
      },
    ],
  },
  {
    id: 'q8',
    primary: 'making',
    text: {
      student: '조별과제에서 하나만 맡는다면 무엇을 하나요?',
      parent: '조별과제에서 아이는 주로 무엇을 맡나요?',
    },
    options: [
      {
        label: {
          student: '자료 찾고 논리 짜는 것이요',
          parent: '자료 찾고 논리를 짜는 쪽이에요',
        },
        weights: { making: -2, domain: -1 },
      },
      {
        label: {
          student: '대본 쓰고 앞에 나가서 발표하는 것이요',
          parent: '앞에 나가서 발표하는 쪽이에요',
        },
        weights: { making: -1, bond: 1 },
      },
      {
        label: {
          student: '자료 화면이랑 영상, 보이는 걸 전부 만드는 것이요',
          parent: '화면이든 영상이든 보이는 걸 만드는 쪽이에요',
        },
        weights: { making: 1, horizon: 1 },
      },
      {
        label: {
          student: '주제부터 다시 잡자고 판을 뒤집는 것이요',
          parent: '주제부터 다시 잡자고 판을 뒤집는 쪽이에요',
        },
        weights: { making: 2, openness: 1 },
      },
    ],
  },
  {
    id: 'q9',
    primary: 'openness',
    text: {
      student: "'뭐 하고 싶어?'라는 질문을 받으면 어떤가요?",
      parent: '아이에게 뭐 하고 싶냐고 물으면 어떤가요?',
    },
    options: [
      {
        label: {
          student: '아직 모르겠어요. 지금 정하라는 게 제일 답답해요',
          parent: '아직 모르겠다고 해요. 지금 정하라는 걸 답답해해요',
        },
        weights: { openness: 2, horizon: -1 },
      },
      {
        label: {
          student: '후보가 몇 개 있는데 다 해보고 정하고 싶어요',
          parent: '후보가 몇 개 있고 다 해보고 정하고 싶어 해요',
        },
        weights: { openness: 1, scale: 1 },
      },
      {
        label: {
          student: '대충 정했고 그 안에서 깊게 가고 싶어요',
          parent: '대충 정했고 그 안에서 깊게 가려고 해요',
        },
        weights: { openness: -1, intensity: 1 },
      },
      {
        label: {
          student: '이미 정해졌어요. 다른 데 기웃거릴 시간이 아까워요',
          parent: '이미 정해져 있어요. 다른 걸 볼 생각이 없어요',
        },
        weights: { openness: -2, horizon: 1 },
      },
    ],
  },
  {
    id: 'q10',
    primary: 'intensity',
    text: {
      student: '방학 두 달이 통으로 비면 어떻게 쓰나요?',
      parent: '방학이 통으로 비면 아이는 어떻게 쓰나요?',
    },
    options: [
      {
        label: {
          student: '하나 정해서 두 달 내내 그것만 파요',
          parent: '하나 정해서 두 달 내내 그것만 파요',
        },
        weights: { intensity: 2, openness: -1 },
      },
      {
        label: {
          student: '몰아서 하다가 중간에 쉬고 다시 몰아서 해요',
          parent: '몰아서 하다가 쉬고 다시 몰아서 해요',
        },
        weights: { intensity: 1, horizon: 1 },
      },
      {
        label: {
          student: '이것저것 조금씩 해요. 여행도 가고요',
          parent: '이것저것 조금씩 해요. 여행도 가고요',
        },
        weights: { intensity: -1, distance: 1 },
      },
      {
        label: {
          student: '일단 쉬어요. 학기 중에 이미 다 썼어요',
          parent: '일단 쉬어요. 학기 중에 이미 다 썼거든요',
        },
        weights: { intensity: -2, immersion: -1 },
      },
    ],
  },
  {
    id: 'q11',
    primary: 'distance',
    text: {
      student: '앞으로 4년 동안 어디에서 살고 싶나요?',
      parent: '아이가 4년을 어디에서 지내면 좋을까요?',
    },
    options: [
      {
        label: {
          student: '지금 살던 동네요. 생활을 안 바꾸고 싶어요',
          parent: '지금 사는 동네요. 생활이 안 바뀌는 쪽이요',
        },
        weights: { distance: -2, immersion: -1 },
      },
      {
        label: {
          student: '집에서 지하철로 갈 수 있는 데면 좋겠어요',
          parent: '집에서 대중교통으로 갈 수 있는 곳이요',
        },
        weights: { distance: -1, scale: 1 },
      },
      {
        label: {
          student: '자취든 기숙사든 새 동네요. 가끔 집에 갈 수 있게요',
          parent: '자취든 기숙사든 새 동네요. 가끔 올 수 있는 거리로요',
        },
        weights: { distance: 1, bond: 1 },
      },
      {
        label: {
          student: '아예 다른 지역이요. 완전히 새로 시작하는 게 좋아요',
          parent: '아예 다른 지역이요. 새로 시작해보는 것도 좋아요',
        },
        weights: { distance: 2, legacy: -1 },
      },
    ],
  },
  {
    id: 'q12',
    primary: 'immersion',
    text: {
      student: '학교 정문을 나서면 뭐가 있었으면 좋겠나요?',
      parent: '아이가 다닐 학교 앞에 뭐가 있으면 좋을까요?',
    },
    options: [
      {
        label: {
          student: '번화가요. 술집이든 공연장이든 전시든 다 있는 곳이요',
          parent: '번화가요. 볼 것과 할 것이 많은 곳이요',
        },
        weights: { immersion: -2, scale: 1 },
      },
      {
        label: {
          student: '밥집이랑 카페 정도 있는 적당한 상권이요',
          parent: '밥집과 카페 정도 있는 적당한 상권이요',
        },
        weights: { immersion: -1, horizon: 1 },
      },
      {
        label: {
          student: '조용한 동네요. 걸을 만한 길이 있으면 좋겠어요',
          parent: '조용한 동네요. 산책할 곳이 있으면 좋겠어요',
        },
        weights: { immersion: 1, intensity: 1 },
      },
      {
        label: {
          student: '밖에 뭐가 있든 상관없어요. 학교 안이 다 갖춰져 있으면 돼요',
          parent: '밖은 상관없어요. 학교 안이 갖춰져 있으면 돼요',
        },
        weights: { immersion: 2, bond: 1 },
      },
    ],
  },
  {
    id: 'q13',
    primary: 'scale',
    text: {
      student: '4년 뒤에 학교에서 아는 사람이 몇 명쯤이면 좋을까요?',
      parent: '아이가 4년 뒤에 학교에서 몇 명쯤 알고 지내면 좋을까요?',
    },
    options: [
      {
        label: {
          student: '한 학년 얼굴을 거의 다 아는 정도요',
          parent: '한 학년을 거의 다 아는 정도요',
        },
        weights: { scale: -2, bond: 1 },
      },
      {
        label: {
          student: '과 사람들은 다 알고 그 밖으로는 조금이요',
          parent: '과 사람들은 다 알고 그 밖으로는 조금이요',
        },
        weights: { scale: -1, intensity: 1 },
      },
      {
        label: {
          student: '여러 무리에 걸쳐서 넓게 아는 정도요',
          parent: '여러 무리에 걸쳐 넓게 아는 정도요',
        },
        weights: { scale: 1, openness: 1 },
      },
      {
        label: {
          student: '4년 내내 모르는 얼굴이 계속 생겨도 괜찮아요',
          parent: '모르는 얼굴이 계속 생겨도 개의치 않아요',
        },
        weights: { scale: 2, bond: -1 },
      },
    ],
  },
  {
    id: 'q14',
    primary: 'bond',
    text: {
      student: '힘든 일이 생기면 어떻게 하나요?',
      parent: '아이는 힘든 일이 생기면 어떻게 하나요?',
    },
    options: [
      {
        label: {
          student: '주변 사람들한테 바로 말해요. 같이 있으면 나아져요',
          parent: '주변에 바로 말해요. 사람들과 있으면 나아져요',
        },
        weights: { bond: 2, immersion: 1 },
      },
      {
        label: {
          student: '친한 몇 명한테만 얘기해요',
          parent: '친한 몇 명한테만 얘기해요',
        },
        weights: { bond: 1, legacy: 1 },
      },
      {
        label: {
          student: '일단 혼자 정리하고 나중에 얘기해요',
          parent: '일단 혼자 정리하고 나중에 얘기해요',
        },
        weights: { bond: -1, intensity: 1 },
      },
      {
        label: {
          student: '혼자 정리하는 게 제일 빨라요',
          parent: '혼자 정리하는 쪽이 빠른 아이예요',
        },
        weights: { bond: -2, openness: 1 },
      },
    ],
  },
  {
    id: 'q15',
    primary: 'legacy',
    text: {
      student: "'우리 학교는 원래 이렇게 해'라는 말을 들으면 어떤가요?",
      parent: "'원래 이렇게 한다'는 말에 아이는 어떤 편인가요?",
    },
    options: [
      {
        label: {
          student: '그런 게 있는 게 좋아요. 저도 그 안에 들어가고 싶어요',
          parent: '그런 게 있는 걸 좋아해요. 그 안에 들어가고 싶어 해요',
        },
        weights: { legacy: 2, bond: 1 },
      },
      {
        label: {
          student: '이유가 있으면 따라요',
          parent: '이유가 있으면 따라요',
        },
        weights: { legacy: 1, intensity: 1 },
      },
      {
        label: {
          student: '왜 그런지 모르겠으면 안 따라요',
          parent: '납득이 안 되면 안 따라요',
        },
        weights: { legacy: -1, openness: 1 },
      },
      {
        label: {
          student: '그런 게 아예 없는 학교가 편해요',
          parent: '그런 게 없는 곳을 편해해요',
        },
        weights: { legacy: -2, making: 1 },
      },
    ],
  },
  {
    id: 'q16',
    primary: 'horizon',
    text: {
      student: '4년 뒤의 나를 상상하면 어떤 장면인가요?',
      parent: '아이의 4년 뒤를 상상하면 어떤 장면인가요?',
    },
    options: [
      {
        label: {
          student: '연구실에서 뭔가 붙잡고 있어요',
          parent: '연구실에서 뭔가 붙잡고 있어요',
        },
        weights: { horizon: -2, scale: -1 },
      },
      {
        label: {
          student: '더 공부할지 일을 시작할지 그때 정하고 있어요',
          parent: '더 공부할지 일을 시작할지 그때 정하고 있어요',
        },
        weights: { horizon: -1, openness: 1 },
      },
      {
        label: {
          student: '첫 출근을 앞두고 있어요',
          parent: '첫 출근을 앞두고 있어요',
        },
        weights: { horizon: 1, domain: 1 },
      },
      {
        label: {
          student: '이미 제 일로 돈을 벌고 있어요',
          parent: '이미 자기 일로 돈을 벌고 있어요',
        },
        weights: { horizon: 2, making: 1 },
      },
    ],
  },
  {
    id: 'q17',
    primary: 'domain',
    text: {
      student: '어려운 문제를 만나면 먼저 무엇을 하나요?',
      parent: '아이는 어려운 문제를 만나면 먼저 무엇을 하나요?',
    },
    options: [
      {
        label: {
          student: '관련된 글부터 찾아 읽어요',
          parent: '관련된 글부터 찾아 읽어요',
        },
        weights: { domain: -2, making: -1 },
      },
      {
        label: {
          student: '아는 사람들한테 물어보고 얘기해봐요',
          parent: '주변에 물어보고 얘기해봐요',
        },
        weights: { domain: -1, bond: 1 },
      },
      {
        label: {
          student: '일단 만들어보고 안 되면 고쳐요',
          parent: '일단 만들어보고 안 되면 고쳐요',
        },
        weights: { domain: 1, horizon: 1 },
      },
      {
        label: {
          student: '숫자로 바꿔서 계산해봐요',
          parent: '숫자로 바꿔서 계산해봐요',
        },
        weights: { domain: 2, intensity: 1 },
      },
    ],
  },
  {
    id: 'q18',
    primary: 'making',
    text: {
      student: '지금까지 제일 뿌듯했던 순간은 언제인가요?',
      parent: '아이가 가장 뿌듯해했던 순간은 언제인가요?',
    },
    options: [
      {
        label: {
          student: '아무도 못 풀던 걸 제가 풀었을 때요',
          parent: '아무도 못 풀던 걸 풀어냈을 때요',
        },
        weights: { making: -2, intensity: 1 },
      },
      {
        label: {
          student: '제가 쓴 글이나 한 말이 누군가를 설득했을 때요',
          parent: '쓴 글이나 한 말이 누군가를 설득했을 때요',
        },
        weights: { making: -1, horizon: 1 },
      },
      {
        label: {
          student: '만든 게 실제로 굴러갔을 때요',
          parent: '만든 게 실제로 굴러갔을 때요',
        },
        weights: { making: 1, domain: 1 },
      },
      {
        label: {
          student: '제가 만든 걸 남들이 보고 반응했을 때요',
          parent: '만든 걸 남들이 보고 반응했을 때요',
        },
        weights: { making: 2, domain: -1 },
      },
    ],
  },
  {
    id: 'q19',
    primary: 'openness',
    text: {
      student: '입학할 때 전공이 정해져 있는 게 좋나요?',
      parent: '입학할 때 전공이 정해져 있는 게 아이에게 나을까요?',
    },
    options: [
      {
        label: {
          student: '정해져 있는 게 좋아요. 흔들릴 일이 없어요',
          parent: '정해져 있는 게 나아요. 흔들릴 일이 없어요',
        },
        weights: { openness: -2, horizon: 1 },
      },
      {
        label: {
          student: '큰 틀만 정하고 세부는 나중에 고르고 싶어요',
          parent: '큰 틀만 정하고 세부는 나중에 고르는 쪽이요',
        },
        weights: { openness: -1, intensity: 1 },
      },
      {
        label: {
          student: '1년쯤 지내보고 정하고 싶어요',
          parent: '1년쯤 지내보고 정하는 쪽이요',
        },
        weights: { openness: 1, scale: 1 },
      },
      {
        label: {
          student: '전공을 여러 개 얹을 수 있으면 좋겠어요',
          parent: '전공을 여러 개 할 수 있으면 좋겠어요',
        },
        weights: { openness: 2, legacy: -1 },
      },
    ],
  },
  {
    id: 'q20',
    primary: 'intensity',
    text: {
      student: '어떤 리듬이 나한테 맞나요?',
      parent: '아이한테는 어떤 리듬이 맞나요?',
    },
    options: [
      {
        label: {
          student: '한 가지에 갈아 넣는 쪽이요. 마감이 있어야 살아나요',
          parent: '한 가지에 몰입하는 쪽이요. 마감이 있으면 더 해요',
        },
        weights: { intensity: 2, horizon: -1 },
      },
      {
        label: {
          student: '평소엔 느슨하다가 필요할 때 몰아쳐요',
          parent: '평소엔 느슨하다가 필요할 때 몰아쳐요',
        },
        weights: { intensity: 1, making: 1 },
      },
      {
        label: {
          student: '여러 개를 벌여놓고 균형을 잡아요',
          parent: '여러 개를 벌여놓고 균형을 잡아요',
        },
        weights: { intensity: -1, bond: 1 },
      },
      {
        label: {
          student: '쉬는 시간이 확보돼야 나머지가 굴러가요',
          parent: '쉬는 시간이 있어야 나머지가 굴러가요',
        },
        weights: { intensity: -2, immersion: 1 },
      },
    ],
  },
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QUESTIONS: QUESTIONS };
}
