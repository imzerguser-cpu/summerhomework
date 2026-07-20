'use strict';
const { mustReplace } = require('../lib/extract');

const ADMIN_SCREENS_HTML = `
  <!-- SCREEN: Admin login -->
  <div id="screen-admin-login" class="hidden">
    <div class="hero" style="background:linear-gradient(135deg,var(--navy) 0%,var(--navy-g) 100%);">
      <h1>전체 관리자 로그인 🔐</h1>
      <p>비밀번호를 입력하고 전체 학년 비밀번호를 관리하세요.</p>
    </div>
    <div style="background:var(--white);border-radius:22px;padding:24px;box-shadow:var(--shadow-sm);">
      <label style="display:block;font-size:13px;font-weight:800;color:var(--ink-soft);margin-bottom:8px;">비밀번호</label>
      <input type="password" id="adminPwInput" placeholder="비밀번호를 입력하세요" style="width:100%;border:2px solid var(--cream-2);border-radius:14px;padding:14px 16px;font-size:16px;font-family:inherit;outline:none;" autocomplete="current-password">
      <div id="adminPwErr" style="color:var(--red);font-size:12px;font-weight:700;margin-top:8px;display:none;">비밀번호가 틀렸어요.</div>
      <div class="actionrow" style="margin-top:16px;">
        <button class="btn ghost" id="adminLoginCancel">취소</button>
        <button class="btn primary" id="adminLoginSubmit">로그인</button>
      </div>
    </div>
  </div>

  <!-- SCREEN: Admin dashboard (password management only, no activity stats) -->
  <div id="screen-admin" class="hidden">
    <div class="hero" style="background:linear-gradient(135deg,var(--navy) 0%,var(--navy-g) 100%);">
      <h1>전체 관리자 🔐</h1>
      <p>모든 학년의 담임 비밀번호와 학생 비밀번호를 관리하세요.</p>
    </div>
    <div style="background:var(--white);border-radius:20px;padding:18px;box-shadow:var(--shadow-sm);margin-bottom:16px;">
      <div class="records-title" style="margin-bottom:12px;">🔑 학년별 담임 비밀번호</div>
      <div id="adminTeacherPwTable"></div>
    </div>
    <div style="background:var(--white);border-radius:20px;padding:18px;box-shadow:var(--shadow-sm);">
      <div class="records-title" style="margin-bottom:12px;">👥 전체 학생 비밀번호</div>
      <div id="adminStudentPwTable"></div>
    </div>
  </div>
`;

const OLD_WRAP_TAIL = `    </div>
  </div>
</div>
<div id="modalRoot"></div>`;
const NEW_WRAP_TAIL = `    </div>
  </div>
${ADMIN_SCREENS_HTML}</div>
<div id="modalRoot"></div>`;

const ADMIN_JS = `
/* ================================================================
   ADMIN MODULE (all grades, password management only)
================================================================ */
const ADMIN_PW_DEFAULT = '9999';
let adminPassword = ADMIN_PW_DEFAULT;
db.ref('mado_admin_password').on('value', (snapshot) => {
  const val = snapshot.val();
  adminPassword = (val && typeof val === 'string' && val.length > 0) ? String(val) : ADMIN_PW_DEFAULT;
});

document.getElementById('adminLoginBtn').addEventListener('click', () => {
  document.getElementById('adminPwInput').value = '';
  document.getElementById('adminPwErr').style.display = 'none';
  showScreen('screen-admin-login');
  setTimeout(() => { document.getElementById('adminPwInput').focus(); }, 100);
});
document.getElementById('adminLoginCancel').addEventListener('click', () => {
  showScreen('screen-students');
});
function adminTryLogin() {
  const pw = document.getElementById('adminPwInput').value.trim();
  if (pw === adminPassword) {
    document.getElementById('adminPwErr').style.display = 'none';
    openAdminDashboard();
  } else {
    document.getElementById('adminPwErr').style.display = 'block';
    document.getElementById('adminPwInput').value = '';
    document.getElementById('adminPwInput').focus();
  }
}
document.getElementById('adminLoginSubmit').addEventListener('click', adminTryLogin);
document.getElementById('adminPwInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') adminTryLogin();
});

function openAdminDashboard() {
  renderAdminTeacherPwTable();
  renderAdminStudentPwTable();
  showScreen('screen-admin');
}

function renderAdminTeacherPwTable() {
  const rows = [3, 4, 5, 6].map(g => \`
    <div style="display:flex;align-items:center;gap:10px;padding:12px;border-bottom:1px solid var(--cream-2);flex-wrap:wrap;">
      <div style="flex:1;min-width:80px;font-weight:800;font-size:14px;">\${g}학년 담임</div>
      <div style="font-family:monospace;font-weight:900;font-size:16px;color:var(--navy);background:var(--cream-2);padding:8px 14px;border-radius:8px;min-width:100px;text-align:center;">\${teacherPasswords[g]}</div>
      <input type="text" id="adminTeacherPwEdit-\${g}" placeholder="새 비밀번호" style="width:120px;padding:8px 10px;border:2px solid var(--sky);border-radius:8px;font-family:inherit;font-weight:700;font-size:14px;">
      <button class="navbtn" style="background:var(--green);color:#fff;padding:8px 14px;" onclick="adminSaveTeacherPw(\${g})">저장</button>
    </div>\`).join('');
  document.getElementById('adminTeacherPwTable').innerHTML = rows;
}
function adminSaveTeacherPw(grade) {
  const inp = document.getElementById('adminTeacherPwEdit-' + grade);
  const newPw = inp.value.trim();
  if (newPw.length < 4) { alert('비밀번호는 4자 이상이어야 해요.'); return; }
  if (newPw.length > 20) { alert('비밀번호는 20자 이하로 해주세요.'); return; }
  db.ref('mado' + grade + '_teacher_password').set(newPw).then(() => {
    teacherPasswords[grade] = newPw;
    inp.value = '';
    renderAdminTeacherPwTable();
  }).catch(err => alert('저장 실패: ' + err.message));
}

function renderAdminStudentPwTable() {
  const sections = [3, 4, 5, 6].map(g => {
    const studentRows = STUDENTS.filter(s => s.grade === g).map(s => {
      const pw = studentPasswords[s.id] || DEFAULT_STUDENT_PW[s.id];
      return \`<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--cream-2);flex-wrap:wrap;">
        <div style="font-size:20px;">\${s.emoji}</div>
        <div style="flex:1;min-width:80px;font-weight:800;font-size:13px;">\${s.name}</div>
        <div style="font-family:monospace;font-weight:900;font-size:16px;color:var(--navy);background:var(--cream-2);padding:6px 12px;border-radius:8px;min-width:70px;text-align:center;">\${pw}</div>
        <input type="text" id="adminStuPwEdit-\${s.id}" maxlength="4" pattern="[0-9]{4}" placeholder="4자리" style="width:90px;padding:6px 8px;border:2px solid var(--sky);border-radius:8px;font-family:inherit;font-weight:900;font-size:14px;text-align:center;">
        <button class="navbtn" style="background:var(--green);color:#fff;padding:6px 12px;" onclick="adminSaveStudentPw('\${s.id}')">저장</button>
      </div>\`;
    }).join('');
    return \`<div style="margin-bottom:14px;">
      <div style="font-weight:900;font-size:13px;color:var(--ink-soft);margin-bottom:6px;">\${g}학년</div>
      \${studentRows}
    </div>\`;
  }).join('');
  document.getElementById('adminStudentPwTable').innerHTML = sections;
}
function adminSaveStudentPw(sid) {
  const inp = document.getElementById('adminStuPwEdit-' + sid);
  const val = inp.value.trim();
  if (!/^[0-9]{4}$/.test(val)) { alert('비밀번호는 4자리 숫자로 입력해주세요.'); return; }
  passwordsRefForStudent(sid).update({ [sid]: val }).then(() => {
    studentPasswords[sid] = val;
    inp.value = '';
    renderAdminStudentPwTable();
  }).catch(err => alert('저장 실패: ' + err.message));
}
`;

const OLD_INIT_BLOCK = `/* ================================================================
   INITIALIZATION
================================================================ */
renderGradePick();
showScreen('screen-students');`;
const NEW_INIT_BLOCK = `${ADMIN_JS}
/* ================================================================
   INITIALIZATION
================================================================ */
renderGradePick();
showScreen('screen-students');`;

module.exports = function admin(html, ctx) {
  html = mustReplace(html, OLD_WRAP_TAIL, NEW_WRAP_TAIL, '06: admin screens HTML');
  html = mustReplace(html, OLD_INIT_BLOCK, NEW_INIT_BLOCK, '06: admin JS');
  return html;
};
