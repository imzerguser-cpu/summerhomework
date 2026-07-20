'use strict';
const fs = require('fs');
const path = require('path');

const target = process.argv[2] || path.join(__dirname, '..', 'index.build.html');
const html = fs.readFileSync(target, 'utf8');

let failures = 0;
function check(label, condition) {
  if (condition) {
    console.log('  OK  ' + label);
  } else {
    console.error('FAIL  ' + label);
    failures++;
  }
}

console.log('Verifying', target);

// Task 1: pipeline sanity
check('output is non-empty', html.length > 1000);
check('output still has a closing </html>', html.trim().endsWith('</html>'));

// Task 1: grade picker
check('4 grade buttons present', ['data-grade="3"', 'data-grade="4"', 'data-grade="5"', 'data-grade="6"'].every(s => html.includes(s)));
check('4 teacher login buttons present', [3, 4, 5, 6].every(g => html.includes(`id="teacherLoginBtn${g}"`)));
check('admin login button present', html.includes('id="adminLoginBtn"'));

// Task 2: students + firebase data layer
{
  const idMatches = [...html.matchAll(/\{id:'([^']+)',\s*no:\d+,\s*name:'[^']+',\s*emoji:'[^']+',\s*grade:(\d)\}/g)];
  check('STUDENTS has 33 entries', idMatches.length === 33);
  const ids = idMatches.map(m => m[1]);
  check('all student ids unique', new Set(ids).size === ids.length);
  const byGrade = { 3: 0, 4: 0, 5: 0, 6: 0 };
  idMatches.forEach(m => { byGrade[m[2]]++; });
  check('5 grade-3 students', byGrade[3] === 5);
  check('9 grade-4 students', byGrade[4] === 9);
  check('4 grade-5 students', byGrade[5] === 4);
  check('15 grade-6 students', byGrade[6] === 15);
}
check('mado3_records ref present', html.includes(`db.ref('mado3_records')`));
check('mado4_records ref present', html.includes(`db.ref('mado4_records')`));
check('mado3_passwords ref present', html.includes(`db.ref('mado3_passwords')`));
check('mado4_passwords ref present', html.includes(`db.ref('mado4_passwords')`));
check('mado56_records still shared', (html.match(/db\.ref\('mado56_records'\)/g) || []).length === 2);
check('resetAllRecordsForGrade defined', html.includes('function resetAllRecordsForGrade(grade)'));
check('old single recordsRef/passwordsRef removed', !/const recordsRef = db\.ref/.test(html) && !/const passwordsRef = db\.ref/.test(html));
check('no remaining bare passwordsRef usages', !/\bpasswordsRef\b(?!ForStudent)/.test(html));
// NOTE: one bare `recordsRef` usage deliberately remains after Task 2 — the teacher
// dashboard's "전체 초기화" button (recordsRef.remove()) is patched by Task 5's
// OLD_RESET_CALL/NEW_RESET_CALL transform (-> resetAllRecordsForGrade(teacherGradeFilter)),
// not here. Task 5 adds the corresponding "no remaining bare recordsRef usages" check.

// Task 3: multiplication module
check('screen-mult present', html.includes('id="screen-mult"'));
check('multActivityCard present and starts hidden', html.includes('id="multActivityCard"') && /class="activitycard mult hidden" id="multActivityCard"/.test(html));
check('startMultiplication defined (ported from MAIN ACTIVITY ENTRY POINTS, not the module section)', html.includes(`function startMultiplication() {\n  document.getElementById('mult-home').classList.remove('hidden');`));
check('updateMenuCardsForGrade defined', html.includes('function updateMenuCardsForGrade()'));
check('mult CSS present', html.includes('.activitycard.mult::before'));

// Task 4: dual English engine routing
check('quizDocTemplate34 present', html.includes('id="quizDocTemplate34"'));
check('quizDocTemplate56 present (renamed)', html.includes('id="quizDocTemplate56"'));
check('old bare quizDocTemplate id gone', !html.includes('id="quizDocTemplate"'));
check('loadEngQuizFrame routes by grade', html.includes(`var tplId = (gradeOverride === '3' || gradeOverride === '4') ? 'quizDocTemplate34' : 'quizDocTemplate56';`));
{
  const engineAStart = html.indexOf('id="quizDocTemplate34"');
  const engineAEnd = html.indexOf('</script>', engineAStart);
  const engineAChunk = html.slice(engineAStart, engineAEnd);
  check('engine A chunk contains grade-3/4 bootstrap targets', engineAChunk.includes("showScreen('grade');") && engineAChunk.includes('id="gradeBtn"'));
}

// Task 5: teacher login + dashboard
check('teacherPasswords object present', html.includes('let teacherPasswords = { ...TEACHER_PW_DEFAULTS };'));
check('TEACHER_PW_DEFAULTS has all 4 grades at correct values', html.includes(`const TEACHER_PW_DEFAULTS = { 3: '260301', 4: '2026', 5: '2026', 6: '2026' };`));
check('4 per-grade teacher password Firebase listeners wired', html.includes(`db.ref('mado' + g + '_teacher_password')`));
check('old single teacherPassword variable removed', !/let teacherPassword = DEFAULT_TEACHER_PASSWORD/.test(html));
check('resetAllRecordsForGrade wired into reset button', html.includes('resetAllRecordsForGrade(teacherGradeFilter).then(() => {'));
check('no remaining bare recordsRef usages', !/\brecordsRef\b(?!ForStudent)/.test(html));
check('status table has grade-3-only 구구단 column logic', html.includes('const showMult = teacherGradeFilter === 3;'));
check('CSV export scoped to teacherGradeFilter', html.includes('STUDENTS.filter(s => s.grade === teacherGradeFilter).forEach(s => {'));

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log('\nAll checks passed.');
}
