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

// Task 6: admin
check('screen-admin-login present', html.includes('id="screen-admin-login"'));
check('screen-admin present', html.includes('id="screen-admin"'));
check('mado_admin_password ref present', html.includes(`db.ref('mado_admin_password')`));
check('admin has no activity-dashboard ids (password-only scope)', !/id="adminTeacherStatusTable"|id="adminOverallTable"|id="adminStreakTable"/.test(html));
check('renderAdminTeacherPwTable defined', html.includes('function renderAdminTeacherPwTable()'));
check('renderAdminStudentPwTable defined', html.includes('function renderAdminStudentPwTable()'));
check('adminSaveTeacherPw defined', html.includes('function adminSaveTeacherPw(grade)'));
check('adminSaveStudentPw defined', html.includes('function adminSaveStudentPw(sid)'));

// Task 7: class ranking tabs
check('4 classGradeTab buttons present', [3, 4, 5, 6].every(g => html.includes(`id="classGradeTab${g}"`)));
check('classMultPanel present and starts hidden', /class="rank-panel hidden" id="classMultPanel"/.test(html));
check('styleGradeTabs covers 4 grades', html.includes('[3,4,5,6].forEach(g => {') );
check('renderClassRanking computes multSess', html.includes('if (entry.activity === \'multiplication\') { multSess++; multDays.add(date); }'));

// Task 8: navigation
check('showScreen allow-list includes screen-mult', /\[\s*'screen-students'[\s\S]{0,300}'screen-mult'/.test(html));
check('showScreen allow-list includes screen-admin-login and screen-admin', html.includes(`'screen-admin-login', 'screen-admin',`));
check('menuBtn after-activity check includes screen-mult', html.includes(`['screen-english','screen-jumprope','screen-mult'].some`));
check('teacher header shows own grade', html.includes(`'👨‍🏫 ' + teacherGradeFilter + '학년 선생님'`));
check('admin header shows admin label', html.includes(`'🔐 전체 관리자'`));

// Task 8b: grade-aware homework completion check (fixes review finding: 구구단 was silently excluded for 3학년)
check('renderTodayStatus includes 구구단 conditionally for grade 3', html.includes(`...(currentStudent.grade === 3 ? [{key: 'multiplication', label: '구구단', emoji: '🧮'}] : [])`));
check('showTodayHomeworkPopup includes 구구단 conditionally for grade 3', html.includes(`...(currentStudent.grade === 3 ? [{key: 'multiplication', label: '맛있는 구구단', emoji: '🧮'}] : [])`));
check('showTodayHomeworkPopup uses dynamic item count, not hardcoded 2', html.includes('if (doneCount === items.length) {') && !html.includes('if (doneCount === 2) {'));
check('checkHomeworkAfterActivity uses grade-aware activityKeys', html.includes(`const activityKeys = ['english', 'jumprope', ...(currentStudent.grade === 3 ? ['multiplication'] : [])];`));

// Task 9 (post-launch fixes): title/branding, 6학년 renumbering, admin default password
check('page title updated', html.includes('<title>마동초 3~6학년 방학숙제 🌻</title>'));
check('header brand updated', html.includes('마동초 3~6학년'));
check('no stray 5·6학년-only title/brand text remains', !html.includes('마동초 5·6학년'));
check('teacher dashboard hero no longer hardcodes 5,6학년', !html.includes('5,6학년 학생들의 학습 현황을 한눈에 확인하세요.'));
check('jump rope header no longer hardcodes 마동초 5,6학년', !html.includes('마동초 5,6학년'));
check('6학년 renumbered starting at 1 (s05 -> no:1)', html.includes(`{id:'s05', no:1, name:'구승현', emoji:'🐯', grade:6}`));
check('6학년 last student renumbered to 15 (s19 -> no:15)', html.includes(`{id:'s19', no:15, name:'최지성', emoji:'🦄', grade:6}`));
check('6학년 default passwords match new numbering', html.includes(`s05: '0101'`) && html.includes(`s19: '1515'`));
check('admin default password is 2026', html.includes(`const ADMIN_PW_DEFAULT = '2026';`));

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log('\nAll checks passed.');
}
