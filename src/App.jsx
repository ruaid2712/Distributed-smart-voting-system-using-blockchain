import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import VotingDashboard from './pages/VotingDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
      <main className="flex-grow-1 bg-light-custom">
        <Routes>
          <Route path="/" element={<Home isAuthenticated={isAuthenticated} />} />
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/admin-login" element={<AdminLogin setIsAdmin={setIsAdmin} />} />
          <Route path="/vote" element={<VotingDashboard isAuthenticated={isAuthenticated} />} />
          <Route path="/admin" element={<AdminDashboard isAdmin={isAdmin} />} />
        </Routes>
      </main>
      <footer className="bg-dark text-muted py-3 text-center border-top border-secondary">
        <small>&copy; {new Date().getFullYear()} BioVoteChain System. All rights reserved.</small>
      </footer>
    </div>
  );
}

export default App;