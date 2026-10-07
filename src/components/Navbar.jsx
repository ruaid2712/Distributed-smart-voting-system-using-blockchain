import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const FACE_API_URL = import.meta.env.VITE_FACE_API_URL || 'http://127.0.0.1:8000';

const Navbar = ({ isAuthenticated, setIsAuthenticated, isAdmin, setIsAdmin, adminToken, setAdminToken, setVoterName }) => {
  const navigate = useNavigate();
  const [isNavExpanded, setIsNavExpanded] = useState(false);

  const closeNav = () => setIsNavExpanded(false);

  const handleLogout = () => {
    if (adminToken) {
      fetch(`${FACE_API_URL}/api/admin/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      }).catch(() => {});
    }
    setIsAuthenticated(false);
    setIsAdmin(false);
    setAdminToken('');
    setVoterName('');
    closeNav();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-custom sticky-top">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <i className="bi bi-fingerprint fs-2 me-2 text-info"></i>
          BioVote<span>Chain</span>
        </Link>
        <button className="navbar-toggler border-0" type="button" aria-label="Toggle navigation" aria-expanded={isNavExpanded} aria-controls="navbarNav" onClick={() => setIsNavExpanded((expanded) => !expanded)}>
          <i className="bi bi-list fs-2"></i>
        </button>
        <div className={`collapse navbar-collapse ${isNavExpanded ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item"><Link className="nav-link px-3" to="/" onClick={closeNav}>Home</Link></li>
            {isAdmin ? (
              <>
                <li className="nav-item"><Link className="nav-link px-3 text-info" to="/admin" onClick={closeNav}>Admin Control Panel</Link></li>
                <li className="nav-item ms-lg-3 mt-2 mt-lg-0"><button onClick={handleLogout} className="btn btn-outline-danger btn-sm rounded-pill px-4">Logout Admin</button></li>
              </>
            ) : isAuthenticated ? (
              <>
                <li className="nav-item"><Link className="nav-link px-3" to="/vote" onClick={closeNav}>Voting Terminal</Link></li>
                <li className="nav-item ms-lg-3 mt-2 mt-lg-0"><button onClick={handleLogout} className="btn btn-outline-danger btn-sm rounded-pill px-4">End Session</button></li>
              </>
            ) : (
              <>
                <li className="nav-item me-2"><Link className="btn btn-outline-info rounded-pill px-4 btn-sm" to="/admin-login" onClick={closeNav}>Admin Portal</Link></li>
                <li className="nav-item mt-2 mt-lg-0"><Link className="btn btn-primary-custom rounded-pill px-4" to="/login" onClick={closeNav}>Voter Login</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;