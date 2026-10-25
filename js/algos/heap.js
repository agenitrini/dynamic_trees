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

/* Tas min (chapitre 1) : arbre binaire parfait stocké dans un tableau. */
(function () {
  'use strict';

  const DT = window.DT;

  DT.i18n.add({
    fr: {
      'heap.ctl.build': 'Construire',
      'heap.ctl.extract': 'Supprimer le min',
      'heap.ctl.decrease': 'Diminuer',
      'heap.ctl.old': 'clé',
      'heap.ctl.new': 'nouvelle',
      'heap.op.decreaseKey': (p) => {
        const [a, b] = String(p.x).split(' ');
        return `Diminution de la clé ${a} en ${b}`;
      },
      'op.decreaseKey': 'Diminution d’une clé : {x}',
      'heap.title': 'Tas min, n = {n}',
      'heap.array': 'tableau',
      'heap.emptyHeap': 'Tas vide.',
      'heap.append': '{x} est placé en dernière position (indice {i}), à la première place libre du dernier niveau.',
      'heap.upSwap': '{x} < {y}, son père (indice {j}) : on les échange.',
      'heap.upStop': '{x} ≥ {y}, son père : l’arbre est de nouveau étiqueté de façon croissante.',
      'heap.upRoot': '{x} est arrivé à la racine : c’est le nouveau minimum.',
      'heap.empty': 'Le tas est vide : pas de minimum à supprimer.',
      'heap.min': 'Le minimum {x} est à la racine (indice 0).',
      'heap.swapLast': 'On échange la racine {x} et le dernier élément {y} (indice {i}).',
      'heap.pop': '{x} est retiré du tableau ; {y} est à la racine et doit descendre.',
      'heap.popLast': '{x} était le seul élément : le tas est vide.',
      'heap.extracted': 'Minimum supprimé : {x}.',
      'heap.kids2': '{x} a pour enfants {g} et {d} : le plus petit des trois est {m}.',
      'heap.kids1': '{x} a pour seul enfant {g} : le plus petit des deux est {m}.',
      'heap.leaf': '{x} est une feuille : il est à sa place.',
      'heap.downSwap': '{m} < {x} : on échange {x} et son enfant {m}.',
      'heap.downStop': '{x} n’est pas plus grand que ses enfants : il est à sa place.',
      'heap.buildStart': 'Le tableau [{l}] est vu comme un arbre binaire parfait. On fait descendre les nœuds internes, de l’indice {i} jusqu’à la racine.',
      'heap.buildTrivial': 'Moins de deux éléments : le tableau est déjà un tas.',
      'heap.buildNode': 'Descente du nœud d’indice {i} ({x}) : ses deux sous-arbres sont déjà des tas.',
      'heap.buildDone': 'Tas construit avec {c} comparaisons pour n = {n} (au plus 2n : construction en O(n)).',
      'heap.decFound': '{x} est à l’indice {i}.',
      'heap.decSet': 'Sa clé devient {y} : elle ne peut que remonter.',
      'heap.errDec': '{y} n’est pas plus petit que {x} : la nouvelle clé doit être plus petite.',
    },
    en: {
      'heap.ctl.build': 'Build',
      'heap.ctl.extract': 'Extract min',
      'heap.ctl.decrease': 'Decrease',
      'heap.ctl.old': 'key',
      'heap.ctl.new': 'new',
      'heap.op.decreaseKey': (p) => {
        const [a, b] = String(p.x).split(' ');
        return `Decrease key ${a} to ${b}`;
      },
      'op.decreaseKey': 'Decrease a key: {x}',
      'heap.title': 'Min-heap, n = {n}',
      'heap.array': 'array',
      'heap.emptyHeap': 'Empty heap.',
      'heap.append': '{x} is put in the last position (index {i}), the first free place of the last level.',
      'heap.upSwap': '{x} < {y}, its parent (index {j}): swap them.',
      'heap.upStop': '{x} ≥ {y}, its parent: the tree is labelled in increasing order again.',
      'heap.upRoot': '{x} reached the root: it is the new minimum.',
      'heap.empty': 'The heap is empty: no minimum to extract.',
      'heap.min': 'The minimum {x} is at the root (index 0).',
      'heap.swapLast': 'Swap the root {x} and the last element {y} (index {i}).',
      'heap.pop': '{x} is removed from the array; {y} is at the root and must sift down.',
      'heap.popLast': '{x} was the only element: the heap is empty.',
      'heap.extracted': 'Extracted minimum: {x}.',
      'heap.kids2': '{x} has children {g} and {d}: the smallest of the three is {m}.',
      'heap.kids1': '{x} has a single child {g}: the smaller of the two is {m}.',
      'heap.leaf': '{x} is a leaf: it is in place.',
      'heap.downSwap': '{m} < {x}: swap {x} and its child {m}.',
      'heap.downStop': '{x} is not larger than its children: it is in place.',
      'heap.buildStart': 'The array [{l}] is seen as a complete binary tree. Sift down the internal nodes, from index {i} up to the root.',
      'heap.buildTrivial': 'Fewer than two elements: the array is already a heap.',
      'heap.buildNode': 'Sift down the node at index {i} ({x}): both its subtrees are already heaps.',
      'heap.buildDone': 'Heap built with {c} comparisons for n = {n} (at most 2n: linear-time build).',
      'heap.decFound': '{x} is at index {i}.',
      'heap.decSet': 'Its key becomes {y}: it can only move up.',
      'heap.errDec': '{y} is not smaller than {x}: the new key must be smaller.',
    },
  });

  const parent = (i) => (i - 1) >> 1;

  class Heap extends DT.Algo {
    initState() {
      return { nextId: 1, a: [] };
    }

    /* --- outils ------------------------------------------------------- */

    /** Marque un élément à la fois dans l'arbre et dans le tableau. */
    hl(i, cls) {
      const e = this.s.a[i];
      this.mark('n' + e.id, cls);
      this.mark('a' + e.id, cls);
    }

    /** Anneau nommé autour d'un élément (arbre et tableau). */
    ringAt(i, cls, name) {
      const e = this.s.a[i];
      this.ring('n' + e.id, cls, name);
      this.ring('a' + e.id, cls, name + 'a');
    }

    swap(i, j) {
      const a = this.s.a;
      [a[i], a[j]] = [a[j], a[i]];
    }

    resetDeco() {
      this.marks.clear();
      this.rings.clear();
    }

    /* --- ajout -------------------------------------------------------- */
    insert(x) {
      this.code('insert');
      const a = this.s.a;
      a.push({ id: this.newId(), key: x });
      let i = a.length - 1;
      this.hl(i, 'new');
      this.step(['heap.append', { x, i }], { line: 3 });
      this.siftUp(i, 5);
    }

    /** Remontée de l'élément d'indice i (ajout et diminution de clé). */
    siftUp(i, line) {
      const a = this.s.a;
      const x = a[i].key;
      while (i > 0) {
        const j = parent(i);
        this.rings.clear();
        this.ringAt(i, 'hl', 'x');
        this.ringAt(j, 'cmp', 'p');
        if (!(a[i].key < a[j].key)) {
          this.ringAt(j, 'ok', 'p');
          this.step(['heap.upStop', { x, y: a[j].key }], { line });
          this.resetDeco();
          this.step(null, { line: line + 3 });
          return;
        }
        this.step(['heap.upSwap', { x, y: a[j].key, j }], { line });
        this.swap(i, j);
        i = j;
        this.rings.clear();
        this.ringAt(i, 'hl', 'x');
        this.step(null, { line: line + 1 });
      }
      this.rings.clear();
      this.ringAt(0, 'ok', 'x');
      this.step(['heap.upRoot', { x }], { line });
      this.resetDeco();
      this.step(null, { line: line + 3 });
    }

    /* --- suppression du minimum --------------------------------------- */
    extractMin() {
      this.code('extractMin');
      const a = this.s.a;
      if (!a.length) {
        this.step('heap.empty', { line: 3 });
        return null;
      }
      const m = a[0].key;
      this.hl(0, 'bad');
      this.ringAt(0, 'bad', 'm');
      this.step(['heap.min', { x: m }], { line: 4 });
      const last = a.length - 1;
      if (last === 0) {
        a.pop();
        this.rings.clear();
        this.step(['heap.popLast', { x: m }], { line: 6 });
        this.step(['heap.extracted', { x: m }], { line: 8 });
        return m;
      }
      this.rings.clear();
      this.hl(last, 'hl');
      this.step(['heap.swapLast', { x: m, y: a[last].key, i: last }], { line: 5 });
      this.swap(0, last);
      this.step(null, { line: 5 });
      a.pop();
      this.step(['heap.pop', { x: m, y: a[0].key }], { line: 6 });
      this.resetDeco();
      this.siftDown(0);
      this.code('extractMin');
      this.resetDeco();
      this.step(['heap.extracted', { x: m }], { line: 8 });
      return m;
    }

    /**
     * Descente de l'élément d'indice i (Descendre du pseudo-code) ;
     * renvoie le nombre de comparaisons entre clés.
     */
    siftDown(i) {
      this.code('siftDown');
      const a = this.s.a;
      const x = a[i].key;
      let cmp = 0;
      for (;;) {
        const n = a.length;
        const g = 2 * i + 1;
        const d = 2 * i + 2;
        this.rings.clear();
        this.hl(i, 'hl');
        this.ringAt(i, 'hl', 'x');
        if (g >= n) {
          this.ringAt(i, 'ok', 'x');
          this.step(['heap.leaf', { x }], { line: 9 });
          break;
        }
        let m = i;
        cmp++;
        if (a[g].key < a[m].key) m = g;
        if (d < n) {
          cmp++;
          if (a[d].key < a[m].key) m = d;
        }
        this.ringAt(g, 'cmp', 'g');
        if (d < n) this.ringAt(d, 'cmp', 'd');
        const msg = d < n
          ? ['heap.kids2', { x, g: a[g].key, d: a[d].key, m: a[m].key }]
          : ['heap.kids1', { x, g: a[g].key, m: a[m].key }];
        this.step(msg, { line: d < n ? 7 : 5 });
        if (m === i) {
          this.rings.clear();
          this.ringAt(i, 'ok', 'x');
          this.step(['heap.downStop', { x }], { line: 9 });
          break;
        }
        this.rings.clear();
        this.ringAt(m, 'cmp', 'g');
        this.ringAt(i, 'hl', 'x');
        this.step(['heap.downSwap', { x, m: a[m].key }], { line: 10 });
        this.swap(i, m);
        this.step(null, { line: 11 });
        this.unmark('n' + a[m].id);
        this.unmark('a' + a[m].id);
        i = m;
      }
      this.resetDeco();
      return cmp;
    }

    /* --- construction en O(n) ----------------------------------------- */
    build(list) {
      const nextId = this.s.nextId;
      this.s = this.initState();
      this.s.nextId = nextId;
      this.code('build');
      const a = this.s.a;
      for (const x of list) a.push({ id: this.newId(), key: x });
      const n = a.length;
      const start = (n >> 1) - 1;
      if (start < 0) {
        this.step('heap.buildTrivial', { line: 3 });
        return;
      }
      this.step(['heap.buildStart', { l: list.join(', '), i: start }], { line: 3 });
      let cmp = 0;
      for (let i = start; i >= 0; i--) {
        this.code('build');
        this.resetDeco();
        this.ringAt(i, 'hl', 'x');
        this.step(['heap.buildNode', { i, x: a[i].key }], { line: 5 });
        cmp += this.siftDown(i);
      }
      this.code('build');
      this.resetDeco();
      this.lastCmp = cmp;
      this.step(['heap.buildDone', { c: cmp, n }], { line: 6 });
    }

    /* --- diminuer une clé --------------------------------------------- */
    decreaseKey(old, v) {
      this.code('decreaseKey');
      const a = this.s.a;
      const i = a.findIndex((e) => e.key === old);
      if (i < 0) {
        this.step(['c.notFound', { x: old }], { line: 1 });
        return;
      }
      if (!(v < old)) throw new DT.UserError('heap.errDec', { x: old, y: v });
      this.ringAt(i, 'hl', 'x');
      this.step(['heap.decFound', { x: old, i }], { line: 1 });
      a[i].key = v;
      this.hl(i, 'new');
      this.step(['heap.decSet', { y: v }], { line: 3 });
      this.siftUp(i, 4);
    }

    random() {
      this.clear();
      for (const v of DT.util.randDistinct(10, 1, 99)) {
        this.step(['op.insert', { x: v }], { op: true, code: null });
        this.insert(v);
        this.clearMarks();
      }
    }

    /** Invariants (tests) : ordre de tas, identifiants uniques. */
    check() {
      const a = this.s.a;
      const ids = new Set();
      a.forEach((e, i) => {
        if (ids.has(e.id)) throw new Error('id dupliqué ' + e.id);
        ids.add(e.id);
        if (typeof e.key !== 'number') throw new Error('clé invalide à l’indice ' + i);
        if (i > 0 && a[parent(i)].key > e.key) throw new Error(`ordre de tas violé en ${i} (${e.key})`);
      });
    }

    keys() {
      return this.s.a.map((e) => e.key).sort((x, y) => x - y);
    }

    /* --- dessin ------------------------------------------------------- */
    draw(S) {
      const a = this.s.a;
      const n = a.length;
      if (!n) {
        S.text('empty', 0, 30, ['heap.emptyHeap'], { cls: 'dim' });
        return;
      }
      const tmp = a.map((e, i) => ({ i }));
      const L = DT.layout.tree(tmp[0], {
        children: (t) => {
          const g = 2 * t.i + 1;
          const d = g + 1;
          return g < n ? [tmp[g], d < n ? tmp[d] : null] : [];
        },
        width: () => 40,
        gap: 16,
        phantom: 40,
        levelGap: 68,
      });
      for (const [t, p] of L.pos) S.node('n' + a[t.i].id, { x: p.x, y: p.y, label: a[t.i].key });
      for (let i = 1; i < n; i++) {
        S.edge('n' + a[parent(i)].id, 'n' + a[i].id, { id: 'he' + i });
      }
      // tableau (indices sous les cases)
      const cw = 44;
      const y = (L.maxDepth + 1) * 68 + 34;
      const x0 = -((n - 1) / 2) * cw;
      for (let i = 0; i < n; i++) {
        S.node('cell' + i, { shape: 'cell', x: x0 + i * cw, y, w: cw, h: 40, label: '', cls: 'plain', sub: String(i) });
      }
      for (let i = 0; i < n; i++) {
        S.node('a' + a[i].id, { shape: 'box', x: x0 + i * cw, y, w: cw - 14, h: 28, label: a[i].key });
      }
      // (texte centré : la feuille de style impose text-anchor: middle)
      S.text('arr', x0 - cw / 2 - 36, y, ['heap.array'], { cls: 'dim' });
      S.text('ttl', 0, -44, ['heap.title', { n }], { cls: 'dim' });
    }
  }

  Heap.controls = [
    { type: 'input', name: 'key', size: 12, placeholder: 'ctl.keys' },
    { type: 'button', label: 'ctl.insert', op: 'insert', args: ['key'], primary: true },
    { type: 'button', label: 'heap.ctl.build', op: 'build', args: ['key'], single: true },
    { type: 'button', label: 'heap.ctl.extract', op: 'extractMin' },
    { type: 'sep' },
    { type: 'input', name: 'old', size: 4, placeholder: 'heap.ctl.old' },
    { type: 'input', name: 'nv', size: 5, placeholder: 'heap.ctl.new' },
    { type: 'button', label: 'heap.ctl.decrease', op: 'decreaseKey', args: ['old', 'nv'] },
    { type: 'sep' },
    { type: 'button', label: 'ctl.random', op: 'random' },
  ];

  Heap.code = {
    insert: {
      title: { fr: 'Ajout dans un tas min', en: 'Min-heap insertion' },
      source: 'site',
      lines: [
        'def Ajout(T, x):',
        '    """ TasMin * cle -> TasMin """',
        '    T.append(x)                 # x en derniere position',
        '    i = len(T) - 1',
        '    while i > 0 and T[i] < T[Parent(i)]:   # Parent(i) = (i-1)//2',
        '        Echange(T, i, Parent(i))',
        '        i = Parent(i)',
        '    return T',
      ],
    },
    extractMin: {
      title: { fr: 'Suppression du minimum', en: 'Extract the minimum' },
      source: 'site',
      lines: [
        'def SupprMin(T):',
        '    """ TasMin -> cle * TasMin """',
        '    if len(T) == 0: return None',
        '    m = T[0]                    # le minimum est a la racine',
        '    Echange(T, 0, len(T) - 1)   # la racine prend le dernier element',
        '    T.pop()                     # on retire l\'ancienne racine',
        '    Descendre(T, 0)',
        '    return m, T',
      ],
    },
    siftDown: {
      title: { fr: 'Descente d’un nœud', en: 'Sift down' },
      source: 'site',
      lines: [
        'def Descendre(T, i):',
        '    """ TasMin * entier -> None : fait descendre T[i] a sa place """',
        '    m = i',
        '    g, d = 2*i + 1, 2*i + 2     # enfants gauche et droit',
        '    if g < len(T) and T[g] < T[m]:',
        '        m = g',
        '    if d < len(T) and T[d] < T[m]:',
        '        m = d',
        '    if m != i:',
        '        Echange(T, i, m)',
        '        Descendre(T, m)',
      ],
    },
    build: {
      title: { fr: 'Construction en O(n)', en: 'Linear-time build' },
      source: 'site',
      lines: [
        'def Construction(L):',
        '    """ liste de cles -> TasMin """',
        '    T = L                       # arbre parfait quelconque',
        '    for i in range(len(T)//2 - 1, -1, -1):   # noeuds internes',
        '        Descendre(T, i)',
        '    return T',
      ],
    },
    decreaseKey: {
      title: { fr: 'Modification (diminution) d’une clé', en: 'Decrease a key' },
      source: 'site',
      lines: [
        'def DiminuerCle(T, i, v):',
        '    """ TasMin * entier * cle -> TasMin   (hypothese : v < T[i]) """',
        '    T[i] = v',
        '    while i > 0 and T[i] < T[Parent(i)]:',
        '        Echange(T, i, Parent(i))',
        '        i = Parent(i)',
        '    return T',
      ],
    },
  };

  DT.register('heap', Heap);
})();
