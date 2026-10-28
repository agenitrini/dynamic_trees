#!/usr/bin/env python3
"""
Calcule les tables de nombres utilisées par les visualisations des structures
de Pólya (js/algos/polya_tables.js) : w_k = rho^k T_k pour k <= NMAX, à partir
des nombres exacts (entiers Python), avec rho calculé en haute précision.

Usage : python3 tools/polya_tables.py  (nécessite mpmath)
"""
from mpmath import mp, mpf, exp, log, findroot, e as E
import json, os

mp.dps = 50
NMAX = 1000

def polya(N):
    T = [0, 1]
    s = [0, 1]                       # s_n = sum_{d|n} d T_d
    for n in range(2, N + 1):
        tot = sum(s[k] * T[n - k] for k in range(1, n))
        T.append(tot // (n - 1))
        s.append(sum(d * T[d] for d in range(1, n + 1) if n % d == 0))
    return T

def hierarchies(N):
    # E = MSet(T) = 2T + 1 - z ; n E_n = sum_m s_m E_{n-m}
    T = [0, 1]; E_ = [1, 1]; s = [0, 1]
    for n in range(2, N + 1):
        rest = sum(s[m] * E_[n - m] for m in range(1, n))
        sw = sum(d * T[d] for d in range(1, n) if n % d == 0)
        # n (2 T_n) = rest + sw + n T_n  =>  T_n = (rest + sw) / n
        Tn = (rest + sw) // n
        T.append(Tn); E_.append(2 * Tn); s.append(sw + n * Tn)
    return T

def rho_of(T, kind):
    N = len(T) - 1
    if kind == 'polya':
        z = lambda x: x * exp(sum(sum(mpf(T[n]) * x**(n * i) for n in range(1, N // i + 1)) / i for i in range(2, N)))
        return findroot(lambda x: z(x) - 1 / E, mpf('0.338'))
    z = lambda x: exp(-(1 - x) / 2 + sum(sum(mpf(T[n]) * x**(n * i) for n in range(1, N // i + 1)) / i for i in range(2, N))) / 2
    return findroot(lambda x: z(x) - 1 / E, mpf('0.2808'))

def normalised(L, rho):
    return [float(exp(log(mpf(v)) + k * log(rho))) if v > 0 else 0.0 for k, v in enumerate(L)]

out = {}
T = polya(NMAX + 1)
rho = rho_of(T[:301], 'polya')
out['polya'] = {'rho': float(rho), 'w': normalised(T, rho), 'tau0': 0.7797450101873204}
H = hierarchies(NMAX)
rh = rho_of(H[:301], 'hier')
F = [1, 1] + [2 * H[n] for n in range(2, NMAX + 1)]
out['hier'] = {'rho': float(rh), 'w': normalised(H, rh), 'wF': normalised(F, rh), 'tau0': 0.3658015862381119}

def identity(N):
    T = [0, 1]
    for n in range(2, N + 1):
        tot = 0
        for i in range(1, n):
            tot += i * T[i] * sum((-1) ** (m + 1) * T[n - m * i] for m in range(1, (n - 1) // i + 1))
        T.append(tot // (n - 1))
    return T

def schroeder(N):
    # total partitions, EGF coefficients c_n = T_n / n! : (n+1)c_{n+1} = [n=0] - n c_n + 2 sum_{k<n} (k+1) c_{k+1} c_{n-k}
    c = [mpf(0)] * (N + 1)
    for n in range(0, N):
        s = (1 if n == 0 else 0) - n * c[n] + 2 * sum((k + 1) * c[k + 1] * c[n - k] for k in range(n))
        c[n + 1] = s / (n + 1)
    return c

I = identity(NMAX)
ri = findroot(lambda x: x * exp(sum(sum((-1) ** (i - 1) * mpf(I[n]) * x**(n * i) for n in range(1, 300 // i + 1)) / i for i in range(2, 300))) - 1 / E, mpf('0.397'))
out['identity'] = {'rho': float(ri), 'w': normalised(I, ri), 'tau0': 0.6425790797442695}
# Cayley trees (labelled): c_k = k^(k-1)/k!, forests f_m = (m+1)^(m-1)/m!, rho = 1/e
from mpmath import factorial, loggamma
def lab(k):  # rho^k k^(k-1)/k!
    return float(exp((k - 1) * log(k) - loggamma(k + 1) - k)) if k > 0 else 0.0
def labF(m):  # rho^m (m+1)^(m-1)/m!
    return float(exp((m - 1) * log(m + 1) - loggamma(m + 1) - m)) if m > 0 else 1.0
out['cayley'] = {'rho': float(exp(-1)), 'w': [lab(k) for k in range(NMAX + 2)], 'wF': [labF(m) for m in range(NMAX + 1)],
                 'tau0': float(1 / mp.sqrt(2))}
cS = schroeder(NMAX)
rs = 2 * log(2) - 1
wS = [float(cS[k] * rs**k) if k else 0.0 for k in range(NMAX + 1)]
wSF = [1.0, float(rs)] + [2 * wS[k] for k in range(2, NMAX + 1)]
out['schroeder'] = {'rho': float(rs), 'w': wS, 'wF': wSF, 'tau0': float(mp.sqrt(rs) / 2)}

path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'js', 'algos', 'polya_tables.js')
with open(path, 'w') as f:
    f.write('/*\n * Tables des structures de Pólya (générées par tools/polya_tables.py, ne pas modifier).\n'
            ' * w[k] = rho^k T_k (T_k : nombre de structures de taille k), jusqu\'à k = %d.\n'
            ' * SPDX-License-Identifier: GPL-3.0-or-later\n */\n' % NMAX)
    f.write('(function () {\n  window.DT = window.DT || {};\n  window.DT.polyaTables = ')
    f.write(json.dumps(out, separators=(',', ':')))
    f.write(';\n})();\n')
print('rho polya', rho, 'rho hier', rh, '->', path)
