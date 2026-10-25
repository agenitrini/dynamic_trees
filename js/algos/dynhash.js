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

/* Hachage dynamique (Larson, 1978) : index en trie binaire, pages de capacité C (chapitre 4). */
(function () {
  'use strict';

  const DT = window.DT;
  const BITS = 5;
  const SLOT = 30; // largeur d'une case de page

  DT.i18n.add({
    fr: {
      'dynhash.ctl.cap': 'C =',
      'dynhash.op.setCap': 'Capacité des pages : C = {x}',
      'dynhash.setCap': 'Pages de capacité C = {c} : la structure est vidée.',
      'dynhash.codes': 'h(x)',
      'dynhash.info': 'Capacité C = {c} · {n} clé(s) · {p} page(s)',
      'dynhash.code': 'h({x}) = {c} : on suit les bits de h({x}) depuis la racine de l’index.',
      'dynhash.leaf': 'Feuille atteinte : on lit sa page (un accès disque).',
      'dynhash.inPage': '{x} est rangé dans la page ({n}/{c}).',
      'dynhash.overflow': 'La page déborde ({n} clés > C = {c}) : on l’éclate selon le bit {b}.',
      'dynhash.split': 'Bit {b} = 0 → page [{l}] ; bit {b} = 1 → page [{r}]. La feuille devient un nœud interne.',
      'dynhash.again': 'La page [{l}] déborde encore : on recommence avec le bit suivant.',
      'dynhash.overflowPage':
        'Les {n} clés ont le même haché sur les {B} bits : aucun éclatement ne peut les séparer → page de débordement chaînée.',
      'dynhash.notInPage': '{x} n’est pas dans la page : {x} est absent.',
      'dynhash.inPageFound': '{x} est dans la page : présent.',
      'dynhash.removed': '{x} est retiré de la page.',
      'dynhash.merge': 'La page et sa sœur tiennent dans une seule page ({n} ≤ C = {c}) : on les fusionne, leur père devient une feuille.',
      'dynhash.noMerge': 'Pas de fusion possible : la page sœur n’est pas une feuille ou les deux pages dépassent C.',
      'dynhash.vide': 'vide',
      'dynhash.overflowLbl': 'débordement',
    },
    en: {
      'dynhash.ctl.cap': 'C =',
      'dynhash.op.setCap': 'Page capacity: C = {x}',
      'dynhash.setCap': 'Pages of capacity C = {c}: the structure is cleared.',
      'dynhash.codes': 'h(x)',
      'dynhash.info': 'Capacity C = {c} · {n} key(s) · {p} page(s)',
      'dynhash.code': 'h({x}) = {c}: follow the bits of h({x}) from the root of the index.',
      'dynhash.leaf': 'Leaf reached: read its page (one disk access).',
      'dynhash.inPage': '{x} is stored in the page ({n}/{c}).',
      'dynhash.overflow': 'The page overflows ({n} keys > C = {c}): split it on bit {b}.',
      'dynhash.split': 'Bit {b} = 0 → page [{l}]; bit {b} = 1 → page [{r}]. The leaf becomes an internal node.',
      'dynhash.again': 'The page [{l}] still overflows: start again with the next bit.',
      'dynhash.overflowPage':
        'The {n} keys share the same hash on all {B} bits: no split can separate them → chained overflow page.',
      'dynhash.notInPage': '{x} is not in the page: {x} is absent.',
      'dynhash.inPageFound': '{x} is in the page: present.',
      'dynhash.removed': '{x} is removed from the page.',
      'dynhash.merge': 'The page and its sibling fit in a single page ({n} ≤ C = {c}): merge them, their parent becomes a leaf.',
      'dynhash.noMerge': 'No merge: the sibling is not a leaf or both pages exceed C.',
      'dynhash.vide': 'empty',
      'dynhash.overflowLbl': 'overflow',
    },
  });

  const list = (keys) => (keys.length ? keys.map((e) => e.key).join(' ') : ['dynhash.vide']);
  const sortKeys = (keys) => keys.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

  class DynHash extends DT.Algo {
    initState(cfg) {
      cfg = cfg || { cap: 4 };
      return { nextId: 2, cfg: { cap: cfg.cap }, root: { id: 1, keys: [] } };
    }

    clear() {
      this.s = this.initState(this.s.cfg);
      this.step('msg.cleared');
    }

    clearMarks() {
      super.clearMarks();
      this.cur = null;
      this.enter = {};
    }

    parse(name, raw) {
      return DT.common.parseLetters(raw);
    }

    setCap(v) {
      const c = parseInt(v, 10);
      if (!(c >= 1 && c <= 8)) throw new Error('C ' + v);
      this.s = this.initState({ cap: c });
      this.step(['dynhash.setCap', { c }]);
    }

    /** Valeur de hachage : code de la lettre sur 5 bits (A = 00001). */
    hcode(x) {
      return DT.util.letterCode(x, BITS);
    }

    leaves(n, out) {
      out = out || [];
      if (n.kids) n.kids.forEach((k) => this.leaves(k, out));
      else out.push(n);
      return out;
    }

    /** Positions actuelles (pour faire apparaître les nouveaux éléments au bon endroit). */
    positions() {
      const S = new DT.Scene();
      const saved = this.enter;
      this.enter = {};
      this.draw(S);
      this.enter = saved;
      return S;
    }
    enterFrom(newId, oldId, S) {
      const o = S.get(oldId);
      if (o) this.enter[newId] = { x: o.x, y: o.y };
    }

    /** Descend dans l'index en suivant les bits de h(x). */
    walk(x, bubble, line) {
      const code = this.hcode(x);
      this.cur = { key: x, code, upto: 0 };
      let n = this.s.root;
      const path = [];
      if (bubble) bubble('t:' + n.id);
      this.ring('t:' + n.id, 'cmp');
      this.step(['dynhash.code', { x, c: code }], { line: 2 });
      let depth = 0;
      while (n.kids) {
        const b = +code[depth];
        this.cur.upto = depth + 1;
        this.ring('t:' + n.id, 'cmp');
        this.markEdge('t:' + n.id, 't:' + n.kids[b].id, 'hl');
        this.step([b ? 'c.bit1' : 'c.bit0', { i: depth + 1, x }], { line });
        path.push(n);
        n = n.kids[b];
        depth++;
        if (bubble) bubble('t:' + n.id);
      }
      this.markEdge('t:' + n.id, 'p:' + n.id, 'hl');
      this.ring('p:' + n.id, 'cmp');
      return { leaf: n, depth, path };
    }

    /* --- ajout -------------------------------------------------------- */
    insert(x) {
      this.code('insert');
      const cap = this.s.cfg.cap;
      const id = this.newId();
      const bubble = (at) => this.float('cand', { id: 'k:' + id, label: x, cls: 'new', shape: 'box', w: 26, h: 26, at, dx: 26, dy: -20 });
      let { leaf, depth } = this.walk(x, bubble, 5);
      if (leaf.keys.some((e) => e.key === x)) {
        const e = leaf.keys.find((e) => e.key === x);
        this.float('cand', null);
        this.mark('k:' + e.id, 'ok');
        this.ring('p:' + leaf.id, 'ok');
        this.step(['c.already', { x }], { line: 6 });
        return;
      }
      leaf.keys.push({ id, key: x });
      sortKeys(leaf.keys);
      this.float('cand', null);
      this.mark('k:' + id, 'new');
      this.step(['dynhash.inPage', { x, n: leaf.keys.length, c: cap }], { line: 6 });
      while (leaf.keys.length > cap) {
        this.ring('p:' + leaf.id, 'bad');
        this.mark('p:' + leaf.id, 'bad');
        if (depth >= BITS) {
          this.step(['dynhash.overflowPage', { n: leaf.keys.length, B: BITS }], { line: 8 });
          break;
        }
        this.step(['dynhash.overflow', { n: leaf.keys.length, c: cap, b: depth + 1 }], { line: 7 });
        const before = this.positions();
        const kids = [0, 1].map(() => ({ id: this.newId(), keys: [] }));
        for (const e of leaf.keys) kids[+this.hcode(e.key)[depth]].keys.push(e);
        for (const k of kids) {
          this.enterFrom('t:' + k.id, 't:' + leaf.id, before);
          this.enterFrom('p:' + k.id, 'p:' + leaf.id, before);
          this.mark('p:' + k.id, 'new');
        }
        delete leaf.keys;
        leaf.kids = kids;
        this.unmark('p:' + leaf.id);
        this.ring('t:' + leaf.id, 'hl');
        this.cur.upto = depth + 1;
        this.step(['dynhash.split', { b: depth + 1, l: list(kids[0].keys), r: list(kids[1].keys) }], { line: 11 });
        depth++;
        const full = kids.find((k) => k.keys.length > cap);
        if (!full) break;
        this.unmark('p:' + kids[0].id);
        this.unmark('p:' + kids[1].id);
        leaf = full;
        this.ring('p:' + leaf.id, 'bad');
        this.step(['dynhash.again', { l: list(leaf.keys) }], { line: 12 });
      }
    }

    /* --- recherche ---------------------------------------------------- */
    search(x) {
      this.code('search');
      const { leaf } = this.walk(x, (at) => this.float('probe', { id: 'probe', label: x, cls: 'cmp', shape: 'box', w: 26, h: 26, at, dx: 26, dy: -20 }), 5);
      this.float('probe', null);
      this.step(['dynhash.leaf'], { line: 6 });
      const e = leaf.keys.find((e) => e.key === x);
      if (e) {
        this.mark('k:' + e.id, 'ok');
        this.ring('p:' + leaf.id, 'ok');
        this.step(['dynhash.inPageFound', { x }], { line: 6 });
        return true;
      }
      this.ring('p:' + leaf.id, 'bad');
      this.step(['dynhash.notInPage', { x }], { line: 6 });
      return false;
    }

    /* --- suppression -------------------------------------------------- */
    delete(x) {
      this.code('delete');
      const cap = this.s.cfg.cap;
      const { leaf, path } = this.walk(x, null, 2);
      const i = leaf.keys.findIndex((e) => e.key === x);
      if (i < 0) {
        this.ring('p:' + leaf.id, 'bad');
        this.step(['dynhash.notInPage', { x }], { line: 2 });
        return;
      }
      this.mark('k:' + leaf.keys[i].id, 'bad');
      this.step(['dynhash.leaf'], { line: 2 });
      leaf.keys.splice(i, 1);
      this.ring('p:' + leaf.id, 'ok');
      this.step(['dynhash.removed', { x }], { line: 3 });
      // fusions avec la page sœur, en remontant
      let n = leaf;
      while (path.length) {
        const parent = path[path.length - 1];
        const sib = parent.kids[0] === n ? parent.kids[1] : parent.kids[0];
        if (sib.kids || n.keys.length + sib.keys.length > cap) {
          if (n === leaf) {
            this.ring(null);
            this.step(['dynhash.noMerge'], { line: 5 });
          }
          break;
        }
        this.ring('t:' + parent.id, 'hl');
        const before = this.positions();
        this.mark('p:' + n.id, 'hl');
        this.mark('p:' + sib.id, 'hl');
        this.step(['dynhash.merge', { n: n.keys.length + sib.keys.length, c: cap }], { line: 5 });
        parent.keys = sortKeys(parent.kids[0].keys.concat(parent.kids[1].keys));
        delete parent.kids;
        this.enterFrom('p:' + parent.id, 'p:' + n.id, before);
        this.mark('p:' + parent.id, 'new');
        this.step(null, { line: 6 });
        path.pop();
        n = parent;
      }
    }

    random() {
      this.clear();
      const letters = DT.util.shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')).slice(0, 10);
      for (const c of letters) {
        this.step(['op.insert', { x: c }], { op: true, code: null });
        this.insert(c);
        this.clearMarks();
      }
    }

    /** Invariants : chaque clé est dans la page où mènent ses bits ; capacité respectée (sauf débordement). */
    check() {
      const cap = this.s.cfg.cap;
      const seen = new Set();
      const ids = new Set();
      const rec = (n, prefix) => {
        if (ids.has(n.id)) throw new Error('id dupliqué ' + n.id);
        ids.add(n.id);
        if (n.kids) {
          if (n.keys) throw new Error('nœud interne avec page');
          if (prefix.length >= BITS) throw new Error('index trop profond');
          rec(n.kids[0], prefix + '0');
          rec(n.kids[1], prefix + '1');
          return;
        }
        if (n.keys.length > cap && prefix.length < BITS) throw new Error('page trop pleine ' + prefix);
        for (const e of n.keys) {
          if (seen.has(e.key)) throw new Error('doublon ' + e.key);
          seen.add(e.key);
          if (!this.hcode(e.key).startsWith(prefix)) throw new Error(`${e.key} mal placé (${prefix})`);
        }
      };
      rec(this.s.root, '');
    }

    keys() {
      return this.leaves(this.s.root)
        .flatMap((l) => l.keys.map((e) => e.key))
        .sort();
    }

    /** Structure (pour les tests) : feuille = clés de la page, nœud = [fils 0, fils 1]. */
    shape(n) {
      n = n || this.s.root;
      return n.kids ? [this.shape(n.kids[0]), this.shape(n.kids[1])] : n.keys.map((e) => e.key).join('');
    }

    /* --- dessin ------------------------------------------------------- */
    pageW(leaf, depth) {
      const cap = this.s.cfg.cap;
      const over = depth >= BITS && leaf.keys.length > cap;
      const slots = over ? cap : Math.max(cap, leaf.keys.length);
      let w = slots * SLOT + 8;
      if (over) w += 30 + (leaf.keys.length - cap) * SLOT + 8;
      return w;
    }

    draw(S) {
      const cap = this.s.cfg.cap;
      const root = this.s.root;
      const pages = new Map();
      const depthOf = new Map();
      (function rec(n, d) {
        depthOf.set(n, d);
        if (n.kids) n.kids.forEach((k) => rec(k, d + 1));
        else pages.set(n, { page: n });
      })(root, 0);
      const L = DT.layout.tree(root, {
        children: (n) => (n.page ? [] : n.kids ? n.kids : [pages.get(n)]),
        width: (n) => (n.page ? this.pageW(n.page, depthOf.get(n.page)) : 18),
        levelGap: 64,
        gap: 18,
      });
      const enter = this.enter || {};
      const node = (id, spec) => S.node(id, Object.assign(spec, enter[id] ? { enter: enter[id] } : {}));
      for (const [n, p] of L.pos) {
        if (n.page) {
          const leaf = n.page;
          const over = depthOf.get(leaf) >= BITS && leaf.keys.length > cap;
          const slots = over ? cap : Math.max(cap, leaf.keys.length);
          const w = slots * SLOT + 8;
          const x0 = p.x - this.pageW(leaf, depthOf.get(leaf)) / 2;
          const px = x0 + w / 2;
          node('p:' + leaf.id, { shape: 'box', x: px, y: p.y, w, h: 38, label: '', cls: 'leaf' });
          const slotX = (base, j) => base + 4 + SLOT / 2 + j * SLOT;
          for (let j = 0; j < slots; j++) {
            const e = leaf.keys[j];
            if (e) node('k:' + e.id, { shape: 'box', x: slotX(x0, j), y: p.y, w: 26, h: 28, label: e.key, cls: 'key' });
            else S.node(`s:${leaf.id}:${j}`, { shape: 'cell', x: slotX(x0, j), y: p.y, w: 26, h: 28, label: '', cls: 'ghost' });
          }
          if (over) {
            const rest = leaf.keys.slice(cap);
            const ow = rest.length * SLOT + 8;
            const ox = x0 + w + 30;
            node('o:' + leaf.id, { shape: 'box', x: ox + ow / 2, y: p.y, w: ow, h: 38, label: '', cls: 'leaf', sub: ['dynhash.overflowLbl'] });
            rest.forEach((e, j) => node('k:' + e.id, { shape: 'box', x: slotX(ox, j), y: p.y, w: 26, h: 28, label: e.key, cls: 'key' }));
            S.edge('p:' + leaf.id, 'o:' + leaf.id, { arrow: true, cls: 'dash thin', fromSide: 'right', toSide: 'left' });
          }
        } else {
          node('t:' + n.id, { shape: 'dot', r: 7, x: p.x, y: p.y });
        }
      }
      for (const [n] of L.pos) {
        if (n.page) continue;
        if (n.kids) n.kids.forEach((k, b) => S.edge('t:' + n.id, 't:' + k.id, { label: String(b) }));
        else S.edge('t:' + n.id, 'p:' + n.id, { arrow: true, cls: 'thin', toSide: 'top' });
      }
      // table des codes des clés présentes
      const keys = this.leaves(root).flatMap((l) => l.keys.map((e) => e.key)).sort();
      const perCol = 13;
      const cols = Math.ceil(keys.length / perCol);
      const tx = L.minX - 40 - cols * 86;
      if (keys.length) S.text('codes', tx + 32, -30, ['dynhash.codes'], { cls: 'mono dim' });
      keys.forEach((k, i) => {
        const cur = this.cur && this.cur.key === k;
        S.text('code:' + k, tx + 32 + Math.floor(i / perCol) * 86, Math.floor(i % perCol) * 20, `${k}  ${this.hcode(k)}`, {
          cls: 'mono' + (cur ? ' hl' : ''),
        });
      });
      // bits de la clé courante
      if (this.cur) {
        const c = this.cur;
        S.text('hx', -84, -70, `h(${c.key}) =`, { cls: 'mono', size: 17 });
        for (let j = 0; j < BITS; j++) {
          const cls = j < c.upto - 1 ? 'mono accent' : j === c.upto - 1 ? 'mono hl' : 'mono dim';
          S.text('hb:' + j, -36 + j * 18, -70, c.code[j], { cls, size: 18 });
        }
      }
      const nPages = pages.size;
      S.text('info', (L.minX + L.maxX) / 2, (L.maxDepth + 1) * 64 + 10, ['dynhash.info', { c: cap, n: keys.length, p: nPages }], {
        cls: 'dim',
      });
    }
  }

  DynHash.controls = [
    { type: 'input', name: 'key', size: 10, placeholder: 'ctl.keys' },
    { type: 'button', label: 'ctl.insert', op: 'insert', args: ['key'], primary: true },
    { type: 'button', label: 'ctl.delete', op: 'delete', args: ['key'] },
    { type: 'button', label: 'ctl.search', op: 'search', args: ['key'] },
    { type: 'sep' },
    {
      type: 'select',
      name: 'cap',
      label: 'dynhash.ctl.cap',
      op: 'setCap',
      value: '4',
      options: [2, 3, 4].map((v) => ({ value: String(v), label: String(v) })),
    },
    { type: 'sep' },
    { type: 'button', label: 'ctl.random', op: 'random' },
  ];

  DynHash.code = {
    insert: {
      title: { fr: 'Ajout en hachage dynamique', en: 'Dynamic hashing insertion' },
      source: 'site',
      lines: [
        'def HD_Ajout(x, I):',
        '    b = h(x)                    # suite de bits',
        '    n, i = Racine(I), 1',
        '    while not EstFeuille(n):    # on suit les bits',
        '        n = Fils(n, b[i]); i = i + 1',
        '    P = Page(n); Ajouter(x, P)',
        '    while Taille(P) > C:        # la page deborde',
        '        if i > len(b): ChainerDebordement(P); break',
        '        P0 = [y for y in P if h(y)[i] == 0]',
        '        P1 = [y for y in P if h(y)[i] == 1]',
        '        Remplacer(n, Noeud(Feuille(P0), Feuille(P1)))',
        '        n, P = feuille de la page qui deborde; i = i + 1',
      ],
    },
    search: {
      title: { fr: 'Recherche', en: 'Search' },
      source: 'site',
      lines: [
        'def HD_Recherche(x, I):',
        '    b = h(x)',
        '    n, i = Racine(I), 1',
        '    while not EstFeuille(n):',
        '        n = Fils(n, b[i]); i = i + 1',
        '    return x in Page(n)         # un seul acces disque',
      ],
    },
    delete: {
      title: { fr: 'Suppression (avec fusion)', en: 'Deletion (with merging)' },
      source: 'site',
      lines: [
        'def HD_Suppression(x, I):',
        '    n = feuille atteinte en suivant les bits de h(x)',
        '    Retirer(x, Page(n))',
        '    # fusion avec la page soeur si les deux tiennent dans une page',
        '    while Soeur(n) est une feuille and |Page(n)| + |Page(Soeur(n))| <= C:',
        '        Remplacer(Pere(n), Feuille(Page(n) + Page(Soeur(n))))',
        '        n = Pere(n)',
      ],
    },
  };

  DynHash.legend = [
    ['var(--cmp)', { fr: 'nœud / page examinés', en: 'visited node / page' }],
    ['var(--hl)', { fr: 'bit courant, chemin suivi', en: 'current bit, path followed' }],
    ['var(--bad)', { fr: 'page qui déborde', en: 'overflowing page' }],
    ['var(--new)', { fr: 'nouvelle clé / page', en: 'new key / page' }],
  ];

  DT.register('dynhash', DynHash);
})();