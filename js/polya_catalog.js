/*
 * Structures arborescentes dynamiques
 * Copyright (C) 2024-2026 Antoine Genitrini (développeur principal)
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/*
 * Catalogue du site « Structures de Pólya » (polya.html) : ces entrées
 * s'ajoutent au catalogue commun, sans apparaître sur l'accueil du cours.
 */
(function () {
  'use strict';

  const DT = window.DT;
  const gen = (...ns) => ns.map((n) => ['generate', [n]]);

  DT.i18n.add({
    fr: {
      'chap.polya': 'Structures de Pólya',
      'polya.site': 'Structures de Pólya',
      'polya.site.sub': 'Génération aléatoire et squelette de Cayley',
      'nav.polya': 'Structures de Pólya',
      'nav.course': 'Cours AlgAv',
    },
    en: {
      'chap.polya': 'Pólya structures',
      'polya.site': 'Pólya structures',
      'polya.site.sub': 'Random sampling and Cayley skeleton',
      'nav.polya': 'Pólya structures',
      'nav.course': 'AlgAv course',
    },
  });

  const entries = [
    {
      id: 'polya',
      chapter: 'polya',
      site: 'polya',
      deps: ['polya_tables'],
      name: { fr: 'Arbres de Pólya', en: 'Pólya trees' },
      short: {
        fr: 'Arbres enracinés non étiquetés et non plans : les enfants d’un nœud forment un multiensemble.',
        en: 'Rooted unlabelled non-plane trees: the children of a node form a multiset.',
      },
      goal: {
        fr: 'Tirer un arbre uniforme de taille n et voir la décomposition T = C(ζ) : un squelette de Cayley, puis des décorations.',
        en: 'Draw a uniform tree of size n and see the decomposition T = C(ζ): a Cayley skeleton, then decorations.',
      },
      desc: {
        fr: 'Un <b>arbre de Pólya</b> est une racine et un multiensemble d’arbres de Pólya. Ses nombres (1, 1, 2, 4, 9, 20, 48, …) vérifient T(z) = z exp(Σ T(z<sup>i</sup>)/i). En isolant le terme i = 1, on obtient T(z) = C(ζ(z)), où C est la fonction des arbres de Cayley et ζ une fonction analytique au-delà de la singularité.',
        en: 'A <b>Pólya tree</b> is a root and a multiset of Pólya trees. Their numbers (1, 1, 2, 4, 9, 20, 48, …) satisfy T(z) = z exp(Σ T(z<sup>i</sup>)/i). Isolating the term i = 1, we get T(z) = C(ζ(z)), where C is the Cayley tree function and ζ is analytic beyond the singularity.',
      },
      details: {
        fr: 'La méthode récursive choisit, pour la forêt sous chaque nœud, un couple (d, j) : on greffe j copies d’un arbre de taille d. Les <b>pas de Cayley</b> (j = 1, en bleu) construisent le <b>squelette</b>, qui se comporte comme un arbre de Galton–Watson de loi de Poisson ; les <b>pas de décoration</b> (j ≥ 2, en orange) ajoutent des groupes de copies identiques. En examinant d’abord les pas de Cayley, par taille décroissante, le nombre moyen de choix examinés est ½ n ln n. Les tables w<sub>k</sub> = ρ<sup>k</sup> T<sub>k</sub> sont précalculées jusqu’à 1000.',
        en: 'For the forest below each node, the recursive method chooses a pair (d, j): graft j copies of a tree of size d. The <b>Cayley steps</b> (j = 1, in blue) build the <b>skeleton</b>, which behaves like a Poisson Galton–Watson tree; the <b>decoration steps</b> (j ≥ 2, in orange) add groups of identical copies. Scanning the Cayley steps first, by decreasing size, the expected number of examined choices is ½ n ln n. The tables w<sub>k</sub> = ρ<sup>k</sup> T<sub>k</sub> are precomputed up to 1000.',
      },
      costs: [
        [{ fr: 'Génération (choix examinés)', en: 'Sampling (examined choices)' }, '~ ½ n ln n'],
        [{ fr: 'Précalcul (tables)', en: 'Precomputation (tables)' }, { fr: 'aucun (stocké)', en: 'none (stored)' }],
      ],
      examples: [
        { id: 'n10', name: { fr: 'Petit arbre (n = 10)', en: 'Small tree (n = 10)' }, ops: gen(10) },
        { id: 'n60', name: { fr: 'Arbre moyen (n = 60)', en: 'Medium tree (n = 60)' }, ops: gen(60) },
        { id: 'n300', name: { fr: 'Grand arbre (n = 300)', en: 'Large tree (n = 300)' }, ops: gen(300) },
        { id: 'n1000', name: { fr: 'Très grand arbre (n = 1000)', en: 'Very large tree (n = 1000)' }, ops: gen(1000) },
      ],
    },
    {
      id: 'polya_hier',
      chapter: 'polya',
      site: 'polya',
      deps: ['polya_tables', 'polya'],
      name: { fr: 'Hiérarchies', en: 'Hierarchies' },
      short: {
        fr: 'Arbres non plans sans nœud unaire ; la taille est le nombre de feuilles (réseaux série-parallèle).',
        en: 'Non-plane trees without unary nodes; the size is the number of leaves (series-parallel networks).',
      },
      goal: {
        fr: 'Tirer une hiérarchie uniforme à n feuilles, construite par des multiensembles d’au moins deux éléments.',
        en: 'Draw a uniform hierarchy with n leaves, built from multisets with at least two elements.',
      },
      desc: {
        fr: 'Une <b>hiérarchie</b> est une feuille ou une racine avec un multiensemble d’au moins deux hiérarchies. Les multiensembles F de hiérarchies vérifient F = 2T + 1 − z, et T̃ = F/2 est une perturbation de Cayley.',
        en: 'A <b>hierarchy</b> is a leaf or a root with a multiset of at least two hierarchies. The multisets F of hierarchies satisfy F = 2T + 1 − z, and T̃ = F/2 is a Cayley perturbation.',
      },
      details: {
        fr: 'Une hiérarchie à n ≥ 2 feuilles est tirée comme un multiensemble de taille n, en interdisant le premier pas (n, 1), qui donnerait un seul élément. Les pas de Cayley (bleu) et de décoration (orange) sont ceux de la méthode générique.',
        en: 'A hierarchy with n ≥ 2 leaves is drawn as a multiset of size n, forbidding the first step (n, 1), which would give a single element. Cayley steps (blue) and decoration steps (orange) are those of the generic method.',
      },
      costs: [[{ fr: 'Génération (choix examinés)', en: 'Sampling (examined choices)' }, '~ ½ n ln n']],
      examples: [
        { id: 'n10', name: { fr: 'Petite hiérarchie (n = 10)', en: 'Small hierarchy (n = 10)' }, ops: gen(10) },
        { id: 'n100', name: { fr: 'Hiérarchie à 100 feuilles', en: 'Hierarchy with 100 leaves' }, ops: gen(100) },
        { id: 'n500', name: { fr: 'Hiérarchie à 500 feuilles', en: 'Hierarchy with 500 leaves' }, ops: gen(500) },
      ],
    },
    {
      id: 'polya_identity',
      chapter: 'polya',
      site: 'polya',
      deps: ['polya_tables', 'polya'],
      name: { fr: 'Arbres d’identité', en: 'Rooted identity trees' },
      short: {
        fr: 'Arbres de Pólya sans symétrie : les enfants de chaque nœud sont deux à deux non isomorphes.',
        en: 'Pólya trees without symmetry: the children of every node are pairwise non-isomorphic.',
      },
      goal: {
        fr: 'Tirer un arbre d’identité uniforme : seulement des pas de Cayley, avec une contrainte d’évitement résolue par rejet.',
        en: 'Draw a uniform identity tree: only Cayley steps, with an avoidance constraint solved by rejection.',
      },
      desc: {
        fr: 'Un <b>arbre d’identité</b> est une racine et un ensemble (sans répétition) d’arbres d’identité ; T(z) = z exp(Σ (−1)<sup>i−1</sup> T(z<sup>i</sup>)/i). Ici ζ a des coefficients négatifs : il n’y a pas de décoration, mais des contraintes.',
        en: 'A <b>rooted identity tree</b> is a root and a set (without repetition) of identity trees; T(z) = z exp(Σ (−1)<sup>i−1</sup> T(z<sup>i</sup>)/i). Here ζ has negative coefficients: there is no decoration, but constraints.',
      },
      details: {
        fr: 'La récurrence (n − 1) T<sub>n</sub> = Σ i T<sub>i</sub> V<sub>i</sub>(n − i), où V<sub>i</sub>(m) compte les arbres dont la racine n’a pas d’enfant isomorphe à un arbre donné de taille i, donne la méthode : on tire i, un arbre σ de taille i, puis un arbre τ de taille n − i jusqu’à ce que sa racine n’ait pas σ pour enfant, et on greffe σ.',
        en: 'The recurrence (n − 1) T<sub>n</sub> = Σ i T<sub>i</sub> V<sub>i</sub>(n − i), where V<sub>i</sub>(m) counts the trees whose root has no child isomorphic to a given tree of size i, gives the method: draw i, a tree σ of size i, then a tree τ of size n − i until its root has no child σ, and graft σ.',
      },
      costs: [[{ fr: 'Génération (choix examinés)', en: 'Sampling (examined choices)' }, '~ ½ n ln n']],
      examples: [
        { id: 'n10', name: { fr: 'Petit arbre (n = 10)', en: 'Small tree (n = 10)' }, ops: gen(10) },
        { id: 'n100', name: { fr: 'Arbre de taille 100', en: 'Tree of size 100' }, ops: gen(100) },
        { id: 'n500', name: { fr: 'Arbre de taille 500', en: 'Tree of size 500' }, ops: gen(500) },
      ],
    },
    {
      id: 'polya_cayley',
      chapter: 'polya',
      site: 'polya',
      deps: ['polya_tables', 'polya'],
      name: { fr: 'Arbres de Cayley', en: 'Cayley trees' },
      short: {
        fr: 'Arbres enracinés étiquetés : n<sup>n−1</sup> arbres de taille n. La fonction C(z) = z e<sup>C(z)</sup> qui porte toutes les singularités.',
        en: 'Rooted labelled trees: n<sup>n−1</sup> trees of size n. The function C(z) = z e<sup>C(z)</sup> that carries all the singularities.',
      },
      goal: {
        fr: 'Le modèle de référence : ici ζ(z) = z, et tous les choix sont des pas de Cayley.',
        en: 'The reference model: here ζ(z) = z, and all the choices are Cayley steps.',
      },
      desc: {
        fr: 'Un <b>arbre de Cayley</b> est une racine étiquetée et un ensemble d’arbres de Cayley. C’est le cas ζ(z) = z de la décomposition T = C(ζ).',
        en: 'A <b>Cayley tree</b> is a labelled root and a set of Cayley trees. It is the case ζ(z) = z of the decomposition T = C(ζ).',
      },
      details: {
        fr: 'La méthode récursive étiquetée choisit la taille d de la composante qui contient la plus grande étiquette, avec probabilité d c<sub>d</sub> f<sub>m−d</sub> / (m f<sub>m</sub>) (coefficients des séries exponentielles) ; les étiquettes sont distribuées à la fin par une permutation uniforme. Elles sont affichées jusqu’à la taille 40.',
        en: 'The labelled recursive method chooses the size d of the component containing the largest label with probability d c<sub>d</sub> f<sub>m−d</sub> / (m f<sub>m</sub>) (coefficients of exponential generating functions); the labels are distributed at the end by a uniform permutation. They are shown up to size 40.',
      },
      costs: [[{ fr: 'Génération (choix examinés)', en: 'Sampling (examined choices)' }, '~ ½ n ln n']],
      examples: [
        { id: 'n12', name: { fr: 'Petit arbre étiqueté (n = 12)', en: 'Small labelled tree (n = 12)' }, ops: gen(12) },
        { id: 'n100', name: { fr: 'Arbre de taille 100', en: 'Tree of size 100' }, ops: gen(100) },
        { id: 'n1000', name: { fr: 'Arbre de taille 1000', en: 'Tree of size 1000' }, ops: gen(1000) },
      ],
    },
    {
      id: 'polya_schroeder',
      chapter: 'polya',
      site: 'polya',
      deps: ['polya_tables', 'polya'],
      name: { fr: 'Partitions totales', en: 'Total partitions' },
      short: {
        fr: 'Hiérarchies étiquetées (quatrième problème de Schröder) : les feuilles portent les étiquettes 1 à n.',
        en: 'Labelled hierarchies (Schröder’s fourth problem): the leaves carry the labels 1 to n.',
      },
      goal: {
        fr: 'Tirer une partition totale uniforme : seulement des pas de Cayley, ζ explicite.',
        en: 'Draw a uniform total partition: only Cayley steps, explicit ζ.',
      },
      desc: {
        fr: 'Une <b>partition totale</b> est une feuille étiquetée ou un ensemble d’au moins deux partitions totales. Les forêts F vérifient F = 2T + 1 − z, et ζ(z) = ½ e<sup>−(1−z)/2</sup> est explicite : le développement asymptotique complet est gouverné par les coefficients de la formule de Stirling.',
        en: 'A <b>total partition</b> is a labelled leaf or a set of at least two total partitions. The forests F satisfy F = 2T + 1 − z, and ζ(z) = ½ e<sup>−(1−z)/2</sup> is explicit: the full asymptotic expansion is ruled by the coefficients of Stirling’s formula.',
      },
      details: {
        fr: 'Comme pour les hiérarchies, une partition à n ≥ 2 feuilles est tirée comme une forêt de taille n en interdisant le premier pas (n, 1) ; les étiquettes des feuilles sont distribuées à la fin.',
        en: 'As for hierarchies, a partition with n ≥ 2 leaves is drawn as a forest of size n, forbidding the first step (n, 1); the labels of the leaves are distributed at the end.',
      },
      costs: [[{ fr: 'Génération (choix examinés)', en: 'Sampling (examined choices)' }, '~ ½ n ln n']],
      examples: [
        { id: 'n10', name: { fr: 'Petite partition (n = 10)', en: 'Small partition (n = 10)' }, ops: gen(10) },
        { id: 'n100', name: { fr: 'Partition de 100 éléments', en: 'Partition of 100 elements' }, ops: gen(100) },
        { id: 'n500', name: { fr: 'Partition de 500 éléments', en: 'Partition of 500 elements' }, ops: gen(500) },
      ],
    },
  ];

  for (const e of entries) DT.catalog.entries.push(e);
  DT.polyaCatalog = { entries };
})();
