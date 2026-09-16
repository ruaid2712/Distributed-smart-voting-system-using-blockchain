const { ethers } = require('hardhat');

async function main() {
  const candidateNames = ['Dr. Alan Turing', 'Ada Lovelace', 'Grace Hopper'];
  const Voting = await ethers.getContractFactory('Voting');
  const voting = await Voting.deploy(candidateNames);

  await voting.waitForDeployment();

  console.log('Voting deployed to:', await voting.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
