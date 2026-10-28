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

  Hierarchies.code = {
    generate: {
      title: { fr: "Hiérarchies : méthode récursive, ordre « Cayley d’abord »", en: "Hierarchies: recursive method, Cayley-first order" },
      source: 'polya',
      lines: [
        "import random",
        "# w[k] = rho**k * T_k, wF[k] = rho**k * F_k avec F = 2T + 1 - z (multiensembles)",
        "# une hiérarchie = feuille [] ou liste d'au moins deux hiérarchies",
        "",
        "def pas_cayley_dabord(m):",
        "    \"\"\" les pas (d, j) : d'abord j = 1 par d décroissant, puis j >= 2 \"\"\"",
        "    for d in range(m, 0, -1):",
        "        yield d, 1",
        "    for d in range(m // 2, 0, -1):",
        "        for j in range(2, m // d + 1):",
        "            yield d, j",
        "",
        "def hierarchie(n, w, wF, rho):",
        "    \"\"\" hiérarchie uniforme à n feuilles \"\"\"",
        "    if n == 1: return []",
        "    return foret(n, w, wF, rho, interdire=True)",
        "",
        "def foret(m, w, wF, rho, interdire=False):",
        "    \"\"\" multiensemble uniforme ; interdire : au moins deux éléments \"\"\"",
        "    F = []",
        "    while m > 0:",
        "        u = random.random() * (1 - w[m] / wF[m] if interdire else 1)",
        "        for d, j in pas_cayley_dabord(m):",
        "            if interdire and (d, j) == (m, 1): continue",
        "            u -= d * w[d] * wF[m - j*d] * rho**((j - 1)*d) / (m * wF[m])",
        "            if u < 0: break",
        "        interdire = False",
        "        s = hierarchie(d, w, wF, rho)",
        "        F.extend([s] * j)",
        "        m -= j * d",
        "    return F"
      ],
    },
  };

  DT.register('polya_hier', Hierarchies);
})();
