const Voting = artifacts.require('Voting');

module.exports = function (deployer) {
  const candidateNames = [
    'Dr. Alan Turing',
    'Ada Lovelace',
    'Grace Hopper',
  ];
  const candidateParties = [
    'Techno-Progressive Party',
    'Analytical Engine Coalition',
    'Compiler Consortium',
  ];
  const candidateManifestos = [
    'Advancing computational rights, securing digital privacy, and ensuring unbreakable cryptographic integrity for all citizen data.',
    'Pioneering analytical frameworks, advocating for algorithmic transparency, and funding next-generation technological education.',
    'Debugging the bureaucratic machine. Promising less red tape and highly optimized governmental processes for the modern era.',
  ];
  const candidateIcons = ['bi-cpu', 'bi-braces-asterisk', 'bi-bug'];

  deployer.deploy(Voting, candidateNames, candidateParties, candidateManifestos, candidateIcons);
};