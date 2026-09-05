import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidatesData, analyticsData, addCandidate, removeCandidate } from '../data/mockData';

const AdminDashboard = ({ isAdmin }) => {
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(false);
  const [name, setName] = useState('');
  const [party, setParty] = useState('');
  const [manifesto, setManifesto] = useState('');
  const [icon, setIcon] = useState('bi-award');

  if (!isAdmin) {
    return <div className="container py-5 text-center"><div className="card card-dark-custom p-5 max-w-md mx-auto"><i className="bi bi-shield-exclamation display-3 text-warning mb-3"></i><h3 className="text-light">Access Denied</h3><p className="text-muted">You must log in through the admin portal to manage the election node.</p><button onClick={() => navigate('/admin-login')} className="btn btn-primary-custom mt-3">Go to Admin Login</button></div></div>;
  }

  const handleAddCandidate = (event) => {
    event.preventDefault();
    if (!name || !party || !manifesto) return;
    addCandidate({ id: `cand_${Date.now()}`, name, party, manifesto, votes: 0, icon });
    setName('');
    setParty('');
    setManifesto('');
    setRefresh(!refresh);
  };

  const handleDeleteCandidate = (candidateId) => {
    removeCandidate(candidateId);
    setRefresh(!refresh);
  };

  const turnoutPercent = ((analyticsData.votesCast / analyticsData.totalRegisteredVoters) * 100).toFixed(1);

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4"><h2 className="fw-bold text-light">Election Analytics &amp; Control Node</h2><span className="badge bg-info text-dark px-3 py-2 fw-bold">Admin Active</span></div>
      <div className="row g-3 mb-5">
        <div className="col-md-3"><div className="card card-dark-custom p-3 h-100"><h6 className="text-muted">Total Registered</h6><h3 className="fw-bold text-light">{analyticsData.totalRegisteredVoters.toLocaleString()}</h3></div></div>
        <div className="col-md-3"><div className="card card-dark-custom p-3 h-100"><h6 className="text-muted">Votes Cast</h6><h3 className="fw-bold text-success">{analyticsData.votesCast.toLocaleString()}</h3></div></div>
        <div className="col-md-3"><div className="card card-dark-custom p-3 h-100"><h6 className="text-muted">Turnout</h6><h3 className="fw-bold text-info">{turnoutPercent}%</h3></div></div>
        <div className="col-md-3"><div className="card card-dark-custom p-3 h-100"><h6 className="text-muted">Network Status</h6><h5 className="fw-bold text-success mb-0"><i className="bi bi-activity"></i> {analyticsData.networkStatus}</h5><small className="text-muted mt-1">{analyticsData.activeNodes} Nodes Active</small></div></div>
      </div>
      <div className="row g-4 mb-5">
        <div className="col-lg-5"><div className="card card-dark-custom p-4 h-100"><h4 className="fw-bold text-light mb-3">Register New Candidate &amp; Party</h4><form onSubmit={handleAddCandidate}>
          <div className="mb-3"><label className="form-label text-muted small">Candidate Full Name</label><input type="text" className="form-control" placeholder="e.g. Dr. Jane Doe" value={name} onChange={(event) => setName(event.target.value)} required /></div>
          <div className="mb-3"><label className="form-label text-muted small">Political Party</label><input type="text" className="form-control" placeholder="e.g. Decentralized Future Party" value={party} onChange={(event) => setParty(event.target.value)} required /></div>
          <div className="mb-3"><label className="form-label text-muted small">Manifesto Statement</label><textarea className="form-control" rows="3" placeholder="Brief candidate objective..." value={manifesto} onChange={(event) => setManifesto(event.target.value)} required></textarea></div>
          <div className="mb-4"><label className="form-label text-muted small">Bootstrap Icon Symbol</label><select className="form-select" value={icon} onChange={(event) => setIcon(event.target.value)}><option value="bi-award">Award</option><option value="bi-cpu">CPU / Tech</option><option value="bi-shield-check">Shield</option><option value="bi-lightning-charge">Lightning</option><option value="bi-globe">Globe</option></select></div>
          <button type="submit" className="btn btn-primary-custom w-100"><i className="bi bi-plus-circle me-2"></i> Deploy Candidate to Ballot</button>
        </form></div></div>
        <div className="col-lg-7"><div className="card card-dark-custom p-4 h-100"><h4 className="fw-bold text-light mb-4">Live Ledger Standings &amp; Management</h4>{candidatesData.length === 0 ? <p className="text-muted text-center py-4">No candidates currently registered on the ballot.</p> : [...candidatesData].sort((a, b) => b.votes - a.votes).map((candidate) => { const total = analyticsData.votesCast === 0 ? 1 : analyticsData.votesCast; const percentage = ((candidate.votes / total) * 100).toFixed(1); return <div key={candidate.id} className="mb-4 pb-3 border-bottom border-secondary"><div className="d-flex justify-content-between align-items-center mb-1"><span className="fw-semibold text-light"><i className={`bi ${candidate.icon} me-2 text-info`}></i>{candidate.name} <small className="text-muted">({candidate.party})</small></span><div className="d-flex align-items-center gap-3"><span className="fw-bold text-info small">{candidate.votes.toLocaleString()} Votes ({percentage}%)</span><button onClick={() => handleDeleteCandidate(candidate.id)} className="btn btn-outline-danger btn-sm py-0 px-2" title="Remove Candidate"><i className="bi bi-trash"></i></button></div></div><div className="progress bg-dark mt-2" style={{ height: '16px', border: '1px solid #334155' }}><div className="progress-bar bg-info" role="progressbar" style={{ width: `${percentage}%` }} aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100"></div></div></div>; })}</div></div>
      </div>
    </div>
  );
};

export default AdminDashboard;