'use strict';
const { mustReplace } = require('../lib/extract');

const OLD_BLOCK = `<h1 id="studentsHeroTitle">여름방학 학습장<br>학년을 선택하세요! ✨</h1>
      <p id="studentsHeroSub">5학년과 6학년 중 하나를 골라주세요.</p>
    </div>
    <div class="student-grid" id="gradePickGrid">
      <button class="studentcard" data-grade="5">
        <div class="avatar">5️⃣</div>
        <div class="name">5학년</div>
      </button>
      <button class="studentcard" data-grade="6">
        <div class="avatar">6️⃣</div>
        <div class="name">6학년</div>
      </button>
    </div>
    <div id="studentPickWrap" class="hidden">
      <button class="navbtn" id="backToGradeBtn" style="margin-bottom:14px;">← 학년 다시 선택</button>
      <div class="student-grid" id="studentGrid"></div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:24px;">
      <button class="navbtn" id="publicClassBtn" style="background:var(--sky);color:#fff;padding:12px 24px;font-size:14px;">👥 반 친구들 기록 보기</button>
      <button class="navbtn" id="teacherLoginBtn5" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 5학년 선생님 로그인</button>
      <button class="navbtn" id="teacherLoginBtn6" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 6학년 선생님 로그인</button>
    </div>
  </div>`;

const NEW_BLOCK = `<h1 id="studentsHeroTitle">여름방학 학습장<br>학년을 선택하세요! ✨</h1>
      <p id="studentsHeroSub">3·4·5·6학년 중 하나를 골라주세요.</p>
    </div>
    <div class="student-grid" id="gradePickGrid">
      <button class="studentcard" data-grade="3">
        <div class="avatar">3️⃣</div>
        <div class="name">3학년</div>
      </button>
      <button class="studentcard" data-grade="4">
        <div class="avatar">4️⃣</div>
        <div class="name">4학년</div>
      </button>
      <button class="studentcard" data-grade="5">
        <div class="avatar">5️⃣</div>
        <div class="name">5학년</div>
      </button>
      <button class="studentcard" data-grade="6">
        <div class="avatar">6️⃣</div>
        <div class="name">6학년</div>
      </button>
    </div>
    <div id="studentPickWrap" class="hidden">
      <button class="navbtn" id="backToGradeBtn" style="margin-bottom:14px;">← 학년 다시 선택</button>
      <div class="student-grid" id="studentGrid"></div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:24px;">
      <button class="navbtn" id="publicClassBtn" style="background:var(--sky);color:#fff;padding:12px 24px;font-size:14px;">👥 반 친구들 기록 보기</button>
      <button class="navbtn" id="teacherLoginBtn3" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 3학년 선생님 로그인</button>
      <button class="navbtn" id="teacherLoginBtn4" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 4학년 선생님 로그인</button>
      <button class="navbtn" id="teacherLoginBtn5" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 5학년 선생님 로그인</button>
      <button class="navbtn" id="teacherLoginBtn6" style="background:var(--navy);color:#fff;padding:12px 24px;font-size:14px;">🔑 6학년 선생님 로그인</button>
    </div>
    <div style="text-align:center;margin-top:10px;">
      <button class="navbtn" id="adminLoginBtn" style="background:transparent;color:var(--ink-soft);padding:6px 14px;font-size:11px;border:1px solid var(--cream-2);">🔐 전체 관리자</button>
    </div>
  </div>`;

module.exports = function gradePicker(html, ctx) {
  html = mustReplace(html, OLD_BLOCK, NEW_BLOCK, '01-grade-picker: screen-students block');
  return html;
};
