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

  PolyaIdentity.code = {
    generate: {
      title: { fr: "Arbres d’identité : pas de Cayley et contrainte d’évitement", en: "Identity trees: Cayley steps and avoidance constraint" },
      source: 'polya',
      lines: [
        "import random",
        "# w[k] = rho**k * T_k ; un arbre = liste de ses sous-arbres (deux à deux distincts)",
        "",
        "def V(i, m, w, rho):",
        "    \"\"\" rho**m V_i(m) : arbres de taille m dont la racine évite un arbre donné de taille i \"\"\"",
        "    return sum((-1)**j * w[m - j*i] * rho**(j*i) for j in range((m - 1) // i + 1))",
        "",
        "def canon(t):",
        "    return '(' + ''.join(sorted(canon(c) for c in t)) + ')'",
        "",
        "def arbre_identite(n, w, rho):",
        "    \"\"\" arbre d'identité uniforme de taille n \"\"\"",
        "    if n == 1: return []",
        "    u = random.random()",
        "    for i in range(n - 1, 0, -1):       # seulement des pas de Cayley",
        "        u -= i * w[i] * V(i, n - i, w, rho) / ((n - 1) * w[n])",
        "        if u < 0: break",
        "    s = arbre_identite(i, w, rho)",
        "    while True:                          # rejet : la racine de t doit éviter s",
        "        t = arbre_identite(n - i, w, rho)",
        "        if canon(s) not in [canon(c) for c in t]:",
        "            return t + [s]"
      ],
    },
  };

  DT.register('polya_identity', PolyaIdentity);
})();
