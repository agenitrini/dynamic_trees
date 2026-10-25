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

/* R-trie sur des mots (chapitre 3) : valeur = numéro d'insertion. */
(function () {
  'use strict';

  const DT = window.DT;
  const show = (w) => (w === '' ? 'ε' : w);

  DT.i18n.add({
    fr: {
      'rt.start': 'Ajout de « {w} » avec la valeur {v}, depuis la racine.',
      'rt.prem': 'prem(« {w} ») = {p} : on suit le lien {p} avec reste = « {r} ».',
      'rt.newNode': 'Lien {p} vide : nouveau nœud TrieVide().',
      'rt.store': 'lgueur(c) = 0 : on enregistre la valeur {v} dans ce nœud.',
      'rt.replace': 'lgueur(c) = 0 : « {x} » était déjà présent, sa valeur {o} est remplacée par {v}.',
      'rt.inserted': '« {x} » est ajouté (valeur {v}).',
      'rt.sprem': 'prem(« {w} ») = {p} : on suit le lien {p}, reste = « {r} ».',
      'rt.empty': 'Le lien {p} est vide : « {x} » est absent.',
      'rt.noVal': 'Le nœud atteint n’a pas de valeur : « {x} » est absent (c’est seulement un préfixe).',
      'rt.found': 'Le nœud atteint a la valeur {v} : « {x} » est présent.',
      'rt.clear': 'On efface la valeur {v} du nœud de « {x} ».',
      'rt.prune': 'Nœud sans valeur ni enfant : on le supprime.',
      'rt.keep': 'Ce nœud a une valeur ou d’autres enfants : on s’arrête.',
      'rt.removed': '« {x} » est supprimé.',
    },
    en: {
      'rt.start': 'Insert “{w}” with value {v}, from the root.',
      'rt.prem': 'prem(“{w}”) = {p}: follow the link {p} with reste = “{r}”.',
      'rt.newNode': 'Link {p} is empty: new node TrieVide().',
      'rt.store': 'lgueur(c) = 0: store the value {v} in this node.',
      'rt.replace': 'lgueur(c) = 0: “{x}” was already present, its value {o} is replaced by {v}.',
      'rt.inserted': '“{x}” is inserted (value {v}).',
      'rt.sprem': 'prem(“{w}”) = {p}: follow the link {p}, reste = “{r}”.',
      'rt.empty': 'Link {p} is empty: “{x}” is absent.',
      'rt.noVal': 'The node reached has no value: “{x}” is absent (it is only a prefix).',
      'rt.found': 'The node reached has value {v}: “{x}” is present.',
      'rt.clear': 'Clear the value {v} from the node of “{x}”.',
      'rt.prune': 'Node with neither value nor child: remove it.',
      'rt.keep': 'This node has a value or other children: stop.',
      'rt.removed': '“{x}” is deleted.',
    },
  });

  const WORDS = 'arbre arc art bal balle ballon banc bas base chat chaton chien cle code coder dame dans de des le les lou loup loups lourd luxe mot mots olive tapis vert ver vers'.split(' ');

  class RTrie extends DT.Algo {
    initState() {
      return { nextId: 2, count: 0, root: { id: 1, val: null, kids: {} } };
    }

    bubble(name, w, at, cls) {
      const label = show(w);
      this.float(name, { id: name, label, cls, at, shape: 'box', w: Math.max(28, 9 * label.length + 14), h: 24, dx: 0, dy: -36 });
    }

    /* --- ajout -------------------------------------------------------- */
    insert(x) {
      this.code('insert');
      const v = this.s.count++;
      let n = this.s.root;
      let w = x;
      this.bubble('cand', w, n.id, 'new');
      this.ring(n.id, 'cmp');
      this.step(['rt.start', { w, v }], { line: 1 });
      while (w !== '') {
        const p = w[0];
        const r = w.slice(1);
        this.bubble('cand', w, n.id, 'new');
        this.ring(n.id, 'cmp');
        const next = n.kids[p];
        if (next) this.markEdge(n.id, next.id, 'cmp');
        this.step(['rt.prem', { w, p, r: show(r) }], { line: 8 });
        if (next) this.markEdge(n.id, next.id, 'hl');
        if (!next) {
          const c = { id: this.newId(), val: null, kids: {} };
          n.kids[p] = c;
          this.mark(c.id, 'new');
          this.markEdge(n.id, c.id, 'new');
          this.ring(c.id, 'new');
          this.bubble('cand', r, c.id, 'new');
          this.step(['rt.newNode', { p }], { line: 4 });
          n = c;
        } else n = next;
        w = r;
      }
      this.bubble('cand', '', n.id, 'new');
      this.ring(n.id, 'hl');
      const old = n.val;
      this.step(old === null ? ['rt.store', { v }] : ['rt.replace', { x, o: old, v }], { line: 6 });
      this.float('cand', null);
      n.val = v;
      this.ring(n.id, 'ok');
      this.mark(n.id, 'new');
      this.step(['rt.inserted', { x, v }], { line: 7 });
    }

    /** Descente pour la recherche et la suppression ; renvoie le chemin [{ node, p }] ou null. */
    walk(x, lines) {
      let n = this.s.root;
      let w = x;
      const path = [{ node: n, p: null }];
      while (w !== '') {
        const p = w[0];
        const r = w.slice(1);
        this.bubble('probe', w, n.id, 'cmp');
        this.ring(n.id, 'cmp');
        const next = n.kids[p];
        if (!next) {
          this.ring(n.id, 'bad');
          this.step(['rt.empty', { p, x }], { line: lines.empty });
          this.float('probe', null);
          return null;
        }
        this.markEdge(n.id, next.id, 'cmp');
        this.step(['rt.sprem', { w, p, r: show(r) }], { line: lines.prem });
        this.markEdge(n.id, next.id, 'hl');
        n = next;
        w = r;
        path.push({ node: n, p });
      }
      this.float('probe', null);
      this.ring(n.id, 'cmp');
      return path;
    }

    /* --- recherche ---------------------------------------------------- */
    search(x) {
      this.code('search');
      const path = this.walk(x, { empty: 2, prem: 6 });
      if (!path) return false;
      const n = path[path.length - 1].node;
      if (n.val === null) {
        this.ring(n.id, 'bad');
        this.step(['rt.noVal', { x }], { line: 4 });
        return false;
      }
      this.ring(n.id, 'ok');
      this.mark(n.id, 'ok');
      this.step(['rt.found', { x, v: n.val }], { line: 4 });
      return true;
    }

    /* --- suppression -------------------------------------------------- */
    delete(x) {
      this.code('delete');
      const path = this.walk(x, { empty: 2, prem: 7 });
      if (!path) return;
      const n = path[path.length - 1].node;
      if (n.val === null) {
        this.ring(n.id, 'bad');
        this.step(['rt.noVal', { x }], { line: 2 });
        return;
      }
      this.mark(n.id, 'bad');
      this.ring(n.id, 'bad');
      this.step(['rt.clear', { x, v: n.val }], { line: 4 });
      n.val = null;
      this.unmark(n.id);
      this.step(null, { line: 4 });
      // élagage en remontant : nœud sans valeur ni enfant
      for (let k = path.length - 1; k >= 1; k--) {
        const node = path[k].node;
        const parent = path[k - 1].node;
        this.ring(node.id, 'cmp');
        if (node.val !== null || Object.keys(node.kids).length) {
          this.step(['rt.keep'], { line: 10 });
          break;
        }
        this.mark(node.id, 'bad');
        this.markEdge(parent.id, node.id, 'bad');
        this.step(['rt.prune'], { line: 9 });
        delete parent.kids[path[k].p];
        this.edgeMarks.clear();
      }
      this.ring(null);
      this.step(['rt.removed', { x }], { line: 10 });
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

    /** Invariants : pas de nœud (hors racine) sans valeur ni enfant ; identifiants uniques. */
    check() {
      const ids = new Set();
      const root = this.s.root;
      (function rec(n, pre) {
        if (ids.has(n.id)) throw new Error('id dupliqué ' + n.id);
        ids.add(n.id);
        const ks = Object.keys(n.kids);
        if (n !== root && n.val === null && !ks.length) throw new Error(`nœud inutile en « ${pre} »`);
        for (const p of ks) {
          if (!/^[a-z]$/.test(p)) throw new Error('lien invalide ' + p);
          rec(n.kids[p], pre + p);
        }
      })(root, '');
    }

    keys() {
      const out = [];
      (function rec(n, pre) {
        if (n.val !== null) out.push(pre);
        for (const p of Object.keys(n.kids)) rec(n.kids[p], pre + p);
      })(this.s.root, '');
      return out.sort();
    }

    /* --- dessin ------------------------------------------------------- */
    draw(S) {
      const root = this.s.root;
      const kids = (n) => Object.keys(n.kids).sort().map((p) => n.kids[p]);
      const L = DT.layout.tree(root, { children: kids, width: () => 32, gap: 10, levelGap: 64 });
      for (const [n, p] of L.pos) {
        const spec = { x: p.x, y: p.y, r: 15, label: n.val === null ? '' : String(n.val) };
        if (n.val !== null) spec.cls = 'key';
        S.node(n.id, spec);
      }
      for (const [n] of L.pos) {
        for (const p of Object.keys(n.kids)) S.edge(n.id, n.kids[p].id, { label: p, labelAt: 0.66 });
      }
      if (!Object.keys(root.kids).length && root.val === null) S.text('empty', 0, 44, ['c.emptyTree'], { cls: 'dim' });
    }
  }

  RTrie.controls = [
    { type: 'input', name: 'key', size: 14, placeholder: 'ctl.word' },
    { type: 'button', label: 'ctl.insert', op: 'insert', args: ['key'], primary: true },
    { type: 'button', label: 'ctl.delete', op: 'delete', args: ['key'] },
    { type: 'button', label: 'ctl.search', op: 'search', args: ['key'] },
    { type: 'sep' },
    { type: 'button', label: 'ctl.random', op: 'random' },
  ];

  RTrie.code = {
    insert: {
      title: { fr: 'Ajout dans un R-trie', en: 'R-trie insertion' },
      source: 'course',
      lines: [
        'def R_Trie_Ajout(c, A, v):',
        '    """ cle * R-Trie * valeur -> R-trie """',
        '    if EstVide(A):',
        '        A = TrieVide()',
        '    if lgueur(c) == 0:',
        '        StockVal(A) = v     # enregistre v dans la racine de A',
        '        return A',
        '    p = prem(c)',
        '    return R_Trie(p, EnfantsSauf(A, p),',
        '                  R_Trie_Ajout(reste(c), SousArbre(A, p), v))',
      ],
    },
    search: {
      title: { fr: 'Recherche dans un R-trie', en: 'R-trie search' },
      source: 'site',
      lines: [
        'def R_Trie_Recherche(c, A):',
        '    if EstVide(A): return False',
        '    if lgueur(c) == 0:',
        '        return Val(A) != ValVide()',
        '    p = prem(c)',
        '    return R_Trie_Recherche(reste(c), SousArbre(A, p))',
      ],
    },
    delete: {
      title: { fr: 'Suppression dans un R-trie', en: 'R-trie deletion' },
      source: 'site',
      lines: [
        'def R_Trie_Suppression(c, A):',
        '    if EstVide(A): return A',
        '    if lgueur(c) == 0:',
        '        StockVal(A) = ValVide()',
        '    else:',
        '        p = prem(c)',
        '        A = R_Trie(p, EnfantsSauf(A, p), R_Trie_Suppression(reste(c), SousArbre(A, p)))',
        '    if Val(A) == ValVide() and TousVides(A):   # noeud inutile',
        '        return Vide()',
        '    return A',
      ],
    },
  };

  DT.register('rtrie', RTrie);
})();
