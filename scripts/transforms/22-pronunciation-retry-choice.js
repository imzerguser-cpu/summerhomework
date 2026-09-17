'use strict';
const { mustReplace, extractBetween } = require('../lib/extract');

// 사용자 요청: 발음 연습에서 같은 문제를 3번 연속 틀리면 무한 반복하는 대신,
// "다음 문제로 넘어가기" / "조금 더 연습하기" 중 하나를 고르게 함.
// 3·4학년 엔진(quizDocTemplate34)과 5·6학년 엔진(quizDocTemplate56)의
// state/renderQuestion/markResult/액션 버튼 마크업이 이 시점까지는 완전히 동일하므로
// (20/21번 트랜스폼은 checkAnswer만 건드림), 같은 OLD/NEW 쌍을 두 템플릿 각각의
// 범위 안에서 독립적으로 적용한다.

const OLD_STATE = "let state = {\n  currentGrade:null,\n  currentUnit:null,\n  modeId:null,\n  pool:[],\n  idx:0,\n  score:0,\n  answered:false,\n  recognizing:false,\n  usingText:false,\n  micBlocked:false,\n};";
const NEW_STATE = "let state = {\n  currentGrade:null,\n  currentUnit:null,\n  modeId:null,\n  pool:[],\n  idx:0,\n  score:0,\n  answered:false,\n  recognizing:false,\n  usingText:false,\n  micBlocked:false,\n  wrongCount:0,\n};";

const OLD_ACTIONROW = "        <div class=\"actionrow\">\n          <button class=\"btn ghost\" id=\"showAnswerBtn\">정답 보기</button>\n          <button class=\"btn next\" id=\"nextBtn\" disabled>다음 →</button>\n        </div>\n        <div class=\"notice hidden\" id=\"micNotice\">이 브라우저는 음성 인식을 지원하지 않아요. 텍스트로 입력해서 연습해보세요!</div>";
const NEW_ACTIONROW = "        <div class=\"actionrow\" id=\"actionRow\">\n          <button class=\"btn ghost\" id=\"showAnswerBtn\">정답 보기</button>\n          <button class=\"btn next\" id=\"nextBtn\" disabled>다음 →</button>\n        </div>\n        <div class=\"actionrow hidden\" id=\"retryChoice\">\n          <button class=\"btn ghost\" id=\"choiceMoreBtn\">🔁 조금 더 연습하기</button>\n          <button class=\"btn next\" id=\"choiceNextBtn\">다음 문제로 →</button>\n        </div>\n        <div class=\"notice hidden\" id=\"micNotice\">이 브라우저는 음성 인식을 지원하지 않아요. 텍스트로 입력해서 연습해보세요!</div>";

const OLD_DOM_REFS = "const micNotice = document.getElementById('micNotice');\nconst micRow = document.getElementById('micRow');";
const NEW_DOM_REFS = "const micNotice = document.getElementById('micNotice');\nconst micRow = document.getElementById('micRow');\nconst actionRow = document.getElementById('actionRow');\nconst retryChoice = document.getElementById('retryChoice');\nconst choiceMoreBtn = document.getElementById('choiceMoreBtn');\nconst choiceNextBtn = document.getElementById('choiceNextBtn');";

const OLD_RENDER_HEAD = "function renderQuestion(){\n  stopAllAudio();\n  state.answered = false;\n  transcriptEl.textContent = '';";
const NEW_RENDER_HEAD = "function renderQuestion(){\n  stopAllAudio();\n  state.answered = false;\n  state.wrongCount = 0;\n  setChoiceMode(false);\n  transcriptEl.textContent = '';";

const OLD_MARK_RESULT = "function markResult(isCorrect, transcript){\n  state.answered = true;\n  nextBtn.disabled = false;\n  const item = currentItem();\n  if(isCorrect){\n    state.score++;\n    scoreText.textContent = state.score;\n    feedbackEl.className = 'feedback correct';\n    feedbackEl.innerHTML = '🎉 정답이에요!';\n    micLabel.textContent = '정답이에요! 다음으로 넘어가볼까요?';\n    spawnFloatBadge('✨');\n  } else {\n    feedbackEl.className = 'feedback wrong';\n    feedbackEl.innerHTML = `아직이에요! 정답 발음을 듣고 다시 따라 말해보세요.<span class=\"answer-reveal\">정답: ${item.target}</span>`;\n    setTimeout(()=>{\n      playItemAudio(item, ()=>{ micLabel.textContent = '이제 마이크를 눌러 다시 따라 말해보세요'; });\n    }, 350);\n  }\n}";
const NEW_MARK_RESULT = "function setChoiceMode(active){\n  retryChoice.classList.toggle('hidden', !active);\n  actionRow.classList.toggle('hidden', active);\n  toggleTextBtn.classList.toggle('hidden', active);\n  if(recognitionSupported) micRow.classList.toggle('hidden', active);\n  if(active) textFallback.classList.add('hidden');\n}\n\nfunction markResult(isCorrect, transcript){\n  state.answered = true;\n  nextBtn.disabled = false;\n  const item = currentItem();\n  if(isCorrect){\n    state.score++;\n    scoreText.textContent = state.score;\n    feedbackEl.className = 'feedback correct';\n    feedbackEl.innerHTML = '🎉 정답이에요!';\n    micLabel.textContent = '정답이에요! 다음으로 넘어가볼까요?';\n    spawnFloatBadge('✨');\n  } else {\n    state.wrongCount++;\n    feedbackEl.className = 'feedback wrong';\n    if(state.wrongCount >= 3){\n      feedbackEl.innerHTML = `😅 3번 틀렸어요! 다음으로 넘어갈까요, 조금 더 연습해볼까요?<span class=\"answer-reveal\">정답: ${item.target}</span>`;\n      setChoiceMode(true);\n      setTimeout(()=>{ playItemAudio(item, ()=>{}); }, 350);\n    } else {\n      feedbackEl.innerHTML = `아직이에요! (${state.wrongCount}/3번째 시도) 정답 발음을 듣고 다시 따라 말해보세요.<span class=\"answer-reveal\">정답: ${item.target}</span>`;\n      setTimeout(()=>{\n        playItemAudio(item, ()=>{ micLabel.textContent = '이제 마이크를 눌러 다시 따라 말해보세요'; });\n      }, 350);\n    }\n  }\n}\n\nchoiceNextBtn.addEventListener('click', goNext);\nchoiceMoreBtn.addEventListener('click', ()=>{\n  renderQuestion();\n  playItemAudio(currentItem(), ()=>{ micLabel.textContent = '이제 마이크를 눌러 다시 따라 말해보세요'; });\n});";

function patchEngine(html, templateOpenTag, label) {
  const inner = extractBetween(html, templateOpenTag, '</script>', `22: ${label} template extraction`);
  let patched = inner;
  patched = mustReplace(patched, OLD_STATE, NEW_STATE, `22: ${label} state.wrongCount`);
  patched = mustReplace(patched, OLD_ACTIONROW, NEW_ACTIONROW, `22: ${label} retry-choice buttons`);
  patched = mustReplace(patched, OLD_DOM_REFS, NEW_DOM_REFS, `22: ${label} retry-choice DOM refs`);
  patched = mustReplace(patched, OLD_RENDER_HEAD, NEW_RENDER_HEAD, `22: ${label} renderQuestion reset`);
  patched = mustReplace(patched, OLD_MARK_RESULT, NEW_MARK_RESULT, `22: ${label} markResult + choice handlers`);

  const startIdx = html.indexOf(templateOpenTag);
  const contentStart = startIdx + templateOpenTag.length;
  const endIdx = html.indexOf('</script>', contentStart);
  return html.slice(0, contentStart) + patched + html.slice(endIdx);
}

module.exports = function pronunciationRetryChoice(html, ctx) {
  html = patchEngine(html, '<script type="text/html" id="quizDocTemplate34">', '3/4학년');
  html = patchEngine(html, '<script type="text/html" id="quizDocTemplate56">', '5/6학년');
  return html;
};
