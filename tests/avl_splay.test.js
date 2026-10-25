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

/* Tests ciblés des arbres AVL et auto-adaptatifs (splay). */
'use strict';

const fs = require('fs');
const path = require('path');
const { load, run, checkFrames, test, eq, ok, rng, ROOT } = require('./harness');

/** Forme parenthésée <r, G, D> (arbre vide : .) */
const shape = (n) => (n ? `<${n.key},${shape(n.left)},${shape(n.right)}>` : '.');
const ins = (...xs) => xs.map((x) => ['insert', [x]]);
const msgs = (frames) => frames.filter((f) => f.msg).map((f) => f.msg[0]);

if (fs.existsSync(path.join(ROOT, 'js/algos/avl.js'))) {
  const DT = load('avl');

  test('avl : ajouts 1..7 donnent l’arbre parfait de racine 4', () => {
    const { algo } = run(DT, 'avl', ins(1, 2, 3, 4, 5, 6, 7));
    eq(shape(algo.s.root), '<4,<2,<1,.,.>,<3,.,.>>,<6,<5,.,.>,<7,.,.>>>');
    eq(algo.s.root.h, 2);
    algo.check();
  });

  const cases = [
    ['RD', [3, 2, 1]],
    ['RG', [1, 2, 3]],
    ['RGD', [3, 1, 2]],
    ['RDG', [1, 3, 2]],
  ];
  for (const [kind, keys] of cases) {
    test(`avl : rotation ${kind}`, () => {
      const { algo, frames } = run(DT, 'avl', ins(...keys));
      eq(shape(algo.s.root), '<2,<1,.,.>,<3,.,.>>');
      const m = msgs(frames);
      ok(m.includes('avl.case.' + kind), 'annonce ' + kind);
      if (kind.length === 3) ok(m.includes(`avl.do.${kind}1`) && m.includes(`avl.do.${kind}2`), 'deux étapes');
      else ok(m.includes('avl.do.' + kind), 'rotation ' + kind);
      // les identifiants des nœuds sont conservés par les rotations
      const ids = frames[frames.length - 1].scene.items.filter((i) => i.type === 'node').map((i) => i.id).sort();
      eq(ids, ['1', '2', '3']);
    });
  }

  test('avl : rotation double sur un sous-arbre (exemple du cours)', () => {
    const { algo } = run(DT, 'avl', ins(30, 10, 40, 5, 20, 25));
    // déséquilibre +2 en 30, sous-arbre gauche 10 penche à droite : RGD
    eq(shape(algo.s.root), '<20,<10,<5,.,.>,.>,<30,<25,.,.>,<40,.,.>>>');
    algo.check();
  });

  test('avl : suppression dans un arbre de Fibonacci (deux rotations en cascade)', () => {
    const { algo, frames } = run(DT, 'avl', ins(8, 5, 11, 3, 7, 10, 12, 2, 4, 6, 9, 1));
    eq(algo.s.root.h, 4);
    eq(msgs(frames).filter((k) => k.startsWith('avl.do.')).length, 0, 'aucune rotation à la construction');
    const r = run(DT, 'avl', [['delete', [12]]], algo);
    eq(msgs(r.frames).filter((k) => k.startsWith('avl.do.')), ['avl.do.RD', 'avl.do.RD']);
    eq(algo.s.root.key, 5);
    algo.check();
  });

  test('avl : suppression d’un nœud à deux enfants (minimum du sous-arbre droit)', () => {
    const { algo } = run(DT, 'avl', ins(4, 2, 6, 1, 3, 5, 7).concat([['delete', [4]]]));
    eq(algo.s.root.key, 5);
    eq(algo.keys(), [1, 2, 3, 5, 6, 7]);
    algo.check();
  });

  test('avl : hauteur ≤ 1,44 log2(n+2) sur des suites aléatoires et croissantes', () => {
    const r = rng(7);
    for (let t = 0; t < 20; t++) {
      const A = new DT.algos.avl();
      const n = 10 + Math.floor(r() * 120);
      const keys = t === 0 ? [...Array(n).keys()] : Array.from({ length: n }, () => Math.floor(r() * 1000));
      A.record(() => keys.forEach((k) => A.insert(k)));
      A.check();
      const size = A.keys().length;
      ok(A.height() <= 1.44 * Math.log2(size + 2), `hauteur ${A.height()} pour n = ${size}`);
    }
  });
}

if (fs.existsSync(path.join(ROOT, 'js/algos/splay.js'))) {
  const DT = load('splay');

  test('splay : exemple du cours (ajouts 2, 3, 4, 5, 6 puis 1)', () => {
    const { algo, frames } = run(DT, 'splay', ins(2, 3, 4, 5, 6));
    eq(shape(algo.s.root), '<6,<5,<4,<3,<2,.,.>,.>,.>,.>,.>');
    const r = run(DT, 'splay', ins(1), algo);
    // deux RDD (zig-zig) puis une RD finale
    eq(shape(algo.s.root), '<1,.,<6,<4,<2,.,<3,.,.>>,<5,.,.>>,.>>');
    eq(msgs(r.frames).filter((k) => k.startsWith('splay.case.')), ['splay.case.RDD', 'splay.case.RDD', 'splay.case.RD']);
    checkFrames(DT, frames.concat(r.frames), 'splay/cours');
    algo.check();
  });

  test('splay : zig-zig = rotation au grand-père d’abord', () => {
    const A = new DT.algos.splay();
    A.s.root = { id: 1, key: 3, left: { id: 2, key: 2, left: { id: 3, key: 1, left: null, right: null }, right: null }, right: null };
    A.s.nextId = 4;
    const r = run(DT, 'splay', [['search', [1]]], A);
    // RD en 3 puis RD en 2 (deux RD de bas en haut donneraient <1,.,<3,<2,.,.>,.>>)
    eq(shape(A.s.root), '<1,.,<2,.,<3,.,.>>>');
    ok(msgs(r.frames).includes('splay.case.RDD'));
  });

  test('splay : zig-zag (RGD)', () => {
    const A = new DT.algos.splay();
    A.s.root = { id: 1, key: 30, left: { id: 2, key: 10, left: null, right: { id: 3, key: 20, left: null, right: null } }, right: null };
    A.s.nextId = 4;
    const r = run(DT, 'splay', [['search', [20]]], A);
    eq(shape(A.s.root), '<20,<10,.,.>,<30,.,.>>');
    ok(msgs(r.frames).includes('splay.case.RGD'));
  });

  test('splay : la recherche remonte la cible (ou le dernier nœud visité) à la racine', () => {
    const { algo } = run(DT, 'splay', ins(7, 6, 5, 4, 3, 2, 1));
    let res;
    algo.record(() => (res = algo.search(4)));
    ok(res === true);
    eq(algo.s.root.key, 4);
    algo.check();
    algo.record(() => (res = algo.search(100)));
    ok(res === false);
    eq(algo.s.root.key, 7);
    eq(algo.keys(), [1, 2, 3, 4, 5, 6, 7]);
  });

  test('splay : suppression (racine = maximum du sous-arbre gauche remonté)', () => {
    const { algo } = run(DT, 'splay', ins(10, 5, 15, 3, 8, 12, 20).concat([['delete', [10]]]));
    eq(algo.keys(), [3, 5, 8, 12, 15, 20]);
    eq(algo.s.root.key, 8);
    ok(algo.s.root.right && algo.s.root.right.key > 8 && algo.s.root.left.key < 8);
    algo.check();
    run(DT, 'splay', [['delete', [3]], ['delete', [99]]], algo);
    eq(algo.keys(), [5, 8, 12, 15, 20]);
    algo.check();
  });
}
