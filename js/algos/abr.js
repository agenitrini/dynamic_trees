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

/* Arbre binaire de recherche (chapitre 3). */
(function () {
  'use strict';

  const DT = window.DT;

  DT.i18n.add({
    fr: {
      'abr.inorder': 'Parcours infixe : {l}',
      'abr.min': 'Minimum du sous-arbre droit : {m}.',
      'abr.goMin': 'On cherche le minimum du sous-arbre droit de {x} (on descend à gauche).',
      'abr.del0': '{x} est une feuille : on la supprime.',
      'abr.del1': '{x} n’a qu’un enfant : il prend sa place.',
      'abr.del2': '{x} a deux enfants : il est remplacé par {m}, minimum de son sous-arbre droit.',
      'abr.replaced': '{m} remplace {x}.',
      'abr.inserted': '{x} est ajouté.',
    },
    en: {
      'abr.inorder': 'In-order traversal: {l}',
      'abr.min': 'Minimum of the right subtree: {m}.',
      'abr.goMin': 'Look for the minimum of the right subtree of {x} (go left).',
      'abr.del0': '{x} is a leaf: remove it.',
      'abr.del1': '{x} has only one child: it takes its place.',
      'abr.del2': '{x} has two children: it is replaced by {m}, the minimum of its right subtree.',
      'abr.replaced': '{m} replaces {x}.',
      'abr.inserted': '{x} is inserted.',
    },
  });

  class ABR extends DT.Algo {
    initState() {
      return { nextId: 1, root: null };
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
        this.step(['abr.inserted', { x }], { line: 4 });
        return;
      }
      let n = this.s.root;
      for (;;) {
        bubble(n.id);
        this.ring(n.id, 'cmp');
        if (x === n.key) {
          this.mark(n.id, 'ok');
          this.step(['c.already', { x }], { line: 6 });
          this.s.nextId--; // identifiant inutilisé
          return;
        }
        const side = x < n.key ? 'left' : 'right';
        this.step([x < n.key ? 'c.cmpLess' : 'c.cmpMore', { x, y: n.key }], { line: x < n.key ? 8 : 10 });
        if (!n[side]) {
          this.ring(null);
          this.float('cand', null);
          n[side] = { id, key: x, left: null, right: null };
          this.mark(id, 'new');
          this.step(['c.leafHere', { x }], { line: 4 });
          return;
        }
        n = n[side];
      }
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
      let parent = null;
      let n = this.s.root;
      while (n && n.key !== x) {
        this.ring(n.id, 'cmp');
        this.step([x < n.key ? 'c.cmpLess' : 'c.cmpMore', { x, y: n.key }], { line: x < n.key ? 4 : 6 });
        parent = n;
        n = x < n.key ? n.left : n.right;
      }
      if (!n) {
        this.ring(parent ? parent.id : null, 'bad');
        this.step(['c.notFound', { x }], { line: 2 });
        return;
      }
      this.ring(n.id, 'bad');
      this.mark(n.id, 'bad');
      const replace = (child) => {
        if (!parent) this.s.root = child;
        else if (parent.left === n) parent.left = child;
        else parent.right = child;
      };
      if (!n.left || !n.right) {
        const child = n.left || n.right;
        this.step([child ? 'abr.del1' : 'abr.del0', { x }], { line: n.left ? 11 : 9 });
        this.ring(null);
        replace(child);
        this.step(null, { line: n.left ? 11 : 9 });
        return;
      }
      // deux enfants : le minimum du sous-arbre droit prend la place de n
      this.step(['abr.goMin', { x }], { line: 12 });
      let mp = n;
      let m = n.right;
      this.ring(m.id, 'cmp');
      this.step(null, { line: 12 });
      while (m.left) {
        mp = m;
        m = m.left;
        this.ring(m.id, 'cmp');
        this.step(null, { line: 12 });
      }
      this.mark(m.id, 'hl');
      this.ring(m.id, 'hl');
      this.step(['abr.del2', { x, m: m.key }], { line: 13 });
      // on détache m (son éventuel enfant droit remonte), puis m remplace n
      if (mp === n) mp.right = m.right;
      else mp.left = m.right;
      m.left = n.left;
      m.right = n.right;
      replace(m);
      this.ring(null);
      this.unmark(n.id);
      this.step(['abr.replaced', { x, m: m.key }], { line: 13 });
    }

    random() {
      this.clear();
      for (const v of DT.util.randDistinct(10, 1, 99)) {
        this.step(['op.insert', { x: v }], { op: true, code: null });
        this.insert(v);
        this.clearMarks();
      }
    }

    /** Invariants (utilisé par les tests) : propriété d'ABR, identifiants uniques. */
    check() {
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
      if (!this.s.root) {
        S.text('empty', 0, 30, ['c.emptyTree'], { cls: 'dim' });
        return;
      }
      const L = DT.common.drawBinary(S, this.s.root);
      const keys = this.inorder(this.s.root, []);
      S.text('inorder', 0, (L.maxDepth + 1) * 70 + 10, ['abr.inorder', { l: keys.join('  ') }], {
        cls: 'dim mono',
      });
    }
  }

  ABR.controls = [
    { type: 'input', name: 'key', size: 10, placeholder: 'ctl.keys' },
    { type: 'button', label: 'ctl.insert', op: 'insert', args: ['key'], primary: true },
    { type: 'button', label: 'ctl.delete', op: 'delete', args: ['key'] },
    { type: 'button', label: 'ctl.search', op: 'search', args: ['key'] },
    { type: 'sep' },
    { type: 'button', label: 'ctl.random', op: 'random' },
  ];

  ABR.code = {
    insert: {
      title: { fr: 'Ajout dans un ABR', en: 'BST insertion' },
      source: 'course',
      lines: [
        'def ABR_Ajout(e, A):',
        '    """ elt * ArbreBin -> ArbreBin """',
        '    if EstArbreVide(A):',
        '        return ArbreBinaire(e, ArbreVide(), ArbreVide())',
        '    elif e == Racine(A):',
        '        return A',
        '    elif e < Racine(A):',
        '        return ArbreBinaire(Racine(A), ABR_Ajout(e, SousArbreGauche(A)), SousArbreDroit(A))',
        '    else:',
        '        return ArbreBinaire(Racine(A), SousArbreGauche(A), ABR_Ajout(e, SousArbreDroit(A)))',
      ],
    },
    search: {
      title: { fr: 'Recherche dans un ABR', en: 'BST search' },
      source: 'site',
      lines: [
        'def ABR_Recherche(e, A):',
        '    if EstArbreVide(A): return False',
        '    if e == Racine(A):',
        '        return True',
        '    if e < Racine(A):',
        '        return ABR_Recherche(e, SousArbreGauche(A))',
        '    return ABR_Recherche(e, SousArbreDroit(A))',
      ],
    },
    delete: {
      title: { fr: 'Suppression dans un ABR', en: 'BST deletion' },
      source: 'site',
      lines: [
        'def ABR_Suppression(e, A):',
        '    if EstArbreVide(A): return A',
        '    if e < Racine(A):',
        '        return ArbreBinaire(Racine(A), ABR_Suppression(e, SousArbreGauche(A)), SousArbreDroit(A))',
        '    if e > Racine(A):',
        '        return ArbreBinaire(Racine(A), SousArbreGauche(A), ABR_Suppression(e, SousArbreDroit(A)))',
        '    # e == Racine(A)',
        '    if EstArbreVide(SousArbreGauche(A)):',
        '        return SousArbreDroit(A)',
        '    if EstArbreVide(SousArbreDroit(A)):',
        '        return SousArbreGauche(A)',
        '    m = Minimum(SousArbreDroit(A))',
        '    return ArbreBinaire(m, SousArbreGauche(A), ABR_Suppression(m, SousArbreDroit(A)))',
      ],
    },
  };

  DT.register('abr', ABR);
})();
