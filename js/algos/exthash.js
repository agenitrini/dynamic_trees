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

/* Hachage extensible (Fagin, Nievergelt, Pippenger, Strong, 1979) (chapitre 4). */
(function () {
  'use strict';

  const DT = window.DT;
  const BITS = 5;
  const SLOT = 30; // largeur d'une case de page
  const DY = 42; // espacement des cases de l'index
  const PX = 230; // bord gauche des pages

  DT.i18n.add({
    fr: {
      'exthash.ctl.cap': 'C =',
      'exthash.op.setCap': 'Capacité des pages : C = {x}',
      'exthash.setCap': 'Pages de capacité C = {c} : la structure est vidée.',
      'exthash.index': 'Index, d = {d}',
      'exthash.codes': 'h(x)',
      'exthash.info': 'Capacité C = {c} · {n} clé(s) · {p} page(s) · 2^d = {s} case(s)',
      'exthash.code0': 'h({x}) = {c} : d = 0, l’index n’a qu’une case.',
      'exthash.code': 'h({x}) = {c} : on lit ses d = {d} premiers bits, {p}, et on suit la case {p}.',
      'exthash.inPage': '{x} est rangé dans la page ({n}/{c}).',
      'exthash.mustDouble': 'La page déborde ({n} clés > C = {c}) et sa profondeur locale k = {k} est égale à d : une seule case pointe sur elle, il faut doubler l’index.',
      'exthash.doubled': 'Index doublé : d = {d}. Chaque case est dédoublée et ses deux copies pointent sur la même page.',
      'exthash.mustSplit': 'La page déborde ({n} clés > C = {c}) et k = {k} < d = {d} : on l’éclate selon le bit {b}, sans changer la taille de l’index.',
      'exthash.split': 'Bit {b} = 0 → page [{l}] ; bit {b} = 1 → page [{r}] (k = {k}). {s} case(s) de l’index redirigée(s).',
      'exthash.again': 'La page [{l}] déborde encore.',
      'exthash.overflowPage':
        'Les {n} clés ont le même haché sur les {B} bits : aucun éclatement ne peut les séparer → page de débordement chaînée.',
      'exthash.found': '{x} est dans la page : présent.',
      'exthash.notInPage': '{x} n’est pas dans la page : {x} est absent.',
      'exthash.removed': '{x} est retiré de la page.',
      'exthash.merge': 'La page et sa page « copain » (même k = {k}, bit {k} différent) tiennent dans une seule page ({n} ≤ C = {c}) : fusion, k = {k1}.',
      'exthash.halve': 'Toutes les pages ont une profondeur locale k < d : l’index est divisé par deux (d = {d}).',
      'exthash.noMerge': 'Pas de fusion : la page « copain » a une autre profondeur ou les deux pages dépassent C.',
      'exthash.vide': 'vide',
      'exthash.overflowLbl': 'débordement',
    },
    en: {
      'exthash.ctl.cap': 'C =',
      'exthash.op.setCap': 'Page capacity: C = {x}',
      'exthash.setCap': 'Pages of capacity C = {c}: the structure is cleared.',
      'exthash.index': 'Index, d = {d}',
      'exthash.codes': 'h(x)',
      'exthash.info': 'Capacity C = {c} · {n} key(s) · {p} page(s) · 2^d = {s} slot(s)',
      'exthash.code0': 'h({x}) = {c}: d = 0, the index has a single slot.',
      'exthash.code': 'h({x}) = {c}: read its first d = {d} bits, {p}, and follow slot {p}.',
      'exthash.inPage': '{x} is stored in the page ({n}/{c}).',
      'exthash.mustDouble': 'The page overflows ({n} keys > C = {c}) and its local depth k = {k} equals d: a single slot points to it, the index must be doubled.',
      'exthash.doubled': 'Index doubled: d = {d}. Each slot is duplicated and both copies point to the same page.',
      'exthash.mustSplit': 'The page overflows ({n} keys > C = {c}) and k = {k} < d = {d}: split it on bit {b}, without changing the index size.',
      'exthash.split': 'Bit {b} = 0 → page [{l}]; bit {b} = 1 → page [{r}] (k = {k}). {s} index slot(s) redirected.',
      'exthash.again': 'The page [{l}] still overflows.',
      'exthash.overflowPage':
        'The {n} keys share the same hash on all {B} bits: no split can separate them → chained overflow page.',
      'exthash.found': '{x} is in the page: present.',
      'exthash.notInPage': '{x} is not in the page: {x} is absent.',
      'exthash.removed': '{x} is removed from the page.',
      'exthash.merge': 'The page and its “buddy” (same k = {k}, different bit {k}) fit in a single page ({n} ≤ C = {c}): merge, k = {k1}.',
      'exthash.halve': 'Every page has a local depth k < d: the index is halved (d = {d}).',
      'exthash.noMerge': 'No merge: the buddy page has another depth or both pages exceed C.',
      'exthash.vide': 'empty',
      'exthash.overflowLbl': 'overflow',
    },
  });

  const list = (keys) => (keys.length ? keys.map((e) => e.key).join(' ') : ['exthash.vide']);
  const sortKeys = (keys) => keys.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const bits = (i, d) => (d ? i.toString(2).padStart(d, '0') : '');

  class ExtHash extends DT.Algo {
    initState(cfg) {
      cfg = cfg || { cap: 4 };
      return { nextId: 2, cfg: { cap: cfg.cap }, d: 0, dir: [1], pages: { 1: { id: 1, k: 0, keys: [] } } };
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
      this.step(['exthash.setCap', { c }]);
    }

    hcode(x) {
      return DT.util.letterCode(x, BITS);
    }

    slotId(i, d) {
      return 'dir:' + bits(i, d === undefined ? this.s.d : d);
    }

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

    /** Lit les d premiers bits de h(x) ; renvoie l'indice de la case et la page. */
    locate(x, bubble) {
      const code = this.hcode(x);
      const d = this.s.d;
      this.cur = { key: x, code, upto: d };
      const i = d ? parseInt(code.slice(0, d), 2) : 0;
      const page = this.s.pages[this.s.dir[i]];
      const sid = this.slotId(i);
      if (bubble) bubble(sid);
      this.ring(sid, 'cmp');
      this.mark(sid, 'cmp');
      this.markEdge(sid, 'p:' + page.id, 'hl');
      this.step(d ? ['exthash.code', { x, c: code, d, p: code.slice(0, d) }] : ['exthash.code0', { x, c: code }], {
        line: 3,
      });
      this.ring('p:' + page.id, 'cmp');
      return { i, page };
    }

    /* --- ajout -------------------------------------------------------- */
    insert(x) {
      this.code('insert');
      const cap = this.s.cfg.cap;
      const id = this.newId();
      const bubble = (at) => this.float('cand', { id: 'k:' + id, label: x, cls: 'new', shape: 'box', w: 26, h: 26, at, dx: -62, dy: 0 });
      let { page } = this.locate(x, bubble);
      const old = page.keys.find((e) => e.key === x);
      if (old) {
        this.float('cand', null);
        this.mark('k:' + old.id, 'ok');
        this.ring('p:' + page.id, 'ok');
        this.step(['c.already', { x }], { line: 4 });
        return;
      }
      page.keys.push({ id, key: x });
      sortKeys(page.keys);
      this.float('cand', null);
      this.mark('k:' + id, 'new');
      this.step(['exthash.inPage', { x, n: page.keys.length, c: cap }], { line: 4 });
      while (page.keys.length > cap) {
        const S = this.s;
        this.ring('p:' + page.id, 'bad');
        this.mark('p:' + page.id, 'bad');
        if (page.k >= BITS) {
          this.step(['exthash.overflowPage', { n: page.keys.length, B: BITS }], { line: 6 });
          break;
        }
        if (page.k === S.d) {
          this.step(['exthash.mustDouble', { n: page.keys.length, c: cap, k: page.k }], { line: 7 });
          const before = this.positions();
          const nd = [];
          for (let i = 0; i < 2 * S.dir.length; i++) nd.push(S.dir[i >> 1]);
          S.dir = nd;
          S.d++;
          for (let i = 0; i < nd.length; i++) {
            this.enterFrom(this.slotId(i), this.slotId(i >> 1, S.d - 1), before);
            this.mark(this.slotId(i), 'new');
          }
          this.cur.upto = S.d;
          this.ring('p:' + page.id, 'bad');
          this.step(['exthash.doubled', { d: S.d }], { line: 8 });
          for (let i = 0; i < nd.length; i++) this.unmark(this.slotId(i));
        } else {
          this.step(['exthash.mustSplit', { n: page.keys.length, c: cap, k: page.k, d: S.d, b: page.k + 1 }], { line: 9 });
        }
        // éclatement selon le bit k + 1
        const before = this.positions();
        const k = page.k;
        const p1 = { id: this.newId(), k: k + 1, keys: [] };
        S.pages[p1.id] = p1;
        const keep = [];
        for (const e of page.keys) (this.hcode(e.key)[k] === '1' ? p1.keys : keep).push(e);
        page.keys = keep;
        page.k = k + 1;
        let moved = 0;
        for (let i = 0; i < S.dir.length; i++) {
          if (S.dir[i] === page.id && bits(i, S.d)[k] === '1') {
            S.dir[i] = p1.id;
            this.mark(this.slotId(i), 'new');
            this.markEdge(this.slotId(i), 'p:' + p1.id, 'new');
            moved++;
          }
        }
        this.enterFrom('p:' + p1.id, 'p:' + page.id, before);
        this.unmark('p:' + page.id);
        this.mark('p:' + page.id, 'new');
        this.mark('p:' + p1.id, 'new');
        this.ring(null);
        this.step(['exthash.split', { b: k + 1, l: list(page.keys), r: list(p1.keys), k: k + 1, s: moved }], { line: 10 });
        for (let i = 0; i < S.dir.length; i++) this.unmark(this.slotId(i));
        this.edgeMarks.clear();
        this.unmark('p:' + page.id);
        this.unmark('p:' + p1.id);
        const full = [page, p1].find((p) => p.keys.length > cap);
        if (!full) break;
        page = full;
        this.ring('p:' + page.id, 'bad');
        this.step(['exthash.again', { l: list(page.keys) }], { line: 11 });
      }
    }

    /* --- recherche ---------------------------------------------------- */
    search(x) {
      this.code('search');
      const { page } = this.locate(x, (at) => this.float('probe', { id: 'probe', label: x, cls: 'cmp', shape: 'box', w: 26, h: 26, at, dx: -62, dy: 0 }));
      this.float('probe', null);
      const e = page.keys.find((e) => e.key === x);
      if (e) {
        this.mark('k:' + e.id, 'ok');
        this.ring('p:' + page.id, 'ok');
        this.step(['exthash.found', { x }], { line: 3 });
        return true;
      }
      this.ring('p:' + page.id, 'bad');
      this.step(['exthash.notInPage', { x }], { line: 3 });
      return false;
    }

    /* --- suppression -------------------------------------------------- */
    /** Page « copain » de p (même préfixe sur k − 1 bits, bit k différent), ou null. */
    buddy(p) {
      if (p.k === 0) return null;
      const S = this.s;
      const i = S.dir.indexOf(p.id);
      const pre = bits(i, S.d).slice(0, p.k);
      const bp = pre.slice(0, -1) + (pre[p.k - 1] === '0' ? '1' : '0');
      const j = parseInt(bp.padEnd(S.d, '0'), 2);
      return S.pages[S.dir[j]];
    }

    delete(x) {
      this.code('delete');
      const cap = this.s.cfg.cap;
      let { page } = this.locate(x, null);
      const i = page.keys.findIndex((e) => e.key === x);
      if (i < 0) {
        this.ring('p:' + page.id, 'bad');
        this.step(['exthash.notInPage', { x }], { line: 2 });
        return;
      }
      this.mark('k:' + page.keys[i].id, 'bad');
      this.step(null, { line: 2 });
      page.keys.splice(i, 1);
      this.ring('p:' + page.id, 'ok');
      this.step(['exthash.removed', { x }], { line: 3 });
      const S = this.s;
      let first = true;
      for (;;) {
        const b = this.buddy(page);
        if (!b || b.k !== page.k || b.keys.length + page.keys.length > cap) {
          if (first && b) {
            this.ring(null);
            this.step(['exthash.noMerge'], { line: 5 });
          }
          break;
        }
        first = false;
        const k = page.k;
        // la page dont le bit k vaut 0 est conservée
        const i0 = S.dir.indexOf(page.id);
        const [keepP, gone] = bits(i0, S.d)[k - 1] === '0' ? [page, b] : [b, page];
        this.mark('p:' + keepP.id, 'hl');
        this.mark('p:' + gone.id, 'hl');
        this.ring(null);
        this.step(['exthash.merge', { k, k1: k - 1, n: keepP.keys.length + gone.keys.length, c: cap }], { line: 5 });
        keepP.keys = sortKeys(keepP.keys.concat(gone.keys));
        keepP.k = k - 1;
        for (let j = 0; j < S.dir.length; j++) {
          if (S.dir[j] === gone.id) {
            S.dir[j] = keepP.id;
            this.mark(this.slotId(j), 'new');
          }
        }
        delete S.pages[gone.id];
        this.unmark('p:' + gone.id);
        this.mark('p:' + keepP.id, 'new');
        this.step(null, { line: 6 });
        for (let j = 0; j < S.dir.length; j++) this.unmark(this.slotId(j));
        this.unmark('p:' + keepP.id);
        page = keepP;
      }
      while (S.d > 0 && Object.values(S.pages).every((p) => p.k < S.d)) {
        const before = this.positions();
        const nd = [];
        for (let j = 0; j < S.dir.length; j += 2) nd.push(S.dir[j]);
        S.dir = nd;
        S.d--;
        for (let j = 0; j < nd.length; j++) {
          this.enterFrom(this.slotId(j), this.slotId(2 * j, S.d + 1), before);
          this.mark(this.slotId(j), 'new');
        }
        this.step(['exthash.halve', { d: S.d }], { line: 8 });
        for (let j = 0; j < nd.length; j++) this.unmark(this.slotId(j));
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

    /** Invariants : 2^(d−k) cases par page, clés bien placées, capacité respectée (sauf débordement). */
    check() {
      const S = this.s;
      const cap = S.cfg.cap;
      if (S.dir.length !== 1 << S.d) throw new Error('taille de l’index');
      const count = {};
      S.dir.forEach((id, i) => {
        const p = S.pages[id];
        if (!p) throw new Error('page absente ' + id);
        if (p.k > S.d) throw new Error('k > d');
        count[id] = (count[id] || 0) + 1;
        const pre = bits(i, S.d).slice(0, p.k);
        for (const e of p.keys) if (!this.hcode(e.key).startsWith(pre)) throw new Error(`${e.key} mal placé`);
      });
      const seen = new Set();
      for (const p of Object.values(S.pages)) {
        if (count[p.id] !== 1 << (S.d - p.k)) throw new Error(`page ${p.id} : ${count[p.id]} pointeurs au lieu de 2^(d−k)`);
        // cases contiguës
        const first = S.dir.indexOf(p.id);
        for (let j = first; j < first + count[p.id]; j++) if (S.dir[j] !== p.id) throw new Error('cases non contiguës');
        if (p.keys.length > cap && p.k < BITS) throw new Error('page trop pleine');
        for (const e of p.keys) {
          if (seen.has(e.key)) throw new Error('doublon ' + e.key);
          seen.add(e.key);
        }
      }
    }

    keys() {
      return Object.values(this.s.pages)
        .flatMap((p) => p.keys.map((e) => e.key))
        .sort();
    }

    /** Structure (pour les tests) : pour chaque case, [préfixe, clés de la page, k]. */
    shape() {
      const S = this.s;
      return S.dir.map((id, i) => [bits(i, S.d), S.pages[id].keys.map((e) => e.key).join(''), S.pages[id].k]);
    }

    /* --- dessin ------------------------------------------------------- */
    draw(S) {
      const st = this.s;
      const cap = st.cfg.cap;
      const d = st.d;
      const enter = this.enter || {};
      const node = (id, spec) => S.node(id, Object.assign(spec, enter[id] ? { enter: enter[id] } : {}));
      const cw = Math.max(46, d * 11 + 22);
      S.text('index', 0, -48, ['exthash.index', { d }], { cls: 'big' });
      st.dir.forEach((id, i) => {
        node(this.slotId(i), { shape: 'cell', x: 0, y: i * DY, w: cw, h: 34, label: d ? bits(i, d) : 'ε', fontSize: 13 });
      });
      // pages, dans l'ordre de leur première case
      const order = [];
      st.dir.forEach((id, i) => {
        if (!order.length || order[order.length - 1].id !== id) order.push({ id, first: i, n: 0 });
        order[order.length - 1].n++;
      });
      let maxRight = PX;
      for (const o of order) {
        const p = st.pages[o.id];
        const y = (o.first + (o.n - 1) / 2) * DY;
        const over = p.k >= BITS && p.keys.length > cap;
        const slots = over ? cap : Math.max(cap, p.keys.length);
        const w = slots * SLOT + 8;
        node('p:' + p.id, { shape: 'box', x: PX + w / 2, y, w, h: 38, label: '', cls: 'leaf' });
        const slotX = (base, j) => base + 4 + SLOT / 2 + j * SLOT;
        for (let j = 0; j < slots; j++) {
          const e = p.keys[j];
          if (e) node('k:' + e.id, { shape: 'box', x: slotX(PX, j), y, w: 26, h: 28, label: e.key, cls: 'key' });
          else S.node(`s:${p.id}:${j}`, { shape: 'cell', x: slotX(PX, j), y, w: 26, h: 28, label: '', cls: 'ghost' });
        }
        let right = PX + w;
        if (over) {
          const rest = p.keys.slice(cap);
          const ow = rest.length * SLOT + 8;
          const ox = right + 30;
          node('o:' + p.id, { shape: 'box', x: ox + ow / 2, y, w: ow, h: 38, label: '', cls: 'leaf', sub: ['exthash.overflowLbl'] });
          rest.forEach((e, j) => node('k:' + e.id, { shape: 'box', x: slotX(ox, j), y, w: 26, h: 28, label: e.key, cls: 'key' }));
          S.edge('p:' + p.id, 'o:' + p.id, { arrow: true, cls: 'dash thin', fromSide: 'right', toSide: 'left' });
          right = ox + ow;
        }
        S.text('kd:' + p.id, right + 34, y, `k = ${p.k}`, { cls: 'dim' });
        maxRight = Math.max(maxRight, right + 50);
      }
      st.dir.forEach((id, i) => {
        S.edge(this.slotId(i), 'p:' + id, { arrow: true, cls: 'thin', fromSide: 'right', toSide: 'left' });
      });
      // table des codes
      const keys = this.keys();
      const perCol = 13;
      const cols = Math.ceil(keys.length / perCol);
      const tx = -cw / 2 - 50 - cols * 86;
      if (keys.length) S.text('codes', tx + 32, -48, ['exthash.codes'], { cls: 'mono dim' });
      keys.forEach((k, i) => {
        const cur = this.cur && this.cur.key === k;
        S.text('code:' + k, tx + 32 + Math.floor(i / perCol) * 86, (i % perCol) * 20, `${k}  ${this.hcode(k)}`, {
          cls: 'mono' + (cur ? ' hl' : ''),
        });
      });
      if (this.cur) {
        const c = this.cur;
        const cx = PX / 2;
        S.text('hx', cx - 72, -90, `h(${c.key}) =`, { cls: 'mono', size: 17 });
        for (let j = 0; j < BITS; j++) {
          S.text('hb:' + j, cx - 24 + j * 18, -90, c.code[j], { cls: j < c.upto ? 'mono hl' : 'mono dim', size: 18 });
        }
      }
      const bottom = Math.max(st.dir.length * DY, keys.length ? Math.min(keys.length, perCol) * 20 : 0);
      S.text('info', (tx + maxRight) / 2, bottom + 14, ['exthash.info', { c: cap, n: keys.length, p: order.length, s: st.dir.length }], {
        cls: 'dim',
      });
    }
  }

  ExtHash.controls = [
    { type: 'input', name: 'key', size: 10, placeholder: 'ctl.keys' },
    { type: 'button', label: 'ctl.insert', op: 'insert', args: ['key'], primary: true },
    { type: 'button', label: 'ctl.delete', op: 'delete', args: ['key'] },
    { type: 'button', label: 'ctl.search', op: 'search', args: ['key'] },
    { type: 'sep' },
    {
      type: 'select',
      name: 'cap',
      label: 'exthash.ctl.cap',
      op: 'setCap',
      value: '4',
      options: [2, 3, 4].map((v) => ({ value: String(v), label: String(v) })),
    },
    { type: 'sep' },
    { type: 'button', label: 'ctl.random', op: 'random' },
  ];

  ExtHash.code = {
    insert: {
      title: { fr: 'Ajout en hachage extensible', en: 'Extendible hashing insertion' },
      source: 'site',
      lines: [
        'def HE_Ajout(x, I):',
        '    b = h(x)',
        '    P = Page(I[b[1..d]])        # d premiers bits de h(x)',
        '    Ajouter(x, P)',
        '    while Taille(P) > C:        # la page deborde',
        '        if k(P) == len(b): ChainerDebordement(P); break',
        '        if k(P) == d:           # une seule case pointe sur P',
        '            DoublerIndex(I); d = d + 1',
        '        P0, P1 = Repartir(P, bit k(P) + 1)  # profondeur k(P) + 1',
        '        I[cases de P dont le bit k(P) + 1 vaut 1] = P1',
        '        P = la page qui deborde (s\'il y en a une)',
      ],
    },
    search: {
      title: { fr: 'Recherche', en: 'Search' },
      source: 'site',
      lines: ['def HE_Recherche(x, I):', '    b = h(x)', '    return x in Page(I[b[1..d]])  # 1 acces index + 1 acces disque'],
    },
    delete: {
      title: { fr: 'Suppression (avec fusion)', en: 'Deletion (with merging)' },
      source: 'site',
      lines: [
        'def HE_Suppression(x, I):',
        '    P = Page(I[h(x)[1..d]])',
        '    Retirer(x, P)',
        '    # fusion avec la page copain (meme k, bit k different)',
        '    while k(P) > 0 and k(Copain(P)) == k(P) and |P| + |Copain(P)| <= C:',
        '        P = Fusion(P, Copain(P)); k(P) = k(P) - 1',
        '    while d > 0 and toutes les pages ont k < d:',
        '        DiviserIndex(I); d = d - 1',
      ],
    },
  };

  ExtHash.legend = [
    ['var(--cmp)', { fr: 'case / page examinées', en: 'visited slot / page' }],
    ['var(--hl)', { fr: 'bits lus', en: 'bits read' }],
    ['var(--bad)', { fr: 'page qui déborde', en: 'overflowing page' }],
    ['var(--new)', { fr: 'nouvelle case / page', en: 'new slot / page' }],
  ];

  DT.register('exthash', ExtHash);
})();