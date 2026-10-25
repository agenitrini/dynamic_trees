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

/* Arbre auto-adaptatif (splay tree, chapitre 3). */
(function () {
  'use strict';

  const DT = window.DT;

  DT.i18n.add({
    fr: {
      'splay.inorder': 'Parcours infixe : {l}',
      'splay.G': 'G',
      'splay.D': 'D',
      'splay.inserted': '{x} est ajouté.',
      'splay.already': '{x} est déjà présent : on le remonte à la racine.',
      'splay.start': 'On remonte {x} à la racine.',
      'splay.atRoot': '{x} est à la racine.',
      'splay.case.RD': '{x} est fils gauche de la racine {p} : rotation simple RD en {p}.',
      'splay.case.RG': '{x} est fils droit de la racine {p} : rotation simple RG en {p}.',
      'splay.case.RDD': '{x}, son père {p} et son grand-père {g} sont alignés à gauche : rotation RDD (zig-zig), d’abord en {g}, puis en {p}.',
      'splay.case.RGG': '{x}, son père {p} et son grand-père {g} sont alignés à droite : rotation RGG (zig-zig), d’abord en {g}, puis en {p}.',
      'splay.case.RGD': '{x} est fils droit de {p}, lui-même fils gauche de {g} : rotation RGD (zig-zag), RG en {p} puis RD en {g}.',
      'splay.case.RDG': '{x} est fils gauche de {p}, lui-même fils droit de {g} : rotation RDG (zig-zag), RD en {p} puis RG en {g}.',
      'splay.do.RD': 'RD en {p} : {x} est à la racine.',
      'splay.do.RG': 'RG en {p} : {x} est à la racine.',
      'splay.do.RDD1': 'RDD, 1re rotation : RD au grand-père {g}.',
      'splay.do.RDD2': 'RDD, 2e rotation : RD au père {p} ; {x} est remonté de deux niveaux.',
      'splay.do.RGG1': 'RGG, 1re rotation : RG au grand-père {g}.',
      'splay.do.RGG2': 'RGG, 2e rotation : RG au père {p} ; {x} est remonté de deux niveaux.',
      'splay.do.RGD1': 'RGD, 1re rotation : RG en {p}.',
      'splay.do.RGD2': 'RGD, 2e rotation : RD en {g} ; {x} est remonté de deux niveaux.',
      'splay.do.RDG1': 'RDG, 1re rotation : RD en {p}.',
      'splay.do.RDG2': 'RDG, 2e rotation : RG en {g} ; {x} est remonté de deux niveaux.',
      'splay.absentLast': '{x} est absent : on remonte le dernier nœud visité, {y}.',
      'splay.absent': '{x} est absent (le dernier nœud visité, {y}, est à la racine).',
      'splay.delRoot': '{x} est à la racine : on le retire.',
      'splay.noLeft': 'Pas de sous-arbre gauche : le sous-arbre droit devient l’arbre.',
      'splay.split': '{x} est retiré : il reste son sous-arbre gauche G (racine {l}) et son sous-arbre droit D.',
      'splay.goMax': 'On cherche le maximum de G (on descend à droite).',
      'splay.max': 'Maximum de G : {m}. On le remonte à la racine de G.',
      'splay.join': '{m} n’a pas de fils droit : D devient son sous-arbre droit.',
    },
    en: {
      'splay.inorder': 'In-order traversal: {l}',
      'splay.G': 'L',
      'splay.D': 'R',
      'splay.inserted': '{x} is inserted.',
      'splay.already': '{x} is already present: splay it to the root.',
      'splay.start': 'Splay {x} to the root.',
      'splay.atRoot': '{x} is at the root.',
      'splay.case.RD': '{x} is the left child of the root {p}: single right rotation (RD) at {p}.',
      'splay.case.RG': '{x} is the right child of the root {p}: single left rotation (RG) at {p}.',
      'splay.case.RDD': '{x}, its parent {p} and grandparent {g} are aligned to the left: zig-zig (RDD), first right rotation at {g}, then at {p}.',
      'splay.case.RGG': '{x}, its parent {p} and grandparent {g} are aligned to the right: zig-zig (RGG), first left rotation at {g}, then at {p}.',
      'splay.case.RGD': '{x} is the right child of {p}, itself the left child of {g}: zig-zag (RGD), left rotation at {p} then right rotation at {g}.',
      'splay.case.RDG': '{x} is the left child of {p}, itself the right child of {g}: zig-zag (RDG), right rotation at {p} then left rotation at {g}.',
      'splay.do.RD': 'Right rotation at {p}: {x} is at the root.',
      'splay.do.RG': 'Left rotation at {p}: {x} is at the root.',
      'splay.do.RDD1': 'Zig-zig, step 1: right rotation at the grandparent {g}.',
      'splay.do.RDD2': 'Zig-zig, step 2: right rotation at the parent {p}; {x} moved up two levels.',
      'splay.do.RGG1': 'Zig-zig, step 1: left rotation at the grandparent {g}.',
      'splay.do.RGG2': 'Zig-zig, step 2: left rotation at the parent {p}; {x} moved up two levels.',
      'splay.do.RGD1': 'Zig-zag, step 1: left rotation at {p}.',
      'splay.do.RGD2': 'Zig-zag, step 2: right rotation at {g}; {x} moved up two levels.',
      'splay.do.RDG1': 'Zig-zag, step 1: right rotation at {p}.',
      'splay.do.RDG2': 'Zig-zag, step 2: left rotation at {g}; {x} moved up two levels.',
      'splay.absentLast': '{x} is absent: splay the last visited node, {y}.',
      'splay.absent': '{x} is absent (the last visited node, {y}, is at the root).',
      'splay.delRoot': '{x} is at the root: remove it.',
      'splay.noLeft': 'No left subtree: the right subtree becomes the tree.',
      'splay.split': '{x} is removed: its left subtree L (root {l}) and its right subtree R remain.',
      'splay.goMax': 'Look for the maximum of L (go right).',
      'splay.max': 'Maximum of L: {m}. Splay it to the root of L.',
      'splay.join': '{m} has no right child: R becomes its right subtree.',
    },
  });

  class Splay extends DT.Algo {
    initState() {
      // rest : sous-arbre droit mis de côté pendant une suppression
      return { nextId: 1, root: null, rest: null };
    }

    /* --- rotations ---------------------------------------------------- */
    setChild(parent, old, child) {
      if (!parent) this.s.root = child;
      else if (parent.left === old) parent.left = child;
      else parent.right = child;
    }

    rotRight(q, parent) {
      const p = q.left;
      q.left = p.right;
      p.right = q;
      this.setChild(parent, q, p);
    }

    rotLeft(q, parent) {
      const p = q.right;
      q.right = p.left;
      p.left = q;
      this.setChild(parent, q, p);
    }

    /**
     * Remontée de x (dernier nœud du chemin path, depuis la racine) à la
     * racine de this.s.root : rotations doubles, sauf éventuellement la dernière.
     */
    splayUp(path, back) {
      const x = path[path.length - 1];
      this.code('splay');
      this.ring(null);
      this.mark(x.id, 'hl');
      if (path.length === 1) {
        this.step(['splay.atRoot', { x: x.key }], { line: 16 });
        this.code(back);
        return;
      }
      this.step(['splay.start', { x: x.key }], { line: 5 });
      while (path.length > 1) {
        const k = path.length;
        const p = path[k - 2];
        const g = k >= 3 ? path[k - 3] : null;
        const gg = k >= 4 ? path[k - 4] : null;
        const P = { x: x.key, p: p.key, g: g && g.key };
        if (!g) {
          const kind = p.left === x ? 'RD' : 'RG';
          this.mark(p.id, 'cmp');
          this.step(['splay.case.' + kind, P], { line: kind === 'RD' ? 8 : 9 });
          if (kind === 'RD') this.rotRight(p, null);
          else this.rotLeft(p, null);
          this.step(['splay.do.' + kind, P], { line: kind === 'RD' ? 8 : 9 });
          this.unmark(p.id);
          path = [x];
          break;
        }
        const xl = p.left === x;
        const pl = g.left === p;
        const kind = xl && pl ? 'RDD' : !xl && !pl ? 'RGG' : !xl && pl ? 'RGD' : 'RDG';
        const line = { RDD: 12, RGG: 13, RGD: 14, RDG: 15 }[kind];
        this.mark(p.id, 'cmp');
        this.mark(g.id, 'cmp');
        this.step(['splay.case.' + kind, P], { line: line });
        if (kind === 'RDD') {
          this.rotRight(g, gg);
          this.step(['splay.do.RDD1', P], { line });
          this.rotRight(p, gg);
        } else if (kind === 'RGG') {
          this.rotLeft(g, gg);
          this.step(['splay.do.RGG1', P], { line });
          this.rotLeft(p, gg);
        } else if (kind === 'RGD') {
          this.rotLeft(p, g);
          this.step(['splay.do.RGD1', P], { line });
          this.rotRight(g, gg);
        } else {
          this.rotRight(p, g);
          this.step(['splay.do.RDG1', P], { line });
          this.rotLeft(g, gg);
        }
        this.step(['splay.do.' + kind + '2', P], { line });
        this.unmark(p.id);
        this.unmark(g.id);
        path = path.slice(0, k - 3).concat([x]);
      }
      this.step(['splay.atRoot', { x: x.key }], { line: 16 });
      this.code(back);
    }

    /** Descente de recherche de x ; renvoie le chemin parcouru (racine → dernier nœud visité). */
    descend(x, line, probe) {
      const path = [];
      let n = this.s.root;
      while (n) {
        path.push(n);
        if (probe) this.float('probe', { id: 'probe', label: x, cls: 'cmp', at: n.id });
        this.ring(n.id, 'cmp');
        if (x === n.key) {
          this.float('probe', null);
          this.ring(n.id, 'ok');
          this.mark(n.id, 'ok');
          this.step(['c.found', { x }], { line });
          this.unmark(n.id);
          return path;
        }
        this.step([x < n.key ? 'c.cmpLess' : 'c.cmpMore', { x, y: n.key }], { line });
        n = x < n.key ? n.left : n.right;
      }
      this.float('probe', null);
      return path;
    }

    /* --- ajout -------------------------------------------------------- */
    insert(x) {
      this.code('insert');
      const id = this.newId();
      const bubble = (at) => this.float('cand', { id, label: x, cls: 'new', at });
      if (!this.s.root) {
        bubble(null);
        this.step(['c.newRoot', { x }], { line: 3 });
        this.float('cand', null);
        this.s.root = { id, key: x, left: null, right: null };
        this.step(['splay.inserted', { x }], { line: 3 });
        return;
      }
      const path = [];
      let n = this.s.root;
      for (;;) {
        bubble(n.id);
        this.ring(n.id, 'cmp');
        path.push(n);
        if (x === n.key) {
          this.float('cand', null);
          this.mark(n.id, 'ok');
          this.step(['splay.already', { x }], { line: 3 });
          this.s.nextId--; // identifiant inutilisé
          this.splayUp(path, 'insert');
          return;
        }
        const side = x < n.key ? 'left' : 'right';
        this.step([x < n.key ? 'c.cmpLess' : 'c.cmpMore', { x, y: n.key }], { line: 3 });
        if (!n[side]) {
          this.ring(null);
          this.float('cand', null);
          const leaf = { id, key: x, left: null, right: null };
          n[side] = leaf;
          path.push(leaf);
          this.mark(id, 'new');
          this.step(['c.leafHere', { x }], { line: 3 });
          this.splayUp(path, 'insert');
          return;
        }
        n = n[side];
      }
    }

    /* --- recherche ---------------------------------------------------- */
    search(x) {
      this.code('search');
      if (!this.s.root) {
        this.step(['c.notFound', { x }], { line: 3 });
        return false;
      }
      const path = this.descend(x, 3, true);
      const last = path[path.length - 1];
      const found = last.key === x;
      if (!found) {
        this.ring(last.id, 'bad');
        this.step(['splay.absentLast', { x, y: last.key }], { line: 3 });
      }
      this.splayUp(path, 'search');
      this.mark(last.id, found ? 'ok' : 'hl');
      this.step([found ? 'c.found' : 'c.notFound', { x }], { line: 5 });
      return found;
    }

    /* --- suppression -------------------------------------------------- */
    delete(x) {
      this.code('delete');
      if (!this.s.root) {
        this.step(['c.notFound', { x }], { line: 5 });
        return;
      }
      const path = this.descend(x, 2, false);
      const last = path[path.length - 1];
      if (last.key !== x) {
        this.ring(last.id, 'bad');
        this.step(['splay.absentLast', { x, y: last.key }], { line: 2 });
        this.splayUp(path, 'delete');
        this.step(['c.notFound', { x }], { line: 5 });
        return;
      }
      this.splayUp(path, 'delete');
      const r = this.s.root;
      this.mark(r.id, 'bad');
      this.step(['splay.delRoot', { x }], { line: 6 });
      if (!r.left) {
        this.s.root = r.right;
        this.step(['splay.noLeft'], { line: 8 });
        return;
      }
      // on met D de côté, G devient (provisoirement) l'arbre
      this.s.root = r.left;
      this.s.rest = r.right;
      this.step(['splay.split', { x, l: r.left.key }], { line: 6 });
      const mp = [this.s.root];
      this.ring(this.s.root.id, 'cmp');
      this.step(['splay.goMax'], { line: 9 });
      while (mp[mp.length - 1].right) {
        mp.push(mp[mp.length - 1].right);
        this.ring(mp[mp.length - 1].id, 'cmp');
        this.step(null, { line: 9 });
      }
      const m = mp[mp.length - 1];
      this.ring(null);
      this.mark(m.id, 'hl');
      this.step(['splay.max', { m: m.key }], { line: 9 });
      this.splayUp(mp, 'delete');
      m.right = this.s.rest;
      this.s.rest = null;
      this.mark(m.id, 'ok');
      this.step(['splay.join', { m: m.key }], { line: 10 });
    }

    random() {
      this.clear();
      for (const v of DT.util.randDistinct(8, 1, 99)) {
        this.step(['op.insert', { x: v }], { op: true, code: null });
        this.insert(v);
        this.clearMarks();
      }
    }

    /** Invariants (utilisé par les tests) : propriété d'ABR, identifiants uniques. */
    check() {
      if (this.s.rest) throw new Error('sous-arbre mis de côté non rattaché');
      const ids = new Set();
      (function rec(n, lo, hi) {
        if (!n) return;
        if (ids.has(n.id)) throw new Error('id dupliqué ' + n.id);
        ids.add(n.id);
        if (!(n.key > lo && n.key < hi)) throw new Error('ordre ABR violé en ' + n.key);
        rec(n.left, lo, n.key);
        rec(n.right, n.key, hi);
      })(this.s.root, -Infinity, Infinity);
    }

    keys() {
      return this.inorder(this.s.root, []);
    }

    /* --- dessin ------------------------------------------------------- */
    inorder(n, out) {
      if (n) {
        this.inorder(n.left, out);
        out.push(n.key);
        this.inorder(n.right, out);
      }
      return out;
    }

    draw(S) {
      const roots = [this.s.root, this.s.rest].filter(Boolean);
      if (!roots.length) {
        S.text('empty', 0, 30, ['c.emptyTree'], { cls: 'dim' });
        return;
      }
      const L = DT.layout.forest(roots, {
        children: (n) => (n.left || n.right ? [n.left, n.right] : []),
        width: () => 40,
        gap: 14,
        phantom: 30,
        levelGap: 70,
        treeGap: 70,
      });
      // centre la forêt sur la racine principale quand il n'y a qu'un arbre
      const dx = roots.length === 1 ? -L.boxes[0].rootX : -(L.minX + L.maxX) / 2;
      for (const [n, p] of L.pos) S.node(n.id, { x: p.x + dx, y: p.y, label: n.key });
      for (const [n] of L.pos) {
        for (const side of ['left', 'right']) if (n[side]) S.edge(n.id, n[side].id);
      }
      if (roots.length === 2) {
        S.text('lblG', L.boxes[0].rootX + dx, -40, ['splay.G'], { cls: 'accent' });
        S.text('lblD', L.boxes[1].rootX + dx, -40, ['splay.D'], { cls: 'accent' });
      }
      const keys = [];
      for (const r of roots) this.inorder(r, keys);
      S.text('inorder', 0, (L.maxDepth + 1) * 70 + 10, ['splay.inorder', { l: keys.join('  ') }], {
        cls: 'dim mono',
      });
    }
  }

  Splay.controls = [
    { type: 'input', name: 'key', size: 10, placeholder: 'ctl.keys' },
    { type: 'button', label: 'ctl.insert', op: 'insert', args: ['key'], primary: true },
    { type: 'button', label: 'ctl.delete', op: 'delete', args: ['key'] },
    { type: 'button', label: 'ctl.search', op: 'search', args: ['key'] },
    { type: 'sep' },
    { type: 'button', label: 'ctl.random', op: 'random' },
  ];

  Splay.code = {
    splay: {
      title: { fr: 'Remontée à la racine', en: 'Splaying' },
      source: 'site',
      lines: [
        'def Remonter(x, A):',
        '    """ noeud * ABR -> ABR',
        '        Remonte x a la racine de A : rotations doubles,',
        '        sauf eventuellement la derniere (x a profondeur impaire)."""',
        '    while Racine(A) != x:',
        '        p = Pere(x, A)',
        '        if p == Racine(A):           # rotation simple',
        '            if x < p: A = RD(A)',
        '            else:     A = RG(A)',
        '        else:                        # rotation double en g = Pere(p, A)',
        '            g = Pere(p, A)           # (le sous-arbre de racine g est remplace)',
        '            if x < p < g:   A = Remplacer(g, RDD, A)  # RD en g, puis RD en p',
        '            elif g < p < x: A = Remplacer(g, RGG, A)  # RG en g, puis RG en p',
        '            elif p < x < g: A = Remplacer(g, RGD, A)  # RG en p, puis RD en g',
        '            else:           A = Remplacer(g, RDG, A)  # RD en p, puis RG en g',
        '    return A',
      ],
    },
    insert: {
      title: { fr: 'Ajout dans un arbre auto-adaptatif', en: 'Splay tree insertion' },
      source: 'site',
      lines: [
        'def Splay_Ajout(x, A):',
        '    """ elt * ABR -> ABR """',
        '    A, n = ABR_AjoutFeuille(x, A)   # n : noeud de x (nouveau ou deja present)',
        '    return Remonter(n, A)',
      ],
    },
    search: {
      title: { fr: 'Recherche dans un arbre auto-adaptatif', en: 'Splay tree search' },
      source: 'site',
      lines: [
        'def Splay_Recherche(x, A):',
        '    """ elt * ABR -> booleen * ABR """',
        '    n = DernierVisite(x, A)   # noeud de x, sinon dernier noeud visite',
        '    A = Remonter(n, A)',
        '    return not EstArbreVide(A) and Racine(A) == x, A',
      ],
    },
    delete: {
      title: { fr: 'Suppression dans un arbre auto-adaptatif', en: 'Splay tree deletion' },
      source: 'site',
      lines: [
        'def Splay_Suppression(x, A):',
        '    n = DernierVisite(x, A)',
        '    A = Remonter(n, A)',
        '    if EstArbreVide(A) or Racine(A) != x:',
        '        return A                     # x absent',
        '    G, D = SousArbreGauche(A), SousArbreDroit(A)',
        '    if EstArbreVide(G):',
        '        return D',
        '    G = Remonter(Maximum(G), G)      # la racine de G n\'a pas de fils droit',
        '    return ArbreBinaire(Racine(G), SousArbreGauche(G), D)',
      ],
    },
  };

  DT.register('splay', Splay);
})();
