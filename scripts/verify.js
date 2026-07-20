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

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log('\nAll checks passed.');
}
