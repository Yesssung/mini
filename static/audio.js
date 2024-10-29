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
        const audioUrl = URL.createObjectURL(audioBlob);
        document.getElementById("audioPlayback").src = audioUrl;

        const formData = new FormData();
        formData.append("file", audioBlob, "recording.wav");

        // Send audio data to the server
        const response = await fetch("/upload", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();

        // Log server response to check
        console.log("Server Response:", result);

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
