// 오디오 녹음 및 서버 전송 기능
document.addEventListener("DOMContentLoaded", function () {
    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;
    let stream;

    const recordButton = document.getElementById("recordButton");
    const transcriptionResult = document.getElementById("transcriptionResult");

    if (recordButton) {
        recordButton.onclick = async () => {
            if (!isRecording) {
                // 녹음 시작
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);

                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.start();
                isRecording = true;
                recordButton.innerText = "Stop Recording";
            } else {
                // 녹음 중지
                mediaRecorder.stop();
                isRecording = false;
                recordButton.innerText = "Start Recording";

                // 마이크 중지
                stream.getTracks().forEach((track) => track.stop());

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
                    audioChunks = [];

                    const formData = new FormData();
                    formData.append("file", audioBlob, "recording.wav");

                    // 서버로 오디오 파일 보내기
                    const response = await fetch("/upload", {
                        method: "POST",
                        body: formData,
                    });
                    const result = await response.json();

                    // 결과를 텍스트로 출력하기 
                    transcriptionResult.innerText = result.transcribed_text || "No transcription received";
                };
            }
        };
    } else {
        console.error("recordButton 요소를 찾을 수 없습니다.");
    }
});

// 캘린더 부분
$(document).ready(function () {
    calendarInit();
});

function calendarInit() {
    // 날짜 정보 가져오기
    var date = new Date(); // 현재 날짜(로컬 기준) 가져오기
    var utc = date.getTime() + (date.getTimezoneOffset() * 60 * 1000); // utc 표준시 도출
    var kstGap = 9 * 60 * 60 * 1000; // 한국 kst 기준시간 더하기
    var today = new Date(utc + kstGap); // 한국 시간으로 date 객체 만들기(오늘)

    var thisMonth = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    // 달력에서 표기하는 날짜 객체

    var currentYear = thisMonth.getFullYear(); // 달력에서 표기하는 연
    var currentMonth = thisMonth.getMonth(); // 달력에서 표기하는 월
    var currentDate = thisMonth.getDate(); // 달력에서 표기하는 일

    // 캘린더 렌더링
    renderCalender(thisMonth);

    function renderCalender(thisMonth) {
        // 렌더링을 위한 데이터 정리
        currentYear = thisMonth.getFullYear();
        currentMonth = thisMonth.getMonth();
        currentDate = thisMonth.getDate();

        // 이전 달의 마지막 날 날짜와 요일 구하기
        var startDay = new Date(currentYear, currentMonth, 0);
        var prevDate = startDay.getDate();
        var prevDay = (startDay.getDay() + 1) % 7;

        // 이번 달의 마지막날 날짜와 요일 구하기
        var endDay = new Date(currentYear, currentMonth + 1, 0);
        var nextDate = endDay.getDate();
        var nextDay = endDay.getDay();

        // 현재 월 표기
        $('.year-month').text(currentYear + '.' + (currentMonth + 1));

        // 렌더링 html 요소 생성
        const calendar = document.querySelector('.dates');
        if (calendar) {
            calendar.innerHTML = '';

            // 지난달
            for (var i = prevDate - prevDay + 1; i <= prevDate; i++) {
                calendar.innerHTML += '<div class="day prev disable">' + i + '</div>';
            }
            // 이번달
            for (var i = 1; i <= nextDate; i++) {
                calendar.innerHTML += '<div class="day current">' + i + '</div>';
            }
            // 다음달
            for (var i = 1; i <= (7 - nextDay === 7 ? 0 : 7 - nextDay); i++) {
                calendar.innerHTML += '<div class="day next disable">' + i + '</div>';
            }

            // 오늘 날짜 표기
            if (today.getMonth() === currentMonth) {
                const todayDate = today.getDate();
                const currentMonthDate = document.querySelectorAll('.dates .current');
                if (currentMonthDate[todayDate - 1]) {
                    currentMonthDate[todayDate - 1].classList.add('today');
                }
            }
        } else {
            console.error("Calendar element not found!");
        }
    }

    // 이전달로 이동
    $('.go-prev').on('click', function () {
        thisMonth = new Date(currentYear, currentMonth - 1, 1);
        renderCalender(thisMonth);
    });

    // 다음달로 이동
    $('.go-next').on('click', function () {
        thisMonth = new Date(currentYear, currentMonth + 1, 1);
        renderCalender(thisMonth);
    });
}

// 24.10.31
document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and parsed.");

    // 결과 문자열에서 날짜와 감정 정보를 추출하는 함수
    function parseSentimentAnalysisResult(resultText) {
        console.log("Parsing result text:", resultText);

        const datePattern = /(\d{1,2})월\s*(\d{1,2})일/;  // 날짜 추출 정규표현식
        const dateMatch = resultText.match(datePattern);

        // 날짜가 추출되면 긍정으로 인식
        let sentiment = null;
        if (dateMatch || /먹었어|복용했어/.test(resultText)) {
            sentiment = "Positive";
        }

        // 날짜와 감정 정보 반환
        return {
            month: dateMatch ? parseInt(dateMatch[1], 10) : null,
            day: dateMatch ? parseInt(dateMatch[2], 10) : null,
            sentiment: sentiment
        };
    }


    // 캘린더에 이모티콘을 추가하는 함수
    function addEmojiToCalendar(resultText) {
        const extractedData = parseSentimentAnalysisResult(resultText);

        if (!extractedData) {
            console.warn("No date or sentiment extracted; cannot add emoji to calendar.");
            return;
        }

        // 긍정/부정 결과에 따른 이모티콘 결정
        const emoji = extractedData.sentiment === "Positive" ? "😊" : "😞";
        console.log(`Adding emoji for sentiment: ${extractedData.sentiment}, Emoji: ${emoji}`);

        // 캘린더에서 해당 월과 일에 맞는 요소를 찾아 이모티콘 추가
        const dateElements = document.querySelectorAll('.dates .day.current');
        let dateFound = false;

        dateElements.forEach((element) => {
            const dayInCalendar = parseInt(element.textContent, 10);
            const currentMonth = new Date().getMonth() + 1;

            if (dayInCalendar === extractedData.day && currentMonth === extractedData.month) {
                console.log(`Adding emoji to ${extractedData.month}월 ${extractedData.day}일.`);
                element.innerHTML += ` ${emoji}`;
                dateFound = true;
            }
        });

        if (!dateFound) {
            console.warn(`No matching date element found for ${extractedData.month}월 ${extractedData.day}일`);
        }
    }

    // 확인 버튼 클릭 시 이모티콘을 추가하는 함수 실행
    const confirmButton = document.getElementById("confirmButton");
    if (confirmButton) {
        confirmButton.addEventListener("click", () => {
            console.log("Confirm button clicked.");
            const resultText = document.getElementById("transcriptionResult").innerText;
            addEmojiToCalendar(resultText);
        });
    } else {
        console.error("confirmButton 요소를 찾을 수 없습니다.");
    }
});

// 부정일때 모달
document.addEventListener("DOMContentLoaded", function () {
    const confirmButton = document.getElementById("confirmButton");

    // 서버에서 가져온 긍정/부정 결과 예시 (실제 데이터에 따라 설정 필요)
    let result = "Positive";  // 이 값을 실제 서버의 응답으로 동적으로 설정하세요

    // 확인 버튼 클릭 시 모달 생성 및 표시
    confirmButton.addEventListener("click", () => {
        // 부정일 때만 모달 표시
        if (result === "Negative") {
            // 모달 요소 생성
            const modal = document.createElement("div");
            modal.id = "modal";
            modal.style.display = "flex"; // 모달을 보여주기 위해 flex로 설정
            modal.style.position = "fixed";
            modal.style.top = "0";
            modal.style.left = "0";
            modal.style.width = "100%";
            modal.style.height = "100%";
            modal.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
            modal.style.justifyContent = "center";
            modal.style.alignItems = "center";
            document.body.appendChild(modal);

            // 모달 내용 생성
            const modalContent = document.createElement("div");
            modalContent.style.backgroundColor = "white";
            modalContent.style.padding = "20px";
            modalContent.style.borderRadius = "8px";
            modalContent.style.textAlign = "center";
            modal.appendChild(modalContent);

            // 모달 메시지 생성
            const modalMessage = document.createElement("p");
            modalMessage.innerText = "안 먹었어요";
            modalContent.appendChild(modalMessage);

            // 모달 닫기 버튼 생성
            const closeModalButton = document.createElement("button");
            closeModalButton.innerText = "닫기";
            closeModalButton.style.marginTop = "10px";
            closeModalButton.onclick = () => {
                modal.style.display = "none"; // 모달을 닫기 위해 display를 none으로 설정
                document.body.removeChild(modal); // 모달 요소 제거
            };
            modalContent.appendChild(closeModalButton);
        }
    });
});
