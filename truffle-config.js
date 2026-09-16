module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 7545,
      network_id: '*',
      gas: 6721975,
      from: '0x0c6A6FF461e3500149F9AbcB31e3eb964A4D19f3',
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
