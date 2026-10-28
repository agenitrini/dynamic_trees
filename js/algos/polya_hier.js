/*
 * Structures arborescentes dynamiques
 * Copyright (C) 2024-2026 Antoine Genitrini (développeur principal)
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/* Hiérarchies (arbres sans nœud unaire, taille = nombre de feuilles) : voir polya.js. */
(function () {
  'use strict';

  const DT = window.DT;
  const PolyaBase = DT.PolyaBase;

  class Hierarchies extends PolyaBase {}
  Hierarchies.table = 'hier';
  Hierarchies.tau0 = 0.3658015862381119;
  Hierarchies.range = [1, 1000];
  Hierarchies.makeGenerator = DT.polyaGen.hier;
  Hierarchies.sizeOf = (nodes) => nodes.filter((x) => !x.kids.length).length;
  Hierarchies.checkClass = (nodes) => {
    for (const x of nodes) if (x.kids.length === 1) throw new Error('nœud unaire dans une hiérarchie');
  };

  DT.register('polya_hier', Hierarchies);
})();
