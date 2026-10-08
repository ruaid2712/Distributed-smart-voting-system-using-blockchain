Name:  Student Name
Roll No.:  [Roll Number]
Class :  BE
Batch :  [Batch / Group]
Blockchain Miniproject
Project Title: BioVoteChain: Biometric-Verified Blockchain Voting System

Problem Statement :
• Traditional voting systems are vulnerable to identity fraud, duplicate voting, and centralized manipulation.
• Voters often have no way to verify whether their vote was counted correctly or altered after submission.
• Election records stored in centralized systems may be tampered with or accessed without authorization.
• A secure digital voting platform must protect voter identity while maintaining transparency and trust.
• This project uses biometric user verification, blockchain-based vote storage, and smart-contract enforcement to secure the voting process.

Objective:
• To design a blockchain-based voting system that records each vote immutably on a decentralized ledger.
• To integrate biometric verification using face and fingerprint recognition to ensure only registered voters can participate.
• To prevent double-voting by enforcing a one-wallet-one-vote rule in the smart contract.
• To provide a transparent voting dashboard for administrators and voters to monitor candidate results securely.
• To develop a full-stack system that combines web frontend, backend verification service, and Ethereum smart contract logic.

Tools/Technology Used
Category
Details
Language
JavaScript, React, Python, Solidity
Frontend
React 18, Vite, React Router, Bootstrap 5
Backend
FastAPI, OpenCV, NumPy, WebAuthn, Python
Blockchain
Ethereum-compatible smart contract, Truffle, Ganache, MetaMask, ethers.js
Biometrics
Face recognition using OpenCV and ONNX models; fingerprint matching using SIFT descriptors
Storage
JSON credential store, encrypted local biometric templates, smart contract state on blockchain

Approach
• The system uses a Solidity voting contract deployed on Ganache to manage contest candidates and vote records.
• A React application acts as the user interface for registration, authentication, and ballot casting.
• The Python FastAPI backend verifies registered voters through face and fingerprint matching before allowing login.
• The smart contract stores vote counts and enforces the rule that each wallet address can vote only once.
• Admin users can view candidate results and total votes while voters can cast ballots from a verified session.

System Workflow / Architecture
Implementation
The system is implemented as a modular, full-stack architecture:
• Frontend layer: React application for home, registration, voter login, admin portal, and ballot dashboard.
• Backend services: FastAPI APIs for biometric enrollment, verification, credential storage, and voter count retrieval.
• Smart contract layer: `Voting.sol` stores candidate information and vote counts, with one-vote-per-wallet enforcement.
• Deployment layer: Truffle migration script deploys the contract to Ganache and populates initial candidate data.
• Identity layer: the application checks a voter’s face and fingerprint templates before enabling the vote flow.
• Wallet integration: MetaMask connects the voter to the Ganache network to sign and submit blockchain transactions.

Verification flow:
When a user registers, the system captures both face and fingerprint biometric data and stores corresponding templates. During login, the same biometric data is re-captured and compared with the stored templates. Only if both checks pass will the voter be allowed to connect a wallet and cast a vote. The smart contract then verifies the sender address and prevents duplicate votes by checking the `hasVoted[msg.sender]` mapping before incrementing a candidate’s vote count.

Screenshots / Output
Fig. Home page of BioVoteChain system
Fig. Voter registration with face and fingerprint capture
Fig. Voter login and biometric verification
Fig. MetaMask wallet connection for blockchain vote submission
Fig. Candidate dashboard and vote confirmation
Fig. Admin view of total votes and candidate progress

Result
A secure, end-to-end voting prototype was successfully developed. The project combines biometric verification with blockchain-based vote recording to strengthen identity assurance and minimize fraud. Candidate results are stored transparently on-chain, while the system prevents multiple votes from the same wallet. The integration of biometric verification with an Ethereum-compatible smart contract demonstrates how digital democracy applications can improve trust and accountability.

Conclusion
Through this project, the principles of blockchain security, decentralized trust, and secure identity verification were understood and implemented in a practical application. The project also highlighted how biometric-based authentication can be paired with smart-contract logic to protect electronic voting systems from common threats such as impersonation, double-voting, and centralized manipulation. This approach provides a strong foundation for secure digital voting systems in real-world governance and institutional use cases.

Team Details
 Student Name
 Roll No.
 Class
 Batch / Group
 
 [Roll Number]
 BE
 [Batch / Group]
 [Student Name]
 [Roll Number]
 BE
 [Batch / Group]
 [Student Name]
 [Roll Number]
 BE
 [Batch / Group]
 [Student Name]
 [Roll Number]
 BE
 [Batch / Group]
