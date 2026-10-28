/*
 * Structures arborescentes dynamiques
 * Copyright (C) 2024-2026 Antoine Genitrini (développeur principal)
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/* Structures de Pólya sans décoration (Cayley) : voir polya.js. */
(function () {
  'use strict';

  const DT = window.DT;

  class PolyaCayley extends DT.PolyaBase {}
  PolyaCayley.table = 'cayley';
  PolyaCayley.tau0 = 0.7071067811865476;
  PolyaCayley.range = [1, 1000];
  PolyaCayley.decorations = false;
  PolyaCayley.labelled = 'all';
  PolyaCayley.makeGenerator = DT.polyaGen.cayley;
  PolyaCayley.legend = null;
  PolyaCayley.sizeOf = (nodes) => nodes.length;
  PolyaCayley.checkClass = DT.polyaCheck.none;

  DT.register('polya_cayley', PolyaCayley);
})();
