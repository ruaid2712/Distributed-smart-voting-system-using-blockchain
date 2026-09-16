/** @type import('hardhat/config').HardhatUserConfig */
require('@nomicfoundation/hardhat-toolbox');

const defaultGanacheMnemonic =
  'entire crew wrist whisper notice shoe dial prize fitness student noble crazy';

module.exports = {
  solidity: {
    version: '0.8.28',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    ganache: {
      url: process.env.GANACHE_RPC_URL || 'http://127.0.0.1:7545',
      chainId: 1337,
      accounts: process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY]
        : {
            mnemonic: process.env.GANACHE_MNEMONIC || defaultGanacheMnemonic,
          },
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || '',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
    hardhat: {
      chainId: 31337,
    },
  },
};
