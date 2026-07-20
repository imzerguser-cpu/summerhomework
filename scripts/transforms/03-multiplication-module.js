'use strict';
const { mustReplace, extractBetween } = require('../lib/extract');

// NOTE: this file's <head> is duplicated verbatim a second time deep inside the embedded
// quizDocTemplate (it's a full second HTML document textually embedded as quiz-engine data), so
// a generic `</style>\n</head>` anchor matches twice and mustReplace would correctly refuse to
// guess which one. Anchor on these two CSS rules instead — both verified to occur exactly once
// in the whole file (they don't exist inside the quiz engine's own stylesheet at all).
const OLD_ACTIVITYCARD_CSS = `.activitycard.eng::before{background:var(--sky);}
.activitycard.rope::before{background:var(--green);}`;
const NEW_ACTIVITYCARD_CSS = `.activitycard.eng::before{background:var(--sky);}
.activitycard.mult::before{background:var(--mustard);}
.activitycard.rope::before{background:var(--green);}`;

const OLD_CALDOT_CSS = `.cal-dot.eng{background:#4DA3E8;}       /* 영어 - 파란색 */
.cal-dot.jr{background:#3FA772;}        /* 줄넘기 - 초록색 */`;
const NEW_CALDOT_CSS = `.cal-dot.eng{background:#4DA3E8;}       /* 영어 - 파란색 */
.cal-dot.mult{background:#FFB800;}      /* 구구단 - 노란색 */
.cal-dot.jr{background:#3FA772;}        /* 줄넘기 - 초록색 */`;

const OLD_MENU_BLOCK = `    <div class="activity-grid">
      <button class="activitycard eng" onclick="startEnglish()">
        <span class="icon-big">🍽️</span>
        <h3>맛있는 영어</h3>
        <p>5,6학년 영어 단어와 표현을 재미있게 배워요. 마이크로 말하면서 연습해요!</p>
      </button>
      <button class="activitycard rope" onclick="startJumpRope()">
        <span class="icon-big">🏃</span>
        <h3>줄넘기 급수제</h3>
        <p>대한줄넘기협회 기준으로 8종목 급수를 측정하고 기록해요. 친구들과 함께!</p>
      </button>
      <button class="activitycard record" onclick="startRecords()">
        <span class="icon-big">📅</span>
        <h3>내 기록 보기</h3>
        <p>달력에서 공부한 날을 확인하고 몇 문제 맞췄는지 그래프로 봐요!</p>
      </button>
    </div>
  </div>

  <!-- SCREEN 2: English quiz -->`;

const NEW_MENU_BLOCK = `    <div class="activity-grid">
      <button class="activitycard eng" id="engActivityCard" onclick="startEnglish()">
        <span class="icon-big">🍽️</span>
        <h3>맛있는 영어</h3>
        <p id="engActivityCardDesc">영어 단어와 표현을 재미있게 배워요. 마이크로 말하면서 연습해요!</p>
      </button>
      <button class="activitycard mult hidden" id="multActivityCard" onclick="startMultiplication()">
        <span class="icon-big">🧮</span>
        <h3>맛있는 구구단</h3>
        <p>2단부터 9단까지! 말하거나 눌러서 정답을 입력하며 구구단을 익혀요.</p>
      </button>
      <button class="activitycard rope" onclick="startJumpRope()">
        <span class="icon-big">🏃</span>
        <h3>줄넘기 급수제</h3>
        <p>대한줄넘기협회 기준으로 8종목 급수를 측정하고 기록해요. 친구들과 함께!</p>
      </button>
      <button class="activitycard record" onclick="startRecords()">
        <span class="icon-big">📅</span>
        <h3>내 기록 보기</h3>
        <p>달력에서 공부한 날을 확인하고 몇 문제 맞췄는지 그래프로 봐요!</p>
      </button>
    </div>
  </div>

  <!-- SCREEN 2: English quiz -->`;

const OLD_JUMPROPE_HTML_MARKER = `  <div id="screen-jumprope" class="hidden">`;

// startMultiplication() itself is NOT inside the "MULTIPLICATION MODULE" section — like
// startEnglish()/startJumpRope(), it lives in the "MAIN ACTIVITY ENTRY POINTS" section instead
// (verified: index.html defines it at line 1209, immediately before startJumpRope()). Port it
// separately, right before the target's own startJumpRope().
const OLD_START_JUMPROPE_FN = `function startJumpRope() {`;
const NEW_START_JUMPROPE_FN = `function startMultiplication() {
  document.getElementById('mult-home').classList.remove('hidden');
  document.getElementById('mult-game').classList.add('hidden');
  document.getElementById('mult-result').classList.add('hidden');
  showScreen('screen-mult');
}
function startJumpRope() {`;

const OLD_SCROLL_LINE = `  window.scrollTo(0, 0);
}`;
const NEW_SCROLL_LINE = `  window.scrollTo(0, 0);
  if (id === 'screen-menu') updateMenuCardsForGrade();
}

function updateMenuCardsForGrade() {
  const isGrade3 = !!(currentStudent && currentStudent.grade === 3);
  document.getElementById('multActivityCard').classList.toggle('hidden', !isGrade3);
  document.getElementById('engActivityCardDesc').textContent = isGrade3
    ? '3학년 영어 단어와 표현을 재미있게 배워요. 마이크로 말하면서 연습해요!'
    : '영어 단어와 표현을 재미있게 배워요. 마이크로 말하면서 연습해요!';
}`;

module.exports = function multiplicationModule(html, ctx) {
  // 1. CSS
  html = mustReplace(html, OLD_ACTIVITYCARD_CSS, NEW_ACTIVITYCARD_CSS, '03: activitycard mult CSS');
  html = mustReplace(html, OLD_CALDOT_CSS, NEW_CALDOT_CSS, '03: cal-dot mult CSS');

  // 2. Menu cards (add hidden mult card + grade-aware English description hook)
  html = mustReplace(html, OLD_MENU_BLOCK, NEW_MENU_BLOCK, '03: menu activity-grid');

  // 3. Port the screen-mult HTML from the 3학년 source, insert right before screen-jumprope
  const multHtml = extractBetween(
    ctx.src3,
    `<div id="screen-mult" class="hidden">`,
    `<div id="screen-jumprope" class="hidden">`,
    '03: screen-mult HTML extraction'
  );
  html = mustReplace(
    html,
    OLD_JUMPROPE_HTML_MARKER,
    `<div id="screen-mult" class="hidden">${multHtml}<div id="screen-jumprope" class="hidden">`,
    '03: insert screen-mult HTML'
  );

  // 4. Port the MULTIPLICATION MODULE JS from the 3학년 source, insert right before the JUMP ROPE MODULE header
  const multJs = extractBetween(
    ctx.src3,
    `/* ================================================================
   MULTIPLICATION MODULE
================================================================ */`,
    `/* ================================================================
   JUMP ROPE MODULE`,
    '03: MULTIPLICATION MODULE JS extraction'
  );
  html = mustReplace(
    html,
    `/* ================================================================
   JUMP ROPE MODULE`,
    `/* ================================================================
   MULTIPLICATION MODULE
================================================================ */${multJs}/* ================================================================
   JUMP ROPE MODULE`,
    '03: insert MULTIPLICATION MODULE JS'
  );

  // 5. Port startMultiplication() itself (lives in MAIN ACTIVITY ENTRY POINTS, not the module above)
  html = mustReplace(html, OLD_START_JUMPROPE_FN, NEW_START_JUMPROPE_FN, '03: insert startMultiplication()');

  // 6. Hook grade-aware menu-card visibility into showScreen()
  html = mustReplace(html, OLD_SCROLL_LINE, NEW_SCROLL_LINE, '03: showScreen menu-card hook');

  return html;
};
