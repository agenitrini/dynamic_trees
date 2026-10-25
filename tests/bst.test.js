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

/* Tests aléatoires des arbres binaires de recherche (ABR, AVL, Splay). */
'use strict';

const fs = require('fs');
const path = require('path');
const { load, run, checkFrames, test, eq, ok, rng, ROOT } = require('./harness');

for (const id of ['abr', 'avl', 'splay']) {
  if (!fs.existsSync(path.join(ROOT, 'js/algos', id + '.js'))) continue;
  const DT = load(id);

  test(`${id} : 300 opérations aléatoires conformes à un ensemble de référence`, () => {
    const r = rng(42 + id.length);
    const A = new DT.algos[id]();
    const ref = new Set();
    for (let i = 0; i < 300; i++) {
      const x = Math.floor(r() * 40);
      const op = r() < 0.6 ? 'insert' : r() < 0.7 ? 'delete' : 'search';
      const { frames } = run(DT, id, [[op, [x]]], A);
      if (i % 25 === 0) checkFrames(DT, frames, `${id}#${i}`);
      if (op === 'insert') ref.add(x);
      if (op === 'delete') ref.delete(x);
      A.check();
      eq(A.keys(), [...ref].sort((a, b) => a - b), `${id} après ${op} ${x}`);
    }
  });

  test(`${id} : la recherche renvoie la bonne réponse`, () => {
    const A = new DT.algos[id]();
    run(DT, id, [[ 'insert', [5] ], ['insert', [3]], ['insert', [8]]], A);
    let res;
    A.record(() => (res = A.search(8)));
    ok(res === true, 'search(8)');
    A.record(() => (res = A.search(4)));
    ok(res === false, 'search(4)');
    A.check();
  });
}
