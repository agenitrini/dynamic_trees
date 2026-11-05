/*
 * Structures arborescentes dynamiques
 * Copyright (C) 2024-2026 Antoine Genitrini (développeur principal)
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/* Arbres binaires non plans (Wedderburn–Etherington, taille = nombre de feuilles) : voir polya.js. */
(function () {
  'use strict';

  const DT = window.DT;
  const PolyaBase = DT.PolyaBase;

  class BinaryTrees extends PolyaBase {}
  BinaryTrees.table = 'binary';
  BinaryTrees.tau0 = 0.565016858199486;
  BinaryTrees.range = [1, 1000];
  BinaryTrees.makeGenerator = DT.polyaGen.binary;
  BinaryTrees.sizeOf = (nodes) => nodes.filter((x) => !x.kids.length).length;
  BinaryTrees.checkClass = DT.polyaCheck.binary;

  BinaryTrees.code = {
    generate: {
      title: { fr: "Arbres binaires non plans : méthode récursive, ordre « Cayley d’abord »", en: "Non-plane binary trees: recursive method, Cayley-first order" },
      source: 'polya',
      lines: [
        "import random",
        "# w[k] = rho**k * T_k (tables précalculées) ; un arbre = feuille [] ou liste de deux sous-arbres",
        "# n T_n = sum_{d=1}^{n-1} d T_d T_{n-d} + [n pair] (n/2) T_{n/2}",
        "",
        "def arbre_binaire(n, w, rho):",
        "    \"\"\" arbre binaire non plan uniforme à n feuilles \"\"\"",
        "    if n == 1: return []",
        "    u = random.random()",
        "    for d in range(n - 1, 0, -1):          # pas de Cayley, d décroissant",
        "        u -= d * w[d] * w[n - d] / (n * w[n])",
        "        if u < 0:",
        "            return [arbre_binaire(d, w, rho), arbre_binaire(n - d, w, rho)]",
        "    # n pair : pas de décoration, de probabilité w[n/2] rho**(n/2) / (2 w[n])",
        "    s = arbre_binaire(n // 2, w, rho)",
        "    return [s, s]                            # deux copies identiques"
      ],
    },
  };

  DT.register('polya_binary', BinaryTrees);
})();
