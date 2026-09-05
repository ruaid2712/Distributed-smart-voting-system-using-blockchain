import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ isAuthenticated, setIsAuthenticated, isAdmin, setIsAdmin }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-custom sticky-top">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <i className="bi bi-link-45deg fs-3 me-2 text-info"></i>
          BioVoteChain
        </Link>
        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <i className="bi bi-list fs-2"></i>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item"><Link className="nav-link px-3" to="/">Home</Link></li>
            {isAdmin ? (
              <>
                <li className="nav-item"><Link className="nav-link px-3 text-info" to="/admin">Admin Control Panel</Link></li>
                <li className="nav-item ms-lg-3 mt-2 mt-lg-0"><button onClick={handleLogout} className="btn btn-outline-danger btn-sm rounded-pill px-4">Logout Admin</button></li>
              </>
            ) : isAuthenticated ? (
              <>
                <li className="nav-item"><Link className="nav-link px-3" to="/vote">Voting Terminal</Link></li>
                <li className="nav-item ms-lg-3 mt-2 mt-lg-0"><button onClick={handleLogout} className="btn btn-outline-danger btn-sm rounded-pill px-4">End Session</button></li>
              </>
            ) : (
              <>
                <li className="nav-item me-2"><Link className="btn btn-outline-info rounded-pill px-4 btn-sm" to="/admin-login">Admin Portal</Link></li>
                <li className="nav-item mt-2 mt-lg-0"><Link className="btn btn-primary-custom rounded-pill px-4" to="/login">Voter Login</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;