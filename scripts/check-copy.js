#!/usr/bin/env node
/**
 * 화면에 나가는 문장 전수 검사  (실행: node scripts/check-copy.js)
 *
 * 두 테스트가 데이터 파일을 따로 갖고 있어서, 한쪽만 고치고 다른 쪽을
 * 잊는 일이 실제로 여러 번 있었다. 배포 전에 한 번에 훑으려고 만들었다.
 *
 * 보는 것
 *   1. 말투   앱 전체가 해요체다. 합니다체·반말·평서형이 섞이면 잡는다.
 *   2. 받침   '-이에요/-예요' 와, 잘못 붙은 '-으로'.
 *             반대쪽('-로' 자리에 '-으로'가 와야 하는 경우)은 안 본다 —
 *             '진로', '통로'처럼 낱말이 그냥 -로 로 끝나는 게 많아서
 *             전부 오탐이 된다. 같은 이유로 '-은/는', '-이/가', '-과/와'도
 *             건드리지 않는다('가을', '의예과').
 *   3. 겹말   '불교 불교' 처럼 같은 낱말이 붙어서 두 번 나오는 것
 *   4. 강조   ** 가 짝이 안 맞거나, 안이 비었거나, 문단에 너무 많은 것
 *
 * 여기 걸리는 게 전부 오류는 아니다. 일부러 다른 말투로 쓴 자리가 있다.
 * 따옴표 안(남의 말을 옮긴 것)은 자동으로 넘기고, 그 밖의 예외는
 * ALLOW 에 왜 예외인지와 함께 적어둔다.
 */
var path = require('path');
var ROOT = path.join(__dirname, '..');

var TESTS = [
  { name: '아이비', dir: 'js/data' },
  { name: '한국', dir: 'js/data/korea' },
];

// 일부러 이렇게 쓴 것들. 새로 추가할 때는 왜 예외인지 같이 적을 것.
var ALLOW = [
  '정확한 금액은 학교 홈페이지에서 확인하세요.', // 안내 문구는 -하세요 가 맞다
];

/**
 * 따옴표 안은 말투 검사에서 뺀다.
 *
 * "'이건 원래 이렇게 하는 거야'라는 말을 들으면 어떤가요?" 처럼 남의 말을
 * 그대로 옮긴 자리는 반말이어야 자연스럽다. 문장 자체의 끝(어떤가요?)만
 * 보면 된다.
 */
function stripQuotes(s) {
  return s.replace(/'[^']*'/g, '').replace(/"[^"]*"/g, '').replace(/[“][^”]*[”]/g, '');
}

// 해요체가 아닌 종결. 문장 끝(. 또는 문자열 끝)에 붙은 것만 본다.
var BAD_ENDING = [
  [/(합니다|입니다|습니다|됩니다|십시오)(?=[.’"']|$)/, '합니다체'],
  [/(한다|이다|된다|있다|없다|같다|많다|아니다)(?=[.’"']|$)/, '평서형'],
  [/(했어|이야|거야|하지|같아|이지)(?=[.’"']|$)/, '반말'],
];

var DUP = /([가-힣]{2,4}) \1(?![가-힣])/;

/** 한글 음절의 받침. 없으면 0, ㄹ 이면 8. */
function jong(ch) {
  var code = ch.charCodeAt(0) - 0xAC00;
  if (code < 0 || code > 11171) return -1;   // 한글이 아니면 판단하지 않는다
  return code % 28;
}

/**
 * 받침에 따라 달라지는 조사 두 가지만 본다.
 * 앞 글자가 한글이 아니면(숫자·영문) 읽는 소리에 따라 갈려서 넘어간다.
 */
function checkBatchim(text, report) {
  var re = /([가-힣])(이에요|예요|으로)(?![가-힣])/g;
  var m;
  while ((m = re.exec(text)) !== null) {
    var j = jong(m[1]);
    if (j < 0) continue;
    var has = j !== 0, isRieul = j === 8, p = m[2];
    if (p === '이에요' && !has) report('받침 없는데 -이에요', m[1] + p);
    if (p === '예요' && has) report('받침 있는데 -예요', m[1] + p);
    if (p === '으로' && (!has || isRieul)) report('-로 여야 함', m[1] + p);
  }
}

var fails = [];
function fail(where, what, text) {
  fails.push('  ' + where + '  [' + what + ']  ' + text);
}

/** 문자열 안에서 화면에 나가는 것만 모은다. */
function collect(test) {
  var out = [];
  function add(where, v) {
    if (typeof v === 'string') { out.push([where, v]); return; }
    if (Array.isArray(v)) { v.forEach(function (x, i) { add(where + '[' + i + ']', x); }); return; }
    if (v && typeof v === 'object') {
      Object.keys(v).forEach(function (k) { add(where + '.' + k, v[k]); });
    }
  }

  var schools = require(path.join(ROOT, test.dir, 'schools.js')).SCHOOLS;
  schools.forEach(function (s) {
    add(test.name + ' ' + s.nameKo + '.tagline', s.tagline);
    add(test.name + ' ' + s.nameKo + '.taglineParent', s.taglineParent);
    add(test.name + ' ' + s.nameKo + '.keywords', s.keywords);
    add(test.name + ' ' + s.nameKo + '.detail', s.detail);
    add(test.name + ' ' + s.nameKo + '.forParents', s.forParents);
    if (s.filter) add(test.name + ' ' + s.nameKo + '.filter', s.filter);
  });

  var qs = require(path.join(ROOT, test.dir, 'questions.js')).QUESTIONS;
  qs.forEach(function (q, i) {
    add(test.name + ' Q' + (i + 1) + '.text', q.text);
    q.options.forEach(function (o, j) {
      add(test.name + ' Q' + (i + 1) + '.' + 'ABCD'[j], o.label);
    });
  });

  var axes = require(path.join(ROOT, test.dir, 'axes.js'));
  (axes.AXES_ALL || axes.AXES).forEach(function (a) {
    add(test.name + ' 축 ' + a.id, [a.name, a.neg, a.pos, a.negShort, a.posShort]);
  });

  return out;
}

TESTS.forEach(function (test) {
  // 데이터 파일이 전역 상수를 쓰기 때문에 require 캐시를 지우고 하나씩 읽는다
  Object.keys(require.cache).forEach(function (k) {
    if (k.indexOf(path.join(ROOT, 'js', 'data')) === 0) delete require.cache[k];
  });

  collect(test).forEach(function (row) {
    var where = row[0], text = row[1];
    if (ALLOW.some(function (a) { return text.indexOf(a) !== -1; })) return;

    var sentences = text.split(/(?<=[.?!])\s+/);
    sentences.forEach(function (sentence) {
      var bare = stripQuotes(sentence);
      BAD_ENDING.forEach(function (rule) {
        if (rule[0].test(bare)) fail(where, rule[1], sentence);
      });
    });

    var dup = text.match(DUP);
    if (dup) fail(where, '겹말', dup[0]);

    checkBatchim(text, function (what, sample) { fail(where, what, sample); });

    // 강조는 문장당 하나가 기준이다. 그보다 많으면 굵은 게 굵어 보이지 않는다.
    // 한국 버전의 '확인된 사실' 칸은 세 줄을 이어 붙인 문단이라 개수 자체는
    // 많을 수 있고, 그래서 절대 개수가 아니라 문장 수와 견준다.
    var marks = (text.match(/\*\*/g) || []).length;
    if (marks % 2) fail(where, '강조 짝 안 맞음', text);
    if (marks / 2 > sentences.length) {
      fail(where, '강조 ' + (marks / 2) + '개 / 문장 ' + sentences.length + '개', text);
    }
    if (/\*\*\*\*/.test(text)) fail(where, '빈 강조', text);
    // 굵은 덩어리가 붙어 있으면 화면에서는 한 덩어리로 보인다. 그럴 거면 하나로 쓴다.
    if (/\*\*\s+\*\*/.test(text)) fail(where, '강조가 붙어 있음', text);
    if (/\*\*\S*(을|를|이|가|은|는)\*\*/.test(text)) fail(where, '조사까지 강조', text);
  });
});

// copy.js 는 함수가 섞여 있어 따로 본다
['js/data/copy.js', 'js/data/korea/copy.js'].forEach(function (rel) {
  var full = path.join(ROOT, rel);
  try { require.resolve(full); } catch (e) { return; }
  delete require.cache[full];
  var mod = require(full);
  Object.keys(mod.MODE_COPY || {}).forEach(function (mode) {
    var c = mod.MODE_COPY[mode];
    Object.keys(c).forEach(function (k) {
      if (typeof c[k] !== 'string') return;
      BAD_ENDING.forEach(function (rule) {
        if (rule[0].test(c[k])) fail(rel + ' ' + mode + '.' + k, rule[1], c[k]);
      });
    });
  });
});

if (fails.length) {
  console.log('걸린 문장 ' + fails.length + '개\n' + fails.join('\n'));
  process.exit(1);
}
console.log('말투·조사·강조 표기 전부 통과');
