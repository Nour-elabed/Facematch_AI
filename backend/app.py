from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import asyncio
import logging
from contextlib import asynccontextmanager
from face_recognition_model import recognize_face, load_dataset

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load dataset when the server starts."""
    logger.info("=== FaceMatch AI starting up ===")
    load_dataset()
    logger.info("=== Ready to receive requests ===")
    yield
    logger.info("=== FaceMatch AI shutting down ===")


app = FastAPI(
    title="FaceMatch AI",
    description="Facial recognition API powered by DeepFace",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)


@app.get("/")
def root():
    return {"status": "ok", "message": "FaceMatch AI backend is running"}


@app.get("/health")
def health():
    """Quick health check for the frontend."""
    return {"status": "ok"}


@app.post("/recognize")
async def recognize(file: UploadFile = File(...)):
    logger.info(f"Received file: {file.filename} ({file.content_type})")

    # Save to a unique temp file to avoid conflicts
    temp_path = os.path.join(TEMP_DIR, f"upload_{os.getpid()}_{file.filename}")

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logger.info(f"Saved temp file: {temp_path}")

        # KEY FIX: Run DeepFace in a thread so it doesn't block the async server
        logger.info("Starting face recognition (this may take 10–30s on first run)...")
        result = await asyncio.to_thread(recognize_face, temp_path)

        logger.info(f"Result: {result}")
        return {"result": result, "status": "success"}

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {"result": f"Server error: {str(e)}", "status": "error"}

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
            logger.info("Temp file cleaned up.")