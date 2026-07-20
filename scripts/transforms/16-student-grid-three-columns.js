'use strict';
const { mustReplace } = require('../lib/extract');

// 사용자 요청: 학생 이름 선택 화면을 3명씩 한 줄로 정리 (4학년=3줄, 6학년=5줄로 깔끔하게 나눠짐).
// .student-grid 클래스는 학년 선택 화면(#gradePickGrid)과도 공유되므로, 이름 목록 컨테이너인
// #studentGrid에만 더 구체적인(specificity 높은) 규칙을 추가해서 학년 선택 화면 레이아웃은
// 건드리지 않음.
const OLD_CSS = `.student-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px;margin-top:8px;}`;
const NEW_CSS = `.student-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px;margin-top:8px;}
#studentGrid{grid-template-columns:repeat(3,1fr);}`;

module.exports = function studentGridThreeColumns(html, ctx) {
  html = mustReplace(html, OLD_CSS, NEW_CSS, '16: #studentGrid fixed 3 columns');
  return html;
};
