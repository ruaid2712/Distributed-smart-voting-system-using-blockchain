import { ethers } from 'ethers';

export const CONTRACT_ADDRESS = import.meta.env.VITE_VOTING_CONTRACT_ADDRESS;
export const NETWORK_NAME = import.meta.env.VITE_NETWORK_NAME || 'ganache';

export const CONTRACT_ABI = [
  'function getCandidateCount() view returns (uint256)',
  'function getCandidate(uint256) view returns (string, uint256)',
  'function vote(uint256)',
  'function hasVoted(address) view returns (bool)',
  'function addCandidate(string)',
  'function owner() view returns (address)',
];

export const getProvider = () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is required to connect the wallet.');
  }

  return new ethers.BrowserProvider(window.ethereum);
};

export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask and try again.');
  }

  const provider = getProvider();
  await provider.send('eth_requestAccounts', []);
  return provider.getSigner();
};

export const getContract = async () => {
  if (!CONTRACT_ADDRESS) {
    throw new Error('VITE_VOTING_CONTRACT_ADDRESS is not set. Add the deployed Ganache contract address to .env and restart Vite.');
  }

  const signer = await connectWallet();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
};

export const getReadOnlyContract = () => {
  if (!CONTRACT_ADDRESS) {
    throw new Error('VITE_VOTING_CONTRACT_ADDRESS is not set. Add the deployed Ganache contract address to .env and restart Vite.');
  }

  const provider = new ethers.JsonRpcProvider(
    import.meta.env.VITE_GANACHE_RPC_URL || 'http://127.0.0.1:7545',
  );

  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
};
