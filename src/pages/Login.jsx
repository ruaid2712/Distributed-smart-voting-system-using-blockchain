import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BiometricScanner from '../components/BiometricScanner';

const Login = ({ setIsAuthenticated, setVoterId, setVoterName }) => {
  const [step, setStep] = useState(1);
  const [voterId, setLocalVoterId] = useState('');
  const navigate = useNavigate();

  const handleIdSubmit = (event) => {
    event.preventDefault();
    const cleanedId = voterId.trim();
    if (cleanedId.length >= 6) {
      setVoterId(cleanedId);
      setStep(2);
    }
  };

  const handleBiometricSuccess = (name) => {
    const cleanedId = voterId.trim();
    if (cleanedId) setVoterId(cleanedId);
    setVoterName(name || '');
    setIsAuthenticated(true);
    navigate('/vote');
  };

  return (
    <div className="auth-page"><div className={`container auth-layout ${step === 2 ? 'auth-layout--biometric' : ''}`}>
      <aside className="auth-aside"><span className="section-kicker">Secure · Transparent · Trusted</span><h1>Your vote.<br /><span>Your voice.</span></h1><p>Biometric verification for a fair and secure election process.</p><div className="hero-points flex-column align-items-start"><span><i className="bi bi-shield-check"></i> Secure access</span><span><i className="bi bi-people"></i> One person, one vote</span><span><i className="bi bi-file-earmark-check"></i> Transparent process</span></div></aside>
      <section className={`card card-dark-custom auth-card ${step === 2 ? 'auth-card--biometric' : ''}`}>
        <div className="text-center mb-4"><div className="auth-icon"><i className="bi bi-lock-fill"></i></div><h2 className="fw-bold mt-2">Voter Portal</h2><p className="text-muted small">Enter your voter ID to securely access your ballot.</p></div>
        {step === 1 ? <form onSubmit={handleIdSubmit}><div className="mb-4"><label className="form-label fw-semibold">National Voter ID</label><input type="text" className="form-control form-control-lg" placeholder="e.g. VTR-88492" value={voterId} onChange={(event) => setLocalVoterId(event.target.value)} required /></div><button type="submit" className="btn btn-primary-custom w-100 btn-lg">Verify ID <i className="bi bi-arrow-right ms-2"></i></button></form> : <BiometricScanner voterId={voterId} onSuccess={handleBiometricSuccess} />}
      </section>
    </div></div>
  );
};

export default Login;