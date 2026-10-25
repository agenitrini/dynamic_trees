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

/* Arbre digital (DST, chapitre 3) : clés = lettres codées sur 5 bits. */
(function () {
  'use strict';

  const DT = window.DT;
  const BITS = 5;
  const code = (c) => DT.util.letterCode(c, BITS);
  /** Bit i (à partir de 1) du code de la lettre c, comme car(c, i) dans le cours. */
  const bit = (c, i) => +code(c)[i - 1];

  DT.i18n.add({
    fr: {
      'dst.start': 'On cherche la place de {x} = {c} en partant du bit 1.',
      'dst.sstart': 'Recherche de {x} = {c} en partant du bit 1.',
      'dst.dstart': 'On cherche {x} = {c} en partant du bit 1.',
      'dst.bit0': '{x} ≠ {y} ; bit {i} de {x} = 0 : on descend à gauche.',
      'dst.bit1': '{x} ≠ {y} ; bit {i} de {x} = 1 : on descend à droite.',
      'dst.empty': 'Sous-arbre vide : {x} est absent.',
      'dst.inserted': '{x} est ajouté au niveau {d} (son code commence par le chemin {p}).',
      'dst.insertedRoot': '{x} est ajouté à la racine.',
      'dst.delLeaf': '{x} est une feuille : on la supprime.',
      'dst.goLeaf': '{x} a des enfants : on descend jusqu’à une feuille de son sous-arbre.',
      'dst.leafFound': '{m} est une feuille du sous-arbre de {x} : son code commence par le chemin de {x}, donc {m} peut prendre sa place.',
      'dst.replaced': '{m} remplace {x} ; l’ancienne feuille {m} disparaît.',
      'dst.removed': '{x} est supprimé.',
      'dst.bitn': 'bit {i}',
      'dst.codes': 'Codes',
    },
    en: {
      'dst.start': 'Look for the place of {x} = {c}, starting from bit 1.',
      'dst.sstart': 'Search for {x} = {c}, starting from bit 1.',
      'dst.dstart': 'Look for {x} = {c}, starting from bit 1.',
      'dst.bit0': '{x} ≠ {y}; bit {i} of {x} = 0: go left.',
      'dst.bit1': '{x} ≠ {y}; bit {i} of {x} = 1: go right.',
      'dst.empty': 'Empty subtree: {x} is absent.',
      'dst.inserted': '{x} is inserted at level {d} (its code starts with the path {p}).',
      'dst.insertedRoot': '{x} is inserted at the root.',
      'dst.delLeaf': '{x} is a leaf: remove it.',
      'dst.goLeaf': '{x} has children: go down to a leaf of its subtree.',
      'dst.leafFound': '{m} is a leaf of the subtree of {x}: its code starts with the path of {x}, so {m} can take its place.',
      'dst.replaced': '{m} replaces {x}; the old leaf {m} disappears.',
      'dst.removed': '{x} is deleted.',
      'dst.bitn': 'bit {i}',
      'dst.codes': 'Codes',
    },
  });

  class DST extends DT.Algo {
    initState() {
      return { nextId: 1, root: null };
    }

    clearMarks() {
      super.clearMarks();
      this.probe = null; // clé en cours (bande de bits affichée), hors état
    }

    /* --- ajout -------------------------------------------------------- */
    insert(x) {
      this.code('insert');
      const id = this.newId();
      const bubble = (at, dx, dy) => this.float('cand', { id, label: x, cls: 'new', at, dx, dy });
      this.probe = { key: x, bit: 1 };
      if (!this.s.root) {
        bubble(null);
        this.step(['c.newRoot', { x }], { line: 8 });
        this.float('cand', null);
        this.s.root = { id, key: x, left: null, right: null };
        this.mark(id, 'new');
        this.step(['dst.insertedRoot', { x }], { line: 8 });
        return;
      }
      bubble(this.s.root.id);
      this.step(['dst.start', { x, c: code(x) }], { line: 3 });
      let n = this.s.root;
      let i = 1;
      let path = '';
      for (;;) {
        this.probe = { key: x, bit: i };
        bubble(n.id);
        this.ring(n.id, 'cmp');
        if (x === n.key) {
          this.mark(n.id, 'ok');
          this.ring(n.id, 'ok');
          this.step(['c.already', { x }], { line: 10 });
          this.s.nextId--; // identifiant inutilisé
          return;
        }
        const b = bit(x, i);
        const side = b ? 'right' : 'left';
        this.markEdge(n.id, n[side] ? n[side].id : `g:${n.id}:${b}`, 'cmp');
        this.step([b ? 'dst.bit1' : 'dst.bit0', { x, y: n.key, i }], { line: b ? 15 : 12 });
        this.markEdge(n.id, n[side] ? n[side].id : `g:${n.id}:${b}`, 'hl');
        path += b;
        if (!n[side]) {
          const g = `g:${n.id}:${b}`;
          this.ring(g, 'hl');
          bubble(g, 0, 0);
          this.probe = { key: x, bit: 0 };
          this.step(['c.leafHere', { x }], { line: 8 });
          this.ring(null);
          this.float('cand', null);
          n[side] = { id, key: x, left: null, right: null };
          this.markEdge(n.id, id, 'new');
          this.mark(id, 'new');
          this.step(['dst.inserted', { x, d: i, p: path }], { line: 8 });
          return;
        }
        this.markEdge(n.id, n[side].id, 'hl');
        n = n[side];
        i++;
      }
    }

    /* --- recherche ---------------------------------------------------- */
    search(x) {
      this.code('search');
      this.probe = { key: x, bit: 1 };
      let n = this.s.root;
      if (!n) {
        this.step(['c.notFound', { x }], { line: 6 });
        return false;
      }
      this.float('probe', { id: 'probe', label: x, cls: 'cmp', at: n.id });
      this.step(['dst.sstart', { x, c: code(x) }], { line: 2 });
      let i = 1;
      for (;;) {
        this.probe = { key: x, bit: i };
        this.float('probe', { id: 'probe', label: x, cls: 'cmp', at: n.id });
        this.ring(n.id, 'cmp');
        if (x === n.key) {
          this.ring(n.id, 'ok');
          this.mark(n.id, 'ok');
          this.float('probe', null);
          this.probe = null;
          this.step(['c.found', { x }], { line: 8 });
          return true;
        }
        const b = bit(x, i);
        const next = b ? n.right : n.left;
        const to = next ? next.id : `g:${n.id}:${b}`;
        this.markEdge(n.id, to, 'cmp');
        this.step([b ? 'dst.bit1' : 'dst.bit0', { x, y: n.key, i }], { line: b ? 11 : 10 });
        this.markEdge(n.id, to, 'hl');
        if (!next) {
          this.float('probe', { id: 'probe', label: x, cls: 'cmp', at: to, dx: 0, dy: 0 });
          this.ring(to, 'bad');
          this.probe = null;
          this.step(['dst.empty', { x }], { line: 6 });
          return false;
        }
        n = next;
        i++;
      }
    }

    /* --- suppression -------------------------------------------------- */
    delete(x) {
      this.code('delete');
      this.probe = { key: x, bit: 1 };
      let parent = null;
      let n = this.s.root;
      let i = 1;
      if (n) this.step(['dst.dstart', { x, c: code(x) }], { line: 1 });
      while (n && n.key !== x) {
        this.probe = { key: x, bit: i };
        this.ring(n.id, 'cmp');
        const b = bit(x, i);
        const next = b ? n.right : n.left;
        const to = next ? next.id : `g:${n.id}:${b}`;
        this.markEdge(n.id, to, 'cmp');
        this.step([b ? 'dst.bit1' : 'dst.bit0', { x, y: n.key, i }], { line: b ? 13 : 11 });
        this.markEdge(n.id, to, 'hl');
        if (!next) this.ring(to, 'bad');
        parent = n;
        n = next;
        i++;
      }
      if (!n) {
        this.probe = null;
        if (!parent) this.ring(null);
        this.step(['c.notFound', { x }], { line: 3 });
        return;
      }
      this.probe = null;
      this.ring(n.id, 'bad');
      this.mark(n.id, 'bad');
      const replace = (p, old, child) => {
        if (!p) this.s.root = child;
        else if (p.left === old) p.left = child;
        else p.right = child;
      };
      if (!n.left && !n.right) {
        this.step(['dst.delLeaf', { x }], { line: 6 });
        this.ring(null);
        replace(parent, n, null);
        this.step(['dst.removed', { x }], { line: 6 });
        return;
      }
      // on descend jusqu'à une feuille f du sous-arbre (à gauche si possible)
      this.step(['dst.goLeaf', { x }], { line: 7 });
      let fp = n;
      let f = n.left || n.right;
      for (;;) {
        this.ring(f.id, 'cmp');
        this.markEdge(fp.id, f.id, 'hl');
        if (!f.left && !f.right) break;
        this.step(null, { line: 7 });
        fp = f;
        f = f.left || f.right;
      }
      this.mark(f.id, 'hl');
      this.ring(f.id, 'hl');
      this.step(['dst.leafFound', { x, m: f.key }], { line: 8 });
      // f quitte sa place de feuille et prend celle de n (même identifiant : animation)
      if (fp.left === f) fp.left = null;
      else fp.right = null;
      f.left = n.left;
      f.right = n.right;
      replace(parent, n, f);
      this.ring(f.id, 'ok');
      this.mark(f.id, 'ok');
      this.edgeMarks.clear();
      this.step(['dst.replaced', { x, m: f.key }], { line: 9 });
    }

    random() {
      this.clear();
      const letters = DT.util.shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')).slice(0, 10);
      for (const v of letters) {
        this.step(['op.insert', { x: v }], { op: true, code: null });
        this.insert(v);
        this.clearMarks();
      }
    }

    parse(name, raw) {
      return DT.common.parseLetters(raw);
    }

    /** Invariants : un nœud de profondeur d a pour d premiers bits le chemin depuis la racine. */
    check() {
      const ids = new Set();
      const keys = new Set();
      (function rec(n, path) {
        if (!n) return;
        if (ids.has(n.id)) throw new Error('id dupliqué ' + n.id);
        ids.add(n.id);
        if (keys.has(n.key)) throw new Error('clé dupliquée ' + n.key);
        keys.add(n.key);
        if (path.length > BITS) throw new Error('profondeur > ' + BITS);
        if (!code(n.key).startsWith(path)) throw new Error(`${n.key} (${code(n.key)}) mal placé au chemin ${path}`);
        rec(n.left, path + '0');
        rec(n.right, path + '1');
      })(this.s.root, '');
    }

    keys() {
      const out = [];
      (function rec(n) {
        if (!n) return;
        out.push(n.key);
        rec(n.left);
        rec(n.right);
      })(this.s.root);
      return out.sort();
    }

    /* --- dessin ------------------------------------------------------- */
    draw(S) {
      const root = this.s.root;
      let minX = -60;
      if (!root) {
        S.text('empty', 0, 30, ['c.emptyTree'], { cls: 'dim' });
      } else {
        // sous-arbres vides dessinés comme dans le cours (petits cercles vides)
        const kids = new Map();
        const children = (n) => {
          if (n.ghost) return [];
          if (!kids.has(n)) {
            kids.set(n, [n.left || { ghost: true, id: `g:${n.id}:0` }, n.right || { ghost: true, id: `g:${n.id}:1` }]);
          }
          return kids.get(n);
        };
        const L = DT.layout.tree(root, {
          children,
          width: (n) => (n.ghost ? 20 : 38),
          gap: 12,
          phantom: 20,
          levelGap: 66,
        });
        for (const [n, p] of L.pos) {
          if (n.ghost) S.node(n.id, { x: p.x, y: p.y, r: 8, label: '', cls: 'ghost' });
          else S.node(n.id, { x: p.x, y: p.y, r: 19, label: n.key, title: `${n.key} = ${code(n.key)}` });
        }
        for (const [n] of L.pos) {
          if (n.ghost) continue;
          children(n).forEach((c, b) => S.edge(n.id, c.id, { label: String(b), cls: c.ghost ? 'thin faint' : '' }));
        }
        minX = L.minX;
      }
      drawCodes(S, this.keys(), this.probe, minX - 40);
    }
  }

  /**
   * Table des codes des clés présentes (comme dans le cours) et, au-dessus,
   * la clé en cours avec le bit examiné en surbrillance.
   */
  function drawCodes(S, keys, probe, right) {
    const x0 = right - 92;
    if (keys.length) S.text('codes:title', x0, -6, ['dst.codes'], { cls: 'title', anchor: 'start' });
    keys.forEach((k, j) => {
      const cls = probe && probe.key === k ? 'mono hl' : 'mono dim';
      S.text('code:' + k, x0, 18 + j * 19, `${k}  ${code(k)}`, { cls, anchor: 'start' });
    });
    if (probe) {
      const y = -46;
      const c = code(probe.key);
      S.text('probe:k', x0, y, `${probe.key} =`, { cls: 'mono accent', anchor: 'start' });
      for (let k = 0; k < BITS; k++) {
        const on = probe.bit === k + 1;
        S.text('probe:b' + k, x0 + 34 + k * 13, y, c[k], { cls: on ? 'mono hl' : 'mono', anchor: 'middle' });
      }
      if (probe.bit) S.text('probe:cap', x0 + 34 + (probe.bit - 1) * 13, y - 18, ['dst.bitn', { i: probe.bit }], { cls: 'dim' });
    }
  }

  DST.controls = [
    { type: 'input', name: 'key', size: 10, placeholder: 'ctl.keys' },
    { type: 'button', label: 'ctl.insert', op: 'insert', args: ['key'], primary: true },
    { type: 'button', label: 'ctl.delete', op: 'delete', args: ['key'] },
    { type: 'button', label: 'ctl.search', op: 'search', args: ['key'] },
    { type: 'sep' },
    { type: 'button', label: 'ctl.random', op: 'random' },
  ];

  DST.code = {
    insert: {
      title: { fr: 'Ajout dans un arbre digital', en: 'Digital search tree insertion' },
      source: 'course',
      lines: [
        'def DST_Ajout(c, A):',
        '    """ S * DST -> DST """',
        '    return DST_Ajout_rang(c, 1, A)',
        '',
        'def DST_Ajout_rang(c, i, A):',
        '    """ S * entier * DST -> DST """',
        '    if EstArbreVide(A):',
        '        return ArbreBinaire(c, ArbreVide(), ArbreVide())',
        '    if c == Racine(A):',
        '        return A',
        '    if car(c, i) == 0:     # la cle est binaire',
        '        return ArbreBinaire(Racine(A), DST_Ajout_rang(c, i+1,',
        '                               SousArbreGauche(A)), SousArbreDroit(A))',
        '    else:',
        '        return ArbreBinaire(Racine(A), SousArbreGauche(A),',
        '                               DST_Ajout_rang(c, i+1, SousArbreDroit(A)))',
      ],
    },
    search: {
      title: { fr: 'Recherche dans un arbre digital', en: 'Digital search tree search' },
      source: 'site',
      lines: [
        'def DST_Recherche(c, A):',
        '    return DST_Recherche_rang(c, 1, A)',
        '',
        'def DST_Recherche_rang(c, i, A):',
        '    if EstArbreVide(A):',
        '        return False',
        '    if c == Racine(A):',
        '        return True',
        '    if car(c, i) == 0:',
        '        return DST_Recherche_rang(c, i+1, SousArbreGauche(A))',
        '    return DST_Recherche_rang(c, i+1, SousArbreDroit(A))',
      ],
    },
    delete: {
      title: { fr: 'Suppression dans un arbre digital', en: 'Digital search tree deletion' },
      source: 'site',
      lines: [
        'def DST_Suppression_rang(c, i, A):',
        '    if EstArbreVide(A):',
        '        return A                  # c absente',
        '    if c == Racine(A):',
        '        if EstArbreVide(SousArbreGauche(A)) and EstArbreVide(SousArbreDroit(A)):',
        '            return ArbreVide()',
        '        f = UneFeuille(A)         # on descend jusqu\'a une feuille',
        '        A = SupprimeFeuille(f, A) # le code de f commence par le chemin de A',
        '        return ArbreBinaire(f, SousArbreGauche(A), SousArbreDroit(A))',
        '    if car(c, i) == 0:',
        '        return ArbreBinaire(Racine(A), DST_Suppression_rang(c, i+1, SousArbreGauche(A)), SousArbreDroit(A))',
        '    else:',
        '        return ArbreBinaire(Racine(A), SousArbreGauche(A), DST_Suppression_rang(c, i+1, SousArbreDroit(A)))',
      ],
    },
  };

  DT.register('dst', DST);
})();
