/*
 * Structures arborescentes dynamiques
 * Copyright (C) 2024-2026 Antoine Genitrini (développeur principal)
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/* Structures de Pólya sans décoration (Identity) : voir polya.js. */
(function () {
  'use strict';

  const DT = window.DT;

  class PolyaIdentity extends DT.PolyaBase {}
  PolyaIdentity.table = 'identity';
  PolyaIdentity.tau0 = 0.6425790797442695;
  PolyaIdentity.range = [1, 1000];
  PolyaIdentity.decorations = false;
  PolyaIdentity.labelled = false;
  PolyaIdentity.makeGenerator = DT.polyaGen.identity;
  PolyaIdentity.legend = null;
  PolyaIdentity.sizeOf = (nodes) => nodes.length;
  PolyaIdentity.checkClass = DT.polyaCheck.identity;

  DT.register('polya_identity', PolyaIdentity);
})();
