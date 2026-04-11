from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
from face_recognition_model import recognize_face

app = FastAPI(
    title="FaceMatch AI",
    description="Facial recognition API powered by face_recognition",
    version="1.0.0"
)

# ✅ CORS — allows React frontend (Vite on port 5173) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_FILE = "temp_upload.jpg"

@app.get("/")
def root():
    return {"message": "FaceMatch AI backend is running ✅"}

@app.post("/recognize")
async def recognize(file: UploadFile = File(...)):
    # Save the uploaded file temporarily
    with open(TEMP_FILE, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = recognize_face(TEMP_FILE)

    # Cleanup temp file
    if os.path.exists(TEMP_FILE):
        os.remove(TEMP_FILE)

    return {"result": result}