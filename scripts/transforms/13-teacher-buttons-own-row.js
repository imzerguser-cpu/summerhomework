'use strict';
const { mustReplace } = require('../lib/extract');

// 사용자 요청: 3~6학년 선생님 버튼 4개를 명시적으로 2번째 줄에 함께 배치.
// (자연스러운 flex-wrap에만 맡기면 화면 너비에 따라 3개+1개로 갈라짐)
const OLD_ROWS = `<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:24px;">
      <button class="navbtn" id="publicClassBtn" style="background:var(--sky);color:#fff;padding:12px 24px;font-size:14px;">👥 반 친구들 기록 보기</button>
      <button class="navbtn" id="teacherLoginBtn3" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 3학년 선생님</button>
      <button class="navbtn" id="teacherLoginBtn4" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 4학년 선생님</button>
      <button class="navbtn" id="teacherLoginBtn5" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 5학년 선생님</button>
      <button class="navbtn" id="teacherLoginBtn6" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 6학년 선생님</button>
    </div>
    <div style="text-align:center;ma`;

const NEW_ROWS = `<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:24px;">
      <button class="navbtn" id="publicClassBtn" style="background:var(--sky);color:#fff;padding:12px 24px;font-size:14px;">👥 반 친구들 기록 보기</button>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:10px;">
      <button class="navbtn" id="teacherLoginBtn3" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 3학년 선생님</button>
      <button class="navbtn" id="teacherLoginBtn4" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 4학년 선생님</button>
      <button class="navbtn" id="teacherLoginBtn5" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 5학년 선생님</button>
      <button class="navbtn" id="teacherLoginBtn6" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 6학년 선생님</button>
    </div>
    <div style="text-align:center;ma`;

module.exports = function teacherButtonsOwnRow(html, ctx) {
  html = mustReplace(html, OLD_ROWS, NEW_ROWS, '13: put 4 teacher buttons on their own row');
  return html;
};
