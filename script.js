/* ============================================================
   Showcase interactions - scroll reveal, nav progress, count-up,
   and the auto-playing "demo video" mock.
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal, .reveal-scale');
  if (reduce) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { if (!el.classList.contains('in')) io.observe(el); });
  }

  /* ---------- nav scroll progress ---------- */
  var bar = document.getElementById('navProgress');
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? (h.scrollTop || document.body.scrollTop) / max : 0;
    bar.style.width = (p * 100).toFixed(2) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- count-up numbers ---------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (reduce) { el.textContent = target.toLocaleString(); return; }
    var dur = 1200, start = performance.now();
    function tick(now) {
      var t = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var counters = document.querySelectorAll('[data-count]');
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
  }, { threshold: 0.6 });
  counters.forEach(function (el) { cio.observe(el); });

  /* ============================================================
     DEMO - interactive: user picks Model + Mode, presses Generate,
     hovers a paragraph to highlight matching SHACL lines.
     ============================================================ */
  var SHAPE = [
    [['e-p','ex:PersonShape '], ['tk','a '], ['e-k','sh:NodeShape'], ['tk',' ;']],
    [['tk','  '], ['e-p','sh:targetClass'], ['tk',' ex:Person ;']],
    [['tk','  '], ['e-p','sh:property'], ['tk',' [']],
    [['tk','    '], ['e-p','sh:path'], ['tk',' ex:name ;']],
    [['tk','    '], ['e-p','sh:datatype'], ['tk',' '], ['e-s','xsd:string'], ['tk',' ;']],
    [['tk','    '], ['e-p','sh:minCount'], ['tk',' '], ['e-n','1'], ['tk',' ] ;']],
    [['tk','  '], ['e-p','sh:property'], ['tk',' [']],
    [['tk','    '], ['e-p','sh:path'], ['tk',' ex:age ;']],
    [['tk','    '], ['e-p','sh:datatype'], ['tk',' '], ['e-s','xsd:integer'], ['tk',' ;']],
    [['tk','    '], ['e-p','sh:minInclusive'], ['tk',' '], ['e-n','0'], ['tk',' ] .']]
  ];

  // Line ranges (1-indexed) mapped to each paragraph. "lines" is a list of [start,end].
  // Six pre-baked combinations of Model × Mode. Metrics differ visibly so users see the
  // "Mode B is expensive" and "Model 2 costs more" narratives from the report.
  var OUTPUTS = {
    'm1|A': {
      metrics: { cost: 0.00003, tokens: 1040, time: 2.1 },
      paras: [
        { html: 'Every <strong>Person</strong> must have at least one name, and that name must be plain text.', lines: [[3,6]] },
        { html: 'If an <strong>age</strong> is given, it must be a whole number of zero or greater.', lines: [[7,10]] },
        { html: 'Together, these rules define a valid Person record: a required name and an optional, non-negative age.', lines: [[1,10]] }
      ]
    },
    'm1|B': {
      metrics: { cost: 0.00048, tokens: 15200, time: 18.2 },
      paras: [
        { html: 'Constraint 1: the shape targets every instance of <strong>Person</strong>.', lines: [[1,2]] },
        { html: 'Constraint 2: each Person requires a <strong>name</strong> value.', lines: [[3,4]] },
        { html: 'Constraint 3: the name must be a plain-text (<em>string</em>) value.', lines: [[5,5]] },
        { html: 'Constraint 4: at least one name is required (minimum count is 1).', lines: [[6,6]] },
        { html: 'Constraint 5: if an <strong>age</strong> is present, it must be a non-negative integer.', lines: [[7,10]] }
      ]
    },
    'm1|C': {
      metrics: { cost: 0.00002, tokens: 620, time: 1.8 },
      paras: [
        { html: 'A <strong>Person</strong> must have a name, which is a string, and there must be at least one.', lines: [[3,6]] },
        { html: 'A Person may have an <strong>age</strong>; if present it is an integer of 0 or greater.', lines: [[7,10]] }
      ]
    },
    'm2|A': {
      metrics: { cost: 0.00019, tokens: 1120, time: 3.4 },
      paras: [
        { html: 'Every <strong>Person</strong> must have at least one <strong>name</strong>, and that name must be plain text.', lines: [[3,6]] },
        { html: 'The <strong>age</strong>, if provided, must be a whole number that is zero or greater - negative ages are not permitted.', lines: [[7,10]] },
        { html: 'Together these rules define a valid Person record: a required plain-text name and an optional, non-negative age.', lines: [[1,10]] }
      ]
    },
    'm2|B': {
      metrics: { cost: 0.00280, tokens: 16800, time: 24.5 },
      paras: [
        { html: 'The shape applies to every resource classified as <strong>Person</strong>.', lines: [[1,2]] },
        { html: 'Each Person is required to have a <strong>name</strong> property.', lines: [[3,4]] },
        { html: 'The name value must be a plain-text string, so URIs or numbers are rejected.', lines: [[5,5]] },
        { html: 'A minimum count of one enforces that the name is mandatory - a Person without a name is invalid.', lines: [[6,6]] },
        { html: 'The optional <strong>age</strong> property, when present, must be a non-negative integer.', lines: [[7,10]] },
        { html: 'Summary: a valid Person has a required plain-text name and an optional, non-negative integer age.', lines: [[1,10]] }
      ]
    },
    'm2|C': {
      metrics: { cost: 0.00015, tokens: 680, time: 3.1 },
      paras: [
        { html: 'A <strong>Person</strong> must carry at least one <strong>name</strong> written as plain text.', lines: [[3,6]] },
        { html: 'If an <strong>age</strong> is given, it must be a whole number that is zero or greater.', lines: [[7,10]] },
        { html: 'Overall, a valid Person record consists of a required name and an optional, non-negative age.', lines: [[1,10]] }
      ]
    }
  };

  var editor = document.getElementById('demoEditor');
  var genBtn = document.getElementById('demoGen');
  var skeleton = document.getElementById('demoSkeleton');
  var outText = document.getElementById('demoText');
  var outEmpty = document.getElementById('demoEmpty');
  var app = document.getElementById('demoApp');
  var modelSel = document.getElementById('demoModel');
  var modeSel = document.getElementById('demoMode');
  var badge = document.getElementById('demoBadge');
  var metricEls = {
    cost: document.querySelector('#demoApp [data-metric="cost"]') || document.querySelector('[data-metric="cost"]'),
    tokens: document.querySelector('#demoApp [data-metric="tokens"]') || document.querySelector('[data-metric="tokens"]'),
    time: document.querySelector('#demoApp [data-metric="time"]') || document.querySelector('[data-metric="time"]')
  };
  var bars = {
    cost: document.querySelector('#demoApp [data-bar="cost"]') || document.querySelector('[data-bar="cost"]'),
    tokens: document.querySelector('#demoApp [data-bar="tokens"]') || document.querySelector('[data-bar="tokens"]'),
    time: document.querySelector('#demoApp [data-bar="time"]') || document.querySelector('[data-bar="time"]')
  };

  var timers = [];
  function after(ms, fn) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  function lineHTML(parts) {
    return parts.map(function (p) { return '<span class="' + p[0] + '">' + p[1] + '</span>'; }).join('');
  }

  // Render the SHACL statically (no typing animation) so the user can interact immediately.
  function renderShape() {
    editor.innerHTML = '';
    for (var i = 0; i < SHAPE.length; i++) {
      var ln = document.createElement('div');
      ln.className = 'line';
      ln.setAttribute('data-line', String(i + 1));
      ln.innerHTML = '<span class="ln">' + (i + 1) + '</span>' + lineHTML(SHAPE[i]);
      editor.appendChild(ln);
    }
  }

  function clearLineHighlight() {
    editor.querySelectorAll('.line.hl').forEach(function (el) { el.classList.remove('hl'); });
  }
  function highlightRanges(ranges) {
    clearLineHighlight();
    for (var r = 0; r < ranges.length; r++) {
      var from = ranges[r][0], to = ranges[r][1];
      for (var n = from; n <= to; n++) {
        var el = editor.querySelector('.line[data-line="' + n + '"]');
        if (el) el.classList.add('hl');
      }
    }
  }

  function currentBadge() {
    var m = modelSel.value === 'm2' ? 'GPT-4o mini' : 'DeepSeek V3.2';
    return '<span class="b-dot"></span> ' + m + ' · Mode ' + modeSel.value;
  }

  function resetMetrics() {
    Object.keys(metricEls).forEach(function (k) { if (bars[k]) bars[k].style.width = '0'; });
    metricEls.cost.textContent = '$0.00000';
    metricEls.tokens.textContent = '0';
    metricEls.time.textContent = '0.00s';
  }

  function animateMetric(el, barEl, from, to, fmt, dur) {
    var start = performance.now();
    if (barEl) barEl.style.width = '100%';
    function tick(now) {
      var t = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function generate() {
    clearTimers();
    clearLineHighlight();
    if (outEmpty) outEmpty.style.display = 'none';
    outText.innerHTML = '';
    outText.style.display = 'none';
    skeleton.style.display = 'flex';
    badge.innerHTML = currentBadge();

    genBtn.disabled = true;
    genBtn.className = 'gen-btn busy';
    genBtn.innerHTML = '<span class="spinner"></span> Generating...';

    var key = modelSel.value + '|' + modeSel.value;
    var payload = OUTPUTS[key];
    var m = payload.metrics;
    resetMetrics();
    if (!reduce) {
      animateMetric(metricEls.tokens, bars.tokens, 0, m.tokens, function (v) { return Math.round(v).toLocaleString(); }, 1400);
      animateMetric(metricEls.cost, bars.cost, 0, m.cost, function (v) { return '$' + v.toFixed(5); }, 1400);
      animateMetric(metricEls.time, bars.time, 0, m.time, function (v) { return v.toFixed(2) + 's'; }, 1400);
    } else {
      metricEls.tokens.textContent = m.tokens.toLocaleString();
      metricEls.cost.textContent = '$' + m.cost.toFixed(5);
      metricEls.time.textContent = m.time.toFixed(2) + 's';
      bars.tokens.style.width = bars.cost.style.width = bars.time.style.width = '100%';
    }

    after(reduce ? 0 : 1500, function () { streamOutput(payload.paras); });
  }

  function streamOutput(paras) {
    skeleton.style.display = 'none';
    outText.style.display = 'block';
    outText.innerHTML = '';

    var p = 0;
    function nextPara() {
      if (p >= paras.length) {
        genBtn.disabled = false;
        genBtn.className = 'gen-btn';
        genBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6 9 17l-5-5"/></svg> Done';
        return;
      }
      var el = document.createElement('p');
      el.className = 'reveal-line';
      el.setAttribute('data-lines', JSON.stringify(paras[p].lines));
      el.innerHTML = paras[p].html;
      outText.appendChild(el);
      void el.offsetWidth;
      el.style.transition = 'opacity .4s ease, transform .4s ease';
      el.style.opacity = '1'; el.style.transform = 'none';
      p++;
      after(reduce ? 0 : 380, nextPara);
    }
    nextPara();
  }

  if (editor && genBtn) {
    renderShape();
    genBtn.addEventListener('click', function () {
      if (genBtn.disabled) return;
      generate();
    });
    // Update the badge live so users see the pending combination.
    function updateBadge() { badge.innerHTML = currentBadge(); }
    modelSel.addEventListener('change', updateBadge);
    modeSel.addEventListener('change', updateBadge);

    // Bidirectional-style linking: paragraph -> lines.
    // Desktop: hover shows, mouseleave clears.
    // Touch: tap a paragraph to toggle its highlight (works without a hover state).
    function activateParagraph(p) {
      try {
        var ranges = JSON.parse(p.getAttribute('data-lines'));
        highlightRanges(ranges);
        outText.querySelectorAll('p.active').forEach(function (el) { el.classList.remove('active'); });
        p.classList.add('active');
      } catch (err) { /* ignore */ }
    }
    outText.addEventListener('mouseover', function (e) {
      var p = e.target.closest('p[data-lines]');
      if (!p || !outText.contains(p)) return;
      activateParagraph(p);
    });
    outText.addEventListener('mouseleave', function () {
      clearLineHighlight();
      outText.querySelectorAll('p.active').forEach(function (el) { el.classList.remove('active'); });
    });
    // Tap support: any click on a paragraph toggles it; click on empty space clears.
    outText.addEventListener('click', function (e) {
      var p = e.target.closest('p[data-lines]');
      if (!p) {
        clearLineHighlight();
        outText.querySelectorAll('p.active').forEach(function (el) { el.classList.remove('active'); });
        return;
      }
      if (p.classList.contains('active')) {
        clearLineHighlight();
        p.classList.remove('active');
      } else {
        activateParagraph(p);
      }
    });
  }

  /* ============================================================
     THEME TOGGLE  (light default, remembers choice)
     ============================================================ */
  var root = document.documentElement;
  var toggle = document.getElementById('themeToggle');
  var saved = null;
  try { saved = localStorage.getItem('shacl-showcase-theme'); } catch (e) {}
  if (saved === 'dark' || (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    root.classList.add('dark');
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      var dark = root.classList.toggle('dark');
      try { localStorage.setItem('shacl-showcase-theme', dark ? 'dark' : 'light'); } catch (e) {}
    });
  }

  /* ============================================================
     COMPARE MODE DEMO  (three columns fill in, winners light up)
     ============================================================ */
  var cmpApp = document.getElementById('compareApp');
  if (cmpApp) {
    var COLS = [
      { sel: '[data-col="0"]', cost: '$0.00007', tokens: '1,040', time: '3.39s',
        text: 'Every Person must have at least one name, and it must be plain text. The age, if given, must be a whole number that is 0 or greater.' },
      { sel: '[data-col="1"]', cost: '$0.00009', tokens: '1,075', time: '3.28s',
        text: 'A Person needs at least one name as plain text. If an age is present, it has to be a whole number of 0 or more - a required name and an optional, non-negative age.' },
      { sel: '[data-col="2"]', cost: '$0.00460', tokens: '1,216', time: '3.06s',
        text: 'The age, if provided, must be a whole number of 0 or greater, and every Person must carry at least one plain-text name.' }
    ];
    // winners (lowest cost = col0 GPT, fastest = col2 Claude actually 3.06s, best score = col1 DeepSeek)
    // keep the narrative: cheapest GPT-4o mini, fastest Claude, best score DeepSeek
    var cmpTimers = [];
    function cAfter(ms, fn) { var id = setTimeout(fn, ms); cmpTimers.push(id); return id; }
    function cClear() { cmpTimers.forEach(clearTimeout); cmpTimers = []; }

    function cmpReset() {
      cClear();
      COLS.forEach(function (c) {
        var col = cmpApp.querySelector(c.sel);
        col.classList.remove('win');
        col.querySelectorAll('.cm-v').forEach(function (v) { v.textContent = '-'; });
        col.querySelectorAll('.cm').forEach(function (m) { m.classList.remove('best'); });
        col.querySelector('.cmp-skel').style.display = 'flex';
        col.querySelector('.cmp-text').innerHTML = '';
      });
      cmpApp.querySelectorAll('.cmp-chip').forEach(function (ch) { ch.classList.remove('lit'); });
    }

    function cmpFillCol(i, done) {
      var c = COLS[i];
      var col = cmpApp.querySelector(c.sel);
      col.querySelector('.cmp-skel').style.display = 'none';
      col.querySelector('[data-m="cost"] .cm-v').textContent = c.cost;
      col.querySelector('[data-m="tokens"] .cm-v').textContent = c.tokens;
      col.querySelector('[data-m="time"] .cm-v').textContent = c.time;
      var t = col.querySelector('.cmp-text');
      var p = document.createElement('p'); p.textContent = c.text; t.appendChild(p);
      void p.offsetWidth; p.classList.add('in');
      if (done) cAfter(reduce ? 0 : 700, cmpHighlight);
    }

    function cmpHighlight() {
      // cheapest -> col0, fastest -> col2, best score -> col1
      var c0 = cmpApp.querySelector('[data-col="0"]');
      var c1 = cmpApp.querySelector('[data-col="1"]');
      var c2 = cmpApp.querySelector('[data-col="2"]');
      c0.querySelector('[data-m="cost"]').classList.add('best');
      c2.querySelector('[data-m="time"]').classList.add('best');
      c1.classList.add('win');
      var chips = cmpApp.querySelectorAll('.cmp-chip');
      chips.forEach(function (ch, idx) { cAfter(reduce ? 0 : 180 * idx, function () { ch.classList.add('lit'); }); });
      cAfter(reduce ? 0 : 4200, cmpLoop);
    }

    function cmpRun() {
      cmpReset();
      cAfter(reduce ? 0 : 600, function () { cmpFillCol(0, false); });
      cAfter(reduce ? 0 : 1150, function () { cmpFillCol(1, false); });
      cAfter(reduce ? 0 : 1700, function () { cmpFillCol(2, true); });
    }
    function cmpLoop() { cmpRun(); }

    var cmpStarted = false;
    var cio2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          if (!cmpStarted || cmpTimers.length === 0) { cmpStarted = true; cmpReset(); cAfter(300, cmpRun); }
        } else { cClear(); cmpStarted = false; }
      });
    }, { threshold: 0.3 });
    cio2.observe(cmpApp);
  }
})();
