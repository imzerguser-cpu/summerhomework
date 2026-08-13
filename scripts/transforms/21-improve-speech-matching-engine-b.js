'use strict';
const { mustReplace } = require('../lib/extract');

// 사용자 요청: 1음절 영어/한국어 단어 음성인식률 개선 (5·6학년 엔진).
// 엔진 A(3·4학년)에는 있지만 엔진 B(5·6학년)에는 없던 편집거리 기반 유사도
// (editDistance/shortEditClose)를 추가하고, 1음절 단어의 bigram 임계값을
// 0.5 -> 0.4로 낮춤. 한국어 쪽도 짧은 단어 임계값을 소폭 낮춤.
const OLD_CHECK_ANSWER = `function checkAnswer(transcript, item, lang){
  const target = item.target;
  if(lang==='ko-KR'){
    const nt = normalizeKo(transcript);
    const ng = normalizeKo(target);
    if(ng.length<=4){
      return nt.includes(ng) || ng.includes(nt);
    }
    return bigramDice(nt, ng) >= 0.45 || nt.includes(ng);
  } else {
    const nt = normalizeEn(transcript);
    const ng = normalizeEn(target);
    const wc = ng.split(' ').filter(Boolean).length;
    if(wc<=2){
      if(nt.includes(ng) || tokenOverlapRatio(nt,ng)>=0.9) return true;
      // For short words, also accept common homophones (do/due, to/too/two, ...)
      // and check word-by-word in case the utterance has extra filler words.
      const tokens = nt.split(' ').filter(Boolean);
      if(homophoneMatch(ng, nt)) return true;
      if(tokens.some(tok=>homophoneMatch(ng, tok) || homophoneMatch(tok, ng))) return true;
      // One-syllable words get an even wider margin: speech recognition
      // frequently mis-hears these, so accept a close phonetic match too.
      if(wc===1 && countSyllables(ng)<=1){
        return tokens.some(tok=>bigramDice(tok, ng) >= 0.5);
      }
      return false;
    }
    return tokenOverlapRatio(nt, ng) >= 0.55;
  }
}`;

const NEW_CHECK_ANSWER = `function editDistance(a,b){
  var m=a.length,n=b.length; if(!m) return n; if(!n) return m;
  var prev=[]; for(var j=0;j<=n;j++) prev[j]=j; var cur=new Array(n+1).fill(0);
  for(var i=1;i<=m;i++){ cur[0]=i; for(var j2=1;j2<=n;j2++){ cur[j2]=Math.min(prev[j2]+1,cur[j2-1]+1,prev[j2-1]+(a[i-1]===b[j2-1]?0:1)); } var tmp=prev; prev=cur; cur=tmp; }
  return prev[n];
}
function shortEditClose(a,b){ if(!a||!b) return false; var L=Math.max(a.length,b.length); var d=editDistance(a,b); if(L<=3) return d<=1; if(L<=5) return d<=2; return false; }
function checkAnswer(transcript, item, lang){
  const target = item.target;
  if(lang==='ko-KR'){
    const nt = normalizeKo(transcript);
    const ng = normalizeKo(target);
    if(ng.length<=4){
      return nt.includes(ng) || ng.includes(nt) || bigramDice(nt, ng) >= 0.3;
    }
    return bigramDice(nt, ng) >= 0.4 || nt.includes(ng);
  } else {
    const nt = normalizeEn(transcript);
    const ng = normalizeEn(target);
    const wc = ng.split(' ').filter(Boolean).length;
    if(wc<=2){
      if(nt.includes(ng) || tokenOverlapRatio(nt,ng)>=0.9) return true;
      // For short words, also accept common homophones (do/due, to/too/two, ...)
      // and check word-by-word in case the utterance has extra filler words.
      const tokens = nt.split(' ').filter(Boolean);
      if(homophoneMatch(ng, nt)) return true;
      if(tokens.some(tok=>homophoneMatch(ng, tok) || homophoneMatch(tok, ng))) return true;
      if(tokens.some(tok=>shortEditClose(tok, ng))) return true;
      // One-syllable words get an even wider margin: speech recognition
      // frequently mis-hears these, so accept a close phonetic match too.
      if(wc===1 && countSyllables(ng)<=1){
        return tokens.some(tok=>bigramDice(tok, ng) >= 0.4 || shortEditClose(tok, ng));
      }
      return false;
    }
    return tokenOverlapRatio(nt, ng) >= 0.55;
  }
}`;

module.exports = function improveSpeechMatchingEngineB(html, ctx) {
  html = mustReplace(html, OLD_CHECK_ANSWER, NEW_CHECK_ANSWER, '21: engine B checkAnswer edit-distance + threshold widening');
  return html;
};
