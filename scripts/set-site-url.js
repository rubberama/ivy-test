#!/usr/bin/env node
/**
 * 배포 주소 바꾸기  (실행: node scripts/set-site-url.js https://example.com)
 *
 * 절대 주소가 필요한 곳이 두 군데 있어서 따로 관리하면 반드시 어긋난다.
 *
 *   index.html   og:url / og:image / twitter:image
 *                링크 미리보기는 크롤러가 이미지를 직접 받아가기 때문에
 *                절대 https 주소여야 한다. 상대 경로로는 카드가 안 뜬다.
 *
 *   js/share.js  SITE_URL
 *                index.html 을 파일로 직접 열었을 때(file://) 결과 공유
 *                링크를 만들 기준 주소. 웹에 올라간 상태에서는 현재 주소를
 *                쓰기 때문에 영향이 없다.
 *
 * 바꾼 뒤에는 단일 파일을 다시 빌드해야 한다 (이 스크립트가 안내한다).
 */

var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var raw = process.argv[2];

if (!raw) {
  console.error('사용법: node scripts/set-site-url.js https://your-site.vercel.app');
  process.exit(1);
}

var url;
try {
  url = new URL(raw);
} catch (e) {
  console.error('주소를 해석할 수 없습니다: ' + raw);
  process.exit(1);
}
if (url.protocol !== 'https:') {
  console.error('https 주소여야 합니다. 메신저 크롤러가 http 이미지를 안 받아가는 경우가 많습니다.');
  process.exit(1);
}

// 끝에 슬래시 하나로 통일. og:image 를 만들 때 // 가 생기는 걸 막는다.
var base = url.origin + url.pathname.replace(/\/+$/, '') + '/';
var ogImage = base + 'og.png';

function edit(rel, replacers) {
  var p = path.join(ROOT, rel);
  var before = fs.readFileSync(p, 'utf8');
  var after = before;
  var hits = 0;
  replacers.forEach(function (r) {
    // replace 의 두 번째 인자로 함수를 넘기면 $1 이 치환되지 않고 문자 그대로
    // 들어간다. 매치 여부는 따로 확인하고, 치환은 문자열로 넘겨야 한다.
    if (!r.find.test(after)) {
      console.log('  주의: ' + rel + ' 에서 못 찾음 — ' + r.what);
      return;
    }
    after = after.replace(r.find, r.to);
    hits++;
  });
  if (after !== before) fs.writeFileSync(p, after);
  console.log('  ' + rel + '  ' + hits + '곳 수정');
  return hits;
}

console.log('배포 주소를 ' + base + ' 로 맞춥니다.\n');

edit('index.html', [
  {
    what: 'og:url',
    find: /(<meta property="og:url" content=")[^"]*(">)/,
    to: '$1' + base + '$2',
  },
  {
    what: 'og:image',
    find: /(<meta property="og:image" content=")[^"]*(">)/,
    to: '$1' + ogImage + '$2',
  },
  {
    what: 'og:image:secure_url',
    find: /(<meta property="og:image:secure_url" content=")[^"]*(">)/,
    to: '$1' + ogImage + '$2',
  },
  {
    what: 'twitter:image',
    find: /(<meta name="twitter:image" content=")[^"]*(">)/,
    to: '$1' + ogImage + '$2',
  },
]);

edit('js/share.js', [
  {
    what: 'SITE_URL',
    find: /var SITE_URL = '[^']*';/,
    to: "var SITE_URL = '" + base + "';",
  },
]);

console.log('\n이어서:');
console.log('  node scripts/build-preview.js     # 단일 파일 다시 만들기');
console.log('  git commit -am "배포 주소 변경" && git push');
console.log('\n배포 후 확인:');
console.log('  ' + ogImage + '  <- 브라우저에서 열려야 미리보기가 뜹니다');
