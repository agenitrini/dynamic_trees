/*
 * Structures arborescentes dynamiques
 * Copyright (C) 2024-2026 Antoine Genitrini (développeur principal)
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/* Tests des structures de Pólya : tables, uniformité des générateurs, visualisation. */
'use strict';

const { load, run, checkFrames, test, eq, ok, rng } = require('./harness');

/** Forme canonique d'un arbre imbriqué { k: [...] } (multiensemble d'enfants trié). */
function canon(t) {
  return '(' + t.k.map(canon).sort().join('') + ')';
}

const counts = { polya: [0, 1, 1, 2, 4, 9, 20, 48, 115, 286, 719], hier: [0, 1, 1, 2, 5, 12, 33, 90, 261] };

for (const id of ['polya', 'polya_hier']) {
  const DT = load(id);
  const fam = id === 'polya' ? 'polya' : 'hier';
  const tab = DT.polyaTables[fam];

  test(`${id} : les tables redonnent les premiers nombres exacts`, () => {
    counts[fam].forEach((c, k) => {
      if (!k) return;
      const v = tab.w[k] / Math.pow(tab.rho, k);
      ok(Math.abs(v - c) < 1e-9 * Math.max(1, c), `T_${k} = ${v} au lieu de ${c}`);
    });
  });

  test(`${id} : génération uniforme pour les petites tailles`, () => {
    const r = rng(7);
    for (const n of fam === 'polya' ? [5, 7] : [5, 6]) {
      const g = DT.polyaGen[fam](tab, r);
      const freq = new Map();
      const N = 20000;
      for (let i = 0; i < N; i++) {
        const c = canon(g.tree(n));
        freq.set(c, (freq.get(c) || 0) + 1);
      }
      eq(freq.size, counts[fam][n], `${id} : nombre de structures distinctes de taille ${n}`);
      const mean = N / counts[fam][n];
      let chi2 = 0;
      for (const v of freq.values()) chi2 += ((v - mean) * (v - mean)) / mean;
      // khi-deux à (c - 1) degrés de liberté : on tolère largement (seuil ~ 1e-4)
      const df = counts[fam][n] - 1;
      ok(chi2 < df + 6 * Math.sqrt(2 * df) + 10, `${id} n=${n} : khi-deux ${chi2.toFixed(1)} pour ${df} ddl`);
    }
  });

  test(`${id} : visualisations de tailles aléatoires`, () => {
    const r = rng(11);
    for (let i = 0; i < 12; i++) {
      const n = 1 + Math.floor(r() * 300);
      const { algo, frames } = run(DT, id, [['generate', [n]]]);
      checkFrames(DT, frames, `${id} n=${n}`);
      algo.check();
      ok(frames.length < 200, `${id} : trop d'étapes (${frames.length})`);
    }
  });
}

/* Familles sans décoration : arbres d'identité, arbres de Cayley et partitions totales (étiquetés). */
const plain = {
  polya_identity: { sizes: [7, 8], counts: { 7: 12, 8: 25 } },
  polya_cayley: { sizes: [4, 5], counts: { 4: 64, 5: 625 } },
  polya_schroeder: { sizes: [4, 5], counts: { 4: 26, 5: 236 } },
};

/** Forme canonique de l'arbre aplati (étiquettes comprises pour les familles étiquetées). */
function canonFlat(nodes) {
  const byId = new Map(nodes.map((x) => [x.id, x]));
  const rec = (x) => (x.label !== undefined && !x.kids.length ? String(x.label) : (x.label !== undefined ? x.label : '') + '(' + x.kids.map((k) => rec(byId.get(k))).sort().join(',') + ')');
  return rec(nodes[0]);
}

for (const [id, spec] of Object.entries(plain)) {
  const DT = load(id);

  test(`${id} : génération uniforme pour les petites tailles`, () => {
    const A = new DT.algos[id]();
    for (const n of spec.sizes) {
      const freq = new Map();
      const N = Math.max(20000, 40 * spec.counts[n]);
      for (let i = 0; i < N; i++) {
        A.s = A.initState();
        A.generate(n);
        A.check();
        const c = canonFlat(A.s.nodes);
        freq.set(c, (freq.get(c) || 0) + 1);
      }
      eq(freq.size, spec.counts[n], `${id} : nombre de structures distinctes de taille ${n}`);
      const mean = N / spec.counts[n];
      let chi2 = 0;
      for (const v of freq.values()) chi2 += ((v - mean) * (v - mean)) / mean;
      const df = spec.counts[n] - 1;
      ok(chi2 < df + 6 * Math.sqrt(2 * df) + 10, `${id} n=${n} : khi-deux ${chi2.toFixed(1)} pour ${df} ddl`);
    }
  });

  test(`${id} : visualisations de tailles aléatoires`, () => {
    const r = rng(13);
    for (let i = 0; i < 10; i++) {
      const n = 1 + Math.floor(r() * 300);
      const { algo, frames } = run(DT, id, [['generate', [n]]]);
      checkFrames(DT, frames, `${id} n=${n}`);
      algo.check();
      ok(frames.length < 200, `${id} : trop d'étapes (${frames.length})`);
    }
  });
}

/* Arbres binaires non plans (Wedderburn–Etherington, A001190) : taille = nombre de feuilles. */
{
  const id = 'polya_binary';
  const DT = load(id);
  const tab = DT.polyaTables.binary;
  // A001190, n = 1..20
  const oeis = [0, 1, 1, 1, 2, 3, 6, 11, 23, 46, 98, 207, 451, 983, 2179, 4850, 10905, 24631, 56011, 127912, 293547];
  const leaves = (t) => (t.k.length ? t.k.reduce((s, c) => s + leaves(c), 0) : 1);

  test(`${id} : récurrences exactes et tables = OEIS A001190`, () => {
    // 2 T_n = sum T_i T_{n-i} + [n pair] T_{n/2}, et forme pointée
    // n T_n = sum d T_d T_{n-d} + [n pair] (n/2) T_{n/2} (entiers exacts)
    const T = [0n, 1n];
    for (let n = 2; n <= 60; n++) {
      let s = 0n;
      for (let i = 1; i < n; i++) s += T[i] * T[n - i];
      if (n % 2 === 0) s += T[n / 2];
      T.push(s / 2n);
      let p = 0n;
      for (let d = 1; d < n; d++) p += BigInt(d) * T[d] * T[n - d];
      if (n % 2 === 0) p += BigInt(n / 2) * T[n / 2];
      ok(p === BigInt(n) * T[n], `forme pointée en n = ${n}`);
    }
    oeis.forEach((c, k) => k && ok(T[k] === BigInt(c), `T_${k} = ${T[k]} au lieu de ${c}`));
    for (let k = 1; k <= 60; k++) {
      const v = tab.w[k] / Math.pow(tab.rho, k);
      ok(Math.abs(v - Number(T[k])) < 1e-9 * Number(T[k]), `T_${k} = ${v} au lieu de ${T[k]}`);
    }
  });

  test(`${id} : somme des probabilités des pas = 1`, () => {
    const w = tab.w;
    for (const n of [2, 3, 10, 101, 500, 999, 1000]) {
      let s = 0;
      for (let d = 1; d < n; d++) s += (d * w[d] * w[n - d]) / (n * w[n]);
      if (n % 2 === 0) s += (w[n / 2] * Math.pow(tab.rho, n / 2)) / (2 * w[n]);
      ok(Math.abs(s - 1) < 1e-12, `n=${n} : somme ${s}`);
    }
  });

  test(`${id} : génération uniforme pour les petites tailles`, () => {
    const r = rng(17);
    for (const n of [5, 7, 8, 10]) {
      const g = DT.polyaGen.binary(tab, r);
      const freq = new Map();
      const N = Math.max(20000, 300 * oeis[n]);
      for (let i = 0; i < N; i++) {
        const t = g.tree(n);
        eq(leaves(t), n, `nombre de feuilles`);
        const c = canon(t);
        freq.set(c, (freq.get(c) || 0) + 1);
      }
      eq(freq.size, oeis[n], `${id} : nombre de structures distinctes de taille ${n}`);
      const mean = N / oeis[n];
      let chi2 = 0;
      for (const v of freq.values()) chi2 += ((v - mean) * (v - mean)) / mean;
      const df = oeis[n] - 1;
      ok(chi2 < df + 6 * Math.sqrt(2 * df) + 10, `${id} n=${n} : khi-deux ${chi2.toFixed(1)} pour ${df} ddl`);
    }
  });

  test(`${id} : structure valide, décorations = deux copies identiques`, () => {
    const r = rng(19);
    let decos = 0;
    for (let i = 0; i < 200; i++) {
      const n = 1 + Math.floor(r() * 400);
      const g = DT.polyaGen.binary(tab, r);
      const t = g.tree(n);
      eq(leaves(t), n, 'nombre de feuilles');
      const stack = [t];
      let nodes = 0;
      while (stack.length) {
        const x = stack.pop();
        nodes++;
        ok(x.k.length === 0 || x.k.length === 2, 'arité 0 ou 2');
        if (x.k.length === 2 && x.k[0].c === 'deco') {
          decos++;
          eq(x.k[1].c, 'deco', 'les deux copies sont des décorations');
          eq(canon(x.k[0]), canon(x.k[1]), 'copies identiques');
        }
        stack.push(...x.k);
      }
      eq(nodes, 2 * n - 1, 'nombre de nœuds 2n − 1');
      ok(g.cost.steps >= n - 1, 'au moins un choix examiné par nœud interne');
    }
    ok(decos > 0, 'aucune décoration observée');
  });

  test(`${id} : visualisations de tailles aléatoires`, () => {
    const r = rng(23);
    for (let i = 0; i < 12; i++) {
      const n = 1 + Math.floor(r() * 300);
      const { algo, frames } = run(DT, id, [['generate', [n]]]);
      checkFrames(DT, frames, `${id} n=${n}`);
      algo.check();
      ok(frames.length < 200, `${id} : trop d'étapes (${frames.length})`);
    }
  });
}
