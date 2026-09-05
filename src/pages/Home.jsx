import React from 'react';
import { Link } from 'react-router-dom';

const Home = ({ isAuthenticated }) => (
  <>
    <section className="hero-section text-center">
      <div className="container">
        <h1 className="display-4 fw-bold mb-4">The Future of Secure Democracy</h1>
        <p className="lead mb-5 mx-auto" style={{ maxWidth: '700px' }}>BioVoteChain combines state-of-the-art biometric authentication with decentralized blockchain infrastructure to guarantee immutable, transparent, and coercion-free elections.</p>
        <Link to={isAuthenticated ? '/vote' : '/login'} className="btn btn-lg btn-info text-dark fw-bold px-5 py-3 rounded-pill shadow">Access Voting Terminal <i className="bi bi-arrow-right ms-2"></i></Link>
      </div>
    </section>
    <section className="py-5 container">
      <div className="row g-4 mt-2">
        <div className="col-md-4"><div className="card card-dark-custom card-hover h-100 p-4 text-center"><div className="mb-3"><i className="bi bi-fingerprint display-4 text-info"></i></div><h4 className="fw-bold text-light">Biometric Security</h4><p className="text-muted">Multi-modal facial and fingerprint scanning ensures that one citizen equals exactly one vote. No exceptions.</p></div></div>
        <div className="col-md-4"><div className="card card-dark-custom card-hover h-100 p-4 text-center"><div className="mb-3"><i className="bi bi-shield-lock display-4 text-info"></i></div><h4 className="fw-bold text-light">Immutability</h4><p className="text-muted">Votes are encrypted and stored across a distributed ledger. Once cast, a ballot cannot be altered, deleted, or tampered with.</p></div></div>
        <div className="col-md-4"><div className="card card-dark-custom card-hover h-100 p-4 text-center"><div className="mb-3"><i className="bi bi-eye display-4 text-info"></i></div><h4 className="fw-bold text-light">Absolute Transparency</h4><p className="text-muted">Real-time auditing allows the public to verify the integrity of the election without compromising voter anonymity.</p></div></div>
      </div>
    </section>
  </>
);

export default Home;