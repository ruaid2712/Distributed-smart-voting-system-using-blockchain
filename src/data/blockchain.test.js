import assert from 'node:assert/strict';
import { Blockchain } from './blockchain.js';

const chain = new Blockchain();
chain.addVoteTransaction('voter-1', 'cand_001');
chain.addVoteTransaction('voter-2', 'cand_002');
const block = chain.minePendingTransactions('admin-node');

assert.equal(chain.pendingTransactions.length, 0);
assert.ok(block.hash.startsWith('0x'));
assert.ok(block.transactions.length >= 2);
assert.equal(chain.isValid(), true);

console.log('blockchain tests passed');
