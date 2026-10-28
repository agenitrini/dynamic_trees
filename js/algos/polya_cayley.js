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

  PolyaCayley.code = {
    generate: {
      title: { fr: "Arbres de Cayley : méthode récursive étiquetée", en: "Cayley trees: labelled recursive method" },
      source: 'polya',
      lines: [
        "import random",
        "# w[k] = c_k / e**k avec c_k = k**(k-1)/k!, wF[m] = f_m / e**m avec f_m = (m+1)**(m-1)/m!",
        "",
        "def arbre_cayley(n, w, wF):",
        "    \"\"\" forme d'un arbre de Cayley uniforme de taille n \"\"\"",
        "    return foret(n - 1, w, wF)",
        "",
        "def foret(m, w, wF):",
        "    F = []",
        "    while m > 0:",
        "        u = random.random()",
        "        for d in range(m, 0, -1):     # taille de la composante de la plus grande étiquette",
        "            u -= d * w[d] * wF[m - d] / (m * wF[m])",
        "            if u < 0: break",
        "        F.append(arbre_cayley(d, w, wF))",
        "        m -= d",
        "    return F",
        "",
        "def etiqueter(t, etiquettes):",
        "    \"\"\" (étiquette, enfants) ; etiquettes : permutation uniforme de 1..n \"\"\"",
        "    return (etiquettes.pop(), [etiqueter(c, etiquettes) for c in t])",
        "",
        "# arbre = etiqueter(arbre_cayley(n, w, wF), random.sample(range(1, n + 1), n))"
      ],
    },
  };

  DT.register('polya_cayley', PolyaCayley);
})();
