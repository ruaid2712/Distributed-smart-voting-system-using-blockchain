import { ethers } from 'ethers';

export const CONTRACT_ADDRESS = import.meta.env.VITE_VOTING_CONTRACT_ADDRESS;
export const NETWORK_NAME = import.meta.env.VITE_NETWORK_NAME || 'ganache';
export const EXPECTED_CHAIN_ID = BigInt(import.meta.env.VITE_CHAIN_ID || '1337');

export const CONTRACT_ABI = [
  'function getCandidateCount() view returns (uint256)',
  'function getCandidate(uint256) view returns (string, string, string, string, uint256, bool)',
  'event VoteCast(address indexed voter, uint256 indexed candidateId, uint256 timestamp)',
  'function vote(uint256)',
  'function hasVoted(address) view returns (bool)',
  'function addCandidate(string, string, string, string)',
  'function removeCandidate(uint256)',
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
  const network = await signer.provider.getNetwork();
  if (network.chainId !== EXPECTED_CHAIN_ID) {
    throw new Error(`MetaMask is connected to chain ${network.chainId}. Switch to Ganache (chain ID ${EXPECTED_CHAIN_ID}, RPC http://127.0.0.1:7545) and try again.`);
  }

  const bytecode = await signer.provider.getCode(CONTRACT_ADDRESS);
  if (bytecode === '0x') {
    throw new Error('No voting contract was found at the configured address on Ganache. Check VITE_VOTING_CONTRACT_ADDRESS in .env and restart Vite.');
  }

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
