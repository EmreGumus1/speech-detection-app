from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uuid
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/models")
def get_models():
    return [
        {
            "id": "rawnet2_telco_v3",
            "name": "RawNet2 Telco v3",
            "framework": "pytorch",
            "supports_file": True,
            "supports_realtime": True,
            "sample_rate": 16000,
            "input_type": "waveform",
            "description": "Detector trained on compressed telephone-quality audio.",
            "tags": ["compressed-audio", "realtime"],
        },
        {
            "id": "wav2vec_detector_v1",
            "name": "Wav2Vec Detector v1",
            "framework": "pytorch",
            "supports_file": True,
            "supports_realtime": False,
            "sample_rate": 16000,
            "input_type": "waveform",
            "description": "General synthetic speech detector.",
            "tags": ["wav2vec", "binary-classification"],
        },
    ]

@app.post("/predict/file")
async def predict_file(
    file: UploadFile = File(...),
    model_ids: List[str] = Form(...)
):
    os.makedirs("uploads", exist_ok=True)
    file_path = os.path.join("uploads", file.filename)

    with open(file_path, "wb") as f:
      f.write(await file.read())

    return {
        "experiment_id": f"exp_{uuid.uuid4().hex[:8]}",
        "input_type": "file",
        "file_name": file.filename,
        "duration_sec": 8.4,
        "results": [
            {
                "model_id": model_id,
                "model_name": model_id.replace("_", " ").title(),
                "prediction": "synthetic",
                "confidence": 0.91,
                "inference_time_ms": 180,
            }
            for model_id in model_ids
        ],
    }
