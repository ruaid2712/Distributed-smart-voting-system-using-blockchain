const Voting = artifacts.require('Voting');

module.exports = function (deployer) {
  const candidateNames = [
    'Dr. Alan Turing',
    'Ada Lovelace',
    'Grace Hopper',
  ];

  deployer.deploy(Voting, candidateNames);
};