'use strict';
const { mustReplace } = require('../lib/extract');

const OLD_STUDENTS_HEADER = `const STUDENTS = [
`;
const NEW_STUDENTS_HEADER = `const STUDENTS = [
  {id:'kim',   no:1, name:'김대현', emoji:'🐻', grade:3},
  {id:'na',    no:2, name:'나대한', emoji:'🐯', grade:3},
  {id:'min',   no:3, name:'민주은', emoji:'🐱', grade:3},
  {id:'baek',  no:4, name:'백은성', emoji:'🐶', grade:3},
  {id:'shin',  no:5, name:'신서희', emoji:'🐰', grade:3},
  {id:'g4_01', no:1, name:'구민준', emoji:'🐨', grade:4},
  {id:'g4_02', no:2, name:'구보람', emoji:'🦁', grade:4},
  {id:'g4_03', no:3, name:'권윤호', emoji:'🐵', grade:4},
  {id:'g4_04', no:4, name:'김다원', emoji:'🐷', grade:4},
  {id:'g4_05', no:5, name:'김연아', emoji:'🐸', grade:4},
  {id:'g4_06', no:6, name:'박누리', emoji:'🐹', grade:4},
  {id:'g4_07', no:7, name:'원지호', emoji:'🦉', grade:4},
  {id:'g4_08', no:8, name:'이건호', emoji:'🐺', grade:4},
  {id:'g4_09', no:9, name:'이도훈', emoji:'🦋', grade:4},
`;

// DEFAULT_STUDENT_PW opens with the s01 entry in index56.html; insert the new grades' defaults right before it.
const OLD_PW_HEADER = `const DEFAULT_STUDENT_PW = {
  s01:`;
const NEW_PW_HEADER = `const DEFAULT_STUDENT_PW = {
  kim: '1111', na: '2222', min: '3333', baek: '4444', shin: '5555',
  g4_01: '0101', g4_02: '0202', g4_03: '0303', g4_04: '0404', g4_05: '0505',
  g4_06: '0606', g4_07: '0707', g4_08: '0808', g4_09: '0909',
  s01:`;

const OLD_FIREBASE_REFS = `const recordsRef = db.ref('mado56_records');   // { studentId: { date: [ {time, activity, ...} ] } }
const jumpRopeRef = db.ref('jumprope_data');   // existing jump rope data
const passwordsRef = db.ref('mado56_passwords'); // { studentId: 'pwString' }`;

const NEW_FIREBASE_REFS = `const RECORDS_REFS = {
  3: db.ref('mado3_records'),
  4: db.ref('mado4_records'),
  5: db.ref('mado56_records'),
  6: db.ref('mado56_records'),
};
const PASSWORDS_REFS = {
  3: db.ref('mado3_passwords'),
  4: db.ref('mado4_passwords'),
  5: db.ref('mado56_passwords'),
  6: db.ref('mado56_passwords'),
};
const jumpRopeRef = db.ref('jumprope_data');   // existing jump rope data, shared by all grades, keyed by student id

function recordsRefForStudent(studentId) {
  const s = STUDENTS.find(x => x.id === studentId);
  return RECORDS_REFS[s.grade];
}
function passwordsRefForStudent(studentId) {
  const s = STUDENTS.find(x => x.id === studentId);
  return PASSWORDS_REFS[s.grade];
}
// Group refs so listeners/resets never touch a grade that shares a ref with a sibling grade.
const RECORD_GROUPS = [
  { grades: [3], ref: RECORDS_REFS[3] },
  { grades: [4], ref: RECORDS_REFS[4] },
  { grades: [5, 6], ref: RECORDS_REFS[5] },
];
const PASSWORD_GROUPS = [
  { grades: [3], ref: PASSWORDS_REFS[3] },
  { grades: [4], ref: PASSWORDS_REFS[4] },
  { grades: [5, 6], ref: PASSWORDS_REFS[5] },
];
function resetAllRecordsForGrade(grade) {
  const ids = STUDENTS.filter(s => s.grade === grade).map(s => s.id);
  return Promise.all(ids.map(id => Promise.all([
    recordsRefForStudent(id).child(id).remove(),
    jumpRopeRef.child(id).remove(),
  ])));
}`;

// Passwords listener: was a single listener over the shared mado56_passwords ref covering ALL
// students. Now one listener per ref-group, each only touching the ids that belong to it — so a
// grade-3/4 listener's "not present in this snapshot" never resets a grade-5/6 student's password
// (and vice versa).
const OLD_PW_LISTENER = `passwordsRef.on('value', (snapshot) => {
  const data = snapshot.val() || {};
  STUDENTS.forEach(s => {
    if (data[s.id]) studentPasswords[s.id] = String(data[s.id]);
    else studentPasswords[s.id] = DEFAULT_STUDENT_PW[s.id];
  });
  // Refresh teacher password table if visible
  if (!document.getElementById('screen-teacher').classList.contains('hidden')) {
    renderTeacherPasswordTable();
  }
});`;
const NEW_PW_LISTENER = `PASSWORD_GROUPS.forEach(group => {
  group.ref.on('value', (snapshot) => {
    const data = snapshot.val() || {};
    STUDENTS.filter(s => group.grades.includes(s.grade)).forEach(s => {
      studentPasswords[s.id] = data[s.id] ? String(data[s.id]) : DEFAULT_STUDENT_PW[s.id];
    });
    if (!document.getElementById('screen-teacher').classList.contains('hidden')) {
      renderTeacherPasswordTable();
    }
    if (!document.getElementById('screen-admin').classList.contains('hidden')) {
      renderAdminStudentPwTable();
    }
  });
});`;

// Records listener: same idea — one listener per ref-group, merging only its own ids into the
// shared client-side allRecords object instead of replacing the whole thing.
const OLD_RECORDS_LISTENER = `recordsRef.on('value', (snapshot) => {
  const data = snapshot.val();
  allRecords = data || {};
  syncStatus = 'online';
  // Re-render current screen if it displays records
  if (!document.getElementById('screen-records').classList.contains('hidden')) {
    renderCalendar();
    renderRecordsChart();
    renderRecordsSummary();
  }
  if (!document.getElementById('screen-class').classList.contains('hidden')) {
    renderClassRanking();
  }
});`;
const NEW_RECORDS_LISTENER = `RECORD_GROUPS.forEach(group => {
  group.ref.on('value', (snapshot) => {
    const data = snapshot.val() || {};
    const ids = new Set(STUDENTS.filter(s => group.grades.includes(s.grade)).map(s => s.id));
    Object.keys(allRecords).forEach(id => { if (ids.has(id)) delete allRecords[id]; });
    Object.assign(allRecords, data);
    syncStatus = 'online';
    if (!document.getElementById('screen-records').classList.contains('hidden')) {
      renderCalendar();
      renderRecordsChart();
      renderRecordsSummary();
    }
    if (!document.getElementById('screen-class').classList.contains('hidden')) {
      renderClassRanking();
    }
  });
});`;

const OLD_SAVE_RECORD_LINE = `  const ref = recordsRef.child(studentId).child(dateStr).push();`;
const NEW_SAVE_RECORD_LINE = `  const ref = recordsRefForStudent(studentId).child(studentId).child(dateStr).push();`;

const OLD_SAVE_PW_LINE = `  passwordsRef.update(update).then(() => {`;
const NEW_SAVE_PW_LINE = `  passwordsRefForStudent(sid).update(update).then(() => {`;

const OLD_TEACHER_RESET_LINE = `  Promise.all([
    recordsRef.remove(),
    jumpRopeRef.remove(),`;
const NEW_TEACHER_RESET_LINE = `  Promise.all([
    ...RECORD_GROUPS.map(group => group.ref.remove()),
    jumpRopeRef.remove(),`;

const OLD_RESET_STUDENT_LINE = `    recordsRef.child(studentId).remove(),`;
const NEW_RESET_STUDENT_LINE = `    recordsRefForStudent(studentId).child(studentId).remove(),`;

// Second listener registered near the bottom of the file, driving generic re-renders.
const OLD_TAIL_LISTENER = `recordsRef.on('value', refreshDynamicViews);
jumpRopeRef.on('value', refreshDynamicViews);`;
const NEW_TAIL_LISTENER = `RECORD_GROUPS.forEach(group => group.ref.on('value', refreshDynamicViews));
jumpRopeRef.on('value', refreshDynamicViews);`;

module.exports = function studentsAndFirebase(html, ctx) {
  html = mustReplace(html, OLD_STUDENTS_HEADER, NEW_STUDENTS_HEADER, '02: STUDENTS header');
  html = mustReplace(html, OLD_PW_HEADER, NEW_PW_HEADER, '02: DEFAULT_STUDENT_PW header');
  html = mustReplace(html, OLD_FIREBASE_REFS, NEW_FIREBASE_REFS, '02: firebase refs');
  html = mustReplace(html, OLD_PW_LISTENER, NEW_PW_LISTENER, '02: passwords listener');
  html = mustReplace(html, OLD_RECORDS_LISTENER, NEW_RECORDS_LISTENER, '02: records listener');
  html = mustReplace(html, OLD_SAVE_RECORD_LINE, NEW_SAVE_RECORD_LINE, '02: saveRecord ref');
  html = mustReplace(html, OLD_SAVE_PW_LINE, NEW_SAVE_PW_LINE, '02: savePw ref');
  html = mustReplace(html, OLD_TEACHER_RESET_LINE, NEW_TEACHER_RESET_LINE, '02: teacher reset ref');
  html = mustReplace(html, OLD_RESET_STUDENT_LINE, NEW_RESET_STUDENT_LINE, '02: resetStudentRecords ref');
  html = mustReplace(html, OLD_TAIL_LISTENER, NEW_TAIL_LISTENER, '02: tail listeners');
  return html;
};
