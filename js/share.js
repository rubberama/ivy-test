/**
 * 결과 공유
 *
 * 답변 18개를 URL 해시에 담아서, 링크만 받아도 똑같은 결과 화면이 뜨게 한다.
 *
 * 왜 쿼리스트링(?r=)이 아니라 해시(#r=)인가
 *  - 해시는 서버로 전송되지 않아서 정적 호스팅의 리다이렉트/리라이트 규칙에
 *    영향을 받지 않는다. GitHub Pages / Vercel / Netlify 어디에 올려도 동일하게 동작한다.
 *  - file:// 로 열었을 때도 그대로 동작한다.
 *
 * 형식:  #r=v2.<모드 1자><페이로드 7자><체크섬 1자>
 *  - 버전: 질문을 고치면 반드시 올린다. 안 올리면 예전 링크가 조용히
 *    엉뚱한 결과를 보여준다.
 *  - 모드: s(학생) 또는 p(학부모). 링크를 받은 사람도 같은 화면을 봐야 한다.
 *  - 체크섬: 카카오톡·인스타 링크 처리 과정에서 뒤가 잘린 링크를 걸러낸다.
 */

// 질문·선택지·가중치를 수정하거나 채점 방식이 바뀌면 이 값을 올릴 것.
// v2: 학부모 모드가 생기면서 모드 문자가 붙었다.
// v3: 응답자 집단 보정이 들어가면서 같은 답이라도 결과가 달라졌다.
//     안 올리면 이미 공유된 링크가 공유한 사람이 본 것과 다른 학교를 보여준다.
var SHARE_VERSION = 'v3';

var MODE_CHAR = { student: 's', parent: 'p' };
var CHAR_MODE = { s: 'student', p: 'parent' };

var B64_SAFE = { '+': '-', '/': '_' };
var B64_BACK = { '-': '+', _: '/' };

/* ── 인코딩 ────────────────────────────────────────────────── */

// 답변 하나당 2비트씩 눌러 담는다. 18문항 = 36비트 = 5바이트.
function packAnswers(answers) {
  var bytes = new Uint8Array(Math.ceil(answers.length / 4));
  for (var i = 0; i < answers.length; i++) {
    var v = answers[i] & 3;
    bytes[i >> 2] |= v << (6 - 2 * (i % 4));
  }
  return bytes;
}

function unpackAnswers(bytes, count) {
  var out = [];
  for (var i = 0; i < count; i++) {
    var byte = bytes[i >> 2];
    if (byte === undefined) return null;
    out.push((byte >> (6 - 2 * (i % 4))) & 3);
  }
  return out;
}

function bytesToB64url(bytes) {
  var s = '';
  for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/[+/]/g, function (c) { return B64_SAFE[c]; }).replace(/=+$/, '');
}

function b64urlToBytes(str) {
  var s = str.replace(/[-_]/g, function (c) { return B64_BACK[c]; });
  while (s.length % 4) s += '=';
  var bin;
  try { bin = atob(s); } catch (e) { return null; }
  var bytes = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function checksumChar(answers) {
  var sum = 0;
  for (var i = 0; i < answers.length; i++) sum += answers[i] * (i + 1);
  return (sum % 36).toString(36);
}

function encodeAnswers(mode, answers) {
  var m = MODE_CHAR[mode] || 's';
  return SHARE_VERSION + '.' + m + bytesToB64url(packAnswers(answers)) + checksumChar(answers);
}

/**
 * @returns {{ok:true, mode:string, answers:number[]} | {ok:false, reason:'none'|'version'|'corrupt'}}
 */
function decodeAnswers(code, expectedCount) {
  if (!code) return { ok: false, reason: 'none' };

  var dot = code.indexOf('.');
  if (dot < 1) return { ok: false, reason: 'corrupt' };

  var version = code.slice(0, dot);
  if (version !== SHARE_VERSION) return { ok: false, reason: 'version' };

  var body = code.slice(dot + 1);
  if (body.length < 3) return { ok: false, reason: 'corrupt' };

  var mode = CHAR_MODE[body.charAt(0)];
  if (!mode) return { ok: false, reason: 'corrupt' };

  body = body.slice(1);
  var payload = body.slice(0, -1);
  var chk = body.slice(-1);

  var bytes = b64urlToBytes(payload);
  if (!bytes) return { ok: false, reason: 'corrupt' };

  var answers = unpackAnswers(bytes, expectedCount);
  if (!answers) return { ok: false, reason: 'corrupt' };

  for (var i = 0; i < answers.length; i++) {
    if (answers[i] < 0 || answers[i] > 3) return { ok: false, reason: 'corrupt' };
  }
  if (checksumChar(answers) !== chk) return { ok: false, reason: 'corrupt' };

  return { ok: true, mode: mode, answers: answers };
}

/* ── URL 다루기 ────────────────────────────────────────────── */

// 배포 주소. 웹에 올라간 상태에서는 현재 주소를 그대로 쓰기 때문에 이 값이
// 필요 없고, index.html 을 파일로 직접 열었을 때만 쓰인다
// (file:///Users/... 주소는 남에게 보내도 안 열리니까).
// 다른 곳에 배포했다면 여기를 바꿔주세요.
var SITE_URL = 'https://ivy-test-two.vercel.app/';

function isFileProtocol() {
  return location.protocol === 'file:';
}

function canShareLink() {
  return !isFileProtocol() || !!SITE_URL;
}

function buildShareUrl(mode, answers) {
  var base = isFileProtocol()
    ? SITE_URL
    : location.origin + location.pathname + location.search;
  if (!base) return '';
  return base + '#r=' + encodeAnswers(mode, answers);
}

function readHashCode() {
  var m = /[#&]r=([^&]+)/.exec(location.hash || '');
  return m ? decodeURIComponent(m[1]) : '';
}

function writeHashCode(mode, answers) {
  if (isFileProtocol()) return; // file:// 에서 해시를 바꾸면 히스토리만 지저분해진다
  try {
    history.replaceState(null, '', location.pathname + location.search +
      '#r=' + encodeAnswers(mode, answers));
  } catch (e) { /* 무시 */ }
}

function clearHash() {
  if (isFileProtocol()) return;
  try {
    history.replaceState(null, '', location.pathname + location.search);
  } catch (e) { /* 무시 */ }
}

/**
 * 링크를 클립보드에 넣는다. navigator.share 가 있으면 그쪽을 먼저 쓴다
 * (모바일에서 카카오톡 공유 시트가 바로 뜬다).
 * @returns {Promise<'shared'|'copied'|'failed'>}
 */
function shareOrCopy(url, title, text) {
  if (navigator.share) {
    return navigator.share({ title: title, text: text, url: url })
      .then(function () { return 'shared'; })
      .catch(function (err) {
        if (err && err.name === 'AbortError') return 'shared'; // 사용자가 닫은 것
        return copyToClipboard(url);
      });
  }
  return copyToClipboard(url);
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text)
      .then(function () { return 'copied'; })
      .catch(function () { return legacyCopy(text); });
  }
  return Promise.resolve(legacyCopy(text));
}

// clipboard API 를 못 쓰는 환경(구형 사파리, http, file://) 대비
function legacyCopy(text) {
  try {
    var el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    el.setSelectionRange(0, text.length);
    var ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok ? 'copied' : 'failed';
  } catch (e) {
    return 'failed';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SHARE_VERSION: SHARE_VERSION,
    encodeAnswers: encodeAnswers,
    decodeAnswers: decodeAnswers,
  };
}
