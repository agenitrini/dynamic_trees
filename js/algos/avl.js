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

/* Arbre AVL (chapitre 3). */
(function () {
  'use strict';

  const DT = window.DT;

  /* Noms des rotations (cours) et leur traduction. */
  DT.i18n.add({
    fr: {
      'avl.inorder': 'Parcours infixe : {l}',
      'avl.inserted': '{x} est ajouté.',
      'avl.up': 'Remontée en {x} : hauteur {h}, déséquilibre {b} : équilibré.',
      'avl.unbal': 'Remontée en {x} : hauteur {h}, déséquilibre {b} : {x} est déséquilibré !',
      'avl.case.RD': 'Déséquilibre à gauche, et le sous-arbre gauche {p} penche à gauche : rotation simple RD en {q}.',
      'avl.case.RD0': 'Déséquilibre à gauche, et le sous-arbre gauche {p} est équilibré : rotation simple RD en {q}.',
      'avl.case.RG': 'Déséquilibre à droite, et le sous-arbre droit {p} penche à droite : rotation simple RG en {q}.',
      'avl.case.RG0': 'Déséquilibre à droite, et le sous-arbre droit {p} est équilibré : rotation simple RG en {q}.',
      'avl.case.RGD': 'Déséquilibre à gauche, mais le sous-arbre gauche {p} penche à droite : rotation double RGD (RG en {p}, puis RD en {q}).',
      'avl.case.RDG': 'Déséquilibre à droite, mais le sous-arbre droit {p} penche à gauche : rotation double RDG (RD en {p}, puis RG en {q}).',
      'avl.do.RD': 'RD en {q} : {p} remonte, {q} devient son fils droit.',
      'avl.do.RG': 'RG en {q} : {p} remonte, {q} devient son fils gauche.',
      'avl.do.RGD1': 'RGD, 1re rotation : RG en {p}, {r} remonte.',
      'avl.do.RGD2': 'RGD, 2e rotation : RD en {q}, {r} devient la racine du sous-arbre.',
      'avl.do.RDG1': 'RDG, 1re rotation : RD en {p}, {r} remonte.',
      'avl.do.RDG2': 'RDG, 2e rotation : RG en {q}, {r} devient la racine du sous-arbre.',
      'avl.balanced': 'L’arbre est un AVL (hauteur {h}).',
      'avl.del0': '{x} est une feuille : on la supprime.',
      'avl.del1': '{x} n’a qu’un enfant : il prend sa place.',
      'avl.goMin': '{x} a deux enfants : on cherche le minimum de son sous-arbre droit (on descend à gauche).',
      'avl.del2': 'Minimum du sous-arbre droit : {m}. Il remplace {x}.',
      'avl.replaced': '{m} remplace {x} ; on remonte en recalculant les hauteurs.',
    },
    en: {
      'avl.inorder': 'In-order traversal: {l}',
      'avl.inserted': '{x} is inserted.',
      'avl.up': 'Back up at {x}: height {h}, balance {b}: balanced.',
      'avl.unbal': 'Back up at {x}: height {h}, balance {b}: {x} is unbalanced!',
      'avl.case.RD': 'Left-heavy, and the left subtree {p} leans left: single right rotation (RD) at {q}.',
      'avl.case.RD0': 'Left-heavy, and the left subtree {p} is balanced: single right rotation (RD) at {q}.',
      'avl.case.RG': 'Right-heavy, and the right subtree {p} leans right: single left rotation (RG) at {q}.',
      'avl.case.RG0': 'Right-heavy, and the right subtree {p} is balanced: single left rotation (RG) at {q}.',
      'avl.case.RGD': 'Left-heavy, but the left subtree {p} leans right: left-right double rotation (RGD: left at {p}, then right at {q}).',
      'avl.case.RDG': 'Right-heavy, but the right subtree {p} leans left: right-left double rotation (RDG: right at {p}, then left at {q}).',
      'avl.do.RD': 'Right rotation (RD) at {q}: {p} moves up, {q} becomes its right child.',
      'avl.do.RG': 'Left rotation (RG) at {q}: {p} moves up, {q} becomes its left child.',
      'avl.do.RGD1': 'Left-right rotation, step 1: left rotation at {p}, {r} moves up.',
      'avl.do.RGD2': 'Left-right rotation, step 2: right rotation at {q}, {r} becomes the subtree root.',
      'avl.do.RDG1': 'Right-left rotation, step 1: right rotation at {p}, {r} moves up.',
      'avl.do.RDG2': 'Right-left rotation, step 2: left rotation at {q}, {r} becomes the subtree root.',
      'avl.balanced': 'The tree is an AVL tree (height {h}).',
      'avl.del0': '{x} is a leaf: remove it.',
      'avl.del1': '{x} has only one child: it takes its place.',
      'avl.goMin': '{x} has two children: look for the minimum of its right subtree (go left).',
      'avl.del2': 'Minimum of the right subtree: {m}. It replaces {x}.',
      'avl.replaced': '{m} replaces {x}; go back up recomputing heights.',
    },
  });

  const H = (n) => (n ? n.h : -1); // hauteur (arbre vide : -1, feuille : 0)
  const bal = (n) => H(n.left) - H(n.right);
  const fmt = (b) => (b > 0 ? '+' + b : b < 0 ? '−' + -b : '0');
  const upd = (n) => {
    n.h = 1 + Math.max(H(n.left), H(n.right));
  };

  class AVL extends DT.Algo {
    initState() {
      return { nextId: 1, root: null };
    }

    /* --- outils ------------------------------------------------------- */

    /**
     * Un anneau masquerait la pastille de déséquilibre : le nœud « courant »
     * (anneau) est donc signalé par sa couleur.
     */
    snapshot() {
      const rings = this.rings;
      this.rings = new Map();
      const S = super.snapshot();
      this.rings = rings;
      for (const r of rings.values()) {
        const n = S.get(r.at);
        if (n && r.cls) n.cls = (n.cls ? n.cls + ' ' : '') + r.cls;
      }
      return S;
    }

    setChild(parent, side, child) {
      if (!parent) this.s.root = child;
      else parent[side] = child;
    }

    /** Rotation droite en q ; renvoie la nouvelle racine p du sous-arbre. */
    rotRight(q, parent, side) {
      const p = q.left;
      q.left = p.right;
      p.right = q;
      upd(q);
      upd(p);
      this.setChild(parent, side, p);
      return p;
    }

    rotLeft(q, parent, side) {
      const p = q.right;
      q.right = p.left;
      p.left = q;
      upd(q);
      upd(p);
      this.setChild(parent, side, p);
      return p;
    }

    /**
     * Remontée depuis le bas du chemin : recalcul des hauteurs, détection des
     * déséquilibres et rotations (Equilibrage). path : nœuds de la racine
     * vers le bas ; lines[i] : ligne du pseudo-code associée à path[i].
     */
    rebalanceUp(path, lines, block) {
      for (let i = path.length - 1; i >= 0; i--) {
        const n = path[i];
        const parent = i > 0 ? path[i - 1] : null;
        const side = parent ? (parent.left === n ? 'left' : 'right') : null;
        upd(n);
        const b = bal(n);
        this.code(block);
        this.ring(n.id, 'cmp');
        if (Math.abs(b) <= 1) {
          this.step(['avl.up', { x: n.key, h: n.h, b: fmt(b) }], { line: lines[i] });
          continue;
        }
        // déséquilibre de ±2 : Equilibrage
        this.ring(null);
        this.mark(n.id, 'bad');
        this.code('balance');
        this.step(['avl.unbal', { x: n.key, h: n.h, b: fmt(b) }], { line: b > 0 ? 8 : 12 });
        const q = n;
        const p = b > 0 ? q.left : q.right;
        const single = b > 0 ? bal(p) >= 0 : bal(p) <= 0;
        const kind = b > 0 ? (single ? 'RD' : 'RGD') : single ? 'RG' : 'RDG';
        this.ring(null);
        this.mark(p.id, 'cmp');
        this.step(['avl.case.' + kind + (bal(p) === 0 ? '0' : ''), { p: p.key, q: q.key }], { line: { RD: 10, RGD: 11, RG: 14, RDG: 15 }[kind] });
        this.code('rotations');
        if (single) {
          this.mark(q.id, 'hl');
          this.mark(p.id, 'hl');
          if (kind === 'RD') this.rotRight(q, parent, side);
          else this.rotLeft(q, parent, side);
          this.step(['avl.do.' + kind, { p: p.key, q: q.key }], { line: kind === 'RD' ? 5 : 11 });
        } else {
          const r = b > 0 ? p.right : p.left;
          this.mark(r.id, 'hl');
          this.mark(p.id, 'hl');
          if (kind === 'RGD') this.rotLeft(p, q, 'left');
          else this.rotRight(p, q, 'right');
          this.step(['avl.do.' + kind + '1', { p: p.key, q: q.key, r: r.key }], { line: kind === 'RGD' ? 11 : 5 });
          this.mark(q.id, 'hl');
          if (kind === 'RGD') this.rotRight(q, parent, side);
          else this.rotLeft(q, parent, side);
          this.step(['avl.do.' + kind + '2', { p: p.key, q: q.key, r: r.key }], { line: kind === 'RGD' ? 5 : 11 });
        }
        this.marks.clear();
      }
      this.ring(null);
      this.code(block);
      this.step(['avl.balanced', { h: H(this.s.root) }], { line: 0 });
    }

    /* --- ajout -------------------------------------------------------- */
    insert(x) {
      this.code('insert');
      const id = this.newId();
      const bubble = (at) => this.float('cand', { id, label: x, cls: 'new', at });
      if (!this.s.root) {
        bubble(null);
        this.step(['c.newRoot', { x }], { line: 5 });
        this.float('cand', null);
        this.s.root = { id, key: x, h: 0, left: null, right: null };
        this.step(['avl.inserted', { x }], { line: 5 });
        return;
      }
      const path = [];
      const lines = [];
      let n = this.s.root;
      for (;;) {
        bubble(n.id);
        this.ring(n.id, 'cmp');
        if (x === n.key) {
          this.mark(n.id, 'ok');
          this.step(['c.already', { x }], { line: 7 });
          this.s.nextId--; // identifiant inutilisé
          return;
        }
        const side = x < n.key ? 'left' : 'right';
        path.push(n);
        lines.push(x < n.key ? 9 : 11);
        this.step([x < n.key ? 'c.cmpLess' : 'c.cmpMore', { x, y: n.key }], { line: x < n.key ? 9 : 12 });
        if (!n[side]) {
          this.ring(null);
          this.float('cand', null);
          n[side] = { id, key: x, h: 0, left: null, right: null };
          this.mark(id, 'new');
          this.step(['c.leafHere', { x }], { line: 5 });
          this.unmark(id);
          break;
        }
        n = n[side];
      }
      this.rebalanceUp(path, lines, 'insert');
    }

    /* --- recherche ---------------------------------------------------- */
    search(x) {
      this.code('search');
      let n = this.s.root;
      if (!n) {
        this.step(['c.notFound', { x }], { line: 2 });
        return false;
      }
      for (;;) {
        this.float('probe', { id: 'probe', label: x, cls: 'cmp', at: n.id });
        this.ring(n.id, 'cmp');
        if (x === n.key) {
          this.ring(n.id, 'ok');
          this.mark(n.id, 'ok');
          this.float('probe', null);
          this.step(['c.found', { x }], { line: 4 });
          return true;
        }
        this.step([x < n.key ? 'c.cmpLess' : 'c.cmpMore', { x, y: n.key }], { line: x < n.key ? 6 : 7 });
        const next = x < n.key ? n.left : n.right;
        if (!next) {
          this.float('probe', null);
          this.ring(n.id, 'bad');
          this.step(['c.notFound', { x }], { line: 2 });
          return false;
        }
        n = next;
      }
    }

    /* --- suppression -------------------------------------------------- */
    delete(x) {
      this.code('delete');
      const path = [];
      const lines = [];
      let n = this.s.root;
      while (n && n.key !== x) {
        this.ring(n.id, 'cmp');
        this.step([x < n.key ? 'c.cmpLess' : 'c.cmpMore', { x, y: n.key }], { line: x < n.key ? 5 : 7 });
        path.push(n);
        lines.push(x < n.key ? 5 : 7);
        n = x < n.key ? n.left : n.right;
      }
      if (!n) {
        this.ring(path.length ? path[path.length - 1].id : null, 'bad');
        this.step(['c.notFound', { x }], { line: 3 });
        return;
      }
      const parent = path.length ? path[path.length - 1] : null;
      const side = parent ? (parent.left === n ? 'left' : 'right') : null;
      this.ring(n.id, 'bad');
      this.mark(n.id, 'bad');
      if (!n.left || !n.right) {
        const child = n.left || n.right;
        const line = !n.left ? 10 : 12;
        this.step([child ? 'avl.del1' : 'avl.del0', { x }], { line });
        this.ring(null);
        this.unmark(n.id);
        this.setChild(parent, side, child);
        this.step(null, { line });
        this.rebalanceUp(path, lines, 'delete');
        return;
      }
      // deux enfants : le minimum m du sous-arbre droit prend la place de n
      this.step(['avl.goMin', { x }], { line: 13 });
      const minPath = [];
      let m = n.right;
      this.ring(m.id, 'cmp');
      this.step(null, { line: 13 });
      while (m.left) {
        minPath.push(m);
        m = m.left;
        this.ring(m.id, 'cmp');
        this.step(null, { line: 13 });
      }
      this.mark(m.id, 'hl');
      this.ring(m.id, 'hl');
      this.step(['avl.del2', { x, m: m.key }], { line: 13 });
      // on détache m (son éventuel enfant droit remonte), puis m remplace n
      if (minPath.length) minPath[minPath.length - 1].left = m.right;
      else n.right = m.right;
      m.left = n.left;
      m.right = n.right;
      this.setChild(parent, side, m);
      this.ring(null);
      this.unmark(n.id);
      this.unmark(m.id);
      this.step(['avl.replaced', { x, m: m.key }], { line: 14 });
      this.rebalanceUp(
        path.concat([m], minPath),
        lines.concat([14], minPath.map(() => 5)),
        'delete'
      );
    }

    random() {
      this.clear();
      for (const v of DT.util.randDistinct(10, 1, 99)) {
        this.step(['op.insert', { x: v }], { op: true, code: null });
        this.insert(v);
        this.clearMarks();
      }
    }

    /** Invariants (utilisé par les tests) : ABR, hauteurs stockées exactes, équilibre, identifiants uniques. */
    check() {
      const ids = new Set();
      (function rec(n, lo, hi) {
        if (!n) return -1;
        if (ids.has(n.id)) throw new Error('id dupliqué ' + n.id);
        ids.add(n.id);
        if (!(n.key > lo && n.key < hi)) throw new Error('ordre ABR violé en ' + n.key);
        const hl = rec(n.left, lo, n.key);
        const hr = rec(n.right, n.key, hi);
        const h = 1 + Math.max(hl, hr);
        if (n.h !== h) throw new Error(`hauteur stockée fausse en ${n.key} : ${n.h} au lieu de ${h}`);
        if (Math.abs(hl - hr) > 1) throw new Error('déséquilibre en ' + n.key);
        return h;
      })(this.s.root, -Infinity, Infinity);
    }

    keys() {
      return this.inorder(this.s.root, []);
    }

    height() {
      return H(this.s.root);
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
      if (!this.s.root) {
        S.text('empty', 0, 30, ['c.emptyTree'], { cls: 'dim' });
        return;
      }
      const L = DT.common.drawBinary(S, this.s.root, {
        gap: 22,
        phantom: 44,
        levelGap: 76,
        node: (n) => ({ sub: 'h=' + n.h, badge: fmt(bal(n)) }),
      });
      const keys = this.inorder(this.s.root, []);
      S.text('inorder', 0, (L.maxDepth + 1) * 76 + 14, ['avl.inorder', { l: keys.join('  ') }], {
        cls: 'dim mono',
      });
    }
  }

  AVL.controls = [
    { type: 'input', name: 'key', size: 10, placeholder: 'ctl.keys' },
    { type: 'button', label: 'ctl.insert', op: 'insert', args: ['key'], primary: true },
    { type: 'button', label: 'ctl.delete', op: 'delete', args: ['key'] },
    { type: 'button', label: 'ctl.search', op: 'search', args: ['key'] },
    { type: 'sep' },
    { type: 'button', label: 'ctl.random', op: 'random' },
  ];

  AVL.code = {
    insert: {
      title: { fr: 'Ajout dans un AVL', en: 'AVL insertion' },
      source: 'course',
      lines: [
        'def AVL_Ajout(x, A):',
        '    """ elt * AVL -> AVL',
        '        Renvoie l\'AVL resultant de l\'ajout de x a A."""',
        '    if EstArbreVide(A):',
        '        return ArbreBinaire(x, ArbreVide(), ArbreVide())',
        '    if x == Racine(A):',
        '        return A',
        '    if x < Racine(A):',
        '        return Equilibrage(ArbreBinaire(Racine(A), AVL_Ajout(x, SousArbreGauche(A)), SousArbreDroit(A)))',
        '    else:',
        '        return Equilibrage(ArbreBinaire(Racine(A), SousArbreGauche(A),',
        '                                        AVL_Ajout(x, SousArbreDroit(A))))',
      ],
    },
    balance: {
      title: { fr: 'Rééquilibrage', en: 'Rebalancing' },
      source: 'course',
      lines: [
        'def Equilibrage(A):',
        '    """ ArbreBin -> AVL',
        '        Hypotheses : A est un arbre de recherche,',
        '                     les sous-arbres de A sont des AVL,',
        '                     leurs hauteurs different au plus de 2.',
        '        Renvoie l\'arbre AVL obtenu en reequilibrant l\'arbre initial."""',
        '    G, D = SousArbreGauche(A), SousArbreDroit(A)',
        '    if Hauteur(G) - Hauteur(D) == 2:',
        '        if Hauteur(SousArbreGauche(G)) >= Hauteur(SousArbreDroit(G)):',
        '            return RD(A)',
        '        return RGD(A)',
        '    if Hauteur(G) - Hauteur(D) == -2:',
        '        if Hauteur(SousArbreDroit(D)) >= Hauteur(SousArbreGauche(D)):',
        '            return RG(A)',
        '        return RDG(A)',
        '    return A',
      ],
    },
    rotations: {
      title: { fr: 'Rotations', en: 'Rotations' },
      source: 'site',
      lines: [
        '# RD(<q, <p, U, V>, W>) = <p, U, <q, V, W>>',
        'def RD(A):',
        '    q, P, W = Racine(A), SousArbreGauche(A), SousArbreDroit(A)',
        '    p, U, V = Racine(P), SousArbreGauche(P), SousArbreDroit(P)',
        '    return ArbreBinaire(p, U, ArbreBinaire(q, V, W))',
        '',
        '# RG(<p, U, <q, V, W>>) = <q, <p, U, V>, W>',
        'def RG(A):',
        '    p, U, Q = Racine(A), SousArbreGauche(A), SousArbreDroit(A)',
        '    q, V, W = Racine(Q), SousArbreGauche(Q), SousArbreDroit(Q)',
        '    return ArbreBinaire(q, ArbreBinaire(p, U, V), W)',
        '',
        '# RGD(<q, <p, U, <r, V1, V2>>, W>) = <r, <p, U, V1>, <q, V2, W>>',
        'def RGD(A):  # RG en p, puis RD en q',
        '    return RD(ArbreBinaire(Racine(A), RG(SousArbreGauche(A)), SousArbreDroit(A)))',
        '',
        '# RDG(<q, W, <p, <r, V1, V2>, U>>) = <r, <q, W, V1>, <p, V2, U>>',
        'def RDG(A):  # RD en p, puis RG en q',
        '    return RG(ArbreBinaire(Racine(A), SousArbreGauche(A), RD(SousArbreDroit(A))))',
      ],
    },
    search: {
      title: { fr: 'Recherche dans un AVL', en: 'AVL search' },
      source: 'site',
      lines: [
        'def AVL_Recherche(x, A):',
        '    if EstArbreVide(A): return False',
        '    if x == Racine(A):',
        '        return True',
        '    if x < Racine(A):',
        '        return AVL_Recherche(x, SousArbreGauche(A))',
        '    return AVL_Recherche(x, SousArbreDroit(A))',
      ],
    },
    delete: {
      title: { fr: 'Suppression dans un AVL', en: 'AVL deletion' },
      source: 'site',
      lines: [
        'def AVL_Suppression(x, A):',
        '    """ elt * AVL -> AVL """',
        '    if EstArbreVide(A): return A',
        '    if x < Racine(A):',
        '        return Equilibrage(ArbreBinaire(Racine(A), AVL_Suppression(x, SousArbreGauche(A)), SousArbreDroit(A)))',
        '    if x > Racine(A):',
        '        return Equilibrage(ArbreBinaire(Racine(A), SousArbreGauche(A), AVL_Suppression(x, SousArbreDroit(A))))',
        '    # x == Racine(A)',
        '    if EstArbreVide(SousArbreGauche(A)):',
        '        return SousArbreDroit(A)',
        '    if EstArbreVide(SousArbreDroit(A)):',
        '        return SousArbreGauche(A)',
        '    m = Minimum(SousArbreDroit(A))',
        '    return Equilibrage(ArbreBinaire(m, SousArbreGauche(A), AVL_Suppression(m, SousArbreDroit(A))))',
      ],
    },
  };

  DT.register('avl', AVL);
})();
