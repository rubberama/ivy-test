/**
 * 학교 엠블럼
 *
 * 실제 학교 로고·문장·워드마크는 전부 등록상표라 쓸 수 없다.
 * 대신 각 학교를 대표하는 사물을 같은 기하학적 언어로 직접 그렸다.
 * 전부 24x24 뷰박스, 선 기반(stroke), 굵기 1.7, 둥근 끝.
 * 여덟 개가 한 세트로 보여야 하므로 이 규칙에서 벗어나지 말 것.
 *
 * 모티프는 그 학교의 실제 성격에서 가져왔다:
 *   하버드   아치      Harvard Yard 의 문
 *   예일     안뜰      레지덴셜 칼리지의 사각 안뜰
 *   프린스턴 펜촉      전교생이 쓰는 졸업논문
 *   컬럼비아 스카이라인 맨해튼
 *   유펜     번개      벤저민 프랭클린
 *   브라운   펼친 책   오픈 커리큘럼
 *   다트머스 소나무    뉴햄프셔 숲
 *   코넬     다리      이타카의 협곡을 건너는 다리
 */
var EMBLEMS = {
  harvard: [
    'M3.5 20.5 V12 a8.5 8.5 0 0 1 17 0 v8.5',
    'M2 20.5 h20',
    'M12 20.5 v-6',
  ],
  // 바깥 사각형 안에 안뜰 하나. 선을 더 넣으면 형태가 뭉쳐서 안 읽힌다.
  yale: [
    'M4 4.5 h16 v16 h-16 z',
    'M9.4 9.9 h5.2 v5.2 h-5.2 z',
  ],
  // 펜촉: 위는 각지고 아래로 뾰족하게. 가운데 슬릿과 통기 구멍이 있어야
  // 마름모가 아니라 펜으로 읽힌다.
  princeton: [
    'M7.6 3.2 h8.8 v6.4 L12 21.2 L7.6 9.6 Z',
    'M12 12.4 V18.4',
    'M10.9 10.2 a1.1 1.1 0 1 0 2.2 0 a1.1 1.1 0 1 0 -2.2 0',
  ],
  columbia: [
    'M4.5 20.5 V12.5 h4 v8',
    'M10 20.5 V5.5 h4 v15',
    'M15.5 20.5 V14.5 h4 v6',
    'M2.5 20.5 h19',
  ],
  penn: [
    'M13.6 2.6 L6 13.2 h4.9 L9.8 21.4 L18 10.4 h-4.9 Z',
  ],
  brown: [
    'M12 7.2 C9.2 5.3 6.2 5 3 5.8 V17.9 c3.2 -0.8 6.2 -0.5 9 1.4',
    'M12 7.2 C14.8 5.3 17.8 5 21 5.8 V17.9 c-3.2 -0.8 -6.2 -0.5 -9 1.4',
    'M12 7.2 V19.3',
  ],
  dartmouth: [
    'M12 2.6 L7.4 10.4 h9.2 Z',
    'M12 8.4 L5 18 h14 Z',
    'M12 18 v3.4',
  ],
  // 상판 선 아래로 아치가 확실히 내려가야 다리로 읽힌다.
  // 아치 정점이 상판과 겹치면 그냥 가로선 하나로 뭉쳐 보인다.
  cornell: [
    'M2 10 h20',                           // 상판 (아치보다 넓게 빼야 다리로 보인다)
    'M5.5 21 Q12 9 18.5 21',               // 아치 (정점 y=15, 상판과 5 벌어짐)
    'M8.6 10 v3.9', 'M15.4 10 v3.9',       // 상판을 받치는 기둥
  ],
};

/**
 * 인라인 SVG 문자열을 만든다.
 * innerHTML 로 넣기 때문에 여기 들어가는 값은 전부 코드에서 나온 것이어야 한다.
 * (색은 SCHOOLS 의 고정값, 경로는 위 상수 — 사용자 입력이 섞이지 않는다)
 */
function emblemSvg(schoolId, color, size) {
  var paths = EMBLEMS[schoolId];
  if (!paths) return '';
  var d = paths.map(function (p) {
    return '<path d="' + p + '"/>';
  }).join('');
  return '<svg class="emblem" viewBox="0 0 24 24" width="' + size + '" height="' + size + '" ' +
    'aria-hidden="true" focusable="false" fill="none" stroke="' + color + '" ' +
    'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EMBLEMS: EMBLEMS };
}
