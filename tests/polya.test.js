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
