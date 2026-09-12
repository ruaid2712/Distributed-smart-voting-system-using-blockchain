import React, { useEffect, useRef, useState } from 'react';

const FACE_API_URL = import.meta.env.VITE_FACE_API_URL || 'http://127.0.0.1:8000';
const SECUGEN_API_URL = 'https://localhost:8443/SGIFPCapture';
const SECUGEN_LICENSE = import.meta.env.VITE_SECUGEN_LICENSE || '';

const base64ToBlob = (value, type) => {
  const binary = window.atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type });
};

const Registration = () => {
  const [phase, setPhase] = useState('face');
  const [faceImage, setFaceImage] = useState(null);
  const [voterId, setVoterId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
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

  const captureFace = async () => {
    setError('');
    setMessage('Starting camera...');
    setPhase('face-scanning');
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      videoRef.current.srcObject = streamRef.current;
      await videoRef.current.play();
      setMessage('Hold still while your face is captured...');
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      const image = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!image) throw new Error('Unable to capture the face image.');
      setFaceImage(image);
      stopCamera();
      setPhase('fingerprint');
      setMessage('Face captured. Continue with the fingerprint scan.');
    } catch (captureError) {
      stopCamera();
      setPhase('face');
      setError(captureError.message || 'Unable to access the camera.');
    }
  };

  const captureFingerprintAndRegister = async () => {
    setError('');
    setPhase('fingerprint-scanning');
    setMessage('Place the new voter\'s finger on the SecuGen reader...');
    try {
      const captureResponse = await fetch(SECUGEN_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ Timeout: '10000', Quality: '50', licstr: SECUGEN_LICENSE, templateFormat: 'ISO', imageWSQRate: '0.75' }),
      });
      if (!captureResponse.ok) throw new Error(`SecuGen service returned HTTP ${captureResponse.status}.`);
      const capture = await captureResponse.json();
      if (capture.ErrorCode !== 0) {
        const detail = capture.ErrorCode >= 10000 ? 'Check the SecuGen license configuration.' : 'Check that the reader is connected.';
        throw new Error(`SecuGen capture failed (error ${capture.ErrorCode}). ${detail}`);
      }
      if (!capture.BMPBase64) throw new Error('SecuGen returned no fingerprint image.');

      setPhase('submitting');
      setMessage('Saving biometric templates and generating voter ID...');
      const formData = new FormData();
      formData.append('face_file', faceImage, 'face-capture.jpg');
      formData.append('fingerprint_file', base64ToBlob(capture.BMPBase64, 'image/bmp'), 'fingerprint-capture.bmp');
      const registrationResponse = await fetch(`${FACE_API_URL}/api/voters/register`, { method: 'POST', body: formData });
      const result = await registrationResponse.json();
      if (!registrationResponse.ok) throw new Error(result.detail || 'Voter registration failed.');
      setVoterId(result.voterId);
      setPhase('complete');
      setMessage('Registration complete. Give this voter ID to the voter.');
    } catch (registrationError) {
      setPhase('fingerprint');
      setError(registrationError.message || 'Unable to register the voter.');
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card card-dark-custom p-4 p-md-5 shadow-lg">
            <div className="text-center mb-4">
              <i className="bi bi-person-plus-fill fs-1 text-info"></i>
              <h3 className="fw-bold mt-2 text-light">Register New Voter</h3>
              <p className="text-muted small mb-0">Capture both biometrics to create a voter identity.</p>
            </div>

            <div className="d-flex justify-content-center gap-2 mb-4">
              <span className={`badge ${phase.startsWith('face') ? 'bg-info text-dark' : 'bg-success'}`}>1. Face</span>
              <span className={`badge ${phase.includes('fingerprint') || phase === 'submitting' ? 'bg-info text-dark' : phase === 'complete' ? 'bg-success' : 'bg-secondary'}`}>2. Fingerprint</span>
            </div>

            {phase.startsWith('face') && <div className="scanner-container mb-4"><video ref={videoRef} className="scanner-video" muted playsInline /></div>}
            {phase === 'fingerprint' || phase === 'fingerprint-scanning' || phase === 'submitting' ? <div className={`scanner-container mb-4 ${phase !== 'fingerprint' ? 'scanner-active' : ''}`}><i className="bi bi-fingerprint scanner-icon"></i><div className="scanner-laser"></div></div> : null}

            {phase === 'face' && <button onClick={captureFace} className="btn btn-primary-custom w-100">Capture Face <i className="bi bi-camera ms-2"></i></button>}
            {phase === 'face-scanning' && <div className="text-info fw-bold text-center">{message}</div>}
            {phase === 'fingerprint' && <button onClick={captureFingerprintAndRegister} className="btn btn-primary-custom w-100">Capture Fingerprint <i className="bi bi-fingerprint ms-2"></i></button>}
            {(phase === 'fingerprint-scanning' || phase === 'submitting') && <div className="text-info fw-bold text-center">{message}</div>}
            {phase === 'complete' && <div className="text-center"><div className="text-success fw-bold mb-3">{message}</div><div className="border border-success rounded p-3"><small className="text-muted d-block">New voter ID</small><strong className="text-info fs-2 font-monospace">{voterId}</strong></div></div>}
            {error && <div className="text-danger small mt-3 text-center">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;
