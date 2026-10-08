import React, { useEffect, useRef, useState } from 'react';

const FACE_API_URL = import.meta.env.VITE_FACE_API_URL || 'http://127.0.0.1:8000';
const SECUGEN_API_URL = 'https://localhost:8443/SGIFPCapture';
const SECUGEN_LICENSE = import.meta.env.VITE_SECUGEN_LICENSE || '';

const base64ToBlob = (value, type) => {
  const binary = window.atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type });
};

const BiometricScanner = ({ voterId, onSuccess }) => {
  const [scanState, setScanState] = useState('idle');
  const [activeMethod, setActiveMethod] = useState(null);
  const [verifiedMethod, setVerifiedMethod] = useState(null);
  const [verifiedName, setVerifiedName] = useState('');
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
    const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!image) throw new Error('Unable to capture a face image.');
    const formData = new FormData();
    formData.append('file', image, 'face-capture.jpg');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    const endpoint = `${FACE_API_URL}/api/face/verify?voter_id=${encodeURIComponent(voterId)}`;
    const requestStartedAt = performance.now();
    setMessage('Sending face image to the biometric service...');
    console.info('[BioVoteChain] Sending face verification request');
    let response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      console.info(`[BioVoteChain] Face verification responded with HTTP ${response.status} in ${((performance.now() - requestStartedAt) / 1000).toFixed(2)}s`);
      setMessage('Biometric service responded. Checking the face match...');
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Face verification timed out. Check that the biometric service is running, then try again.');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || 'Face verification failed.');
    if (!result.verified) throw new Error(result.message);
    return result;
  };

  const startFaceScan = async () => {
    setActiveMethod('face');
    setVerifiedMethod(null);
    setVerifiedName('');
    setScanState('scanning');
    setMessage('Starting camera...');
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      videoRef.current.srcObject = streamRef.current;
      await videoRef.current.play();
      setMessage('Look into the camera and hold still...');
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const result = await verifyCapturedFace();
      stopCamera();
      setScanState('success');
      setMessage('Face verified successfully.');
      setVerifiedMethod('face');
      setVerifiedName(result.name || '');
    } catch (error) {
      stopCamera();
      setScanState('error');
      setMessage(error.message || 'Unable to verify this face.');
    }
  };

  const startFingerprintScan = async () => {
    setActiveMethod('fingerprint');
    setVerifiedMethod(null);
    setVerifiedName('');
    setScanState('scanning');
    setMessage('Place your finger on the SecuGen reader...');
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

      const fingerprintImage = base64ToBlob(capture.BMPBase64, 'image/bmp');
      const formData = new FormData();
      formData.append('file', fingerprintImage, 'fingerprint.bmp');
      const verificationResponse = await fetch(`${FACE_API_URL}/api/fingerprint/verify?voter_id=${encodeURIComponent(voterId)}`, {
        method: 'POST', body: formData,
      });
      const result = await verificationResponse.json();
      if (!verificationResponse.ok) throw new Error(result.detail || 'Fingerprint verification failed.');
      if (!result.verified) throw new Error(result.message || 'Fingerprint does not match the enrolled template.');
      setScanState('success');
      setMessage(result.message);
      setVerifiedMethod('fingerprint');
      setVerifiedName(result.name || '');
    } catch (error) {
      setScanState('error');
      setMessage(error.message || 'Unable to verify this fingerprint.');
    }
  };

  return (
    <div className="biometric-login">
      <div className="steps-track">
        <div className="step-item is-complete"><span className="step-number"><i className="bi bi-check"></i></span>Enter voter ID</div>
        <div className={`step-item ${verifiedMethod ? 'is-complete' : 'is-active'}`}><span className="step-number">{verifiedMethod ? <i className="bi bi-check"></i> : '2'}</span>Biometric verification</div>
        <div className="step-item"><span className="step-number">3</span>Access ballot</div>
      </div>

      <div className="biometric-login-heading">
        <h2>Biometric Verification</h2>
        <p>Verify your identity using one method to continue.</p>
      </div>

      <div className="login-biometric-options">
        <section className={`bio-panel login-bio-option ${verifiedMethod === 'face' ? 'is-verified' : ''}`}>
          <span className="login-bio-icon login-bio-icon-face"><i className={verifiedMethod === 'face' ? 'bi bi-check-circle-fill' : 'bi bi-person-bounding-box'}></i></span>
          <h3>Face Verification</h3>
          <p>Look into the camera to verify your identity.</p>
          <div className={`login-bio-preview ${activeMethod === 'face' && scanState === 'scanning' ? 'is-camera-active' : ''}`}>
            {activeMethod === 'face' && scanState === 'scanning' ? <video ref={videoRef} className="scanner-video" muted playsInline /> : <i className={verifiedMethod === 'face' ? 'bi bi-check-lg' : 'bi bi-person-fill'}></i>}
            {activeMethod === 'face' && scanState === 'scanning' && <div className="scanner-laser"></div>}
          </div>
          <button className="btn btn-primary-custom w-100" onClick={startFaceScan} disabled={scanState === 'scanning'}>
            <i className={`bi ${verifiedMethod === 'face' ? 'bi-check-circle' : 'bi-camera-fill'}`}></i>{verifiedMethod === 'face' ? 'Face verified' : activeMethod === 'face' && scanState === 'scanning' ? 'Verifying face...' : 'Start Face Verification'}
          </button>
        </section>

        <div className="biometric-or">OR</div>

        <section className={`bio-panel bio-panel--finger login-bio-option ${verifiedMethod === 'fingerprint' ? 'is-verified' : ''}`}>
          <span className="login-bio-icon login-bio-icon-finger"><i className={verifiedMethod === 'fingerprint' ? 'bi bi-check-circle-fill' : 'bi bi-fingerprint'}></i></span>
          <h3>Fingerprint Verification</h3>
          <p>Place your finger on the sensor to verify your identity.</p>
          <div className="login-bio-preview login-bio-preview-finger"><i className={verifiedMethod === 'fingerprint' ? 'bi bi-check-lg' : 'bi bi-fingerprint'}></i></div>
          <button className="btn btn-success w-100" onClick={startFingerprintScan} disabled={scanState === 'scanning'}>
            <i className={`bi ${verifiedMethod === 'fingerprint' ? 'bi-check-circle' : 'bi-fingerprint'}`}></i>{verifiedMethod === 'fingerprint' ? 'Fingerprint verified' : activeMethod === 'fingerprint' && scanState === 'scanning' ? 'Verifying fingerprint...' : 'Start Fingerprint Verification'}
          </button>
        </section>
      </div>

      <div className="biometric-info login-biometric-note"><i className="bi bi-info-circle-fill"></i><span>Choose Face Verification if fingerprint capture is unavailable. Either successful verification method can continue to the ballot.</span></div>
      {scanState === 'scanning' && <div className="capture-status text-info mt-3" role="status"><i className="bi bi-arrow-repeat me-2"></i>{message}</div>}
      {scanState === 'success' && <div className="capture-status text-success mt-3" role="status"><i className="bi bi-check-circle-fill me-2"></i>{message}</div>}
      {scanState === 'error' && <div className="alert alert-danger mt-3 mb-0" role="alert">{message}</div>}
      {scanState === 'error' && <button onClick={() => { setScanState('idle'); setActiveMethod(null); setMessage(''); }} className="btn btn-outline-light mt-3">Try Again</button>}
      <button className="btn btn-primary-custom btn-lg w-100 mt-3" disabled={!verifiedMethod || scanState !== 'success'} onClick={() => onSuccess(verifiedName)}>
        Continue <i className="bi bi-arrow-right ms-2"></i>
      </button>
    </div>
  );
};

export default BiometricScanner;