/*
 * Structures arborescentes dynamiques
 * Copyright (C) 2024-2026 Antoine Genitrini (développeur principal)
 * Contributeurs (projet PSTL 2023-2024, Sorbonne Université) :
 *   Tracy Hong, Julien Fang, Jean-Marc Zhuang, Laura Rattanavan
 *
 * Ce programme est un logiciel libre : vous pouvez le redistribuer et/ou le
 * modifier selon les termes de la GNU General Public License telle que publiée
 * par la Free Software Foundation, version 3 de la licence ou (à votre choix)
 * toute version ultérieure. Ce programme est distribué dans l'espoir qu'il sera
 * utile, mais SANS AUCUNE GARANTIE ; voir le fichier LICENSE pour plus de détails.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/* Tests aléatoires des files de priorité : tas min et files binomiales. */
'use strict';

const fs = require('fs');
const path = require('path');
const { load, run, checkFrames, test, eq, ok, rng, ROOT } = require('./harness');

const sorted = (a) => a.slice().sort((x, y) => x - y);
const nu = (n) => n.toString(2).split('').filter((b) => b === '1').length;

/** Exécute une opération en enregistrant les étapes ; renvoie [résultat, étapes]. */
function call(A, op, args) {
  let res;
  const frames = A.record(() => (res = A[op](...args)));
  return [res, frames];
}

/** k entiers distincts tirés dans [0, 999] hors de l'ensemble used. */
function distinct(r, k, used) {
  const out = [];
  while (out.length < k) {
    const v = Math.floor(r() * 1000);
    if (!used.has(v)) {
      used.add(v);
      out.push(v);
    }
  }
  return out;
}

if (fs.existsSync(path.join(ROOT, 'js/algos/heap.js'))) {
  const DT = load('heap');

  test('heap : 400 opérations aléatoires conformes à un multiensemble de référence', () => {
    const r = rng(7);
    const A = new DT.algos.heap();
    let ref = [];
    for (let i = 0; i < 400; i++) {
      const p = r();
      if (p < 0.55) {
        const x = Math.floor(r() * 30); // doublons fréquents
        const { frames } = run(DT, 'heap', [['insert', [x]]], A);
        if (i % 40 === 0) checkFrames(DT, frames, `heap#${i}`);
        ref.push(x);
      } else if (p < 0.85) {
        const [m, frames] = call(A, 'extractMin', []);
        if (i % 40 === 1) checkFrames(DT, frames, `heap#${i}`);
        if (!ref.length) ok(m === null, 'extractMin sur tas vide');
        else {
          const mn = Math.min(...ref);
          eq(m, mn, 'extractMin renvoie le minimum');
          ref.splice(ref.indexOf(mn), 1);
        }
      } else if (ref.length) {
        const old = ref[Math.floor(r() * ref.length)];
        const v = old - 1 - Math.floor(r() * 10);
        call(A, 'decreaseKey', [old, v]);
        ref[ref.indexOf(old)] = v;
      }
      A.check();
      eq(A.keys(), sorted(ref), `heap après l'opération ${i}`);
    }
  });

  test('heap : construction linéaire valide, au plus 2n comparaisons', () => {
    const r = rng(3);
    for (let n = 0; n <= 40; n++) {
      const list = Array.from({ length: n }, () => Math.floor(r() * 50));
      const A = new DT.algos.heap();
      const { frames } = run(DT, 'heap', [['build', [list]]], A);
      checkFrames(DT, frames, `build ${n}`);
      A.check();
      eq(A.keys(), sorted(list), `build ${n}`);
      if (n >= 2) ok(A.lastCmp <= 2 * n, `build ${n} : ${A.lastCmp} comparaisons`);
      const out = [];
      for (let i = 0; i < n; i++) out.push(call(A, 'extractMin', [])[0]);
      eq(out, sorted(list), `tri par tas ${n}`);
    }
  });

  test('heap : diminuer une clé plus grande est refusé', () => {
    const A = new DT.algos.heap();
    run(DT, 'heap', [['build', [[5, 3, 8]]]], A);
    let threw = false;
    try {
      call(A, 'decreaseKey', [3, 4]);
    } catch (e) {
      threw = e instanceof DT.UserError;
    }
    ok(threw, 'UserError attendue');
  });
}

if (fs.existsSync(path.join(ROOT, 'js/algos/binomial.js'))) {
  const DT = load('binomial');
  const B = DT.algos.binomial;

  test('binomial : union de files aléatoires, ν(n) + ν(m) − ν(n+m) comparaisons', () => {
    const r = rng(11);
    for (let n = 0; n <= 20; n++) {
      for (let m = 0; m <= 20; m++) {
        if (!m) continue; // la saisie d'une union contient au moins une clé
        const used = new Set();
        const l1 = distinct(r, n, used);
        const l2 = distinct(r, m, used);
        const A = new B();
        call(A, 'build', [l1]);
        A.check();
        eq(A.linkCount, n - nu(n), `construction ${n}`);
        const [, frames] = call(A, 'union', [l2]);
        if ((n + m) % 9 === 0) checkFrames(DT, frames, `union ${n}+${m}`);
        A.check();
        eq(A.keys(), sorted(l1.concat(l2)), `clés ${n}+${m}`);
        eq(A.linkCount, nu(n) + nu(m) - nu(n + m), `comparaisons ${n}+${m}`);
      }
    }
  });

  test('binomial : ajouts (union avec FB₁), suppressions du minimum triées', () => {
    const r = rng(5);
    for (let n = 1; n <= 33; n++) {
      const list = distinct(r, n, new Set());
      const A = new B();
      for (const x of list) {
        const [, frames] = call(A, 'insert', [x]);
        if (n === 13) checkFrames(DT, frames, `insert ${x}`);
        A.check();
      }
      eq(A.keys(), sorted(list), `ajouts ${n}`);
      const out = [];
      for (let i = 0; i < n; i++) {
        const [k, frames] = call(A, 'extractMin', []);
        if (n === 13) checkFrames(DT, frames, `extract ${i}`);
        A.check();
        out.push(k);
      }
      eq(out, sorted(list), `suppressions ${n}`);
      eq(call(A, 'extractMin', [])[0], null, 'file vide');
    }
  });

  test('binomial : diminuer une clé conserve la validité', () => {
    const r = rng(9);
    for (let t = 0; t < 60; t++) {
      const n = 1 + Math.floor(r() * 30);
      const used = new Set();
      const list = distinct(r, n, used);
      const A = new B();
      call(A, 'build', [list]);
      const ref = list.slice();
      for (let k = 0; k < 5; k++) {
        const old = ref[Math.floor(r() * ref.length)];
        let v = old - 1 - Math.floor(r() * 300);
        while (used.has(v)) v--;
        used.add(v);
        const [, frames] = call(A, 'decreaseKey', [old, v]);
        if (t === 0) checkFrames(DT, frames, 'decreaseKey');
        ref[ref.indexOf(old)] = v;
        A.check();
        eq(A.keys(), sorted(ref), 'clés après diminution');
      }
      eq(call(A, 'extractMin', [])[0], Math.min(...ref), 'minimum après diminutions');
    }
  });

  test('binomial : clés dupliquées refusées', () => {
    const A = new B();
    call(A, 'build', [[4, 9, 2]]);
    let threw = false;
    try {
      call(A, 'union', [[7, 9]]);
    } catch (e) {
      threw = e instanceof DT.UserError;
    }
    ok(threw, 'union avec doublon');
    call(A, 'insert', [9]);
    eq(A.keys(), [2, 4, 9], 'ajout d’un doublon ignoré');
  });
}
