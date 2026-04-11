import face_recognition
import os
import numpy as np

# ================================================
# FaceMatch AI — Dataset Loader
# ================================================
# Put face images in the dataset/ folder named after the person
# Example: dataset/John_Doe.jpg  →  recognized as "John Doe"

DATASET_PATH = "dataset"
CONFIDENCE_THRESHOLD = 0.6   # lower = stricter matching

images = []
class_names = []

# Create dataset folder if it doesn't exist
if not os.path.exists(DATASET_PATH):
    os.makedirs(DATASET_PATH)
    print(f"[FaceMatch AI] Created '{DATASET_PATH}/' folder. Add face images to it.")

for filename in os.listdir(DATASET_PATH):
    if not filename.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
        continue
    filepath = os.path.join(DATASET_PATH, filename)
    try:
        img = face_recognition.load_image_file(filepath)
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

# Keep only images where a face was successfully encoded
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
    """
    Loads an image, detects a face, compares it against the dataset.
    Returns the person's name + confidence, or an error string.
    """
    if not known_encodings:
        return "Dataset is empty — add photos to the dataset/ folder"

    try:
        img = face_recognition.load_image_file(image_path)
    except Exception as e:
        return f"Error reading image: {e}"

    face_encs = face_recognition.face_encodings(img)

    if not face_encs:
        return "No face detected in image"

    # Use first detected face
    query_enc = face_encs[0]

    distances = face_recognition.face_distance(known_encodings, query_enc)
    best_idx = int(np.argmin(distances))
    best_dist = distances[best_idx]

    if best_dist < CONFIDENCE_THRESHOLD:
        confidence = round((1 - best_dist) * 100, 1)
        name = known_names[best_idx].replace("_", " ")
        return f"{name} ({confidence}% match)"

    return "Unknown person"