import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BiometricScanner from '../components/BiometricScanner';

const Login = ({ setIsAuthenticated }) => {
  const [step, setStep] = useState(1);
  const [voterId, setVoterId] = useState('');
  const navigate = useNavigate();

  const handleIdSubmit = (event) => {
    event.preventDefault();
    if (voterId.trim().length >= 6) setStep(2);
  };

  const handleBiometricSuccess = () => {
    setIsAuthenticated(true);
    navigate('/vote');
  };

  return (
    <div className="container py-5"><div className="row justify-content-center"><div className="col-md-6 col-lg-5"><div className="card card-dark-custom p-5 shadow-lg">
      <div className="text-center mb-4"><i className="bi bi-lock-fill fs-1 text-info"></i><h3 className="fw-bold mt-2 text-light">Voter Portal</h3><p className="text-muted small">Secure End-to-End Encryption</p></div>
      {step === 1 ? <form onSubmit={handleIdSubmit}><div className="mb-4"><label className="form-label text-muted fw-semibold">National Voter ID</label><input type="text" className="form-control form-control-lg" placeholder="e.g. VTR-88492" value={voterId} onChange={(event) => setVoterId(event.target.value)} required /></div><button type="submit" className="btn btn-primary-custom w-100 btn-lg">Verify ID <i className="bi bi-chevron-right ms-2"></i></button></form> : <BiometricScanner voterId={voterId} onSuccess={handleBiometricSuccess} />}
    </div></div></div></div>
  );
};

export default Login;