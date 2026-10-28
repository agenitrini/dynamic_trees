/*
 * Structures arborescentes dynamiques
 * Copyright (C) 2024-2026 Antoine Genitrini (développeur principal)
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/* Structures de Pólya sans décoration (Schroeder) : voir polya.js. */
(function () {
  'use strict';

  const DT = window.DT;

  class PolyaSchroeder extends DT.PolyaBase {}
  PolyaSchroeder.table = 'schroeder';
  PolyaSchroeder.tau0 = 0.31076292;
  PolyaSchroeder.range = [1, 1000];
  PolyaSchroeder.decorations = false;
  PolyaSchroeder.labelled = 'leaves';
  PolyaSchroeder.makeGenerator = DT.polyaGen.schroeder;
  PolyaSchroeder.legend = null;
  PolyaSchroeder.sizeOf = (nodes) => nodes.filter((x) => !x.kids.length).length;
  PolyaSchroeder.checkClass = DT.polyaCheck.hier;

  DT.register('polya_schroeder', PolyaSchroeder);
})();
