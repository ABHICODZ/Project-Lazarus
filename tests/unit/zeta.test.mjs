import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ZEROS, primesUpTo, psi, psiFromZeros } from '../../src/lib/zeta.ts';

const primes = primesUpTo(300);
const meanMiss = (n) => {
  let sum = 0, count = 0;
  for (let x = 5.5; x <= 100; x += 1) { sum += Math.abs(psi(x, primes) - psiFromZeros(x, n)); count++; }
  return sum / count;
};

test('psi counts ln p for every prime power', () => {
  assert.equal(psi(1.5, primes), 0);
  assert.ok(Math.abs(psi(10, primes) - (Math.log(2) * 3 + Math.log(3) * 2 + Math.log(5) + Math.log(7))) < 1e-12);
});

test('more zeros rebuild the primes better', () => {
  assert.ok(meanMiss(30) < meanMiss(10));
  assert.ok(meanMiss(10) < meanMiss(0));
  assert.ok(meanMiss(30) < 0.6);
});

test('the zeros table is sorted and starts at 14.1347', () => {
  assert.equal(ZEROS.length, 30);
  assert.ok(Math.abs(ZEROS[0] - 14.134725) < 1e-6);
  assert.deepEqual([...ZEROS].sort((a, b) => a - b), [...ZEROS]);
});
