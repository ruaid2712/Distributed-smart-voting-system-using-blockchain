import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addCandidate, candidatesData, removeCandidate } from '../data/mockData';
import { CONTRACT_ADDRESS, EXPECTED_CHAIN_ID, NETWORK_NAME, getReadOnlyContract } from '../lib/ethereum';

const FACE_API_URL = import.meta.env.VITE_FACE_API_URL || 'http://127.0.0.1:8000';
const electionDetails = [
  ['Election name', 'General Election 2026'],
  ['Start date', '01 Oct 2026'],
  ['End date', '10 Oct 2026'],
  ['Status', 'Ongoing'],
];

const AdminDashboard = ({ isAdmin }) => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState(() => [...candidatesData]);
  const [name, setName] = useState('');
  const [party, setParty] = useState('');
  const [manifesto, setManifesto] = useState('');
  const [icon, setIcon] = useState('bi-award');
  const [liveVoteTotal, setLiveVoteTotal] = useState(null);
  const [liveCandidateVotes, setLiveCandidateVotes] = useState({});
  const [voteEvents, setVoteEvents] = useState([]);
  const [registeredVoterCount, setRegisteredVoterCount] = useState(null);
  const [voteLoadError, setVoteLoadError] = useState('');
  const [isCandidateFormOpen, setIsCandidateFormOpen] = useState(false);
  const [showAllCandidates, setShowAllCandidates] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;

    const loadVoteTotal = async () => {
      try {
        const contract = getReadOnlyContract();
        const candidateCount = Number(await contract.getCandidateCount());
        const voteCounts = await Promise.all(
          Array.from({ length: candidateCount }, (_, index) => contract.getCandidate(index)),
        );
        const candidateVotes = Object.fromEntries(voteCounts.map((candidate, id) => [id, Number(candidate[4])]));
        const total = voteCounts.reduce((sum, candidate) => sum + Number(candidate[4]), 0);
        const provider = contract.runner.provider;
        const latestBlock = await provider.getBlockNumber();
        const voteLogs = await contract.queryFilter(contract.filters.VoteCast(), 0, latestBlock);
        const events = voteLogs.map((log) => ({
          voter: log.args.voter,
          candidateId: Number(log.args.candidateId),
          timestamp: Number(log.args.timestamp),
          transactionHash: log.transactionHash,
        }));
        setLiveCandidateVotes(candidateVotes);
        setLiveVoteTotal(total);
        setVoteEvents(events);
        setVoteLoadError('');
      } catch (error) {
        setVoteLoadError(error?.message || 'Unable to load blockchain vote totals.');
      }
    };

    loadVoteTotal();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    fetch(`${FACE_API_URL}/api/voters/count`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load registered voter count.');
        return response.json();
      })
      .then((result) => setRegisteredVoterCount(Number(result.count)))
      .catch(() => setRegisteredVoterCount(null));
  }, [isAdmin]);

  if (!isAdmin) {
    return <div className="container py-5 text-center"><div className="card card-dark-custom p-5 max-w-md mx-auto"><i className="bi bi-shield-exclamation display-3 text-warning mb-3"></i><h3 className="text-light">Access Denied</h3><p className="text-muted">You must log in through the admin portal to manage the election node.</p><button onClick={() => navigate('/admin-login')} className="btn btn-primary-custom mt-3">Go to Admin Login</button></div></div>;
  }

  const handleAddCandidate = (event) => {
    event.preventDefault();
    if (!name.trim() || !party.trim() || !manifesto.trim()) return;
    addCandidate({ name: name.trim(), party: party.trim(), manifesto: manifesto.trim(), icon });
    setCandidates([...candidatesData]);
    setName('');
    setParty('');
    setManifesto('');
    setIsCandidateFormOpen(false);
  };

  const handleDeleteCandidate = (candidateId) => {
    removeCandidate(candidateId);
    setCandidates([...candidatesData]);
  };

  const voterCountsMismatch = registeredVoterCount !== null && liveVoteTotal !== null && liveVoteTotal > registeredVoterCount;
  const pendingVoters = registeredVoterCount === null || liveVoteTotal === null || voterCountsMismatch
    ? null
    : Math.max(registeredVoterCount - liveVoteTotal, 0);
  const turnoutPercent = registeredVoterCount === null || liveVoteTotal === null || registeredVoterCount === 0 || voterCountsMismatch
    ? null
    : ((liveVoteTotal / registeredVoterCount) * 100).toFixed(2);
  const ringPercent = turnoutPercent === null ? 0 : Math.min(Number(turnoutPercent), 100);
  const activityDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    const count = voteEvents.filter((event) => {
      const eventDate = new Date(event.timestamp * 1000);
      return eventDate >= date && eventDate < nextDate;
    }).length;
    return { label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count };
  });
  const activityMax = Math.max(...activityDays.map((day) => day.count), 1);
  const recentEvents = [...voteEvents].sort((left, right) => right.timestamp - left.timestamp);
  const visibleCandidates = showAllCandidates ? candidates : candidates.slice(0, 3);
  const visibleEvents = showAllActivity ? recentEvents : recentEvents.slice(0, 4);
  const networkStatus = voteLoadError ? 'Unavailable' : liveVoteTotal === null ? 'Connecting' : 'Connected';

  return (
    <div className="admin-dashboard">
      <div className="container admin-dashboard-layout">
        <main className="admin-main">
          <header className="admin-welcome">
            <span>Admin dashboard</span>
            <h1>Welcome, Admin</h1>
            <p>Manage elections, register parties and voters, and monitor real-time voting status.</p>
          </header>

          <section className="admin-metric-grid" aria-label="Election metrics">
            <article className="admin-metric"><span className="admin-metric-icon metric-icon-blue"><i className="bi bi-people-fill"></i></span><div><h2>Total voters</h2><strong>{registeredVoterCount === null ? 'Unavailable' : registeredVoterCount.toLocaleString()}</strong></div></article>
            <article className="admin-metric"><span className="admin-metric-icon metric-icon-green"><i className="bi bi-check-circle"></i></span><div><h2>Voted</h2><strong>{liveVoteTotal === null ? 'Unavailable' : liveVoteTotal.toLocaleString()}</strong></div></article>
            <article className="admin-metric"><span className="admin-metric-icon metric-icon-orange"><i className="bi bi-clock-history"></i></span><div><h2>Pending</h2><strong>{pendingVoters === null ? 'Unavailable' : pendingVoters.toLocaleString()}</strong></div></article>
            <article className="admin-metric"><span className="admin-metric-icon metric-icon-purple"><i className="bi bi-percent"></i></span><div><h2>Turnout rate</h2><strong>{turnoutPercent === null ? '--' : `${turnoutPercent}%`}</strong></div></article>
          </section>

          {voteLoadError && <div className="alert alert-warning">{voteLoadError}</div>}
          {voterCountsMismatch && <div className="alert alert-warning admin-data-warning"><i className="bi bi-info-circle-fill me-2"></i>On-chain votes exceed the current voter registry. Voter records were cleared separately from the blockchain, so turnout and pending counts are unavailable.</div>}

          <div className="admin-chart-grid">
            <section className="admin-panel">
              <h2 className="admin-panel-title"><i className="bi bi-activity"></i>Voting status</h2>
              <div className="turnout-chart-row">
                <div className="turnout-donut" style={{ '--turnout': `${ringPercent}%` }}><div><strong>{turnoutPercent === null ? '--' : `${turnoutPercent}%`}</strong><span>Voted</span></div></div>
                <div className="turnout-legend">
                  <div><span className="legend-dot legend-dot-green"></span><span>Voted<strong>{liveVoteTotal === null ? 'Unavailable' : liveVoteTotal.toLocaleString()} {turnoutPercent === null ? '' : `(${turnoutPercent}%)`}</strong></span></div>
                  <div><span className="legend-dot legend-dot-gray"></span><span>Pending<strong>{pendingVoters === null ? 'Unavailable' : pendingVoters.toLocaleString()} {turnoutPercent === null ? '' : `(${Math.max(100 - Number(turnoutPercent), 0).toFixed(1)}%)`}</strong></span></div>
                </div>
              </div>
            </section>

            <section className="admin-panel">
              <h2 className="admin-panel-title"><i className="bi bi-bar-chart-line"></i>Voter activity <span>(last 7 days)</span></h2>
              {voteEvents.length === 0 ? <div className="chart-empty">No on-chain votes during this period.</div> : <div className="activity-chart">
                <div className="activity-axis"><span>{activityMax}</span><span>{Math.round(activityMax * 0.66)}</span><span>{Math.round(activityMax * 0.33)}</span><span>0</span></div>
                <div className="activity-bars">{activityDays.map((day) => <div className="activity-day" key={day.label} title={`${day.count} vote${day.count === 1 ? '' : 's'}`}><div className="activity-bar-wrap"><span className="activity-bar" style={{ height: `${day.count ? Math.max((day.count / activityMax) * 100, 4) : 0}%` }}></span></div><span>{day.label}</span></div>)}</div>
              </div>}
            </section>
          </div>

          <div className="admin-table-grid">
            <section className="admin-panel admin-table-panel">
              <header className="admin-panel-header"><h2 className="admin-panel-title"><i className="bi bi-people-fill"></i>Registered parties / contestants</h2>{candidates.length > 3 && <button className="table-view-button" onClick={() => setShowAllCandidates((value) => !value)}>{showAllCandidates ? 'Show less' : 'View all'}</button>}</header>
              <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>ID</th><th>Party / candidate name</th><th>Symbol</th><th>Status</th></tr></thead><tbody>
                {visibleCandidates.map((candidate) => <tr key={candidate.id}><td>{candidate.id}</td><td>{candidate.party}<small>{candidate.name}</small></td><td><i className={`bi ${candidate.icon} table-symbol`}></i></td><td><span className={`table-status ${candidate.chainId === null ? 'table-status-local' : 'table-status-active'}`}>{candidate.chainId === null ? 'Local' : 'Active'}</span></td></tr>)}
                {visibleCandidates.length === 0 && <tr><td colSpan="4" className="table-empty">No candidates registered.</td></tr>}
              </tbody></table></div>
            </section>

            <section className="admin-panel admin-table-panel">
              <header className="admin-panel-header"><h2 className="admin-panel-title"><i className="bi bi-clock-history"></i>Recent voting activity</h2>{recentEvents.length > 4 && <button className="table-view-button" onClick={() => setShowAllActivity((value) => !value)}>{showAllActivity ? 'Show less' : 'View all'}</button>}</header>
              <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Wallet</th><th>Candidate</th><th>Timestamp</th><th>Status</th></tr></thead><tbody>
                {visibleEvents.map((event) => <tr key={event.transactionHash}><td className="font-monospace">{`${event.voter.slice(0, 6)}…${event.voter.slice(-4)}`}</td><td>{candidates.find((candidate) => candidate.chainId === event.candidateId)?.name || `Candidate ${event.candidateId + 1}`}</td><td>{new Date(event.timestamp * 1000).toLocaleString()}</td><td><span className="table-status table-status-active">Voted</span></td></tr>)}
                {visibleEvents.length === 0 && <tr><td colSpan="4" className="table-empty">No votes have been recorded on-chain yet.</td></tr>}
              </tbody></table></div>
            </section>
          </div>
        </main>

        <aside className="admin-sidebar">
          <section className="admin-action-card admin-action-blue">
            <div className="admin-action-heading"><span className="admin-action-icon"><i className="bi bi-people-fill"></i></span><div><h2>Register party / contestant</h2><p>Add a local contestant to the demo list.</p></div></div>
            <button className="btn btn-primary-custom w-100" onClick={() => setIsCandidateFormOpen((value) => !value)}><i className={`bi ${isCandidateFormOpen ? 'bi-dash' : 'bi-plus-lg'}`}></i>{isCandidateFormOpen ? 'Close form' : 'Register party / contestant'}</button>
            {isCandidateFormOpen && <form className="admin-candidate-form" onSubmit={handleAddCandidate}>
              <label className="form-label">Candidate name</label><input className="form-control mb-2" value={name} onChange={(event) => setName(event.target.value)} required />
              <label className="form-label">Party</label><input className="form-control mb-2" value={party} onChange={(event) => setParty(event.target.value)} required />
              <label className="form-label">Manifesto</label><textarea className="form-control mb-2" rows="2" value={manifesto} onChange={(event) => setManifesto(event.target.value)} required />
              <label className="form-label">Symbol</label><select className="form-select mb-3" value={icon} onChange={(event) => setIcon(event.target.value)}><option value="bi-award">Award</option><option value="bi-cpu">CPU / Tech</option><option value="bi-shield-check">Shield</option><option value="bi-lightning-charge">Lightning</option><option value="bi-globe">Globe</option></select>
              <button className="btn btn-primary-custom w-100" type="submit">Add contestant</button>
            </form>}
          </section>

          <section className="admin-action-card admin-action-green">
            <div className="admin-action-heading"><span className="admin-action-icon"><i className="bi bi-person"></i></span><div><h2>Register voter</h2><p>Add a voter using their biometric details.</p></div></div>
            <Link to="/admin/register" className="btn btn-success w-100"><i className="bi bi-plus-lg"></i>Register voter</Link>
          </section>

          <section className="admin-panel election-info-panel">
            <h2 className="admin-panel-title"><i className="bi bi-calendar3"></i>Election information</h2>
            {electionDetails.map(([label, value]) => <div className="election-info-row" key={label}><span>{label}</span><strong className={label === 'Status' ? 'table-status table-status-active' : ''}>{value}</strong></div>)}
            <div className="election-info-row"><span>Network</span><strong>{NETWORK_NAME}</strong></div>
            <div className="election-info-row"><span>Chain ID</span><strong>{EXPECTED_CHAIN_ID.toString()}</strong></div>
            <div className="election-info-row election-contract-row"><span>Contract</span><strong title={CONTRACT_ADDRESS}>{CONTRACT_ADDRESS ? `${CONTRACT_ADDRESS.slice(0, 8)}…${CONTRACT_ADDRESS.slice(-6)}` : 'Not configured'}</strong></div>
            <div className="election-network-state"><span className={`network-state-dot ${networkStatus === 'Connected' ? 'is-connected' : ''}`}></span>{networkStatus}</div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default AdminDashboard;