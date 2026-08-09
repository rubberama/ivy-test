/**
 * 결과 이미지 (canvas -> PNG)
 *
 * 1080 x 1350 (인스타 4:5 세로). 외부 이미지·폰트를 전혀 안 쓰기 때문에
 * canvas 가 오염(taint)될 일이 없고 toBlob 이 항상 성공한다.
 */

var CARD_W = 1080;
var CARD_H = 1350;

var KO_FONT = '"Apple SD Gothic Neo","Pretendard","Noto Sans KR","Malgun Gothic",system-ui,sans-serif';

function font(weight, size) {
  return weight + ' ' + size + 'px ' + KO_FONT;
}

/* ── 한글 줄바꿈 ───────────────────────────────────────────────
 * canvas 에는 줄바꿈이 없어서 직접 잘라야 한다. 공백 기준으로 자르는
 * 흔한 방식은 한글에서 그냥 안 먹는다 — 한국어 문장은 공백이 적고,
 * 음절 단위로 어디서든 줄이 바뀔 수 있기 때문이다.
 * 그래서 "여기서 끊어도 되는 지점"을 먼저 표시하고 그 단위로 붙여나간다.
 */
function canBreakBefore(s, i) {
  if (i === 0) return false;
  var prev = s[i - 1], cur = s[i];
  if (/[)\]}」』.,!?%…·:;]/.test(cur)) return false;   // 닫는 문장부호를 혼자 남기지 않는다
  if (/[([{「『]/.test(prev)) return false;             // 여는 괄호 바로 뒤에서 안 끊는다
  if (/[A-Za-z0-9]/.test(prev) && /[A-Za-z0-9]/.test(cur)) return false; // 영문·숫자는 통째로
  return true;
}

function tokenize(s) {
  var tokens = [], cur = '';
  for (var i = 0; i < s.length; i++) {
    if (i && canBreakBefore(s, i)) { tokens.push(cur); cur = ''; }
    cur += s[i];
  }
  if (cur) tokens.push(cur);
  return tokens;
}

function wrapText(ctx, text, maxWidth, maxLines) {
  var lines = [];
  text.split('\n').forEach(function (para) {
    var line = '';
    tokenize(para).forEach(function (tok) {
      var next = line + tok;
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = tok.replace(/^\s+/, '');
      } else {
        line = next;
      }
    });
    lines.push(line);
  });

  if (maxLines && lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    var last = lines[maxLines - 1];
    while (last.length && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1);
    lines[maxLines - 1] = last + '…';
  }
  return lines;
}

function drawLines(ctx, lines, x, y, lineHeight) {
  lines.forEach(function (line, i) { ctx.fillText(line, x, y + i * lineHeight); });
  return y + lines.length * lineHeight;
}

function roundRect(ctx, x, y, w, h, r) {
  var rr = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/* ── 그리기 ────────────────────────────────────────────────── */

function renderResultCard(canvas, result) {
  var ctx = canvas.getContext('2d');
  var top = result.top3[0];
  var pad = 84;
  var innerW = CARD_W - pad * 2;

  ctx.clearRect(0, 0, CARD_W, CARD_H);

  // 배경
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  var wash = ctx.createLinearGradient(0, 0, 0, 460);
  wash.addColorStop(0, '#fdeaf4');
  wash.addColorStop(1, '#ffffff');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, CARD_W, 460);

  // 학교 색 상단 띠
  ctx.fillStyle = top.school.color;
  ctx.fillRect(0, 0, CARD_W, 12);

  ctx.textBaseline = 'top';
  var y = 96;

  ctx.fillStyle = '#ec4899';
  ctx.font = font(700, 30);
  ctx.fillText('아이비리그 성향 매칭', pad, y);
  y += 52;

  ctx.fillStyle = '#5b6472';
  ctx.font = font(600, 40);
  ctx.fillText('나랑 제일 잘 맞는 아이비는', pad, y);
  y += 72;

  ctx.fillStyle = top.school.color;
  ctx.font = font(800, 92);
  ctx.fillText(top.school.nameKo, pad, y);
  y += 108;

  ctx.fillStyle = '#9aa3b0';
  ctx.font = font(500, 32);
  ctx.fillText(top.school.nameEn, pad, y);
  y += 60;

  ctx.fillStyle = '#14161a';
  ctx.font = font(600, 38);
  y = drawLines(ctx, wrapText(ctx, top.school.tagline, innerW, 2), pad, y, 54);
  y += 34;

  // 매칭 적합도
  ctx.fillStyle = top.school.color;
  ctx.font = font(800, 104);
  ctx.fillText(top.percent + '%', pad, y);
  var pctW = ctx.measureText(top.percent + '%').width;
  ctx.fillStyle = '#9aa3b0';
  ctx.font = font(600, 30);
  ctx.fillText('매칭 적합도', pad + pctW + 18, y + 62);
  y += 150;

  // 구분선
  ctx.fillStyle = '#e8eaef';
  ctx.fillRect(pad, y, innerW, 2);
  y += 46;

  /* 아래쪽 배치
   * 학교 이름·태그라인 길이에 따라 위쪽이 차지하는 높이가 달라진다.
   * 그래서 하단 블록(칩 줄들)과 푸터를 바닥에 고정해두고,
   * 랭킹 세 줄이 그 사이 남는 공간을 나눠 갖게 한다.
   * 이렇게 안 하면 태그라인이 두 줄인 학교에서 칩이 푸터를 덮는다.
   */
  var LABEL_H = 26, CHIP_H = 52, LABEL_GAP = 10, BLOCK_GAP = 18;
  var chipBlocks = 1 + (result.reasons && result.reasons.length ? 1 : 0);
  var bottomH = chipBlocks * (LABEL_H + LABEL_GAP + CHIP_H) + (chipBlocks - 1) * BLOCK_GAP;

  var footerTop = CARD_H - 116;
  var bottomY = footerTop - 28 - bottomH;
  var ROW_H = Math.max(92, Math.min(128, (bottomY - 26 - y) / 3));

  // TOP 3
  result.top3.forEach(function (item, i) {
    var rowY = y + i * ROW_H;

    // 순위 알약
    ctx.font = font(800, 26);
    var pillText = (i + 1) + '위';
    var pillW = ctx.measureText(pillText).width + 34;
    ctx.fillStyle = '#fdeaf4';
    roundRect(ctx, pad, rowY, pillW, 42, 21);
    ctx.fill();
    ctx.fillStyle = '#be2d75';
    ctx.fillText(pillText, pad + 17, rowY + 8);

    // 학교 이름
    ctx.fillStyle = '#14161a';
    ctx.font = font(800, 44);
    ctx.fillText(item.school.nameKo, pad + pillW + 22, rowY + 1);

    // 퍼센트 (우측 정렬)
    ctx.textAlign = 'right';
    ctx.font = font(800, 48);
    ctx.fillStyle = i === 0 ? item.school.color : '#5b6472';
    ctx.fillText(item.percent + '%', CARD_W - pad, rowY - 1);
    ctx.textAlign = 'left';

    // 막대
    var barY = rowY + Math.min(68, ROW_H - 34);
    ctx.fillStyle = '#eef0f4';
    roundRect(ctx, pad, barY, innerW, 16, 8);
    ctx.fill();

    var fillW = Math.max(16, innerW * (item.percent / 100));
    var grad = ctx.createLinearGradient(pad, 0, pad + fillW, 0);
    grad.addColorStop(0, '#f472b6');
    grad.addColorStop(1, '#ec4899');
    ctx.fillStyle = grad;
    roundRect(ctx, pad, barY, fillW, 16, 8);
    ctx.fill();
  });
  y = bottomY;

  // 칩 한 줄 그리기. 폭이 넘치면 그 뒤는 버린다(잘려 나오는 것보다 낫다).
  function drawChips(items, yPos, bg, fg) {
    ctx.font = font(700, 28);
    var chipX = pad;
    items.forEach(function (label) {
      var w = ctx.measureText(label).width + 40;
      if (chipX + w > CARD_W - pad) return;
      ctx.fillStyle = bg;
      roundRect(ctx, chipX, yPos, w, 52, 26);
      ctx.fill();
      ctx.fillStyle = fg;
      ctx.fillText(label, chipX + 20, yPos + 12);
      chipX += w + 12;
    });
  }

  function drawLabel(text, yPos) {
    ctx.fillStyle = '#9aa3b0';
    ctx.font = font(700, 26);
    ctx.fillText(text, pad, yPos);
  }

  // 결정적이었던 내 성향 (없으면 이 블록을 건너뛴다)
  if (result.reasons && result.reasons.length) {
    drawLabel('이런 성향이 결정적이었어요', y);
    drawChips(result.reasons.map(function (r) { return r.label; }), y + LABEL_H + LABEL_GAP, '#fdeaf4', '#be2d75');
    y += LABEL_H + LABEL_GAP + CHIP_H + BLOCK_GAP;
  }

  // 이 학교의 키워드
  drawLabel('이 학교는', y);
  drawChips(top.school.keywords, y + LABEL_H + LABEL_GAP, '#f4f5f8', '#5b6472');

  // 하단 면책 문구
  ctx.fillStyle = '#9aa3b0';
  ctx.font = font(500, 26);
  ctx.fillText('재미로 보는 성향 매칭이에요 · 합격 가능성 예측이 아닙니다', pad, footerTop);
  ctx.font = font(700, 26);
  ctx.fillStyle = '#c3c9d2';
  ctx.fillText('18개 질문으로 알아보는 나와 맞는 아이비리그', pad, footerTop + 40);

  return canvas;
}

/* ── 저장 ──────────────────────────────────────────────────── */

var isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/**
 * @returns {Promise<'shared'|'downloaded'|'longpress'|'failed'>}
 */
function saveResultCard(canvas, result) {
  return new Promise(function (resolve) {
    if (!canvas.toBlob) { resolve('failed'); return; }

    canvas.toBlob(function (blob) {
      if (!blob) { resolve('failed'); return; }

      // 파일명은 ASCII 로. 일부 브라우저가 한글 파일명을 깨뜨린다.
      var name = 'ivy-match-' + result.top3[0].id + '.png';

      // 모바일에서는 공유 시트가 사진 앱 저장까지 한 번에 처리해준다
      if (navigator.canShare && typeof File === 'function') {
        try {
          var file = new File([blob], name, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file] })
              .then(function () { resolve('shared'); })
              .catch(function (err) {
                if (err && err.name === 'AbortError') { resolve('shared'); return; }
                resolve(downloadBlob(blob, name));
              });
            return;
          }
        } catch (e) { /* 아래 다운로드로 진행 */ }
      }

      resolve(downloadBlob(blob, name));
    }, 'image/png');
  });
}

function downloadBlob(blob, name) {
  var url = URL.createObjectURL(blob);

  // iOS 사파리는 download 속성을 무시해서 그냥 새 탭에 이미지를 띄운다.
  // 이 경우엔 "꾹 눌러서 저장" 안내를 띄우는 게 한국 웹의 표준 패턴이다.
  if (isIOS) {
    showLongPressSheet(url);
    return 'longpress';
  }

  var a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  return 'downloaded';
}

function showLongPressSheet(url) {
  var back = document.createElement('div');
  back.className = 'sheet-backdrop';
  back.innerHTML =
    '<div class="sheet" role="dialog" aria-modal="true" aria-label="이미지 저장">' +
    '<p class="sheet-title">이미지를 꾹 눌러서 저장하세요</p>' +
    '<img class="sheet-img" alt="내 아이비리그 매칭 결과">' +
    '<button type="button" class="btn btn-ghost btn-block sheet-close">닫기</button>' +
    '</div>';
  back.querySelector('.sheet-img').src = url;

  function close() {
    back.remove();
    URL.revokeObjectURL(url);
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e) { if (e.key === 'Escape') close(); }

  back.addEventListener('click', function (e) { if (e.target === back) close(); });
  back.querySelector('.sheet-close').addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  document.body.appendChild(back);
  back.querySelector('.sheet-close').focus();
}
