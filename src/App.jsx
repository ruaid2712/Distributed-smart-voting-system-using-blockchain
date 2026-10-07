import React, { useState } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Registration from './pages/Registration';
import AdminLogin from './pages/AdminLogin';
import VotingDashboard from './pages/VotingDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [voterId, setVoterId] = useState('');
  const [voterName, setVoterName] = useState('');

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} isAdmin={isAdmin} setIsAdmin={setIsAdmin} adminToken={adminToken} setAdminToken={setAdminToken} setVoterName={setVoterName} />
      <main className="flex-grow-1 bg-light-custom">
        <Routes>
          <Route path="/" element={<Home isAuthenticated={isAuthenticated} isAdmin={isAdmin} />} />
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} setVoterId={setVoterId} setVoterName={setVoterName} />} />
          <Route path="/register" element={<Navigate to={isAdmin ? '/admin/register' : '/admin-login'} replace />} />
          <Route path="/admin/register" element={isAdmin ? <Registration adminToken={adminToken} /> : <Navigate to="/admin-login" replace />} />
          <Route path="/admin-login" element={<AdminLogin setIsAdmin={setIsAdmin} setAdminToken={setAdminToken} />} />
          <Route path="/vote" element={<VotingDashboard isAuthenticated={isAuthenticated} voterId={voterId} voterName={voterName} />} />
          <Route path="/admin" element={<AdminDashboard isAdmin={isAdmin} />} />
        </Routes>
      </main>
      <footer className="site-footer py-3 text-center">
        <small>&copy; {new Date().getFullYear()} BioVoteChain System. All rights reserved.</small>
      </footer>
    </div>
  );
}

export default App;