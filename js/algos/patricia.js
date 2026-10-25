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

/* Trie Patricia / arbre radix sur des mots (chapitre 3). */
(function () {
  'use strict';

  const DT = window.DT;
  const show = (w) => (w === '' ? 'ε' : w);
  const lcp = (a, b) => {
    let k = 0;
    while (k < a.length && k < b.length && a[k] === b[k]) k++;
    return k;
  };
  const labW = (s) => 7.2 * s.length + 8; // largeur d'une étiquette d'arête (cf. renderer)

  DT.i18n.add({
    fr: {
      'pat.start': 'On descend depuis la racine avec « {w} ».',
      'pat.mark': 'Le mot se termine sur ce nœud : il devient terminal ({x} est ajouté).',
      'pat.newEdge': 'Aucune arête ne commence par « {p} » : nouvelle arête « {w} » vers une feuille.',
      'pat.follow': '« {m} » est préfixe de « {w} » : on suit l’arête, il reste « {r} ».',
      'pat.lcp': 'Plus long préfixe commun de « {w} » et de l’arête « {m} » : « {p} ».',
      'pat.split': 'On coupe l’arête « {m} » en « {p} » + « {s} » : nouveau nœud interne.',
      'pat.noEdge': 'Aucune arête ne commence par « {p} » : {x} est absent.',
      'pat.mismatch': '« {m} » n’est pas préfixe de « {w} » : {x} est absent.',
      'pat.notKey': 'Le nœud atteint n’est pas terminal : {x} est absent.',
      'pat.unmark': 'Le nœud de {x} n’est plus terminal.',
      'pat.delLeaf': 'C’est une feuille : on supprime l’arête « {m} ».',
      'pat.merge': 'Nœud non terminal avec un seul enfant : on fusionne « {a} » + « {b} » = « {c} ».',
      'pat.keep': 'Le nœud a encore plusieurs enfants : rien d’autre à faire.',
      'pat.removed': '{x} est supprimé.',
    },
    en: {
      'pat.start': 'Go down from the root with “{w}”.',
      'pat.mark': 'The word ends at this node: it becomes terminal ({x} is inserted).',
      'pat.newEdge': 'No edge starts with “{p}”: new edge “{w}” to a leaf.',
      'pat.follow': '“{m}” is a prefix of “{w}”: follow the edge, “{r}” remains.',
      'pat.lcp': 'Longest common prefix of “{w}” and the edge “{m}”: “{p}”.',
      'pat.split': 'Split the edge “{m}” into “{p}” + “{s}”: new internal node.',
      'pat.noEdge': 'No edge starts with “{p}”: {x} is absent.',
      'pat.mismatch': '“{m}” is not a prefix of “{w}”: {x} is absent.',
      'pat.notKey': 'The node reached is not terminal: {x} is absent.',
      'pat.unmark': 'The node of {x} is no longer terminal.',
      'pat.delLeaf': 'It is a leaf: remove the edge “{m}”.',
      'pat.merge': 'Non-terminal node with a single child: merge “{a}” + “{b}” = “{c}”.',
      'pat.keep': 'The node still has several children: nothing else to do.',
      'pat.removed': '{x} is deleted.',
    },
  });

  const WORDS = 'arbre arc art bal balle ballon banc bas base chat chaton chien cle code coder dame dans de des le les lou loup loups lourd luxe mot mots olive tapis vert ver vers'.split(' ');

  class Patricia extends DT.Algo {
    initState() {
      return { nextId: 2, root: { id: 1, lab: '', key: false, word: '', kids: [] } };
    }

    bubble(name, w, at, cls) {
      const label = show(w);
      this.float(name, { id: name, label, cls, at, shape: 'box', w: Math.max(28, 9 * label.length + 14), h: 24, dx: 0, dy: -30 });
    }

    child(n, c) {
      return n.kids.find((k) => k.lab[0] === c) || null;
    }

    addChild(n, k) {
      n.kids.push(k);
      n.kids.sort((a, b) => (a.lab < b.lab ? -1 : 1));
    }

    /* --- ajout -------------------------------------------------------- */
    insert(x) {
      this.code('insert');
      let n = this.s.root;
      let w = x;
      this.bubble('cand', w, n.id, 'new');
      this.ring(n.id, 'cmp');
      this.step(['pat.start', { w }], { line: 1 });
      for (;;) {
        this.bubble('cand', w, n.id, 'new');
        this.ring(n.id, 'cmp');
        if (w === '') {
          if (n.key) {
            this.mark(n.id, 'ok');
            this.ring(n.id, 'ok');
            this.float('cand', null);
            this.step(['c.already', { x }], { line: 4 });
            return;
          }
          n.key = true;
          n.word = x;
          this.float('cand', null);
          this.mark(n.id, 'new');
          this.step(['pat.mark', { x }], { line: 4 });
          return;
        }
        const c = this.child(n, w[0]);
        if (!c) {
          const leaf = { id: this.newId(), lab: w, key: true, word: x, kids: [] };
          this.addChild(n, leaf);
          this.float('cand', null);
          this.ring(null);
          this.mark(leaf.id, 'new');
          this.markEdge(n.id, leaf.id, 'new');
          this.step(['pat.newEdge', { p: w[0], w }], { line: 8 });
          return;
        }
        const m = c.lab;
        const k = lcp(w, m);
        this.markEdge(n.id, c.id, 'cmp');
        if (k === m.length) {
          this.step(['pat.follow', { m, w, r: show(w.slice(k)) }], { line: 12 });
          this.markEdge(n.id, c.id, 'hl');
          n = c;
          w = w.slice(k);
          continue;
        }
        const p = m.slice(0, k);
        this.step(['pat.lcp', { w, m, p }], { line: 9 });
        // coupe de l'arête : n --p--> mid --m[k:]--> c
        const mid = { id: this.newId(), lab: p, key: false, word: '', kids: [] };
        n.kids[n.kids.indexOf(c)] = mid;
        c.lab = m.slice(k);
        mid.kids.push(c);
        this.edgeMarks.clear();
        this.ring(mid.id, 'new');
        this.mark(mid.id, 'new');
        this.markEdge(n.id, mid.id, 'hl');
        this.step(['pat.split', { m, p, s: c.lab }], { line: 11 });
        this.unmark(mid.id);
        n = mid;
        w = w.slice(k);
      }
    }

    /** Descente commune à la recherche et à la suppression ; renvoie [chemin, nœud | null]. */
    walk(x, line) {
      let n = this.s.root;
      let w = x;
      const path = [n];
      for (;;) {
        this.bubble('probe', w, n.id, 'cmp');
        this.ring(n.id, 'cmp');
        if (w === '') return [path, n];
        const c = this.child(n, w[0]);
        if (!c) {
          this.step(['pat.noEdge', { p: w[0], x }], { line: line.no });
          return [path, null];
        }
        this.markEdge(n.id, c.id, 'cmp');
        if (!w.startsWith(c.lab)) {
          this.ring(c.id, 'bad');
          this.step(['pat.mismatch', { m: c.lab, w, x }], { line: line.no });
          return [path, null];
        }
        this.step(['pat.follow', { m: c.lab, w, r: show(w.slice(c.lab.length)) }], { line: line.follow });
        this.markEdge(n.id, c.id, 'hl');
        w = w.slice(c.lab.length);
        n = c;
        path.push(n);
      }
    }

    /* --- recherche ---------------------------------------------------- */
    search(x) {
      this.code('search');
      const [, n] = this.walk(x, { no: 6, follow: 7 });
      this.float('probe', null);
      if (!n) return false;
      if (!n.key) {
        this.ring(n.id, 'bad');
        this.step(['pat.notKey', { x }], { line: 3 });
        return false;
      }
      this.ring(n.id, 'ok');
      this.mark(n.id, 'ok');
      this.step(['c.found', { x }], { line: 3 });
      return true;
    }

    /* --- suppression -------------------------------------------------- */
    delete(x) {
      this.code('delete');
      const [path, n] = this.walk(x, { no: 4, follow: 2 });
      this.float('probe', null);
      if (!n) return;
      if (!n.key) {
        this.ring(n.id, 'bad');
        this.step(['pat.notKey', { x }], { line: 4 });
        return;
      }
      n.key = false;
      n.word = '';
      this.ring(n.id, 'bad');
      this.mark(n.id, 'bad');
      this.step(['pat.unmark', { x }], { line: 5 });
      this.unmark(n.id);
      let b = n;
      let parent = path[path.length - 2];
      if (b !== this.s.root && b.kids.length === 0) {
        this.markEdge(parent.id, b.id, 'bad');
        this.step(['pat.delLeaf', { m: b.lab }], { line: 7 });
        parent.kids.splice(parent.kids.indexOf(b), 1);
        this.edgeMarks.clear();
        b = parent;
        parent = path[path.length - 3];
        this.ring(b.id, 'cmp');
        this.step(null, { line: 8 });
      }
      if (b !== this.s.root && !b.key && b.kids.length === 1) {
        const c = b.kids[0];
        const merged = b.lab + c.lab;
        this.ring(b.id, 'hl');
        this.markEdge(parent.id, b.id, 'hl');
        this.markEdge(b.id, c.id, 'hl');
        this.step(['pat.merge', { a: b.lab, b: c.lab, c: merged }], { line: 10 });
        c.lab = merged;
        parent.kids[parent.kids.indexOf(b)] = c;
        this.edgeMarks.clear();
        this.markEdge(parent.id, c.id, 'ok');
        this.ring(null);
        this.step(['pat.removed', { x }], { line: 11 });
        return;
      }
      this.ring(null);
      this.step(['pat.removed', { x }], { line: 11 });
    }

    random() {
      this.clear();
      for (const w of DT.util.shuffle(WORDS.slice()).slice(0, 8)) {
        this.step(['op.insert', { x: w }], { op: true, code: null });
        this.insert(w);
        this.clearMarks();
      }
    }

    parse(name, raw) {
      return DT.common.parseWords(raw);
    }

    /** Invariants : arêtes non vides, triées, premiers caractères distincts ; nœud non terminal ⇒ ≥ 2 enfants. */
    check() {
      const ids = new Set();
      const root = this.s.root;
      (function rec(n, pre) {
        if (ids.has(n.id)) throw new Error('id dupliqué ' + n.id);
        ids.add(n.id);
        if (n !== root) {
          if (!n.lab) throw new Error('arête vide');
          if (!n.key && n.kids.length < 2) throw new Error(`nœud inutile en « ${pre} »`);
        }
        if (n.key && n.word !== pre) throw new Error(`mot ${n.word} ≠ ${pre}`);
        for (let i = 1; i < n.kids.length; i++) {
          if (n.kids[i - 1].lab[0] >= n.kids[i].lab[0]) throw new Error(`enfants mal triés en « ${pre} »`);
        }
        for (const k of n.kids) rec(k, pre + k.lab);
      })(root, '');
    }

    keys() {
      const out = [];
      (function rec(n, pre) {
        if (n.key) out.push(pre);
        for (const k of n.kids) rec(k, pre + k.lab);
      })(this.s.root, '');
      return out.sort();
    }

    /* --- dessin ------------------------------------------------------- */
    draw(S) {
      const root = this.s.root;
      const L = DT.layout.tree(root, {
        children: (n) => n.kids,
        // place pour l'étiquette d'arête (posée près de l'enfant) et le mot sous les feuilles
        width: (n) => Math.max(24, n === root ? 0 : labW(n.lab) / 0.72 + 4, n.kids.length ? 0 : 6.6 * n.word.length + 10),
        gap: 10,
        levelGap: 74,
      });
      for (const [n, p] of L.pos) {
        const spec = { x: p.x, y: p.y, title: n.key ? n.word : '' };
        if (n.key) Object.assign(spec, { shape: 'dot', r: 8 });
        else Object.assign(spec, { shape: 'circle', r: n === root ? 9 : 8, label: '' });
        if (n.key && !n.kids.length) spec.sub = n.word;
        S.node(n.id, spec);
      }
      for (const [n] of L.pos) for (const k of n.kids) S.edge(n.id, k.id, { label: k.lab, labelAt: 0.72 });
      if (!root.kids.length) S.text('empty', 0, 40, ['c.emptyTree'], { cls: 'dim' });
    }
  }

  Patricia.controls = [
    { type: 'input', name: 'key', size: 14, placeholder: 'ctl.word' },
    { type: 'button', label: 'ctl.insert', op: 'insert', args: ['key'], primary: true },
    { type: 'button', label: 'ctl.delete', op: 'delete', args: ['key'] },
    { type: 'button', label: 'ctl.search', op: 'search', args: ['key'] },
    { type: 'sep' },
    { type: 'button', label: 'ctl.random', op: 'random' },
  ];

  Patricia.code = {
    insert: {
      title: { fr: 'Ajout dans un trie Patricia', en: 'Patricia trie insertion' },
      source: 'site',
      lines: [
        'def Patricia_Ajout(c, A):',
        '    """ mot * Patricia -> Patricia """',
        '    if lgueur(c) == 0:',
        '        MarqueCle(A)              # A represente une cle',
        '        return A',
        '    m, B = Arete(A, prem(c))      # arete de mot m vers B',
        '    if B is None:',
        '        return AjoutArete(A, c, FeuilleCle())',
        '    k = lgueur(PlusLongPrefixeCommun(c, m))',
        '    if k < lgueur(m):             # on coupe l\'arete au prefixe commun',
        '        B = CoupeArete(A, m, k)   # m[:k] -> noeud -> m[k:]',
        '    Patricia_Ajout(c[k:], B)',
        '    return A',
      ],
    },
    search: {
      title: { fr: 'Recherche dans un trie Patricia', en: 'Patricia trie search' },
      source: 'site',
      lines: [
        'def Patricia_Recherche(c, A):',
        '    if lgueur(c) == 0:',
        '        return EstCle(A)',
        '    m, B = Arete(A, prem(c))',
        '    if B is None or not EstPrefixe(m, c):',
        '        return False',
        '    return Patricia_Recherche(c[lgueur(m):], B)',
      ],
    },
    delete: {
      title: { fr: 'Suppression dans un trie Patricia', en: 'Patricia trie deletion' },
      source: 'site',
      lines: [
        'def Patricia_Suppression(c, A):',
        '    B = Noeud(c, A)               # descente comme pour la recherche',
        '    if B is None or not EstCle(B):',
        '        return A                  # c absente',
        '    DemarqueCle(B)',
        '    if EstFeuille(B):',
        '        SupprimeArete(Pere(B), B)',
        '        B = Pere(B)',
        '    if B != A and not EstCle(B) and NbEnfants(B) == 1:',
        '        FusionneArete(B)          # m1 -> B -> m2 devient m1 + m2',
        '    return A',
      ],
    },
  };

  DT.register('patricia', Patricia);
})();
