from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import logging
from face_recognition_model import recognize_face

# Setup logging to see what's happening in the terminal
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="FaceMatch AI",
    description="Facial recognition API powered by DeepFace",
    version="1.0.0"
)

# 🌐 Updated CORS: Allows any origin for local development testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
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
    logger.info(f"--- New Request: Received {file.filename} ---")
    
    try:
        # Save the uploaded file temporarily
        with open(TEMP_FILE, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logger.info("Temporary file saved. Starting AI recognition...")

        # This part might take a long time on the first run (downloading models)
        result = recognize_face(TEMP_FILE)
        
        logger.info(f"Recognition complete! Result: {result}")

        return {"result": result}
    
    except Exception as e:
        logger.error(f"Error during recognition: {str(e)}")
        return {"result": f"Error: {str(e)}"}
    
    finally:
        # Cleanup temp file
        if os.path.exists(TEMP_FILE):
            os.remove(TEMP_FILE)
            logger.info("Temporary file cleaned up.")