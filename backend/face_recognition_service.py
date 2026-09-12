from __future__ import annotations

import base64
import hashlib
import json
from pathlib import Path
import re
import secrets
from typing import Any

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from webauthn import (
    generate_authentication_options,
    generate_registration_options,
    verify_authentication_response,
    verify_registration_response,
)
from webauthn.helpers import (
    options_to_json_dict,
    parse_authentication_credential_json,
    parse_registration_credential_json,
)
from webauthn.helpers.structs import (
    AuthenticatorAttachment,
    AuthenticatorSelectionCriteria,
    PublicKeyCredentialDescriptor,
    UserVerificationRequirement,
)

app = FastAPI(title="BioVoteChain Face Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"
TEMPLATES_DIR = BASE_DIR / "face_templates"
FINGERPRINT_TEMPLATES_DIR = BASE_DIR / "fingerprint_templates"
WEBAUTHN_STORE = BASE_DIR / "webauthn_credentials.json"
RP_ID = "localhost"
RP_NAME = "BioVoteChain"
WEBAUTHN_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]
DETECTION_MODEL = MODEL_DIR / "face_detection_yunet_2023mar.onnx"
RECOGNITION_MODEL = MODEL_DIR / "face_recognition_sface_2021dec.onnx"
MATCH_THRESHOLD = 0.363

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)
webauthn_challenges: dict[str, bytes] = {}


def load_webauthn_credentials() -> dict[str, dict[str, Any]]:
    if not WEBAUTHN_STORE.exists():
        return {}
    return json.loads(WEBAUTHN_STORE.read_text(encoding="utf-8"))


def save_webauthn_credentials(credentials: dict[str, dict[str, Any]]) -> None:
    WEBAUTHN_STORE.write_text(json.dumps(credentials, indent=2), encoding="utf-8")


def encode_bytes(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def decode_bytes(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def webauthn_user_id(voter_id: str) -> bytes:
    return hashlib.sha256(voter_id.strip().encode("utf-8")).digest()


def decode_image(image_bytes: bytes) -> np.ndarray:
    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid image.")
    return image


def detect_faces(image: np.ndarray) -> list[dict[str, int]]:
    grayscale = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(
        grayscale,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(80, 80),
    )
    return [
        {"x": int(x), "y": int(y), "width": int(width), "height": int(height)}
        for x, y, width, height in faces
    ]


def get_face_models() -> tuple[Any, Any]:
    if not DETECTION_MODEL.exists() or not RECOGNITION_MODEL.exists():
        raise HTTPException(
            status_code=503,
            detail="Face recognition models are not installed. See the backend setup instructions.",
        )
    detector = cv2.FaceDetectorYN_create(
        str(DETECTION_MODEL), "", (320, 320), 0.9, 0.3, 5000
    )
    recognizer = cv2.FaceRecognizerSF_create(str(RECOGNITION_MODEL), "")
    return detector, recognizer


def extract_face_feature(image: np.ndarray) -> np.ndarray:
    detector, recognizer = get_face_models()
    height, width = image.shape[:2]
    detector.setInputSize((width, height))
    _, detected_faces = detector.detect(image)
    if detected_faces is None or len(detected_faces) != 1:
        raise HTTPException(status_code=400, detail="Capture must contain exactly one face.")
    aligned_face = recognizer.alignCrop(image, detected_faces[0])
    return recognizer.feature(aligned_face)


def template_path_for(voter_id: str) -> Path:
    normalized_id = voter_id.strip()
    if not re.fullmatch(r"[A-Za-z0-9_-]{3,64}", normalized_id):
        raise HTTPException(status_code=400, detail="Voter ID must use 3-64 letters, numbers, hyphens, or underscores.")
    return TEMPLATES_DIR / f"{normalized_id}.npy"


def fingerprint_template_path_for(voter_id: str) -> Path:
    normalized_id = voter_id.strip()
    if not re.fullmatch(r"[A-Za-z0-9_-]{3,64}", normalized_id):
        raise HTTPException(status_code=400, detail="Voter ID must use 3-64 letters, numbers, hyphens, or underscores.")
    return FINGERPRINT_TEMPLATES_DIR / f"{normalized_id}.npz"


def generate_voter_id() -> str:
    for _ in range(100):
        voter_id = f"VTR-{secrets.randbelow(100000):05d}"
        if not template_path_for(voter_id).exists() and not fingerprint_template_path_for(voter_id).exists():
            return voter_id
    raise HTTPException(status_code=503, detail="Unable to generate a unique voter ID. Try again.")


def extract_fingerprint_descriptors(image: np.ndarray) -> np.ndarray:
    grayscale = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    enhanced = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(grayscale)
    sift = cv2.SIFT_create(nfeatures=1500)
    _, descriptors = sift.detectAndCompute(enhanced, None)
    if descriptors is None or len(descriptors) < 10:
        raise HTTPException(status_code=400, detail="Fingerprint scan does not contain enough detail.")
    return descriptors.astype(np.float32)


def compare_fingerprint_descriptors(stored: np.ndarray, captured: np.ndarray) -> int:
    matcher = cv2.BFMatcher(cv2.NORM_L2)
    candidate_matches = matcher.knnMatch(stored, captured, k=2)
    good_matches = [
        first_match
        for first_match, second_match in candidate_matches
        if first_match.distance < 0.7 * second_match.distance
    ]
    return len(good_matches)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "face-recognition"}


@app.post("/api/face/detect")
async def detect_face(file: UploadFile = File(...)) -> dict[str, Any]:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Upload an image file.")

    image = decode_image(await file.read())
    faces = detect_faces(image)

    return {
        "detected": len(faces) > 0,
        "faceCount": len(faces),
        "faces": faces,
        "message": (
            "Exactly one face detected."
            if len(faces) == 1
            else "Upload an image containing exactly one face."
        ),
    }


@app.post("/api/face/verify")
async def verify_face(voter_id: str, file: UploadFile = File(...)) -> dict[str, Any]:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Upload an image file.")

    template_path = template_path_for(voter_id)
    if not template_path.exists():
        raise HTTPException(status_code=404, detail="No enrolled face exists for this voter ID.")

    captured_image = decode_image(await file.read())
    captured_feature = extract_face_feature(captured_image)
    stored_feature = np.load(template_path)
    _, recognizer = get_face_models()
    score = float(recognizer.match(stored_feature, captured_feature, cv2.FaceRecognizerSF_FR_COSINE))
    verified = score >= MATCH_THRESHOLD

    return {
        "verified": verified,
        "score": round(score, 4),
        "threshold": MATCH_THRESHOLD,
        "verificationStage": "face-match",
        "message": "Face verified successfully." if verified else "Face does not match the stored template.",
    }


@app.post("/api/face/enroll/{voter_id}")
async def enroll_face(voter_id: str, file: UploadFile = File(...)) -> dict[str, Any]:
    template_path = template_path_for(voter_id)
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Upload an image file.")

    image = decode_image(await file.read())
    feature = extract_face_feature(image)
    TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)
    np.save(template_path, feature)
    return {"enrolled": True, "voterId": voter_id.strip()}


@app.post("/api/voters/register")
async def register_voter(face_file: UploadFile = File(...), fingerprint_file: UploadFile = File(...)) -> dict[str, Any]:
    if not face_file.content_type or not face_file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Upload a face image.")
    if not fingerprint_file.content_type or not fingerprint_file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Upload a fingerprint image.")

    voter_id = generate_voter_id()
    face_image = decode_image(await face_file.read())
    fingerprint_image = decode_image(await fingerprint_file.read())
    face_feature = extract_face_feature(face_image)
    fingerprint_descriptors = extract_fingerprint_descriptors(fingerprint_image)

    TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)
    FINGERPRINT_TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)
    np.save(template_path_for(voter_id), face_feature)
    np.savez_compressed(fingerprint_template_path_for(voter_id), descriptors=fingerprint_descriptors)
    return {"registered": True, "voterId": voter_id}


@app.post("/api/fingerprint/enroll/{voter_id}")
async def enroll_fingerprint(voter_id: str, file: UploadFile = File(...)) -> dict[str, Any]:
    template_path = fingerprint_template_path_for(voter_id)
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Upload a fingerprint scan image.")

    image = decode_image(await file.read())
    descriptors = extract_fingerprint_descriptors(image)
    FINGERPRINT_TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(template_path, descriptors=descriptors)
    return {"enrolled": True, "voterId": voter_id.strip(), "featureCount": len(descriptors)}


@app.get("/api/fingerprint/status")
def fingerprint_status(voter_id: str) -> dict[str, bool]:
    return {"enrolled": fingerprint_template_path_for(voter_id).exists()}


@app.post("/api/fingerprint/verify")
async def verify_fingerprint(voter_id: str, file: UploadFile = File(...)) -> dict[str, Any]:
    template_path = fingerprint_template_path_for(voter_id)
    if not template_path.exists():
        raise HTTPException(status_code=404, detail="No enrolled fingerprint exists for this voter ID.")
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Upload a fingerprint scan image.")

    image = decode_image(await file.read())
    captured_descriptors = extract_fingerprint_descriptors(image)
    stored_descriptors = np.load(template_path)["descriptors"]
    good_matches = compare_fingerprint_descriptors(stored_descriptors, captured_descriptors)
    match_threshold = 12
    verified = good_matches >= match_threshold

    return {
        "verified": verified,
        "goodMatches": good_matches,
        "threshold": match_threshold,
        "verificationStage": "fingerprint-match",
        "message": "Fingerprint verified successfully." if verified else "Fingerprint does not match the stored template.",
    }


@app.get("/api/webauthn/status")
def webauthn_status(voter_id: str) -> dict[str, bool]:
    template_path_for(voter_id)
    return {"enrolled": voter_id.strip() in load_webauthn_credentials()}


@app.post("/api/webauthn/register/options")
def webauthn_register_options(voter_id: str) -> dict[str, Any]:
    template_path_for(voter_id)
    challenge = secrets.token_bytes(32)
    webauthn_challenges[voter_id.strip()] = challenge
    options = generate_registration_options(
        rp_id=RP_ID,
        rp_name=RP_NAME,
        user_id=webauthn_user_id(voter_id),
        user_name=voter_id.strip(),
        user_display_name=voter_id.strip(),
        challenge=challenge,
        authenticator_selection=AuthenticatorSelectionCriteria(
            authenticator_attachment=AuthenticatorAttachment.PLATFORM,
            user_verification=UserVerificationRequirement.REQUIRED,
        ),
    )
    return options_to_json_dict(options)


@app.post("/api/webauthn/register/verify")
def webauthn_register_verify(voter_id: str, credential: dict[str, Any]) -> dict[str, Any]:
    normalized_id = voter_id.strip()
    template_path_for(normalized_id)
    challenge = webauthn_challenges.pop(normalized_id, None)
    if challenge is None:
        raise HTTPException(status_code=400, detail="Registration challenge expired. Try again.")
    try:
        verified = verify_registration_response(
            credential=parse_registration_credential_json(credential),
            expected_challenge=challenge,
            expected_rp_id=RP_ID,
            expected_origin=WEBAUTHN_ORIGINS,
        )
    except Exception as error:
        raise HTTPException(status_code=400, detail=f"Windows Hello registration failed: {error}") from error

    credentials = load_webauthn_credentials()
    credentials[normalized_id] = {
        "credential_id": encode_bytes(verified.credential_id),
        "public_key": encode_bytes(verified.credential_public_key),
        "sign_count": verified.sign_count,
    }
    save_webauthn_credentials(credentials)
    return {"verified": True, "enrolled": True, "message": "Windows Hello fingerprint enrolled."}


@app.post("/api/webauthn/authenticate/options")
def webauthn_authenticate_options(voter_id: str) -> dict[str, Any]:
    normalized_id = voter_id.strip()
    template_path_for(normalized_id)
    stored = load_webauthn_credentials().get(normalized_id)
    if stored is None:
        raise HTTPException(status_code=404, detail="No Windows Hello credential is enrolled for this voter ID.")
    challenge = secrets.token_bytes(32)
    webauthn_challenges[normalized_id] = challenge
    options = generate_authentication_options(
        rp_id=RP_ID,
        challenge=challenge,
        allow_credentials=[PublicKeyCredentialDescriptor(id=decode_bytes(stored["credential_id"]))],
        user_verification=UserVerificationRequirement.REQUIRED,
    )
    return options_to_json_dict(options)


@app.post("/api/webauthn/authenticate/verify")
def webauthn_authenticate_verify(voter_id: str, credential: dict[str, Any]) -> dict[str, Any]:
    normalized_id = voter_id.strip()
    template_path_for(normalized_id)
    challenge = webauthn_challenges.pop(normalized_id, None)
    stored = load_webauthn_credentials().get(normalized_id)
    if challenge is None or stored is None:
        raise HTTPException(status_code=400, detail="Authentication challenge expired. Try again.")
    try:
        verified = verify_authentication_response(
            credential=parse_authentication_credential_json(credential),
            expected_challenge=challenge,
            expected_rp_id=RP_ID,
            expected_origin=WEBAUTHN_ORIGINS,
            credential_public_key=decode_bytes(stored["public_key"]),
            credential_current_sign_count=stored["sign_count"],
            require_user_verification=True,
        )
    except Exception as error:
        raise HTTPException(status_code=401, detail=f"Windows Hello fingerprint verification failed: {error}") from error

    stored["sign_count"] = verified.new_sign_count
    credentials = load_webauthn_credentials()
    credentials[normalized_id] = stored
    save_webauthn_credentials(credentials)
    return {"verified": True, "message": "Windows Hello fingerprint verified."}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("face_recognition_service:app", host="127.0.0.1", port=8000, reload=True)
