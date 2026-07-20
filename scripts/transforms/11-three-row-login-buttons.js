'use strict';
const { mustReplace } = require('../lib/extract');

// 사용자 요청: 처음 화면 하단 버튼들을 3줄로 명확히 분리.
// 1줄: 반 친구들 기록 보기 / 2줄: 3~6학년 선생님 로그인 4개 / 3줄: 전체 관리자
// (기존엔 한 flex 컨테이너에 5개 버튼이 같이 있어서 화면 너비에 따라 줄바꿈 위치가 들쭉날쭉했음)
const OLD_BUTTON_ROWS = `<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:24px;">
      <button class="navbtn" id="publicClassBtn" style="background:var(--sky);color:#fff;padding:12px 24px;font-size:14px;">👥 반 친구들 기록 보기</button>
      <button class="navbtn" id="teacherLoginBtn3" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 3학년 선생님 로그인</button>
      <button class="navbtn" id="teacherLoginBtn4" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 4학년 선생님 로그인</button>
      <button class="navbtn" id="teacherLoginBtn5" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 5학년 선생님 로그인</button>
      <button class="navbtn" id="teacherLoginBtn6" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 6학년 선생님 로그인</button>
    </div>
    <div style="text-align:center;margin-top:10px;">
      <button class="navbtn" id="adminLoginBtn" style="background:transparent;color:var(--ink-soft);padding:6px 14px;`;

const NEW_BUTTON_ROWS = `<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:24px;">
      <button class="navbtn" id="publicClassBtn" style="background:var(--sky);color:#fff;padding:12px 24px;font-size:14px;">👥 반 친구들 기록 보기</button>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:10px;">
      <button class="navbtn" id="teacherLoginBtn3" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 3학년 선생님 로그인</button>
      <button class="navbtn" id="teacherLoginBtn4" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 4학년 선생님 로그인</button>
      <button class="navbtn" id="teacherLoginBtn5" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 5학년 선생님 로그인</button>
      <button class="navbtn" id="teacherLoginBtn6" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 6학년 선생님 로그인</button>
    </div>
    <div style="text-align:center;margin-top:10px;">
      <button class="navbtn" id="adminLoginBtn" style="background:transparent;color:var(--ink-soft);padding:6px 14px;`;

module.exports = function threeRowLoginButtons(html, ctx) {
  html = mustReplace(html, OLD_BUTTON_ROWS, NEW_BUTTON_ROWS, '11: split login buttons into 3 explicit rows');
  return html;
};
