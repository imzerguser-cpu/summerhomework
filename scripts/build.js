'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const base = fs.readFileSync(path.join(ROOT, 'index56.html'), 'utf8');
const src3 = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const ctx = { src3 };

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
];

let html = base;
for (const transform of transforms) {
  html = transform(html, ctx);
}

const outPath = path.join(ROOT, 'index.build.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log('Build complete:', outPath, '(' + (html.length / 1024 / 1024).toFixed(2) + ' MB)');
