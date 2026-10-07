import { voteLedger } from './blockchain.js';

export let candidatesData = [
  { id: "cand_001", chainId: 0, name: "Dr. Alan Turing", party: "Techno-Progressive Party", manifesto: "Advancing computational rights, securing digital privacy, and ensuring unbreakable cryptographic integrity for all citizen data.", votes: 2150, icon: "bi-cpu" },
  { id: "cand_002", chainId: 1, name: "Ada Lovelace", party: "Analytical Engine Coalition", manifesto: "Pioneering analytical frameworks, advocating for algorithmic transparency, and funding next-generation technological education.", votes: 3820, icon: "bi-braces-asterisk" },
  { id: "cand_003", chainId: 2, name: "Grace Hopper", party: "Compiler Consortium", manifesto: "Debugging the bureaucratic machine. Promising less red tape and highly optimized governmental processes for the modern era.", votes: 1805, icon: "bi-bug" }
];

export const analyticsData = {
  totalRegisteredVoters: 9500,
  votesCast: 7775,
  activeNodes: 124,
  networkStatus: "Optimal",
  lastBlockMined: "2 mins ago"
};

export const addCandidate = (newCandidate) => {
  candidatesData.push({ ...newCandidate, id: `cand_${Date.now()}`, chainId: null, votes: 0 });
};

export const removeCandidate = (candidateId) => {
  const index = candidatesData.findIndex((candidate) => candidate.id === candidateId);
  if (index !== -1) {
    const removed = candidatesData.splice(index, 1)[0];
    if (analyticsData.votesCast >= removed.votes) analyticsData.votesCast -= removed.votes;
  }
};

export const recordVote = (candidateId, voterId) => {
  const normalizedVoterId = String(voterId || '').trim();
  if (!normalizedVoterId) {
    throw new Error('A voter identity is required before casting a vote.');
  }

  const candidate = candidatesData.find((item) => item.id === candidateId);
  if (!candidate) {
    throw new Error('Selected candidate could not be found.');
  }

  voteLedger.addVoteTransaction(normalizedVoterId, candidateId);
  const block = voteLedger.minePendingTransactions('BioVoteChain-Node-01');
  const transaction = block.transactions.at(-1);

  if (!transaction) {
    throw new Error('The vote was not added to the blockchain.');
  }

  candidate.votes += 1;
  analyticsData.votesCast += 1;
  analyticsData.lastBlockMined = `Block #${block.index} mined`;

  return {
    txHash: block.hash,
    blockIndex: block.index,
    transaction,
    miner: block.miner,
    valid: voteLedger.isValid(),
  };
};