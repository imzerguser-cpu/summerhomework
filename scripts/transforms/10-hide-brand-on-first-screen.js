'use strict';
const { mustReplace } = require('../lib/extract');

// 사용자 요청: 처음(학년 선택) 화면에서는 상단 "🌻 마동초 3~6학년" 배지를 숨김.
// 다른 화면(메뉴/선생님/관리자 등)에서는 계속 보이도록 유지.
const OLD_BRAND_DIV = `<div class="brand"><span class="plate">🌻</span> 마동초 3~6학년</div>`;
const NEW_BRAND_DIV = `<div class="brand hidden" id="brandLabel"><span class="plate">🌻</span> 마동초 3~6학년</div>`;

const OLD_HOMEBTN_TOGGLE = `document.getElementById('homeBtn').classList.toggle('hidden', id === 'screen-students');`;
const NEW_HOMEBTN_TOGGLE = `document.getElementById('homeBtn').classList.toggle('hidden', id === 'screen-students');
  document.getElementById('brandLabel').classList.toggle('hidden', id === 'screen-students');`;

module.exports = function hideBrandOnFirstScreen(html, ctx) {
  html = mustReplace(html, OLD_BRAND_DIV, NEW_BRAND_DIV, '10: give brand div an id + start hidden');
  html = mustReplace(html, OLD_HOMEBTN_TOGGLE, NEW_HOMEBTN_TOGGLE, '10: hide brand on screen-students');
  return html;
};
