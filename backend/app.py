#uvicorn app:app --reload --host 127.0.0.1 --port 8000
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import asyncio
import logging
import cv2
from contextlib import asynccontextmanager
from face_recognition_model import recognize_face, load_dataset

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager

async def lifespan(app: FastAPI):
    logger.info("=== FaceMatch AI starting up ===")
    load_dataset()
    logger.info("=== Ready to receive requests ===")
    yield


app = FastAPI(title="FaceMatch AI", version="3.0.0", lifespan=lifespan)

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
    return {"status": "ok"}


@app.post("/recognize")
async def recognize(file: UploadFile = File(...)):
    logger.info(f"Received file: {file.filename}")
    temp_path = os.path.join(TEMP_DIR, f"upload_{os.getpid()}_{file.filename}")

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = await asyncio.to_thread(recognize_face, temp_path)
        logger.info(f"Image result: {result}")
        return {"result": result, "status": "success", "type": "image"}

    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {"result": f"Server error: {str(e)}", "status": "error"}

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/recognize-video")
async def recognize_video(file: UploadFile = File(...)):
    logger.info(f"Received video: {file.filename}")
    temp_path = os.path.join(TEMP_DIR, f"video_{os.getpid()}_{file.filename}")

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = await asyncio.to_thread(process_video, temp_path)
        logger.info(f"Video result: {result}")
        return {"result": result, "status": "success", "type": "video"}

    except Exception as e:
        logger.error(f"Video error: {str(e)}")
        return {"result": [], "status": "error", "message": str(e)}

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def process_video(video_path: str):
    """
    Extract frames from video every 1 second,
    run face recognition on each frame,
    return list of detections with timestamps.
    """
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        return [{"timestamp": 0, "result": "Could not open video file"}]

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps if fps > 0 else 0

    logger.info(f"Video: {duration:.1f}s, {fps:.0f}fps, {total_frames} frames")

    # Sample 1 frame per second (skip frames for speed)
    frame_interval = max(1, int(fps))

    detections = []
    seen_names = set()  # avoid duplicate detections
    frame_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_count % frame_interval == 0:
            timestamp = round(frame_count / fps, 1) if fps > 0 else frame_count

            # Save frame as temp image
            frame_path = os.path.join(
                os.path.dirname(video_path),
                f"frame_{frame_count}.jpg"
            )
            cv2.imwrite(frame_path, frame)

            try:
                result = recognize_face(frame_path)
                logger.info(f"  Frame {frame_count} ({timestamp}s): {result}")

                if "Unknown" not in result and "error" not in result.lower():
                    # Extract name from result like "Angelina Jolie — 87.3% match"
                    name = result.split("—")[0].strip()
                    if name not in seen_names:
                        seen_names.add(name)
                        detections.append({
                            "timestamp": timestamp,
                            "result": result,
                            "name": name
                        })
            except Exception as e:
                logger.error(f"Frame error: {e}")
            finally:
                if os.path.exists(frame_path):
                    os.remove(frame_path)

        frame_count += 1

    cap.release()

    if not detections:
        return [{"timestamp": 0, "result": "No known faces detected in video", "name": "Unknown"}]

    return detections