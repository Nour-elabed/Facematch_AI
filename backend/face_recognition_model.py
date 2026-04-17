from deepface import DeepFace
import os

DATASET_PATH = "dataset"

known_images = []
known_names = []

# Load dataset
for filename in os.listdir(DATASET_PATH):
    if filename.lower().endswith((".jpg", ".jpeg", ".png")):
        known_images.append(os.path.join(DATASET_PATH, filename))
        known_names.append(os.path.splitext(filename)[0])

print(f"[FaceMatch AI] Loaded {len(known_images)} images")

# Recognition
def recognize_face(image_path: str) -> str:
    try:
        for db_img, name in zip(known_images, known_names):

            result = DeepFace.verify(
                img1_path=image_path,
                img2_path=db_img,
                enforce_detection=False
            )

            if result["verified"]:
                confidence = round((1 - result["distance"]) * 100, 1)
                return f"{name} ({confidence}% match)"

        return "Unknown person"

    except Exception as e:
        return f"Error: {e}"