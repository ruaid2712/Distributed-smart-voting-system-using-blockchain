module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 7545,
      network_id: '*',
      gas: 6721975,
      from: '0x3A2b3924042DCC8D5Ac5eF5366ce8B02cbC2C940',
    },
  },
  compilers: {
    solc: {
      version: '0.8.20',
      settings: {
        evmVersion: 'paris',
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
};
