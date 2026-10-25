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

/* Tests des arbres 2-3-4 et des arbres B. */
'use strict';

const { load, run, checkFrames, test, eq, ok, rng } = require('./harness');

/** Forme d'un arbre : [clés](enfants...). */
const shape = (n) => (n ? `[${n.keys.join(',')}]` + (n.kids.length ? `(${n.kids.map(shape).join('')})` : '') : '-');
const ins = (...ks) => ks.map((k) => ['insert', [k]]);
const COURSE = [4, 35, 10, 13, 3, 30, 15, 12, 7, 40, 20, 11, 6];
// formes obtenues avec le code PSTL ArbreB.py (ordre 2)
const EXPECT_M2 = '[5,10,20,30]([1,2,3][6,7,8,9][12,15,17,18][22,25,28][35,40])';
const EXPECT_DEL = [
  [6, '[5,10,20]([1,3][7,8][12,15,17][25,28,30,40])'],
  [20, '[5,10,17]([1,3][7,8][12,15][25,28,30,40])'],
  [10, '[8,17]([1,3,5,7][12,15][25,28,30,40])'],
  [3, '[8,17]([1,5,7][12,15][25,28,30,40])'],
];

/* ------------------------------------------------------------------------ */
const D2 = load('a234');

function make234(method) {
  const A = new D2.algos.a234();
  A.record(() => A.setMethod(method));
  return A;
}

test('a234 : exemple du cours en descente (figure arbre234_ex1)', () => {
  const A = make234('down');
  const { frames } = run(D2, 'a234', ins(...COURSE), A);
  checkFrames(D2, frames, 'a234/cours');
  A.check();
  eq(shape(A.s.root), '[13]([4,10]([3][6,7][11,12])[30]([15,20][35,40]))');
});

test('a234 : exemple du cours en remontée (forme calculée à la main)', () => {
  const A = make234('up');
  const { frames } = run(D2, 'a234', ins(...COURSE), A);
  checkFrames(D2, frames, 'a234/remontee');
  A.check();
  // Avec la convention « on éclate le 4-nœud (a, b, c) : b remonte », la suite du
  // cours donne ici le même arbre que la méthode en descente.
  eq(shape(A.s.root), '[13]([4,10]([3][6,7][11,12])[30]([15,20][35,40]))');
});

test('a234 : les deux méthodes peuvent donner des arbres différents', () => {
  // descente : la racine (4, 13, 17) est éclatée préventivement lors de l'ajout de 14
  const ks = [17, 4, 19, 2, 12, 13, 16, 9, 14];
  const down = make234('down');
  const up = make234('up');
  run(D2, 'a234', ins(...ks), down);
  run(D2, 'a234', ins(...ks), up);
  down.check();
  up.check();
  eq(shape(down.s.root), '[13]([4]([2][9,12])[17]([14,16][19]))');
  eq(shape(up.s.root), '[4,13,17]([2][9,12][14,16][19])');
});

test('a234 : éclatement en remontée en cascade', () => {
  const A = make234('up');
  run(D2, 'a234', ins(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13), A);
  A.check();
  eq(A.keys(), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
});

test('a234 : suppressions de l’exemple (fusions, emprunts)', () => {
  const A = make234('down');
  const ops = ins(...COURSE).concat([['delete', [13]], ['delete', [3]], ['delete', [35]], ['delete', [10]]]);
  const { frames } = run(D2, 'a234', ops, A);
  checkFrames(D2, frames, 'a234/suppr');
  A.check();
  eq(A.keys(), [4, 6, 7, 11, 12, 15, 20, 30, 40]);
});

for (const method of ['down', 'up']) {
  test(`a234 (${method}) : 400 opérations aléatoires conformes à un ensemble de référence`, () => {
    const r = rng(method === 'down' ? 7 : 11);
    const A = make234(method);
    const ref = new Set();
    for (let i = 0; i < 400; i++) {
      const x = Math.floor(r() * 50);
      const u = r();
      const op = u < 0.55 ? 'insert' : u < 0.85 ? 'delete' : 'search';
      let res;
      const frames = A.record(() => {
        res = A[op](x);
      });
      if (i % 20 === 0) checkFrames(D2, frames, `a234#${i}`);
      if (op === 'insert') ref.add(x);
      if (op === 'delete') ref.delete(x);
      if (op === 'search') eq(res, ref.has(x), `search ${x}`);
      A.check();
      eq(A.keys(), [...ref].sort((a, b) => a - b), `après ${op} ${x}`);
    }
    // on vide tout
    for (const x of [...ref]) {
      A.record(() => A.delete(x));
      A.check();
    }
    ok(A.s.root === null, 'arbre vide à la fin');
  });
}

test('a234 : changer de méthode vide l’arbre', () => {
  const A = make234('down');
  run(D2, 'a234', ins(1, 2, 3), A);
  A.record(() => A.setMethod('up'));
  ok(A.s.root === null && A.s.cfg.method === 'up');
  A.record(() => A.clear());
  ok(A.s.cfg.method === 'up', 'clear garde la méthode');
});

/* ------------------------------------------------------------------------ */
const DB = load('btree');

function makeB(m) {
  const A = new DB.algos.btree();
  A.record(() => A.setOrder(String(m)));
  return A;
}

test('btree : ordre 1 sur la suite du cours (forme vérifiée avec ArbreB.py)', () => {
  const A = makeB(1);
  const { frames } = run(DB, 'btree', ins(...COURSE), A);
  checkFrames(DB, frames, 'btree/m1');
  A.check();
  eq(shape(A.s.root), '[13]([4,10]([3][6,7][11,12])[30]([15,20][35,40]))');
});

test('btree : ordre 2, 20 clés (forme vérifiée avec ArbreB.py)', () => {
  const A = makeB(2);
  run(DB, 'btree', ins(10, 20, 5, 6, 12, 30, 7, 17, 3, 1, 25, 28, 15, 40, 8, 9, 2, 35, 22, 18), A);
  A.check();
  eq(shape(A.s.root), EXPECT_M2);
});

test('btree : ordre 2, suppressions (formes vérifiées avec ArbreB.py)', () => {
  const A = makeB(2);
  run(DB, 'btree', ins(10, 20, 5, 6, 12, 30, 7, 17, 3, 1, 25, 28, 15, 40, 8), A);
  for (const [x, exp] of EXPECT_DEL) {
    const { frames } = run(DB, 'btree', [['delete', [x]]], A);
    checkFrames(DB, frames, `btree/del${x}`);
    A.check();
    eq(shape(A.s.root), exp, `après suppression de ${x}`);
  }
});

for (const m of [1, 2, 3]) {
  test(`btree (m = ${m}) : 400 opérations aléatoires conformes à un ensemble de référence`, () => {
    const r = rng(100 + m);
    const A = makeB(m);
    const ref = new Set();
    for (let i = 0; i < 400; i++) {
      const x = Math.floor(r() * 60);
      const u = r();
      const op = u < 0.55 ? 'insert' : u < 0.85 ? 'delete' : 'search';
      let res;
      const frames = A.record(() => {
        res = A[op](x);
      });
      if (i % 20 === 0) checkFrames(DB, frames, `btree#${i}`);
      if (op === 'insert') ref.add(x);
      if (op === 'delete') ref.delete(x);
      if (op === 'search') eq(res, ref.has(x), `search ${x}`);
      A.check();
      eq(A.keys(), [...ref].sort((a, b) => a - b), `après ${op} ${x}`);
    }
    for (const x of [...ref]) {
      A.record(() => A.delete(x));
      A.check();
    }
    ok(A.s.root === null, 'arbre vide à la fin');
  });
}

test('btree : changer d’ordre vide l’arbre', () => {
  const A = makeB(2);
  run(DB, 'btree', ins(1, 2, 3), A);
  A.record(() => A.setOrder('3'));
  ok(A.s.root === null && A.s.cfg.order === 3);
});
