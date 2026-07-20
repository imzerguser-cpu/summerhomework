'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Build inputs live under scripts/sources/ (committed, immutable) rather than at the repo
// root, because the repo root's index.html IS the build's deploy target: once index.html
// is overwritten with the merged output, re-reading it as the 3학년 extraction source would
// crash every subsequent build. index56-base.html/index3-base.html are frozen snapshots of
// the two pre-merge sites this pipeline was originally built from.
const base = fs.readFileSync(path.join(ROOT, 'scripts/sources/index56-base.html'), 'utf8');
const src3 = fs.readFileSync(path.join(ROOT, 'scripts/sources/index3-base.html'), 'utf8');
const ctx = { src3 };

// Order matters: 02 deliberately leaves the teacher "전체 초기화" button's bare recordsRef
// call unpatched for 05 to finish (see 02-students-and-firebase.js's comment); 03 must run
// before 08's showScreen rewrite since 08's OLD_SHOW_SCREEN marker expects 03's
// updateMenuCardsForGrade() hook already appended. Do not reorder without re-checking both.
const transforms = [
  require('./transforms/01-grade-picker'),
  require('./transforms/02-students-and-firebase'),
  require('./transforms/03-multiplication-module'),
  require('./transforms/04-english-engine-routing'),
  require('./transforms/05-teacher-login-and-dashboard'),
  require('./transforms/06-admin'),
  require('./transforms/07-class-ranking-tabs'),
  require('./transforms/08-navigation'),
  require('./transforms/08b-grade-aware-homework-check'),
  require('./transforms/09-post-launch-fixes'),
  require('./transforms/10-hide-brand-on-first-screen'),
  require('./transforms/12-shrink-teacher-login-buttons'),
  require('./transforms/13-teacher-buttons-own-row'),
  require('./transforms/14-remove-grade-picker-subtitle'),
];

let html = base;
for (const transform of transforms) {
  html = transform(html, ctx);
}

const outPath = path.join(ROOT, 'index.build.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log('Build complete:', outPath, '(' + (html.length / 1024 / 1024).toFixed(2) + ' MB)');
