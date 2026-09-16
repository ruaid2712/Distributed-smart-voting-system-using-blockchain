export class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.difficulty = 2;
    this.voterHistory = new Map();
  }

  createGenesisBlock() {
    const timestamp = Date.now();
    const block = {
      index: 0,
      timestamp,
      transactions: [],
      previousHash: '0x0',
      hash: '',
      nonce: 0,
    };
    block.hash = this.calculateHash(block);
    return block;
  }

  calculateHash(block) {
    const payload = `${block.index}-${block.previousHash}-${block.timestamp}-${block.nonce}-${JSON.stringify(block.transactions)}`;
    let hash = 2166136261;

    for (let index = 0; index < payload.length; index += 1) {
      hash ^= payload.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return `0x${(hash >>> 0).toString(16).padStart(8, '0')}`;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addVoteTransaction(voterId, candidateId) {
    const normalizedVoterId = String(voterId).trim();
    if (!normalizedVoterId) {
      throw new Error('A voter ID is required before the vote is mined.');
    }

    if (this.voterHistory.has(normalizedVoterId)) {
      throw new Error('This voter has already cast a ballot.');
    }

    const transaction = {
      type: 'vote',
      voterId: normalizedVoterId,
      candidateId,
      timestamp: Date.now(),
      status: 'pending',
    };

    this.voterHistory.set(normalizedVoterId, candidateId);
    this.pendingTransactions.push(transaction);
    return transaction;
  }

  minePendingTransactions(minerAddress) {
    if (this.pendingTransactions.length === 0) {
      return this.getLatestBlock();
    }

    const block = {
      index: this.chain.length,
      timestamp: Date.now(),
      transactions: [...this.pendingTransactions],
      previousHash: this.getLatestBlock().hash,
      hash: '',
      nonce: 0,
      miner: minerAddress,
    };

    while (!block.hash.startsWith('0x' + '0'.repeat(this.difficulty))) {
      block.nonce += 1;
      block.hash = this.calculateHash(block);
    }

    this.chain.push(block);
    this.pendingTransactions = [];
    return block;
  }

  isValid() {
    for (let index = 1; index < this.chain.length; index += 1) {
      const currentBlock = this.chain[index];
      const previousBlock = this.chain[index - 1];

      if (currentBlock.hash !== this.calculateHash(currentBlock)) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }

      if (!currentBlock.hash.startsWith('0x' + '0'.repeat(this.difficulty))) {
        return false;
      }
    }

    return true;
  }
}

export const voteLedger = new Blockchain();

export const getLedgerSummary = () => ({
  chainLength: voteLedger.chain.length,
  pendingTransactions: voteLedger.pendingTransactions.length,
  lastBlockHash: voteLedger.getLatestBlock().hash,
});
