/*
 * Structures arborescentes dynamiques
 * Copyright (C) 2024-2026 Antoine Genitrini (développeur principal)
 * Contributeurs (projet PSTL 2023-2024, Sorbonne Université) :
 *   Tracy Hong, Julien Fang, Jean-Marc Zhuang, Laura Rattanavan
 *
 * Ce programme est un logiciel libre : vous pouvez le redistribuer et/ou le
 * modifier selon les termes de la GNU General Public License telle que publiée
 * par la Free Software Foundation, version 3 de la licence ou (à votre choix)
 * toute version ultérieure. Ce programme est distribué dans l'espoir qu'il sera
 * utile, mais SANS AUCUNE GARANTIE ; voir le fichier LICENSE pour plus de détails.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/*
 * Catalogue des structures : noms, descriptions (bulles d'information et
 * fiches), coûts et bibliothèque d'exemples. Partagé par l'accueil, la page
 * d'exemples et la page de visualisation.
 */
(function () {
  'use strict';

  const DT = (window.DT = window.DT || {});

  const ins = (...xs) => xs.map((x) => ['insert', [x]]);
  const letters = (s) => s.split('').map((c) => ['insert', [c]]);
  const words = (s) => s.split(/\s+/).map((w) => ['insert', [w]]);

  const chapters = [
    {
      n: 1,
      sub: {
        fr: 'Codage statistique et par dictionnaire, tas.',
        en: 'Statistical and dictionary coding, heaps.',
      },
    },
    {
      n: 2,
      sub: { fr: 'Tournois et files binomiales, union efficace.', en: 'Binomial trees and queues, efficient union.' },
    },
    {
      n: 3,
      sub: {
        fr: 'Arbres binaires, équilibrés, auto-adaptatifs et tries.',
        en: 'Binary, balanced and self-adjusting trees, tries.',
      },
    },
    {
      n: 4,
      sub: { fr: 'Tables, filtres de Bloom, hachage externe.', en: 'Tables, Bloom filters, external hashing.' },
    },
  ];

  const entries = [
    /* ===================== Chapitre 1 : compression ===================== */
    {
      id: 'heap',
      chapter: 1,
      name: { fr: 'Tas min', en: 'Min-heap' },
      short: {
        fr: 'Arbre binaire parfait (rempli niveau par niveau) étiqueté de façon croissante, stocké dans un tableau.',
        en: 'Complete binary tree (filled level by level) labelled in increasing order, stored in an array.',
      },
      goal: {
        fr: 'File de priorité : ajout et suppression du minimum en O(log n), construction en O(n). Utilisé pour construire l’arbre de Huffman.',
        en: 'Priority queue: insert and extract-min in O(log n), build in O(n). Used to build the Huffman tree.',
      },
      desc: {
        fr: 'Un <b>tas min</b> est un arbre binaire étiqueté de façon croissante, dont toutes les feuilles sont situées au plus sur deux niveaux, celles du niveau le plus bas étant le plus à gauche possible. Le nœud d’indice <i>i</i> du tableau a pour enfants 2<i>i</i>+1 et 2<i>i</i>+2.',
        en: 'A <b>min-heap</b> is a binary tree labelled in increasing order whose leaves lie on at most two levels, those of the lowest level being as far left as possible. The node at index <i>i</i> has children 2<i>i</i>+1 and 2<i>i</i>+2.',
      },
      details: {
        fr: '<b>Ajout</b> : placer la clé en dernière position puis la faire remonter. <b>Suppression du minimum</b> : remplacer la racine par le dernier élément puis le faire descendre. <b>Construction</b> : descendre successivement les nœuds internes, du dernier à la racine.',
        en: '<b>Insert</b>: put the key in the last position and sift it up. <b>Extract-min</b>: replace the root by the last element and sift it down. <b>Build</b>: sift down every internal node, from the last one up to the root.',
      },
      costs: [
        [{ fr: 'Ajout', en: 'Insert' }, 'O(log n)'],
        [{ fr: 'Suppression du min', en: 'Extract-min' }, 'O(log n)'],
        [{ fr: 'Construction', en: 'Build' }, 'O(n)'],
        [{ fr: 'Union', en: 'Union' }, 'O(n + m)'],
      ],
      examples: [
        { id: 'inserts', name: { fr: 'Ajouts successifs', en: 'Successive insertions' }, ops: ins(12, 7, 9, 3, 15, 5, 1, 8, 4) },
        { id: 'build', name: { fr: 'Construction en O(n)', en: 'Linear-time build' }, ops: [['build', [[15, 9, 12, 3, 7, 1, 8, 5, 4, 10, 2]]]] },
        {
          id: 'sort',
          name: { fr: 'Tri par tas (extractions)', en: 'Heapsort (extractions)' },
          ops: [['build', [[6, 2, 9, 4, 7, 1, 5]]], ['extractMin', []], ['extractMin', []], ['extractMin', []], ['extractMin', []]],
        },
      ],
    },
    {
      id: 'huffman',
      chapter: 1,
      name: { fr: 'Huffman statique', en: 'Static Huffman' },
      short: {
        fr: 'Construit un code préfixe optimal en unissant répétitivement les deux arbres de poids minimal (file de priorité).',
        en: 'Builds an optimal prefix code by repeatedly merging the two lightest trees (priority queue).',
      },
      goal: {
        fr: 'Compression statistique : symbole fréquent → code court. Le code obtenu est minimal parmi les codes préfixes.',
        en: 'Statistical compression: frequent symbol → short code. The resulting code is minimal among prefix codes.',
      },
      desc: {
        fr: 'On crée une feuille par lettre, pondérée par sa fréquence. Tant qu’il reste plusieurs arbres, on extrait du tas les deux arbres <i>G</i> et <i>D</i> de poids minimal et on les unit sous un nouveau nœud de poids pds(<i>G</i>) + pds(<i>D</i>). Le code d’une lettre est le chemin de la racine à sa feuille (0 à gauche, 1 à droite).',
        en: 'Create one leaf per letter, weighted by its frequency. While several trees remain, extract from the heap the two lightest trees <i>G</i> and <i>D</i> and join them under a new node of weight w(<i>G</i>) + w(<i>D</i>). A letter’s code is the path from the root to its leaf (0 left, 1 right).',
      },
      details: {
        fr: 'La taille du texte compressé est la somme des fréquences × profondeurs des feuilles.',
        en: 'The compressed size is the sum over letters of frequency × leaf depth.',
      },
      costs: [
        [{ fr: 'Construction de l’arbre', en: 'Tree construction' }, 'O(n log n)'],
        [{ fr: 'Compression d’un texte de N lettres', en: 'Compress N letters' }, 'O(N + n log n)'],
      ],
      examples: [
        { id: 'saperlipopette', name: { fr: 'saperlipopette (cours)', en: 'saperlipopette (lecture)' }, ops: [['build', ['saperlipopette']]] },
        { id: 'abracadabra', name: { fr: 'abracadabra', en: 'abracadabra' }, ops: [['build', ['abracadabra']]] },
        { id: 'freq2233', name: { fr: 'Fréquences (2, 2, 3, 3)', en: 'Frequencies (2, 2, 3, 3)' }, ops: [['build', ['aabbcccddd']]] },
      ],
    },
    {
      id: 'ahuffman',
      chapter: 1,
      name: { fr: 'Huffman adaptatif', en: 'Adaptive Huffman' },
      short: {
        fr: 'Arbre de Huffman mis à jour à chaque lettre lue ; la numérotation GDBH donne les poids dans l’ordre croissant.',
        en: 'Huffman tree updated after every letter; the GDBH numbering lists weights in increasing order.',
      },
      goal: {
        fr: 'Compresser en une seule passe, sans transmettre l’arbre : compresseur et décompresseur modifient l’arbre de la même façon.',
        en: 'Compress in a single pass without sending the tree: compressor and decompressor update the tree in the same way.',
      },
      desc: {
        fr: 'Un <b>arbre de Huffman adaptatif</b> est un arbre de Huffman dont le parcours hiérarchique GDBH (gauche-droite, bas-haut) donne les poids en ordre croissant. La feuille spéciale <b>#</b> (poids 0) marque l’endroit où insérer une nouvelle lettre.',
        en: 'An <b>adaptive Huffman tree</b> is a Huffman tree whose GDBH (left-to-right, bottom-up) order lists weights in increasing order. The special leaf <b>#</b> (weight 0) marks where a new letter is inserted.',
      },
      details: {
        fr: '<b>Modification</b> : une nouvelle lettre remplace # par un nœud (#, lettre). <b>Traitement</b> : tant que le chemin n’est pas incrémentable, échanger le premier nœud non incrémentable avec la fin de son bloc, puis incrémenter. On émet le code de la lettre, ou code(#) suivi du code fixe (5 bits ici, a = 00000) pour une première occurrence.',
        en: '<b>Update</b>: a new letter replaces # by a node (#, letter). <b>Processing</b>: while the path is not incrementable, swap the first non-incrementable node with the end of its block, then increment. Output the letter’s code, or code(#) followed by the fixed code (5 bits here, a = 00000) for a first occurrence.',
      },
      costs: [
        [{ fr: 'Traitement d’une lettre', en: 'Process one letter' }, 'O(n)'],
        [{ fr: 'Compression de N lettres', en: 'Compress N letters' }, 'O(nN)'],
      ],
      examples: [
        { id: 'carambarbcm', name: { fr: 'carambarbcm (cours)', en: 'carambarbcm (lecture)' }, ops: [['encode', ['carambarbcm']]] },
        { id: 'abracadabra', name: { fr: 'abracadabra', en: 'abracadabra' }, ops: [['encode', ['abracadabra']]] },
        { id: 'mississippi', name: { fr: 'mississippi', en: 'mississippi' }, ops: [['encode', ['mississippi']]] },
        { id: 'decode', name: { fr: 'Décompression du code de carambarbcm', en: 'Decompress the code of carambarbcm' }, ops: [['decode', ['00010000000001000111100011001100000010111100110011001']]] },
      ],
    },
    {
      id: 'lzw',
      chapter: 1,
      name: { fr: 'LZW', en: 'LZW' },
      short: {
        fr: 'Compression par dictionnaire adaptatif : on émet l’indice du plus long préfixe connu, puis on l’étend d’une lettre.',
        en: 'Adaptive dictionary compression: output the index of the longest known prefix, then extend it by one letter.',
      },
      goal: {
        fr: 'Compresser sans transmettre de dictionnaire ; le plus long préfixe est trouvé grâce à un trie (ensemble préfixiel).',
        en: 'Compress without sending a dictionary; the longest prefix is found with a trie (prefix-closed set).',
      },
      desc: {
        fr: 'Au départ la table contient les lettres de l’alphabet. Le compresseur détermine le plus long préfixe <i>f</i> du texte présent dans la table, transmet son indice, ajoute <i>fx</i> (<i>x</i> : lettre suivante) et recommence à partir de <i>x</i>. Le dictionnaire est <b>préfixiel</b> : c’est un trie, chaque entrée étant (parent, lettre).',
        en: 'Initially the table holds the alphabet. The compressor finds the longest prefix <i>f</i> of the text in the table, outputs its index, adds <i>fx</i> (<i>x</i>: next letter) and restarts at <i>x</i>. The dictionary is <b>prefix-closed</b>: it is a trie, each entry being (parent, letter).',
      },
      details: {
        fr: 'Le décompresseur reconstruit la même table ; cas du chevauchement : si l’indice reçu n’existe pas encore, l’entrée est w<sub>i−1</sub> suivi de sa propre première lettre.',
        en: 'The decompressor rebuilds the same table; overlap case: if the received index does not exist yet, the entry is w<sub>i−1</sub> followed by its own first letter.',
      },
      costs: [[{ fr: 'Compression de N lettres', en: 'Compress N letters' }, 'O(N)']],
      examples: [
        { id: 'course', name: { fr: 'ababcbababaaaaaa (cours)', en: 'ababcbababaaaaaa (lecture)' }, settings: { alpha: 'abc' }, ops: [['encode', ['ababcbababaaaaaa']]] },
        { id: 'decode', name: { fr: 'Décompression de 1 2 4 3 5 8 1 10 11 (cours)', en: 'Decode 1 2 4 3 5 8 1 10 11 (lecture)' }, settings: { alpha: 'abc' }, ops: [['decode', ['1 2 4 3 5 8 1 10 11']]] },
        { id: 'tobe', name: { fr: 'tobeornottobeortobeornot', en: 'tobeornottobeortobeornot' }, settings: { alpha: 'benort' }, ops: [['encode', ['tobeornottobeortobeornot']]] },
        { id: 'az', name: { fr: 'abracadabra, alphabet a–z', en: 'abracadabra, alphabet a–z' }, settings: { alpha: 'a-z' }, ops: [['encode', ['abracadabra']]] },
      ],
    },

    /* ================= Chapitre 2 : files de priorité ================= */
    {
      id: 'binomial',
      chapter: 2,
      name: { fr: 'File binomiale', en: 'Binomial queue' },
      short: {
        fr: 'Suite de tournois binomiaux de tailles strictement décroissantes, calquée sur l’écriture binaire de n.',
        en: 'Sequence of binomial tournaments of strictly decreasing sizes, mirroring the binary expansion of n.',
      },
      goal: {
        fr: 'File de priorité dont l’union se fait en O(log n), comme une addition binaire avec retenue.',
        en: 'Priority queue whose union takes O(log n), like a binary addition with carry.',
      },
      desc: {
        fr: 'Un <b>tournoi binomial</b> T<sub>k</sub> est un arbre binomial B<sub>k</sub> (2<sup>k</sup> nœuds) étiqueté de façon croissante. Une <b>file binomiale</b> FB<sub>n</sub> contient un tournoi T<sub>k</sub> pour chaque bit à 1 de n. L’union de deux tournois de même taille T<sub>k</sub> ∪ T′<sub>k</sub> → T<sub>k+1</sub> coûte une comparaison.',
        en: 'A <b>binomial tournament</b> T<sub>k</sub> is a binomial tree B<sub>k</sub> (2<sup>k</sup> nodes) labelled in increasing order. A <b>binomial queue</b> BQ<sub>n</sub> holds a tournament T<sub>k</sub> for each 1-bit of n. Merging two tournaments of the same size T<sub>k</sub> ∪ T′<sub>k</sub> → T<sub>k+1</sub> costs one comparison.',
      },
      details: {
        fr: '<b>Ajout</b> : union avec FB<sub>1</sub>. <b>Suppression du minimum</b> : décapiter le tournoi de racine minimale (T<sub>k</sub> → ⟨T<sub>k−1</sub>, …, T<sub>0</sub>⟩) puis faire l’union. <b>Diminuer une clé</b> : échanger avec le père tant que nécessaire.',
        en: '<b>Insert</b>: union with BQ<sub>1</sub>. <b>Extract-min</b>: behead the tournament with the minimal root (T<sub>k</sub> → ⟨T<sub>k−1</sub>, …, T<sub>0</sub>⟩) and take the union. <b>Decrease-key</b>: swap with the parent while needed.',
      },
      costs: [
        [{ fr: 'Union', en: 'Union' }, 'O(log(n + m))'],
        [{ fr: 'Ajout', en: 'Insert' }, { fr: 'O(log n), amorti O(1)', en: 'O(log n), amortized O(1)' }],
        [{ fr: 'Suppression du min', en: 'Extract-min' }, 'O(log n)'],
        [{ fr: 'Construction', en: 'Build' }, 'O(n)'],
        [{ fr: 'Diminuer une clé', en: 'Decrease-key' }, 'O(log n)'],
      ],
      examples: [
        { id: 'fb5fb7', name: { fr: 'FB₅ ∪ FB₇ (cours)', en: 'BQ₅ ∪ BQ₇ (lecture)' }, ops: [['build', [[8, 3, 12, 5, 10]]], ['union', [[7, 14, 2, 9, 11, 4, 6]]]] },
        { id: 'fb1fb7', name: { fr: 'FB₁ ∪ FB₇ : ajout dans FB₇', en: 'BQ₁ ∪ BQ₇: insert into BQ₇' }, ops: [['build', [[5, 9, 2, 7, 11, 4, 8]]], ['insert', [1]]] },
        { id: 'inserts', name: { fr: 'Construction par ajouts successifs', en: 'Build by successive insertions' }, ops: ins(10, 4, 7, 1, 12, 3, 9, 6, 2, 5, 8) },
        { id: 'extract', name: { fr: 'Suppressions du minimum', en: 'Extract-min sequence' }, ops: [['build', [[10, 4, 7, 1, 12, 3, 9, 6, 2, 5, 8]]], ['extractMin', []], ['extractMin', []]] },
      ],
    },

    /* =============== Chapitre 3 : arbres de recherche =============== */
    {
      id: 'abr',
      chapter: 3,
      name: { fr: 'Arbre binaire de recherche', en: 'Binary search tree' },
      short: {
        fr: 'En chaque nœud, la clé est plus grande que celles du sous-arbre gauche et plus petite que celles du sous-arbre droit.',
        en: 'At every node, the key is larger than those of the left subtree and smaller than those of the right subtree.',
      },
      goal: {
        fr: 'Recherche, ajout et suppression par parcours d’une branche ; le parcours infixe donne les clés triées. Hauteur O(log n) en moyenne, O(n) au pire.',
        en: 'Search, insert and delete along a single branch; in-order traversal yields the sorted keys. Height O(log n) on average, O(n) worst case.',
      },
      desc: {
        fr: 'Un <b>ABR</b> est un arbre binaire étiqueté tel qu’en chaque nœud, l’étiquette est plus grande que toutes celles du sous-arbre gauche et plus petite que toutes celles du sous-arbre droit. Le parcours infixe donne les étiquettes en ordre croissant.',
        en: 'A <b>BST</b> is a labelled binary tree such that at each node, the label is larger than all labels of the left subtree and smaller than all labels of the right subtree. In-order traversal lists the labels in increasing order.',
      },
      details: {
        fr: '<b>Suppression</b> d’un nœud à deux enfants : il est remplacé par le minimum de son sous-arbre droit (comme dans le code PSTL). L’ajout du cours est <i>persistant</i> : seule la branche parcourue est recopiée.',
        en: '<b>Deleting</b> a node with two children: it is replaced by the minimum of its right subtree (as in the PSTL code). The lecture’s insertion is <i>persistent</i>: only the visited branch is copied.',
      },
      costs: [
        [{ fr: 'Recherche, ajout, suppression', en: 'Search, insert, delete' }, { fr: 'O(h) : O(log n) en moyenne, O(n) au pire', en: 'O(h): O(log n) average, O(n) worst' }],
      ],
      examples: [
        { id: 'persist', name: { fr: 'Ajout de 5 dans {8, 4, 12, 2, 6} (cours)', en: 'Insert 5 into {8, 4, 12, 2, 6} (lecture)' }, ops: ins(8, 4, 12, 2, 6, 5) },
        { id: 'perfect', name: { fr: 'Ajout de 1 dans l’ABR parfait (cours)', en: 'Insert 1 into the perfect BST (lecture)' }, ops: ins(4, 3, 6, 2, 5, 1) },
        { id: 'degenerate', name: { fr: 'Ajouts croissants : arbre filiforme', en: 'Increasing insertions: degenerate tree' }, ops: ins(1, 2, 3, 4, 5, 6, 7) },
        { id: 'delete', name: { fr: 'Suppressions (0, 1 ou 2 enfants)', en: 'Deletions (0, 1 or 2 children)' }, ops: ins(50, 30, 70, 20, 40, 60, 80, 35, 45, 65).concat([['delete', [20]], ['delete', [70]], ['delete', [30]], ['delete', [50]]]) },
      ],
    },
    {
      id: 'avl',
      chapter: 3,
      name: { fr: 'Arbre AVL', en: 'AVL tree' },
      short: {
        fr: 'ABR où, en chaque nœud, les hauteurs des deux sous-arbres diffèrent au plus de 1 ; rééquilibré par rotations.',
        en: 'BST where, at every node, the two subtree heights differ by at most 1; rebalanced by rotations.',
      },
      goal: {
        fr: 'Garantir une hauteur ≤ 1,44 log₂ n : toutes les opérations sont en O(log n) au pire.',
        en: 'Guarantee height ≤ 1.44 log₂ n: every operation is O(log n) in the worst case.',
      },
      desc: {
        fr: 'Un <b>AVL</b> (Adelson-Velsky, Landis) est un ABR tel qu’en chaque nœud, la hauteur du sous-arbre gauche et celle du sous-arbre droit diffèrent au plus de 1. Après un ajout ou une suppression, <b>Equilibrage</b> applique une rotation simple (RD, RG) ou double (RGD, RDG) sur la remontée.',
        en: 'An <b>AVL tree</b> (Adelson-Velsky, Landis) is a BST such that at each node, the heights of the left and right subtrees differ by at most 1. After an insertion or deletion, <b>Rebalance</b> applies a single (RR, LR) or double (LRR, RLR) rotation on the way up.',
      },
      details: {
        fr: 'La pastille indique le déséquilibre h(G) − h(D), le petit nombre sous le nœud sa hauteur. Au pire, les arbres de Fibonacci.',
        en: 'The badge shows the balance h(L) − h(R), the small number below the node its height. Worst case: Fibonacci trees.',
      },
      costs: [
        [{ fr: 'Recherche, ajout, suppression', en: 'Search, insert, delete' }, 'O(log n)'],
        [{ fr: 'Rotations par ajout', en: 'Rotations per insert' }, '≤ 1 (simple ou double)'],
      ],
      examples: [
        { id: 'increasing', name: { fr: 'Ajouts croissants 1 à 7', en: 'Increasing insertions 1 to 7' }, ops: ins(1, 2, 3, 4, 5, 6, 7) },
        { id: 'double', name: { fr: 'Rotations doubles', en: 'Double rotations' }, ops: ins(30, 10, 20, 40, 50, 45, 5, 8) },
        { id: 'fib', name: { fr: 'Arbre de Fibonacci puis suppression', en: 'Fibonacci tree then deletion' }, ops: ins(8, 5, 11, 3, 7, 10, 12, 2, 4, 6, 9, 1).concat([['delete', [12]]]) },
      ],
    },
    {
      id: 'splay',
      chapter: 3,
      name: { fr: 'Arbre auto-adaptatif (Splay)', en: 'Splay tree' },
      short: {
        fr: 'ABR où le dernier élément visité est remonté à la racine par des rotations doubles (et au plus une simple).',
        en: 'BST where the last visited element is brought to the root by double rotations (and at most one single).',
      },
      goal: {
        fr: 'Coût amorti O(log n) par opération, et accès très rapides aux éléments utilisés récemment (caches, localité).',
        en: 'O(log n) amortized cost per operation, and very fast access to recently used elements (caches, locality).',
      },
      desc: {
        fr: 'Un <b>arbre auto-adaptatif</b> est un ABR tel qu’à chaque recherche, ajout ou suppression, le dernier élément visité est remonté à la racine par une suite de doubles rotations (RDD/RGG : on tourne d’abord au grand-parent ; RGD/RDG), sauf éventuellement la dernière (simple) si l’élément est à profondeur impaire.',
        en: 'A <b>splay tree</b> is a BST such that on every search, insertion or deletion, the last visited element is moved to the root by a sequence of double rotations (zig-zig: rotate at the grandparent first; zig-zag), except possibly the last one (single) if the element is at odd depth.',
      },
      details: {
        fr: 'Ajout : ajout aux feuilles puis remontée. Suppression : remontée de l’élément, puis le maximum du sous-arbre gauche devient la racine.',
        en: 'Insert: leaf insertion then splay. Delete: splay the element, then the maximum of the left subtree becomes the root.',
      },
      costs: [
        [{ fr: 'Opération (amorti)', en: 'Operation (amortized)' }, 'O(log n)'],
        [{ fr: 'Opération isolée (pire)', en: 'Single operation (worst)' }, 'O(n)'],
      ],
      examples: [
        { id: 'course', name: { fr: 'Ajouts 2, 3, 4, 5, 6 puis 1 (cours)', en: 'Insert 2, 3, 4, 5, 6 then 1 (lecture)' }, ops: ins(2, 3, 4, 5, 6, 1) },
        { id: 'search', name: { fr: 'Recherche dans un peigne', en: 'Search in a comb' }, ops: ins(7, 6, 5, 4, 3, 2, 1).concat([['search', [1]], ['search', [4]]]) },
        { id: 'delete', name: { fr: 'Suppression', en: 'Deletion' }, ops: ins(10, 5, 15, 3, 8, 12, 20).concat([['delete', [10]]]) },
      ],
    },
    {
      id: 'a234',
      chapter: 3,
      name: { fr: 'Arbre 2-3-4', en: '2-3-4 tree' },
      short: {
        fr: 'Arbre de recherche dont les nœuds contiennent 1, 2 ou 3 clés et dont toutes les feuilles sont au même niveau.',
        en: 'Search tree whose nodes hold 1, 2 or 3 keys and whose leaves are all on the same level.',
      },
      goal: {
        fr: 'Hauteur Θ(log n) garantie grâce aux éclatements des 4-nœuds (en descente ou en remontée).',
        en: 'Guaranteed Θ(log n) height thanks to splitting 4-nodes (top-down or bottom-up).',
      },
      desc: {
        fr: 'Un <b>arbre 2-3-4</b> est un arbre de recherche dont les nœuds contiennent des k-uplets de 1, 2 ou 3 éléments, et dont toutes les feuilles sont situées au même niveau. L’ajout se fait aux feuilles ; un 4-nœud plein est <b>éclaté</b> : sa clé médiane monte dans le parent.',
        en: 'A <b>2-3-4 tree</b> is a search tree whose nodes hold tuples of 1, 2 or 3 elements, and whose leaves all lie on the same level. Insertion happens at the leaves; a full 4-node is <b>split</b>: its middle key moves up into the parent.',
      },
      details: {
        fr: '<b>Éclatements en descente</b> (méthode du cours et du PSTL) : tout 4-nœud rencontré sur le chemin est éclaté. <b>En remontée</b> : on n’éclate qu’au besoin, en cascade depuis la feuille ; un nœud (a, b, c) qui reçoit un 4<sup>e</sup> élément y est éclaté exactement comme en descente (b remonte, le nouvel élément rejoint (a) ou (c)), seul le moment des éclatements diffère. Les deux méthodes ne donnent pas toujours le même arbre. Suppression : fusions et emprunts en descente (tout nœud où l’on descend garde au moins 2 éléments).',
        en: '<b>Top-down splitting</b> (lecture and PSTL method): every 4-node met on the path is split. <b>Bottom-up</b>: split only when needed, cascading from the leaf; a node (a, b, c) receiving a 4th element is split exactly as in the top-down method (b moves up, the new element joins (a) or (c)), only the timing of the splits differs. Both methods do not always give the same tree. Deletion: top-down merges and borrows (every node we go down into keeps at least 2 elements).',
      },
      costs: [
        [{ fr: 'Recherche, ajout, suppression', en: 'Search, insert, delete' }, 'O(log n)'],
        [{ fr: 'Hauteur', en: 'Height' }, 'log₄(n+1) ≤ h+1 ≤ log₂(n+1)'],
      ],
      examples: [
        { id: 'course', name: { fr: 'Cours : 4, 35, 10, 13, 3, 30, 15, 12, 7, 40, 20, 11, 6 (descente)', en: 'Lecture: 4, 35, 10, 13, 3, 30, 15, 12, 7, 40, 20, 11, 6 (top-down)' }, settings: { method: 'down' }, ops: ins(4, 35, 10, 13, 3, 30, 15, 12, 7, 40, 20, 11, 6) },
        { id: 'courseUp', name: { fr: 'Même suite, éclatements en remontée (même arbre ici)', en: 'Same keys, bottom-up splitting (same tree here)' }, settings: { method: 'up' }, ops: ins(4, 35, 10, 13, 3, 30, 15, 12, 7, 40, 20, 11, 6) },
        { id: 'diffDown', name: { fr: 'Méthodes différentes (1/2) : 17, 4, 19, 2, 12, 13, 16, 9, 14 en descente', en: 'Different methods (1/2): 17, 4, 19, 2, 12, 13, 16, 9, 14 top-down' }, settings: { method: 'down' }, ops: ins(17, 4, 19, 2, 12, 13, 16, 9, 14) },
        { id: 'diffUp', name: { fr: 'Méthodes différentes (2/2) : même suite en remontée', en: 'Different methods (2/2): same keys bottom-up' }, settings: { method: 'up' }, ops: ins(17, 4, 19, 2, 12, 13, 16, 9, 14) },
        { id: 'delete', name: { fr: 'Suppressions (fusions, emprunts)', en: 'Deletions (merges, borrows)' }, settings: { method: 'down' }, ops: ins(4, 35, 10, 13, 3, 30, 15, 12, 7, 40, 20, 11, 6).concat([13, 3, 35, 10, 4, 40, 30, 15].map((x) => ['delete', [x]])) },
      ],
    },
    {
      id: 'btree',
      chapter: 3,
      name: { fr: 'Arbre B', en: 'B-tree' },
      short: {
        fr: 'Arbre de recherche d’ordre m : chaque nœud contient entre m et 2m clés (la racine entre 1 et 2m), feuilles au même niveau.',
        en: 'Search tree of order m: each node holds between m and 2m keys (the root between 1 and 2m), leaves on the same level.',
      },
      goal: {
        fr: 'Recherche externe (disque, SGBD, systèmes de fichiers) : un nœud = une page, très peu d’accès disque.',
        en: 'External search (disk, databases, file systems): one node = one page, very few disk accesses.',
      },
      desc: {
        fr: 'Un <b>B-arbre d’ordre m</b> est un arbre de recherche dont les nœuds contiennent des k-uplets d’éléments avec m ≤ k ≤ 2m, sauf la racine qui en contient entre 1 et 2m, et dont toutes les feuilles sont au même niveau. Une page qui déborde (2m+1 clés) éclate : la médiane monte dans le parent.',
        en: 'A <b>B-tree of order m</b> is a search tree whose nodes hold k-tuples of elements with m ≤ k ≤ 2m, except the root which holds between 1 and 2m, and whose leaves are all on the same level. An overflowing page (2m+1 keys) splits: the median moves up into the parent.',
      },
      details: {
        fr: 'Comme dans le code PSTL : ajout aux feuilles et éclatements en remontée ; suppression d’une clé interne par son prédécesseur, puis emprunt au frère gauche, au frère droit, ou fusion.',
        en: 'As in the PSTL code: insertion at the leaves with bottom-up splits; an internal key is deleted through its predecessor, then borrow from the left sibling, the right sibling, or merge.',
      },
      costs: [
        [{ fr: 'Recherche, ajout, suppression', en: 'Search, insert, delete' }, 'O(log_m n)'],
        [{ fr: 'Hauteur', en: 'Height' }, 'h + 1 ≤ 1 + log_{m+1}((n+1)/2)'],
        [{ fr: 'Éclatements par clé (construction)', en: 'Splits per key (build)' }, '1/(2m) … 1/m'],
      ],
      examples: [
        { id: 'order2', name: { fr: 'Ordre 2 : 20 clés', en: 'Order 2: 20 keys' }, settings: { order: '2' }, ops: ins(10, 20, 5, 6, 12, 30, 7, 17, 3, 1, 25, 28, 15, 40, 8, 9, 2, 35, 22, 18) },
        { id: 'order1', name: { fr: 'Ordre 1 (arbre 2-3)', en: 'Order 1 (2-3 tree)' }, settings: { order: '1' }, ops: ins(4, 35, 10, 13, 3, 30, 15, 12, 7, 40, 20, 11, 6) },
        { id: 'delete', name: { fr: 'Ordre 2 : suppressions', en: 'Order 2: deletions' }, settings: { order: '2' }, ops: ins(10, 20, 5, 6, 12, 30, 7, 17, 3, 1, 25, 28, 15, 40, 8).concat([6, 20, 10, 3, 28, 30, 15, 40].map((x) => ['delete', [x]])) },
      ],
    },
    {
      id: 'dst',
      chapter: 3,
      name: { fr: 'Arbre digital (DST)', en: 'Digital search tree' },
      short: {
        fr: 'Arbre binaire dont les nœuds contiennent des clés ; l’aiguillage au niveau i se fait selon le i-ème bit de la clé.',
        en: 'Binary tree whose nodes hold keys; branching at level i follows the i-th bit of the key.',
      },
      goal: {
        fr: 'Recherche par accès aux bits plutôt que par comparaisons : au pire L accès aux bits (L = longueur des clés).',
        en: 'Search by bit access rather than by comparisons: at most L bit accesses (L = key length).',
      },
      desc: {
        fr: 'Un <b>arbre digital</b> est un arbre binaire dont les nœuds contiennent des clés. Le principe de la recherche est celui des ABR, mais l’aiguillage se fait selon les bits de la clé cherchée (1er bit au 1er niveau, …). Les lettres sont codées sur 5 bits : A = 00001, B = 00010, …',
        en: 'A <b>digital search tree</b> is a binary tree whose nodes hold keys. Search works like in a BST, but branching follows the bits of the searched key (1st bit at the 1st level, …). Letters are coded on 5 bits: A = 00001, B = 00010, …',
      },
      costs: [
        [{ fr: 'Recherche, ajout', en: 'Search, insert' }, { fr: '≈ log n comparaisons en moyenne, ≤ L bits', en: '≈ log n comparisons on average, ≤ L bits' }],
      ],
      examples: [
        { id: 'course', name: { fr: 'A S E R C H I N G X M P L (cours)', en: 'A S E R C H I N G X M P L (lecture)' }, ops: letters('ASERCHINGXMPL') },
        { id: 'delete', name: { fr: 'Puis suppressions', en: 'Then deletions' }, ops: letters('ASERCHINGXMPL').concat([['delete', ['E']], ['delete', ['A']]]) },
      ],
    },
    {
      id: 'triebin',
      chapter: 3,
      name: { fr: 'Trie binaire', en: 'Binary trie' },
      short: {
        fr: 'Arbre binaire dont les nœuds internes servent d’aiguillage selon les bits ; les clés sont dans les feuilles.',
        en: 'Binary tree whose internal nodes branch on bits; keys are stored in the leaves.',
      },
      goal: {
        fr: 'Structure indépendante de l’ordre d’insertion ; recherche en ≈ log n comparaisons de bits en moyenne.',
        en: 'Shape independent of insertion order; search in ≈ log n bit comparisons on average.',
      },
      desc: {
        fr: 'Un <b>trie binaire</b> est un arbre binaire dont les nœuds internes servent d’aiguillage : un nœud interne de chemin w contient à gauche les clés commençant par w0 et à droite celles commençant par w1. Les feuilles contiennent les clés. L’ajout dans une feuille occupée appelle <b>Split</b>.',
        en: 'A <b>binary trie</b> is a binary tree whose internal nodes are switches: an internal node with path w holds on its left the keys starting with w0 and on its right those starting with w1. Leaves hold the keys. Inserting into an occupied leaf calls <b>Split</b>.',
      },
      details: {
        fr: 'Problème des branches filiformes (1,44 n nœuds en moyenne) → tries Patricia.',
        en: 'Problem of one-way branches (1.44 n nodes on average) → Patricia tries.',
      },
      costs: [[{ fr: 'Recherche, ajout, suppression', en: 'Search, insert, delete' }, { fr: '≤ L comparaisons de bits', en: '≤ L bit comparisons' }]],
      examples: [
        { id: 'course', name: { fr: 'A S E R C H I N G X M P L (cours)', en: 'A S E R C H I N G X M P L (lecture)' }, ops: letters('ASERCHINGXMPL') },
        { id: 'split', name: { fr: 'Split en cascade : H puis I', en: 'Cascading split: H then I' }, ops: letters('HIA') },
        { id: 'delete', name: { fr: 'Suppressions et remontée', en: 'Deletions and collapse' }, ops: letters('ASERCHI').concat([['delete', ['H']], ['delete', ['R']]]) },
      ],
    },
    {
      id: 'patricia',
      chapter: 3,
      name: { fr: 'Trie Patricia (arbre radix)', en: 'Patricia trie (radix tree)' },
      short: {
        fr: 'Trie dont les chaînes de nœuds à un seul enfant sont contractées : chaque arête porte un mot.',
        en: 'Trie whose chains of single-child nodes are contracted: each edge carries a word.',
      },
      goal: {
        fr: 'Au plus n − 1 nœuds internes pour n clés, quelle que soit leur longueur (routage IP, Redis, Ethereum…).',
        en: 'At most n − 1 internal nodes for n keys, whatever their length (IP routing, Redis, Ethereum…).',
      },
      desc: {
        fr: 'Idée de Morrison (1968) : contracter les chaînes de nœuds n’ayant qu’un seul enfant. Chaque arête est étiquetée par un mot ; un nœud plein marque la fin d’une clé. L’ajout découpe une arête au plus long préfixe commun.',
        en: 'Morrison’s idea (1968): contract chains of nodes that have a single child. Each edge is labelled by a word; a filled node marks the end of a key. Insertion splits an edge at the longest common prefix.',
      },
      costs: [[{ fr: 'Recherche, ajout, suppression', en: 'Search, insert, delete' }, 'O(L)']],
      examples: [
        { id: 'course', name: { fr: 'romane … rubicundus (cours)', en: 'romane … rubicundus (lecture)' }, ops: words('romane romanus romulus rubens ruber rubicon rubicundus') },
        { id: 'prefix', name: { fr: 'Clés préfixes : le, les, lou, loups, lourd', en: 'Prefix keys: le, les, lou, loups, lourd' }, ops: words('lou loups le les lourd') },
        { id: 'delete', name: { fr: 'Suppression et fusion d’arêtes', en: 'Deletion and edge merge' }, ops: words('romane romanus romulus rubens').concat([['delete', ['romulus']], ['delete', ['romane']]]) },
      ],
    },
    {
      id: 'rtrie',
      chapter: 3,
      name: { fr: 'R-Trie', en: 'R-trie' },
      short: {
        fr: 'Arbre dont chaque nœud a R liens (un par lettre de l’alphabet) et une valeur, non vide quand il représente une clé.',
        en: 'Tree where each node has R links (one per letter of the alphabet) and a value, non-empty when it represents a key.',
      },
      goal: {
        fr: 'Représenter un ensemble de mots en partageant les préfixes communs ; recherche en O(L), indépendante de n.',
        en: 'Store a set of words sharing common prefixes; search in O(L), independent of n.',
      },
      desc: {
        fr: 'Un <b>R-trie</b> est un arbre dont tous les nœuds sont d’arité R et servent d’aiguillage. Chaque nœud a aussi une valeur (ici le numéro d’insertion), non vide lorsqu’il représente une clé : les clés peuvent être préfixes les unes des autres. Les liens vides ne sont pas dessinés.',
        en: 'An <b>R-trie</b> is a tree whose nodes all have arity R and act as switches. Each node also has a value (here the insertion number), non-empty when it represents a key: keys may be prefixes of one another. Empty links are not drawn.',
      },
      details: {
        fr: 'Inconvénient : n nœuds avec R pointeurs chacun, dont beaucoup de vides → tries hybrides.',
        en: 'Drawback: n nodes with R pointers each, many of them empty → hybrid tries.',
      },
      costs: [
        [{ fr: 'Recherche, ajout, suppression', en: 'Search, insert, delete' }, 'O(L)'],
        [{ fr: 'Mémoire', en: 'Memory' }, { fr: 'R pointeurs par nœud', en: 'R pointers per node' }],
      ],
      examples: [
        { id: 'course', name: { fr: 'lou leve les loups dans le lourd tapis de luxe vert olive (cours)', en: 'lou leve les loups dans le lourd tapis de luxe vert olive (lecture)' }, ops: words('lou leve les loups dans le lourd tapis de luxe vert olive') },
        { id: 'delete', name: { fr: 'Suppressions', en: 'Deletions' }, ops: words('lou leve les loups le lourd').concat([['delete', ['loups']], ['delete', ['le']]]) },
      ],
    },
    {
      id: 'trieh',
      chapter: 3,
      name: { fr: 'Trie hybride', en: 'Hybrid trie (TST)' },
      short: {
        fr: 'Arbre ternaire : chaque nœud a une lettre, une valeur et trois liens Inf, Eq, Sup (ABR sur les lettres + trie).',
        en: 'Ternary tree: each node has a letter, a value and three links Inf, Eq, Sup (BST on letters + trie).',
      },
      goal: {
        fr: 'Éviter les liens vides des R-tries : 3 pointeurs par nœud, recherche en ≈ L + log n comparaisons de caractères.',
        en: 'Avoid the empty links of R-tries: 3 pointers per node, search in ≈ L + log n character comparisons.',
      },
      desc: {
        fr: 'Un <b>trie hybride</b> est un arbre ternaire dont chaque nœud contient un caractère et une valeur (non vide lorsque le nœud représente une clé). Le lien <b>Inf</b> (resp. <b>Eq</b>, <b>Sup</b>) mène au sous-arbre dont le premier caractère est inférieur (resp. égal, supérieur) à celui du nœud.',
        en: 'A <b>hybrid trie</b> is a ternary tree whose nodes hold a character and a value (non-empty when the node represents a key). The <b>Inf</b> (resp. <b>Eq</b>, <b>Sup</b>) link leads to the subtree whose first character is smaller than (resp. equal to, greater than) the node’s.',
      },
      details: {
        fr: 'Suppression (code PSTL) : on retire la valeur puis on élague les nœuds devenus inutiles, en fusionnant si besoin les sous-arbres Inf et Sup.',
        en: 'Deletion (PSTL code): remove the value, then prune nodes that became useless, merging the Inf and Sup subtrees if needed.',
      },
      costs: [
        [{ fr: 'Recherche, ajout', en: 'Search, insert' }, { fr: '≈ L + log n (moyenne), ≤ 2L', en: '≈ L + log n (average), ≤ 2L' }],
        [{ fr: 'Mémoire', en: 'Memory' }, { fr: '2n + 3n références', en: '2n + 3n references' }],
      ],
      examples: [
        { id: 'course', name: { fr: 'lou leve les loups dans le lourd tapis de luxe vert olive (cours)', en: 'lou leve les loups dans le lourd tapis de luxe vert olive (lecture)' }, ops: words('lou leve les loups dans le lourd tapis de luxe vert olive') },
        { id: 'delete', name: { fr: 'Suppressions avec fusion Inf/Sup', en: 'Deletions with Inf/Sup merge' }, ops: words('lou la lu le dans tapis de luxe').concat([['delete', ['lou']], ['delete', ['tapis']]]) },
      ],
    },

    /* ======================= Chapitre 4 : hachage ======================= */
    {
      id: 'hash',
      chapter: 4,
      name: { fr: 'Table de hachage', en: 'Hash table' },
      short: {
        fr: 'Tableau de m cases ; une fonction h transforme la clé en adresse. Collisions : chaînage séparé ou adressage ouvert.',
        en: 'Array of m slots; a function h turns the key into an address. Collisions: separate chaining or open addressing.',
      },
      goal: {
        fr: 'Recherche et ajout en O(1) en moyenne (dictionnaires de Python, Java…). Comparer sondage linéaire, quadratique et double hachage.',
        en: 'Search and insert in O(1) on average (Python, Java dictionaries…). Compare linear, quadratic probing and double hashing.',
      },
      desc: {
        fr: '<b>Chaînage séparé</b> : les clés de même valeur de hachage sont dans une liste. <b>Adressage ouvert</b> : suite d’essais h<sub>i</sub>(x) — linéaire (h(x) + i − 1) mod m, quadratique (h(x) + (i − 1)²) mod m, double (h(x) + d(x)(i − 1)) mod m. Ici h(x) = x mod m et d(x) = 1 + (x mod (m − 1)).',
        en: '<b>Separate chaining</b>: keys with the same hash value go into a list. <b>Open addressing</b>: probe sequence h<sub>i</sub>(x) — linear (h(x) + i − 1) mod m, quadratic (h(x) + (i − 1)²) mod m, double (h(x) + d(x)(i − 1)) mod m. Here h(x) = x mod m and d(x) = 1 + (x mod (m − 1)).',
      },
      details: {
        fr: 'En adressage ouvert, une suppression marque la case d’une <b>pierre tombale</b> (†) : sautée en recherche, réutilisable en insertion.',
        en: 'With open addressing, a deletion marks the slot with a <b>tombstone</b> (†): skipped by searches, reusable by insertions.',
      },
      costs: [
        [{ fr: 'Chaînage : recherche négative', en: 'Chaining: unsuccessful search' }, 'α = n/m'],
        [{ fr: 'Chaînage : recherche positive', en: 'Chaining: successful search' }, '≈ 1 + α/2'],
        [{ fr: 'Pire cas', en: 'Worst case' }, 'O(n)'],
      ],
      examples: [
        { id: 'linear', name: { fr: 'Sondage linéaire, m = 11 (cours)', en: 'Linear probing, m = 11 (lecture)' }, settings: { method: 'linear', size: '11' }, ops: ins(10, 22, 31, 4, 15, 28, 17, 88, 59) },
        { id: 'double', name: { fr: 'Double hachage, m = 11 (cours)', en: 'Double hashing, m = 11 (lecture)' }, settings: { method: 'double', size: '11' }, ops: ins(10, 22, 31, 4, 15, 28, 17, 88, 59) },
        { id: 'chain', name: { fr: 'Chaînage séparé, m = 11', en: 'Separate chaining, m = 11' }, settings: { method: 'chain', size: '11' }, ops: ins(10, 22, 31, 4, 15, 28, 17, 88, 59) },
        { id: 'quad', name: { fr: 'Sondage quadratique, m = 11', en: 'Quadratic probing, m = 11' }, settings: { method: 'quadratic', size: '11' }, ops: ins(10, 22, 31, 4, 15, 28, 17, 88, 59) },
        { id: 'tomb', name: { fr: 'Pierre tombale', en: 'Tombstone' }, settings: { method: 'linear', size: '11' }, ops: ins(4, 15, 26, 37).concat([['delete', [15]], ['search', [37]], ['insert', [48]]]) },
      ],
    },
    {
      id: 'bloom',
      chapter: 4,
      name: { fr: 'Filtre de Bloom', en: 'Bloom filter' },
      short: {
        fr: 'Tableau de m bits et k fonctions de hachage ; répond « absent » sûrement, « présent » avec un risque de faux positif.',
        en: 'Array of m bits and k hash functions; answers “absent” for sure, “present” with a risk of false positive.',
      },
      goal: {
        fr: 'Tester l’appartenance à un très grand ensemble avec très peu de mémoire, avant un accès coûteux (disque, réseau).',
        en: 'Test membership in a huge set with very little memory, before a costly access (disk, network).',
      },
      desc: {
        fr: 'Pour construire le filtre, chaque élément s met à 1 les bits F[h<sub>i</sub>(s)], i = 1..k. Pour tester x : si tous les F[h<sub>i</sub>(x)] valent 1, on répond OUI, sinon NON. Un faux positif est possible, un faux négatif jamais.',
        en: 'To build the filter, each element s sets the bits F[h<sub>i</sub>(s)], i = 1..k, to 1. To test x: if all F[h<sub>i</sub>(x)] equal 1, answer YES, otherwise NO. False positives can happen, false negatives never.',
      },
      details: {
        fr: 'Probabilité de faux positif ≈ (1 − e<sup>−kn/m</sup>)<sup>k</sup>, minimale pour k = (m/n) ln 2.',
        en: 'False-positive probability ≈ (1 − e<sup>−kn/m</sup>)<sup>k</sup>, minimal for k = (m/n) ln 2.',
      },
      costs: [
        [{ fr: 'Ajout, test', en: 'Insert, test' }, 'O(k)'],
        [{ fr: 'Faux positif', en: 'False positive' }, '(1 − e^(−kn/m))^k'],
      ],
      examples: [
        { id: 'fruits', name: { fr: 'Fruits, puis tests', en: 'Fruits, then tests' }, settings: { m: '16', k: '3' }, ops: words('pomme poire kiwi fraise').concat([['search', ['kiwi']], ['search', ['prune']], ['search', ['cerise']]]) },
        { id: 'fp', name: { fr: 'Un faux positif', en: 'A false positive' }, settings: { m: '12', k: '2' }, ops: words('chat chien lapin souris tortue').concat([['search', ['ours']], ['search', ['loup']], ['search', ['poule']]]) },
      ],
    },
    {
      id: 'dynhash',
      chapter: 4,
      name: { fr: 'Hachage dynamique', en: 'Dynamic hashing' },
      short: {
        fr: 'Index = trie binaire sur les bits de h(x) ; ses feuilles pointent vers des pages de capacité C qui éclatent quand elles débordent.',
        en: 'Index = binary trie on the bits of h(x); its leaves point to pages of capacity C that split when they overflow.',
      },
      goal: {
        fr: 'Hachage externe sans rehachage global : la table grandit page par page (Larson, 1978).',
        en: 'External hashing without global rehashing: the table grows page by page (Larson, 1978).',
      },
      desc: {
        fr: 'La table est remplacée par un index, un arbre lexicographique binaire fabriqué par raffinements successifs de la fonction de hachage. Pour chercher x, on suit le chemin guidé par les bits de h(x) jusqu’à une feuille qui pointe sur la page contenant x. Quand une page est pleine, elle éclate selon le bit suivant.',
        en: 'The table is replaced by an index, a binary trie built by successive refinements of the hash function. To find x, follow the path guided by the bits of h(x) down to a leaf pointing to the page holding x. When a page is full, it splits on the next bit.',
      },
      details: {
        fr: 'Exemple du cours : h(lettre) = code sur 5 bits de la lettre (E = 00101), pages de capacité 4.',
        en: 'Lecture example: h(letter) = 5-bit code of the letter (E = 00101), pages of capacity 4.',
      },
      costs: [[{ fr: 'Recherche', en: 'Search' }, { fr: '1 accès disque + parcours de l’index', en: '1 disk access + index walk' }]],
      examples: [
        { id: 'course', name: { fr: 'E U T F R N C L S G B V, C = 4 (cours)', en: 'E U T F R N C L S G B V, C = 4 (lecture)' }, settings: { cap: '4' }, ops: letters('EUTFRNCLSGBV') },
        { id: 'small', name: { fr: 'Pages de capacité 2', en: 'Pages of capacity 2' }, settings: { cap: '2' }, ops: letters('EUTFRNCL') },
        { id: 'delete', name: { fr: 'Exemple du cours, puis suppressions (fusions)', en: 'Lecture example, then deletions (merges)' }, settings: { cap: '4' }, ops: letters('EUTFRNCLSGBV').concat([['delete', ['V']], ['delete', ['B']], ['search', ['S']], ['search', ['D']]]) },
      ],
    },
    {
      id: 'exthash',
      chapter: 4,
      name: { fr: 'Hachage extensible', en: 'Extendible hashing' },
      short: {
        fr: 'Index = tableau de 2^d cases (d premiers bits de h(x)) ; plusieurs cases peuvent pointer vers la même page.',
        en: 'Index = array of 2^d slots (first d bits of h(x)); several slots may point to the same page.',
      },
      goal: {
        fr: 'Hachage externe à un seul accès disque : l’index est l’arbre du hachage dynamique complété en arbre parfait.',
        en: 'External hashing with a single disk access: the index is the dynamic-hashing trie completed into a perfect tree.',
      },
      desc: {
        fr: 'Pour chercher x, on lit les d premiers bits de h(x) (profondeur globale) et on suit la case correspondante. Une page de profondeur locale k est pointée par 2<sup>d−k</sup> cases. Ajout dans une page pleine : éclatement si k < d (l’index ne change pas), sinon doublement de l’index.',
        en: 'To find x, read the first d bits of h(x) (global depth) and follow the matching slot. A page of local depth k is pointed to by 2<sup>d−k</sup> slots. Inserting into a full page: split if k < d (the index is unchanged), otherwise double the index.',
      },
      details: {
        fr: 'Exemple du cours : h(lettre) = code sur 5 bits de la lettre, pages de capacité 4 → d = 3.',
        en: 'Lecture example: h(letter) = 5-bit code of the letter, pages of capacity 4 → d = 3.',
      },
      costs: [
        [{ fr: 'Recherche', en: 'Search' }, { fr: '1 accès à l’index + 1 accès disque', en: '1 index access + 1 disk access' }],
        [{ fr: 'Doublement de l’index', en: 'Index doubling' }, 'O(2^d)'],
      ],
      examples: [
        { id: 'course', name: { fr: 'E U T F R N C L S G B V, C = 4 (cours)', en: 'E U T F R N C L S G B V, C = 4 (lecture)' }, settings: { cap: '4' }, ops: letters('EUTFRNCLSGBV') },
        { id: 'small', name: { fr: 'Pages de capacité 2', en: 'Pages of capacity 2' }, settings: { cap: '2' }, ops: letters('EUTFRNCL') },
        { id: 'delete', name: { fr: 'Exemple du cours, puis suppressions (fusions)', en: 'Lecture example, then deletions (merges)' }, settings: { cap: '4' }, ops: letters('EUTFRNCLSGBV').concat([['delete', ['V']], ['delete', ['B']], ['search', ['S']], ['search', ['D']]]) },
      ],
    },
  ];

  DT.catalog = {
    chapters,
    entries,
    find(id) {
      return entries.find((e) => e.id === id);
    },
  };
})();
