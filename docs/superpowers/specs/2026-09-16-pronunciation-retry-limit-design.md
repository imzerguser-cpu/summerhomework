# 발음 연습 3회 오답 시 선택지 제공 - 설계

## 배경
발음 게임은 오답일 때 정답 발음을 들려주고 다시 마이크를 누르도록 유도할 뿐, 시도 횟수를 세거나 사용자가 넘어갈지 결정할 방법이 없었다. 아이가 계속 틀리면 사실상 끝없이 반복하게 된다.

## 목표
같은 문제에서 3번 연속 오답이면, 기존 입력 컨트롤(마이크/텍스트 입력/정답 보기/다음)을 잠그고 "다음 문제로 넘어가기" / "조금 더 연습하기" 두 버튼 중 하나를 고르게 한다.

## 적용 범위와 실제 배포 대상 (중요 정정)
루트의 `english.html`, `english56.html`은 한때 실제 소스였지만 각각 251a15b(Add files via upload 이후 삭제)로 git에서 지워진 죽은 로컬 파일이며, 어디서도 참조되지 않는다. 실제 배포되는 발음 엔진은 `index.html`(정적 배포 대상) 안에 두 개의 `<script type="text/html">` 템플릿으로 통째로 내장돼 있다:
- `#quizDocTemplate34` — 3·4학년 엔진, `scripts/sources/index3-base.html`이 원본
- `#quizDocTemplate56` — 5·6학년 엔진, `scripts/sources/index56-base.html`이 원본(=빌드 base)

빌드는 `node scripts/build.js`가 `scripts/sources/index56-base.html`을 base로, `scripts/sources/index3-base.html`을 3학년 엔진 추출용 소스로 읽어 `scripts/transforms/*.js`를 순서대로 적용하고 `index.build.html`을 생성한다(둘 다 "committed, immutable"이므로 base 파일을 직접 손대지 않는다). 완성되면 `index.build.html`을 `index.html`에 복사해 커밋하는 방식(예: 커밋 18e9ddb)이 기존 관행이다.

두 엔진의 `state`/`renderQuestion`/`markResult`/액션 버튼 마크업은 이 시점까지 완전히 동일(20/21번 트랜스폼은 `checkAnswer`만 건드림)하므로, 새 트랜스폼 `scripts/transforms/22-pronunciation-retry-choice.js`가 두 템플릿 각각의 범위 안에서 동일한 OLD/NEW 문자열 치환을 독립적으로 적용한다.

## 동작 설계

### 상태
- `state.wrongCount`를 추가. `renderQuestion()`에서 문제가 바뀔 때마다 0으로 초기화.

### 오답 처리 (`markResult`)
- 오답일 때마다 `state.wrongCount++`.
- `wrongCount < 3`: 기존 동작 그대로 — 피드백에 정답 발음 노출 + "(n/3번째 시도)" 문구 추가, 정답 오디오 재생 후 다시 마이크를 누르라고 안내.
- `wrongCount >= 3`: 선택 모드 진입.
  - 마이크 버튼 행(`#micRow`), 텍스트 입력 폴백(`#textFallback`, `#toggleText`), 기존 액션 행(`#showAnswerBtn`, `#nextBtn`)을 숨긴다.
  - 새 선택 패널(`#retryChoice`)을 보여준다: "다음 문제로 넘어가기"(`#choiceNextBtn`, 초록 계열), "조금 더 연습하기"(`#choiceMoreBtn`, 연한 계열) 버튼 2개.
  - 피드백 영역에 "3번 틀렸어요! 다음으로 넘어갈까요, 조금 더 연습해볼까요?" 안내.

### 선택 버튼 동작
- `#choiceNextBtn` 클릭 → 기존 `goNext()` 호출 (다음 문제로 이동, `renderQuestion()`이 `wrongCount`를 자동으로 0으로 리셋).
- `#choiceMoreBtn` 클릭 → `state.wrongCount = 0`으로 리셋, `#retryChoice` 숨기고 마이크/텍스트/액션 행 복원, 정답 오디오 재생 후 "이제 마이크를 눌러 다시 따라 말해보세요" 안내. 같은 문제에서 또 3번 틀리면 선택 패널이 다시 뜬다.

### 정답 처리
- 정답일 때는 기존 동작 그대로 유지 (변경 없음). `renderQuestion()`이 다음 문제 진입 시 `wrongCount`를 리셋하므로 별도 처리 불필요.

### UI/스타일
- 기존 `.btn`, `.btn.primary`, `.btn.ghost` 클래스를 재사용해 새 디자인 시스템을 만들지 않는다.
- `#retryChoice`는 기본 `hidden` 클래스로 숨겨두고, 선택 모드 진입 시에만 노출.

## 테스트 방법
- `node scripts/build.js`로 `index.build.html`을 생성하고 `node scripts/verify.js`로 기존 회귀 스위트가 통과하는지 확인.
- `index.build.html`(또는 복사된 `index.html`)에서 두 템플릿(`#quizDocTemplate34`, `#quizDocTemplate56`)을 각각 추출해 `@@ENDSCRIPT@@` 플레이스홀더를 `</script>`로 되돌린 뒤(런타임의 `loadEngQuizFrame`이 하는 것과 동일한 치환) 단독 HTML로 열어서 확인:
  - 한 단어를 일부러 3번 틀리게 답하면(텍스트 입력 폴백 사용) 선택 패널이 뜨는지.
  - "조금 더 연습하기" 클릭 후 다시 3번 틀렸을 때 선택 패널이 재노출되는지.
  - "다음 문제로 넘어가기" 클릭 시 정상적으로 다음 문제로 넘어가고 `wrongCount`가 리셋되는지.
  - 정답을 맞히는 기존 경로가 그대로 동작하는지(점수 증가, 선택 패널 미노출).
- 3·4학년 엔진과 5·6학년 엔진 양쪽 모두에서 위 시나리오를 반복.
