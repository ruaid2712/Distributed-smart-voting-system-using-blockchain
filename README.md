# BioVoteChain - Frontend Application

BioVoteChain is a blockchain-based electronic voting system utilizing biometric authentication to demonstrate transparent and immutable elections.

## Technology Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router DOM v6
- **Styling**: Bootstrap 5 (CSS only) and Custom CSS
- **Icons**: Bootstrap Icons

## Installation & Local Development

1. Ensure [Node.js](https://nodejs.org/) is installed.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

## Face Service

The first backend slice is a FastAPI service that validates whether an uploaded
capture contains exactly one detectable face. It does not perform voter identity
matching yet.

```bash
py -m venv .venv
.venv\Scripts\activate
py -m pip install -r backend\requirements.txt
py -m uvicorn backend.face_recognition_service:app --reload --port 8000
```

The service exposes `GET /health` and `POST /api/face/verify` on
`http://localhost:8000`. Interactive API documentation is available at
`http://localhost:8000/docs`.

Before verification, enroll a stored face template for the voter ID. Use a
clear image containing exactly one face:

```powershell
curl.exe -X POST -F "file=@C:\path\to\voter-face.jpg" http://localhost:8000/api/face/enroll/VTR-88492
```

The login screen then captures a webcam frame and compares it with that stored
template. Templates are stored as face embeddings rather than source images.

## Fingerprint Service

After face verification, the fingerprint step uses WebAuthn and Windows Hello.
The browser opens the laptop's fingerprint prompt, and the backend verifies the
signed credential. Raw fingerprint data is never exposed to the application.

The first use for a voter ID registers the laptop fingerprint as that voter's
Windows Hello credential. Later logins verify that credential. Use `localhost`
for the frontend URL because WebAuthn requires a secure context; localhost is
trusted for local development.

## Transitioning to a Production Backend

The application currently simulates biometric verification, database logic, and blockchain consensus using React state and `setTimeout`. Replace those simulations with a biometric service, a backend session/API layer, a Web3 provider or Hyperledger SDK, and live API data when integrating a production backend.