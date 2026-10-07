import React from 'react';
import { Link } from 'react-router-dom';

const Home = ({ isAuthenticated, isAdmin }) => (
  <>
    <section className="hero-section">
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="hero-kicker">Secure <span>·</span> Transparent <span>·</span> Trusted</div>
          <h1>One identity.<br /><span>One vote.</span></h1>
          <p>Biometric verification and blockchain accountability, brought together for a fair and confident election.</p>
          {!isAdmin && <div className="hero-actions"><Link to={isAuthenticated ? '/vote' : '/login'} className="btn btn-primary-custom btn-lg">{isAuthenticated ? 'Open your ballot' : 'Enter voter portal'} <i className="bi bi-arrow-right"></i></Link>{!isAuthenticated && <Link to="/admin-login" className="btn btn-outline-light btn-lg">Admin portal</Link>}</div>}
          <div className="hero-points"><span><i className="bi bi-shield-check"></i> Secure access</span><span><i className="bi bi-person-check"></i> One person, one vote</span><span><i className="bi bi-journal-check"></i> Verifiable process</span></div>
        </div>
        <div className="hero-media">
          <img className="hero-image" src="https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1400&q=85" alt="Voters participating in an election" />
          <div className="hero-image-note"><i className="bi bi-fingerprint"></i><span>Identity verified.<br />Your vote stays yours.</span></div>
        </div>
      </div>
    </section>
    <section className="home-pillars container">
      <div className="row align-items-end mb-3"><div className="col-md-7"><span className="section-kicker">Built for trust</span><h2 className="mt-2">Every step, accountable.</h2></div><div className="col-md-5 text-md-end text-muted">A clear process from identity check to confirmed ballot.</div></div>
      <div className="row g-4 mt-2">
        <div className="col-md-4"><article className="home-pillar"><div className="home-pillar-icon"><i className="bi bi-fingerprint"></i></div><h3>Biometric identity</h3><p>Face and fingerprint checks help ensure each eligible voter has one secure session.</p></article></div>
        <div className="col-md-4"><article className="home-pillar"><div className="home-pillar-icon"><i className="bi bi-shield-lock"></i></div><h3>Private by design</h3><p>Voter identity stays separate from the public blockchain vote record.</p></article></div>
        <div className="col-md-4"><article className="home-pillar"><div className="home-pillar-icon"><i className="bi bi-box-seam"></i></div><h3>Ledger-backed</h3><p>Once confirmed, a vote is recorded transparently on the election ledger.</p></article></div>
      </div>
    </section>
  </>
);

export default Home;