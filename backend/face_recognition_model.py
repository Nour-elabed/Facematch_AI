import face_recognition
import os
import numpy as np
from PIL import Image

# ================================================
# FaceMatch AI — Dataset Loader
# ================================================

DATASET_PATH = "dataset"
CONFIDENCE_THRESHOLD = 0.6

images = []
class_names = []

# ✅ Convert any image to RGB (FIXES YOUR ERROR)
def load_image_rgb(path):
    img = Image.open(path).convert("RGB")
    return np.array(img)

# Create dataset folder if it doesn't exist
if not os.path.exists(DATASET_PATH):
    os.makedirs(DATASET_PATH)
    print(f"[FaceMatch AI] Created '{DATASET_PATH}/' folder. Add face images to it.")

# ✅ Load dataset images
for filename in os.listdir(DATASET_PATH):
    if not filename.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
        continue

    filepath = os.path.join(DATASET_PATH, filename)

    try:
        img = load_image_rgb(filepath)   # ✅ FIX HERE
        images.append(img)
        class_names.append(os.path.splitext(filename)[0])
        print(f"[FaceMatch AI] ✅ Loaded: {filename}")
    except Exception as e:
        print(f"[FaceMatch AI] ❌ Could not load {filename}: {e}")

print(f"[FaceMatch AI] {len(class_names)} face(s) loaded from dataset.")

# ================================================
# Encode all known faces
# ================================================
def _encode_faces(images):
    encodings = []
    for i, img in enumerate(images):
        encs = face_recognition.face_encodings(img)
        if not encs:
            print(f"[FaceMatch AI] ⚠ No face found in image #{i} ({class_names[i]}). Skipping.")
            encodings.append(None)
        else:
            encodings.append(encs[0])
    return encodings

raw = _encode_faces(images)

# Keep only valid encodings
valid_pairs = [(enc, name) for enc, name in zip(raw, class_names) if enc is not None]

if valid_pairs:
    known_encodings, known_names = zip(*valid_pairs)
    known_encodings = list(known_encodings)
    known_names = list(known_names)
else:
    known_encodings = []
    known_names = []

# ================================================
# Core recognition function
# ================================================
def recognize_face(image_path: str) -> str:

    if not known_encodings:
        return "Dataset is empty — add photos to the dataset/ folder"

    try:
        img = load_image_rgb(image_path)   # ✅ FIX HERE TOO
    except Exception as e:
        return f"Error reading image: {e}"

    face_encs = face_recognition.face_encodings(img)

    if not face_encs:
        return "No face detected in image"

    query_enc = face_encs[0]

    distances = face_recognition.face_distance(known_encodings, query_enc)
    best_idx = int(np.argmin(distances))
    best_dist = distances[best_idx]

    if best_dist < CONFIDENCE_THRESHOLD:
        confidence = round((1 - best_dist) * 100, 1)
        name = known_names[best_idx].replace("_", " ")
        return f"{name} ({confidence}% match)"

    return "Unknown person"