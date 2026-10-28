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

  PolyaSchroeder.code = {
    generate: {
      title: { fr: "Partitions totales : méthode récursive étiquetée", en: "Total partitions: labelled recursive method" },
      source: 'polya',
      lines: [
        "import random",
        "# w[k] = rho**k * T_k / k!, wF[k] = rho**k * F_k / k! avec F = 2T + 1 - z, rho = 2 ln 2 - 1",
        "",
        "def partition(n, w, wF):",
        "    \"\"\" forme d'une partition totale uniforme à n feuilles \"\"\"",
        "    if n == 1: return []",
        "    return foret(n, w, wF, interdire=True)",
        "",
        "def foret(m, w, wF, interdire=False):",
        "    F = []",
        "    while m > 0:",
        "        u = random.random() * (1 - w[m] / wF[m] if interdire else 1)",
        "        for d in range(m, 0, -1):",
        "            if interdire and d == m: continue",
        "            u -= d * w[d] * wF[m - d] / (m * wF[m])",
        "            if u < 0: break",
        "        interdire = False",
        "        F.append(partition(d, w, wF))",
        "        m -= d",
        "    return F",
        "",
        "# les étiquettes 1..n des feuilles sont ensuite distribuées par une permutation uniforme"
      ],
    },
  };

  DT.register('polya_schroeder', PolyaSchroeder);
})();
