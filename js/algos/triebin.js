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

/* Trie binaire (chapitre 3) : clés = lettres codées sur 5 bits, rangées dans les feuilles. */
(function () {
  'use strict';

  const DT = window.DT;
  const BITS = 5;
  const code = (c) => DT.util.letterCode(c, BITS);
  const bit = (c, i) => +code(c)[i - 1];
  const isLeaf = (n) => n.key !== null;

  DT.i18n.add({
    fr: {
      'tb.start': 'On descend selon les bits de {x} = {c}.',
      'tb.bit0': 'Aiguillage : bit {i} de {x} = 0, on descend à gauche.',
      'tb.bit1': 'Aiguillage : bit {i} de {x} = 1, on descend à droite.',
      'tb.split': 'Feuille {y} occupée : Split({x}, {y}, {i}).',
      'tb.same0': 'Bit {i} : {x} et {y} ont tous deux 0 → nouvel aiguillage, on continue à gauche avec le bit {j}.',
      'tb.same1': 'Bit {i} : {x} et {y} ont tous deux 1 → nouvel aiguillage, on continue à droite avec le bit {j}.',
      'tb.diff': 'Bit {i} : {x} a {b}, {y} a {d} → les deux feuilles se séparent.',
      'tb.inserted': '{x} est ajouté.',
      'tb.empty': 'Lien vide : {x} est absent.',
      'tb.leafNe': 'La feuille contient {y} ≠ {x} : {x} est absent.',
      'tb.delLeaf': 'Feuille {x} trouvée : on la supprime.',
      'tb.removed': '{x} est supprimé.',
      'tb.collapse': 'L’aiguillage n’a plus qu’une feuille, {x} : elle remonte à sa place.',
      'tb.stop': 'L’aiguillage sépare encore au moins deux clés : on s’arrête.',
      'tb.bitn': 'bit {i}',
      'tb.codes': 'Codes',
    },
    en: {
      'tb.start': 'Go down following the bits of {x} = {c}.',
      'tb.bit0': 'Switch: bit {i} of {x} = 0, go left.',
      'tb.bit1': 'Switch: bit {i} of {x} = 1, go right.',
      'tb.split': 'Leaf {y} is occupied: Split({x}, {y}, {i}).',
      'tb.same0': 'Bit {i}: {x} and {y} both have 0 → new switch, continue left with bit {j}.',
      'tb.same1': 'Bit {i}: {x} and {y} both have 1 → new switch, continue right with bit {j}.',
      'tb.diff': 'Bit {i}: {x} has {b}, {y} has {d} → the two leaves separate.',
      'tb.inserted': '{x} is inserted.',
      'tb.empty': 'Empty link: {x} is absent.',
      'tb.leafNe': 'The leaf holds {y} ≠ {x}: {x} is absent.',
      'tb.delLeaf': 'Leaf {x} found: remove it.',
      'tb.removed': '{x} is deleted.',
      'tb.collapse': 'The switch has a single leaf left, {x}: it moves up to its place.',
      'tb.stop': 'The switch still separates at least two keys: stop.',
      'tb.bitn': 'bit {i}',
      'tb.codes': 'Codes',
    },
  });

  class TrieBin extends DT.Algo {
    initState() {
      return { nextId: 1, root: null };
    }

    clearMarks() {
      super.clearMarks();
      this.probe = null; // clés affichées avec le bit examiné (hors état)
    }

    /* --- ajout -------------------------------------------------------- */
    insert(x) {
      this.code('insert');
      const id = this.newId();
      const bubble = (at, dx, dy) => this.float('cand', { id, label: x, cls: 'new', at, dx, dy });
      this.probe = { keys: [x], bit: 1 };
      if (!this.s.root) {
        bubble(null);
        this.step(['c.newRoot', { x }], { line: 6 });
        this.float('cand', null);
        this.s.root = { id, key: x, left: null, right: null };
        this.mark(id, 'new');
        this.step(['tb.inserted', { x }], { line: 6 });
        return;
      }
      bubble(this.s.root.id);
      this.step(['tb.start', { x, c: code(x) }], { line: 2 });
      let parent = null;
      let side = null;
      let n = this.s.root;
      let i = 1;
      const attach = (node) => {
        if (!parent) this.s.root = node;
        else parent[side] = node;
      };
      for (;;) {
        this.probe = { keys: [x], bit: i };
        bubble(n.id);
        this.ring(n.id, 'cmp');
        if (isLeaf(n)) {
          if (n.key === x) {
            this.mark(n.id, 'ok');
            this.ring(n.id, 'ok');
            this.step(['c.already', { x }], { line: 9 });
            this.s.nextId--;
            return;
          }
          // Split en cascade
          const d = n.key;
          this.mark(n.id, 'hl');
          this.probe = { keys: [x, d], bit: i };
          this.step(['tb.split', { x, y: d, i }], { line: 11 });
          for (;;) {
            const bc = bit(x, i);
            const bd = bit(d, i);
            this.probe = { keys: [x, d], bit: i };
            const mid = { id: this.newId(), key: null, left: null, right: null };
            if (bc === bd) {
              mid[bc ? 'right' : 'left'] = n;
              attach(mid);
              this.ring(mid.id, 'new');
              this.mark(mid.id, 'new');
              bubble(n.id);
              this.step([bc ? 'tb.same1' : 'tb.same0', { x, y: d, i, j: i + 1 }], { line: bc ? 23 : 21 });
              this.unmark(mid.id);
              parent = mid;
              side = bc ? 'right' : 'left';
              i++;
            } else {
              const leaf = { id, key: x, left: null, right: null };
              mid.left = bc === 0 ? leaf : n;
              mid.right = bc === 0 ? n : leaf;
              attach(mid);
              this.float('cand', null);
              this.ring(null);
              this.mark(mid.id, 'new');
              this.mark(id, 'new');
              this.markEdge(mid.id, id, 'new');
              this.step(['tb.diff', { x, y: d, i, b: bc, d: bd }], { line: bc === 0 ? 25 : 28 });
              this.unmark(n.id);
              this.probe = null;
              this.step(['tb.inserted', { x }], { line: bc === 0 ? 25 : 28 });
              return;
            }
          }
        }
        const b = bit(x, i);
        const s = b ? 'right' : 'left';
        const to = n[s] ? n[s].id : `g:${n.id}:${b}`;
        this.markEdge(n.id, to, 'cmp');
        this.step([b ? 'tb.bit1' : 'tb.bit0', { x, i }], { line: b ? 16 : 13 });
        this.markEdge(n.id, to, 'hl');
        if (!n[s]) {
          this.ring(to, 'hl');
          bubble(to, 0, 0);
          this.probe = { keys: [x], bit: 0 };
          this.step(['c.leafHere', { x }], { line: 6 });
          this.ring(null);
          this.float('cand', null);
          n[s] = { id, key: x, left: null, right: null };
          this.mark(id, 'new');
          this.markEdge(n.id, id, 'new');
          this.step(['tb.inserted', { x }], { line: 6 });
          return;
        }
        parent = n;
        side = s;
        n = n[s];
        i++;
      }
    }

    /* --- recherche ---------------------------------------------------- */
    search(x) {
      this.code('search');
      this.probe = { keys: [x], bit: 1 };
      let n = this.s.root;
      if (!n) {
        this.step(['c.notFound', { x }], { line: 3 });
        return false;
      }
      let i = 1;
      for (;;) {
        this.probe = { keys: [x], bit: i };
        this.float('probe', { id: 'probe', label: x, cls: 'cmp', at: n.id });
        this.ring(n.id, 'cmp');
        if (isLeaf(n)) {
          this.float('probe', null);
          this.probe = null;
          if (n.key === x) {
            this.ring(n.id, 'ok');
            this.mark(n.id, 'ok');
            this.step(['c.found', { x }], { line: 5 });
            return true;
          }
          this.ring(n.id, 'bad');
          this.step(['tb.leafNe', { x, y: n.key }], { line: 5 });
          return false;
        }
        const b = bit(x, i);
        const next = b ? n.right : n.left;
        const to = next ? next.id : `g:${n.id}:${b}`;
        this.markEdge(n.id, to, 'cmp');
        this.step([b ? 'tb.bit1' : 'tb.bit0', { x, i }], { line: b ? 8 : 7 });
        this.markEdge(n.id, to, 'hl');
        if (!next) {
          this.float('probe', { id: 'probe', label: x, cls: 'cmp', at: to, dx: 0, dy: 0 });
          this.ring(to, 'bad');
          this.probe = null;
          this.step(['tb.empty', { x }], { line: 3 });
          return false;
        }
        n = next;
        i++;
      }
    }

    /* --- suppression -------------------------------------------------- */
    delete(x) {
      this.code('delete');
      const path = []; // [{ node, side }] du haut vers le bas
      let n = this.s.root;
      let i = 1;
      while (n && !isLeaf(n)) {
        this.probe = { keys: [x], bit: i };
        this.ring(n.id, 'cmp');
        const b = bit(x, i);
        const s = b ? 'right' : 'left';
        const to = n[s] ? n[s].id : `g:${n.id}:${b}`;
        this.markEdge(n.id, to, 'cmp');
        this.step([b ? 'tb.bit1' : 'tb.bit0', { x, i }], { line: b ? 10 : 8 });
        this.markEdge(n.id, to, 'hl');
        path.push({ node: n, side: s });
        n = n[s];
        i++;
      }
      this.probe = null;
      if (!n) {
        if (path.length) this.ring(`g:${path[path.length - 1].node.id}:${path[path.length - 1].side === 'right' ? 1 : 0}`, 'bad');
        this.step(['tb.empty', { x }], { line: 3 });
        return;
      }
      if (n.key !== x) {
        this.ring(n.id, 'bad');
        this.step(['tb.leafNe', { x, y: n.key }], { line: 6 });
        return;
      }
      this.ring(n.id, 'bad');
      this.mark(n.id, 'bad');
      this.step(['tb.delLeaf', { x }], { line: 5 });
      this.ring(null);
      this.unmark(n.id);
      const setChild = (k, child) => {
        if (k < 0) this.s.root = child;
        else path[k].node[path[k].side] = child;
      };
      setChild(path.length - 1, null);
      this.step(['tb.removed', { x }], { line: 5 });
      // remontée : un aiguillage qui ne contient plus qu'une feuille est remplacé par elle
      for (let k = path.length - 1; k >= 0; k--) {
        const p = path[k].node;
        const only = p.left && !p.right ? p.left : !p.left && p.right ? p.right : null;
        this.ring(p.id, 'cmp');
        if (!only || !isLeaf(only)) {
          this.step(['tb.stop'], { line: 16 });
          return;
        }
        this.mark(only.id, 'hl');
        this.step(['tb.collapse', { x: only.key }], { line: only === p.left ? 15 : 13 });
        setChild(k - 1, only);
        this.ring(only.id, 'ok');
        this.edgeMarks.clear();
        this.step(null, { line: only === p.left ? 15 : 13 });
        this.unmark(only.id);
      }
    }

    random() {
      this.clear();
      const letters = DT.util.shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')).slice(0, 9);
      for (const v of letters) {
        this.step(['op.insert', { x: v }], { op: true, code: null });
        this.insert(v);
        this.clearMarks();
      }
    }

    parse(name, raw) {
      return DT.common.parseLetters(raw);
    }

    /**
     * Invariants : chaque feuille a un code qui commence par son chemin ;
     * chaque aiguillage sépare au moins deux clés (forme canonique, donc
     * indépendante de l'ordre d'insertion).
     */
    check() {
      const ids = new Set();
      const rec = (n, path) => {
        if (!n) return 0;
        if (ids.has(n.id)) throw new Error('id dupliqué ' + n.id);
        ids.add(n.id);
        if (path.length > BITS) throw new Error('profondeur > ' + BITS);
        if (isLeaf(n)) {
          if (n.left || n.right) throw new Error('feuille avec enfants ' + n.key);
          if (!code(n.key).startsWith(path)) throw new Error(`${n.key} mal placée au chemin ${path}`);
          return 1;
        }
        const c = rec(n.left, path + '0') + rec(n.right, path + '1');
        if (c < 2) throw new Error(`aiguillage inutile au chemin ${path} (${c} clé)`);
        return c;
      };
      rec(this.s.root, '');
    }

    keys() {
      const out = [];
      (function rec(n) {
        if (!n) return;
        if (isLeaf(n)) out.push(n.key);
        rec(n.left);
        rec(n.right);
      })(this.s.root);
      return out.sort();
    }

    /** Signature de la forme (pour les tests). */
    shape() {
      return (function rec(n) {
        if (!n) return '.';
        return isLeaf(n) ? n.key : `(${rec(n.left)} ${rec(n.right)})`;
      })(this.s.root);
    }

    /* --- dessin ------------------------------------------------------- */
    draw(S) {
      const root = this.s.root;
      let minX = -60;
      if (!root) {
        S.text('empty', 0, 30, ['c.emptyTree'], { cls: 'dim' });
      } else {
        const kids = new Map();
        const children = (n) => {
          if (n.ghost || isLeaf(n)) return [];
          if (!kids.has(n)) {
            kids.set(n, [n.left || { ghost: true, id: `g:${n.id}:0` }, n.right || { ghost: true, id: `g:${n.id}:1` }]);
          }
          return kids.get(n);
        };
        const L = DT.layout.tree(root, {
          children,
          width: (n) => (n.ghost ? 24 : isLeaf(n) ? 36 : 28),
          gap: 12,
          phantom: 20,
          levelGap: 62,
        });
        for (const [n, p] of L.pos) {
          if (n.ghost) S.node(n.id, { x: p.x, y: p.y, r: 8, label: '', cls: 'ghost' });
          else if (isLeaf(n)) S.node(n.id, { x: p.x, y: p.y, r: 18, label: n.key, title: `${n.key} = ${code(n.key)}` });
          else S.node(n.id, { x: p.x, y: p.y, shape: 'dot', r: 7 });
        }
        for (const [n] of L.pos) {
          if (n.ghost || isLeaf(n)) continue;
          children(n).forEach((c, b) => S.edge(n.id, c.id, { label: String(b), cls: c.ghost ? 'thin faint' : '' }));
        }
        minX = L.minX;
      }
      drawCodes(S, this.keys(), this.probe, minX - 40);
    }
  }

  /** Table des codes ; au-dessus, la ou les clés en cours avec le bit examiné. */
  function drawCodes(S, keys, probe, right) {
    const x0 = right - 92;
    const cur = probe ? probe.keys : [];
    if (keys.length) S.text('codes:title', x0, -6, ['tb.codes'], { cls: 'title', anchor: 'start' });
    keys.forEach((k, j) => {
      S.text('code:' + k, x0, 18 + j * 19, `${k}  ${code(k)}`, { cls: cur.includes(k) ? 'mono hl' : 'mono dim', anchor: 'start' });
    });
    if (!probe) return;
    cur.forEach((key, r) => {
      const y = -46 - 20 * (cur.length - 1 - r);
      const c = code(key);
      S.text(`probe:k${r}`, x0, y, `${key} =`, { cls: r ? 'mono' : 'mono accent', anchor: 'start' });
      for (let k = 0; k < BITS; k++) {
        const on = probe.bit === k + 1;
        S.text(`probe:b${r}:${k}`, x0 + 34 + k * 13, y, c[k], { cls: on ? 'mono hl' : 'mono', anchor: 'middle' });
      }
    });
    if (probe.bit) {
      S.text('probe:cap', x0 + 34 + (probe.bit - 1) * 13, -46 - 20 * cur.length + 2, ['tb.bitn', { i: probe.bit }], { cls: 'dim' });
    }
  }

  TrieBin.controls = [
    { type: 'input', name: 'key', size: 10, placeholder: 'ctl.keys' },
    { type: 'button', label: 'ctl.insert', op: 'insert', args: ['key'], primary: true },
    { type: 'button', label: 'ctl.delete', op: 'delete', args: ['key'] },
    { type: 'button', label: 'ctl.search', op: 'search', args: ['key'] },
    { type: 'sep' },
    { type: 'button', label: 'ctl.random', op: 'random' },
  ];

  TrieBin.code = {
    insert: {
      title: { fr: 'Ajout dans un trie binaire (et Split)', en: 'Binary trie insertion (and Split)' },
      source: 'course',
      lines: [
        'def TrieBin_Ajout(c, A):',
        '    return TrieBin_Ajout_rang(c, 1, A)',
        '',
        'def TrieBin_Ajout_rang(c, i, A):',
        '    if EstArbreVide(A):',
        '        return ArbreBinaire(c, ArbreVide(), ArbreVide())',
        '    if EstArbreVide(SousArbreGauche(A)) and EstArbreVide(SousArbreDroit(A)):',
        '        if c == Racine(A):',
        '            return A',
        '        else:',
        '            return Split(c, Racine(A), i)',
        '    if car(c, i) == 0:',
        '        return ArbreBinaire(Racine(A), TrieBin_Ajout_rang(c, i+1,',
        '                    SousArbreGauche(A)), SousArbreDroit(A))',
        '    else:',
        '        return ArbreBinaire(Racine(A), SousArbreGauche(A),',
        '                    TrieBin_Ajout_rang(c, i+1, SousArbreDroit(A)))',
        '',
        'def Split(c, d, i):',
        '    if car(c, i) == car(d, i) == 0:',
        '        return ArbreBinaire(CleVide(), Split(c, d, i+1), ArbreVide())',
        '    if car(c, i) == car(d, i) == 1:',
        '        return ArbreBinaire(CleVide(), ArbreVide(), Split(c, d, i+1))',
        '    if car(c, i) == 0 and car(d, i) == 1:',
        '        return ArbreBinaire(CleVide(), ArbreBinaire(c, ArbreVide(),',
        '                    ArbreVide()), ArbreBinaire(d, ArbreVide(), ArbreVide()))',
        '    if car(c, i) == 1 and car(d, i) == 0:',
        '        return ArbreBinaire(CleVide(), ArbreBinaire(d, ArbreVide(),',
        '                    ArbreVide()), ArbreBinaire(c, ArbreVide(), ArbreVide()))',
      ],
    },
    search: {
      title: { fr: 'Recherche dans un trie binaire', en: 'Binary trie search' },
      source: 'site',
      lines: [
        'def TrieBin_Recherche(c, i, A):',
        '    if EstArbreVide(A):',
        '        return False',
        '    if EstFeuille(A):',
        '        return c == Racine(A)',
        '    if car(c, i) == 0:',
        '        return TrieBin_Recherche(c, i+1, SousArbreGauche(A))',
        '    return TrieBin_Recherche(c, i+1, SousArbreDroit(A))',
      ],
    },
    delete: {
      title: { fr: 'Suppression dans un trie binaire', en: 'Binary trie deletion' },
      source: 'site',
      lines: [
        'def TrieBin_Suppression(c, i, A):',
        '    if EstArbreVide(A):',
        '        return A',
        '    if EstFeuille(A):',
        '        if c == Racine(A): return ArbreVide()',
        '        return A',
        '    if car(c, i) == 0:',
        '        A = ArbreBinaire(CleVide(), TrieBin_Suppression(c, i+1, SousArbreGauche(A)), SousArbreDroit(A))',
        '    else:',
        '        A = ArbreBinaire(CleVide(), SousArbreGauche(A), TrieBin_Suppression(c, i+1, SousArbreDroit(A)))',
        '    # remontee : un aiguillage avec une seule feuille est remplace par elle',
        '    if EstArbreVide(SousArbreGauche(A)) and EstFeuille(SousArbreDroit(A)):',
        '        return SousArbreDroit(A)',
        '    if EstFeuille(SousArbreGauche(A)) and EstArbreVide(SousArbreDroit(A)):',
        '        return SousArbreGauche(A)',
        '    return A',
      ],
    },
  };

  DT.register('triebin', TrieBin);
})();
