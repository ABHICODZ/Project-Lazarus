/**
 * Riemann's explicit formula for the Chebyshev function, as a small pure module so it can be unit tested.
 *
 *   psi(x) = sum of ln p over every prime power p^k <= x
 *   psi(x) = x - sum_rho x^rho / rho - ln(2 pi) - (1/2) ln(1 - x^-2)
 *
 * The sum runs over the non-trivial zeros rho = 1/2 + i*gamma (and their mirror images -> factor 2 below).
 * This assumes the Riemann Hypothesis only for the *choice of zeros used*: the first thirty are
 * computed zeros that are known to lie on the critical line.
 */

/** Imaginary parts of the first 30 non-trivial zeros of the zeta function (all verified to lie on Re(s) = 1/2). */
export const ZEROS: readonly number[] = [
  14.134725, 21.02204, 25.010858, 30.424876, 32.935062, 37.586178, 40.918719, 43.327073, 48.005151, 49.773832,
  52.970321, 56.446248, 59.347044, 60.831779, 65.112544, 67.079811, 69.546402, 72.067158, 75.704691, 77.14484,
  79.337375, 82.910381, 84.735493, 87.425275, 88.809111, 92.491899, 94.651344, 95.870634, 98.831194, 101.317851,
];

/** Primes up to n (inclusive) by sieve. */
export function primesUpTo(n: number): number[] {
  const sieve = new Uint8Array(n + 1);
  const out: number[] = [];
  for (let i = 2; i <= n; i++) {
    if (sieve[i]) continue;
    out.push(i);
    for (let j = i * i; j <= n; j += i) sieve[j] = 1;
  }
  return out;
}

/** Exact Chebyshev function psi(x): add ln p for every prime power p^k <= x. */
export function psi(x: number, primes: number[]): number {
  let sum = 0;
  for (const p of primes) {
    if (p > x) break;
    for (let q = p; q <= x; q *= p) sum += Math.log(p);
  }
  return sum;
}

/** psi(x) rebuilt from the first `zeros` zeros. With 0 zeros you get the smooth trend x - ln(2 pi) - ... */
export function psiFromZeros(x: number, zeros: number): number {
  if (x <= 1) return 0;
  const lnx = Math.log(x);
  const root = Math.sqrt(x);
  let sum = 0;
  for (let k = 0; k < Math.min(zeros, ZEROS.length); k++) {
    const g = ZEROS[k];
    const t = g * lnx;
    // 2 * Re( x^rho / rho ) with rho = 1/2 + i g
    sum += (2 * root * (0.5 * Math.cos(t) + g * Math.sin(t))) / (0.25 + g * g);
  }
  return x - sum - Math.log(2 * Math.PI) - 0.5 * Math.log(1 - 1 / (x * x));
}
