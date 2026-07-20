'use strict';
const { mustReplace, extractBetween } = require('../lib/extract');

const OLD_LOAD_FRAME = `var _engQuizUrl = null;
var _engQuizGrade = undefined;
function loadEngQuizFrame(gradeOverride){
  var fr = document.getElementById('engQuizFrame');
  if(!fr) return;
  if(_engQuizUrl && _engQuizGrade === gradeOverride) return;
  var tpl = document.getElementById('quizDocTemplate');
  if(!tpl) return;`;

const NEW_LOAD_FRAME = `var _engQuizUrl = null;
var _engQuizGrade = undefined;
function loadEngQuizFrame(gradeOverride){
  var fr = document.getElementById('engQuizFrame');
  if(!fr) return;
  if(_engQuizUrl && _engQuizGrade === gradeOverride) return;
  var tplId = (gradeOverride === '3' || gradeOverride === '4') ? 'quizDocTemplate34' : 'quizDocTemplate56';
  var tpl = document.getElementById(tplId);
  if(!tpl) return;`;

const OLD_TEMPLATE_TAG = `<script type="text/html" id="quizDocTemplate">`;

module.exports = function englishEngineRouting(html, ctx) {
  // 1. Extract 엔진 A (3·4학년) verbatim from the pre-merge 3학년 file.
  const engineA = extractBetween(
    ctx.src3,
    OLD_TEMPLATE_TAG,
    `</script>`,
    '04: engine A template extraction'
  );

  // 2. Insert engine A as its own template, immediately before the existing (untouched) 엔진 B
  //    template, and rename 엔진 B's id from quizDocTemplate -> quizDocTemplate56. This never
  //    touches engine B's multi-MB body, only the opening tag string.
  html = mustReplace(
    html,
    OLD_TEMPLATE_TAG,
    `<script type="text/html" id="quizDocTemplate34">${engineA}</script>\n<script type="text/html" id="quizDocTemplate56">`,
    '04: insert engine A + rename engine B template'
  );

  // 3. Route loadEngQuizFrame() to the correct template by grade.
  html = mustReplace(html, OLD_LOAD_FRAME, NEW_LOAD_FRAME, '04: loadEngQuizFrame routing');

  return html;
};
