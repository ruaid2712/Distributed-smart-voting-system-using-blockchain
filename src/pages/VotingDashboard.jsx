import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidatesData, recordVote } from '../data/mockData';

const VotingDashboard = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [txHash, setTxHash] = useState('');

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  const castVote = () => {
    if (!selectedCandidate) return;
    setIsVoting(true);
    setTimeout(() => {
      recordVote(selectedCandidate);
      setIsVoting(false);
      const mockHash = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setTxHash(mockHash);
    }, 2500);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-3"><h2 className="fw-bold text-light">Official Secure Ballot</h2><span className="badge bg-success px-3 py-2 rounded-pill"><i className="bi bi-shield-check me-1"></i> Biometric Session Verified</span></div>
      {txHash ? <div className="card card-dark-custom p-5 text-center shadow-lg border-success"><i className="bi bi-check-circle-fill display-3 text-success mb-3"></i><h3 className="fw-bold text-light">Vote Successfully Registered</h3><p className="text-muted mb-2">Your cryptographic ballot has been written to the distributed ledger.</p><div className="bg-dark p-3 rounded mt-3 text-break font-monospace small border border-secondary text-info"><strong>Transaction Hash:</strong><br />{txHash}</div><button onClick={() => navigate('/')} className="btn btn-outline-success mt-4 px-5 mx-auto">Return to Home</button></div> : <><div className="row g-4">{candidatesData.map((candidate) => <div className="col-md-4" key={candidate.id}><div className={`card card-dark-custom card-hover h-100 ${selectedCandidate === candidate.id ? 'border-info border-2' : ''}`} onClick={() => setSelectedCandidate(candidate.id)} style={{ cursor: 'pointer' }}><div className="card-body text-center p-4"><i className={`bi ${candidate.icon} display-4 mb-3 text-info`}></i><h4 className="fw-bold text-light">{candidate.name}</h4><span className="badge bg-secondary mb-3">{candidate.party}</span><p className="text-muted small text-start mt-2">"{candidate.manifesto}"</p></div><div className="card-footer bg-transparent border-0 text-center pb-4"><div className={`form-check d-inline-block ${selectedCandidate === candidate.id ? 'text-info' : 'text-muted'}`}><input className="form-check-input fs-4" type="radio" checked={selectedCandidate === candidate.id} readOnly /></div></div></div></div>)}</div><div className="text-center mt-5"><button className="btn btn-primary-custom btn-lg px-5 py-3 shadow" disabled={!selectedCandidate || isVoting} onClick={castVote}>{isVoting ? <><span className="spinner-border spinner-border-sm me-2"></span> Executing Smart Contract...</> : <><i className="bi bi-envelope-paper-fill me-2"></i> Cryptographically Seal &amp; Cast Vote</>}</button></div></>}
    </div>
  );
};

export default VotingDashboard;