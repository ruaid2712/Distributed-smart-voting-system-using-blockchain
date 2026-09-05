export let candidatesData = [
  { id: "cand_001", name: "Dr. Alan Turing", party: "Techno-Progressive Party", manifesto: "Advancing computational rights, securing digital privacy, and ensuring unbreakable cryptographic integrity for all citizen data.", votes: 2150, icon: "bi-cpu" },
  { id: "cand_002", name: "Ada Lovelace", party: "Analytical Engine Coalition", manifesto: "Pioneering analytical frameworks, advocating for algorithmic transparency, and funding next-generation technological education.", votes: 3820, icon: "bi-braces-asterisk" },
  { id: "cand_003", name: "Grace Hopper", party: "Compiler Consortium", manifesto: "Debugging the bureaucratic machine. Promising less red tape and highly optimized governmental processes for the modern era.", votes: 1805, icon: "bi-bug" }
];

export const analyticsData = {
  totalRegisteredVoters: 9500,
  votesCast: 7775,
  activeNodes: 124,
  networkStatus: "Optimal",
  lastBlockMined: "2 mins ago"
};

export const addCandidate = (newCandidate) => {
  candidatesData.push(newCandidate);
};

export const removeCandidate = (candidateId) => {
  const index = candidatesData.findIndex((candidate) => candidate.id === candidateId);
  if (index !== -1) {
    const removed = candidatesData.splice(index, 1)[0];
    if (analyticsData.votesCast >= removed.votes) analyticsData.votesCast -= removed.votes;
  }
};

export const recordVote = (candidateId) => {
  const candidate = candidatesData.find((item) => item.id === candidateId);
  if (candidate) {
    candidate.votes += 1;
    analyticsData.votesCast += 1;
  }
};