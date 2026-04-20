from deepface import DeepFace
import os
import numpy as np

DATASET_PATH = "dataset"

# Store precomputed embeddings instead of raw images
known_embeddings = []

known_names = []


def get_embedding(image_path):
    """Extract face embedding from an image."""
    result = DeepFace.represent(
        img_path=image_path,
        model_name="Facenet",
        enforce_detection=False
    )
    return np.array(result[0]["embedding"])


def cosine_similarity(a, b):
    """Calculate similarity between two embeddings."""
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def load_dataset():
    """Precompute embeddings for all dataset images at startup."""
    global known_embeddings, known_names
    known_embeddings = []
    known_names = []

    if not os.path.exists(DATASET_PATH):
        os.makedirs(DATASET_PATH)
        print("[FaceMatch AI] Created empty dataset folder")
        return

    print("[FaceMatch AI] Loading Facenet model and computing embeddings...")

    for filename in os.listdir(DATASET_PATH):
        if filename.lower().endswith((".jpg", ".jpeg", ".png")):
            path = os.path.join(DATASET_PATH, filename)
            name = os.path.splitext(filename)[0].replace("_", " ").title()
            try:
                embedding = get_embedding(path)
                known_embeddings.append(embedding)
                known_names.append(name)
                print(f"  [OK] {name}")
            except Exception as e:
                print(f"  [SKIP] {name} — {e}")

    print(f"[FaceMatch AI] Ready! {len(known_embeddings)} faces loaded.")


def recognize_face(image_path: str) -> str:
    """
    Compare uploaded image against precomputed embeddings.
    This is FAST because embeddings are already computed.
    """
    if not known_embeddings:
        return "No images in dataset. Add .jpg files to the dataset folder."

    try:
        # Compute embedding for uploaded image only
        upload_embedding = get_embedding(image_path)

        best_match = None
        best_score = -1

        for embedding, name in zip(known_embeddings, known_names):
            score = cosine_similarity(upload_embedding, embedding)
            if score > best_score:
                best_score = score
                best_match = name

        # Threshold: score above 0.5 = match
        if best_score > 0.5:
            confidence = round(best_score * 100, 1)
            return f"{best_match} — {confidence}% match"
        else:
            return f"Unknown person (closest: {best_match}, {round(best_score * 100, 1)}%)"

    except Exception as e:
        
        return f"Recognition error: {str(e)}"