'use strict';
const { mustReplace } = require('../lib/extract');

// 사용자 요청: 학년마다 한 줄에 보이는 인원수를 다르게.
// 3학년(5명)·5학년(4명)은 한 줄에 다 들어가도록, 4학년(9명)·6학년(15명)은 기존처럼 3명씩.
const OLD_RENDER = `function renderStudents() {
  const grid = document.getElementById('studentGrid');
  grid.innerHTML = '';`;
const NEW_RENDER = `function renderStudents() {
  const grid = document.getElementById('studentGrid');
  grid.innerHTML = '';
  const STUDENT_GRID_COLS = {3: 5, 4: 3, 5: 4, 6: 3};
  grid.style.gridTemplateColumns = \`repeat(\${STUDENT_GRID_COLS[selectedGrade] || 3}, 1fr)\`;`;

module.exports = function perGradeStudentGridColumns(html, ctx) {
  html = mustReplace(html, OLD_RENDER, NEW_RENDER, '17: per-grade student grid column count');
  return html;
};
