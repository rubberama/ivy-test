/**
 * 화면 상태 머신 + 렌더링
 *
 * intro(모드 선택) -> quiz(18문항) -> loading -> result
 * 프레임워크 없이 네 개의 <section> 을 hidden 으로 토글한다.
 *
 * 모드(student / parent)는 문구만 바꾼다. 가중치와 채점은 완전히 같다.
 * 그래서 학부모가 답해도 학생이 답한 것과 같은 기준으로 학교가 나온다.
 */
(function () {
  'use strict';

  var LETTERS = ['A', 'B', 'C', 'D'];
  // 같은 도메인의 다른 테스트와 진행 상황이 섞이면 안 된다.
  var STORE_KEY = 'quiz.' + (typeof TEST_ID !== 'undefined' ? TEST_ID : 'default') +
    '.' + SHARE_VERSION;
  var LOADING_MS = 900;

  var state = {
    screen: 'intro',
    mode: 'student',
    index: 0,
    answers: new Array(QUESTIONS.length).fill(null),
    result: null,
    fromShare: false,
  };

  var el = {};
  ['screen-intro', 'screen-quiz', 'screen-loading', 'screen-result',
    'btn-resume', 'btn-prev', 'btn-next', 'btn-share', 'btn-image',
    'step-test', 'step-mode', 'pick-here', 'chosen-test',
    'btn-restart', 'btn-community', 'mode-student', 'mode-parent',
    'progress-now', 'progress-total', 'progress-fill', 'progress-note',
    'quiz-mode-label', 'q-index', 'dots', 'question-text', 'options',
    'axis-preview', 'roster', 'ranking', 'axis-chart', 'axis-label', 'axis-note',
    'loading-text', 'result-hero', 'result-label', 'result-name', 'result-en',
    'result-tagline', 'result-place', 'result-percent', 'result-keywords',
    'detail-title', 'why-block', 'detail-block', 'parent-facts',
    'parent-facts-block', 'share-hint', 'result-bar', 'export-canvas'].forEach(function (id) {
      el[id] = document.getElementById(id);
    });

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function copy() { return MODE_COPY[state.mode] || MODE_COPY.student; }

  // 결과 이미지를 그리기 전에 SUIT 가 실제로 준비됐는지 확인한다.
  // document.fonts 가 없는 구형 브라우저에서는 그냥 진행한다.
  function fontsReady() {
    if (!document.fonts || !document.fonts.load) {
      return new Promise(function (r) { requestAnimationFrame(function () { r(); }); });
    }
    var weights = [400, 600, 700];
    return Promise.all(weights.map(function (w) {
      return document.fonts.load(w + ' 40px SUIT', '가나다ABC0123%');
    })).catch(function () { /* 실패해도 대체 폰트로 그린다 */ });
  }

  // 질문/선택지 문구는 모드별로 두 벌이다. 한쪽이 비어 있으면 학생용으로 떨어진다.
  function pick(bundle) {
    if (typeof bundle === 'string') return bundle;
    return (bundle && (bundle[state.mode] || bundle.student)) || '';
  }

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

  /**
   * 해설 본문의 **강조** 를 굵게 그린다.
   *
   * 줄글이 길어서 그냥 읽으면 뭐가 중요한지 안 잡힌다. 제도 이름과 숫자처럼
   * 이 학교를 실제로 구별해주는 말만 굵게 한다. 표시는 데이터에 **이렇게**
   * 적혀 있다 — 어디를 굵게 할지는 문장을 쓴 사람이 정하는 게 맞다.
   *
   * innerHTML 을 쓰지 않는다. 학교 해설은 우리가 쓴 글이지만, 데이터에서
   * 온 문자열을 HTML 로 해석하는 습관을 만들면 나중에 어디선가 샌다.
   * 텍스트 노드와 <b> 만 직접 만들어 붙인다.
   */
  function setEmphasis(node, text) {
    node.textContent = '';
    String(text == null ? '' : text).split(/\*\*/).forEach(function (part, i) {
      if (!part) return;
      if (i % 2 === 1) {
        var b = document.createElement('b');
        b.textContent = part;
        node.appendChild(b);
      } else {
        node.appendChild(document.createTextNode(part));
      }
    });
  }

  /**
   * 학교 이름을 그 학교 홈페이지로 가는 링크로 만든다.
   * 바깥으로 나가는 링크라 새 탭으로 열고, 화살표로 표시해준다.
   * (noopener 없이 target=_blank 를 쓰면 열린 페이지가 이쪽 창을 건드릴 수 있다)
   */
  function schoolLink(school, text, className) {
    if (!school.url) {
      var span = document.createElement('span');
      span.className = className || '';
      span.textContent = text;
      return span;
    }
    var a = document.createElement('a');
    a.className = 'school-link ' + (className || '');
    a.href = school.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.title = school.nameEn + ' 홈페이지 (새 탭)';
    a.appendChild(document.createTextNode(text));
    var ext = document.createElement('span');
    ext.className = 'ext';
    ext.setAttribute('aria-hidden', 'true');
    ext.textContent = '↗';
    a.appendChild(ext);
    var sr = document.createElement('span');
    sr.className = 'offscreen';
    sr.textContent = ' 홈페이지, 새 탭에서 열려요';
    a.appendChild(sr);
    return a;
  }

  /* ── 저장소 (file:// 에서는 던질 수 있어서 전부 감싼다) ────── */
  function saveProgress() {
    try {
      if (state.answers.every(function (a) { return a === null; })) {
        localStorage.removeItem(STORE_KEY);
        return;
      }
      localStorage.setItem(STORE_KEY, JSON.stringify({
        mode: state.mode, index: state.index, answers: state.answers,
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
      if (MODES.indexOf(data.mode) === -1) data.mode = 'student';
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
    // 공유 바는 결과 화면에서만 띄운다. 다른 화면에서는 자리만 차지한다.
    // body 클래스로도 표시해서 결과 섹션이 바에 가리지 않게 아래 여백을 준다.
    var onResult = screen === 'result';
    if (el['result-bar']) {
      // 화면을 바꾸자마자 붙이면 hidden 이 풀리는 프레임과 겹쳐서
      // 올라오는 게 안 보인다. 다음 프레임에 붙인다.
      requestAnimationFrame(function () {
        el['result-bar'].classList.toggle('is-on', onResult);
      });
      el['result-bar'].setAttribute('aria-hidden', onResult ? 'false' : 'true');
    }
    document.body.classList.toggle('has-result-bar', onResult);
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

    // 여덟 학교를 활자로만 나열한다
    el.roster.innerHTML = '';
    SCHOOLS.forEach(function (school) {
      var li = document.createElement('li');
      var ko = document.createElement('span');
      ko.className = 'roster-ko';
      ko.textContent = school.nameKo;
      var en = document.createElement('span');
      en.className = 'roster-en';
      en.textContent = school.nameEn;
      li.appendChild(ko); li.appendChild(en);
      el.roster.appendChild(li);
    });

    // 깨진 링크로 들어와서 안내를 본 사람이 테스트를 끝내고 '다시 하기'를 누르면
    // 인트로에 그 안내가 그대로 남아 있다. 방금 최신 버전으로 다 해봤는데
    // "이 링크는 예전 버전이에요"가 또 보이는 셈이라, 인트로를 그릴 때 치운다.
    var stale = document.getElementById('boot-notice');
    if (stale) stale.remove();

    var saved = loadProgress();
    var answered = saved ? saved.answers.filter(function (a) { return a !== null; }).length : 0;
    el['btn-resume'].classList.toggle('hidden', answered === 0);
    if (answered) {
      // pickLabel('학생이에요')은 인트로 선택 버튼용 완결 문장이라 여기 쓰면
      // "이어서 하기 · 학생이에요 12/18"이 된다. 라벨 자리에는 shortLabel 을 쓴다.
      el['btn-resume'].textContent = '이어서 하기 · ' + MODE_COPY[saved.mode].shortLabel +
        ' ' + answered + '/' + QUESTIONS.length;
    }

    // 하던 게 있으면 테스트는 이미 고른 셈이라 2단계로 바로 간다.
    introStep(answered ? 'mode' : 'test');
  }

  /**
   * 인트로를 두 단계로 나눈다.
   *
   * 테스트 선택과 모드 선택을 한 화면에 같이 두니 뭘 먼저 골라야 하는지
   * 헷갈렸다. 1단계에서 테스트를 정하고, 정하면 2단계가 나온다.
   * 1단계는 한 줄 요약으로 접히고 '바꾸기'로 되돌아갈 수 있다.
   *
   * 저장된 진행이 있으면 1단계를 건너뛴다. 이미 이 테스트를 고른 사람이다.
   */
  function introStep(step) {
    var onMode = step === 'mode';
    el['step-test'].classList.toggle('hidden', onMode);
    el['step-mode'].classList.toggle('hidden', !onMode);
    if (onMode && el['pick-here'] && el['chosen-test']) {
      el['chosen-test'].innerHTML = '';
      var what = document.createElement('span');
      what.textContent = el['pick-here'].dataset.name + ' · ' +
        el['pick-here'].dataset.count + '곳';
      var back = document.createElement('button');
      back.type = 'button';
      back.className = 'link-btn';
      back.textContent = '바꾸기';
      back.addEventListener('click', function () { introStep('test'); });
      el['chosen-test'].appendChild(what);
      el['chosen-test'].appendChild(back);
    }
    // 단계를 넘길 때 새로 나온 블록이 보이게 올린다.
    if (onMode) scrollTop();
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

    el['quiz-mode-label'].textContent = MODE_COPY[state.mode].shortLabel + ' · 진행률';
    el['progress-note'].textContent = copy().quizNote;
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

    el['question-text'].textContent = pick(q.text);

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
      // 포인터로 고른 것과 키보드 방향키로 훑는 것을 구분한다.
      // 방향키는 라디오 그룹을 훑어보는 동작이라 자동 전진하면 안 된다 —
      // 읽어보려고 내려가는 중에 화면이 넘어가버린다.
      input.addEventListener('change', function (e) {
        choose(i, e.pointerType !== undefined || pointerPick);
        pointerPick = false;
      });
      label.addEventListener('pointerdown', function () { pointerPick = true; });
      // 눌렀다가 밖에서 떼면 change 가 안 와서 플래그가 남는다.
      // 그 뒤에 키보드로 고르면 엉뚱하게 넘어가므로 키가 들어오면 지운다.
      input.addEventListener('keydown', function () { pointerPick = false; });

      var badge = document.createElement('span');
      badge.className = 'option-badge';
      badge.setAttribute('aria-hidden', 'true');
      badge.textContent = LETTERS[i];

      var text = document.createElement('span');
      text.className = 'option-label';
      text.textContent = pick(opt.label);

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

  /**
   * 선택지를 고른다.
   *
   * @param {number} i        고른 선택지
   * @param {boolean} advance 골랐으니 다음 문항으로 넘어갈지
   *
   * 자동 전진은 이 테스트에서 가장 크게 체감되는 부분이다. 20문항을
   * "고르고 다음 누르고"로 가면 탭이 40번인데, 고르면 넘어가게 하면 20번이다.
   * 한국 유형테스트들이 대부분 이렇게 하고, 실제로 끝까지 가는 비율이 다르다.
   *
   * 다만 두 곳에서는 넘기지 않는다.
   *   - 마지막 문항: 고르자마자 결과가 나오면 당황한다. '결과 보기'를 누르게 둔다.
   *   - 키보드 방향키: 라디오 그룹을 훑어보는 중이라 넘기면 안 된다.
   *
   * 넘기기 전에 잠깐 멈추는 건 고른 게 표시되는 걸 눈으로 확인시켜주기 위해서다.
   * 바로 넘기면 뭘 골랐는지 모른 채 화면이 바뀐다.
   */
  var ADVANCE_MS = 260;
  var pointerPick = false;
  var advanceTimer = null;

  function choose(i, advance) {
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

    if (advance && state.index < QUESTIONS.length - 1) {
      clearTimeout(advanceTimer);
      advanceTimer = setTimeout(function () { next(); }, reduceMotion ? 0 : ADVANCE_MS);
    }
  }

  function goto(index) {
    clearTimeout(advanceTimer);
    var target = Math.max(0, Math.min(QUESTIONS.length - 1, index));
    // 앞으로 가는지 뒤로 가는지에 따라 들어오는 방향을 바꾼다.
    // 방향이 없으면 문항이 그냥 교체돼서 몇 번째인지 감이 안 잡힌다.
    var dir = target > state.index ? 'fwd' : target < state.index ? 'back' : '';
    state.index = target;
    saveProgress();
    renderQuiz();
    animateQuestion(dir);
    scrollTop();
    el['question-text'].focus({ preventScroll: true });
  }

  /**
   * 문항이 들어오는 짧은 연출.
   * 150~500ms 를 넘기면 답하는 리듬이 끊긴다. 여기서는 애니메이션이
   * 끝나기 전에 다음 탭이 가능해야 해서 짧게 잡았다.
   * 모션을 줄이겠다고 설정한 사람에게는 아예 안 건다.
   */
  function animateQuestion(dir) {
    if (reduceMotion || !dir) return;
    var box = el['screen-quiz'].querySelector('.question-head').parentNode;
    box.classList.remove('q-in-fwd', 'q-in-back');
    // 클래스를 떼자마자 다시 붙이면 브라우저가 같은 프레임으로 묶어서
    // 애니메이션이 안 돈다. 강제로 레이아웃을 읽어 프레임을 끊는다.
    void box.offsetWidth;
    box.classList.add(dir === 'back' ? 'q-in-back' : 'q-in-fwd');
  }

  function next() {
    if (state.answers[state.index] === null) return;
    if (state.index === QUESTIONS.length - 1) { finish(); return; }
    goto(state.index + 1);
  }

  function startQuiz(mode) {
    state.mode = mode;
    state.index = 0;
    state.answers = new Array(QUESTIONS.length).fill(null);
    clearProgress();
    show('quiz');
    renderQuiz();
    scrollTop();
  }

  /* ── 결과 ──────────────────────────────────────────────────── */
  function finish() {
    el['loading-text'].textContent = copy().loading;
    show('loading');
    scrollTop();
    setTimeout(function () {
      state.result = scoreAnswers(state.answers);
      state.fromShare = false;
      writeHashCode(state.mode, state.answers);
      clearProgress();
      renderResult();
      show('result');
      scrollTop();
    }, reduceMotion ? 0 : LOADING_MS);
  }

  function renderResult() {
    var r = state.result;
    var top = r.top3[0];
    var c = copy();

    // 학교색은 결과 화면 전체에 퍼진다(이름·퍼센트·막대). 한 곳에서만 정한다.
    el['screen-result'].style.setProperty('--school', top.school.color);
    el['result-label'].textContent = c.resultLabel;
    el['result-name'].innerHTML = '';
    el['result-name'].appendChild(schoolLink(top.school, top.school.nameKo, 'is-hero'));
    el['result-en'].textContent = top.school.nameEn;
    el['result-tagline'].textContent = state.mode === 'parent'
      ? (top.school.taglineParent || top.school.tagline)
      : top.school.tagline;
    el['result-place'].textContent = top.school.location;
    el['result-percent'].textContent = top.percent + '%';
    el['axis-label'].textContent = c.axisLabel;
    el['axis-note'].textContent = c.axisNote;

    el['result-keywords'].innerHTML = '';
    top.school.keywords.forEach(function (kw) {
      var li = document.createElement('li');
      li.textContent = kw;
      el['result-keywords'].appendChild(li);
    });

    renderRanking(r);
    renderWhy(r);
    renderDetail(top.school);
    renderParentFacts(top.school);
    renderAxisChart(r);

    el['share-hint'].textContent = '';
    el['btn-share'].disabled = !canShareLink();
    if (!canShareLink()) {
      // SITE_URL 이 비어 있고 file:// 로 연 경우에만 여기 온다. 배포된 주소를
      // 모르면 공유 링크를 만들 수가 없다.
      el['share-hint'].textContent = '파일로 직접 열면 링크 공유는 쓸 수 없어요. 웹에 올리면 켜져요.';
    }

    // 링크를 받고 들어온 사람은 이 테스트를 한 적이 없다. 그 사람에게
    // '다시 하기'라고 하면 안 한 걸 다시 하라는 말이 된다.
    el['btn-restart'].textContent = state.fromShare ? '나도 해보기' : '다시 하기';
  }

  function renderRanking(r) {
    el.ranking.innerHTML = '';
    r.top3.forEach(function (item, i) {
      var row = document.createElement('div');
      row.className = 'rank-row' + (i === 0 ? ' is-top' : '');

      var body = document.createElement('div');
      body.className = 'rank-body';
      var name = document.createElement('p');
      name.className = 'rank-name';
      var ord = document.createElement('span');
      ord.className = 'rank-ordinal';
      ord.textContent = String(i + 1);
      name.appendChild(ord);
      name.appendChild(schoolLink(item.school, item.school.nameKo));
      var tag = document.createElement('p');
      tag.className = 'rank-tagline';
      tag.textContent = state.mode === 'parent'
        ? (item.school.taglineParent || item.school.tagline)
        : item.school.tagline;
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

      row.appendChild(body); row.appendChild(right);
      el.ranking.appendChild(row);

      // 다음 프레임에 너비를 줘야 트랜지션이 실제로 돈다
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { fill.style.width = item.percent + '%'; });
      });
    });
  }

  function renderWhy(r) {
    var top = r.top3[0];
    var c = copy();
    // 제목도 테스트마다 다르다. 한국 대학 버전은 30곳을 늘어놓는 것이라
    // '1위'라고 부르면 성향 매칭이 아니라 서열 확인으로 읽힌다.
    el['detail-title'].textContent = (c.whyTitle || function (n) {
      return josa(n, '이', '가') + ' 1위인 이유';
    })(top.school.nameKo, josa);

    var list = el['why-block'];
    list.innerHTML = '';

    if (!r.reasons.length) {
      var li = document.createElement('li');
      var span = document.createElement('span');
      span.style.gridColumn = '1 / -1';
      span.textContent = c.flatReason;
      li.appendChild(span);
      list.appendChild(li);
      return;
    }

    r.reasons.forEach(function (reason, i) {
      var li = document.createElement('li');
      var tag = document.createElement('span');
      tag.className = 'why-tag';
      tag.textContent = reason.axis.name;      // 태그는 축 이름, 문장은 어느 쪽인지
      // 긴 라벨(neg/pos)이 아니라 짧은 라벨을 쓴다. 긴 쪽은 차트 양끝에 세워두려고
      // 만든 문구라 문장 안에 넣으면 "협력·여유·내 페이스 쪽으로…" 처럼 늘어지고,
      // 1인칭이 섞여 있어서 학부모 모드에서는 주어까지 어긋난다.
      // 짧은 라벨은 축 그래프에 그대로 보이는 말이라 결과를 읽을 때도 이어진다.
      var pole = reason.label;
      var txt = document.createElement('span');
      var tail = c.reasonTails[i % c.reasonTails.length];
      txt.textContent = c.reasons[i % c.reasons.length](pole) + ' ' +
        tail(top.school.nameKo, josa);
      li.appendChild(tag); li.appendChild(txt);

      // 실제 답에서 뽑은 근거 한 줄. 셀 만한 게 없으면 안 붙인다.
      var ev = c.evidenceOf && c.evidenceOf(reason.evidence, pole);
      if (ev) {
        var evEl = document.createElement('span');
        evEl.className = 'why-evidence';
        evEl.textContent = ev;
        li.appendChild(evEl);
      }
      list.appendChild(li);
    });
  }

  function renderDetail(school) {
    var heads = copy().detailHeads;
    var d = school.detail[state.mode] || school.detail.student;
    el['detail-block'].innerHTML = '';
    [
      [heads[0], d.vibe],
      [heads[1], d.strength],
      [heads[2], d.fitsWho],
    ].forEach(function (part) {
      var wrap = document.createElement('div');
      wrap.className = 'detail-part';
      var h = document.createElement('p');
      h.className = 'detail-head';
      h.textContent = part[0];
      var b = document.createElement('p');
      b.className = 'detail-body';
      setEmphasis(b, part[1]);
      wrap.appendChild(h); wrap.appendChild(b);
      el['detail-block'].appendChild(wrap);
    });
  }

  // 학부모가 실제로 먼저 묻는 것들 — 학비 지원, 어디서 어떻게 사는지, 졸업 후.
  // 학생 모드에서는 통째로 숨긴다.
  function renderParentFacts(school) {
    if (!el['parent-facts-block'] || !el['parent-facts']) return;
    var show = state.mode === 'parent' && school.forParents;
    el['parent-facts-block'].classList.toggle('hidden', !show);
    if (!show) return;

    el['parent-facts'].innerHTML = '';
    [
      ['재정지원', school.forParents.aid],
      ['환경과 규모', school.forParents.place],
      ['졸업 후', school.forParents.after],
    ].forEach(function (row) {
      var dt = document.createElement('dt');
      dt.textContent = row[0];
      // 한국 버전은 이 칸의 place·after 가 facts 를 그대로 쓴다.
      // textContent 로 찍으면 ** 가 화면에 별표로 나온다.
      var dd = document.createElement('dd');
      setEmphasis(dd, row[1]);
      el['parent-facts'].appendChild(dt);
      el['parent-facts'].appendChild(dd);
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
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { bar.style.width = barWidth + '%'; });
      });

      // 스크린리더용 설명 (막대는 눈으로만 보이는 정보라서)
      // 거의 중립일 때는 방향을 말하면 안 된다. "독립적 쪽으로 거의 중립이에요"는
      // 앞뒤가 안 맞고, 사실 그 방향 자체가 반올림 오차 수준이라 의미도 없다.
      var sr = document.createElement('span');
      sr.className = 'offscreen';
      var side = v < 0 ? axis.negShort : axis.posShort;
      sr.textContent = axis.name + ': ' + (
        Math.abs(v) < 0.15 ? '어느 쪽으로도 크게 기울지 않았어요'
          : Math.abs(v) < 0.5 ? side + ' 쪽으로 약간 기울었어요'
            : side + ' 쪽으로 뚜렷하게 기울었어요'
      );

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
    var url = buildShareUrl(state.mode, state.answers);
    if (!url) { hint('공유 링크를 만들 수 없어요.'); return; }
    var c = copy();
    var top = state.result.top3[0];
    shareOrCopy(url, c.shareTitle, c.shareText(top.school.nameKo, top.percent))
      .then(function (outcome) {
        if (outcome === 'copied') hint('링크를 복사했어요. 붙여넣기 해보세요.');
        else if (outcome === 'failed') hint('복사에 실패했어요. 주소창을 직접 복사해 주세요.');
      });
  }

  function onImage() {
    el['btn-image'].disabled = true;
    var prev = el['btn-image'].textContent;
    el['btn-image'].textContent = '이미지 만드는 중…';

    // 캔버스는 CSS 폰트를 참조만 할 뿐 로딩을 기다려주지 않는다.
    // SUIT 가 아직 안 올라왔으면 대체 폰트로 그려져서 화면과 다른 이미지가
    // 나오므로, 폰트가 준비된 뒤에 그린다.
    fontsReady().then(function () {
      try {
        renderResultCard(el['export-canvas'], state.result, copy());
        saveResultCard(el['export-canvas'], state.result, copy().cardLead).then(function (outcome) {
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

    if (el['pick-here']) {
      el['pick-here'].addEventListener('click', function () { introStep('mode'); });
    }
    el['mode-student'].addEventListener('click', function () { startQuiz('student'); });
    el['mode-parent'].addEventListener('click', function () { startQuiz('parent'); });

    el['btn-resume'].addEventListener('click', function () {
      var saved = loadProgress();
      if (!saved) return;
      state.mode = saved.mode;
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
    // 이 블록이 없는 테스트도 있을 수 있다
    if (el['btn-community']) el['btn-community'].addEventListener('click', function () {
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
        state.mode = decoded.mode;
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
