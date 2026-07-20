'use strict';
const { mustReplace } = require('../lib/extract');

// 사용자 요청: "5학년과 6학년 중 하나를 골라주세요." 문구 제거.
// 이 문구는 renderGradePick()에서 매번(첫 로딩 포함) studentsHeroSub에 다시 씌워지고 있었음 —
// Task 1에서 정적 HTML은 "3·4·5·6학년 중 하나를 골라주세요."로 고쳤지만 이 JS 코드가
// 페이지 로딩 시 즉시 그 위에 옛 5,6학년 전용 문구를 덮어써서 실제로는 계속 잘못된 문구가
// 보이고 있었음. 요청대로 문구 자체를 비움(제거).
const OLD_LINE = `document.getElementById('studentsHeroSub').textContent = '5학년과 6학년 중 하나를 골라주세요.';`;
const NEW_LINE = `document.getElementById('studentsHeroSub').textContent = '';`;

module.exports = function removeGradePickerSubtitle(html, ctx) {
  html = mustReplace(html, OLD_LINE, NEW_LINE, '14: remove grade-picker subtitle text');
  return html;
};
