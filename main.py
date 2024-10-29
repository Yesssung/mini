from fastapi import FastAPI, File, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request
from transformers import pipeline
import os
from datetime import datetime
import re
import whisper

app = FastAPI()

# Serve static files from the 'static' directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Set up template directory
templates = Jinja2Templates(directory="templates")

# Whisper 모델 로드
transcriber = pipeline(model="openai/whisper-large", task="automatic-speech-recognition")

# NLP 모델 로드 (날짜 인식을 위한 BERT NER 모델)
ner_model = pipeline("ner", model="dslim/bert-base-NER", grouped_entities=True)

@app.get("/", response_class=HTMLResponse)
async def get_form(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    # 파일 저장
    file_location = f"temp/{file.filename}"
    with open(file_location, "wb") as f:
        f.write(await file.read())

    try:
    # 음성 파일에서 텍스트 추출
        result = transcriber(file_location)
        text = result["text"]
    except Exception as e:
        print("Error in Whisper transcription:", e)
        return {"transcribed_text": "Error processing audio", "positive": False, "date_checked": None}

    try:
        # NER 모델을 통해 날짜 추출
        entities = ner_model(text)
        extracted_date = None
        for entity in entities:
            if entity['entity_group'] == 'DATE':
                extracted_date = entity['word']
                break
    except Exception as e:
        print("Error in NER model:", e)
        extracted_date = None

    # 긍정 표현 확인
    positive = "먹었어" in text or "먹었다" in text

    # 체크할 날짜 결정
    date_checked = extracted_date if positive and extracted_date else None

    # 파일 삭제 (필요한 경우)
    os.remove(file_location)

    # 터미널에 출력
    print("Transcribed Text:", text)
    print("Positive Detected:", positive)
    print("Date Checked:", date_checked)

    # 클라이언트로 전송할 결과
    return {
        "transcribed_text": text,
        "positive": positive,
        "date_checked": date_checked
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
