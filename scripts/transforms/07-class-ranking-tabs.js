'use strict';
const { mustReplace } = require('../lib/extract');

const OLD_CLASS_HTML = `  <div id="screen-class" class="hidden">
    <div class="hero" style="background:linear-gradient(135deg,var(--red) 0%,#E86885 100%);">
      <h1>우리반 랭킹 👥</h1>
      <p>우리반 5,6학년 친구들이 얼마나 많이 학습했는지 활동별로 확인해봐요!</p>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="navbtn classGradeTab" id="classGradeTab5" data-grade="5" style="flex:1;">5학년</button>
      <button class="navbtn classGradeTab" id="classGradeTab6" data-grade="6" style="flex:1;">6학년</button>
    </div>

    <div class="rank-panel">
      <div class="records-title">🍽️ 영어 학습 횟수</div>
      <div id="classEngSessions"></div>
    </div>
    <div class="rank-panel">
      <div class="records-title">🏃 줄넘기 측정 횟수</div>
      <div id="classJrSessions"></div>
    </div>
  </div>`;

const NEW_CLASS_HTML = `  <div id="screen-class" class="hidden">
    <div class="hero" style="background:linear-gradient(135deg,var(--red) 0%,#E86885 100%);">
      <h1>우리반 랭킹 👥</h1>
      <p>우리반 친구들이 얼마나 많이 학습했는지 활동별로 확인해봐요!</p>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
      <button class="navbtn classGradeTab" id="classGradeTab3" data-grade="3" style="flex:1;min-width:70px;">3학년</button>
      <button class="navbtn classGradeTab" id="classGradeTab4" data-grade="4" style="flex:1;min-width:70px;">4학년</button>
      <button class="navbtn classGradeTab" id="classGradeTab5" data-grade="5" style="flex:1;min-width:70px;">5학년</button>
      <button class="navbtn classGradeTab" id="classGradeTab6" data-grade="6" style="flex:1;min-width:70px;">6학년</button>
    </div>

    <div class="rank-panel">
      <div class="records-title">🍽️ 영어 학습 횟수</div>
      <div id="classEngSessions"></div>
    </div>
    <div class="rank-panel hidden" id="classMultPanel">
      <div class="records-title">🧮 구구단 학습 횟수</div>
      <div id="classMultSessions"></div>
    </div>
    <div class="rank-panel">
      <div class="records-title">🏃 줄넘기 측정 횟수</div>
      <div id="classJrSessions"></div>
    </div>
  </div>`;

const OLD_RANKING_JS = `let classGradeFilter = 5;
let teacherGradeFilter = 5;

function styleGradeTabs(prefix, activeGrade){
  [5,6].forEach(g => {
    const btn = document.getElementById(prefix + g);
    if (!btn) return;
    if (g === activeGrade) { btn.style.background = 'var(--navy)'; btn.style.color = '#fff'; }
    else { btn.style.background = 'var(--cream-2)'; btn.style.color = 'var(--ink)'; }
  });
}
document.getElementById('classGradeTab5').addEventListener('click', () => { classGradeFilter = 5; styleGradeTabs('classGradeTab', 5); renderClassRanking(); });
document.getElementById('classGradeTab6').addEventListener('click', () => { classGradeFilter = 6; styleGradeTabs('classGradeTab', 6); renderClassRanking(); });

function renderClassRanking() {
  const stats = STUDENTS.filter(s => s.grade === classGradeFilter).map(s => {
    const sr = allRecords[s.id] || {};
    let engSess = 0;
    let engDays = new Set();
    Object.entries(sr).forEach(([date, day]) => Object.values(day).forEach(entry => {
      if (entry.activity === 'english') { engSess++; engDays.add(date); }
    }));
    // Jump rope stats
    let jrSess = 0;
    let jrDays = new Set();
    if (typeof jrData !== 'undefined' && jrData) {
      const jrStudent = jrData.find(j => j.sid === s.id);
      if (jrStudent && jrStudent.ms) {
        jrStudent.ms.forEach(m => {
          const hasScore = m.scores && Object.values(m.scores).some(v => v !== "" && v != null);
          if (hasScore) { jrSess++; if (m.date) jrDays.add(m.date); }
        });
      }
    }
    return {...s, engSess, jrSess, engDays: engDays.size, jrDays: jrDays.size};
  });

  // English by sessions
  const engRanked = [...stats].sort((a, b) => b.engSess - a.engSess);
  document.getElementById('classEngSessions').innerHTML = engRanked.map((s, i) =>
    renderRankRow(s, i + 1, \`\${s.engDays}일 동안 학습\`, s.engSess, '회')
  ).join('');


  // Jump rope by sessions
  const jrRanked = [...stats].sort((a, b) => b.jrSess - a.jrSess);
  document.getElementById('classJrSessions').innerHTML = jrRanked.map((s, i) =>
    renderRankRow(s, i + 1, \`\${s.jrDays}일 동안 측정\`, s.jrSess, '회')
  ).join('');
}`;

const NEW_RANKING_JS = `let classGradeFilter = 3;
let teacherGradeFilter = 3;

function styleGradeTabs(prefix, activeGrade){
  [3,4,5,6].forEach(g => {
    const btn = document.getElementById(prefix + g);
    if (!btn) return;
    if (g === activeGrade) { btn.style.background = 'var(--navy)'; btn.style.color = '#fff'; }
    else { btn.style.background = 'var(--cream-2)'; btn.style.color = 'var(--ink)'; }
  });
}
[3,4,5,6].forEach(g => {
  document.getElementById('classGradeTab' + g).addEventListener('click', () => {
    classGradeFilter = g;
    styleGradeTabs('classGradeTab', g);
    renderClassRanking();
  });
});

function renderClassRanking() {
  const showMult = classGradeFilter === 3;
  document.getElementById('classMultPanel').classList.toggle('hidden', !showMult);
  const stats = STUDENTS.filter(s => s.grade === classGradeFilter).map(s => {
    const sr = allRecords[s.id] || {};
    let engSess = 0, multSess = 0;
    let engDays = new Set(), multDays = new Set();
    Object.entries(sr).forEach(([date, day]) => Object.values(day).forEach(entry => {
      if (entry.activity === 'english') { engSess++; engDays.add(date); }
      if (entry.activity === 'multiplication') { multSess++; multDays.add(date); }
    }));
    // Jump rope stats
    let jrSess = 0;
    let jrDays = new Set();
    if (typeof jrData !== 'undefined' && jrData) {
      const jrStudent = jrData.find(j => j.sid === s.id);
      if (jrStudent && jrStudent.ms) {
        jrStudent.ms.forEach(m => {
          const hasScore = m.scores && Object.values(m.scores).some(v => v !== "" && v != null);
          if (hasScore) { jrSess++; if (m.date) jrDays.add(m.date); }
        });
      }
    }
    return {...s, engSess, jrSess, multSess, engDays: engDays.size, jrDays: jrDays.size, multDays: multDays.size};
  });

  // English by sessions
  const engRanked = [...stats].sort((a, b) => b.engSess - a.engSess);
  document.getElementById('classEngSessions').innerHTML = engRanked.map((s, i) =>
    renderRankRow(s, i + 1, \`\${s.engDays}일 동안 학습\`, s.engSess, '회')
  ).join('');

  if (showMult) {
    const multRanked = [...stats].sort((a, b) => b.multSess - a.multSess);
    document.getElementById('classMultSessions').innerHTML = multRanked.map((s, i) =>
      renderRankRow(s, i + 1, \`\${s.multDays}일 동안 학습\`, s.multSess, '회')
    ).join('');
  }

  // Jump rope by sessions
  const jrRanked = [...stats].sort((a, b) => b.jrSess - a.jrSess);
  document.getElementById('classJrSessions').innerHTML = jrRanked.map((s, i) =>
    renderRankRow(s, i + 1, \`\${s.jrDays}일 동안 측정\`, s.jrSess, '회')
  ).join('');
}`;

module.exports = function classRankingTabs(html, ctx) {
  html = mustReplace(html, OLD_CLASS_HTML, NEW_CLASS_HTML, '07: screen-class HTML');
  html = mustReplace(html, OLD_RANKING_JS, NEW_RANKING_JS, '07: ranking JS');
  return html;
};
