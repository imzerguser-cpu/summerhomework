'use strict';
const { mustReplace } = require('../lib/extract');

const OLD_SHOW_SCREEN = `function showScreen(id) {
  ['screen-students', 'screen-student-login', 'screen-teacher-login', 'screen-teacher',
   'screen-menu', 'screen-english',
   'screen-jumprope', 'screen-records', 'screen-class'].forEach(s => {
    document.getElementById(s).classList.toggle('hidden', s !== id);
  });
  const isTeacherView = (id === 'screen-teacher' || id === 'screen-teacher-login');
  const isEntryView = (id === 'screen-students' || id === 'screen-student-login' || id === 'screen-teacher-login');
  document.getElementById('menuBtn').classList.toggle('hidden',
    isEntryView || id === 'screen-menu' || isTeacherView || id === 'screen-class');
  document.getElementById('homeBtn').classList.toggle('hidden', id === 'screen-students');
  document.getElementById('currentStudent').classList.toggle('hidden', !currentStudent && !isTeacherView);
  if (isTeacherView && id === 'screen-teacher') {
    document.getElementById('currentStudent').textContent = '👨‍🏫 선생님';
    document.getElementById('currentStudent').classList.remove('hidden');
  } else if (id === 'screen-teacher-login' || id === 'screen-student-login') {
    document.getElementById('currentStudent').classList.add('hidden');
  }
  window.scrollTo(0, 0);
  if (id === 'screen-menu') updateMenuCardsForGrade();
}`;

const NEW_SHOW_SCREEN = `function showScreen(id) {
  ['screen-students', 'screen-student-login', 'screen-teacher-login', 'screen-teacher',
   'screen-admin-login', 'screen-admin',
   'screen-menu', 'screen-english', 'screen-mult',
   'screen-jumprope', 'screen-records', 'screen-class'].forEach(s => {
    document.getElementById(s).classList.toggle('hidden', s !== id);
  });
  const isTeacherView = (id === 'screen-teacher' || id === 'screen-teacher-login');
  const isAdminView = (id === 'screen-admin' || id === 'screen-admin-login');
  const isEntryView = (id === 'screen-students' || id === 'screen-student-login' || id === 'screen-teacher-login' || id === 'screen-admin-login');
  document.getElementById('menuBtn').classList.toggle('hidden',
    isEntryView || id === 'screen-menu' || isTeacherView || isAdminView || id === 'screen-class');
  document.getElementById('homeBtn').classList.toggle('hidden', id === 'screen-students');
  document.getElementById('currentStudent').classList.toggle('hidden', !currentStudent && !isTeacherView && !isAdminView);
  if (isTeacherView && id === 'screen-teacher') {
    document.getElementById('currentStudent').textContent = '👨‍🏫 ' + teacherGradeFilter + '학년 선생님';
    document.getElementById('currentStudent').classList.remove('hidden');
  } else if (isAdminView && id === 'screen-admin') {
    document.getElementById('currentStudent').textContent = '🔐 전체 관리자';
    document.getElementById('currentStudent').classList.remove('hidden');
  } else if (id === 'screen-teacher-login' || id === 'screen-student-login' || id === 'screen-admin-login') {
    document.getElementById('currentStudent').classList.add('hidden');
  }
  window.scrollTo(0, 0);
  if (id === 'screen-menu') updateMenuCardsForGrade();
}`;

// homeBtn ("👥 처음") must also work correctly from screen-admin / screen-mult, which it already
// does since it unconditionally resets currentStudent + calls renderGradePick()/showScreen. No
// change needed to its body — this transform only extends the header-button visibility logic
// above and the menuBtn handler's "was I inside an activity" check below to include screen-mult,
// so the same after-activity homework-check flow that already runs for English/jump rope also
// runs after 구구단.
const OLD_MENU_BTN_HANDLER = `document.getElementById('menuBtn').addEventListener('click', () => {
  stopAllAudio(); stopRecognition();
  const wasInActivity = ['screen-english','screen-jumprope'].some(s => !document.getElementById(s).classList.contains('hidden'));
  showScreen('screen-menu');
  if (wasInActivity && currentStudent) {
    setTimeout(checkHomeworkAfterActivity, 500);
  }
});`;
const NEW_MENU_BTN_HANDLER = `document.getElementById('menuBtn').addEventListener('click', () => {
  stopAllAudio(); stopRecognition();
  const wasInActivity = ['screen-english','screen-jumprope','screen-mult'].some(s => !document.getElementById(s).classList.contains('hidden'));
  showScreen('screen-menu');
  if (wasInActivity && currentStudent) {
    setTimeout(checkHomeworkAfterActivity, 500);
  }
});`;

// The English quiz's own internal grade-picker screen ("← 학년 다시 선택"-style back button
// inside the iframe) is already suppressed by the gradeOverride bootstrap from Task 4
// (`_gb.style.display='none'`) for every grade, 3/4/5/6 alike — nothing to change here, just
// documenting it as verified rather than leaving it as an unchecked assumption.

module.exports = function navigation(html, ctx) {
  html = mustReplace(html, OLD_SHOW_SCREEN, NEW_SHOW_SCREEN, '08: showScreen allow-list');
  html = mustReplace(html, OLD_MENU_BTN_HANDLER, NEW_MENU_BTN_HANDLER, '08: menuBtn after-activity check');
  return html;
};
