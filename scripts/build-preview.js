#!/usr/bin/env node
/**
 * 단일 파일 빌드  (실행: node scripts/build-preview.js)
 *
 * index.html + styles.css + js/*.js 를 하나의 HTML 로 합친다.
 * 개발은 계속 나눠진 파일로 하고, 이 스크립트는 배포용 산출물만 만든다.
 *
 * 산출물 두 개
 *   preview.html          doctype 까지 포함한 완전한 단일 파일.
 *                         메일에 첨부하든 어디에 올리든 이거 하나면 된다.
 *   dist/embed.html       <body> 안쪽 내용만. 바깥에서 head/body 를
 *                         감싸주는 환경(임베드·아티팩트)에 넣을 때 쓴다.
 */

var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var read = function (p) { return fs.readFileSync(path.join(ROOT, p), 'utf8'); };

var html = read('index.html');

/* ── CSS 인라인 ────────────────────────────────────────────── */
html = html.replace(
  /[ \t]*<link rel="stylesheet" href="([^"]+)">/,
  function (_, href) {
    return '<style>\n' + read(href).trim() + '\n</style>';
  }
);

/* ── JS 인라인 ─────────────────────────────────────────────── */
var inlined = [];
html = html.replace(
  /[ \t]*<script src="([^"]+)"><\/script>\n?/g,
  function (_, src) {
    inlined.push(src);
    var code = read(src);
    // 스크립트 안에 </script> 문자열이 있으면 파서가 거기서 끊긴다.
    // 지금 코드엔 없지만, 나중에 생겨도 조용히 깨지지 않도록 막아둔다.
    if (/<\/script/i.test(code)) {
      code = code.replace(/<\/script/gi, '<\\/script');
    }
    return '<script>\n/* === ' + src + ' === */\n' + code.trim() + '\n</script>\n';
  }
);

if (!inlined.length) {
  console.error('스크립트를 하나도 못 찾았습니다. index.html 의 script 태그를 확인하세요.');
  process.exit(1);
}

/* ── 산출물 1: 완전한 단일 파일 ────────────────────────────── */
fs.writeFileSync(path.join(ROOT, 'preview.html'), html);

/* ── 산출물 2: body 안쪽만 ─────────────────────────────────── */
// 바깥에서 head 를 만들어주는 환경에서도 제목과 스타일은 살아야 해서
// title/meta description/스타일은 body 내용 앞에 그대로 붙인다.
var bodyInner = html.slice(
  html.indexOf('<body>') + '<body>'.length,
  html.lastIndexOf('</body>')
).trim();

var title = (/<title>([^<]*)<\/title>/.exec(html) || [, ''])[1];
var styleBlock = (/<style>[\s\S]*?<\/style>/.exec(html) || [''])[0];

var embed = '<title>' + title + '</title>\n' + styleBlock + '\n' + bodyInner + '\n';

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist/embed.html'), embed);

/* ── 보고 ──────────────────────────────────────────────────── */
function kb(p) { return (fs.statSync(path.join(ROOT, p)).size / 1024).toFixed(1) + 'KB'; }

console.log('인라인한 스크립트 ' + inlined.length + '개:');
inlined.forEach(function (s) { console.log('  · ' + s); });
console.log('');
console.log('preview.html     ' + kb('preview.html'));
console.log('dist/embed.html  ' + kb('dist/embed.html'));

// 합치고 나서 바깥 파일 참조가 남아 있으면 그 파일은 혼자 못 돈다
var leftover = /(?:src|href)="(?!data:|https?:|#)([^"]+)"/g;
var found = [], m;
while ((m = leftover.exec(html))) found.push(m[1]);
if (found.length) {
  console.log('\n남아 있는 외부 참조: ' + found.join(', '));
  process.exit(1);
}
console.log('\n외부 참조 없음 — 단일 파일로 동작합니다.');
