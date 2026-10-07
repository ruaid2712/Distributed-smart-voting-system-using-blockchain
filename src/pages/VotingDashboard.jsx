import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidatesData } from '../data/mockData';
import { getContract } from '../lib/ethereum';

const FACE_API_URL = import.meta.env.VITE_FACE_API_URL || 'http://127.0.0.1:8000';
const SECUGEN_API_URL = 'https://localhost:8443/SGIFPCapture';
const SECUGEN_LICENSE = import.meta.env.VITE_SECUGEN_LICENSE || '';

const base64ToBlob = (value, type) => {
  const binary = window.atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type });
};

const candidateList = candidatesData.map((candidate, id) => ({
  ...candidate,
  id,
  active: true,
}));

const VotingDashboard = ({ isAuthenticated, voterId, voterName }) => {
  const navigate = useNavigate();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [voteError, setVoteError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [voteMessage, setVoteMessage] = useState('');

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
      setVoteMessage('Place your finger on the SecuGen reader to verify your identity.');

      const captureResponse = await fetch(SECUGEN_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          Timeout: '10000',
          Quality: '50',
          licstr: SECUGEN_LICENSE,
          templateFormat: 'ISO',
          imageWSQRate: '0.75',
        }),
      });
      if (!captureResponse.ok) {
        throw new Error(`SecuGen service returned HTTP ${captureResponse.status}.`);
      }

      const capture = await captureResponse.json();
      if (capture.ErrorCode !== 0) {
        const detail = capture.ErrorCode >= 10000
          ? 'Check the SecuGen license configuration.'
          : 'Check that the reader is connected.';
        throw new Error(`SecuGen capture failed (error ${capture.ErrorCode}). ${detail}`);
      }
      if (!capture.BMPBase64) throw new Error('SecuGen returned no fingerprint image.');

      setVoteMessage('Checking your fingerprint against the enrolled template...');
      const formData = new FormData();
      formData.append('file', base64ToBlob(capture.BMPBase64, 'image/bmp'), 'fingerprint.bmp');
      const verificationResponse = await fetch(
        `${FACE_API_URL}/api/fingerprint/verify?voter_id=${encodeURIComponent(String(voterId).trim())}`,
        { method: 'POST', body: formData },
      );
      const verification = await verificationResponse.json();
      if (!verificationResponse.ok) {
        throw new Error(verification.detail || 'Fingerprint verification failed.');
      }
      if (!verification.verified) {
        throw new Error(verification.message || 'Fingerprint does not match the enrolled template.');
      }

      setVoteMessage('Fingerprint verified. Confirm the transaction in your wallet.');
      const contract = await getContract();
      const wallet = await contract.runner.getAddress();
      if (await contract.hasVoted(wallet)) {
        throw new Error('This wallet has already cast a vote. Each wallet can vote only once.');
      }

      const tx = await contract.vote(Number(selectedCandidate));
      const receipt = await tx.wait();

      setTxHash(receipt?.hash || tx.hash);
      setIsVoting(false);
      setVoteMessage('');
    } catch (error) {
      setVoteError(error?.message || 'Unable to cast the vote on the blockchain.');
      setIsVoting(false);
      setVoteMessage('');
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <header className="ballot-header">
        <div className="container">
          <span className="section-kicker">General election 2026</span>
          <h1>{txHash ? <>Vote successfully <span>registered</span></> : <>Cast your <span>vote</span></>}</h1>
          <p>{txHash ? 'Your confirmed ballot has been recorded on the blockchain.' : 'Select one candidate and review your choice before confirming.'}</p>
        </div>
      </header>
      <div className="container py-4 py-lg-5">
        <div className="ballot-steps">
          <div className="steps-track mb-0">
            <div className="step-item is-complete"><span className="step-number"><i className="bi bi-check"></i></span>Enter voter ID</div>
            <div className="step-item is-complete"><span className="step-number"><i className="bi bi-check"></i></span>Biometric verification</div>
            <div className={`step-item ${txHash ? 'is-complete' : 'is-active'}`}><span className="step-number">{txHash ? <i className="bi bi-check"></i> : '3'}</span>{txHash ? 'Vote confirmed' : 'Fingerprint & cast vote'}</div>
          </div>
        </div>

        {walletAddress && <div className="wallet-banner alert small mb-3"><strong>Connected wallet</strong><span className="ms-2 font-monospace">{walletAddress}</span></div>}

        {txHash ? (
          <section className="vote-success card card-dark-custom">
            <div className="success-mark"><i className="bi bi-check-lg"></i></div>
            <h2 className="fw-bold">Your vote is on the ledger.</h2>
            <p className="text-muted">Thank you for participating in a fair and transparent election.</p>
            <div className="transaction-panel">
              <div className="d-flex align-items-center gap-3">
                <span className="icon-disc"><i className="bi bi-link-45deg"></i></span>
                <div className="overflow-hidden"><strong className="d-block">Transaction hash</strong><span className="font-monospace small text-info text-break">{txHash}</span></div>
                <button type="button" className="btn btn-outline-info ms-auto flex-shrink-0" title="Copy transaction hash" aria-label="Copy transaction hash" onClick={() => navigator.clipboard?.writeText(txHash)}><i className="bi bi-copy"></i></button>
              </div>
              <small className="d-block text-muted mt-2">This transaction is stored on the election ledger.</small>
            </div>
            <div className="success-points">
              <div className="success-point"><span className="icon-disc"><i className="bi bi-shield-check"></i></span><h3>Secure</h3><p>Your vote is recorded safely.</p></div>
              <div className="success-point"><span className="icon-disc" style={{ color: '#10945f', background: '#e5f8ee' }}><i className="bi bi-lock-fill"></i></span><h3>Private</h3><p>Your identity stays separate.</p></div>
              <div className="success-point"><span className="icon-disc" style={{ color: '#7651d4', background: '#f0eaff' }}><i className="bi bi-box"></i></span><h3>Tamper-resistant</h3><p>Recorded on blockchain.</p></div>
              <div className="success-point"><span className="icon-disc" style={{ color: '#d66c19', background: '#fff0df' }}><i className="bi bi-file-earmark-text"></i></span><h3>Transparent</h3><p>Transaction can be audited.</p></div>
            </div>
            <button onClick={() => navigate('/')} className="btn btn-primary-custom mx-auto px-5"><i className="bi bi-house-fill"></i> Return to Home</button>
          </section>
        ) : (
          <div className="ballot-layout">
            <section className="ballot-main">
              <h2 className="ballot-title"><i className="bi bi-people-fill text-info me-2"></i>Candidates / Parties</h2>
              <p className="ballot-subtitle">Choose one candidate, then verify your fingerprint to submit your vote.</p>
              <div className="row g-3">
                {candidateList.map((candidate) => {
                  const isSelected = candidate.chainId !== null && selectedCandidate === candidate.chainId;
                  const isUnavailable = candidate.chainId === null;
                  return <div className="col-sm-6 col-xl-4" key={candidate.id}>
                    <article role="button" tabIndex={isUnavailable || isVoting ? -1 : 0} aria-pressed={isSelected} aria-disabled={isUnavailable || isVoting} className={`candidate-card ${isSelected ? 'is-selected' : ''} ${isUnavailable ? 'candidate-card--disabled' : ''}`} onClick={() => !isUnavailable && !isVoting && setSelectedCandidate(candidate.chainId)} onKeyDown={(event) => { if (!isUnavailable && !isVoting && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); setSelectedCandidate(candidate.chainId); } }}>
                      <span className="candidate-icon"><i className={`bi ${candidate.icon}`}></i></span>
                      <h3 className="candidate-name">{candidate.name}</h3>
                      <div className="candidate-party">{candidate.party}</div>
                      <p className="candidate-manifesto">{candidate.manifesto}</p>
                      {isUnavailable && <span className="badge bg-warning text-dark">Awaiting ballot deployment</span>}
                      <div><input className="form-check-input candidate-radio" type="radio" checked={isSelected} disabled={isUnavailable} readOnly aria-label={`Select ${candidate.name}`} /></div>
                    </article>
                  </div>;
                })}
              </div>
              {voteError && <div className="alert alert-danger mt-3 mb-0">{voteError}</div>}
            </section>

            <aside className="ballot-sidebar d-grid gap-3">
              <section className="info-panel">
                <h3><i className="bi bi-person-vcard text-info me-2"></i>Voter information</h3>
                <div className="d-flex justify-content-between py-2 border-bottom"><span className="text-muted small">Name</span><strong className="small">{voterName || 'Voter'}</strong></div>
                <div className="d-flex justify-content-between py-2 border-bottom"><span className="text-muted small">Voter ID</span><strong className="small">{voterId}</strong></div>
                <div className="d-flex justify-content-between py-2"><span className="text-muted small">Verification</span><strong className="small text-success"><i className="bi bi-check-circle-fill me-1"></i>Verified</strong></div>
              </section>
              <section className="info-panel">
                <h3><i className="bi bi-shield-check text-info me-2"></i>Before you cast</h3>
                <ul><li>You can select one candidate.</li><li>A confirmed vote cannot be changed.</li><li>Your vote is recorded on the blockchain.</li></ul>
              </section>
              {selectedCandidate !== null && <section className="review-selection"><span className="small fw-bold text-info">Review selection</span><strong className="d-block mt-1">{candidateList.find((candidate) => candidate.chainId === selectedCandidate)?.name}</strong></section>}
              {isVoting && <div className="text-info small text-center" role="status"><span className="spinner-border spinner-border-sm me-2"></span>{voteMessage}</div>}
              <button className="btn btn-primary-custom w-100" disabled={selectedCandidate === null || isVoting} onClick={castVote}>
                {isVoting ? <>Verify fingerprint &amp; cast vote...</> : <><i className="bi bi-fingerprint me-2"></i>Verify fingerprint &amp; cast vote</>}
              </button>
            </aside>
          </div>
        )}
      </div>
    </>
  );
};

export default VotingDashboard;