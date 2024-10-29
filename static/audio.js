// 오디오 녹음 및 서버 전송 기능
document.addEventListener("DOMContentLoaded", function () {
  let mediaRecorder;
  let audioChunks = [];
  let isRecording = false;
  let stream;

  document.getElementById("recordButton").onclick = async () => {
    if (!isRecording) {
      // Start recording
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.start();
      isRecording = true;
      document.getElementById("recordButton").innerText = "Stop Recording";
    } else {
      // Stop recording
      mediaRecorder.stop();
      isRecording = false;
      document.getElementById("recordButton").innerText = "Start Recording";

      // Stop the microphone stream
      stream.getTracks().forEach((track) => track.stop());

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        audioChunks = [];

        const formData = new FormData();
        formData.append("file", audioBlob, "recording.wav");

        // Send audio data to the server
        const response = await fetch("/upload", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();

        // Display the transcribed text and other results
        document.getElementById("transcriptionResult").innerText =
          result.transcribed_text || "No transcription received";
        document.getElementById("positiveCheck").innerText = result.positive
          ? "Yes"
          : "No";
        document.getElementById("dateCheckValue").innerText =
          result.date_checked || "N/A";
      };
    }
  };
});

document.addEventListener("DOMContentLoaded", function () {
  let mediaRecorder;
  let audioChunks = [];
  let isRecording = false;
  let stream;

  // FullCalendar 초기화
  var calendarEl = document.getElementById('calendar');
  var calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      dateClick: function(info) {
          alert('Clicked on: ' + info.dateStr);
      }
  });
  calendar.render();

  document.getElementById("recordButton").onclick = async () => {
    if (!isRecording) {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.start();
      isRecording = true;
      document.getElementById("recordButton").innerText = "Stop Recording";
    } else {
      mediaRecorder.stop();
      isRecording = false;
      document.getElementById("recordButton").innerText = "Start Recording";

      // Stop the microphone stream
      stream.getTracks().forEach((track) => track.stop());

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        audioChunks = [];

        const formData = new FormData();
        formData.append("file", audioBlob, "recording.wav");

        const response = await fetch("/upload", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();

        // 서버 응답 확인
        console.log("Server Response:", result);

        // Display the transcribed text and other results
        document.getElementById("transcriptionResult").innerText =
          result.transcribed_text || "No transcription received";
        document.getElementById("positiveCheck").innerText = result.positive
          ? "Yes"
          : "No";
        document.getElementById("dateCheckValue").innerText =
          result.date_checked || "N/A";

        // Positive and date_checked 값 확인
        if (result.positive && result.date_checked) {
          console.log("Positive and date checked. Enabling confirm button.");
          document.getElementById("confirmButton").disabled = false;

          // Add event to calendar on confirm button click
          document.getElementById("confirmButton").onclick = function () {
            calendar.addEvent({
              title: "✅",  // Emoji for positive confirmation
              start: result.date_checked,
              allDay: true
            });
            document.getElementById("confirmButton").disabled = true;  // Disable after confirmation
          };
        }
      };
    }
  };
});


