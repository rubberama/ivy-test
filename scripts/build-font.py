#!/usr/bin/env python3
"""
SUIT 서브셋 빌드  (실행: python3 scripts/build-font.py)

왜 서브셋이 필요한가
  한글 폰트는 통째로 넣으면 600KB가 넘는다. 게다가 이 앱은 외부 CDN을
  쓸 수 없다 — 아티팩트는 CSP로 외부 요청을 막고, index.html 을
  더블클릭해서 여는 경우에도 CDN 은 못 쓴다. 그래서 폰트를 파일 안에
  data URI 로 심어야 하고, 그러려면 크기를 줄여야 한다.

  이 앱의 텍스트는 전부 소스에 고정돼 있다(질문, 학교 해설, UI 문구).
  그래서 소스에 등장하는 글자만 남기면 된다. 보통 600KB -> 수십 KB.

주의
  텍스트를 고치면서 지금 서브셋에 없는 글자를 새로 쓰면 그 글자만
  시스템 폰트로 떨어진다. 문구를 수정했으면 이 스크립트를 다시 돌릴 것.

원본 폰트
  SUIT (SUNN, http://sun.fo/suit) — SIL Open Font License 1.1
  https://github.com/sun-typeface/SUIT
  가변축 wght 100-900 을 유지한다. 정적 폰트 여러 개를 넣는 것보다 작다.
"""

import os
import sys
import base64
import subprocess
import tempfile

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

# 디자인에서 실제로 쓰는 굵기 범위. 가변축을 이만큼만 남긴다.
# 100-900 전부 들고 있으면 154KB, 400-800 만 남기면 111KB 다.
# 정적 폰트 두 벌(400/700)로 만들면 90KB 까지 줄지만 500·600 이
# 가장 가까운 굵기로 튀어서 디자인이 미묘하게 어긋난다.
WGHT_MIN, WGHT_MAX = 400, 800

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_FONT = os.environ.get('SUIT_SRC', os.path.join(ROOT, 'fonts', 'SUIT-Variable.woff2'))
OUT_CSS = os.path.join(ROOT, 'fonts', 'suit.css')

# 이 파일들에 등장하는 글자를 전부 모은다. 코드 식별자(영문)까지 섞이지만
# 라틴 글리프는 몇 개 되지 않아서 손해가 없고, 문구를 빠뜨릴 위험이 없다.
# 같은 서브셋을 아이비 버전과 한국 대학 버전이 같이 쓴다.
# 한쪽 파일만 넣으면 다른 쪽에만 있는 글자가 시스템 폰트로 떨어진다.
SOURCES = [
    'index.html',
    'korea-uni/index.html',
    'js/app.js',
    'js/scoring.js',
    'js/share.js',
    'js/resultImage.js',
    'js/data/axes.js',
    'js/data/copy.js',
    'js/data/schools.js',
    'js/data/questions.js',
    'js/data/korea/axes.js',
    'js/data/korea/copy.js',
    'js/data/korea/schools.js',
    'js/data/korea/questions.js',
]

# 소스에 없더라도 실행 중에 나올 수 있는 글자들.
# 숫자와 조사는 코드가 조합해서 만들기 때문에 반드시 넣어둔다.
ALWAYS = (
    '0123456789'
    'abcdefghijklmnopqrstuvwxyz'
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    ' !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'
    '·…‥·「」『』‘’“”—–·※'
    '←→↑↓↗↘↖↙'
    '가나은는이가을를와과로으로도만의에서'   # 조사로 붙는 글자
    '위년월일명개곳점'
)


# 첫 화면에 바로 보이는 글자는 HTML 에 그대로 박혀 있다.
# 이 파일들의 텍스트 노드만 긁어서 critical 서브셋을 만든다.
CRITICAL_SOURCES = ['index.html', 'korea-uni/index.html']


def collect_critical():
    """HTML 의 보이는 텍스트만 모은다. 태그·속성·주석은 뺀다."""
    import re
    chars = set(ALWAYS)
    for rel in CRITICAL_SOURCES:
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            continue
        html = open(path, encoding='utf-8').read()
        html = re.sub(r'<!--.*?-->', ' ', html, flags=re.S)
        html = re.sub(r'<(script|style)\b.*?</\1>', ' ', html, flags=re.S | re.I)
        html = re.sub(r'<[^>]+>', ' ', html)     # 태그 제거 -> 텍스트 노드만 남는다
        chars.update(html)
    return {c for c in chars if ord(c) >= 0x20}


def collect_chars():
    chars = set(ALWAYS)
    for rel in SOURCES:
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            print('  건너뜀 (없음): ' + rel)
            continue
        with open(path, encoding='utf-8') as fh:
            chars.update(fh.read())
    # 제어문자는 뺀다
    return {c for c in chars if ord(c) >= 0x20 and c not in ''}


def build_subset(chars, trimmed):
    """글자 집합을 받아 woff2 를 만들고 base64 로 돌려준다."""
    with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False,
                                     encoding='utf-8') as tf:
        tf.write(''.join(sorted(chars)))
        text_file = tf.name
    out = os.path.join(tempfile.gettempdir(), 'SUIT-%d.woff2' % len(chars))
    subprocess.run([
        sys.executable, '-m', 'fontTools.subset', trimmed,
        '--text-file=' + text_file,
        '--output-file=' + out,
        '--flavor=woff2',
        '--layout-features+=tnum',
        '--no-hinting',
        '--desubroutinize',
        '--name-IDs=1,2,3,4,5,6',
    ], check=True)
    os.unlink(text_file)
    raw = open(out, 'rb').read()
    return raw, base64.b64encode(raw).decode('ascii')


def face(family, b64, note):
    return (
        "/* " + note + " */\n"
        "@font-face {\n"
        "  font-family: '" + family + "';\n"
        "  font-style: normal;\n"
        "  font-weight: %d %d;\n"
        "  font-display: swap;\n"
        "  src: url(data:font/woff2;base64," + b64 + ") format('woff2-variations');\n"
        "}\n"
    ) % (WGHT_MIN, WGHT_MAX)


def main():
    if not os.path.exists(SRC_FONT):
        sys.exit(
            '원본 폰트가 없습니다: ' + SRC_FONT + '\n'
            '아래에서 받아 그 자리에 두세요:\n'
            '  https://raw.githubusercontent.com/sun-typeface/SUIT'
            '/main/fonts/variable/woff2/SUIT-Variable.woff2'
        )

    chars = collect_chars()
    hangul = sorted(c for c in chars if 0xAC00 <= ord(c) <= 0xD7A3)
    print('모은 글자 %d자 (한글 %d자)' % (len(chars), len(hangul)))

    # 1) 가변축을 쓰는 범위로 좁힌다
    trimmed = os.path.join(tempfile.gettempdir(), 'SUIT-trimmed.ttf')
    font = TTFont(SRC_FONT)
    instancer.instantiateVariableFont(
        font, {'wght': (WGHT_MIN, WGHT_MAX)}, inplace=True)
    font.save(trimmed)

    # 2) 두 벌을 만든다.
    #
    #    화면에 처음 보이는 글자(인트로 HTML 에 그대로 박혀 있는 문구)만 담은
    #    작은 벌과, 나머지 전부를 담은 큰 벌이다. 큰 벌은 120KB가 넘어서
    #    보통처럼 걸면 다 받을 때까지 화면이 백지로 남는다. 그렇다고 통째로
    #    비동기로 돌리면 시스템 폰트로 먼저 그려졌다가 SUIT 로 바뀌면서
    #    글줄이 다시 짜인다 — SUIT 의 한글 폭이 0.874em 인데 시스템 한글
    #    폰트는 대개 1.0em 이라 폭이 12% 넘게 차이 난다. 실측 CLS 가 0.146
    #    이었다(기준 0.1).
    #
    #    그래서 처음 보이는 글자만 작은 벌로 떼서 그것만 블로킹으로 걸고,
    #    나머지를 비동기로 돌린다. 첫 화면은 처음부터 SUIT 로 그려지므로
    #    다시 짜일 일이 없고, 아래쪽 글자만 늦게 교체된다.
    print('서브셋 중… (가변축 %d-%d 로 축소 후)' % (WGHT_MIN, WGHT_MAX))
    raw, b64 = build_subset(chars, trimmed)
    os.unlink(trimmed)

    src_size = os.path.getsize(SRC_FONT)
    print('  원본   %6.1fKB' % (src_size / 1024))
    print('  서브셋 %6.1fKB  (base64 %.1fKB)' % (len(raw) / 1024, len(b64) / 1024))
    print('  절감   %.1f%%' % (100 - len(raw) * 100.0 / src_size))

    HEAD = (
        '/* SUIT (SUNN, http://sun.fo/suit) — SIL Open Font License 1.1\n'
        ' * https://github.com/sun-typeface/SUIT\n'
        ' *\n'
        ' * 이 파일은 scripts/build-font.py 가 생성합니다. 직접 고치지 마세요.\n'
        ' * 문구를 수정했으면 스크립트를 다시 돌려야 새 글자가 들어갑니다.\n'
        ' */\n'
    )

    with open(OUT_CSS, 'w', encoding='utf-8') as fh:
        fh.write(HEAD + face('SUIT', b64, '전체 서브셋. 비동기로 불러온다'))
    print('  -> fonts/suit.css  %.1fKB' % (os.path.getsize(OUT_CSS) / 1024))


if __name__ == '__main__':
    main()
