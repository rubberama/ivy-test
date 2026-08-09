/**
 * 화면 상태 머신 + 렌더링
 *
 * intro -> quiz(18문항) -> loading -> result
 * 프레임워크 없이 세 개의 <section> 을 hidden 으로 토글한다.
 */
(function () {
  'use strict';

  var LETTERS = ['A', 'B', 'C', 'D'];
  var STORE_KEY = 'ivy.progress.' + SHARE_VERSION;
  var LOADING_MS = 900;

  var state = {
    screen: 'intro',
    index: 0,
    answers: new Array(QUESTIONS.length).fill(null),
    result: null,
    fromShare: false,
  };

  var el = {};
  ['screen-intro', 'screen-quiz', 'screen-loading', 'screen-result',
    'btn-start', 'btn-resume', 'btn-prev', 'btn-next', 'btn-share', 'btn-image',
    'btn-restart', 'btn-community',
    'progress-now', 'progress-total', 'progress-fill', 'q-index', 'dots',
    'question-text', 'options', 'axis-preview', 'roster', 'ranking', 'axis-chart',
    'result-hero', 'result-emblem', 'result-name', 'result-en', 'result-tagline',
    'result-place', 'result-percent', 'result-keywords', 'detail-title',
    'why-block', 'detail-block', 'share-hint', 'export-canvas'].forEach(function (id) {
      el[id] = document.getElementById(id);
    });

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * 조사 선택. 학교 이름이 데이터에서 오기 때문에 "유펜가", "코넬와" 같은
   * 어색한 조합이 그대로 화면에 나간다. 마지막 글자에 받침이 있는지 보고 고른다.
   * (한글 음절 U+AC00~U+D7A3 에서 (코드-0xAC00) % 28 이 0이 아니면 받침이 있다)
   */
  function hasFinalConsonant(word) {
    if (!word) return false;
    var code = word.charCodeAt(word.length - 1);
    if (code < 0xac00 || code > 0xd7a3) return false;
    return (code - 0xac00) % 28 !== 0;
  }

  function josa(word, withBatchim, withoutBatchim) {
    return word + (hasFinalConsonant(word) ? withBatchim : withoutBatchim);
  }

  /* ── 저장소 (file:// 에서는 던질 수 있어서 전부 감싼다) ────── */
  function saveProgress() {
    try {
      if (state.answers.every(function (a) { return a === null; })) {
        localStorage.removeItem(STORE_KEY);
        return;
      }
      localStorage.setItem(STORE_KEY, JSON.stringify({
        index: state.index, answers: state.answers,
      }));
    } catch (e) { /* 시크릿 모드나 file:// — 그냥 저장 안 하고 넘어간다 */ }
  }

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !Array.isArray(data.answers) ||
        data.answers.length !== QUESTIONS.length) return null;
      return data;
    } catch (e) { return null; }
  }

  function clearProgress() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* 무시 */ }
  }

  /* ── 화면 전환 ─────────────────────────────────────────────── */
  function show(screen) {
    state.screen = screen;
    ['intro', 'quiz', 'loading', 'result'].forEach(function (s) {
      el['screen-' + s].classList.toggle('hidden', s !== screen);
    });
  }

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  /* ── 인트로 ────────────────────────────────────────────────── */
  function renderIntro() {
    el['axis-preview'].innerHTML = '';
    AXES.forEach(function (axis) {
      var li = document.createElement('li');
      var a = document.createElement('span');
      a.className = 'l';
      a.textContent = axis.negShort;
      var mid = document.createElement('span');
      mid.className = 'mid';
      mid.textContent = 'vs';
      var b = document.createElement('span');
      b.className = 'r';
      b.textContent = axis.posShort;
      li.appendChild(a); li.appendChild(mid); li.appendChild(b);
      el['axis-preview'].appendChild(li);
    });

    // 여덟 학교 엠블럼. 결과에서 처음 보는 것보다 미리 보여주는 편이 낫다
    el.roster.innerHTML = '';
    SCHOOLS.forEach(function (school) {
      var li = document.createElement('li');
      li.innerHTML = emblemSvg(school.id, school.color, 19);
      var name = document.createElement('span');
      name.textContent = school.nameKo;
      li.appendChild(name);
      el.roster.appendChild(li);
    });

    var saved = loadProgress();
    var answered = saved ? saved.answers.filter(function (a) { return a !== null; }).length : 0;
    el['btn-resume'].classList.toggle('hidden', answered === 0);
    if (answered) el['btn-resume'].textContent = '이어서 하기 (' + answered + '/' + QUESTIONS.length + ')';
  }

  function showNotice(text) {
    var old = document.getElementById('boot-notice');
    if (old) old.remove();
    var p = document.createElement('p');
    p.id = 'boot-notice';
    p.className = 'notice';
    p.textContent = text;
    el['screen-intro'].insertBefore(p, el['screen-intro'].firstChild);
  }

  /* ── 질문 ──────────────────────────────────────────────────── */
  function renderQuiz() {
    var q = QUESTIONS[state.index];
    var total = QUESTIONS.length;
    var answered = state.answers.filter(function (a) { return a !== null; }).length;

    el['progress-total'].textContent = total;
    el['progress-now'].textContent = answered;
    el['progress-fill'].style.width = (answered / total * 100) + '%';
    el['q-index'].textContent = state.index + 1;

    // 도트
    el.dots.innerHTML = '';
    for (var i = 0; i < total; i++) {
      var d = document.createElement('span');
      d.className = 'dot' +
        (state.answers[i] !== null ? ' answered' : '') +
        (i === state.index ? ' current' : '');
      el.dots.appendChild(d);
    }

    el['question-text'].textContent = q.text;

    // 선택지
    var legend = document.createElement('legend');
    legend.className = 'offscreen';
    legend.textContent = '질문 ' + (state.index + 1) + ' · 선택지 ' + q.options.length + '개';
    el.options.innerHTML = '';
    el.options.appendChild(legend);

    q.options.forEach(function (opt, i) {
      var label = document.createElement('label');
      label.className = 'option' + (state.answers[state.index] === i ? ' is-selected' : '');

      var input = document.createElement('input');
      input.type = 'radio';
      input.name = 'answer-' + q.id;
      input.value = String(i);
      input.checked = state.answers[state.index] === i;
      input.addEventListener('change', function () { choose(i); });

      var badge = document.createElement('span');
      badge.className = 'option-badge';
      badge.setAttribute('aria-hidden', 'true');
      badge.textContent = LETTERS[i];

      var text = document.createElement('span');
      text.className = 'option-label';
      text.textContent = opt.label;

      label.appendChild(input);
      label.appendChild(badge);
      label.appendChild(text);
      el.options.appendChild(label);
    });

    el['btn-prev'].style.visibility = state.index === 0 ? 'hidden' : 'visible';
    el['btn-next'].disabled = state.answers[state.index] === null;
    el['btn-next'].innerHTML = (state.index === total - 1 ? '결과 보기' : '다음') +
      ' <span class="arw" aria-hidden="true">→</span>';
  }

  function choose(i) {
    state.answers[state.index] = i;
    saveProgress();
    // 선택 표시만 갱신하면 되므로 전체를 다시 그리지 않는다
    var labels = el.options.querySelectorAll('.option');
    for (var k = 0; k < labels.length; k++) labels[k].classList.toggle('is-selected', k === i);
    var answered = state.answers.filter(function (a) { return a !== null; }).length;
    el['progress-now'].textContent = answered;
    el['progress-fill'].style.width = (answered / QUESTIONS.length * 100) + '%';
    var dots = el.dots.children;
    if (dots[state.index]) dots[state.index].classList.add('answered');
    el['btn-next'].disabled = false;
  }

  function goto(index) {
    state.index = Math.max(0, Math.min(QUESTIONS.length - 1, index));
    saveProgress();
    renderQuiz();
    scrollTop();
    el['question-text'].focus({ preventScroll: true });
  }

  function next() {
    if (state.answers[state.index] === null) return;
    if (state.index === QUESTIONS.length - 1) { finish(); return; }
    goto(state.index + 1);
  }

  /* ── 결과 ──────────────────────────────────────────────────── */
  function finish() {
    show('loading');
    scrollTop();
    setTimeout(function () {
      state.result = scoreAnswers(state.answers);
      state.fromShare = false;
      writeHashCode(state.answers);
      clearProgress();
      renderResult();
      show('result');
      scrollTop();
    }, reduceMotion ? 0 : LOADING_MS);
  }

  function renderResult() {
    var r = state.result;
    var top = r.top3[0];

    // 학교색은 결과 화면 전체에 퍼진다(이름·퍼센트·막대). 한 곳에서만 정한다.
    el['screen-result'].style.setProperty('--school', top.school.color);
    el['result-emblem'].innerHTML = emblemSvg(top.school.id, top.school.color, 40);
    el['result-name'].textContent = top.school.nameKo;
    el['result-en'].textContent = top.school.nameEn;
    el['result-tagline'].textContent = top.school.tagline;
    el['result-place'].textContent = top.school.location;
    el['result-percent'].textContent = top.percent + '%';

    el['result-keywords'].innerHTML = '';
    top.school.keywords.forEach(function (kw) {
      var li = document.createElement('li');
      li.textContent = kw;
      el['result-keywords'].appendChild(li);
    });

    renderRanking(r);
    renderWhy(r);
    renderDetail(top.school);
    renderAxisChart(r);

    el['share-hint'].textContent = '';
    el['btn-share'].disabled = !canShareLink();
    if (!canShareLink()) {
      el['share-hint'].textContent = '파일로 직접 열면 링크 공유는 쓸 수 없어요. 웹에 올리면 켜집니다.';
    }
  }

  function renderRanking(r) {
    el.ranking.innerHTML = '';
    r.top3.forEach(function (item, i) {
      var row = document.createElement('div');
      row.className = 'rank-row' + (i === 0 ? ' is-top' : '');

      var mark = document.createElement('div');
      mark.className = 'rank-mark';
      mark.innerHTML = emblemSvg(item.school.id, item.school.color, 26);

      var body = document.createElement('div');
      body.className = 'rank-body';
      var name = document.createElement('p');
      name.className = 'rank-name';
      var ord = document.createElement('span');
      ord.className = 'rank-ordinal';
      ord.textContent = String(i + 1);
      name.appendChild(ord);
      name.appendChild(document.createTextNode(item.school.nameKo));
      var tag = document.createElement('p');
      tag.className = 'rank-tagline';
      tag.textContent = item.school.tagline;
      body.appendChild(name); body.appendChild(tag);

      var right = document.createElement('div');
      right.className = 'rank-right';
      var pct = document.createElement('div');
      pct.className = 'rank-percent';
      pct.textContent = item.percent + '%';
      var track = document.createElement('div');
      track.className = 'rank-track';
      var fill = document.createElement('div');
      fill.className = 'rank-fill';
      track.appendChild(fill);
      right.appendChild(pct); right.appendChild(track);

      row.appendChild(mark); row.appendChild(body); row.appendChild(right);
      el.ranking.appendChild(row);

      // 다음 프레임에 너비를 줘야 트랜지션이 실제로 돈다
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { fill.style.width = item.percent + '%'; });
      });
    });
  }

  function renderWhy(r) {
    var top = r.top3[0];
    el['detail-title'].textContent = top.school.nameKo + '가 1위인 이유';

    var list = el['why-block'];
    list.innerHTML = '';

    if (!r.reasons.length) {
      var li = document.createElement('li');
      var span = document.createElement('span');
      span.style.gridColumn = '1 / -1';
      span.textContent = '성향이 어느 쪽으로도 크게 기울지 않아서 세 학교가 비슷하게 나왔어요. ' +
        '아래 세 곳을 다 살펴보는 걸 추천해요.';
      li.appendChild(span);
      list.appendChild(li);
    } else {
      // 세 줄이 전부 같은 문장으로 끝나면 기계가 찍어낸 티가 난다.
      // 순서대로 다른 어투를 쓰고, 태그(축 이름)와 문장(극)이 겹치지 않게 한다.
      var templates = [
        function (pole, school) {
          return pole + ' 쪽으로 가장 뚜렷하게 기울었어요. ' +
            josa(school, '이', '가') + ' 딱 그런 학교예요.';
        },
        function (pole, school) {
          return josa(pole, '을', '를') + ' 중요하게 보는 편인데, ' +
            school + '의 색깔이 바로 그거예요.';
        },
        function (pole, school) {
          return pole + ' 쪽 답을 여러 번 골랐어요. ' +
            josa(school, '과', '와') + ' 잘 맞는 지점이에요.';
        },
      ];

      r.reasons.forEach(function (reason, i) {
        var li = document.createElement('li');
        var tag = document.createElement('span');
        tag.className = 'why-tag';
        tag.textContent = reason.axis.name;      // 태그는 축 이름, 문장은 어느 쪽인지
        var pole = reason.side === 'neg' ? reason.axis.neg : reason.axis.pos;
        var txt = document.createElement('span');
        txt.textContent = templates[i % templates.length](pole, top.school.nameKo);
        li.appendChild(tag); li.appendChild(txt);
        list.appendChild(li);
      });
    }
  }

  function renderDetail(school) {
    el['detail-block'].innerHTML = '';
    [
      ['분위기', school.detail.vibe],
      ['이 학교가 잘하는 것', school.detail.strength],
      ['이런 사람이 잘 맞아요', school.detail.fitsWho],
    ].forEach(function (part) {
      var wrap = document.createElement('div');
      wrap.className = 'detail-part';
      var h = document.createElement('p');
      h.className = 'detail-head';
      h.textContent = part[0];
      var b = document.createElement('p');
      b.className = 'detail-body';
      b.textContent = part[1];
      wrap.appendChild(h); wrap.appendChild(b);
      el['detail-block'].appendChild(wrap);
    });
  }

  function renderAxisChart(r) {
    var lit = {};
    r.reasons.forEach(function (reason) { lit[reason.axis.id] = reason.side; });

    el['axis-chart'].innerHTML = '';
    r.axes.forEach(function (entry) {
      var axis = entry.axis;
      var v = Math.max(-1, Math.min(1, entry.value));

      var row = document.createElement('div');
      row.className = 'axis-row';

      var poles = document.createElement('div');
      poles.className = 'axis-poles';
      var left = document.createElement('span');
      left.className = 'l' + (lit[axis.id] === 'neg' ? ' lit' : '');
      left.textContent = axis.negShort;
      var mid = document.createElement('span');
      mid.className = 'axis-name';
      mid.textContent = axis.name;
      var right = document.createElement('span');
      right.className = 'r' + (lit[axis.id] === 'pos' ? ' lit' : '');
      right.textContent = axis.posShort;
      poles.appendChild(left); poles.appendChild(mid); poles.appendChild(right);

      var track = document.createElement('div');
      track.className = 'axis-track';
      var center = document.createElement('div');
      center.className = 'axis-center';
      var bar = document.createElement('div');
      bar.className = 'axis-bar';
      var barLeft = v < 0 ? (50 + v * 50) : 50;
      var barWidth = Math.abs(v) * 50;
      bar.style.left = barLeft + '%';
      bar.style.width = '0%';
      track.appendChild(center);
      track.appendChild(bar);
      // 순위 막대와 마찬가지로 다음 프레임에 너비를 줘야 트랜지션이 돈다
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { bar.style.width = barWidth + '%'; });
      });

      // 스크린리더용 설명 (막대는 눈으로만 보이는 정보라서)
      var sr = document.createElement('span');
      sr.className = 'offscreen';
      var strength = Math.abs(v) < 0.15 ? '거의 중립이에요'
        : Math.abs(v) < 0.5 ? '약간 기울었어요' : '뚜렷하게 기울었어요';
      sr.textContent = axis.name + ': ' +
        (v < 0 ? axis.negShort : axis.posShort) + ' 쪽으로 ' + strength;

      row.appendChild(poles);
      row.appendChild(track);
      row.appendChild(sr);
      el['axis-chart'].appendChild(row);
    });
  }

  /* ── 액션 ──────────────────────────────────────────────────── */
  function hint(msg) {
    el['share-hint'].textContent = msg;
    clearTimeout(hint._t);
    hint._t = setTimeout(function () { el['share-hint'].textContent = ''; }, 3200);
  }

  function onShare() {
    var url = buildShareUrl(state.answers);
    if (!url) { hint('공유 링크를 만들 수 없어요.'); return; }
    var top = state.result.top3[0];
    shareOrCopy(
      url,
      '나에게 맞는 아이비리그는?',
      '나는 ' + top.school.nameKo + ' ' + top.percent + '% 나왔어. 너도 해볼래?'
    ).then(function (outcome) {
      if (outcome === 'copied') hint('링크를 복사했어요. 붙여넣기 해보세요.');
      else if (outcome === 'failed') hint('복사에 실패했어요. 주소창을 직접 복사해 주세요.');
    });
  }

  function onImage() {
    el['btn-image'].disabled = true;
    var prev = el['btn-image'].textContent;
    el['btn-image'].textContent = '이미지 만드는 중…';

    // 그리기는 동기라서, 버튼 상태가 화면에 반영된 뒤에 시작하도록 한 프레임 미룬다
    requestAnimationFrame(function () {
      try {
        renderResultCard(el['export-canvas'], state.result);
        saveResultCard(el['export-canvas'], state.result).then(function (outcome) {
          if (outcome === 'downloaded') hint('이미지를 저장했어요.');
          else if (outcome === 'failed') hint('이미지 저장에 실패했어요.');
          el['btn-image'].disabled = false;
          el['btn-image'].textContent = prev;
        });
      } catch (e) {
        hint('이미지 저장에 실패했어요.');
        el['btn-image'].disabled = false;
        el['btn-image'].textContent = prev;
      }
    });
  }

  function restart() {
    state.index = 0;
    state.answers = new Array(QUESTIONS.length).fill(null);
    state.result = null;
    state.fromShare = false;
    clearProgress();
    clearHash();
    renderIntro();
    show('intro');
    scrollTop();
  }

  /* ── 부팅 ──────────────────────────────────────────────────── */
  function boot() {
    renderIntro();

    el['btn-start'].addEventListener('click', function () {
      state.index = 0;
      state.answers = new Array(QUESTIONS.length).fill(null);
      clearProgress();
      show('quiz');
      renderQuiz();
      scrollTop();
    });

    el['btn-resume'].addEventListener('click', function () {
      var saved = loadProgress();
      if (!saved) return;
      state.answers = saved.answers;
      // 저장된 위치가 이상해도 첫 미응답 문항으로 보내면 안전하다
      var firstBlank = state.answers.indexOf(null);
      state.index = firstBlank === -1 ? QUESTIONS.length - 1 : firstBlank;
      show('quiz');
      renderQuiz();
      scrollTop();
    });

    el['btn-prev'].addEventListener('click', function () { goto(state.index - 1); });
    el['btn-next'].addEventListener('click', next);
    el['btn-share'].addEventListener('click', onShare);
    el['btn-image'].addEventListener('click', onImage);
    el['btn-restart'].addEventListener('click', restart);

    // 커뮤니티는 아직 붙일 곳이 없다. 눌러도 아무 일도 안 일어나면
    // 고장난 걸로 보이니 준비 중이라는 것만 알려준다.
    el['btn-community'].addEventListener('click', function () {
      var note = el['btn-community'].nextElementSibling;
      if (!note) return;
      note.textContent = '아직 준비 중이에요. 열리면 여기서 바로 신청할 수 있어요.';
      clearTimeout(el['btn-community']._t);
      el['btn-community']._t = setTimeout(function () {
        note.textContent = '아직 준비 중이에요';
      }, 3200);
    });

    // Enter 로 다음. 좌우 방향키는 건드리지 않는다 — radio 그룹의
    // 기본 이동 동작을 뺏으면 키보드 사용자가 선택을 못 바꾼다.
    document.addEventListener('keydown', function (e) {
      if (state.screen !== 'quiz') return;
      if (e.key === 'Enter' && !el['btn-next'].disabled) {
        e.preventDefault();
        next();
      }
    });

    // 공유 링크로 들어온 경우
    var code = readHashCode();
    if (code) {
      var decoded = decodeAnswers(code, QUESTIONS.length);
      if (decoded.ok) {
        state.answers = decoded.answers;
        state.result = scoreAnswers(state.answers);
        state.fromShare = true;
        renderResult();
        show('result');
        return;
      }
      showNotice(decoded.reason === 'version'
        ? '이 링크는 예전 버전 테스트 결과예요. 지금 버전으로 다시 해볼래요?'
        : '링크가 중간에 잘렸는지 결과를 읽지 못했어요. 직접 해보는 건 어때요?');
      clearHash();
    }

    show('intro');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
