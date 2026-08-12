/**
 * 해설 줄글에 **강조** 를 한 번만 박아 넣는 일회성 스크립트
 *
 * 결과 화면의 해설은 문단이 길어서 그냥 읽으면 뭐가 중요한지 안 잡힌다.
 * 이 학교를 실제로 구별해주는 것 — 제도 이름과 숫자 — 만 굵게 한다.
 *
 * 왜 스크립트로 하는가: 학교가 38곳이고 칸이 여러 개라 손으로 넣으면
 * 어떤 문단은 세 군데 굵고 어떤 문단은 하나도 없는 식으로 밀도가 흐트러진다.
 * 용어 목록 자체는 손으로 골랐고, 스크립트는 "같은 규칙을 38곳에 똑같이"
 * 적용하는 일만 한다.
 *
 * 규칙 세 가지:
 *   1. 한 문단에 최대 2개. 세 개 넘게 굵으면 굵은 게 굵어 보이지 않는다.
 *   2. 같은 말은 문단 안에서 첫 번째만. 반복되는 '무전공'을 다 굵게 하면 얼룩진다.
 *   3. fitsWho 는 건드리지 않는다. 그 칸은 학교가 아니라 사람 얘기라
 *      굵게 할 고유명사가 없고, 짧은 문장 셋이라 이미 다 읽힌다.
 *
 * 실행:
 *   node scripts/mark-emphasis.js          미리보기 (파일 안 건드림)
 *   node scripts/mark-emphasis.js --write  실제로 쓴다
 *
 * 한 번 쓰고 나면 마크업이 데이터에 남으므로 다시 돌릴 일은 없다.
 * 두 번 돌려도 이미 ** 안에 있는 말은 건너뛰므로 겹쳐 감싸지지는 않는다.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// ── 굵게 할 말 ──────────────────────────────────────────────
// 긴 것부터 둔다. '오픈 커리큘럼' 이 먼저 걸리면 뒤의 (Open Curriculum) 이
// 굵기 밖으로 떨어져 나간다.
const TERMS = [
  // 아이비 — 제도·기관 이름
  '오픈 커리큘럼(Open Curriculum)',
  '독립 전공(Independent Concentration)',
  '코어 커리큘럼(Core Curriculum)',
  '원 유니버시티 폴리시(One University Policy)',
  '로드아일랜드 디자인스쿨(RISD)',
  '오렌지 버블(Orange Bubble)',
  '졸업논문(Senior Thesis)',
  '이수/미이수(S/NC)',
  '14개 레지덴셜 칼리지',
  '12개 기숙사(House)',
  '오픈 커리큘럼',
  '코어 커리큘럼',
  '레지덴셜 칼리지',
  '독립 전공',
  '졸업논문',
  '프리셉트(precept)',
  '와튼(Wharton)',
  '헌츠먼·M&T',
  'D-Plan',
  '와튼',

  // 한국 — 무전공 트랙 이름. 학교마다 이름이 다른 게 핵심이라 다 넣는다.
  '한양YK인터칼리지',
  '새내기과정학부',
  '무은재학부',
  '자유전공학부',
  '전공개방모집',
  '광역모집단위',
  '통합선발',
  '학부대학',
  '호크마',
  '무전공',

  // 한국 — 캠퍼스·설립 유형처럼 4년 생활을 실제로 가르는 것
  '글로컬캠퍼스',
  '다빈치캠퍼스',
  '국제캠퍼스',
  'WISE캠퍼스',
  'ERICA',
  '단일 캠퍼스',
  '공립 종합대학',
  '공립 대학',
  '거점 국립대',
  '거점국립대',
  '과학기술원',
  '문화체육관광부',
  '종립대학',
  '종립대',

  // 한국 — 이 학교에만 있거나 이 학교를 대표하는 학과·분야.
  // 30곳을 실제로 갈라놓는 건 분위기 형용사가 아니라 이쪽이다.
  '한의과대학',
  '수의과대학',
  '부동산학과',
  '항공시스템공학',
  '호텔관광경영',
  '문예창작·영화영상',
  '연극영화·미디어',
  '이차전지·에너지',
  '예체능 단과대학',
  '수의·농생명',
  '미술·디자인',
  '자동차공학',
  '대덕연구단지',
  '항공우주',
  '산학협력',
  '다중전공',
  '실기·오디션',
  '실기와 오디션',
];

// 숫자. 사람·기관을 세는 것만 굵게 한다.
// '1년', '2학년' 같은 시간 표현은 어느 학교에나 나와서 굵게 해도 변별이 안 된다.
// '곳'은 뺐다 — 이 데이터에서 '곳'이 붙는 숫자는 "30곳 중" 뿐인데,
// 그건 학교 사실이 아니라 우리 데이터셋 크기다.
const NUM = '\\d[\\d,]*(?:\\s*만(?:\\s*\\d+\\s*천)?|\\s*천)?'; // 1,409 · 2만 · 1만 4천
const NUMBER = new RegExp(
  '(?:약\\s*)?' +                       // "약 1만 4천 명"
  NUM +
  '(?:\\s*[~-]\\s*' + NUM + ')?' +     // "123~124명" · "2만~2만 5천 명대"
  '\\s*' +
  '(?:명대|명|퍼센트|%|배|개 단과대학|개 단과대|개 전공|개 대학|개 학과|개 학부)',
  'g'
);

// 비율은 인원수보다 앞세운다. "무전공 835명으로 전체 모집의 26%" 같은 문장에서
// 읽는 사람이 실제로 비교하게 되는 건 26% 쪽이다.
const RATIO = /%|퍼센트/;

// 우리가 못 알아낸 걸 적어둔 문장들이다. 여기서 굵게 하면
// "확인하지 못했어요"를 강조하는 꼴이 된다.
const HEDGE = /확인하지 못|확인되지 않|추정했지만|가늠했어요|명시가 없어/;

const MAX_PER_PARAGRAPH = 2;

/**
 * 한 문단에 강조를 넣는다. 이미 들어간 자리와 겹치면 건너뛴다.
 */
function mark(text) {
  if (!text || text.indexOf('**') !== -1) return text; // 이미 손댄 문단
  if (HEDGE.test(text)) return text;

  // 후보를 다 모은 뒤 순위대로 두 개만 남긴다. 앞에서부터 채우면
  // 문장 앞머리에 있는 덜 중요한 숫자가 자리를 먼저 차지한다.
  const found = [];
  for (const term of TERMS) {
    const at = text.indexOf(term);
    if (at !== -1) found.push({ at: at, end: at + term.length, rank: 0 });
  }
  NUMBER.lastIndex = 0;
  let m;
  while ((m = NUMBER.exec(text)) !== null) {
    found.push({ at: m.index, end: m.index + m[0].length, rank: RATIO.test(m[0]) ? 1 : 2 });
  }
  found.sort(function (a, b) { return a.rank - b.rank || a.at - b.at; });

  const spans = [];
  for (const f of found) {
    if (spans.length >= MAX_PER_PARAGRAPH) break;
    if (spans.some(function (s) { return f.at < s[1] && f.end > s[0]; })) continue;
    spans.push([f.at, f.end]);
  }

  spans.sort(function (a, b) { return a[0] - b[0]; });
  let out = '';
  let cur = 0;
  for (const [s, e] of spans) {
    out += text.slice(cur, s) + '**' + text.slice(s, e) + '**';
    cur = e;
  }
  return out + text.slice(cur);
}

// ── 파일별로 어느 줄을 고칠지 ────────────────────────────────
// 데이터 파일은 한 줄에 한 문자열이라 줄 단위로 잡는다.
// fitsWho 는 빠져 있다(위 규칙 3).
const TARGETS = [
  { file: 'js/data/schools.js', keys: ['vibe', 'strength'] },
  { file: 'js/data/korea/schools.js', keys: ['vibe', 'scale', 'campus', 'choice'] },
];

const write = process.argv.indexOf('--write') !== -1;
let touched = 0;

TARGETS.forEach(function (t) {
  const full = path.join(ROOT, t.file);
  const lines = fs.readFileSync(full, 'utf8').split('\n');
  const re = new RegExp('^(\\s*(?:' + t.keys.join('|') + "): ')(.*)('\\,?)$");
  const next = lines.map(function (line) {
    const m = line.match(re);
    if (!m) return line;
    const after = mark(m[2]);
    if (after === m[2]) return line;
    touched++;
    if (!write) {
      console.log(t.file + '  ' + after.replace(/\*\*(.+?)\*\*/g, '[[$1]]').slice(0, 150));
    }
    return m[1] + after + m[3];
  });
  if (write) fs.writeFileSync(full, next.join('\n'));
});

console.log('\n' + (write ? '고친 줄 ' : '고칠 줄 ') + touched + '개');
