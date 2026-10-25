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

/* Trie hybride (arbre ternaire de recherche, chapitre 3) : valeur = numéro d'insertion. */
(function () {
  'use strict';

  const DT = window.DT;
  const show = (w) => (w === '' ? 'ε' : w);

  DT.i18n.add({
    fr: {
      'th.start': 'Ajout de « {w} » avec la valeur {v}.',
      'th.less': 'prem(« {w} ») = {p} < {r} : on descend par le lien Inf.',
      'th.more': 'prem(« {w} ») = {p} > {r} : on descend par le lien Sup.',
      'th.eq': 'prem(« {w} ») = {p} = {r} : on descend par le lien Eq avec reste = « {s} ».',
      'th.newLast': 'Lien vide et lgueur(c) = 1 : nouveau nœud {p} avec la valeur {v}.',
      'th.newNode': 'Lien vide : nouveau nœud {p} sans valeur, on continue avec reste = « {s} » par le lien Eq.',
      'th.store': 'prem(« {w} ») = {p} = {r} et lgueur(c) = 1 : on enregistre la valeur {v} dans ce nœud.',
      'th.replace': '« {x} » était déjà présent : sa valeur {o} est remplacée par {v}.',
      'th.inserted': '« {x} » est ajouté (valeur {v}).',
      'th.sEq': 'prem(« {w} ») = {p} = {r} : lien Eq, reste = « {s} ».',
      'th.empty': 'Lien vide : « {x} » est absent.',
      'th.noVal': 'Le nœud {p} n’a pas de valeur : « {x} » est absent (c’est seulement un préfixe).',
      'th.found': 'Le nœud {p} a la valeur {v} : « {x} » est présent.',
      'th.clear': 'On efface la valeur {v} du nœud {p}.',
      'th.useless0': 'Le nœud {p} n’a plus ni valeur, ni lien Eq, ni autre lien : on le supprime.',
      'th.useless1': 'Le nœud {p} n’a plus ni valeur ni lien Eq : son unique sous-arbre ({q}) prend sa place.',
      'th.useless2': 'Le nœud {p} n’a plus ni valeur ni lien Eq, mais a des liens Inf et Sup : Fusion(Inf, Sup).',
      'th.fusLess': 'Fusion : {a} < {b}, on continue dans le lien Sup de {a}.',
      'th.fusMore': 'Fusion : {a} > {b}, on continue dans le lien Inf de {b}.',
      'th.fusEq': 'Fusion : {a} = {b}, on fusionne les liens Eq.',
      'th.fused': 'Le sous-arbre Sup est accroché ; le résultat de la fusion remplace {p}.',
      'th.keep': 'Le nœud {p} a une valeur ou un lien Eq : on s’arrête.',
      'th.removed': '« {x} » est supprimé.',
      'th.legendEq': 'lien Eq',
      'th.legendKey': 'nœud avec valeur (clé)',
    },
    en: {
      'th.start': 'Insert “{w}” with value {v}.',
      'th.less': 'prem(“{w}”) = {p} < {r}: go down the Inf link.',
      'th.more': 'prem(“{w}”) = {p} > {r}: go down the Sup link.',
      'th.eq': 'prem(“{w}”) = {p} = {r}: go down the Eq link with reste = “{s}”.',
      'th.newLast': 'Empty link and lgueur(c) = 1: new node {p} with value {v}.',
      'th.newNode': 'Empty link: new node {p} without value, continue with reste = “{s}” through the Eq link.',
      'th.store': 'prem(“{w}”) = {p} = {r} and lgueur(c) = 1: store the value {v} in this node.',
      'th.replace': '“{x}” was already present: its value {o} is replaced by {v}.',
      'th.inserted': '“{x}” is inserted (value {v}).',
      'th.sEq': 'prem(“{w}”) = {p} = {r}: Eq link, reste = “{s}”.',
      'th.empty': 'Empty link: “{x}” is absent.',
      'th.noVal': 'Node {p} has no value: “{x}” is absent (it is only a prefix).',
      'th.found': 'Node {p} has value {v}: “{x}” is present.',
      'th.clear': 'Clear the value {v} from node {p}.',
      'th.useless0': 'Node {p} has neither value, nor Eq link, nor any other link: remove it.',
      'th.useless1': 'Node {p} has neither value nor Eq link: its only subtree ({q}) takes its place.',
      'th.useless2': 'Node {p} has neither value nor Eq link, but has Inf and Sup links: Fusion(Inf, Sup).',
      'th.fusLess': 'Fusion: {a} < {b}, continue in the Sup link of {a}.',
      'th.fusMore': 'Fusion: {a} > {b}, continue in the Inf link of {b}.',
      'th.fusEq': 'Fusion: {a} = {b}, merge the Eq links.',
      'th.fused': 'The Sup subtree is attached; the result of the fusion replaces {p}.',
      'th.keep': 'Node {p} has a value or an Eq link: stop.',
      'th.removed': '“{x}” is deleted.',
      'th.legendEq': 'Eq link',
      'th.legendKey': 'node with a value (key)',
    },
  });

  const WORDS = 'arbre arc art bal balle ballon banc bas base chat chaton chien cle code coder dame dans de des le les lou loup loups lourd luxe mot mots olive tapis vert ver vers'.split(' ');

  class TrieH extends DT.Algo {
    initState() {
      return { nextId: 1, count: 0, root: null };
    }

    bubble(name, w, at, cls) {
      const label = show(w);
      const spec = { id: name, label, cls, shape: 'box', w: Math.max(28, 9 * label.length + 14), h: 24 };
      if (at) Object.assign(spec, { at, dx: 0, dy: -38 });
      else Object.assign(spec, { x: 0, y: -40 });
      this.float(name, spec);
    }

    /** Lien (parent, côté) : lecture et écriture ; parent null = racine. */
    get(l) {
      return l.parent ? l.parent[l.side] : this.s.root;
    }

    set(l, node) {
      if (l.parent) l.parent[l.side] = node;
      else this.s.root = node;
    }

    /* --- ajout -------------------------------------------------------- */
    insert(x) {
      this.code('insert');
      const v = this.s.count++;
      let link = { parent: null, side: null };
      let c = x;
      this.bubble('cand', c, this.s.root ? this.s.root.id : null, 'new');
      if (this.s.root) this.ring(this.s.root.id, 'cmp');
      this.step(['th.start', { w: x, v }], { line: 1 });
      for (;;) {
        const n = this.get(link);
        const p = c[0];
        if (!n) {
          const node = { id: this.newId(), ch: p, val: null, inf: null, eq: null, sup: null };
          this.set(link, node);
          this.mark(node.id, 'new');
          this.ring(node.id, 'new');
          if (link.parent) this.markEdge(link.parent.id, node.id, 'new');
          if (c.length === 1) {
            node.val = v;
            this.float('cand', null);
            this.step(['th.newLast', { p, v }], { line: 5 });
            this.ring(node.id, 'ok');
            this.step(['th.inserted', { x, v }], { line: 5 });
            return;
          }
          const s = c.slice(1);
          this.bubble('cand', s, node.id, 'new');
          this.step(['th.newNode', { p, s }], { line: 7 });
          this.unmark(node.id);
          link = { parent: node, side: 'eq' };
          c = s;
          continue;
        }
        this.bubble('cand', c, n.id, 'new');
        this.ring(n.id, 'cmp');
        if (p !== n.ch) {
          const side = p < n.ch ? 'inf' : 'sup';
          if (n[side]) this.markEdge(n.id, n[side].id, 'cmp');
          this.step([p < n.ch ? 'th.less' : 'th.more', { w: c, p, r: n.ch }], { line: p < n.ch ? 11 : 13 });
          if (n[side]) this.markEdge(n.id, n[side].id, 'hl');
          link = { parent: n, side };
          continue;
        }
        if (c.length === 1) {
          const old = n.val;
          this.ring(n.id, 'hl');
          this.step(['th.store', { w: c, p, r: n.ch, v }], { line: 15 });
          this.float('cand', null);
          n.val = v;
          this.mark(n.id, 'new');
          this.ring(n.id, 'ok');
          this.step(old === null ? ['th.inserted', { x, v }] : ['th.replace', { x, o: old, v }], { line: 15 });
          return;
        }
        const s = c.slice(1);
        if (n.eq) this.markEdge(n.id, n.eq.id, 'cmp');
        this.step(['th.eq', { w: c, p, r: n.ch, s }], { line: 16 });
        if (n.eq) this.markEdge(n.id, n.eq.id, 'hl');
        link = { parent: n, side: 'eq' };
        c = s;
      }
    }

    /** Descente (recherche, suppression) ; renvoie le chemin de liens jusqu'au nœud final, ou null. */
    walk(x, lines) {
      let link = { parent: null, side: null };
      let c = x;
      const path = [];
      for (;;) {
        const n = this.get(link);
        if (!n) {
          this.float('probe', null);
          if (link.parent) this.ring(link.parent.id, 'bad');
          this.step(['th.empty', { x }], { line: lines.empty });
          return null;
        }
        path.push(link);
        const p = c[0];
        this.bubble('probe', c, n.id, 'cmp');
        this.ring(n.id, 'cmp');
        if (p !== n.ch) {
          const side = p < n.ch ? 'inf' : 'sup';
          if (n[side]) this.markEdge(n.id, n[side].id, 'cmp');
          this.step([p < n.ch ? 'th.less' : 'th.more', { w: c, p, r: n.ch }], { line: p < n.ch ? lines.less : lines.more });
          if (n[side]) this.markEdge(n.id, n[side].id, 'hl');
          link = { parent: n, side };
          continue;
        }
        if (c.length === 1) {
          this.float('probe', null);
          return path;
        }
        const s = c.slice(1);
        if (n.eq) this.markEdge(n.id, n.eq.id, 'cmp');
        this.step(['th.sEq', { w: c, p, r: n.ch, s }], { line: lines.eq });
        if (n.eq) this.markEdge(n.id, n.eq.id, 'hl');
        link = { parent: n, side: 'eq' };
        c = s;
      }
    }

    /* --- recherche ---------------------------------------------------- */
    search(x) {
      this.code('search');
      const path = this.walk(x, { empty: 2, less: 5, more: 7, eq: 10 });
      if (!path) return false;
      const n = this.get(path[path.length - 1]);
      if (n.val === null) {
        this.ring(n.id, 'bad');
        this.step(['th.noVal', { x, p: n.ch }], { line: 9 });
        return false;
      }
      this.ring(n.id, 'ok');
      this.mark(n.id, 'ok');
      this.step(['th.found', { x, p: n.ch, v: n.val }], { line: 9 });
      return true;
    }

    /* --- suppression -------------------------------------------------- */
    delete(x) {
      this.code('delete');
      const path = this.walk(x, { empty: 2, less: 5, more: 7, eq: 11 });
      if (!path) return;
      const t = this.get(path[path.length - 1]);
      if (t.val === null) {
        this.ring(t.id, 'bad');
        this.step(['th.noVal', { x, p: t.ch }], { line: 9 });
        return;
      }
      this.mark(t.id, 'bad');
      this.ring(t.id, 'bad');
      this.step(['th.clear', { p: t.ch, v: t.val }], { line: 9 });
      t.val = null;
      this.unmark(t.id);
      // nettoyage en remontant : nœud sans valeur ni lien Eq
      for (let k = path.length - 1; k >= 0; k--) {
        const link = path[k];
        const n = this.get(link);
        this.edgeMarks.clear();
        this.ring(n.id, 'cmp');
        if (n.val !== null || n.eq) {
          this.step(['th.keep', { p: n.ch }], { line: 17 });
          break;
        }
        this.mark(n.id, 'bad');
        if (!n.inf && !n.sup) {
          this.step(['th.useless0', { p: n.ch }], { line: 14 });
          this.set(link, null);
        } else if (!n.inf || !n.sup) {
          const only = n.inf || n.sup;
          this.markEdge(n.id, only.id, 'hl');
          this.step(['th.useless1', { p: n.ch, q: n.inf ? 'Inf' : 'Sup' }], { line: n.inf ? 15 : 14 });
          this.set(link, only);
        } else {
          this.step(['th.useless2', { p: n.ch }], { line: 16 });
          const res = this.fusion(n.inf, n.sup);
          this.set(link, res);
          this.ring(res.id, 'ok');
          this.edgeMarks.clear();
          this.step(['th.fused', { p: n.ch }], { line: 16 });
        }
        this.unmark(n.id);
        this.ring(null);
        this.step(null, { line: 13 });
      }
      this.ring(null);
      this.step(['th.removed', { x }], { line: 17 });
    }

    /**
     * Fusion(A, B) du code PSTL (toutes les lettres de A sont inférieures à
     * celles de B dans l'usage qui en est fait). Les étapes sont enregistrées
     * à la descente, les modifications ont lieu à la remontée.
     */
    fusion(A, B) {
      if (!A) return B;
      if (!B) return A;
      this.ring(A.id, 'cmp', 'fa');
      this.ring(B.id, 'cmp', 'fb');
      if (A.ch < B.ch) {
        this.step(['th.fusLess', { a: A.ch, b: B.ch }], { line: 23 });
        this.ring(null, null, 'fa');
        this.ring(null, null, 'fb');
        A.sup = this.fusion(A.sup, B);
        return A;
      }
      if (A.ch > B.ch) {
        this.step(['th.fusMore', { a: A.ch, b: B.ch }], { line: 25 });
        this.ring(null, null, 'fa');
        this.ring(null, null, 'fb');
        B.inf = this.fusion(A, B.inf);
        return B;
      }
      this.step(['th.fusEq', { a: A.ch, b: B.ch }], { line: 26 });
      this.ring(null, null, 'fa');
      this.ring(null, null, 'fb');
      A.eq = this.fusion(A.eq, B.eq);
      if (A.val === null) A.val = B.val;
      return A;
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

    /** Invariants : ordre ABR sur chaque niveau (Inf < car < Sup), aucun nœud sans valeur ni lien Eq. */
    check() {
      const ids = new Set();
      (function rec(n, lo, hi, pre) {
        if (!n) return;
        if (ids.has(n.id)) throw new Error('id dupliqué ' + n.id);
        ids.add(n.id);
        if (!(n.ch > lo && n.ch < hi)) throw new Error(`ordre violé en ${pre}${n.ch}`);
        if (n.val === null && !n.eq) throw new Error(`nœud inutile ${pre}${n.ch}`);
        rec(n.inf, lo, n.ch, pre);
        rec(n.sup, n.ch, hi, pre);
        rec(n.eq, '', '{', pre + n.ch);
      })(this.s.root, '', '{', '');
    }

    keys() {
      const out = [];
      (function rec(n, pre) {
        if (!n) return;
        rec(n.inf, pre);
        if (n.val !== null) out.push(pre + n.ch);
        rec(n.eq, pre + n.ch);
        rec(n.sup, pre);
      })(this.s.root, '');
      return out.sort();
    }

    /* --- dessin ------------------------------------------------------- */
    draw(S) {
      const root = this.s.root;
      if (!root) {
        S.text('empty', 0, 30, ['c.emptyTree'], { cls: 'dim' });
        return;
      }
      const L = DT.layout.tree(root, {
        children: (n) => (n.inf || n.eq || n.sup ? [n.inf, n.eq, n.sup] : []),
        width: () => 36,
        gap: 10,
        phantom: 10,
        levelGap: 64,
      });
      for (const [n, p] of L.pos) {
        const spec = { x: p.x, y: p.y, r: 16, label: n.ch };
        if (n.val !== null) Object.assign(spec, { cls: 'key', badge: String(n.val) });
        S.node(n.id, spec);
      }
      for (const [n] of L.pos) {
        if (n.inf) S.edge(n.id, n.inf.id, { label: '<', cls: 'thin' });
        if (n.eq) S.edge(n.id, n.eq.id, { cls: 'eq' });
        if (n.sup) S.edge(n.id, n.sup.id, { label: '>', cls: 'thin' });
      }
    }
  }

  TrieH.legend = [
    ['var(--accent-2)', ['th.legendEq']],
    ['var(--node-stroke)', ['th.legendKey']],
  ];

  TrieH.controls = [
    { type: 'input', name: 'key', size: 14, placeholder: 'ctl.word' },
    { type: 'button', label: 'ctl.insert', op: 'insert', args: ['key'], primary: true },
    { type: 'button', label: 'ctl.delete', op: 'delete', args: ['key'] },
    { type: 'button', label: 'ctl.search', op: 'search', args: ['key'] },
    { type: 'sep' },
    { type: 'button', label: 'ctl.random', op: 'random' },
  ];

  TrieH.code = {
    insert: {
      title: { fr: 'Ajout dans un trie hybride', en: 'Hybrid trie insertion' },
      source: 'course',
      lines: [
        'def TH_Ajout(c, A, v):',
        '    """ cle * TrieH * valeur -> trieH """',
        '    if EstVide(A):',
        '        if lgueur(c) == 1:',
        '            return TrieH(prem(c), TH_Vide(), TH_Vide(), TH_Vide(), v)',
        '        else:',
        '            return TrieH(prem(c), TH_Vide(), TH_Ajout(reste(c), TH_Vide(), v), TH_Vide(), ValVide())',
        '    else:',
        '        p = prem(c)',
        '        if p < Rac(A):',
        '            return TrieH(Rac(A), TH_Ajout(c, Inf(A), v), Eq(A), Sup(A), Val(A))',
        '        if p > Rac(A):',
        '            return TrieH(Rac(A), Inf(A), Eq(A), TH_Ajout(c, Sup(A), v), Val(A))',
        '        if lgueur(c) == 1:   # cas ajoute : c se termine sur ce noeud',
        '            return TrieH(Rac(A), Inf(A), Eq(A), Sup(A), v)',
        '        return TrieH(Rac(A), Inf(A), TH_Ajout(reste(c), Eq(A), v), Sup(A), Val(A))',
      ],
    },
    search: {
      title: { fr: 'Recherche dans un trie hybride', en: 'Hybrid trie search' },
      source: 'site',
      lines: [
        'def TH_Recherche(c, A):',
        '    if EstVide(A): return False',
        '    p = prem(c)',
        '    if p < Rac(A):',
        '        return TH_Recherche(c, Inf(A))',
        '    if p > Rac(A):',
        '        return TH_Recherche(c, Sup(A))',
        '    if lgueur(c) == 1:',
        '        return Val(A) != ValVide()',
        '    return TH_Recherche(reste(c), Eq(A))',
      ],
    },
    delete: {
      title: { fr: 'Suppression dans un trie hybride (PSTL)', en: 'Hybrid trie deletion (PSTL)' },
      source: 'pstl',
      lines: [
        'def TH_Suppression(c, A):',
        '    if EstVide(A): return A',
        '    p = prem(c)',
        '    if p < Rac(A):',
        '        A = TrieH(Rac(A), TH_Suppression(c, Inf(A)), Eq(A), Sup(A), Val(A))',
        '    elif p > Rac(A):',
        '        A = TrieH(Rac(A), Inf(A), Eq(A), TH_Suppression(c, Sup(A)), Val(A))',
        '    elif lgueur(c) == 1:',
        '        A = TrieH(Rac(A), Inf(A), Eq(A), Sup(A), ValVide())',
        '    else:',
        '        A = TrieH(Rac(A), Inf(A), TH_Suppression(reste(c), Eq(A)), Sup(A), Val(A))',
        '    # nettoyage : noeud sans valeur ni lien Eq',
        '    if Val(A) == ValVide() and EstVide(Eq(A)):',
        '        if EstVide(Inf(A)): return Sup(A)',
        '        if EstVide(Sup(A)): return Inf(A)',
        '        return Fusion(Inf(A), Sup(A))',
        '    return A',
        '',
        'def Fusion(A, B):',
        '    if EstVide(A): return B',
        '    if EstVide(B): return A',
        '    if Rac(A) < Rac(B):',
        '        return TrieH(Rac(A), Inf(A), Eq(A), Fusion(Sup(A), B), Val(A))',
        '    if Rac(A) > Rac(B):',
        '        return TrieH(Rac(B), Fusion(A, Inf(B)), Eq(B), Sup(B), Val(B))',
        '    return TrieH(Rac(A), Inf(A), Fusion(Eq(A), Eq(B)), Sup(A), Val(A))',
      ],
    },
  };

  DT.register('trieh', TrieH);
})();
