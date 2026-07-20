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

const OLD_POPUP_CELEBRATION_TEXT = `      <div class="popup-title">\${alreadyCelebrated ? '오늘도 최고예요!' : '2가지 다 완료했어요!'}</div>
      <div class="popup-body">
        \${currentStudent.name} 학생, 오늘의 숙제 2가지를 모두 끝냈어요!<br>`;
const NEW_POPUP_CELEBRATION_TEXT = `      <div class="popup-title">\${alreadyCelebrated ? '오늘도 최고예요!' : items.length + '가지 다 완료했어요!'}</div>
      <div class="popup-body">
        \${currentStudent.name} 학생, 오늘의 숙제 \${items.length}가지를 모두 끝냈어요!<br>`;

const OLD_POPUP_REMAINING_TEXT = `        오늘은 <b style="color:var(--red);">\${2 - doneCount}가지</b> 더 하면 완료예요!<br>`;
const NEW_POPUP_REMAINING_TEXT = `        오늘은 <b style="color:var(--red);">\${items.length - doneCount}가지</b> 더 하면 완료예요!<br>`;

const OLD_CHECK_AFTER_ACTIVITY = `function checkHomeworkAfterActivity() {
  if (!currentStudent) return;
  const acts = studentActivitiesOnDate(currentStudent.id, todayStr());
  const doneCount = ['english','jumprope'].filter(k => acts.has(k)).length;

  if (doneCount === 2) {
    const key = \`celebrated_\${currentStudent.id}_\${todayStr()}\`;
    if (!localStorage.getItem(key)) {
      // First time completing all 3 today - big celebration
      showPopup(\`
        <div class="popup-emoji">🏆</div>
        <div class="popup-title">🎊 2가지 다 완료! 🎊</div>
        <div class="popup-body">
          \${currentStudent.name} 학생, 오늘의 숙제<br>
          <b style="color:var(--green);font-size:16px;">영어 · 줄넘기</b><br>
          모두 완료했어요!<br><br>`;
const NEW_CHECK_AFTER_ACTIVITY = `function checkHomeworkAfterActivity() {
  if (!currentStudent) return;
  const acts = studentActivitiesOnDate(currentStudent.id, todayStr());
  const activityKeys = ['english', 'jumprope', ...(currentStudent.grade === 3 ? ['multiplication'] : [])];
  const doneCount = activityKeys.filter(k => acts.has(k)).length;

  if (doneCount === activityKeys.length) {
    const key = \`celebrated_\${currentStudent.id}_\${todayStr()}\`;
    if (!localStorage.getItem(key)) {
      // First time completing all today - big celebration
      const labelLine = currentStudent.grade === 3 ? '영어 · 구구단 · 줄넘기' : '영어 · 줄넘기';
      showPopup(\`
        <div class="popup-emoji">🏆</div>
        <div class="popup-title">🎊 \${activityKeys.length}가지 다 완료! 🎊</div>
        <div class="popup-body">
          \${currentStudent.name} 학생, 오늘의 숙제<br>
          <b style="color:var(--green);font-size:16px;">\${labelLine}</b><br>
          모두 완료했어요!<br><br>`;

module.exports = function gradeAwareHomeworkCheck(html, ctx) {
  html = mustReplace(html, OLD_RENDER_TODAY_STATUS, NEW_RENDER_TODAY_STATUS, '08b: renderTodayStatus grade-aware items');
  html = mustReplace(html, OLD_POPUP_ITEMS, NEW_POPUP_ITEMS, '08b: showTodayHomeworkPopup grade-aware items');
  html = mustReplace(html, OLD_POPUP_CELEBRATION_TEXT, NEW_POPUP_CELEBRATION_TEXT, '08b: popup celebration text dynamic count');
  html = mustReplace(html, OLD_POPUP_REMAINING_TEXT, NEW_POPUP_REMAINING_TEXT, '08b: popup remaining text dynamic count');
  html = mustReplace(html, OLD_CHECK_AFTER_ACTIVITY, NEW_CHECK_AFTER_ACTIVITY, '08b: checkHomeworkAfterActivity grade-aware');
  return html;
};
