# 3·4·5·6학년 방학 학습장 통합 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `Downloads/summerhomework/index.html` (currently 3학년-only) with a single self-contained page that serves 3·4·5·6학년, reusing the existing 5·6학년 page (`index56.html`) as the base and porting in 3학년-only features (구구단, 3·4학년 English engine, per-grade teacher passwords), plus a new cross-grade admin account.

**Architecture:** A Node.js build pipeline (`scripts/build.js`) reads `index56.html` as the base document and applies an ordered list of pure string-transform functions (`scripts/transforms/*.js`). Each transform uses exact-match `mustReplace`/`extractBetween` helpers against **verified, verbatim source strings** (never re-typed from memory) to splice in HTML/CSS/JS from the pre-merge `index.html` (3학년) or add new code. The pipeline never touches the two multi-megabyte files directly with a text editor — it is 100% scripted so it is re-runnable and diffable. Final output is written to `index.build.html`, verified, then copied over `index.html` only in the last task.

**Tech Stack:** Plain Node.js (no dependencies, no bundler) for the build script; the shipped artifact is the same stack as today (vanilla HTML/CSS/JS + Firebase Realtime Database v10.12.2 compat SDK, GitHub Pages hosting).

## Global Constraints

- Never rename existing Firebase paths that already hold live data: `mado3_records`, `mado3_passwords`, `mado3_teacher_password` (3학년), `mado56_records`, `mado56_passwords` (5·6학년, stays shared) must keep their exact names.
- Existing student ids must not change: `kim`,`na`,`min`,`baek`,`shin` (3학년), `s01`–`s19` (5·6학년, `s01`–`s04`=5학년, `s05`–`s19`=6학년).
- New 4학년 ids use the `g4_01`..`g4_09` scheme (never collide with existing ids, since jump rope data for all grades already lives in one shared `jumprope_data` node keyed by student id).
- 3학년 keeps 3 activities (영어/구구단/줄넘기); 4·5·6학년 get 2 activities (영어/줄넘기).
- Each grade's teacher can only view/change their own grade's data; only the new admin account can see/change all 4 grades' passwords (student + teacher), and the admin screen has no activity dashboards.
- Every `mustReplace`/`extractBetween` call must be backed by a marker string this plan confirmed actually exists (verbatim, byte-for-byte) in the source file — do not improvise a marker that "looks about right".
- Never overwrite `Downloads/summerhomework/index.html` until the final task's verification passes; work in `index.build.html` until then.

---

## File Structure

```
Downloads/summerhomework/
  index.html                     # CURRENT 3학년-only file — read-only source for extraction until Task 9, then overwritten with the merged build
  index56.html                   # CURRENT 5·6학년 file — read-only base for extraction, untouched on disk
  index.build.html               # build OUTPUT (git-ignored, regenerated every run)
  scripts/
    lib/
      extract.js                 # mustReplace / extractBetween helpers (Task 1)
    transforms/
      01-grade-picker.js         # Task 1 (this task) + Task 3 menu-card hook + Task 6 admin button
      02-students-and-firebase.js# Task 2
      03-multiplication-module.js# Task 3
      04-english-engine-routing.js # Task 4
      05-teacher-login-and-dashboard.js # Task 5
      06-admin.js                # Task 6
      07-class-ranking-tabs.js   # Task 7
      08-navigation.js           # Task 8
    build.js                     # orchestrator (Task 1)
    verify.js                    # structural assertions on index.build.html (Task 1, extended every task)
```

Each transform file exports a single function `(html, ctx) => html` where `ctx = { src3 }` (`src3` = the untouched pre-merge `index.html` text, used only as an extraction source, never mutated).

---

### Task 1: Build pipeline scaffold

**Files:**
- Create: `Downloads/summerhomework/scripts/lib/extract.js`
- Create: `Downloads/summerhomework/scripts/transforms/01-grade-picker.js`
- Create: `Downloads/summerhomework/scripts/build.js`
- Create: `Downloads/summerhomework/scripts/verify.js`
- Modify: none yet (no writes to `index.html`)

**Interfaces:**
- Produces: `mustReplace(html, oldStr, newStr, label)`, `extractBetween(text, startMarker, endMarker, label)` — used by every later transform.
- Produces: `scripts/build.js` orchestrator that later tasks append transforms to (array literal, one `require()` per task).
- Produces: `scripts/verify.js` CLI (`node scripts/verify.js`) — later tasks append assertions to it.

- [ ] **Step 1: Write the extraction helpers**

Create `Downloads/summerhomework/scripts/lib/extract.js`:

```js
'use strict';

function mustReplace(html, oldStr, newStr, label) {
  const count = html.split(oldStr).length - 1;
  if (count === 0) {
    throw new Error(`[${label}] old string not found (search text drifted from source?)`);
  }
  if (count > 1) {
    throw new Error(`[${label}] old string matched ${count} times, expected exactly 1`);
  }
  return html.split(oldStr).join(newStr);
}

function extractBetween(text, startMarker, endMarker, label) {
  const startIdx = text.indexOf(startMarker);
  if (startIdx === -1) {
    throw new Error(`[${label}] start marker not found: ${JSON.stringify(startMarker.slice(0, 60))}`);
  }
  const from = startIdx + startMarker.length;
  const endIdx = text.indexOf(endMarker, from);
  if (endIdx === -1) {
    throw new Error(`[${label}] end marker not found: ${JSON.stringify(endMarker.slice(0, 60))}`);
  }
  return text.slice(from, endIdx);
}

module.exports = { mustReplace, extractBetween };
```

- [ ] **Step 2: Write the build orchestrator**

Create `Downloads/summerhomework/scripts/build.js`:

```js
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const base = fs.readFileSync(path.join(ROOT, 'index56.html'), 'utf8');
const src3 = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const ctx = { src3 };

const transforms = [
  require('./transforms/01-grade-picker'),
  // Task 2 will add: require('./transforms/02-students-and-firebase'),
  // Task 3 will add: require('./transforms/03-multiplication-module'),
  // Task 4 will add: require('./transforms/04-english-engine-routing'),
  // Task 5 will add: require('./transforms/05-teacher-login-and-dashboard'),
  // Task 6 will add: require('./transforms/06-admin'),
  // Task 7 will add: require('./transforms/07-class-ranking-tabs'),
  // Task 8 will add: require('./transforms/08-navigation'),
];

let html = base;
for (const transform of transforms) {
  html = transform(html, ctx);
}

const outPath = path.join(ROOT, 'index.build.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log('Build complete:', outPath, '(' + (html.length / 1024 / 1024).toFixed(2) + ' MB)');
```

- [ ] **Step 3: Write the verify script skeleton**

Create `Downloads/summerhomework/scripts/verify.js`:

```js
'use strict';
const fs = require('fs');
const path = require('path');

const target = process.argv[2] || path.join(__dirname, '..', 'index.build.html');
const html = fs.readFileSync(target, 'utf8');

let failures = 0;
function check(label, condition) {
  if (condition) {
    console.log('  OK  ' + label);
  } else {
    console.error('FAIL  ' + label);
    failures++;
  }
}

console.log('Verifying', target);

// Task 1: pipeline sanity
check('output is non-empty', html.length > 1000);
check('output still has a closing </html>', html.trim().endsWith('</html>'));

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log('\nAll checks passed.');
}
```

- [ ] **Step 4: Write a no-op Task 1 transform (placeholder for the grade-picker rename, filled in for real in Task 1 Step 5)**

Create `Downloads/summerhomework/scripts/transforms/01-grade-picker.js` with a temporary identity function so `build.js` runs end-to-end before the real replacement is written:

```js
'use strict';
module.exports = function gradePicker(html, ctx) {
  return html;
};
```

- [ ] **Step 5: Run the pipeline to confirm it executes cleanly**

Run: `cd "Downloads/summerhomework" && node scripts/build.js && node scripts/verify.js`

Expected: `Build complete: .../index.build.html (11.xx MB)` then `All checks passed.` (the file is currently just an unmodified copy of `index56.html`, that's expected at this point).

- [ ] **Step 6: Implement the real grade-picker + teacher-login + admin-button HTML replacement**

Replace the body of `Downloads/summerhomework/scripts/transforms/01-grade-picker.js`:

```js
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
```

- [ ] **Step 7: Add verify assertions for the grade picker**

Append to `Downloads/summerhomework/scripts/verify.js`, just before the `if (failures > 0)` line:

```js
// Task 1: grade picker
check('4 grade buttons present', ['data-grade="3"', 'data-grade="4"', 'data-grade="5"', 'data-grade="6"'].every(s => html.includes(s)));
check('4 teacher login buttons present', [3, 4, 5, 6].every(g => html.includes(`id="teacherLoginBtn${g}"`)));
check('admin login button present', html.includes('id="adminLoginBtn"'));
```

- [ ] **Step 8: Run build + verify**

Run: `cd "Downloads/summerhomework" && node scripts/build.js && node scripts/verify.js`
Expected: all checks OK, `All checks passed.`

- [ ] **Step 9: Commit**

```bash
cd "Downloads/summerhomework"
git add scripts/
git commit -m "build: add build pipeline scaffold + 4-grade/admin grade picker"
```

---

### Task 2: Merge STUDENTS, DEFAULT_STUDENT_PW, and Firebase data layer for 4 grades

**Files:**
- Create: `Downloads/summerhomework/scripts/transforms/02-students-and-firebase.js`
- Modify: `Downloads/summerhomework/scripts/build.js:12` (uncomment the Task 2 require)
- Modify: `Downloads/summerhomework/scripts/verify.js` (append checks)

**Interfaces:**
- Consumes: nothing from Task 1 beyond `mustReplace`.
- Produces (relied on by Tasks 3, 4, 5, 6, 7): `RECORDS_REFS`, `PASSWORDS_REFS` (objects keyed by grade number → Firebase ref), `recordsRefForStudent(studentId)`, `passwordsRefForStudent(studentId)`, `resetAllRecordsForGrade(grade)` (all defined in the generated `index.html`'s `<script>`, not in the build script). `STUDENTS` now has 33 entries (5 grade-3 + 9 grade-4 + 4 grade-5 + 15 grade-6), each with a `grade` field.

- [ ] **Step 1: Write the transform**

Create `Downloads/summerhomework/scripts/transforms/02-students-and-firebase.js`:

```js
'use strict';
const { mustReplace } = require('../lib/extract');

const OLD_STUDENTS_HEADER = `const STUDENTS = [
`;
const NEW_STUDENTS_HEADER = `const STUDENTS = [
  {id:'kim',   no:1, name:'김대현', emoji:'🐻', grade:3},
  {id:'na',    no:2, name:'나대한', emoji:'🐯', grade:3},
  {id:'min',   no:3, name:'민주은', emoji:'🐱', grade:3},
  {id:'baek',  no:4, name:'백은성', emoji:'🐶', grade:3},
  {id:'shin',  no:5, name:'신서희', emoji:'🐰', grade:3},
  {id:'g4_01', no:1, name:'구민준', emoji:'🐨', grade:4},
  {id:'g4_02', no:2, name:'구보람', emoji:'🦁', grade:4},
  {id:'g4_03', no:3, name:'권윤호', emoji:'🐵', grade:4},
  {id:'g4_04', no:4, name:'김다원', emoji:'🐷', grade:4},
  {id:'g4_05', no:5, name:'김연아', emoji:'🐸', grade:4},
  {id:'g4_06', no:6, name:'박누리', emoji:'🐹', grade:4},
  {id:'g4_07', no:7, name:'원지호', emoji:'🦉', grade:4},
  {id:'g4_08', no:8, name:'이건호', emoji:'🐺', grade:4},
  {id:'g4_09', no:9, name:'이도훈', emoji:'🦋', grade:4},
`;

// DEFAULT_STUDENT_PW opens with the s01 entry in index56.html; insert the new grades' defaults right before it.
const OLD_PW_HEADER = `const DEFAULT_STUDENT_PW = {
  s01:`;
const NEW_PW_HEADER = `const DEFAULT_STUDENT_PW = {
  kim: '1111', na: '2222', min: '3333', baek: '4444', shin: '5555',
  g4_01: '0101', g4_02: '0202', g4_03: '0303', g4_04: '0404', g4_05: '0505',
  g4_06: '0606', g4_07: '0707', g4_08: '0808', g4_09: '0909',
  s01:`;

const OLD_FIREBASE_REFS = `const recordsRef = db.ref('mado56_records');   // { studentId: { date: [ {time, activity, ...} ] } }
const jumpRopeRef = db.ref('jumprope_data');   // existing jump rope data
const passwordsRef = db.ref('mado56_passwords'); // { studentId: 'pwString' }`;

const NEW_FIREBASE_REFS = `const RECORDS_REFS = {
  3: db.ref('mado3_records'),
  4: db.ref('mado4_records'),
  5: db.ref('mado56_records'),
  6: db.ref('mado56_records'),
};
const PASSWORDS_REFS = {
  3: db.ref('mado3_passwords'),
  4: db.ref('mado4_passwords'),
  5: db.ref('mado56_passwords'),
  6: db.ref('mado56_passwords'),
};
const jumpRopeRef = db.ref('jumprope_data');   // existing jump rope data, shared by all grades, keyed by student id

function recordsRefForStudent(studentId) {
  const s = STUDENTS.find(x => x.id === studentId);
  return RECORDS_REFS[s.grade];
}
function passwordsRefForStudent(studentId) {
  const s = STUDENTS.find(x => x.id === studentId);
  return PASSWORDS_REFS[s.grade];
}
// Group refs so listeners/resets never touch a grade that shares a ref with a sibling grade.
const RECORD_GROUPS = [
  { grades: [3], ref: RECORDS_REFS[3] },
  { grades: [4], ref: RECORDS_REFS[4] },
  { grades: [5, 6], ref: RECORDS_REFS[5] },
];
const PASSWORD_GROUPS = [
  { grades: [3], ref: PASSWORDS_REFS[3] },
  { grades: [4], ref: PASSWORDS_REFS[4] },
  { grades: [5, 6], ref: PASSWORDS_REFS[5] },
];
function resetAllRecordsForGrade(grade) {
  const ids = STUDENTS.filter(s => s.grade === grade).map(s => s.id);
  return Promise.all(ids.map(id => Promise.all([
    recordsRefForStudent(id).child(id).remove(),
    jumpRopeRef.child(id).remove(),
  ])));
}`;

// Passwords listener: was a single listener over the shared mado56_passwords ref covering ALL
// students. Now one listener per ref-group, each only touching the ids that belong to it — so a
// grade-3/4 listener's "not present in this snapshot" never resets a grade-5/6 student's password
// (and vice versa).
const OLD_PW_LISTENER = `passwordsRef.on('value', (snapshot) => {
  const data = snapshot.val() || {};
  STUDENTS.forEach(s => {
    if (data[s.id]) studentPasswords[s.id] = String(data[s.id]);
    else studentPasswords[s.id] = DEFAULT_STUDENT_PW[s.id];
  });
  // Refresh teacher password table if visible
  if (!document.getElementById('screen-teacher').classList.contains('hidden')) {
    renderTeacherPasswordTable();
  }
});`;
const NEW_PW_LISTENER = `PASSWORD_GROUPS.forEach(group => {
  group.ref.on('value', (snapshot) => {
    const data = snapshot.val() || {};
    STUDENTS.filter(s => group.grades.includes(s.grade)).forEach(s => {
      studentPasswords[s.id] = data[s.id] ? String(data[s.id]) : DEFAULT_STUDENT_PW[s.id];
    });
    if (!document.getElementById('screen-teacher').classList.contains('hidden')) {
      renderTeacherPasswordTable();
    }
    if (!document.getElementById('screen-admin').classList.contains('hidden')) {
      renderAdminStudentPwTable();
    }
  });
});`;

// Records listener: same idea — one listener per ref-group, merging only its own ids into the
// shared client-side allRecords object instead of replacing the whole thing.
const OLD_RECORDS_LISTENER = `recordsRef.on('value', (snapshot) => {
  const data = snapshot.val();
  allRecords = data || {};
  syncStatus = 'online';
  // Re-render current screen if it displays records
  if (!document.getElementById('screen-records').classList.contains('hidden')) {
    renderCalendar();
    renderRecordsChart();
    renderRecordsSummary();
  }
  if (!document.getElementById('screen-class').classList.contains('hidden')) {
    renderClassRanking();
  }
});`;
const NEW_RECORDS_LISTENER = `RECORD_GROUPS.forEach(group => {
  group.ref.on('value', (snapshot) => {
    const data = snapshot.val() || {};
    const ids = new Set(STUDENTS.filter(s => group.grades.includes(s.grade)).map(s => s.id));
    Object.keys(allRecords).forEach(id => { if (ids.has(id)) delete allRecords[id]; });
    Object.assign(allRecords, data);
    syncStatus = 'online';
    if (!document.getElementById('screen-records').classList.contains('hidden')) {
      renderCalendar();
      renderRecordsChart();
      renderRecordsSummary();
    }
    if (!document.getElementById('screen-class').classList.contains('hidden')) {
      renderClassRanking();
    }
  });
});`;

const OLD_SAVE_RECORD_LINE = `  const ref = recordsRef.child(studentId).child(dateStr).push();`;
const NEW_SAVE_RECORD_LINE = `  const ref = recordsRefForStudent(studentId).child(studentId).child(dateStr).push();`;

// savePw() (the teacher dashboard's per-student password "저장" button) also calls the
// removed bare passwordsRef directly — must be routed through passwordsRefForStudent too.
const OLD_SAVE_PW_LINE = `  passwordsRef.update(update).then(() => {`;
const NEW_SAVE_PW_LINE = `  passwordsRefForStudent(sid).update(update).then(() => {`;

const OLD_RESET_STUDENT_LINE = `    recordsRef.child(studentId).remove(),`;
const NEW_RESET_STUDENT_LINE = `    recordsRefForStudent(studentId).child(studentId).remove(),`;

// NOTE: the teacher dashboard's "전체 초기화" button also calls the now-removed bare
// recordsRef/jumpRopeRef.remove() (a global wipe) — deliberately left untouched here.
// Task 5 replaces that whole call with resetAllRecordsForGrade(teacherGradeFilter), which
// properly scopes BOTH records and jump-rope removal to the logged-in teacher's own grade.
// Patching it here first would make Task 5's OLD_RESET_CALL marker fail to match later.

// Second listener registered near the bottom of the file, driving generic re-renders.
const OLD_TAIL_LISTENER = `recordsRef.on('value', refreshDynamicViews);
jumpRopeRef.on('value', refreshDynamicViews);`;
const NEW_TAIL_LISTENER = `RECORD_GROUPS.forEach(group => group.ref.on('value', refreshDynamicViews));
jumpRopeRef.on('value', refreshDynamicViews);`;

module.exports = function studentsAndFirebase(html, ctx) {
  html = mustReplace(html, OLD_STUDENTS_HEADER, NEW_STUDENTS_HEADER, '02: STUDENTS header');
  html = mustReplace(html, OLD_PW_HEADER, NEW_PW_HEADER, '02: DEFAULT_STUDENT_PW header');
  html = mustReplace(html, OLD_FIREBASE_REFS, NEW_FIREBASE_REFS, '02: firebase refs');
  html = mustReplace(html, OLD_PW_LISTENER, NEW_PW_LISTENER, '02: passwords listener');
  html = mustReplace(html, OLD_RECORDS_LISTENER, NEW_RECORDS_LISTENER, '02: records listener');
  html = mustReplace(html, OLD_SAVE_RECORD_LINE, NEW_SAVE_RECORD_LINE, '02: saveRecord ref');
  html = mustReplace(html, OLD_SAVE_PW_LINE, NEW_SAVE_PW_LINE, '02: savePw ref');
  html = mustReplace(html, OLD_RESET_STUDENT_LINE, NEW_RESET_STUDENT_LINE, '02: resetStudentRecords ref');
  html = mustReplace(html, OLD_TAIL_LISTENER, NEW_TAIL_LISTENER, '02: tail listeners');
  return html;
};
```

- [ ] **Step 2: Wire the transform into the build**

In `Downloads/summerhomework/scripts/build.js`, uncomment/replace:

```js
  require('./transforms/01-grade-picker'),
  require('./transforms/02-students-and-firebase'),
```

- [ ] **Step 3: Add verify assertions**

Append to `scripts/verify.js`:

```js
// Task 2: students + firebase data layer
{
  const idMatches = [...html.matchAll(/\{id:'([^']+)',\s*no:\d+,\s*name:'[^']+',\s*emoji:'[^']+',\s*grade:(\d)\}/g)];
  check('STUDENTS has 33 entries', idMatches.length === 33);
  const ids = idMatches.map(m => m[1]);
  check('all student ids unique', new Set(ids).size === ids.length);
  const byGrade = { 3: 0, 4: 0, 5: 0, 6: 0 };
  idMatches.forEach(m => { byGrade[m[2]]++; });
  check('5 grade-3 students', byGrade[3] === 5);
  check('9 grade-4 students', byGrade[4] === 9);
  check('4 grade-5 students', byGrade[5] === 4);
  check('15 grade-6 students', byGrade[6] === 15);
}
check('mado3_records ref present', html.includes(`db.ref('mado3_records')`));
check('mado4_records ref present', html.includes(`db.ref('mado4_records')`));
check('mado3_passwords ref present', html.includes(`db.ref('mado3_passwords')`));
check('mado4_passwords ref present', html.includes(`db.ref('mado4_passwords')`));
check('mado56_records still shared', (html.match(/db\.ref\('mado56_records'\)/g) || []).length === 2);
check('resetAllRecordsForGrade defined', html.includes('function resetAllRecordsForGrade(grade)'));
check('old single recordsRef/passwordsRef removed', !/const recordsRef = db\.ref/.test(html) && !/const passwordsRef = db\.ref/.test(html));
check('no remaining bare passwordsRef usages', !/\bpasswordsRef\b(?!ForStudent)/.test(html));
// One bare recordsRef usage deliberately remains after Task 2 (the teacher "전체 초기화"
// button) — Task 5 patches it and adds the corresponding zero-remaining-usages check.
```

- [ ] **Step 4: Run build + verify**

Run: `cd "Downloads/summerhomework" && node scripts/build.js && node scripts/verify.js`
Expected: all checks OK.

- [ ] **Step 5: Commit**

```bash
cd "Downloads/summerhomework"
git add scripts/
git commit -m "build: merge STUDENTS for 4 grades, split Firebase records/passwords refs"
```

---

### Task 3: Port the 구구단 (multiplication) module, gated to 3학년 only

**Files:**
- Create: `Downloads/summerhomework/scripts/transforms/03-multiplication-module.js`
- Modify: `Downloads/summerhomework/scripts/build.js` (add require)
- Modify: `Downloads/summerhomework/scripts/verify.js` (append checks)

**Interfaces:**
- Consumes: `ctx.src3` (pre-merge `index.html`), `STUDENTS`/grade fields from Task 2.
- Produces: `startMultiplication()` global function (ported verbatim), `screen-mult` DOM section, `updateMenuCardsForGrade()` function (new — later reused by Task 8's navigation work, called from `showScreen`).

**Extraction markers already verified to exist exactly once each in `index.html` (3학년 source):**
- HTML block: `<div id="screen-mult" class="hidden">` … up to (not including) `<div id="screen-jumprope" class="hidden">`
- JS block: the comment header `/* ================================================================\n   MULTIPLICATION MODULE\n================================================================ */` … up to (not including) the next module's header `/* ================================================================\n   JUMP ROPE MODULE`

- [ ] **Step 1: Write the transform**

Create `Downloads/summerhomework/scripts/transforms/03-multiplication-module.js`:

```js
'use strict';
const { mustReplace, extractBetween } = require('../lib/extract');

// NOTE: this file's <head> is duplicated verbatim a second time deep inside the embedded
// quizDocTemplate (it's a full second HTML document textually embedded as quiz-engine data), so
// a generic `</style>\n</head>` anchor matches twice and mustReplace would correctly refuse to
// guess which one. Anchor on these two CSS rules instead — both verified to occur exactly once
// in the whole file (they don't exist inside the quiz engine's own stylesheet at all).
const OLD_ACTIVITYCARD_CSS = `.activitycard.eng::before{background:var(--sky);}
.activitycard.rope::before{background:var(--green);}`;
const NEW_ACTIVITYCARD_CSS = `.activitycard.eng::before{background:var(--sky);}
.activitycard.mult::before{background:var(--mustard);}
.activitycard.rope::before{background:var(--green);}`;

const OLD_CALDOT_CSS = `.cal-dot.eng{background:#4DA3E8;}       /* 영어 - 파란색 */
.cal-dot.jr{background:#3FA772;}        /* 줄넘기 - 초록색 */`;
const NEW_CALDOT_CSS = `.cal-dot.eng{background:#4DA3E8;}       /* 영어 - 파란색 */
.cal-dot.mult{background:#FFB800;}      /* 구구단 - 노란색 */
.cal-dot.jr{background:#3FA772;}        /* 줄넘기 - 초록색 */`;

const OLD_MENU_BLOCK = `    <div class="activity-grid">
      <button class="activitycard eng" onclick="startEnglish()">
        <span class="icon-big">🍽️</span>
        <h3>맛있는 영어</h3>
        <p>5,6학년 영어 단어와 표현을 재미있게 배워요. 마이크로 말하면서 연습해요!</p>
      </button>
      <button class="activitycard rope" onclick="startJumpRope()">
        <span class="icon-big">🏃</span>
        <h3>줄넘기 급수제</h3>
        <p>대한줄넘기협회 기준으로 8종목 급수를 측정하고 기록해요. 친구들과 함께!</p>
      </button>
      <button class="activitycard record" onclick="startRecords()">
        <span class="icon-big">📅</span>
        <h3>내 기록 보기</h3>
        <p>달력에서 공부한 날을 확인하고 몇 문제 맞췄는지 그래프로 봐요!</p>
      </button>
    </div>
  </div>

  <!-- SCREEN 2: English quiz -->`;

const NEW_MENU_BLOCK = `    <div class="activity-grid">
      <button class="activitycard eng" id="engActivityCard" onclick="startEnglish()">
        <span class="icon-big">🍽️</span>
        <h3>맛있는 영어</h3>
        <p id="engActivityCardDesc">영어 단어와 표현을 재미있게 배워요. 마이크로 말하면서 연습해요!</p>
      </button>
      <button class="activitycard mult hidden" id="multActivityCard" onclick="startMultiplication()">
        <span class="icon-big">🧮</span>
        <h3>맛있는 구구단</h3>
        <p>2단부터 9단까지! 말하거나 눌러서 정답을 입력하며 구구단을 익혀요.</p>
      </button>
      <button class="activitycard rope" onclick="startJumpRope()">
        <span class="icon-big">🏃</span>
        <h3>줄넘기 급수제</h3>
        <p>대한줄넘기협회 기준으로 8종목 급수를 측정하고 기록해요. 친구들과 함께!</p>
      </button>
      <button class="activitycard record" onclick="startRecords()">
        <span class="icon-big">📅</span>
        <h3>내 기록 보기</h3>
        <p>달력에서 공부한 날을 확인하고 몇 문제 맞췄는지 그래프로 봐요!</p>
      </button>
    </div>
  </div>

  <!-- SCREEN 2: English quiz -->`;

const OLD_JUMPROPE_HTML_MARKER = `  <div id="screen-jumprope" class="hidden">`;

// startMultiplication() itself is NOT inside the "MULTIPLICATION MODULE" section — like
// startEnglish()/startJumpRope(), it lives in the "MAIN ACTIVITY ENTRY POINTS" section instead
// (verified: index.html defines it at line 1209, immediately before startJumpRope()). Port it
// separately, right before the target's own startJumpRope().
const OLD_START_JUMPROPE_FN = `function startJumpRope() {`;
const NEW_START_JUMPROPE_FN = `function startMultiplication() {
  document.getElementById('mult-home').classList.remove('hidden');
  document.getElementById('mult-game').classList.add('hidden');
  document.getElementById('mult-result').classList.add('hidden');
  showScreen('screen-mult');
}
function startJumpRope() {`;

const OLD_SCROLL_LINE = `  window.scrollTo(0, 0);
}`;
const NEW_SCROLL_LINE = `  window.scrollTo(0, 0);
  if (id === 'screen-menu') updateMenuCardsForGrade();
}

function updateMenuCardsForGrade() {
  const isGrade3 = !!(currentStudent && currentStudent.grade === 3);
  document.getElementById('multActivityCard').classList.toggle('hidden', !isGrade3);
  document.getElementById('engActivityCardDesc').textContent = isGrade3
    ? '3학년 영어 단어와 표현을 재미있게 배워요. 마이크로 말하면서 연습해요!'
    : '영어 단어와 표현을 재미있게 배워요. 마이크로 말하면서 연습해요!';
}`;

module.exports = function multiplicationModule(html, ctx) {
  // 1. CSS
  html = mustReplace(html, OLD_ACTIVITYCARD_CSS, NEW_ACTIVITYCARD_CSS, '03: activitycard mult CSS');
  html = mustReplace(html, OLD_CALDOT_CSS, NEW_CALDOT_CSS, '03: cal-dot mult CSS');

  // 2. Menu cards (add hidden mult card + grade-aware English description hook)
  html = mustReplace(html, OLD_MENU_BLOCK, NEW_MENU_BLOCK, '03: menu activity-grid');

  // 3. Port the screen-mult HTML from the 3학년 source, insert right before screen-jumprope
  const multHtml = extractBetween(
    ctx.src3,
    `<div id="screen-mult" class="hidden">`,
    `<div id="screen-jumprope" class="hidden">`,
    '03: screen-mult HTML extraction'
  );
  html = mustReplace(
    html,
    OLD_JUMPROPE_HTML_MARKER,
    `<div id="screen-mult" class="hidden">${multHtml}<div id="screen-jumprope" class="hidden">`,
    '03: insert screen-mult HTML'
  );

  // 4. Port the MULTIPLICATION MODULE JS from the 3학년 source, insert right before the JUMP ROPE MODULE header
  const multJs = extractBetween(
    ctx.src3,
    `/* ================================================================
   MULTIPLICATION MODULE
================================================================ */`,
    `/* ================================================================
   JUMP ROPE MODULE`,
    '03: MULTIPLICATION MODULE JS extraction'
  );
  html = mustReplace(
    html,
    `/* ================================================================
   JUMP ROPE MODULE`,
    `/* ================================================================
   MULTIPLICATION MODULE
================================================================ */${multJs}/* ================================================================
   JUMP ROPE MODULE`,
    '03: insert MULTIPLICATION MODULE JS'
  );

  // 5. Port startMultiplication() itself (lives in MAIN ACTIVITY ENTRY POINTS, not the module above)
  html = mustReplace(html, OLD_START_JUMPROPE_FN, NEW_START_JUMPROPE_FN, '03: insert startMultiplication()');

  // 6. Hook grade-aware menu-card visibility into showScreen()
  html = mustReplace(html, OLD_SCROLL_LINE, NEW_SCROLL_LINE, '03: showScreen menu-card hook');

  return html;
};
```

- [ ] **Step 2: Wire into build.js**

Add `require('./transforms/03-multiplication-module'),` after the Task 2 line in the `transforms` array.

- [ ] **Step 3: Add verify assertions**

Append to `scripts/verify.js`:

```js
// Task 3: multiplication module
check('screen-mult present', html.includes('id="screen-mult"'));
check('multActivityCard present and starts hidden', html.includes('id="multActivityCard"') && /class="activitycard mult hidden" id="multActivityCard"/.test(html));
check('startMultiplication defined (ported from MAIN ACTIVITY ENTRY POINTS, not the module section)', html.includes(`function startMultiplication() {\n  document.getElementById('mult-home').classList.remove('hidden');`));
check('updateMenuCardsForGrade defined', html.includes('function updateMenuCardsForGrade()'));
check('mult CSS present', html.includes('.activitycard.mult::before'));
```

- [ ] **Step 4: Run build + verify**

Run: `cd "Downloads/summerhomework" && node scripts/build.js && node scripts/verify.js`
Expected: all checks OK. Also spot-check the file size grew by roughly the size of the ported block (a few hundred KB, not multi-MB — the multiplication module has no embedded media).

- [ ] **Step 5: Commit**

```bash
cd "Downloads/summerhomework"
git add scripts/
git commit -m "build: port 구구단 module, gate menu card to grade 3"
```

---

### Task 4: Dual English-engine routing (엔진 A: 3·4학년, 엔진 B: 5·6학년)

**Files:**
- Create: `Downloads/summerhomework/scripts/transforms/04-english-engine-routing.js`
- Modify: `Downloads/summerhomework/scripts/build.js` (add require)
- Modify: `Downloads/summerhomework/scripts/verify.js` (append checks)

**Interfaces:**
- Consumes: `ctx.src3` for engine A's template body; `currentStudent.grade` (already set per-student by Task 2's STUDENTS data).
- Produces: two `<script type="text/html">` templates, `id="quizDocTemplate34"` (엔진 A, `GRADES["3"]`/`GRADES["4"]`) and `id="quizDocTemplate56"` (엔진 B, unchanged content, just renamed), and a grade-aware `loadEngQuizFrame(gradeOverride)`.

**Note:** `startEnglish()` already calls `loadEngQuizFrame(currentStudent && currentStudent.grade ? String(currentStudent.grade) : null)` — no change needed there, since `currentStudent.grade` is now correctly 3/4/5/6 for every student after Task 2.

- [ ] **Step 1: Write the transform**

Create `Downloads/summerhomework/scripts/transforms/04-english-engine-routing.js`:

```js
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
```

- [ ] **Step 2: Wire into build.js**

Add `require('./transforms/04-english-engine-routing'),` after Task 3's line.

- [ ] **Step 3: Add verify assertions**

Append to `scripts/verify.js`:

```js
// Task 4: dual English engine routing
check('quizDocTemplate34 present', html.includes('id="quizDocTemplate34"'));
check('quizDocTemplate56 present (renamed)', html.includes('id="quizDocTemplate56"'));
check('old bare quizDocTemplate id gone', !html.includes('id="quizDocTemplate"'));
check('loadEngQuizFrame routes by grade', html.includes(`var tplId = (gradeOverride === '3' || gradeOverride === '4') ? 'quizDocTemplate34' : 'quizDocTemplate56';`));
{
  const engineAStart = html.indexOf('id="quizDocTemplate34"');
  const engineAEnd = html.indexOf('</script>', engineAStart);
  const engineAChunk = html.slice(engineAStart, engineAEnd);
  check('engine A chunk contains grade-3/4 bootstrap targets', engineAChunk.includes("showScreen('grade');") && engineAChunk.includes('id="gradeBtn"'));
}
```

- [ ] **Step 4: Run build + verify**

Run: `cd "Downloads/summerhomework" && node scripts/build.js && node scripts/verify.js`
Expected: all checks OK. File size should now be roughly `index56.html` size + `index.html` size (~11–12 MB total) — print and sanity-check the size logged by `build.js`.

- [ ] **Step 5: Commit**

```bash
cd "Downloads/summerhomework"
git add scripts/
git commit -m "build: add dual English engine (3/4 vs 5/6) with grade-based routing"
```

---

### Task 5: Teacher login for 4 grades, per-grade dashboard (구구단 column, grade-scoped reset/CSV)

**Files:**
- Create: `Downloads/summerhomework/scripts/transforms/05-teacher-login-and-dashboard.js`
- Modify: `Downloads/summerhomework/scripts/build.js` (add require)
- Modify: `Downloads/summerhomework/scripts/verify.js` (append checks)

**Interfaces:**
- Consumes: `RECORDS_REFS`/`PASSWORDS_REFS`/`recordsRefForStudent`/`resetAllRecordsForGrade` (Task 2), `teacherLoginBtn3..6` buttons (Task 1).
- Produces: `teacherPasswords` (object keyed by grade 3/4/5/6, replaces the old single `teacherPassword` variable) — **consumed directly by Task 6 (admin screen)**.

- [ ] **Step 1: Write the transform**

Create `Downloads/summerhomework/scripts/transforms/05-teacher-login-and-dashboard.js`:

```js
'use strict';
const { mustReplace } = require('../lib/extract');

// -- 1. Per-grade teacher password state (replaces single DEFAULT_TEACHER_PASSWORD/teacherPassword) --
const OLD_PW_STATE = `const DEFAULT_TEACHER_PASSWORD = '2026';
let teacherPassword = DEFAULT_TEACHER_PASSWORD;

// Listen for teacher password changes in Firebase
const teacherPwRef = db.ref('mado56_teacher_password');
teacherPwRef.on('value', (snapshot) => {
  const val = snapshot.val();
  teacherPassword = (val && typeof val === 'string' && val.length > 0) ? String(val) : DEFAULT_TEACHER_PASSWORD;
});

let pendingTeacherGrade = 5;
document.getElementById('teacherLoginBtn5').addEventListener('click', () => {
  pendingTeacherGrade = 5;
  document.getElementById('teacherPwInput').value = '';
  document.getElementById('teacherPwErr').style.display = 'none';
  showScreen('screen-teacher-login');
  setTimeout(() => { document.getElementById('teacherPwInput').focus(); }, 100);
});
document.getElementById('teacherLoginBtn6').addEventListener('click', () => {
  pendingTeacherGrade = 6;
  document.getElementById('teacherPwInput').value = '';
  document.getElementById('teacherPwErr').style.display = 'none';
  showScreen('screen-teacher-login');
  setTimeout(() => { document.getElementById('teacherPwInput').focus(); }, 100);
});

document.getElementById('teacherLoginCancel').addEventListener('click', () => {
  showScreen('screen-students');
});

function teacherTryLogin() {
  const pw = document.getElementById('teacherPwInput').value.trim();
  if (pw === teacherPassword) {
    document.getElementById('teacherPwErr').style.display = 'none';
    openTeacherDashboard();
  } else {
    document.getElementById('teacherPwErr').style.display = 'block';
    document.getElementById('teacherPwInput').value = '';
    document.getElementById('teacherPwInput').focus();
  }
}`;

const NEW_PW_STATE = `const TEACHER_PW_DEFAULTS = { 3: '260301', 4: '2026', 5: '2026', 6: '2026' };
let teacherPasswords = { ...TEACHER_PW_DEFAULTS };

// Listen for each grade's teacher password changes in Firebase (grades 3/4/5/6 are now fully independent)
[3, 4, 5, 6].forEach(g => {
  db.ref('mado' + g + '_teacher_password').on('value', (snapshot) => {
    const val = snapshot.val();
    teacherPasswords[g] = (val && typeof val === 'string' && val.length > 0) ? String(val) : TEACHER_PW_DEFAULTS[g];
  });
});

let pendingTeacherGrade = 3;
[3, 4, 5, 6].forEach(g => {
  document.getElementById('teacherLoginBtn' + g).addEventListener('click', () => {
    pendingTeacherGrade = g;
    document.getElementById('teacherPwInput').value = '';
    document.getElementById('teacherPwErr').style.display = 'none';
    showScreen('screen-teacher-login');
    setTimeout(() => { document.getElementById('teacherPwInput').focus(); }, 100);
  });
});

document.getElementById('teacherLoginCancel').addEventListener('click', () => {
  showScreen('screen-students');
});

function teacherTryLogin() {
  const pw = document.getElementById('teacherPwInput').value.trim();
  if (pw === teacherPasswords[pendingTeacherGrade]) {
    document.getElementById('teacherPwErr').style.display = 'none';
    openTeacherDashboard();
  } else {
    document.getElementById('teacherPwErr').style.display = 'block';
    document.getElementById('teacherPwInput').value = '';
    document.getElementById('teacherPwInput').focus();
  }
}`;

// -- 2. Own-password display/change: teacherPassword -> teacherPasswords[teacherGradeFilter], teacherPwRef -> per-grade ref --
const OLD_PW_DISPLAY = `function updateTeacherPwDisplay() {
  const el = document.getElementById('teacherCurrentPw');
  if (!el) return;
  el.textContent = teacherPwVisible ? teacherPassword : '••••••';`;
const NEW_PW_DISPLAY = `function updateTeacherPwDisplay() {
  const el = document.getElementById('teacherCurrentPw');
  if (!el) return;
  el.textContent = teacherPwVisible ? teacherPasswords[teacherGradeFilter] : '••••••';`;

const OLD_PW_SAVE = `  teacherPwRef.set(newPw).then(() => {
    teacherPassword = newPw;`;
const NEW_PW_SAVE = `  db.ref('mado' + teacherGradeFilter + '_teacher_password').set(newPw).then(() => {
    teacherPasswords[teacherGradeFilter] = newPw;`;

// -- 3. Grade-scoped "전체 초기화" (was recordsRef.remove()/jumpRopeRef.remove() — wiped ALL grades
//    sharing a ref, e.g. a grade-5 teacher's reset used to also wipe grade 6's jump rope records
//    since jumprope_data is shared by every grade. Fixed by scoping to the logged-in teacher's own grade.) --
const OLD_RESET_CALL = `  Promise.all([
    recordsRef.remove(),
    jumpRopeRef.remove(),
  ]).then(() => {`;
const NEW_RESET_CALL = `  resetAllRecordsForGrade(teacherGradeFilter).then(() => {`;

// -- 4. Status table: add 구구단 column only for grade 3 --
const OLD_STATUS_TABLE = `function renderTeacherStatusTable(dateStr) {
  const rows = STUDENTS.filter(s => s.grade === teacherGradeFilter).map(s => {
    const acts = studentActivitiesOnDate(s.id, dateStr);
    const eng = acts.has('english') ? '✅' : '❌';
    const jr = acts.has('jumprope') ? '✅' : '❌';
    const doneCount = (acts.has('english') ? 1 : 0) + (acts.has('jumprope') ? 1 : 0);
    const rowBg = doneCount === 2 ? 'background:#E8F5E9;' : (doneCount === 0 ? 'background:#FFF3E0;' : '');
    return \`<tr style="\${rowBg}">
      <td style="padding:10px 12px;font-weight:800;border-bottom:1px solid var(--cream-2);">
        <span style="font-size:18px;margin-right:6px;">\${s.emoji}</span>\${s.name}
      </td>
      <td style="text-align:center;padding:10px 8px;font-size:20px;border-bottom:1px solid var(--cream-2);">\${eng}</td>
      <td style="text-align:center;padding:10px 8px;font-size:20px;border-bottom:1px solid var(--cream-2);">\${jr}</td>
      <td style="text-align:center;padding:10px 8px;font-weight:800;border-bottom:1px solid var(--cream-2);color:\${doneCount === 2 ? 'var(--green)' : (doneCount === 0 ? 'var(--red)' : 'var(--ink)')};">\${doneCount}/2</td>
    </tr>\`;
  }).join('');

  document.getElementById('teacherStatusTable').innerHTML = \`
    <table style="width:100%;border-collapse:collapse;font-size:13px;min-width:420px;">
      <thead>
        <tr style="background:var(--cream-2);">
          <th style="text-align:left;padding:10px 12px;font-weight:900;font-size:12px;color:var(--ink-soft);">학생</th>
          <th style="text-align:center;padding:10px 8px;font-weight:900;font-size:12px;color:var(--ink-soft);">🍽️ 영어</th>
          <th style="text-align:center;padding:10px 8px;font-weight:900;font-size:12px;color:var(--ink-soft);">🏃 줄넘기</th>
          <th style="text-align:center;padding:10px 8px;font-weight:900;font-size:12px;color:var(--ink-soft);">완료</th>
        </tr>
      </thead>
      <tbody>\${rows}</tbody>
    </table>
    <div style="font-size:11px;color:var(--tx3);margin-top:8px;">📅 선택된 날짜: <b>\${dateStr}</b></div>
  \`;
}`;

const NEW_STATUS_TABLE = `function renderTeacherStatusTable(dateStr) {
  const showMult = teacherGradeFilter === 3;
  const totalCount = showMult ? 3 : 2;
  const rows = STUDENTS.filter(s => s.grade === teacherGradeFilter).map(s => {
    const acts = studentActivitiesOnDate(s.id, dateStr);
    const eng = acts.has('english') ? '✅' : '❌';
    const jr = acts.has('jumprope') ? '✅' : '❌';
    const mult = acts.has('multiplication') ? '✅' : '❌';
    const doneCount = (acts.has('english') ? 1 : 0) + (acts.has('jumprope') ? 1 : 0) + (showMult && acts.has('multiplication') ? 1 : 0);
    const rowBg = doneCount === totalCount ? 'background:#E8F5E9;' : (doneCount === 0 ? 'background:#FFF3E0;' : '');
    return \`<tr style="\${rowBg}">
      <td style="padding:10px 12px;font-weight:800;border-bottom:1px solid var(--cream-2);">
        <span style="font-size:18px;margin-right:6px;">\${s.emoji}</span>\${s.name}
      </td>
      <td style="text-align:center;padding:10px 8px;font-size:20px;border-bottom:1px solid var(--cream-2);">\${eng}</td>
      \${showMult ? \`<td style="text-align:center;padding:10px 8px;font-size:20px;border-bottom:1px solid var(--cream-2);">\${mult}</td>\` : ''}
      <td style="text-align:center;padding:10px 8px;font-size:20px;border-bottom:1px solid var(--cream-2);">\${jr}</td>
      <td style="text-align:center;padding:10px 8px;font-weight:800;border-bottom:1px solid var(--cream-2);color:\${doneCount === totalCount ? 'var(--green)' : (doneCount === 0 ? 'var(--red)' : 'var(--ink)')};">\${doneCount}/\${totalCount}</td>
    </tr>\`;
  }).join('');

  document.getElementById('teacherStatusTable').innerHTML = \`
    <table style="width:100%;border-collapse:collapse;font-size:13px;min-width:420px;">
      <thead>
        <tr style="background:var(--cream-2);">
          <th style="text-align:left;padding:10px 12px;font-weight:900;font-size:12px;color:var(--ink-soft);">학생</th>
          <th style="text-align:center;padding:10px 8px;font-weight:900;font-size:12px;color:var(--ink-soft);">🍽️ 영어</th>
          \${showMult ? '<th style="text-align:center;padding:10px 8px;font-weight:900;font-size:12px;color:var(--ink-soft);">🧮 구구단</th>' : ''}
          <th style="text-align:center;padding:10px 8px;font-weight:900;font-size:12px;color:var(--ink-soft);">🏃 줄넘기</th>
          <th style="text-align:center;padding:10px 8px;font-weight:900;font-size:12px;color:var(--ink-soft);">완료</th>
        </tr>
      </thead>
      <tbody>\${rows}</tbody>
    </table>
    <div style="font-size:11px;color:var(--tx3);margin-top:8px;">📅 선택된 날짜: <b>\${dateStr}</b></div>
  \`;
}`;

// -- 5. CSV export: was exporting every grade regardless of who's logged in; scope to teacherGradeFilter --
const OLD_CSV_LOOP = `function exportRecordsCsv() {
  const lines = ['학생명,날짜,시간,활동,단원/단,정답,전체,정답률'];
  STUDENTS.forEach(s => {`;
const NEW_CSV_LOOP = `function exportRecordsCsv() {
  const lines = ['학생명,날짜,시간,활동,단원/단,정답,전체,정답률'];
  STUDENTS.filter(s => s.grade === teacherGradeFilter).forEach(s => {`;

const OLD_CSV_FILENAME = `  a.download = \`마동초3학년_학습기록_\${todayStr()}.csv\`;`;
const NEW_CSV_FILENAME = `  a.download = \`마동초\${teacherGradeFilter}학년_학습기록_\${todayStr()}.csv\`;`;

module.exports = function teacherLoginAndDashboard(html, ctx) {
  html = mustReplace(html, OLD_PW_STATE, NEW_PW_STATE, '05: teacher password state + login buttons');
  html = mustReplace(html, OLD_PW_DISPLAY, NEW_PW_DISPLAY, '05: teacher pw display');
  html = mustReplace(html, OLD_PW_SAVE, NEW_PW_SAVE, '05: teacher pw save');
  html = mustReplace(html, OLD_RESET_CALL, NEW_RESET_CALL, '05: grade-scoped reset');
  html = mustReplace(html, OLD_STATUS_TABLE, NEW_STATUS_TABLE, '05: status table mult column');
  html = mustReplace(html, OLD_CSV_LOOP, NEW_CSV_LOOP, '05: csv grade scope');
  html = mustReplace(html, OLD_CSV_FILENAME, NEW_CSV_FILENAME, '05: csv filename');
  return html;
};
```

- [ ] **Step 2: Wire into build.js**

Add `require('./transforms/05-teacher-login-and-dashboard'),` after Task 4's line.

- [ ] **Step 3: Add verify assertions**

Append to `scripts/verify.js`:

```js
// Task 5: teacher login + dashboard
check('teacherPasswords object present', html.includes('let teacherPasswords = { ...TEACHER_PW_DEFAULTS };'));
check('TEACHER_PW_DEFAULTS has all 4 grades at correct values', html.includes(`const TEACHER_PW_DEFAULTS = { 3: '260301', 4: '2026', 5: '2026', 6: '2026' };`));
check('4 per-grade teacher password Firebase listeners wired', html.includes(`db.ref('mado' + g + '_teacher_password')`));
check('old single teacherPassword variable removed', !/let teacherPassword = DEFAULT_TEACHER_PASSWORD/.test(html));
check('resetAllRecordsForGrade wired into reset button', html.includes('resetAllRecordsForGrade(teacherGradeFilter).then(() => {'));
check('no remaining bare recordsRef usages', !/\brecordsRef\b(?!ForStudent)/.test(html));
check('status table has grade-3-only 구구단 column logic', html.includes('const showMult = teacherGradeFilter === 3;'));
check('CSV export scoped to teacherGradeFilter', html.includes('STUDENTS.filter(s => s.grade === teacherGradeFilter).forEach(s => {'));
```

- [ ] **Step 4: Run build + verify**

Run: `cd "Downloads/summerhomework" && node scripts/build.js && node scripts/verify.js`
Expected: all checks OK.

- [ ] **Step 5: Commit**

```bash
cd "Downloads/summerhomework"
git add scripts/
git commit -m "build: per-grade teacher passwords, grade-scoped reset/CSV, 구구단 status column"
```

---

### Task 6: Admin login + admin screen (password management only, all 4 grades)

**Files:**
- Create: `Downloads/summerhomework/scripts/transforms/06-admin.js`
- Modify: `Downloads/summerhomework/scripts/build.js` (add require)
- Modify: `Downloads/summerhomework/scripts/verify.js` (append checks)

**Interfaces:**
- Consumes: `adminLoginBtn` (Task 1), `teacherPasswords` (Task 5), `passwordsRefForStudent`/`STUDENTS`/`DEFAULT_STUDENT_PW`/`studentPasswords` (Task 2).
- Produces: `screen-admin-login`, `screen-admin` DOM sections; `openAdminDashboard()`, `renderAdminTeacherPwTable()`, `renderAdminStudentPwTable()`, `adminSaveTeacherPw(grade)`, `adminSaveStudentPw(sid)` — the last two are also referenced by Task 2's password listener (`renderAdminStudentPwTable` guard).

- [ ] **Step 1: Write the transform**

Create `Downloads/summerhomework/scripts/transforms/06-admin.js`:

```js
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
```

- [ ] **Step 2: Wire into build.js**

Add `require('./transforms/06-admin'),` after Task 5's line.

- [ ] **Step 3: Add verify assertions**

Append to `scripts/verify.js`:

```js
// Task 6: admin
check('screen-admin-login present', html.includes('id="screen-admin-login"'));
check('screen-admin present', html.includes('id="screen-admin"'));
check('mado_admin_password ref present', html.includes(`db.ref('mado_admin_password')`));
check('admin has no activity-dashboard ids (password-only scope)', !/id="adminTeacherStatusTable"|id="adminOverallTable"|id="adminStreakTable"/.test(html));
check('renderAdminTeacherPwTable defined', html.includes('function renderAdminTeacherPwTable()'));
check('renderAdminStudentPwTable defined', html.includes('function renderAdminStudentPwTable()'));
check('adminSaveTeacherPw defined', html.includes('function adminSaveTeacherPw(grade)'));
check('adminSaveStudentPw defined', html.includes('function adminSaveStudentPw(sid)'));
```

- [ ] **Step 4: Run build + verify**

Run: `cd "Downloads/summerhomework" && node scripts/build.js && node scripts/verify.js`
Expected: all checks OK.

- [ ] **Step 5: Commit**

```bash
cd "Downloads/summerhomework"
git add scripts/
git commit -m "build: add super-admin login + all-grade password management screen"
```

---

### Task 7: Class ranking / 반 친구들 보기 — extend to 4 grade tabs

**Files:**
- Create: `Downloads/summerhomework/scripts/transforms/07-class-ranking-tabs.js`
- Modify: `Downloads/summerhomework/scripts/build.js` (add require)
- Modify: `Downloads/summerhomework/scripts/verify.js` (append checks)

**Interfaces:**
- Consumes: `STUDENTS` (Task 2), `allRecords`/`jrData` (existing, untouched).
- Produces: `classGradeFilter` now ranges over 3/4/5/6; `renderClassRanking()` adds a 구구단 ranking panel only when `classGradeFilter === 3`.

- [ ] **Step 1: Write the transform**

Create `Downloads/summerhomework/scripts/transforms/07-class-ranking-tabs.js`:

```js
'use strict';
const { mustReplace } = require('../lib/extract');

const OLD_CLASS_HTML = `  <div id="screen-class" class="hidden">
    <div class="hero" style="background:linear-gradient(135deg,var(--red) 0%,#E86885 100%);">
      <h1>우리반 랭킹 👥</h1>
      <p>우리반 5,6학년 친구들이 얼마나 많이 학습했는지 활동별로 확인해봐요!</p>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="navbtn classGradeTab" id="classGradeTab5" data-grade="5" style="flex:1;">5학년</button>
      <button class="navbtn classGradeTab" id="classGradeTab6" data-grade="6" style="flex:1;">6학년</button>
    </div>

    <div class="rank-panel">
      <div class="records-title">🍽️ 영어 학습 횟수</div>
      <div id="classEngSessions"></div>
    </div>
    <div class="rank-panel">
      <div class="records-title">🏃 줄넘기 측정 횟수</div>
      <div id="classJrSessions"></div>
    </div>
  </div>`;

const NEW_CLASS_HTML = `  <div id="screen-class" class="hidden">
    <div class="hero" style="background:linear-gradient(135deg,var(--red) 0%,#E86885 100%);">
      <h1>우리반 랭킹 👥</h1>
      <p>우리반 친구들이 얼마나 많이 학습했는지 활동별로 확인해봐요!</p>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
      <button class="navbtn classGradeTab" id="classGradeTab3" data-grade="3" style="flex:1;min-width:70px;">3학년</button>
      <button class="navbtn classGradeTab" id="classGradeTab4" data-grade="4" style="flex:1;min-width:70px;">4학년</button>
      <button class="navbtn classGradeTab" id="classGradeTab5" data-grade="5" style="flex:1;min-width:70px;">5학년</button>
      <button class="navbtn classGradeTab" id="classGradeTab6" data-grade="6" style="flex:1;min-width:70px;">6학년</button>
    </div>

    <div class="rank-panel">
      <div class="records-title">🍽️ 영어 학습 횟수</div>
      <div id="classEngSessions"></div>
    </div>
    <div class="rank-panel hidden" id="classMultPanel">
      <div class="records-title">🧮 구구단 학습 횟수</div>
      <div id="classMultSessions"></div>
    </div>
    <div class="rank-panel">
      <div class="records-title">🏃 줄넘기 측정 횟수</div>
      <div id="classJrSessions"></div>
    </div>
  </div>`;

const OLD_RANKING_JS = `let classGradeFilter = 5;
let teacherGradeFilter = 5;

function styleGradeTabs(prefix, activeGrade){
  [5,6].forEach(g => {
    const btn = document.getElementById(prefix + g);
    if (!btn) return;
    if (g === activeGrade) { btn.style.background = 'var(--navy)'; btn.style.color = '#fff'; }
    else { btn.style.background = 'var(--cream-2)'; btn.style.color = 'var(--ink)'; }
  });
}
document.getElementById('classGradeTab5').addEventListener('click', () => { classGradeFilter = 5; styleGradeTabs('classGradeTab', 5); renderClassRanking(); });
document.getElementById('classGradeTab6').addEventListener('click', () => { classGradeFilter = 6; styleGradeTabs('classGradeTab', 6); renderClassRanking(); });

function renderClassRanking() {
  const stats = STUDENTS.filter(s => s.grade === classGradeFilter).map(s => {
    const sr = allRecords[s.id] || {};
    let engSess = 0;
    let engDays = new Set();
    Object.entries(sr).forEach(([date, day]) => Object.values(day).forEach(entry => {
      if (entry.activity === 'english') { engSess++; engDays.add(date); }
    }));
    // Jump rope stats
    let jrSess = 0;
    let jrDays = new Set();
    if (typeof jrData !== 'undefined' && jrData) {
      const jrStudent = jrData.find(j => j.sid === s.id);
      if (jrStudent && jrStudent.ms) {
        jrStudent.ms.forEach(m => {
          const hasScore = m.scores && Object.values(m.scores).some(v => v !== "" && v != null);
          if (hasScore) { jrSess++; if (m.date) jrDays.add(m.date); }
        });
      }
    }
    return {...s, engSess, jrSess, engDays: engDays.size, jrDays: jrDays.size};
  });

  // English by sessions
  const engRanked = [...stats].sort((a, b) => b.engSess - a.engSess);
  document.getElementById('classEngSessions').innerHTML = engRanked.map((s, i) =>
    renderRankRow(s, i + 1, \`\${s.engDays}일 동안 학습\`, s.engSess, '회')
  ).join('');


  // Jump rope by sessions
  const jrRanked = [...stats].sort((a, b) => b.jrSess - a.jrSess);
  document.getElementById('classJrSessions').innerHTML = jrRanked.map((s, i) =>
    renderRankRow(s, i + 1, \`\${s.jrDays}일 동안 측정\`, s.jrSess, '회')
  ).join('');
}`;

const NEW_RANKING_JS = `let classGradeFilter = 3;
let teacherGradeFilter = 3;

function styleGradeTabs(prefix, activeGrade){
  [3,4,5,6].forEach(g => {
    const btn = document.getElementById(prefix + g);
    if (!btn) return;
    if (g === activeGrade) { btn.style.background = 'var(--navy)'; btn.style.color = '#fff'; }
    else { btn.style.background = 'var(--cream-2)'; btn.style.color = 'var(--ink)'; }
  });
}
[3,4,5,6].forEach(g => {
  document.getElementById('classGradeTab' + g).addEventListener('click', () => {
    classGradeFilter = g;
    styleGradeTabs('classGradeTab', g);
    renderClassRanking();
  });
});

function renderClassRanking() {
  const showMult = classGradeFilter === 3;
  document.getElementById('classMultPanel').classList.toggle('hidden', !showMult);
  const stats = STUDENTS.filter(s => s.grade === classGradeFilter).map(s => {
    const sr = allRecords[s.id] || {};
    let engSess = 0, multSess = 0;
    let engDays = new Set(), multDays = new Set();
    Object.entries(sr).forEach(([date, day]) => Object.values(day).forEach(entry => {
      if (entry.activity === 'english') { engSess++; engDays.add(date); }
      if (entry.activity === 'multiplication') { multSess++; multDays.add(date); }
    }));
    // Jump rope stats
    let jrSess = 0;
    let jrDays = new Set();
    if (typeof jrData !== 'undefined' && jrData) {
      const jrStudent = jrData.find(j => j.sid === s.id);
      if (jrStudent && jrStudent.ms) {
        jrStudent.ms.forEach(m => {
          const hasScore = m.scores && Object.values(m.scores).some(v => v !== "" && v != null);
          if (hasScore) { jrSess++; if (m.date) jrDays.add(m.date); }
        });
      }
    }
    return {...s, engSess, jrSess, multSess, engDays: engDays.size, jrDays: jrDays.size, multDays: multDays.size};
  });

  // English by sessions
  const engRanked = [...stats].sort((a, b) => b.engSess - a.engSess);
  document.getElementById('classEngSessions').innerHTML = engRanked.map((s, i) =>
    renderRankRow(s, i + 1, \`\${s.engDays}일 동안 학습\`, s.engSess, '회')
  ).join('');

  if (showMult) {
    const multRanked = [...stats].sort((a, b) => b.multSess - a.multSess);
    document.getElementById('classMultSessions').innerHTML = multRanked.map((s, i) =>
      renderRankRow(s, i + 1, \`\${s.multDays}일 동안 학습\`, s.multSess, '회')
    ).join('');
  }

  // Jump rope by sessions
  const jrRanked = [...stats].sort((a, b) => b.jrSess - a.jrSess);
  document.getElementById('classJrSessions').innerHTML = jrRanked.map((s, i) =>
    renderRankRow(s, i + 1, \`\${s.jrDays}일 동안 측정\`, s.jrSess, '회')
  ).join('');
}`;

module.exports = function classRankingTabs(html, ctx) {
  html = mustReplace(html, OLD_CLASS_HTML, NEW_CLASS_HTML, '07: screen-class HTML');
  html = mustReplace(html, OLD_RANKING_JS, NEW_RANKING_JS, '07: ranking JS');
  return html;
};
```

**Note on `teacherGradeFilter`:** this file's original source declares `classGradeFilter` and `teacherGradeFilter` on the same two lines, so this transform's replacement also re-declares `teacherGradeFilter`'s initial value (harmless — it's always overwritten by `openTeacherDashboard()`/`openAdminDashboard()` before use).

- [ ] **Step 2: Wire into build.js**

Add `require('./transforms/07-class-ranking-tabs'),` after Task 6's line.

- [ ] **Step 3: Add verify assertions**

Append to `scripts/verify.js`:

```js
// Task 7: class ranking tabs
check('4 classGradeTab buttons present', [3, 4, 5, 6].every(g => html.includes(`id="classGradeTab${g}"`)));
check('classMultPanel present and starts hidden', /class="rank-panel hidden" id="classMultPanel"/.test(html));
check('styleGradeTabs covers 4 grades', html.includes('[3,4,5,6].forEach(g => {') );
check('renderClassRanking computes multSess', html.includes('if (entry.activity === \'multiplication\') { multSess++; multDays.add(date); }'));
```

- [ ] **Step 4: Run build + verify**

Run: `cd "Downloads/summerhomework" && node scripts/build.js && node scripts/verify.js`
Expected: all checks OK.

- [ ] **Step 5: Commit**

```bash
cd "Downloads/summerhomework"
git add scripts/
git commit -m "build: extend class ranking / 반 친구들 보기 to 4 grade tabs"
```

---

### Task 8: Navigation registry + full back-button audit (all screens, all grades, all roles)

This task exists specifically because every earlier task added a screen (`screen-mult`, `screen-admin-login`, `screen-admin`) that the shared `showScreen()` allow-list and `menuBtn`/`homeBtn` visibility logic don't know about yet — and because "메뉴로", "처음으로", "취소", "뒤로 가기" must land students, teachers, and the admin back on the *correct* screen for their role and grade.

**Files:**
- Create: `Downloads/summerhomework/scripts/transforms/08-navigation.js`
- Modify: `Downloads/summerhomework/scripts/build.js` (add require)
- Modify: `Downloads/summerhomework/scripts/verify.js` (append checks)

**Interfaces:**
- Consumes: every screen id introduced by Tasks 1–7 (`screen-mult`, `screen-admin-login`, `screen-admin`).
- Produces: an updated `showScreen(id)` whose allow-list and header-button visibility logic includes every screen; a `homeBtn` handler that also resets any lingering `pendingTeacherGrade`/admin state.

- [ ] **Step 1: Write the transform**

Create `Downloads/summerhomework/scripts/transforms/08-navigation.js`:

```js
'use strict';
const { mustReplace } = require('../lib/extract');

const OLD_SHOW_SCREEN = `function showScreen(id) {
  ['screen-students', 'screen-student-login', 'screen-teacher-login', 'screen-teacher',
   'screen-menu', 'screen-english',
   'screen-jumprope', 'screen-records', 'screen-class'].forEach(s => {
    document.getElementById(s).classList.toggle('hidden', s !== id);
  });
  const isTeacherView = (id === 'screen-teacher' || id === 'screen-teacher-login');
  const isEntryView = (id === 'screen-students' || id === 'screen-student-login' || id === 'screen-teacher-login');
  document.getElementById('menuBtn').classList.toggle('hidden',
    isEntryView || id === 'screen-menu' || isTeacherView || id === 'screen-class');
  document.getElementById('homeBtn').classList.toggle('hidden', id === 'screen-students');
  document.getElementById('currentStudent').classList.toggle('hidden', !currentStudent && !isTeacherView);
  if (isTeacherView && id === 'screen-teacher') {
    document.getElementById('currentStudent').textContent = '👨‍🏫 선생님';
    document.getElementById('currentStudent').classList.remove('hidden');
  } else if (id === 'screen-teacher-login' || id === 'screen-student-login') {
    document.getElementById('currentStudent').classList.add('hidden');
  }
  window.scrollTo(0, 0);
  if (id === 'screen-menu') updateMenuCardsForGrade();
}`;

const NEW_SHOW_SCREEN = `function showScreen(id) {
  ['screen-students', 'screen-student-login', 'screen-teacher-login', 'screen-teacher',
   'screen-admin-login', 'screen-admin',
   'screen-menu', 'screen-english', 'screen-mult',
   'screen-jumprope', 'screen-records', 'screen-class'].forEach(s => {
    document.getElementById(s).classList.toggle('hidden', s !== id);
  });
  const isTeacherView = (id === 'screen-teacher' || id === 'screen-teacher-login');
  const isAdminView = (id === 'screen-admin' || id === 'screen-admin-login');
  const isEntryView = (id === 'screen-students' || id === 'screen-student-login' || id === 'screen-teacher-login' || id === 'screen-admin-login');
  document.getElementById('menuBtn').classList.toggle('hidden',
    isEntryView || id === 'screen-menu' || isTeacherView || isAdminView || id === 'screen-class');
  document.getElementById('homeBtn').classList.toggle('hidden', id === 'screen-students');
  document.getElementById('currentStudent').classList.toggle('hidden', !currentStudent && !isTeacherView && !isAdminView);
  if (isTeacherView && id === 'screen-teacher') {
    document.getElementById('currentStudent').textContent = '👨‍🏫 ' + teacherGradeFilter + '학년 선생님';
    document.getElementById('currentStudent').classList.remove('hidden');
  } else if (isAdminView && id === 'screen-admin') {
    document.getElementById('currentStudent').textContent = '🔐 전체 관리자';
    document.getElementById('currentStudent').classList.remove('hidden');
  } else if (id === 'screen-teacher-login' || id === 'screen-student-login' || id === 'screen-admin-login') {
    document.getElementById('currentStudent').classList.add('hidden');
  }
  window.scrollTo(0, 0);
  if (id === 'screen-menu') updateMenuCardsForGrade();
}`;

// homeBtn ("👥 처음") must also work correctly from screen-admin / screen-mult, which it already
// does since it unconditionally resets currentStudent + calls renderGradePick()/showScreen. No
// change needed to its body — this transform only extends the header-button visibility logic
// above and the menuBtn handler's "was I inside an activity" check below to include screen-mult,
// so the same after-activity homework-check flow that already runs for English/jump rope also
// runs after 구구단.
const OLD_MENU_BTN_HANDLER = `document.getElementById('menuBtn').addEventListener('click', () => {
  stopAllAudio(); stopRecognition();
  const wasInActivity = ['screen-english','screen-jumprope'].some(s => !document.getElementById(s).classList.contains('hidden'));
  showScreen('screen-menu');
  if (wasInActivity && currentStudent) {
    setTimeout(checkHomeworkAfterActivity, 500);
  }
});`;
const NEW_MENU_BTN_HANDLER = `document.getElementById('menuBtn').addEventListener('click', () => {
  stopAllAudio(); stopRecognition();
  const wasInActivity = ['screen-english','screen-jumprope','screen-mult'].some(s => !document.getElementById(s).classList.contains('hidden'));
  showScreen('screen-menu');
  if (wasInActivity && currentStudent) {
    setTimeout(checkHomeworkAfterActivity, 500);
  }
});`;

// The English quiz's own internal grade-picker screen ("← 학년 다시 선택"-style back button
// inside the iframe) is already suppressed by the gradeOverride bootstrap from Task 4
// (`_gb.style.display='none'`) for every grade, 3/4/5/6 alike — nothing to change here, just
// documenting it as verified rather than leaving it as an unchecked assumption.

module.exports = function navigation(html, ctx) {
  html = mustReplace(html, OLD_SHOW_SCREEN, NEW_SHOW_SCREEN, '08: showScreen allow-list');
  html = mustReplace(html, OLD_MENU_BTN_HANDLER, NEW_MENU_BTN_HANDLER, '08: menuBtn after-activity check');
  return html;
};
```

- [ ] **Step 2: Wire into build.js**

Add `require('./transforms/08-navigation'),` after Task 7's line — this should now be the last line before the closing `];` in the `transforms` array.

- [ ] **Step 3: Add verify assertions**

Append to `scripts/verify.js`:

```js
// Task 8: navigation
check('showScreen allow-list includes screen-mult', /\[\s*'screen-students'[\s\S]{0,300}'screen-mult'/.test(html));
check('showScreen allow-list includes screen-admin-login and screen-admin', html.includes(`'screen-admin-login', 'screen-admin',`));
check('menuBtn after-activity check includes screen-mult', html.includes(`['screen-english','screen-jumprope','screen-mult'].some`));
check('teacher header shows own grade', html.includes(`'👨‍🏫 ' + teacherGradeFilter + '학년 선생님'`));
check('admin header shows admin label', html.includes(`'🔐 전체 관리자'`));
```

- [ ] **Step 4: Run build + verify**

Run: `cd "Downloads/summerhomework" && node scripts/build.js && node scripts/verify.js`
Expected: all checks OK.

- [ ] **Step 5: Commit**

```bash
cd "Downloads/summerhomework"
git add scripts/
git commit -m "build: register new screens in navigation, extend after-activity check to 구구단"
```

---

### Task 8b: Grade-aware homework-completion check (found during Task 8 review)

Task 8's review caught a real cross-task gap: `renderTodayStatus()` (오늘의 숙제 현황 row), `showTodayHomeworkPopup()`, and `checkHomeworkAfterActivity()` were all inherited from the 5·6학년 base file and hardcode a 2-item (영어/줄넘기) list — none of Tasks 1-8 ever made them grade-aware, so every 3학년 student silently never gets credit for 구구단 in these three places, contradicting "3학년: 영어, 구구단, 줄넘기 (3개)". Fixed by making all three conditionally splice in a 구구단 item when `currentStudent.grade === 3`, and switching hardcoded `2`/`3` counts to `items.length`/`activityKeys.length`.

**Files:**
- Create: `Downloads/summerhomework/scripts/transforms/08b-grade-aware-homework-check.js`
- Modify: `Downloads/summerhomework/scripts/build.js` (require it right after `08-navigation`)
- Modify: `Downloads/summerhomework/scripts/verify.js` (append checks)

- [ ] **Step 1: Write the transform**

```js
'use strict';
const { mustReplace } = require('../lib/extract');

const OLD_RENDER_TODAY_STATUS = `function renderTodayStatus() {
  if (!currentStudent) return;
  const today = todayStr();
  const acts = studentActivitiesOnDate(currentStudent.id, today);
  const items = [
    {key: 'english', label: '영어', emoji: '🍽️'},
    {key: 'jumprope', label: '줄넘기', emoji: '🏃'},
  ];`;
const NEW_RENDER_TODAY_STATUS = `function renderTodayStatus() {
  if (!currentStudent) return;
  const today = todayStr();
  const acts = studentActivitiesOnDate(currentStudent.id, today);
  const items = [
    {key: 'english', label: '영어', emoji: '🍽️'},
    ...(currentStudent.grade === 3 ? [{key: 'multiplication', label: '구구단', emoji: '🧮'}] : []),
    {key: 'jumprope', label: '줄넘기', emoji: '🏃'},
  ];`;

const OLD_POPUP_ITEMS = `function showTodayHomeworkPopup() {
  if (!currentStudent) return;
  const acts = studentActivitiesOnDate(currentStudent.id, todayStr());
  const items = [
    {key: 'english',        label: '맛있는 영어',    emoji: '🍽️'},
    {key: 'jumprope',       label: '줄넘기',          emoji: '🏃'},
  ];
  const doneCount = items.filter(it => acts.has(it.key)).length;

  if (doneCount === 2) {`;
const NEW_POPUP_ITEMS = `function showTodayHomeworkPopup() {
  if (!currentStudent) return;
  const acts = studentActivitiesOnDate(currentStudent.id, todayStr());
  const items = [
    {key: 'english',        label: '맛있는 영어',    emoji: '🍽️'},
    ...(currentStudent.grade === 3 ? [{key: 'multiplication', label: '맛있는 구구단', emoji: '🧮'}] : []),
    {key: 'jumprope',       label: '줄넘기',          emoji: '🏃'},
  ];
  const doneCount = items.filter(it => acts.has(it.key)).length;

  if (doneCount === items.length) {`;

const OLD_POPUP_CELEBRATION_TEXT = `      <div class="popup-title">${alreadyCelebrated ? '오늘도 최고예요!' : '2가지 다 완료했어요!'}</div>
      <div class="popup-body">
        ${currentStudent.name} 학생, 오늘의 숙제 2가지를 모두 끝냈어요!<br>`;
const NEW_POPUP_CELEBRATION_TEXT = `      <div class="popup-title">${alreadyCelebrated ? '오늘도 최고예요!' : items.length + '가지 다 완료했어요!'}</div>
      <div class="popup-body">
        ${currentStudent.name} 학생, 오늘의 숙제 ${items.length}가지를 모두 끝냈어요!<br>`;

const OLD_POPUP_REMAINING_TEXT = `        오늘은 <b style="color:var(--red);">${2 - doneCount}가지</b> 더 하면 완료예요!<br>`;
const NEW_POPUP_REMAINING_TEXT = `        오늘은 <b style="color:var(--red);">${items.length - doneCount}가지</b> 더 하면 완료예요!<br>`;

const OLD_CHECK_AFTER_ACTIVITY = `function checkHomeworkAfterActivity() {
  if (!currentStudent) return;
  const acts = studentActivitiesOnDate(currentStudent.id, todayStr());
  const doneCount = ['english','jumprope'].filter(k => acts.has(k)).length;

  if (doneCount === 2) {
    const key = \`celebrated_${currentStudent.id}_${todayStr()}\`;
    if (!localStorage.getItem(key)) {
      // First time completing all 3 today - big celebration
      showPopup(\`
        <div class="popup-emoji">🏆</div>
        <div class="popup-title">🎊 2가지 다 완료! 🎊</div>
        <div class="popup-body">
          ${currentStudent.name} 학생, 오늘의 숙제<br>
          <b style="color:var(--green);font-size:16px;">영어 · 줄넘기</b><br>
          모두 완료했어요!<br><br>`;
const NEW_CHECK_AFTER_ACTIVITY = `function checkHomeworkAfterActivity() {
  if (!currentStudent) return;
  const acts = studentActivitiesOnDate(currentStudent.id, todayStr());
  const activityKeys = ['english', 'jumprope', ...(currentStudent.grade === 3 ? ['multiplication'] : [])];
  const doneCount = activityKeys.filter(k => acts.has(k)).length;

  if (doneCount === activityKeys.length) {
    const key = \`celebrated_${currentStudent.id}_${todayStr()}\`;
    if (!localStorage.getItem(key)) {
      // First time completing all today - big celebration
      const labelLine = currentStudent.grade === 3 ? '영어 · 구구단 · 줄넘기' : '영어 · 줄넘기';
      showPopup(\`
        <div class="popup-emoji">🏆</div>
        <div class="popup-title">🎊 ${activityKeys.length}가지 다 완료! 🎊</div>
        <div class="popup-body">
          ${currentStudent.name} 학생, 오늘의 숙제<br>
          <b style="color:var(--green);font-size:16px;">${labelLine}</b><br>
          모두 완료했어요!<br><br>`;

module.exports = function gradeAwareHomeworkCheck(html, ctx) {
  html = mustReplace(html, OLD_RENDER_TODAY_STATUS, NEW_RENDER_TODAY_STATUS, '08b: renderTodayStatus grade-aware items');
  html = mustReplace(html, OLD_POPUP_ITEMS, NEW_POPUP_ITEMS, '08b: showTodayHomeworkPopup grade-aware items');
  html = mustReplace(html, OLD_POPUP_CELEBRATION_TEXT, NEW_POPUP_CELEBRATION_TEXT, '08b: popup celebration text dynamic count');
  html = mustReplace(html, OLD_POPUP_REMAINING_TEXT, NEW_POPUP_REMAINING_TEXT, '08b: popup remaining text dynamic count');
  html = mustReplace(html, OLD_CHECK_AFTER_ACTIVITY, NEW_CHECK_AFTER_ACTIVITY, '08b: checkHomeworkAfterActivity grade-aware');
  return html;
};
```

- [ ] **Step 2: Wire into build.js**

Add `require('./transforms/08b-grade-aware-homework-check'),` right after the `08-navigation` line.

- [ ] **Step 3: Add verify assertions**

```js
// Task 8b: grade-aware homework completion check (fixes review finding: 구구단 was silently excluded for 3학년)
check('renderTodayStatus includes 구구단 conditionally for grade 3', html.includes(`...(currentStudent.grade === 3 ? [{key: 'multiplication', label: '구구단', emoji: '🧮'}] : [])`));
check('showTodayHomeworkPopup includes 구구단 conditionally for grade 3', html.includes(`...(currentStudent.grade === 3 ? [{key: 'multiplication', label: '맛있는 구구단', emoji: '🧮'}] : [])`));
check('showTodayHomeworkPopup uses dynamic item count, not hardcoded 2', html.includes('if (doneCount === items.length) {') && !html.includes('if (doneCount === 2) {'));
check('checkHomeworkAfterActivity uses grade-aware activityKeys', html.includes(`const activityKeys = ['english', 'jumprope', ...(currentStudent.grade === 3 ? ['multiplication'] : [])];`));
```

- [ ] **Step 4: Run build + verify**

Run: `cd "Downloads/summerhomework" && node scripts/build.js && node scripts/verify.js`
Expected: all checks OK.

- [ ] **Step 5: Commit**

```bash
cd "Downloads/summerhomework"
git add scripts/
git commit -m "fix: make homework-completion check/popup/status grade-aware (구구단 for 3학년)"
```

---

### Task 9: Full build, manual smoke test, ship

**Files:**
- Modify: `Downloads/summerhomework/index.html` (overwritten with the final build output — this is the only task that touches it)
- Modify: `Downloads/summerhomework/.gitignore` (ignore `index.build.html` so it never gets committed as a stray duplicate of `index.html`)

- [ ] **Step 1: Ignore the scratch build output**

Read `Downloads/summerhomework/.gitignore` first, then append (create the file if it doesn't already list this):

```
index.build.html
```

- [ ] **Step 2: Run the full pipeline one more time from a clean state**

Run:
```bash
cd "Downloads/summerhomework"
node scripts/build.js
node scripts/verify.js
```
Expected: `Build complete: .../index.build.html (~11-12 MB)` then every check from Tasks 1–8 prints `OK` and the script ends with `All checks passed.`

- [ ] **Step 3: Serve the build output locally and smoke-test in a real browser**

Run (background):
```bash
cd "Downloads/summerhomework"
python -m http.server 8765
```
Open `http://localhost:8765/index.build.html` in a browser (Firebase calls work fine from `localhost`, unlike `file://`). Walk through, and note pass/fail for each:

1. Grade picker shows exactly 4 grade buttons (3/4/5/6) + "반 친구들 기록 보기" + 4 teacher-login buttons + small "🔐 전체 관리자" button.
2. Pick 3학년 → student list shows the 5 existing students → log in as one (existing password) → menu shows **3 cards**: 맛있는 영어, 맛있는 구구단, 줄넘기 급수제 (+ 내 기록 보기), AND the "오늘의 숙제 현황" row at the top shows 3 items (영어/구구단/줄넘기), not 2 — complete all 3 for this student and confirm the "🎊 3가지 다 완료!" celebration fires (not after only 2).
3. From that 3학년 menu, tap 맛있는 영어 → confirm it loads **3학년 단원만** (no internal 학년 선택 screen shown, no 4학년 option visible).
4. Tap 🏠 메뉴 to go back — confirm it returns to the 3학년 menu (still showing the 구구단 card), not the grade picker.
5. Tap 맛있는 구구단 → confirms it opens and a "뒤로"/메뉴 button returns correctly to the menu.
6. Tap 👥 처음 → confirm it returns all the way to the 4-grade picker (not just the 3학년 student list).
7. Pick 4학년 → student list shows the 9 new students (첨부 명단과 일치) → log in as one (password from Task 2's table, e.g. 구민준=`0101`) → menu shows **2 cards only** (영어, 줄넘기 — no 구구단 card).
8. Tap 맛있는 영어 as a 4학년 student → confirm it loads **4학년 단원만**.
9. Repeat steps 7–8 for a 5학년 and a 6학년 student (existing rosters) → confirm 2-card menu, correct-grade English content, no regression from before the merge.
10. From the grade picker, tap "👥 반 친구들 기록 보기" → confirm 4 tabs (3/4/5/6) appear, 구구단 순위 panel appears only under the 3학년 tab, switching tabs updates the rankings.
11. Tap "🔑 3학년 선생님 로그인" → log in with `260301` → confirm dashboard shows only 3학년 students, includes a 구구단 column in 오늘 현황, and "선생님" header badge reads "3학년 선생님". Change the 3학년 담임 비밀번호, log out (👥 처음), log back in with the new password to confirm it stuck.
12. Tap "🔑 5학년 선생님 로그인" → log in with `2026` → confirm dashboard shows only 5학년 students (not 6학년), no 구구단 column, and that changing the 5학년 password does **not** change what `2026` unlocks on the 6학년 button.
13. Tap "🔐 전체 관리자" → log in with `9999` → confirm all 4 grades' student passwords are visible (grouped by grade) and all 4 teacher passwords are visible/editable, and that there is **no** 오늘 현황/전체 현황/스트릭 table on this screen. Change one student's password from the admin screen, then confirm that student can log in with the new password from the grade picker.
14. As a 3학년 teacher, click "전체 초기화" on a throwaway test record → confirm only 3학년 records/jump-rope entries are removed and 4·5·6학년 data is untouched (check via 반 친구들 보기 before/after).

Record the outcome of each numbered check.

- [ ] **Step 4: Fix any failures found in Step 3**

If a check fails, identify which task's transform is responsible (the task list in this plan maps 1:1 to functional areas), fix the transform's source code (not the generated output), re-run Step 2, and re-test the specific failing scenario from Step 3.

- [ ] **Step 5: Ship — copy the verified build over index.html**

Only after every Step 3 check passes:

```bash
cd "Downloads/summerhomework"
cp index.build.html index.html
git add index.html .gitignore
git commit -m "feat: merge 3/4/5/6학년 방학 학습장 into a single site with per-grade teacher logins and a super-admin"
```

- [ ] **Step 6: Push**

Confirm with the user before pushing (this goes live on GitHub Pages immediately). Once confirmed:

```bash
cd "Downloads/summerhomework"
git push origin main
```

Expected: `https://imzerguser-cpu.github.io/summerhomework/` serves the merged 4-grade site within a few minutes (GitHub Pages build time).
