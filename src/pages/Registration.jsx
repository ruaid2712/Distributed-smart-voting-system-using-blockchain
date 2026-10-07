import React, { useEffect, useRef, useState } from 'react';

const FACE_API_URL = import.meta.env.VITE_FACE_API_URL || 'http://127.0.0.1:8000';
const SECUGEN_API_URL = 'https://localhost:8443/SGIFPCapture';
const SECUGEN_LICENSE = import.meta.env.VITE_SECUGEN_LICENSE || '';

const base64ToBlob = (value, type) => {
  const binary = window.atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type });
};

const Registration = ({ adminToken }) => {
  const [phase, setPhase] = useState('face');
  const [voterDetails, setVoterDetails] = useState({ name: '', age: '', address: '', ward: '' });
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
    if (!voterDetails.name.trim() || !voterDetails.age || !voterDetails.address.trim() || !voterDetails.ward.trim()) {
      setError('Complete the voter details before capturing biometrics.');
      return;
    }
    if (Number(voterDetails.age) < 18 || Number(voterDetails.age) > 120) {
      setError('Voter age must be between 18 and 120.');
      return;
    }
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
      formData.append('name', voterDetails.name.trim());
      formData.append('age', voterDetails.age);
      formData.append('address', voterDetails.address.trim());
      formData.append('ward', voterDetails.ward.trim());
      formData.append('face_file', faceImage, 'face-capture.jpg');
      formData.append('fingerprint_file', base64ToBlob(capture.BMPBase64, 'image/bmp'), 'fingerprint-capture.bmp');
      const registrationResponse = await fetch(`${FACE_API_URL}/api/voters/register`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: formData,
      });
      const result = await registrationResponse.json();
      if (registrationResponse.status === 401) throw new Error('Admin session expired. Log in again.');
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
    <div className="container registration-page py-5">
      <div className="registration-shell">
        <header className="registration-header">
          <span className="auth-icon"><i className="bi bi-person-plus-fill"></i></span>
          <div><h1>Register New Voter</h1><p>Enter voter details and capture biometric information.</p></div>
        </header>

        {phase === 'complete' ? (
          <section className="registration-complete">
            <div className="success-mark"><i className="bi bi-check-lg"></i></div>
            <h2>Voter registered</h2>
            <p>{message}</p>
            <div className="registration-id"><small>Voter</small><strong>{voterDetails.name}</strong><small>Voter ID</small><b>{voterId}</b></div>
          </section>
        ) : (
          <>
            <div className="steps-track registration-steps">
              <div className={`step-item ${phase.startsWith('face') ? 'is-active' : 'is-complete'}`}><span className="step-number">{phase.startsWith('face') ? '1' : <i className="bi bi-check"></i>}</span>Voter details</div>
              <div className={`step-item ${phase.includes('fingerprint') || phase === 'submitting' ? 'is-active' : phase === 'face' || phase === 'face-scanning' ? '' : 'is-complete'}`}><span className="step-number">2</span>Biometric registration</div>
              <div className={`step-item ${phase === 'submitting' ? 'is-active' : ''}`}><span className="step-number">3</span>Save voter</div>
            </div>

            <div className="registration-layout">
              <section className="registration-details-panel">
                <div className="registration-section-heading"><span className="icon-disc"><i className="bi bi-person-lines-fill"></i></span><div><h2>Voter details</h2><p>Fill in the required information.</p></div></div>
                <div className="registration-fields">
                  <div className="mb-3"><label className="form-label">Full name <span>*</span></label><input className="form-control" autoComplete="name" placeholder="Enter full name" value={voterDetails.name} onChange={(event) => setVoterDetails({ ...voterDetails, name: event.target.value })} required /></div>
                  <div className="mb-3"><label className="form-label">Age <span>*</span></label><input className="form-control" type="number" min="18" max="120" placeholder="Enter age" value={voterDetails.age} onChange={(event) => setVoterDetails({ ...voterDetails, age: event.target.value })} required /></div>
                  <div className="mb-3 registration-address"><label className="form-label">Address <span>*</span></label><textarea className="form-control" autoComplete="street-address" rows="3" placeholder="Enter complete address" value={voterDetails.address} onChange={(event) => setVoterDetails({ ...voterDetails, address: event.target.value })} required /></div>
                  <div className="mb-3"><label className="form-label">Ward <span>*</span></label><input className="form-control" placeholder="Enter ward" value={voterDetails.ward} onChange={(event) => setVoterDetails({ ...voterDetails, ward: event.target.value })} required /></div>
                </div>
                <p className="registration-required-note"><i className="bi bi-info-circle-fill"></i> All fields are required. Voter information is stored with the generated voter ID.</p>
              </section>

              <section className="registration-biometric-panel">
                <div className="registration-section-heading"><span className="icon-disc"><i className="bi bi-shield-fill-check"></i></span><div><h2>Biometric registration</h2><p>Capture the voter’s face and fingerprint.</p></div></div>
                <div className="biometric-info mb-3"><i className="bi bi-check-circle-fill me-2"></i>Capture clear biometric data for accurate verification.</div>
                <div className="registration-capture-grid">
                  <article className={`registration-capture-card ${phase.startsWith('face') ? 'is-current' : ''}`}>
                    <h3><span className="capture-icon"><i className="bi bi-camera-fill"></i></span>Face capture</h3>
                    <p>Look toward the camera in good lighting.</p>
                    <div className="registration-capture-view">
                      {phase.startsWith('face') ? <video ref={videoRef} className="scanner-video" muted playsInline /> : <i className={`bi ${faceImage ? 'bi-person-bounding-box text-success' : 'bi-person'}`}></i>}
                      {phase === 'face-scanning' && <div className="scanner-laser"></div>}
                    </div>
                    {phase === 'face' && <button onClick={captureFace} className="btn btn-primary-custom w-100"><i className="bi bi-camera-fill"></i> Capture face</button>}
                    {phase === 'face-scanning' && <div className="capture-status text-info">{message}</div>}
                    {faceImage && !phase.startsWith('face') && <div className="capture-status text-success"><i className="bi bi-check-circle-fill me-1"></i>Face captured</div>}
                  </article>

                  <article className={`registration-capture-card ${phase === 'fingerprint' || phase === 'fingerprint-scanning' ? 'is-current' : ''}`}>
                    <h3><span className="capture-icon capture-icon--green"><i className="bi bi-fingerprint"></i></span>Fingerprint capture</h3>
                    <p>Place the voter’s finger on the sensor.</p>
                    <div className="registration-capture-view registration-fingerprint-view"><i className="bi bi-fingerprint"></i><div className={`scanner-laser ${phase === 'fingerprint-scanning' || phase === 'submitting' ? 'is-visible' : ''}`}></div></div>
                    {phase === 'fingerprint' && <button onClick={captureFingerprintAndRegister} className="btn btn-success w-100"><i className="bi bi-fingerprint"></i> Capture fingerprint</button>}
                    {(phase === 'fingerprint-scanning' || phase === 'submitting') && <div className="capture-status text-info">{message}</div>}
                    {phase === 'face' && <div className="capture-status text-muted">Capture the face first.</div>}
                  </article>
                </div>
                {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Registration;
