import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FACE_API_URL = import.meta.env.VITE_FACE_API_URL || 'http://127.0.0.1:8000';

const AdminLogin = ({ setIsAdmin, setAdminToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleAdminAuth = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch(`${FACE_API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'Admin login failed.');
      setAdminToken(result.token);
      setIsAdmin(true);
      navigate('/admin');
    } catch (loginError) {
      setError(loginError.message || 'Unable to contact the admin service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page"><div className="container auth-layout">
      <aside className="auth-aside"><span className="section-kicker">Election operations</span><h1>Protect the<br /><span>process.</span></h1><p>Manage voter enrollment and monitor election activity from one secure admin portal.</p><div className="hero-points flex-column align-items-start"><span><i className="bi bi-shield-lock"></i> Restricted access</span><span><i className="bi bi-activity"></i> Live ledger status</span></div></aside>
      <section className="card card-dark-custom auth-card">
        <div className="text-center mb-4"><div className="auth-icon"><i className="bi bi-shield-lock-fill"></i></div><h2 className="fw-bold mt-2">Admin Portal</h2><p className="text-muted small">Sign in to manage this election.</p></div>
        {error && <div className="alert alert-danger py-2 text-center small mb-3">{error}</div>}
        <form onSubmit={handleAdminAuth}>
          <div className="mb-3"><label className="form-label small fw-semibold">Admin Username</label><input type="text" className="form-control" placeholder="Admin username" value={username} onChange={(event) => { setUsername(event.target.value); setError(''); }} required /></div>
          <div className="mb-4"><label className="form-label small fw-semibold">Password</label><input type="password" className="form-control" placeholder="Admin password" value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} required /></div>
          <button type="submit" className="btn btn-primary-custom w-100 btn-lg" disabled={isSubmitting}>{isSubmitting ? 'Authenticating...' : 'Authenticate Node'} <i className="bi bi-arrow-right ms-2"></i></button>
        </form>
      </section>
    </div></div>
  );
};

export default AdminLogin;