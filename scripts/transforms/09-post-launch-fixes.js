'use strict';
const { mustReplace } = require('../lib/extract');

// 1. Page title + on-screen branding: was still 5·6학년-specific text left over from the
//    merge base; also caught two other visible (not dead-code) "5,6학년"-only leftovers that
//    are now wrong for every 3/4학년 teacher/student — the teacher-dashboard hero (the actual
//    grade is already shown correctly right below via teacherGradeIndicator, so this line is
//    both wrong and redundant) and the jump-rope screen header.
const OLD_TITLE = `<title>마동초 5·6학년 방학 학습장 🌻</title>`;
const NEW_TITLE = `<title>마동초 3~6학년 방학숙제 🌻</title>`;

const OLD_BRAND = `<div class="brand"><span class="plate">🌻</span> 마동초 5·6학년</div>`;
const NEW_BRAND = `<div class="brand"><span class="plate">🌻</span> 마동초 3~6학년</div>`;

const OLD_TEACHER_HERO = `      <h1>선생님 대시보드 📊</h1>
      <p>5,6학년 학생들의 학습 현황을 한눈에 확인하세요.</p>`;
const NEW_TEACHER_HERO = `      <h1>선생님 대시보드 📊</h1>
      <p>학생들의 학습 현황을 한눈에 확인하세요.</p>`;

const OLD_JR_HEADER = `<div class="jr-hd-sub">2026학년도 · 마동초 5,6학년</div>`;
const NEW_JR_HEADER = `<div class="jr-hd-sub">2026학년도 · 마동초 3~6학년</div>`;

// 2. 6학년 번호가 5학년(1~4번) 뒤를 이어 5번부터 시작했던 것을 1번부터 다시 시작하도록 변경.
//    학생 표시 번호(no)는 STUDENTS 배열에서만 나오므로 여기만 고치면 화면 전체에 반영됨.
//    기본 비밀번호(두 자리 번호를 두 번 반복하는 규칙)도 새 번호에 맞게 함께 갱신.
const OLD_G6_STUDENTS = `  {id:'s05', no:5, name:'구승현', emoji:'🐯', grade:6},
  {id:'s06', no:6, name:'구정현', emoji:'🦊', grade:6},
  {id:'s07', no:7, name:'김은혁', emoji:'🐼', grade:6},
  {id:'s08', no:8, name:'민가은', emoji:'🐨', grade:6},
  {id:'s09', no:9, name:'백은유', emoji:'🦁', grade:6},
  {id:'s10', no:10, name:'백채원', emoji:'🐵', grade:6},
  {id:'s11', no:11, name:'원지민', emoji:'🐷', grade:6},
  {id:'s12', no:12, name:'유시우', emoji:'🐸', grade:6},
  {id:'s13', no:13, name:'이시연', emoji:'🐹', grade:6},
  {id:'s14', no:14, name:'이우빈', emoji:'🦉', grade:6},
  {id:'s15', no:15, name:'이태훈', emoji:'🐺', grade:6},
  {id:'s16', no:16, name:'조유라', emoji:'🦋', grade:6},
  {id:'s17', no:17, name:'주현석', emoji:'🐢', grade:6},
  {id:'s18', no:18, name:'김봄', emoji:'🌸', grade:6},
  {id:'s19', no:19, name:'최지성', emoji:'🦄', grade:6},`;
const NEW_G6_STUDENTS = `  {id:'s05', no:1, name:'구승현', emoji:'🐯', grade:6},
  {id:'s06', no:2, name:'구정현', emoji:'🦊', grade:6},
  {id:'s07', no:3, name:'김은혁', emoji:'🐼', grade:6},
  {id:'s08', no:4, name:'민가은', emoji:'🐨', grade:6},
  {id:'s09', no:5, name:'백은유', emoji:'🦁', grade:6},
  {id:'s10', no:6, name:'백채원', emoji:'🐵', grade:6},
  {id:'s11', no:7, name:'원지민', emoji:'🐷', grade:6},
  {id:'s12', no:8, name:'유시우', emoji:'🐸', grade:6},
  {id:'s13', no:9, name:'이시연', emoji:'🐹', grade:6},
  {id:'s14', no:10, name:'이우빈', emoji:'🦉', grade:6},
  {id:'s15', no:11, name:'이태훈', emoji:'🐺', grade:6},
  {id:'s16', no:12, name:'조유라', emoji:'🦋', grade:6},
  {id:'s17', no:13, name:'주현석', emoji:'🐢', grade:6},
  {id:'s18', no:14, name:'김봄', emoji:'🌸', grade:6},
  {id:'s19', no:15, name:'최지성', emoji:'🦄', grade:6},`;

const OLD_G6_PW = `  s05: '0505',
  s06: '0606',
  s07: '0707',
  s08: '0808',
  s09: '0909',
  s10: '1010',
  s11: '1111',
  s12: '1212',
  s13: '1313',
  s14: '1414',
  s15: '1515',
  s16: '1616',
  s17: '1717',
  s18: '1818',
  s19: '1919',`;
const NEW_G6_PW = `  s05: '0101',
  s06: '0202',
  s07: '0303',
  s08: '0404',
  s09: '0505',
  s10: '0606',
  s11: '0707',
  s12: '0808',
  s13: '0909',
  s14: '1010',
  s15: '1111',
  s16: '1212',
  s17: '1313',
  s18: '1414',
  s19: '1515',`;

// 3. 전체 관리자 기본 비밀번호를 4/5/6학년 담임 기본값과 동일하게 2026으로 통일 (일단).
const OLD_ADMIN_PW = `const ADMIN_PW_DEFAULT = '9999';`;
const NEW_ADMIN_PW = `const ADMIN_PW_DEFAULT = '2026';`;

module.exports = function postLaunchFixes(html, ctx) {
  html = mustReplace(html, OLD_TITLE, NEW_TITLE, '09: page title');
  html = mustReplace(html, OLD_BRAND, NEW_BRAND, '09: header brand');
  html = mustReplace(html, OLD_TEACHER_HERO, NEW_TEACHER_HERO, '09: teacher dashboard hero (was hardcoded 5,6학년)');
  html = mustReplace(html, OLD_JR_HEADER, NEW_JR_HEADER, '09: jump rope header (was hardcoded 5,6학년)');
  html = mustReplace(html, OLD_G6_STUDENTS, NEW_G6_STUDENTS, '09: 6학년 STUDENTS renumber');
  html = mustReplace(html, OLD_G6_PW, NEW_G6_PW, '09: 6학년 DEFAULT_STUDENT_PW renumber');
  html = mustReplace(html, OLD_ADMIN_PW, NEW_ADMIN_PW, '09: admin default password -> 2026');
  return html;
};
