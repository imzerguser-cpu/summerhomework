'use strict';
const { mustReplace } = require('../lib/extract');

// 사용자 요청: 글씨 크기를 줄이는 대신 "로그인" 글자를 빼서 4개 버튼이 한 줄에 들어가도록 함
// (원래 폰트 크기/여백은 그대로 유지).
const grades = [3, 4, 5, 6];
const OLD_LINES = grades.map(g =>
  `<button class="navbtn" id="teacherLoginBtn${g}" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 ${g}학년 선생님 로그인</button>`
);
const NEW_LINES = grades.map(g =>
  `<button class="navbtn" id="teacherLoginBtn${g}" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 ${g}학년 선생님</button>`
);

module.exports = function shortenTeacherLoginButtons(html, ctx) {
  for (let i = 0; i < grades.length; i++) {
    html = mustReplace(html, OLD_LINES[i], NEW_LINES[i], `12: shorten teacherLoginBtn${grades[i]}`);
  }
  return html;
};
