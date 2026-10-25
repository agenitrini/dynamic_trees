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

/* Lance tous les tests : node tests/run.js [filtre] */
'use strict';

const fs = require('fs');
const path = require('path');
const H = require('./harness');

const filter = process.argv[2];
const files = fs
  .readdirSync(__dirname)
  .filter((f) => f.endsWith('.test.js') && (!filter || f.includes(filter)))
  .sort();

for (const f of files) {
  console.log('\n' + f);
  require(path.join(__dirname, f));
}

console.log(`\n${H.results.pass} réussis, ${H.results.fail} échoués`);
process.exit(H.results.fail ? 1 : 0);
