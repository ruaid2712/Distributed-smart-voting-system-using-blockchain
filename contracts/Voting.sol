// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    address public owner;
    mapping(address => bool) public hasVoted;
    Candidate[] public candidates;

    event VoteCast(address indexed voter, uint256 indexed candidateId, uint256 timestamp);
    event CandidateAdded(uint256 indexed candidateId, string name);

    modifier onlyOwner() {
        require(msg.sender == owner, 'Only owner can manage candidates');
        _;
    }

    constructor(string[] memory candidateNames) {
        owner = msg.sender;

        for (uint256 i = 0; i < candidateNames.length; i++) {
            candidates.push(Candidate({ name: candidateNames[i], voteCount: 0 }));
            emit CandidateAdded(i, candidateNames[i]);
        }
    }

    function addCandidate(string memory name) public onlyOwner {
        candidates.push(Candidate({ name: name, voteCount: 0 }));
        emit CandidateAdded(candidates.length - 1, name);
    }

    function vote(uint256 candidateId) public {
        require(candidateId < candidates.length, 'Invalid candidate');
        require(!hasVoted[msg.sender], 'Wallet already voted');

        hasVoted[msg.sender] = true;
        candidates[candidateId].voteCount += 1;

        emit VoteCast(msg.sender, candidateId, block.timestamp);
    }

    function getCandidateCount() public view returns (uint256) {
        return candidates.length;
    }

    function getCandidate(uint256 candidateId) public view returns (string memory name, uint256 voteCount) {
        require(candidateId < candidates.length, 'Invalid candidate');
        Candidate storage candidate = candidates[candidateId];
        return (candidate.name, candidate.voteCount);
    }
}
