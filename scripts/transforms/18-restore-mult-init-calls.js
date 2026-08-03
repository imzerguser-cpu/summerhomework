'use strict';
const { mustReplace } = require('../lib/extract');

// 버그 수정: Task 3에서 구구단(MULTIPLICATION MODULE) 섹션을 이식할 때 함수 정의
// (renderMultHome, initMultSpeech)는 옮겨졌지만, 원본 3학년 사이트의 INITIALIZATION
// 블록에서 그 두 함수를 "호출"하는 코드는 옮겨지지 않았음 (startMultiplication()과
// 똑같은 종류의 실수 — 모듈 경계 밖에 있는 코드). 그 결과 renderMultHome()이 한 번도
// 실행되지 않아 #multTableGrid/#multRandomList가 항상 비어 있었고, 3학년 학생이
// "맛있는 구구단"에 들어가도 2단~9단 선택 카드가 하나도 안 보이는 상태였음.
const OLD_INIT = `================================================================ */
renderGradePick();
showScreen('screen-students');`;
const NEW_INIT = `================================================================ */
renderGradePick();
renderMultHome();
initMultSpeech();
showScreen('screen-students');`;

module.exports = function restoreMultInitCalls(html, ctx) {
  html = mustReplace(html, OLD_INIT, NEW_INIT, '18: call renderMultHome/initMultSpeech at init');
  return html;
};
