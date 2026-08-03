'use strict';
const { mustReplace } = require('../lib/extract');

// 버그 수정: Task 3에서 구구단(MULTIPLICATION MODULE)을 이식할 때 JS/HTML은 옮겨졌지만,
// 원본 3학년 사이트의 <style> 블록 안에 있던 "/* Multiplication styles */" CSS 구획
// (.question/.answer-box 상태/.keypad/.key/.tablegrid/.tablecard/.wronglist 등)은
// MULTIPLICATION MODULE의 JS 주석 경계 밖(스타일시트 상단)에 있어서 함께 추출되지
// 못했음. 그 결과 카드/키패드가 렌더링은 되지만 스타일이 하나도 안 입혀진 채로
// 보이고 있었음(HTML은 있는데 CSS가 없는 상태) — Task 3/18과 같은 종류의
// "모듈 경계 밖 코드 누락" 실수.
const OLD_ANCHOR = `.saved-badge{background:var(--green);color:var(--white);border-radius:14px;padding:8px 14px;font-size:12.5px;font-weight:700;margin-bottom:14px;display:inline-block;}`;

const MULT_CSS = `
/* Multiplication styles */
.question{display:flex;align-items:center;justify-content:center;gap:8px;margin:10px 0 16px;flex-wrap:wrap;}
.answer-box.empty{color:var(--ink-soft);opacity:0.5;}
.answer-box.filled{background:var(--mustard);color:var(--ink);}
.answer-box.wrong{background:rgba(255,107,74,0.15);color:var(--coral-dark);}
.op{font-family:'Fredoka',sans-serif;font-size:26px;color:var(--ink-soft);}
.keypad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:100%;max-width:280px;margin:8px auto 4px;}
.key{background:var(--white);border:2px solid var(--cream-2);border-radius:14px;padding:14px 0;font-family:'Fredoka',sans-serif;font-size:22px;font-weight:700;color:var(--ink);cursor:pointer;transition:transform .1s;}
.key:active{transform:scale(0.94);}
.key.action{font-size:12px;font-weight:800;font-family:'Nunito',sans-serif;background:var(--cream-2);}
.key.submit{background:var(--coral);color:var(--white);border-color:var(--coral);font-size:15px;}
.key.submit:hover{background:var(--coral-dark);}
.key[disabled]{opacity:0.4;cursor:not-allowed;}
.divider{font-size:11px;color:var(--ink-soft);text-align:center;margin-top:8px;font-weight:600;}
.tablegrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px;margin-top:14px;}
.tablecard{background:var(--white);border-radius:18px;padding:14px 10px;text-align:center;box-shadow:var(--shadow-sm);cursor:pointer;transition:transform .12s;border:none;font-family:inherit;}
.tablecard:hover{transform:translateY(-2px);box-shadow:var(--shadow);}
.tablecard:active{transform:scale(0.96);}
.tablecard .big{width:52px;height:52px;border-radius:14px;color:var(--white);font-family:'Fredoka',sans-serif;font-size:24px;font-weight:700;display:flex;align-items:center;justify-content:center;margin:0 auto 8px;}
.tablecard .label{font-family:'Jua',sans-serif;font-size:14px;color:var(--ink);}
.wronglist{background:var(--cream);border-radius:16px;padding:12px 14px;margin:0 0 18px;text-align:left;}
.wronglist h4{font-family:'Jua',sans-serif;font-size:13px;color:var(--coral-dark);margin-bottom:8px;}
.wronglist ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:4px;}
.wronglist li{font-family:'Fredoka',sans-serif;font-size:14px;color:var(--ink);display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed var(--cream-2);}
.wronglist li:last-child{border-bottom:none;}
.wronglist li .wanted{color:var(--green-dark);font-weight:600;}
.wronglist li .yours{color:var(--coral-dark);font-weight:600;text-decoration:line-through;}`;
// NOTE: .num-box/.answer-box base rule, .float-badge, and @keyframes floatUp are already
// present in the merged file (shared with the English quiz module), so they're intentionally
// NOT duplicated here.

module.exports = function restoreMultCss(html, ctx) {
  html = mustReplace(html, OLD_ANCHOR, OLD_ANCHOR + MULT_CSS, '19: restore missing multiplication-specific CSS');
  return html;
};
