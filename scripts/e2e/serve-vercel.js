#!/usr/bin/env node
/**
 * vercel.json 규칙대로 저장소를 띄운다  (실행: node scripts/e2e/serve-vercel.js)
 *
 * 왜 필요한가
 *   개발할 때 쓰는 `python3 -m http.server` 와 배포되는 Vercel 은 경로 처리가
 *   반대다. 로컬은 /korea-uni 를 /korea-uni/ 로 넘기고, Vercel 은
 *   trailingSlash:false 라 /korea-uni/ 를 /korea-uni 로 넘긴다.
 *
 *   한국 버전 페이지는 ../fonts/suit.css 처럼 상대 경로로 자원을 건다.
 *   슬래시가 붙느냐 마느냐에 따라 이 경로가 다르게 풀리기 때문에, 로컬에서
 *   다 통과해도 배포본에서만 스타일이 빠질 수 있다. 그걸 미리 보려고 만들었다.
 *
 * 흉내내는 것 (vercel.json 과 같은 값)
 *   cleanUrls: true        /korea-uni -> korea-uni/index.html (리다이렉트 없이)
 *   trailingSlash: false   /korea-uni/ -> 308 -> /korea-uni
 *   headers                nosniff · Referrer-Policy · Permissions-Policy · Cache-Control
 *
 * PORT 로 포트를 바꾼다. 기본 8799.
 */
var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');

var ROOT = path.join(__dirname, '..', '..');
var PORT = Number(process.env.PORT || 8799);
var CONF = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));

var TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * vercel.json 의 source 를 정규식으로 옮긴다.
 *
 * 괄호 안은 그대로 정규식으로 쓰고, 괄호 밖은 전부 리터럴로 이스케이프한다.
 * 통째로 이스케이프하면 `/(.*)` 의 `.` 까지 escape 돼서 아무 경로에도
 * 안 걸리고, 반대로 아무것도 안 하면 `/(og|og-korea).png` 의 `.` 이
 * 아무 글자나 받는다.
 */
function toRegExp(source) {
  var lit = function (s) { return s.replace(/[.*+?^${}|[\]\\]/g, '\\$&'); };
  var out = '', i = 0;
  source.replace(/\([^)]*\)/g, function (grp, at) {
    out += lit(source.slice(i, at)) + grp;
    i = at + grp.length;
    return grp;
  });
  return new RegExp('^' + out + lit(source.slice(i)) + '$');
}

function headersFor(pathname) {
  var out = {};
  CONF.headers.forEach(function (rule) {
    if (toRegExp(rule.source).test(pathname)) {
      rule.headers.forEach(function (h) { out[h.key] = h.value; });
    }
  });
  return out;
}

var server = http.createServer(function (req, res) {
  var pathname = decodeURIComponent(url.parse(req.url).pathname);

  // trailingSlash: false — 루트 말고는 끝 슬래시를 떼고 다시 부른다
  if (pathname.length > 1 && pathname.slice(-1) === '/') {
    res.writeHead(308, { Location: pathname.replace(/\/+$/, '') });
    res.end();
    return;
  }

  var rel = pathname.replace(/^\/+/, '');
  var file = path.join(ROOT, rel);

  // 디렉터리면 index.html, 확장자가 없으면 .html 을 붙여본다 (cleanUrls)
  if (pathname === '/' || (fs.existsSync(file) && fs.statSync(file).isDirectory())) {
    file = path.join(file, 'index.html');
  } else if (!fs.existsSync(file) && fs.existsSync(file + '.html')) {
    file += '.html';
  }

  // 저장소 밖으로 나가는 경로는 막는다
  if (path.relative(ROOT, file).indexOf('..') === 0) { res.writeHead(403); res.end(); return; }

  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 ' + pathname);
    return;
  }

  var head = headersFor(pathname);
  head['Content-Type'] = TYPES[path.extname(file)] || 'application/octet-stream';
  res.writeHead(200, head);
  res.end(fs.readFileSync(file));
});

server.listen(PORT, '127.0.0.1', function () {
  console.log('vercel.json 규칙으로 http://127.0.0.1:' + PORT + ' 에서 서빙 중');
});
