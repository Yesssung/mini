// 오디오 녹음 및 서버 전송 기능
document.addEventListener("DOMContentLoaded", function () {
  let mediaRecorder;
  let audioChunks = [];
  let isRecording = false;
  let stream;

  document.getElementById("recordButton").onclick = async () => {
    if (!isRecording) {
      // 녹음 시작
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.start();
      isRecording = true;
      document.getElementById("recordButton").innerText = "Stop Recording";
    } else {
      // 녹음 중지
      mediaRecorder.stop();
      isRecording = false;
      document.getElementById("recordButton").innerText = "Start Recording";

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
        document.getElementById("transcriptionResult").innerText =
          result.transcribed_text || "No transcription received";
      };
    }
  };
});




document.addEventListener("DOMContentLoaded", function() {
  const calendarEl = document.getElementById("calendar");

  if (!calendarEl) {
      console.error("Calendar element not found!");
      return;
  }

  // 달력 생성 함수
  function generateCalendar(year, month) {
      calendarEl.innerHTML = ''; // 기존 달력 내용 초기화

      // 요일 헤더 추가
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      daysOfWeek.forEach(day => {
          const dayHeader = document.createElement("div");
          dayHeader.className = "calendar-header";
          dayHeader.textContent = day;
          calendarEl.appendChild(dayHeader);
      });

      // 해당 월의 첫날과 마지막 날짜 계산
      const firstDayOfMonth = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // 첫 주 빈 칸 추가
      for (let i = 0; i < firstDayOfMonth; i++) {
          const emptyCell = document.createElement("div");
          emptyCell.className = "calendar-day";
          calendarEl.appendChild(emptyCell);
      }

      // 날짜 채우기
      for (let day = 1; day <= daysInMonth; day++) {
          const dayEl = document.createElement("div");
          dayEl.className = "calendar-day";
          dayEl.id = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          dayEl.textContent = day;
          calendarEl.appendChild(dayEl);
      }
  }

  // 스티커 추가 함수
  window.addSticker = function(date) {
      const dayEl = document.getElementById(date);
      if (dayEl) {
          const sticker = document.createElement("span");
          sticker.className = "sticker";
          sticker.textContent = "😊"; // 이모티콘이나 스티커로 사용할 텍스트
          dayEl.appendChild(sticker);
      } else {
          alert("해당 날짜를 찾을 수 없습니다.");
      }
  };

  // 예제: 2023년 10월 달력 생성
  generateCalendar(2023, 9); // 10월 (0부터 시작하는 인덱스)
});
