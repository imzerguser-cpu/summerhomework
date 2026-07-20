'use strict';
const { mustReplace } = require('../lib/extract');

// 사용자 요청: 3~6학년 선생님 로그인 버튼 4개가 한 줄에 들어가도록 글씨 크기를 줄임.
const grades = [3, 4, 5, 6];
const OLD_LINES = grades.map(g =>
  `<button class="navbtn" id="teacherLoginBtn${g}" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 ${g}학년 선생님 로그인</button>`
);
const NEW_LINES = grades.map(g =>
  `<button class="navbtn" id="teacherLoginBtn${g}" style="background:var(--navy);color:#fff;padding:8px 12px;font-size:11px;">🔑 ${g}학년 선생님 로그인</button>`
);

module.exports = function shrinkTeacherLoginButtons(html, ctx) {
  for (let i = 0; i < grades.length; i++) {
    html = mustReplace(html, OLD_LINES[i], NEW_LINES[i], `12: shrink teacherLoginBtn${grades[i]}`);
  }
  return html;
};
