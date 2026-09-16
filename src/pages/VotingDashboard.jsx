import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getContract } from '../lib/ethereum';

const candidateList = [
  { id: 0, name: 'Dr. Alan Turing', party: 'Techno-Progressive Party', manifesto: 'Advancing computational rights, securing digital privacy, and ensuring unbreakable cryptographic integrity for all citizen data.', icon: 'bi-cpu' },
  { id: 1, name: 'Ada Lovelace', party: 'Analytical Engine Coalition', manifesto: 'Pioneering analytical frameworks, advocating for algorithmic transparency, and funding next-generation technological education.', icon: 'bi-braces-asterisk' },
  { id: 2, name: 'Grace Hopper', party: 'Compiler Consortium', manifesto: 'Debugging the bureaucratic machine. Promising less red tape and highly optimized governmental processes for the modern era.', icon: 'bi-bug' },
];

const VotingDashboard = ({ isAuthenticated, voterId }) => {
  const navigate = useNavigate();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [voteError, setVoteError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const initWallet = async () => {
      if (!window.ethereum) return;

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts && accounts.length) {
        setWalletAddress(accounts[0]);
      }
    };

    initWallet();
  }, []);

  const castVote = async () => {
    if (!selectedCandidate && selectedCandidate !== 0) return;
    if (!voterId || !String(voterId).trim()) {
      setVoteError('A valid voter ID is required before submitting the ballot.');
      return;
    }

    try {
      setIsVoting(true);
      setVoteError('');

      const contract = await getContract();
      const wallet = await contract.runner.getAddress();
      if (await contract.hasVoted(wallet)) {
        throw new Error('This wallet has already cast a vote. Each wallet can vote only once.');
      }

      const tx = await contract.vote(Number(selectedCandidate));
      const receipt = await tx.wait();

      setTxHash(receipt?.hash || tx.hash);
      setIsVoting(false);
    } catch (error) {
      setVoteError(error?.message || 'Unable to cast the vote on the blockchain.');
      setIsVoting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-3">
        <h2 className="fw-bold text-light">Official Secure Ballot</h2>
        <span className="badge bg-success px-3 py-2 rounded-pill"><i className="bi bi-shield-check me-1"></i> Biometric Session Verified</span>
      </div>

      {walletAddress && (
        <div className="alert alert-dark border-secondary text-light small mb-4">
          <strong>Wallet:</strong> {walletAddress}
        </div>
      )}

      {txHash ? (
        <div className="card card-dark-custom p-5 text-center shadow-lg border-success">
          <i className="bi bi-check-circle-fill display-3 text-success mb-3"></i>
          <h3 className="fw-bold text-light">Vote Successfully Registered</h3>
          <p className="text-muted mb-2">Your ballot was recorded on Ethereum through MetaMask.</p>
          <div className="bg-dark p-3 rounded mt-3 text-break font-monospace small border border-secondary text-info">
            <strong>Transaction Hash:</strong><br />{txHash}
          </div>
          <button onClick={() => navigate('/')} className="btn btn-outline-success mt-4 px-5 mx-auto">Return to Home</button>
        </div>
      ) : (
        <>
          <div className="row g-4">
            {candidateList.map((candidate) => (
              <div className="col-md-4" key={candidate.id}>
                <div className={`card card-dark-custom card-hover h-100 ${selectedCandidate === candidate.id ? 'border-info border-2' : ''}`} onClick={() => setSelectedCandidate(candidate.id)} style={{ cursor: 'pointer' }}>
                  <div className="card-body text-center p-4">
                    <i className={`bi ${candidate.icon} display-4 mb-3 text-info`}></i>
                    <h4 className="fw-bold text-light">{candidate.name}</h4>
                    <span className="badge bg-secondary mb-3">{candidate.party}</span>
                    <p className="text-muted small text-start mt-2">"{candidate.manifesto}"</p>
                  </div>
                  <div className="card-footer bg-transparent border-0 text-center pb-4">
                    <div className={`form-check d-inline-block ${selectedCandidate === candidate.id ? 'text-info' : 'text-muted'}`}>
                      <input className="form-check-input fs-4" type="radio" checked={selectedCandidate === candidate.id} readOnly />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {voteError && <div className="alert alert-danger mt-4 mb-0">{voteError}</div>}

          <div className="text-center mt-5">
            <button className="btn btn-primary-custom btn-lg px-5 py-3 shadow" disabled={selectedCandidate === null || isVoting} onClick={castVote}>
              {isVoting ? <><span className="spinner-border spinner-border-sm me-2"></span> Confirming MetaMask transaction...</> : <><i className="bi bi-wallet2 me-2"></i> Cast Vote with MetaMask</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default VotingDashboard;