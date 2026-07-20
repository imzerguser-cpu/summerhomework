'use strict';
const { mustReplace } = require('../lib/extract');

// 사용자 요청: 첫 화면 상단 배지를 다시 원래(항상 보이는) 위치/형태로 되돌리고,
// 글자만 "마동초등학교 3~6학년"으로 변경 (Task 10의 "첫 화면에서 숨김" 처리는
// build.js에서 해당 transform을 완전히 제거해서 되돌림 — 이 파일은 글자만 담당).
const OLD_BRAND = `<div class="brand"><span class="plate">🌻</span> 마동초 3~6학년</div>`;
const NEW_BRAND = `<div class="brand"><span class="plate">🌻</span> 마동초등학교 3~6학년</div>`;

module.exports = function restoreBrandFullName(html, ctx) {
  html = mustReplace(html, OLD_BRAND, NEW_BRAND, '15: brand text -> 마동초등학교 3~6학년');
  return html;
};
