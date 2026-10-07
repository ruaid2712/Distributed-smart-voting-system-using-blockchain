// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    struct Candidate {
        string name;
        string party;
        string manifesto;
        string icon;
        uint256 voteCount;
        bool active;
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

    constructor(
        string[] memory candidateNames,
        string[] memory candidateParties,
        string[] memory candidateManifestos,
        string[] memory candidateIcons
    ) {
        owner = msg.sender;
        require(
            candidateNames.length == candidateParties.length &&
            candidateNames.length == candidateManifestos.length &&
            candidateNames.length == candidateIcons.length,
            'Candidate data length mismatch'
        );

        for (uint256 i = 0; i < candidateNames.length; i++) {
            candidates.push(Candidate({
                name: candidateNames[i],
                party: candidateParties[i],
                manifesto: candidateManifestos[i],
                icon: candidateIcons[i],
                voteCount: 0,
                active: true
            }));
            emit CandidateAdded(i, candidateNames[i]);
        }
    }

    function addCandidate(
        string memory name,
        string memory party,
        string memory manifesto,
        string memory icon
    ) public onlyOwner {
        candidates.push(Candidate({
            name: name,
            party: party,
            manifesto: manifesto,
            icon: icon,
            voteCount: 0,
            active: true
        }));
        emit CandidateAdded(candidates.length - 1, name);
    }

    function removeCandidate(uint256 candidateId) public onlyOwner {
        require(candidateId < candidates.length, 'Invalid candidate');
        candidates[candidateId].active = false;
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

    function getCandidate(uint256 candidateId) public view returns (
        string memory name,
        string memory party,
        string memory manifesto,
        string memory icon,
        uint256 voteCount,
        bool active
    ) {
        require(candidateId < candidates.length, 'Invalid candidate');
        Candidate storage candidate = candidates[candidateId];
        return (
            candidate.name,
            candidate.party,
            candidate.manifesto,
            candidate.icon,
            candidate.voteCount,
            candidate.active
        );
    }
}
