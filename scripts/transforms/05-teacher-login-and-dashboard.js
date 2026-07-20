'use strict';
const { mustReplace } = require('../lib/extract');

// -- 1. Per-grade teacher password state (replaces single DEFAULT_TEACHER_PASSWORD/teacherPassword) --
const OLD_PW_STATE = `const DEFAULT_TEACHER_PASSWORD = '2026';
let teacherPassword = DEFAULT_TEACHER_PASSWORD;

// Listen for teacher password changes in Firebase
const teacherPwRef = db.ref('mado56_teacher_password');
teacherPwRef.on('value', (snapshot) => {
  const val = snapshot.val();
  teacherPassword = (val && typeof val === 'string' && val.length > 0) ? String(val) : DEFAULT_TEACHER_PASSWORD;
});

let pendingTeacherGrade = 5;
document.getElementById('teacherLoginBtn5').addEventListener('click', () => {
  pendingTeacherGrade = 5;
  document.getElementById('teacherPwInput').value = '';
  document.getElementById('teacherPwErr').style.display = 'none';
  showScreen('screen-teacher-login');
  setTimeout(() => { document.getElementById('teacherPwInput').focus(); }, 100);
});
document.getElementById('teacherLoginBtn6').addEventListener('click', () => {
  pendingTeacherGrade = 6;
  document.getElementById('teacherPwInput').value = '';
  document.getElementById('teacherPwErr').style.display = 'none';
  showScreen('screen-teacher-login');
  setTimeout(() => { document.getElementById('teacherPwInput').focus(); }, 100);
});

document.getElementById('teacherLoginCancel').addEventListener('click', () => {
  showScreen('screen-students');
});

function teacherTryLogin() {
  const pw = document.getElementById('teacherPwInput').value.trim();
  if (pw === teacherPassword) {
    document.getElementById('teacherPwErr').style.display = 'none';
    openTeacherDashboard();
  } else {
    document.getElementById('teacherPwErr').style.display = 'block';
    document.getElementById('teacherPwInput').value = '';
    document.getElementById('teacherPwInput').focus();
  }
}`;

const NEW_PW_STATE = `const TEACHER_PW_DEFAULTS = { 3: '260301', 4: '2026', 5: '2026', 6: '2026' };
let teacherPasswords = { ...TEACHER_PW_DEFAULTS };

// Listen for each grade's teacher password changes in Firebase (grades 3/4/5/6 are now fully independent)
[3, 4, 5, 6].forEach(g => {
  db.ref('mado' + g + '_teacher_password').on('value', (snapshot) => {
    const val = snapshot.val();
    teacherPasswords[g] = (val && typeof val === 'string' && val.length > 0) ? String(val) : TEACHER_PW_DEFAULTS[g];
  });
});

let pendingTeacherGrade = 3;
[3, 4, 5, 6].forEach(g => {
  document.getElementById('teacherLoginBtn' + g).addEventListener('click', () => {
    pendingTeacherGrade = g;
    document.getElementById('teacherPwInput').value = '';
    document.getElementById('teacherPwErr').style.display = 'none';
    showScreen('screen-teacher-login');
    setTimeout(() => { document.getElementById('teacherPwInput').focus(); }, 100);
  });
});

document.getElementById('teacherLoginCancel').addEventListener('click', () => {
  showScreen('screen-students');
});

function teacherTryLogin() {
  const pw = document.getElementById('teacherPwInput').value.trim();
  if (pw === teacherPasswords[pendingTeacherGrade]) {
    document.getElementById('teacherPwErr').style.display = 'none';
    openTeacherDashboard();
  } else {
    document.getElementById('teacherPwErr').style.display = 'block';
    document.getElementById('teacherPwInput').value = '';
    document.getElementById('teacherPwInput').focus();
  }
}`;

// -- 2. Own-password display/change: teacherPassword -> teacherPasswords[teacherGradeFilter], teacherPwRef -> per-grade ref --
const OLD_PW_DISPLAY = `function updateTeacherPwDisplay() {
  const el = document.getElementById('teacherCurrentPw');
  if (!el) return;
  el.textContent = teacherPwVisible ? teacherPassword : '••••••';`;
const NEW_PW_DISPLAY = `function updateTeacherPwDisplay() {
  const el = document.getElementById('teacherCurrentPw');
  if (!el) return;
  el.textContent = teacherPwVisible ? teacherPasswords[teacherGradeFilter] : '••••••';`;

const OLD_PW_SAVE = `  teacherPwRef.set(newPw).then(() => {
    teacherPassword = newPw;`;
const NEW_PW_SAVE = `  db.ref('mado' + teacherGradeFilter + '_teacher_password').set(newPw).then(() => {
    teacherPasswords[teacherGradeFilter] = newPw;`;

// -- 3. Grade-scoped "전체 초기화" (was recordsRef.remove()/jumpRopeRef.remove() — wiped ALL grades
//    sharing a ref, e.g. a grade-5 teacher's reset used to also wipe grade 6's jump rope records
//    since jumprope_data is shared by every grade. Fixed by scoping to the logged-in teacher's own grade.) --
const OLD_RESET_CALL = `  Promise.all([
    recordsRef.remove(),
    jumpRopeRef.remove(),
  ]).then(() => {`;
const NEW_RESET_CALL = `  resetAllRecordsForGrade(teacherGradeFilter).then(() => {`;

// -- 4. Status table: add 구구단 column only for grade 3 --
const OLD_STATUS_TABLE = `function renderTeacherStatusTable(dateStr) {
  const rows = STUDENTS.filter(s => s.grade === teacherGradeFilter).map(s => {
    const acts = studentActivitiesOnDate(s.id, dateStr);
    const eng = acts.has('english') ? '✅' : '❌';
    const jr = acts.has('jumprope') ? '✅' : '❌';
    const doneCount = (acts.has('english') ? 1 : 0) + (acts.has('jumprope') ? 1 : 0);
    const rowBg = doneCount === 2 ? 'background:#E8F5E9;' : (doneCount === 0 ? 'background:#FFF3E0;' : '');
    return \`<tr style="\${rowBg}">
      <td style="padding:10px 12px;font-weight:800;border-bottom:1px solid var(--cream-2);">
        <span style="font-size:18px;margin-right:6px;">\${s.emoji}</span>\${s.name}
      </td>
      <td style="text-align:center;padding:10px 8px;font-size:20px;border-bottom:1px solid var(--cream-2);">\${eng}</td>
      <td style="text-align:center;padding:10px 8px;font-size:20px;border-bottom:1px solid var(--cream-2);">\${jr}</td>
      <td style="text-align:center;padding:10px 8px;font-weight:800;border-bottom:1px solid var(--cream-2);color:\${doneCount === 2 ? 'var(--green)' : (doneCount === 0 ? 'var(--red)' : 'var(--ink)')};">\${doneCount}/2</td>
    </tr>\`;
  }).join('');

  document.getElementById('teacherStatusTable').innerHTML = \`
    <table style="width:100%;border-collapse:collapse;font-size:13px;min-width:420px;">
      <thead>
        <tr style="background:var(--cream-2);">
          <th style="text-align:left;padding:10px 12px;font-weight:900;font-size:12px;color:var(--ink-soft);">학생</th>
          <th style="text-align:center;padding:10px 8px;font-weight:900;font-size:12px;color:var(--ink-soft);">🍽️ 영어</th>
          <th style="text-align:center;padding:10px 8px;font-weight:900;font-size:12px;color:var(--ink-soft);">🏃 줄넘기</th>
          <th style="text-align:center;padding:10px 8px;font-weight:900;font-size:12px;color:var(--ink-soft);">완료</th>
        </tr>
      </thead>
      <tbody>\${rows}</tbody>
    </table>
    <div style="font-size:11px;color:var(--tx3);margin-top:8px;">📅 선택된 날짜: <b>\${dateStr}</b></div>
  \`;
}`;

const NEW_STATUS_TABLE = `function renderTeacherStatusTable(dateStr) {
  const showMult = teacherGradeFilter === 3;
  const totalCount = showMult ? 3 : 2;
  const rows = STUDENTS.filter(s => s.grade === teacherGradeFilter).map(s => {
    const acts = studentActivitiesOnDate(s.id, dateStr);
    const eng = acts.has('english') ? '✅' : '❌';
    const jr = acts.has('jumprope') ? '✅' : '❌';
    const mult = acts.has('multiplication') ? '✅' : '❌';
    const doneCount = (acts.has('english') ? 1 : 0) + (acts.has('jumprope') ? 1 : 0) + (showMult && acts.has('multiplication') ? 1 : 0);
    const rowBg = doneCount === totalCount ? 'background:#E8F5E9;' : (doneCount === 0 ? 'background:#FFF3E0;' : '');
    return \`<tr style="\${rowBg}">
      <td style="padding:10px 12px;font-weight:800;border-bottom:1px solid var(--cream-2);">
        <span style="font-size:18px;margin-right:6px;">\${s.emoji}</span>\${s.name}
      </td>
      <td style="text-align:center;padding:10px 8px;font-size:20px;border-bottom:1px solid var(--cream-2);">\${eng}</td>
      \${showMult ? \`<td style="text-align:center;padding:10px 8px;font-size:20px;border-bottom:1px solid var(--cream-2);">\${mult}</td>\` : ''}
      <td style="text-align:center;padding:10px 8px;font-size:20px;border-bottom:1px solid var(--cream-2);">\${jr}</td>
      <td style="text-align:center;padding:10px 8px;font-weight:800;border-bottom:1px solid var(--cream-2);color:\${doneCount === totalCount ? 'var(--green)' : (doneCount === 0 ? 'var(--red)' : 'var(--ink)')};">\${doneCount}/\${totalCount}</td>
    </tr>\`;
  }).join('');

  document.getElementById('teacherStatusTable').innerHTML = \`
    <table style="width:100%;border-collapse:collapse;font-size:13px;min-width:420px;">
      <thead>
        <tr style="background:var(--cream-2);">
          <th style="text-align:left;padding:10px 12px;font-weight:900;font-size:12px;color:var(--ink-soft);">학생</th>
          <th style="text-align:center;padding:10px 8px;font-weight:900;font-size:12px;color:var(--ink-soft);">🍽️ 영어</th>
          \${showMult ? '<th style="text-align:center;padding:10px 8px;font-weight:900;font-size:12px;color:var(--ink-soft);">🧮 구구단</th>' : ''}
          <th style="text-align:center;padding:10px 8px;font-weight:900;font-size:12px;color:var(--ink-soft);">🏃 줄넘기</th>
          <th style="text-align:center;padding:10px 8px;font-weight:900;font-size:12px;color:var(--ink-soft);">완료</th>
        </tr>
      </thead>
      <tbody>\${rows}</tbody>
    </table>
    <div style="font-size:11px;color:var(--tx3);margin-top:8px;">📅 선택된 날짜: <b>\${dateStr}</b></div>
  \`;
}`;

// -- 5. CSV export: was exporting every grade regardless of who's logged in; scope to teacherGradeFilter --
const OLD_CSV_LOOP = `function exportRecordsCsv() {
  const lines = ['학생명,날짜,시간,활동,단원/단,정답,전체,정답률'];
  STUDENTS.forEach(s => {`;
const NEW_CSV_LOOP = `function exportRecordsCsv() {
  const lines = ['학생명,날짜,시간,활동,단원/단,정답,전체,정답률'];
  STUDENTS.filter(s => s.grade === teacherGradeFilter).forEach(s => {`;

const OLD_CSV_FILENAME = `  a.download = \`마동초3학년_학습기록_\${todayStr()}.csv\`;`;
const NEW_CSV_FILENAME = `  a.download = \`마동초\${teacherGradeFilter}학년_학습기록_\${todayStr()}.csv\`;`;

module.exports = function teacherLoginAndDashboard(html, ctx) {
  html = mustReplace(html, OLD_PW_STATE, NEW_PW_STATE, '05: teacher password state + login buttons');
  html = mustReplace(html, OLD_PW_DISPLAY, NEW_PW_DISPLAY, '05: teacher pw display');
  html = mustReplace(html, OLD_PW_SAVE, NEW_PW_SAVE, '05: teacher pw save');
  html = mustReplace(html, OLD_RESET_CALL, NEW_RESET_CALL, '05: grade-scoped reset');
  html = mustReplace(html, OLD_STATUS_TABLE, NEW_STATUS_TABLE, '05: status table mult column');
  html = mustReplace(html, OLD_CSV_LOOP, NEW_CSV_LOOP, '05: csv grade scope');
  html = mustReplace(html, OLD_CSV_FILENAME, NEW_CSV_FILENAME, '05: csv filename');
  return html;
};
