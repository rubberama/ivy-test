#!/usr/bin/env node
/**
 * 인트로의 고정 목록을 HTML 에 박아 넣는다  (실행: node scripts/build-intro.js)
 *
 * 왜 필요한가
 *   학교 목록과 성향 축 목록은 사람마다 달라지지 않는 고정 데이터인데,
 *   app.js 가 화면을 그릴 때 채우고 있었다. 그러면 스크립트가 다 내려오기
 *   전까지 그 자리가 비어 있다가 나중에 채워지면서 아래 내용을 밀어낸다.
 *
 *   느린 회선에서 재보니 이 이동 하나가 CLS 0.128 이었다(전체 0.143 중).
 *   화면이 이미 그려진 뒤 2초 가까이 지나서 밀리는 거라 눈에 확 띈다.
 *
 *   고정 데이터니까 처음부터 HTML 에 있으면 된다. 그러면 밀릴 일이 없고
 *   스크립트가 늦어도 첫 화면이 완성된 상태로 보인다.
 *
 * 데이터를 고치면 이 스크립트를 다시 돌려야 HTML 이 따라온다.
 * app.js 는 여전히 같은 목록을 그리는데, 내용이 같아서 다시 그려도
 * 높이가 안 바뀐다(=이동이 없다). 그쪽을 지우지 않은 건 공유 링크로
 * 들어와 인트로로 돌아오는 경로에서도 목록이 필요하기 때문이다.
 */
var fs = require('fs');
var path = require('path');
var ROOT = path.join(__dirname, '..');

var TESTS = [
  {
    id: 'ivy', html: 'index.html', data: 'js/data',
    name: '미국 아이비리그', where: '하버드 · 예일 · 프린스턴 등',
    // 서로를 가리키는 주소. 루트에서 보면 하위 폴더, 하위 폴더에서 보면 루트다.
    hrefFrom: { ivy: null, korea: '../' },
  },
  {
    id: 'korea', html: 'korea-uni/index.html', data: 'js/data/korea',
    name: '한국 대학', where: '서울대 · 카이스트 · 한예종 등',
    hrefFrom: { ivy: 'korea-uni/', korea: null },
  },
];

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 각 테스트의 규모를 데이터에서 읽어둔다. 손으로 적으면 어긋난다.
var META = TESTS.map(function (t) {
  return {
    id: t.id,
    name: t.name,
    where: t.where,
    hrefFrom: t.hrefFrom,
    schools: require(path.join(ROOT, t.data, 'schools.js')).SCHOOLS.length,
    questions: require(path.join(ROOT, t.data, 'questions.js')).QUESTIONS.length,
  };
});

TESTS.forEach(function (t) {
  var axes = require(path.join(ROOT, t.data, 'axes.js'));
  var schools = require(path.join(ROOT, t.data, 'schools.js'));

  // 테스트 선택. 지금 보고 있는 쪽은 눌러도 갈 데가 없으므로 링크로 만들지 않는다.
  var picker = META.map(function (m) {
    var here = m.id === t.id;
    var body =
      '<span class="test-name">' + esc(m.name) + '</span>' +
      '<span class="test-sub">' + esc(m.where) + '</span>' +
      '<span class="test-meta">' + m.schools + '곳 · 질문 ' + m.questions + '개</span>';
    if (here) {
      return '        <span class="test-card is-here" aria-current="page">' + body +
        '<span class="test-flag">지금 보는 중</span></span>';
    }
    return '        <a class="test-card" href="' + m.hrefFrom[t.id] + '">' + body +
      '<span class="test-flag test-go">보러 가기 <span aria-hidden="true">→</span></span></a>';
  }).join('\n');

  var roster = schools.SCHOOLS.map(function (s) {
    return '      <li><span class="roster-ko">' + esc(s.nameKo) + '</span>' +
      '<span class="roster-en">' + esc(s.nameEn) + '</span></li>';
  }).join('\n');

  var axisList = axes.AXES.map(function (a) {
    return '      <li><span class="l">' + esc(a.negShort) + '</span>' +
      '<span class="mid">vs</span>' +
      '<span class="r">' + esc(a.posShort) + '</span></li>';
  }).join('\n');

  var p = path.join(ROOT, t.html);
  var html = fs.readFileSync(p, 'utf8');
  var before = html;

  // 결과가 같은지로 판정하면 "자리를 못 찾음"과 "이미 최신"을 구분할 수 없다.
  // 정규식이 실제로 물렸는지를 따로 확인한다.
  var missing = [];
  [
    ['roster', /(<ul class="roster" id="roster">)[\s\S]*?(<\/ul>)/, roster],
    ['axis-preview', /(<ul class="axis-preview" id="axis-preview">)[\s\S]*?(<\/ul>)/, axisList],
    ['test-pick', /(<div class="test-pick" id="test-pick">)[\s\S]*?(<\/div>)/, picker],
  ].forEach(function (spec) {
    if (!spec[1].test(html)) { missing.push(spec[0]); return; }
    var indent = spec[0] === 'test-pick' ? '      ' : '    ';
    html = html.replace(spec[1], '$1\n' + spec[2] + '\n' + indent + '$2');
  });

  if (missing.length) {
    console.error('  자리를 못 찾음: ' + t.html + ' — ' + missing.join(', '));
    process.exitCode = 1;
    return;
  }
  fs.writeFileSync(p, html);
  console.log('  ' + t.html + '  학교 ' + schools.SCHOOLS.length +
    '곳 · 축 ' + axes.AXES.length + '개 · 테스트 선택' +
    (html === before ? ' (이미 최신)' : ' 박아넣음'));
});
