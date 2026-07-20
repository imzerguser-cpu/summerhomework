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

// Task 1: grade picker
check('4 grade buttons present', ['data-grade="3"', 'data-grade="4"', 'data-grade="5"', 'data-grade="6"'].every(s => html.includes(s)));
check('4 teacher login buttons present', [3, 4, 5, 6].every(g => html.includes(`id="teacherLoginBtn${g}"`)));
check('admin login button present', html.includes('id="adminLoginBtn"'));

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
check('no remaining bare recordsRef/passwordsRef usages', !/\brecordsRef\b(?!ForStudent)/.test(html) && !/\bpasswordsRef\b(?!ForStudent)/.test(html));

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log('\nAll checks passed.');
}
