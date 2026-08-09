/**
 * 결과 이미지 (canvas -> PNG)
 *
 * 1080 x 1350 (인스타 4:5 세로). 외부 이미지·폰트를 전혀 안 쓰기 때문에
 * canvas 가 오염(taint)될 일이 없고 toBlob 이 항상 성공한다.
 */

var CARD_W = 1080;
var CARD_H = 1350;

var KO_FONT = '"Apple SD Gothic Neo","Pretendard","Noto Sans KR","Malgun Gothic",system-ui,sans-serif';
var SERIF = '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Bitstream Charter",serif';

// 화면과 같은 색을 쓴다. 여기 값을 바꾸면 styles.css 도 같이 바꿀 것.
var C = {
  paper: '#f4f3ee',
  card: '#fffefb',
  ink: '#16302a',
  inkSoft: '#5b6b63',
  inkFaint: '#93a099',
  rule: '#ddddd4',
  ruleSoft: '#e9e8e1',
  ivy: '#1f5b41',
  ivyDeep: '#143c2b',
  brass: '#a8823c',
};

function font(weight, size) {
  return weight + ' ' + size + 'px ' + KO_FONT;
}

function serifFont(weight, size) {
  return weight + ' ' + size + 'px ' + SERIF;
}

// 화면의 엠블럼을 캔버스에도 같은 모양으로 그린다.
// Path2D 가 SVG path 문자열을 그대로 받는다.
function drawEmblem(ctx, schoolId, color, x, y, size) {
  var paths = (typeof EMBLEMS !== 'undefined') ? EMBLEMS[schoolId] : null;
  if (!paths || typeof Path2D !== 'function') return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);   // 원본 뷰박스가 24x24
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.7;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  paths.forEach(function (d) { ctx.stroke(new Path2D(d)); });
  ctx.restore();
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

  // 본지 바탕 + 얇은 테두리 괘선 (인쇄물 느낌)
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.fillStyle = C.card;
  ctx.fillRect(40, 40, CARD_W - 80, CARD_H - 80);
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 1;
  ctx.strokeRect(40.5, 40.5, CARD_W - 81, CARD_H - 81);

  // 학교 색 상단 띠 — 화면 상단 띠와 같은 역할
  ctx.fillStyle = top.school.color;
  ctx.fillRect(40, 40, CARD_W - 80, 6);

  ctx.textBaseline = 'top';
  var y = 104;

  // 워드마크
  ctx.fillStyle = C.ivy;
  ctx.font = serifFont(700, 30);
  ctx.letterSpacing = '5px';
  ctx.fillText('IVY', pad, y);
  ctx.letterSpacing = '0px';

  ctx.fillStyle = C.inkFaint;
  ctx.font = font(600, 24);
  ctx.fillText('성향 매칭', pad + 76, y + 7);
  y += 62;

  ctx.fillStyle = C.brass;
  ctx.font = serifFont(400, 26);
  ctx.fillText('Your closest match', pad, y);
  y += 48;

  // 엠블럼
  drawEmblem(ctx, top.school.id, top.school.color, pad, y, 66);
  y += 88;

  ctx.fillStyle = top.school.color;
  ctx.font = font(700, 88);
  ctx.fillText(top.school.nameKo, pad, y);
  y += 104;

  ctx.fillStyle = C.inkFaint;
  ctx.font = serifFont(400, 30);
  ctx.fillText(top.school.nameEn, pad, y);
  y += 56;

  ctx.fillStyle = C.ink;
  ctx.font = font(600, 36);
  y = drawLines(ctx, wrapText(ctx, top.school.tagline, innerW, 2), pad, y, 52);
  y += 26;

  // 구분선
  ctx.fillStyle = C.rule;
  ctx.fillRect(pad, y, innerW, 1);
  y += 30;

  // 매칭 적합도 — 세리프 숫자가 이 카드의 중심
  ctx.fillStyle = top.school.color;
  ctx.font = serifFont(400, 116);
  ctx.fillText(top.percent + '%', pad, y);
  var pctW = ctx.measureText(top.percent + '%').width;
  ctx.fillStyle = C.inkFaint;
  ctx.font = font(700, 22);
  ctx.letterSpacing = '3px';
  ctx.fillText('매칭 적합도', pad + pctW + 22, y + 66);
  ctx.letterSpacing = '0px';
  y += 150;

  ctx.fillStyle = C.rule;
  ctx.fillRect(pad, y, innerW, 1);
  y += 34;

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

  // TOP 3 — 화면과 같은 줄 구성: 엠블럼 / 순번 + 이름 / 퍼센트
  result.top3.forEach(function (item, i) {
    var rowY = y + i * ROW_H;

    drawEmblem(ctx, item.school.id, item.school.color, pad, rowY + 2, 34);

    // 순번 (세리프)
    ctx.fillStyle = C.brass;
    ctx.font = serifFont(400, 26);
    ctx.fillText(String(i + 1), pad + 54, rowY + 8);

    // 학교 이름
    ctx.fillStyle = C.ink;
    ctx.font = font(700, 40);
    ctx.fillText(item.school.nameKo, pad + 82, rowY);

    // 퍼센트 (우측 정렬, 세리프)
    ctx.textAlign = 'right';
    ctx.font = serifFont(400, 52);
    ctx.fillStyle = i === 0 ? item.school.color : C.inkSoft;
    ctx.fillText(item.percent + '%', CARD_W - pad, rowY - 4);
    ctx.textAlign = 'left';

    // 얇은 막대. 화면과 같이 오른쪽에 짧게
    var barY = rowY + Math.min(64, ROW_H - 26);
    var barW = 200;
    var barX = CARD_W - pad - barW;
    ctx.fillStyle = C.ruleSoft;
    ctx.fillRect(barX, barY, barW, 3);
    ctx.fillStyle = i === 0 ? item.school.color : C.inkFaint;
    ctx.fillRect(barX, barY, Math.max(4, barW * (item.percent / 100)), 3);

    // 줄 구분선
    ctx.fillStyle = C.ruleSoft;
    ctx.fillRect(pad, rowY + ROW_H - 16, innerW, 1);
  });
  y = bottomY;

  // 칩 한 줄. 화면과 같이 테두리만 있는 형태. 폭이 넘치면 그 뒤는 버린다.
  function drawChips(items, yPos, stroke, fg) {
    ctx.font = font(600, 26);
    var chipX = pad;
    items.forEach(function (label) {
      var w = ctx.measureText(label).width + 34;
      if (chipX + w > CARD_W - pad) return;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      roundRect(ctx, chipX + 0.5, yPos + 0.5, w, CHIP_H, CHIP_H / 2);
      ctx.stroke();
      ctx.fillStyle = fg;
      ctx.fillText(label, chipX + 17, yPos + 13);
      chipX += w + 10;
    });
  }

  function drawLabel(text, yPos) {
    ctx.fillStyle = C.brass;
    ctx.font = font(700, 21);
    ctx.letterSpacing = '3px';
    ctx.fillText(text, pad, yPos);
    ctx.letterSpacing = '0px';
  }

  // 결정적이었던 내 성향 (없으면 이 블록을 건너뛴다)
  if (result.reasons && result.reasons.length) {
    drawLabel('이런 성향이 결정적이었어요', y);
    drawChips(result.reasons.map(function (r) { return r.label; }),
      y + LABEL_H + LABEL_GAP, C.brass, C.brass);
    y += LABEL_H + LABEL_GAP + CHIP_H + BLOCK_GAP;
  }

  // 이 학교의 키워드
  drawLabel('이 학교는', y);
  drawChips(top.school.keywords, y + LABEL_H + LABEL_GAP, C.rule, C.inkSoft);

  // 하단 면책 문구
  ctx.fillStyle = C.rule;
  ctx.fillRect(pad, footerTop - 26, innerW, 1);

  ctx.fillStyle = C.inkFaint;
  ctx.font = font(500, 24);
  ctx.fillText('재미로 보는 성향 매칭이에요 · 합격 가능성 예측이 아닙니다', pad, footerTop);
  ctx.font = font(500, 24);
  ctx.fillStyle = C.inkFaint;
  ctx.fillText('18개 질문으로 알아보는 나와 맞는 아이비리그', pad, footerTop + 36);

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
