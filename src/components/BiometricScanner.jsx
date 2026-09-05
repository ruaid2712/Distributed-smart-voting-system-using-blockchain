import React, { useEffect, useRef, useState } from 'react';

const FACE_API_URL = import.meta.env.VITE_FACE_API_URL || 'http://127.0.0.1:8000';

const base64urlToBuffer = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = window.atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const credentialToJson = (credential) => {
  if (typeof credential.toJSON === 'function') return credential.toJSON();
  return {
    id: credential.id,
    rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
    type: credential.type,
    response: {
      clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON))),
      attestationObject: btoa(String.fromCharCode(...new Uint8Array(credential.response.attestationObject))),
      authenticatorData: btoa(String.fromCharCode(...new Uint8Array(credential.response.authenticatorData))),
      signature: btoa(String.fromCharCode(...new Uint8Array(credential.response.signature))),
      userHandle: credential.response.userHandle ? btoa(String.fromCharCode(...new Uint8Array(credential.response.userHandle))) : null,
    },
  };
};

const BiometricScanner = ({ voterId, onSuccess }) => {
  const [phase, setPhase] = useState('face');
  const [scanState, setScanState] = useState('idle');
  const [message, setMessage] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const verifyCapturedFace = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) throw new Error('Camera is not ready yet.');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    const formData = new FormData();
    formData.append('file', image, 'face-capture.jpg');
    const response = await fetch(`${FACE_API_URL}/api/face/verify?voter_id=${encodeURIComponent(voterId)}`, { method: 'POST', body: formData });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || 'Face verification failed.');
    if (!result.verified) throw new Error(result.message);
  };

  const startFaceScan = async () => {
    setScanState('scanning');
    setMessage('Starting camera...');
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      videoRef.current.srcObject = streamRef.current;
      await videoRef.current.play();
      setMessage('Hold still while your face is compared...');
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await verifyCapturedFace();
      stopCamera();
      setScanState('success');
      setMessage('Face verified successfully.');
      setTimeout(() => { setPhase('fingerprint'); setScanState('idle'); setMessage(''); }, 1200);
    } catch (error) {
      stopCamera();
      setScanState('error');
      setMessage(error.message || 'Unable to verify this face.');
    }
  };

  const startFingerprintScan = async () => {
    setScanState('scanning');
    setMessage('Waiting for Windows Hello fingerprint...');
    try {
      if (!window.PublicKeyCredential || !navigator.credentials) throw new Error('Windows Hello is not available in this browser.');
      const statusResponse = await fetch(`${FACE_API_URL}/api/webauthn/status?voter_id=${encodeURIComponent(voterId)}`);
      const status = await statusResponse.json();
      if (!statusResponse.ok) throw new Error(status.detail || 'Unable to check fingerprint enrollment.');

      if (!status.enrolled) {
        const optionsResponse = await fetch(`${FACE_API_URL}/api/webauthn/register/options?voter_id=${encodeURIComponent(voterId)}`, { method: 'POST' });
        const options = await optionsResponse.json();
        if (!optionsResponse.ok) throw new Error(options.detail || 'Unable to start fingerprint enrollment.');
        options.challenge = base64urlToBuffer(options.challenge);
        options.user.id = base64urlToBuffer(options.user.id);
        const credential = await navigator.credentials.create({ publicKey: options });
        const registrationResponse = await fetch(`${FACE_API_URL}/api/webauthn/register/verify?voter_id=${encodeURIComponent(voterId)}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentialToJson(credential)),
        });
        const result = await registrationResponse.json();
        if (!registrationResponse.ok) throw new Error(result.detail || 'Fingerprint enrollment failed.');
        setScanState('success');
        setMessage('Fingerprint enrolled and verified with Windows Hello.');
        setTimeout(() => { setPhase('completed'); onSuccess(); }, 1200);
        return;
      }

      const optionsResponse = await fetch(`${FACE_API_URL}/api/webauthn/authenticate/options?voter_id=${encodeURIComponent(voterId)}`, { method: 'POST' });
      const options = await optionsResponse.json();
      if (!optionsResponse.ok) throw new Error(options.detail || 'Unable to start fingerprint verification.');
      options.challenge = base64urlToBuffer(options.challenge);
      options.allowCredentials = options.allowCredentials?.map((item) => ({ ...item, id: base64urlToBuffer(item.id) }));
      const credential = await navigator.credentials.get({ publicKey: options });
      const verificationResponse = await fetch(`${FACE_API_URL}/api/webauthn/authenticate/verify?voter_id=${encodeURIComponent(voterId)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentialToJson(credential)),
      });
      const result = await verificationResponse.json();
      if (!verificationResponse.ok) throw new Error(result.detail || 'Fingerprint verification failed.');
      setScanState('success');
      setMessage(result.message);
      setTimeout(() => { setPhase('completed'); onSuccess(); }, 1200);
    } catch (error) {
      setScanState('error');
      setMessage(error.message || 'Unable to verify this fingerprint.');
    }
  };

  return (
    <div className="text-center py-2">
      <h5 className="mb-2 text-light">Mandatory Biometric Verification</h5>
      <p className="text-muted small mb-4">{phase === 'face' ? 'Step 1 of 2: Facial Geometry Scan' : 'Step 2 of 2: Dermatoglyphic Fingerprint Scan'}</p>
      <div className="d-flex justify-content-center gap-2 mb-4">
        <span className={`badge ${phase === 'face' ? 'bg-info text-dark' : 'bg-success'}`}>1. Facial Scan {phase !== 'face' && <i className="bi bi-check-lg"></i>}</span>
        <span className={`badge ${phase === 'fingerprint' ? 'bg-info text-dark' : phase === 'completed' ? 'bg-success' : 'bg-secondary'}`}>2. Fingerprint Scan {phase === 'completed' && <i className="bi bi-check-lg"></i>}</span>
      </div>
      <div className={`scanner-container mb-4 ${scanState === 'scanning' ? 'scanner-active' : ''}`}>
        {phase === 'face' && <video ref={videoRef} className="scanner-video" muted playsInline />}
        <div className="scanner-laser"></div>
        {phase !== 'face' && <i className="bi bi-fingerprint scanner-icon"></i>}
      </div>
      {scanState === 'idle' && <button onClick={phase === 'face' ? startFaceScan : startFingerprintScan} className="btn btn-primary-custom w-100">Initialize {phase === 'face' ? 'Camera Feed' : 'Fingerprint Reader'}</button>}
      {scanState === 'scanning' && <div className="text-info fw-bold pulse-icon"><i className="bi bi-arrow-repeat me-2"></i>{message}</div>}
      {scanState === 'success' && <div className="text-success fw-bold"><i className="bi bi-check-circle-fill me-2"></i>{message}</div>}
      {scanState === 'error' && <div className="text-danger small mt-3">{message}</div>}
      {scanState === 'error' && <button onClick={() => setScanState('idle')} className="btn btn-outline-light mt-3">Try Again</button>}
    </div>
  );
};

export default BiometricScanner;