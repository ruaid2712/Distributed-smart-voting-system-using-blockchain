module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 7545,
      network_id: '*',
      gas: 6721975,
      from: '0x6AEE2D3030aE075B08C678FBB489c80473871F8c',
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
