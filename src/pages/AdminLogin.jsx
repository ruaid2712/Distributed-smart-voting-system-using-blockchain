import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = ({ setIsAdmin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleAdminAuth = (event) => {
    event.preventDefault();
    if (username === 'admin' && password === 'admin') {
      setIsAdmin(true);
      navigate('/admin');
    } else {
      setError(true);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center"><div className="col-md-6 col-lg-5"><div className="card card-dark-custom p-5 shadow-lg">
        <div className="text-center mb-4"><i className="bi bi-shield-lock-fill fs-1 text-info"></i><h3 className="fw-bold mt-2 text-light">Admin Portal</h3><p className="text-muted small">Restricted Node Access</p></div>
        {error && <div className="alert alert-danger py-2 text-center small mb-3">Invalid credentials. Use <strong>admin</strong> / <strong>admin</strong>.</div>}
        <form onSubmit={handleAdminAuth}>
          <div className="mb-3"><label className="form-label text-muted small fw-semibold">Admin Username</label><input type="text" className="form-control" placeholder="admin" value={username} onChange={(event) => { setUsername(event.target.value); setError(false); }} required /></div>
          <div className="mb-4"><label className="form-label text-muted small fw-semibold">Password</label><input type="password" className="form-control" placeholder="********" value={password} onChange={(event) => { setPassword(event.target.value); setError(false); }} required /></div>
          <button type="submit" className="btn btn-primary-custom w-100 btn-lg">Authenticate Node <i className="bi bi-arrow-right ms-2"></i></button>
        </form>
      </div></div></div>
    </div>
  );
};

export default AdminLogin;