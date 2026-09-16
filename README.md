# BioVoteChain

BioVoteChain is a React voting application that combines biometric voter verification with an Ethereum-compatible voting smart contract. The local development stack uses FastAPI, Ganache, Truffle, MetaMask, and Vite.

## Technology Stack

- React 18, Vite, and React Router
- Bootstrap 5 and Bootstrap Icons
- FastAPI, OpenCV, NumPy, WebAuthn, and SecuGen WebAPI
- Solidity 0.8.20 voting contract
- Truffle for compilation and migrations
- Ganache for the local Ethereum network
- ethers.js and MetaMask for wallet transactions

## Prerequisites

Install the following before starting:

- Node.js 18 or newer
- Python 3.10 or newer
- Ganache Desktop or Ganache CLI
- MetaMask browser extension
- A working camera
- SecuGen WebAPI and fingerprint reader for biometric registration/login

## Install Dependencies

From the project root:

```powershell
npm install

py -m venv .venv
.venv\Scripts\activate
py -m pip install -r backend\requirements.txt
```

Copy the example environment file to `.env` and update the contract address after deployment:

```powershell
Copy-Item .env.example .env
```

Never commit `.env`, private keys, biometric templates, or credential files.

## Start Ganache

Start Ganache Desktop with:

- RPC server: `http://127.0.0.1:7545`
- Network ID / chain ID: `1337` (Ganache may display network ID `5777` depending on its configuration)
- At least one funded account

Import a Ganache account into MetaMask using its private key. Use only local demo accounts. Never use a real wallet private key in this project.

## Compile and Deploy the Contract

The Truffle configuration is in `truffle-config.js`. Compile and deploy to Ganache:

```powershell
npx truffle compile
npx truffle migrate --network development --reset
```

Copy the deployed `Voting` contract address from the migration output into `.env`:

```text
VITE_VOTING_CONTRACT_ADDRESS=0xYourDeployedVotingContractAddress
VITE_NETWORK_NAME=ganache
VITE_GANACHE_RPC_URL=http://127.0.0.1:7545
VITE_FACE_API_URL=http://127.0.0.1:8000
```

Restart Vite after changing `.env`. The migration creates these initial candidates:

- Dr. Alan Turing
- Ada Lovelace
- Grace Hopper

Each wallet can cast one vote because the contract tracks `hasVoted[msg.sender]`. To test another vote, use another funded Ganache account in MetaMask. A full Ganache reset also creates a new contract address, so update `.env` and redeploy whenever the chain is reset.

## Start the Biometric Backend

From the project root:

```powershell
.venv\Scripts\activate
py -m uvicorn backend.face_recognition_service:app --reload --port 8000
```

The API is available at `http://127.0.0.1:8000`. Check it with:

```powershell
curl.exe http://127.0.0.1:8000/health
curl.exe http://127.0.0.1:8000/api/voters/count
```

The backend stores face embeddings in `backend/face_templates/` and fingerprint descriptors in `backend/fingerprint_templates/`. Raw biometric images are not stored by the application.

## SecuGen Configuration

The registration flow uses the SecuGen WebAPI endpoint at `https://localhost:8443/SGIFPCapture`. Add the license supplied by SecuGen to `.env`:

```text
VITE_SECUGEN_LICENSE=your-secu-gen-license
```

The reader service must be running before fingerprint capture. Camera access must also be allowed by the browser.

## Start the Frontend

Run the frontend from the project root:

```powershell
npm run dev
```

Open `http://localhost:5173`.

### Voter flow

1. Open **Register Voter** and capture the face and fingerprint.
2. Use the generated voter ID at **Voter Login**.
3. Complete face and fingerprint verification.
4. Connect MetaMask to Ganache and select a funded account.
5. Select a candidate and confirm the blockchain transaction.

### Admin flow

1. Open **Admin Portal**.
2. Use the current demo credentials: `admin` / `admin`.
3. The admin panel reads total votes and candidate progress from the deployed contract.
4. The registered-voter total is read from the biometric backend.

## Useful Commands

```powershell
npm run build
npm run truffle:compile
npm run truffle:migrate
npm run truffle:test
```

The legacy Hardhat scripts remain in the repository for reference, but Truffle is the active deployment workflow.

## Troubleshooting

### `missing revert data` during vote submission

The selected MetaMask wallet has probably already voted. Each wallet can vote once. Switch to another funded Ganache account or reset Ganache and redeploy the contract.

### Contract address or code not found

Ganache may have been restarted or reset. Run the Truffle migration again and update `VITE_VOTING_CONTRACT_ADDRESS` in `.env`.

### Registered voters show a loading state

Start the FastAPI backend and confirm `http://127.0.0.1:8000/api/voters/count` returns JSON. The count includes voters with both face and fingerprint templates.

### MetaMask transaction uses the wrong network

Select the Ganache network with RPC `http://127.0.0.1:7545` and chain ID `1337`, then reload the application.
