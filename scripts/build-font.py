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

    with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False,
                                     encoding='utf-8') as tf:
        tf.write(''.join(sorted(chars)))
        text_file = tf.name

    # 1) 가변축을 쓰는 범위로 좁힌다
    trimmed = os.path.join(tempfile.gettempdir(), 'SUIT-trimmed.ttf')
    font = TTFont(SRC_FONT)
    instancer.instantiateVariableFont(
        font, {'wght': (WGHT_MIN, WGHT_MAX)}, inplace=True)
    font.save(trimmed)

    # 2) 쓰는 글자만 남긴다
    out_woff2 = os.path.join(tempfile.gettempdir(), 'SUIT-subset.woff2')

    cmd = [
        sys.executable, '-m', 'fontTools.subset', trimmed,
        '--text-file=' + text_file,
        '--output-file=' + out_woff2,
        '--flavor=woff2',
        # tnum 은 기본 유지 목록에 없다. 퍼센트 숫자를 고정폭으로 쓰고 있어서
        # 이게 빠지면 자릿수가 흔들린다.
        '--layout-features+=tnum',
        '--no-hinting',
        '--desubroutinize',
        '--name-IDs=1,2,3,4,5,6',
    ]
    print('서브셋 중… (가변축 %d-%d 로 축소 후)' % (WGHT_MIN, WGHT_MAX))
    subprocess.run(cmd, check=True)
    os.unlink(text_file)
    os.unlink(trimmed)

    raw = open(out_woff2, 'rb').read()
    b64 = base64.b64encode(raw).decode('ascii')

    src_size = os.path.getsize(SRC_FONT)
    print('  원본   %6.1fKB' % (src_size / 1024))
    print('  서브셋 %6.1fKB  (base64 %.1fKB)' % (len(raw) / 1024, len(b64) / 1024))
    print('  절감   %.1f%%' % (100 - len(raw) * 100.0 / src_size))

    css = (
        '/* SUIT (SUNN, http://sun.fo/suit) — SIL Open Font License 1.1\n'
        ' * https://github.com/sun-typeface/SUIT\n'
        ' *\n'
        ' * 이 파일은 scripts/build-font.py 가 생성합니다. 직접 고치지 마세요.\n'
        ' * 앱 소스에 등장하는 글자만 남긴 서브셋이라, 문구를 수정했으면\n'
        ' * 스크립트를 다시 돌려야 새 글자가 폰트에 들어갑니다.\n'
        ' *\n'
        ' * 가변축 wght %d-%d 를 유지합니다. 이 범위 밖 굵기를 쓰면\n'
        ' * 가장 가까운 값으로 잘립니다.\n'
        ' */\n'
        "@font-face {\n"
        "  font-family: 'SUIT';\n"
        "  font-style: normal;\n"
        "  font-weight: %d %d;\n"
        "  font-display: swap;\n"
        "  src: url(data:font/woff2;base64," + b64 + ") format('woff2-variations');\n"
        "}\n"
    ) % (WGHT_MIN, WGHT_MAX, WGHT_MIN, WGHT_MAX)

    os.makedirs(os.path.dirname(OUT_CSS), exist_ok=True)
    with open(OUT_CSS, 'w', encoding='utf-8') as fh:
        fh.write(css)
    print('  -> fonts/suit.css  %.1fKB' % (os.path.getsize(OUT_CSS) / 1024))


if __name__ == '__main__':
    main()
