from fastapi import FastAPI, File, UploadFile, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline
import whisper
import os
import re
from datetime import datetime

app = FastAPI()

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# Whisper 모델 로드
transcriber = whisper.load_model("large")

# mBERT NER 모델 로드
tokenizer = AutoTokenizer.from_pretrained("bert-base-multilingual-cased")
model = AutoModelForTokenClassification.from_pretrained("bert-base-multilingual-cased")
ner_pipeline = pipeline("ner", model=model, tokenizer=tokenizer)

# 기본 페이지 경로 설정
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
        result = transcriber.transcribe(file_location)
        text = result["text"]
    except Exception as e:
        print("Error in Whisper transcription:", e)
        return {"transcribed_text": "Error processing audio", "positive": False, "date_checked": None}

    # 날짜 및 긍정 표현 인식
    entities = ner_pipeline(text)
    extracted_date = None
    for entity in entities:
        if entity['entity'] == 'DATE':  # 날짜 엔티티 탐지
            extracted_date = entity['word']
            break

    # 유사 표현 리스트
    positive_keywords = ["먹었어", "먹었다", "먹음", "복용 완료", "약 복용"]

    # 긍정 표현 판단
    positive = any(keyword in text for keyword in positive_keywords)

    # 체크할 날짜 결정
    date_checked = extracted_date if positive and extracted_date else None

    # 파일 삭제
    os.remove(file_location)

    # 클라이언트로 전송할 결과
    return {
        "transcribed_text": text,
        "positive": positive,
        "date_checked": date_checked
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
