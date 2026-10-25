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

/* Cohérence du catalogue et exécution de tous les exemples. */
'use strict';

const fs = require('fs');
const path = require('path');
const { load, run, checkFrames, test, ok, ROOT } = require('./harness');

const DT0 = load('abr');
for (const e of DT0.catalog.entries) {
  test(`catalogue ${e.id} : textes bilingues`, () => {
    for (const f of ['name', 'short', 'goal', 'desc']) {
      ok(e[f] && e[f].fr && e[f].en, `${e.id}.${f} manquant`);
    }
  });
  if (!fs.existsSync(path.join(ROOT, 'js/algos', e.id + '.js'))) continue;
  test(`exemples ${e.id} : exécution et étapes valides`, () => {
    const DT = load(e.id);
    const Cls = DT.algos[e.id];
    ok(Cls, 'module non enregistré');
    for (const ex of e.examples || []) {
      const A = new Cls();
      const pre = [];
      for (const [name, value] of Object.entries(ex.settings || {})) {
        const c = (Cls.controls || []).find((c) => c.name === name);
        ok(c, `${ex.id}: réglage ${name} inconnu`);
        if (c.type === 'select' && c.op) pre.push([c.op, [value]]);
      }
      if (pre.length) A.record(() => pre.forEach(([op, args]) => A[op](...args)));
      const { frames } = run(DT, e.id, ex.ops, A);
      ok(frames.length > 1, `${ex.id}: aucune étape`);
      checkFrames(DT, frames, `${e.id}/${ex.id}`);
      if (typeof A.check === 'function') A.check();
    }
  });
}
