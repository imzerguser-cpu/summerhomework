'use strict';
const { mustReplace } = require('../lib/extract');

// 사용자 요청: 1음절 영어/한국어 단어 음성인식률 개선 (3·4학년 엔진).
// 엔진 B(5·6학년)에는 있지만 엔진 A(3·4학년)에는 없던 음절수 추정(countSyllables)을
// 추가해서, 철자가 4글자를 넘는 1음절 단어(friend, great, thought 등)도 짧은 단어와
// 같은 폭넓은 허용 범위를 받도록 함. 한국어 쪽은 아주 짧은(2글자 이하) 단어의
// bigram 임계값을 살짝 낮춤.
const OLD_CHECK_ANSWER = `function checkAnswer(transcript, item, lang){
  const target = item.target;
  if(lang==='ko-KR'){
    const nt = normalizeKo(transcript);
    if(!nt) return false;
    let cands = [];
    if(item && item.koAccept && item.koAccept.length){
      item.koAccept.forEach(a=>{ cands = cands.concat(koTargetVariants(a)); });
    } else {
      cands = koTargetVariants(target);
    }
    for(const v of cands){
      const ng = normalizeKo(v);
      if(!ng) continue;
      if(nt===ng) return true;
      if(koSynonymMatch(nt,ng)) return true;
      if(nt.includes(ng) || ng.includes(nt)) return true;
      if(koSemanticMatch(transcript, v)) return true;
      if(bigramDice(nt,ng) >= 0.4) return true;
    }
    return false;
  } else {
    const nt = normalizeEn(transcript);
    const ng = normalizeEn(target);
    const wc = ng.split(' ').filter(Boolean).length;
    if(wc<=2){
      if(nt===ng) return true;
      if(nt.includes(ng) || ng.includes(nt)) return true;
      const tokens = nt.split(' ').filter(Boolean);
      const cands = tokens.concat([nt]);
      if(homophoneMatch(ng, nt)) return true;
      if(cands.some(tok=>homophoneMatch(ng, tok) || homophoneMatch(tok, ng))) return true;
      if(ng.length<=4){
        for(const tok of cands){
          if(!tok) continue;
          if(tok===ng || tok.includes(ng) || ng.includes(tok)) return true;
          if(shortEditClose(tok, ng)) return true;
          if(bigramDice(tok, ng) >= 0.34) return true;
          if(tok[0]===ng[0] && Math.abs(tok.length-ng.length)<=2 && bigramDice(tok,ng)>=0.25) return true;
          if(ng.length>=2 && tok.length>=2 && tok[0]===ng[0] && tok[tok.length-1]===ng[ng.length-1] && Math.abs(tok.length-ng.length)<=1) return true;
        }
      } else {
        if(bigramDice(nt, ng) >= 0.5) return true;
        if(tokens.some(tok=>bigramDice(tok, ng) >= 0.55)) return true;
        if(tokens.some(tok=>shortEditClose(tok, ng))) return true;
      }
      if(tokenOverlapRatio(nt,ng) >= 0.8) return true;
      return false;
    }
    return tokenOverlapRatio(nt, ng) >= 0.55;
  }
}`;

const NEW_CHECK_ANSWER = `// Rough syllable-count estimate (vowel-group count, with a silent-e adjustment).
// Used to widen the speech-matching margin for one-syllable words, since
// speech recognition tends to mis-hear these more than longer words.
function countSyllables(word){
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if(!w) return 0;
  const groups = w.match(/[aeiouy]+/g) || [];
  let count = groups.length;
  if(w.endsWith('e') && count > 1) count--;
  return Math.max(1, count);
}
function checkAnswer(transcript, item, lang){
  const target = item.target;
  if(lang==='ko-KR'){
    const nt = normalizeKo(transcript);
    if(!nt) return false;
    let cands = [];
    if(item && item.koAccept && item.koAccept.length){
      item.koAccept.forEach(a=>{ cands = cands.concat(koTargetVariants(a)); });
    } else {
      cands = koTargetVariants(target);
    }
    for(const v of cands){
      const ng = normalizeKo(v);
      if(!ng) continue;
      if(nt===ng) return true;
      if(koSynonymMatch(nt,ng)) return true;
      if(nt.includes(ng) || ng.includes(nt)) return true;
      if(koSemanticMatch(transcript, v)) return true;
      // Very short (1-2 syllable) Korean targets get a lower bar - fewer bigrams
      // means the score is noisier, and short utterances are where speech
      // recognition struggles most.
      const koThreshold = ng.length<=2 ? 0.3 : 0.4;
      if(bigramDice(nt,ng) >= koThreshold) return true;
    }
    return false;
  } else {
    const nt = normalizeEn(transcript);
    const ng = normalizeEn(target);
    const wc = ng.split(' ').filter(Boolean).length;
    if(wc<=2){
      if(nt===ng) return true;
      if(nt.includes(ng) || ng.includes(nt)) return true;
      const tokens = nt.split(' ').filter(Boolean);
      const cands = tokens.concat([nt]);
      if(homophoneMatch(ng, nt)) return true;
      if(cands.some(tok=>homophoneMatch(ng, tok) || homophoneMatch(tok, ng))) return true;
      if(ng.length<=4){
        for(const tok of cands){
          if(!tok) continue;
          if(tok===ng || tok.includes(ng) || ng.includes(tok)) return true;
          if(shortEditClose(tok, ng)) return true;
          if(bigramDice(tok, ng) >= 0.34) return true;
          if(tok[0]===ng[0] && Math.abs(tok.length-ng.length)<=2 && bigramDice(tok,ng)>=0.25) return true;
          if(ng.length>=2 && tok.length>=2 && tok[0]===ng[0] && tok[tok.length-1]===ng[ng.length-1] && Math.abs(tok.length-ng.length)<=1) return true;
        }
      } else if(wc===1 && countSyllables(ng)<=1){
        // One-syllable words longer than 4 letters (friend, great, thought...) still
        // get the wide margin - speech recognition struggles with short utterances
        // regardless of how long the spelling is.
        for(const tok of cands){
          if(!tok) continue;
          if(shortEditClose(tok, ng)) return true;
          if(bigramDice(tok, ng) >= 0.4) return true;
        }
      } else {
        if(bigramDice(nt, ng) >= 0.5) return true;
        if(tokens.some(tok=>bigramDice(tok, ng) >= 0.55)) return true;
        if(tokens.some(tok=>shortEditClose(tok, ng))) return true;
      }
      if(tokenOverlapRatio(nt,ng) >= 0.8) return true;
      return false;
    }
    return tokenOverlapRatio(nt, ng) >= 0.55;
  }
}`;

module.exports = function improveSpeechMatchingEngineA(html, ctx) {
  html = mustReplace(html, OLD_CHECK_ANSWER, NEW_CHECK_ANSWER, '20: engine A checkAnswer syllable-aware widening');
  return html;
};
