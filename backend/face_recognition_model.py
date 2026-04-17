from deepface import DeepFace
import os

DATASET_PATH = "dataset"

known_images = []
known_names = []

def load_dataset():
    """Load all images from the dataset folder."""
    global known_images, known_names
    known_images = []
    known_names = []
    
    if not os.path.exists(DATASET_PATH):
        os.makedirs(DATASET_PATH)
        print(f"[FaceMatch AI] Created empty dataset folder at '{DATASET_PATH}'")
        return

    for filename in os.listdir(DATASET_PATH):
        if filename.lower().endswith((".jpg", ".jpeg", ".png")):
            known_images.append(os.path.join(DATASET_PATH, filename))
            # Clean name: "angelina_jolie.jpg" → "Angelina Jolie"
            name = os.path.splitext(filename)[0].replace("_", " ").title()
            known_names.append(name)

    print(f"[FaceMatch AI] Loaded {len(known_images)} images from dataset:")
    for name in known_names:
        print(f"  - {name}")


def recognize_face(image_path: str) -> str:
    """
    Compare the uploaded image against every image in the dataset.
    Returns the best match name + confidence, or "Unknown person".
    """
    if not known_images:
        return "No images in dataset. Add .jpg/.jpeg/.png files to the 'dataset' folder."

    best_match = None
    best_distance = 1.0  # Lower = more similar (0 = identical)

    try:
        for db_img, name in zip(known_images, known_names):
            result = DeepFace.verify(
                img1_path=image_path,
                img2_path=db_img,
                model_name="VGG-Face",      # Fast and accurate
                enforce_detection=False,    # Don't crash if no face found
                distance_metric="cosine"
            )

            if result["verified"] and result["distance"] < best_distance:
                best_distance = result["distance"]
                best_match = name

        if best_match:
            confidence = round((1 - best_distance) * 100, 1)
            return f"{best_match} — {confidence}% match"
        else:
            return "Unknown person — no match found in dataset"

    except Exception as e:
        return f"Recognition error: {str(e)}"