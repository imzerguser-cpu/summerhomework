/**
 * 3학년 1반 여름방학 숙제 통합 데이터 동기화 트래커 엔진 (homework-tracker.js)
 * 이 단일 파일을 english.html, math.html, jumprope.html 하단에 연동해두면
 * 어떠한 핵심 퀴즈 코드 변경 없이 학생 세션을 감지하고 공부 데이터를 완벽하게 집계 저장합니다.
 */
document.addEventListener("DOMContentLoaded", function() {
    // 1. URL 쿼리 파라미터 파싱 및 세션 상태 검증 (?student=학생이름)
    const urlParams = new URLSearchParams(window.location.search);
    const studentName = urlParams.get('student');
    if (!studentName) return; // 미로그인 다이렉트 접근 차단 가드

    // 2. 상단 고정 네비게이션 대시보드 복귀 유틸 바 생성 주입
    const topBar = document.createElement('div');
    topBar.style = "background:#ffffff; padding:12px 20px; box-shadow:0 3px 12px rgba(0,0,0,0.08); display:flex; justify-content:space-between; align-items:center; font-family:'Malgun Gothic', sans-serif; border-bottom:4px solid #4A7CFF; position:sticky; top:0; z-index:99999;";
    topBar.innerHTML = `
        <div style="font-weight:bold; color:#2d3748; font-size:15px;">
            👤 현재 학생: <span style="color:#4A7CFF; font-size:16px; font-weight:900;">${studentName}</span> 공부 및 연습 중
        </div>
        <button id="btn-back-to-dashboard" style="background:#4A7CFF; color:#ffffff; border:none; padding:8px 16px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:13px; transition: background 0.2s;">
            🏠 나의 숙제 홈 (달력)으로 돌아가기
        </button>
    `;
    document.body.insertBefore(topBar, document.body.firstChild);
    
    document.getElementById("btn-back-to-dashboard").onclick = function() {
        location.href = 'index.html?student=' + encodeURIComponent(studentName);
    };

    // 오늘 날짜 구하기 (타임존 오프셋 처리 보정)
    function getTodayString() {
        const d = new Date();
        const offset = d.getTimezoneOffset() * 60000;
        const localTime = new Date(d.getTime() - offset);
        return localTime.toISOString().split('T')[0];
    }

    // 3. 영어(english.html) 및 수학(math.html) 퀴즈 최종 완료 결과 자동 감지 리스너 루프
    if (window.location.pathname.includes('english.html') || window.location.pathname.includes('math.html')) {
        const checkInterval = setInterval(() => {
            const resultScreen = document.getElementById('screen-result');
            
            // 결과 창이 노출되었고 hidden 클래스가 해제되었을 때 판독 시작
            if (resultScreen && !resultScreen.classList.contains('hidden')) {
                const scoreEl = document.getElementById('resultScore');
                const totalEl = document.getElementById('resultTotal');
                
                if (scoreEl && totalEl) {
                    const score = parseInt(scoreEl.textContent) || 0;
                    const total = parseInt(totalEl.textContent) || 0;
                    
                    let db = JSON.parse(localStorage.getItem("homeworkData")) || { students: {} };
                    if (!db.students[studentName]) db.students[studentName] = { password: "1111", records: {} };
                    
                    const todayStr = getTodayString();
                    if (!db.students[studentName].records[todayStr]) db.students[studentName].records[todayStr] = {};
                    
                    const isEnglish = window.location.pathname.includes('english.html');
                    const subjectKey = isEnglish ? 'english' : 'math';
                    
                    if (!db.students[studentName].records[todayStr][subjectKey]) {
                        db.students[studentName].records[todayStr][subjectKey] = { count: 0, score: 0 };
                    }
                    
                    // 문제 해결 카운트 누적 및 백분율 변환 최고 정확도 점수 업데이트
                    db.students[studentName].records[todayStr][subjectKey].count += total;
                    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
                    db.students[studentName].records[todayStr][subjectKey].score = Math.max(db.students[studentName].records[todayStr][subjectKey].score || 0, percentage);
                    
                    localStorage.setItem("homeworkData", JSON.stringify(db));
                    clearInterval(checkInterval); // 중복 커밋 방지 세션 프리징
                    
                    // 완료 완료 안내 녹색 확인 피드백 배너 프론트에 동적 주입
                    const alertBanner = document.createElement('div');
                    alertBanner.style = "background:#38a169; color:#fff; text-align:center; padding:12px; margin:15px 0; border-radius:10px; font-weight:bold; font-size:14px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);";
                    alertBanner.textContent = `🎉 방학 숙제 기록이 안전하게 전송되었습니다! (푼 문제 수: ${total}개 / 성적: ${percentage}점)`;
                    resultScreen.insertBefore(alertBanner, resultScreen.firstChild);
                }
            }
        }, 1000);
    }

    // 4. 줄넘기(jumprope.html) 급수 계산기 맞춤형 다이렉트 기록 패널 컴포넌트 자동 주입
    if (window.location.pathname.includes('jumprope.html')) {
        const jbPanel = document.createElement('div');
        jbPanel.style = "background:#f7fafc; padding:16px 20px; border:2px solid #e2e8f0; margin:20px 15px; border-radius:14px; font-family:'Malgun Gothic', sans-serif; box-shadow:0 4px 6px rgba(0,0,0,0.02);";
        jbPanel.innerHTML = `
            <h3 style="margin-top:0; font-size:15px; color:#2b6cb0; margin-bottom:12px;">🏃 ${studentName} 학생 전용 오늘 줄넘기 연습량 기록 보드</h3>
            <div style="display:flex; flex-wrap:wrap; gap:12px; align-items:center; font-size:14px;">
                <label><b>🎯 오늘 달성 급수 :</b></label>
                <select id="select-ju-grade" style="padding:6px 10px; border-radius:6px; border:1px solid #cbd5e0; font-weight:bold; color:#4a5568;">
                    ${[10,9,8,7,6,5,4,3,2,1].map(g => `<option value="${g}급">${g}급</option>`).join('')}
                </select>
                <label style="margin-left:8px;"><b>🔢 연습한 횟수(회) :</b></label>
                <input type="number" id="input-ju-count" value="100" min="1" style="width:70px; padding:6px; border:1px solid #cbd5e0; border-radius:6px; text-align:center; font-weight:bold;">
                <button id="btn-save-jumprope-direct" style="background:#38a169; color:#fff; border:none; padding:7px 15px; border-radius:6px; font-weight:bold; cursor:pointer; transition:background 0.2s;">기록 저장하기</button>
            </div>
            <div id="ju-save-success-msg" style="margin-top:10px; color:#38a169; font-weight:bold; display:none; font-size:13px;"></div>
        `;
        
        // 메인 타이틀 아래 영역 배치 서칭 최적화
        const mainHeader = document.querySelector('.hd') || document.querySelector('header');
        if (mainHeader) {
            mainHeader.after(jbPanel);
        } else {
            document.body.insertBefore(jbPanel, topBar.nextSibling);
        }

        // 줄넘기 수동 저장 이벤트 핸들러 리스너 바인딩
        document.getElementById("btn-save-jumprope-direct").onclick = function() {
            const selectedGrade = document.getElementById("select-ju-grade").value;
            const attemptCount = parseInt(document.getElementById("input-ju-count").value) || 0;
            
            if(attemptCount <= 0) return alert("연습 횟수는 1회 이상 기재해야 합니다.");
            
            let db = JSON.parse(localStorage.getItem("homeworkData")) || { students: {} };
            if (!db.students[studentName]) db.students[studentName] = { password: "1111", records: {} };
            
            const todayStr = getTodayString();
            if (!db.students[studentName].records[todayStr]) db.students[studentName].records[todayStr] = {};
            if (!db.students[studentName].records[todayStr].jumprope) {
                db.students[studentName].records[todayStr].jumprope = { count: 0, grade: "" };
            }
            
            db.students[studentName].records[todayStr].jumprope.count += attemptCount;
            db.students[studentName].records[todayStr].jumprope.grade = selectedGrade;
            
            localStorage.setItem("homeworkData", JSON.stringify(db));
            
            const msgBox = document.getElementById("ju-save-success-msg");
            msgBox.style.display = "block";
            msgBox.textContent = `✅ 저장 성공! 오늘 누적 줄넘기 연습량: 총 ${db.students[studentName].records[todayStr].jumprope.count}회 (${selectedGrade})`;
            setTimeout(() => { msgBox.style.display = "none"; }, 3500);
        };
    }
});
