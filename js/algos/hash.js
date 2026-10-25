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

/* Table de hachage : chaînage séparé et adressage ouvert (chapitre 4). */
(function () {
  'use strict';

  const DT = window.DT;

  const SUBS = '₀₁₂₃₄₅₆₇₈₉';
  const sub = (n) => String(n).split('').map((c) => SUBS[+c]).join('');
  const mod = (a, m) => ((a % m) + m) % m;
  const dec = (v, n) => ({ fr: v.toFixed(n).replace('.', ','), en: v.toFixed(n) });
  const plural = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;

  const METHOD_NAMES = {
    linear: { fr: 'sondage linéaire', en: 'linear probing' },
    quadratic: { fr: 'sondage quadratique', en: 'quadratic probing' },
    double: { fr: 'double hachage', en: 'double hashing' },
    chain: { fr: 'chaînage séparé', en: 'separate chaining' },
  };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  DT.i18n.add({
    fr: {
      'hash.ctl.method': 'Collisions',
      'hash.ctl.size': 'm =',
      'hash.m.linear': 'Sondage linéaire',
      'hash.m.quadratic': 'Sondage quadratique',
      'hash.m.double': 'Double hachage',
      'hash.m.chain': 'Chaînage séparé',
      'hash.op.setMethod': (p) => 'Gestion des collisions : ' + (METHOD_NAMES[p.x] || {}).fr,
      'hash.op.setSize': 'Taille de la table : m = {x}',
      'hash.setMethod': (p) => `${cap(METHOD_NAMES[p.x].fr)} : la table est vidée.`,
      'hash.setSize': 'Table de taille m = {m} : la table est vidée.',
      'hash.formula': 'h(x) = x mod {m}',
      'hash.formulaD': 'h(x) = x mod {m}  ·  d(x) = 1 + (x mod {m1})',
      'hash.alpha': 'n = {n}, taux de remplissage α = n/m = {n}/{m} ≈ {a}',
      'hash.trail': 'Essais : {l}',
      'hash.h': 'h({x}) = {x} mod {m} = {v}.',
      'hash.d': 'd({x}) = 1 + ({x} mod {m1}) = {d} : c’est le pas entre deux essais.',
      'hash.p.empty': 'Essai {i} : {f}, case vide.',
      'hash.p.occ': 'Essai {i} : {f}, case occupée par {y} : collision.',
      'hash.p.tomb': 'Essai {i} : {f}, pierre tombale : on la retient (réutilisable) et on continue.',
      'hash.p.tombSkip': 'Essai {i} : {f}, pierre tombale : on continue.',
      'hash.p.same': 'Essai {i} : {f}, la case contient {x}.',
      'hash.p.other': 'Essai {i} : {f}, {y} ≠ {x} : on continue.',
      'hash.stored': (p) => `${p.x} est rangé en case ${p.v} (${plural(p.n, 'essai')}).`,
      'hash.storedTomb': (p) =>
        `${p.x} est rangé en case ${p.v}, à la place de la première pierre tombale rencontrée (${plural(p.n, 'essai')}).`,
      'hash.full': 'Table pleine : impossible d’ajouter {x}.',
      'hash.quadFull':
        'Les {c} cases atteintes par le sondage quadratique sont occupées : impossible d’ajouter {x}, bien que la table ait des cases libres (la suite d’essais ne couvre pas toute la table).',
      'hash.found': (p) => `${p.x} est présent en case ${p.v} (${plural(p.n, 'essai')}).`,
      'hash.absentEmpty': (p) => `Case vide : ${p.x} est absent (${plural(p.n, 'essai')}).`,
      'hash.absentAll': '{x} est absent : toute la suite d’essais a été parcourue.',
      'hash.tombstone':
        '{x} est remplacé par une pierre tombale † : vider la case casserait les suites d’essais des autres clés.',
      'hash.listEmpty': 'La liste T[{v}] est vide.',
      'hash.listCmp': '{y} ≠ {x} : maillon suivant.',
      'hash.listFirst': '{x} devient le premier maillon de la liste T[{v}].',
      'hash.listEnd': 'Fin de la liste : {x} est ajouté en queue de T[{v}].',
      'hash.listFound': '{x} est dans la liste T[{v}].',
      'hash.listAbsent': 'Fin de la liste T[{v}] : {x} est absent.',
      'hash.listRemoved': '{x} est retiré de la liste T[{v}].',
      'hash.collision': 'Collision : on applique la stratégie « {name} ».',
    },
    en: {
      'hash.ctl.method': 'Collisions',
      'hash.ctl.size': 'm =',
      'hash.m.linear': 'Linear probing',
      'hash.m.quadratic': 'Quadratic probing',
      'hash.m.double': 'Double hashing',
      'hash.m.chain': 'Separate chaining',
      'hash.op.setMethod': (p) => 'Collision handling: ' + (METHOD_NAMES[p.x] || {}).en,
      'hash.op.setSize': 'Table size: m = {x}',
      'hash.setMethod': (p) => `${cap(METHOD_NAMES[p.x].en)}: the table is cleared.`,
      'hash.setSize': 'Table of size m = {m}: the table is cleared.',
      'hash.formula': 'h(x) = x mod {m}',
      'hash.formulaD': 'h(x) = x mod {m}  ·  d(x) = 1 + (x mod {m1})',
      'hash.alpha': 'n = {n}, load factor α = n/m = {n}/{m} ≈ {a}',
      'hash.trail': 'Probes: {l}',
      'hash.h': 'h({x}) = {x} mod {m} = {v}.',
      'hash.d': 'd({x}) = 1 + ({x} mod {m1}) = {d}: the step between two probes.',
      'hash.p.empty': 'Probe {i}: {f}, empty slot.',
      'hash.p.occ': 'Probe {i}: {f}, slot taken by {y}: collision.',
      'hash.p.tomb': 'Probe {i}: {f}, tombstone: remember it (reusable) and go on.',
      'hash.p.tombSkip': 'Probe {i}: {f}, tombstone: go on.',
      'hash.p.same': 'Probe {i}: {f}, the slot holds {x}.',
      'hash.p.other': 'Probe {i}: {f}, {y} ≠ {x}: go on.',
      'hash.stored': (p) => `${p.x} is stored in slot ${p.v} (${plural(p.n, 'probe')}).`,
      'hash.storedTomb': (p) =>
        `${p.x} is stored in slot ${p.v}, in place of the first tombstone met (${plural(p.n, 'probe')}).`,
      'hash.full': 'The table is full: cannot insert {x}.',
      'hash.quadFull':
        'The {c} slots reached by quadratic probing are all taken: cannot insert {x}, although the table has free slots (the probe sequence does not cover the whole table).',
      'hash.found': (p) => `${p.x} is present in slot ${p.v} (${plural(p.n, 'probe')}).`,
      'hash.absentEmpty': (p) => `Empty slot: ${p.x} is absent (${plural(p.n, 'probe')}).`,
      'hash.absentAll': '{x} is absent: the whole probe sequence was scanned.',
      'hash.tombstone': '{x} is replaced by a tombstone †: emptying the slot would break the probe sequences of other keys.',
      'hash.listEmpty': 'The list T[{v}] is empty.',
      'hash.listCmp': '{y} ≠ {x}: next link.',
      'hash.listFirst': '{x} becomes the first link of the list T[{v}].',
      'hash.listEnd': 'End of the list: {x} is appended to T[{v}].',
      'hash.listFound': '{x} is in the list T[{v}].',
      'hash.listAbsent': 'End of the list T[{v}]: {x} is absent.',
      'hash.listRemoved': '{x} is removed from the list T[{v}].',
      'hash.collision': 'Collision: apply the “{name}” strategy.',
    },
  });

  const CW = 50; // espacement des cases

  class HashTable extends DT.Algo {
    initState(cfg) {
      cfg = cfg || { method: 'linear', size: 11 };
      const T = [];
      for (let i = 0; i < cfg.size; i++) T.push(cfg.method === 'chain' ? [] : null);
      return { nextId: 1, cfg: { method: cfg.method, size: cfg.size }, T };
    }

    clear() {
      this.s = this.initState(this.s.cfg);
      this.step('msg.cleared');
    }

    clearMarks() {
      super.clearMarks();
      this.info = [];
      this.trail = [];
    }

    setMethod(v) {
      if (!METHOD_NAMES[v]) throw new Error('méthode ' + v);
      this.s = this.initState({ method: v, size: this.s.cfg.size });
      this.step(['hash.setMethod', { x: v }]);
    }

    setSize(v) {
      const m = parseInt(v, 10);
      if (![7, 11, 13, 17].includes(m)) throw new Error('taille ' + v);
      this.s = this.initState({ method: this.s.cfg.method, size: m });
      this.step(['hash.setSize', { m }]);
    }

    /* --- fonctions de hachage ------------------------------------------ */
    h(x) {
      return mod(x, this.s.cfg.size);
    }
    d(x) {
      return 1 + mod(x, this.s.cfg.size - 1);
    }
    /** i-ème essai (i ≥ 1) pour la méthode courante. */
    probe(x, i) {
      const m = this.s.cfg.size;
      const h = this.h(x);
      switch (this.s.cfg.method) {
        case 'quadratic':
          return mod(h + (i - 1) * (i - 1), m);
        case 'double':
          return mod(h + this.d(x) * (i - 1), m);
        default:
          return mod(h + i - 1, m);
      }
    }
    /** Nombre maximal d'essais distincts utiles. */
    maxProbes() {
      const m = this.s.cfg.size;
      return this.s.cfg.method === 'quadratic' ? Math.ceil(m / 2) : m;
    }
    /** Formule de l'essai i, sous forme de texte (indépendant de la langue). */
    formula(x, i) {
      const m = this.s.cfg.size;
      const h = this.h(x);
      const v = this.probe(x, i);
      const hi = `h${sub(i)}(${x})`;
      if (i === 1) return `${hi} = h(${x}) = ${v}`;
      switch (this.s.cfg.method) {
        case 'quadratic':
          return `${hi} = (${h} + ${i - 1}²) mod ${m} = ${v}`;
        case 'double':
          return `${hi} = (${h} + ${i - 1} × ${this.d(x)}) mod ${m} = ${v}`;
        default:
          return `${hi} = (${h} + ${i - 1}) mod ${m} = ${v}`;
      }
    }

    count() {
      if (this.s.cfg.method === 'chain') return this.s.T.reduce((a, l) => a + l.length, 0);
      return this.s.T.filter((c) => c && !c.tomb).length;
    }

    /** Étapes communes : calcul de h(x) (et de d(x)). */
    showHash(x, bubble, line) {
      const m = this.s.cfg.size;
      const v = this.h(x);
      if (bubble) bubble(v);
      this.ring('slot:' + v, 'cmp');
      this.info.push(`h(${x}) = ${x} mod ${m} = ${v}`);
      this.step(['hash.h', { x, m, v }], { line });
      if (this.s.cfg.method === 'double') {
        const d = this.d(x);
        this.info.push(`d(${x}) = 1 + (${x} mod ${m - 1}) = ${d}`);
        this.step(['hash.d', { x, m1: m - 1, d }], { line: 2, code: 'hfun' });
      }
      return v;
    }

    /* --- ajout -------------------------------------------------------- */
    insert(x) {
      if (this.s.cfg.method === 'chain') return this.insertChain(x);
      this.code('insert');
      const T = this.s.T;
      const id = this.newId();
      const bubble = (v) =>
        this.float('cand', { id: 'k:' + id, label: x, cls: 'new', shape: 'box', w: 38, h: 30, at: 'slot:' + v, dx: 0, dy: -74 });
      this.showHash(x, bubble, 5);
      const max = this.maxProbes();
      let libre = null;
      let i = 1;
      for (; i <= max; i++) {
        const v = this.probe(x, i);
        const c = T[v];
        bubble(v);
        this.ring('slot:' + v, 'cmp');
        this.trail.push(String(v));
        const f = this.formula(x, i);
        const first = i === 1;
        if (!c) {
          this.step(['hash.p.empty', { i, f }], first ? { line: 6 } : { line: 6, code: 'collision' });
          const at = libre !== null ? libre : v;
          T[at] = { id, key: x };
          this.float('cand', null);
          this.ring('slot:' + at, 'ok');
          this.mark('k:' + id, 'new');
          this.step([libre !== null ? 'hash.storedTomb' : 'hash.stored', { x, v: at, n: i }], first ? { line: 7 } : { line: 8, code: 'collision' });
          return;
        }
        if (c.tomb) {
          if (libre === null) libre = v;
          this.step(['hash.p.tomb', { i, f }], first ? { line: 9 } : { line: 10, code: 'collision' });
        } else if (c.key === x) {
          this.ring('slot:' + v, 'ok');
          this.mark('k:' + c.id, 'ok');
          this.float('cand', null);
          this.step(['c.already', { x }], first ? { line: 8 } : { line: 12, code: 'collision' });
          return;
        } else {
          this.mark('k:' + c.id, 'cmp');
          this.step(['hash.p.occ', { i, f, y: c.key }], first ? { line: 9 } : { line: 5, code: 'collision' });
          this.unmark('k:' + c.id);
        }
        if (first) this.code('collision');
      }
      if (libre !== null) {
        T[libre] = { id, key: x };
        this.float('cand', null);
        this.ring('slot:' + libre, 'ok');
        this.mark('k:' + id, 'new');
        this.step(['hash.storedTomb', { x, v: libre, n: max }], { line: 14, code: 'collision' });
        return;
      }
      this.float('cand', null);
      this.ring(null);
      const quadLeft = this.s.cfg.method === 'quadratic' && T.some((c) => !c);
      this.step([quadLeft ? 'hash.quadFull' : 'hash.full', { x, c: max }], { line: 13, code: 'collision' });
    }

    insertChain(x) {
      this.code('chain');
      const T = this.s.T;
      const id = this.newId();
      const bubble = (v) =>
        this.float('cand', { id: 'k:' + id, label: x, cls: 'new', shape: 'box', w: 38, h: 30, at: 'slot:' + v, dx: 0, dy: -74 });
      const v = this.showHash(x, bubble, 2);
      const L = T[v];
      if (!L.length) {
        this.step(['hash.listEmpty', { v }], { line: 3 });
      }
      for (const e of L) {
        this.ring('k:' + e.id, 'cmp');
        if (e.key === x) {
          this.ring('k:' + e.id, 'ok');
          this.mark('k:' + e.id, 'ok');
          this.float('cand', null);
          this.step(['c.already', { x }], { line: 3 });
          return;
        }
        this.step(['hash.listCmp', { x, y: e.key }], { line: 3 });
      }
      L.push({ id, key: x });
      this.float('cand', null);
      this.ring('k:' + id, 'ok');
      this.mark('k:' + id, 'new');
      this.step([L.length === 1 ? 'hash.listFirst' : 'hash.listEnd', { x, v }], { line: 4 });
    }

    /* --- recherche / suppression -------------------------------------- */
    /** Parcourt la suite d'essais ; renvoie la position de x ou -1. */
    seek(x, del) {
      const T = this.s.T;
      this.float('probe', { id: 'probe', label: x, cls: 'cmp', shape: 'box', w: 38, h: 30, at: 'slot:' + this.h(x), dx: 0, dy: -74 });
      this.showHash(x, null, 3);
      const max = this.maxProbes();
      for (let i = 1; i <= max; i++) {
        const v = this.probe(x, i);
        const c = T[v];
        this.float('probe', { id: 'probe', label: x, cls: 'cmp', shape: 'box', w: 38, h: 30, at: 'slot:' + v, dx: 0, dy: -74 });
        this.ring('slot:' + v, 'cmp');
        this.trail.push(String(v));
        const f = this.formula(x, i);
        if (!c) {
          this.step(['hash.p.empty', { i, f }], { line: 4 });
          this.ring('slot:' + v, 'bad');
          this.float('probe', null);
          this.step(['hash.absentEmpty', { x, n: i }], { line: 5 });
          return -1;
        }
        if (c.tomb) {
          this.step(['hash.p.tombSkip', { i, f }], { line: 6 });
        } else if (c.key === x) {
          this.ring('slot:' + v, 'ok');
          this.mark('k:' + c.id, 'ok');
          this.float('probe', null);
          this.step(['hash.p.same', { i, f, x }], { line: 6 });
          if (!del) this.step(['hash.found', { x, v, n: i }], { line: 7 });
          return v;
        } else {
          this.mark('k:' + c.id, 'cmp');
          this.step(['hash.p.other', { i, f, x, y: c.key }], { line: 6 });
          this.unmark('k:' + c.id);
        }
      }
      this.float('probe', null);
      this.ring(null);
      this.step(['hash.absentAll', { x }], { line: del ? 9 : 8 });
      return -1;
    }

    search(x) {
      if (this.s.cfg.method === 'chain') return this.seekChain(x, false) >= 0;
      this.code('search');
      return this.seek(x, false) >= 0;
    }

    delete(x) {
      if (this.s.cfg.method === 'chain') {
        this.seekChain(x, true);
        return;
      }
      this.code('delete');
      const v = this.seek(x, true);
      if (v < 0) return;
      const c = this.s.T[v];
      this.mark('k:' + c.id, 'bad');
      this.ring('slot:' + v, 'bad');
      this.step(null, { line: 7 });
      this.s.T[v] = { tomb: true };
      this.ring('slot:' + v, 'hl');
      this.step(['hash.tombstone', { x }], { line: 7 });
    }

    seekChain(x, del) {
      this.code('chain');
      const T = this.s.T;
      this.float('probe', { id: 'probe', label: x, cls: 'cmp', shape: 'box', w: 38, h: 30, at: 'slot:' + this.h(x), dx: 0, dy: -74 });
      const v = this.showHash(x, null, del ? 11 : 8);
      const L = T[v];
      const line = del ? 12 : 8;
      for (let j = 0; j < L.length; j++) {
        const e = L[j];
        this.ring('k:' + e.id, 'cmp');
        if (e.key === x) {
          this.ring('k:' + e.id, del ? 'bad' : 'ok');
          this.mark('k:' + e.id, del ? 'bad' : 'ok');
          this.float('probe', null);
          this.step(['hash.listFound', { x, v }], { line });
          if (del) {
            L.splice(j, 1);
            this.ring('slot:' + v, 'ok');
            this.step(['hash.listRemoved', { x, v }], { line });
          }
          return j;
        }
        this.step(['hash.listCmp', { x, y: e.key }], { line });
      }
      this.float('probe', null);
      this.ring('slot:' + v, 'bad');
      this.step([L.length ? 'hash.listAbsent' : 'hash.listEmpty', { x, v }], { line });
      if (!L.length) this.step(['c.notFound', { x }], { line });
      return -1;
    }

    random() {
      this.clear();
      const m = this.s.cfg.size;
      const n = this.s.cfg.method === 'chain' ? m : Math.round(m * 0.6);
      for (const v of DT.util.randDistinct(n, 1, 99)) {
        this.step(['op.insert', { x: v }], { op: true, code: null });
        this.insert(v);
        this.clearMarks();
      }
    }

    /** Invariants : chaque clé est atteinte par sa suite d'essais (ou est dans sa liste), sans doublon. */
    check() {
      const T = this.s.T;
      const m = this.s.cfg.size;
      if (T.length !== m) throw new Error('taille de table');
      const seen = new Set();
      if (this.s.cfg.method === 'chain') {
        T.forEach((L, v) => {
          for (const e of L) {
            if (seen.has(e.key)) throw new Error('doublon ' + e.key);
            seen.add(e.key);
            if (this.h(e.key) !== v) throw new Error(`${e.key} dans la mauvaise liste`);
          }
        });
        return;
      }
      T.forEach((c, v) => {
        if (!c || c.tomb) return;
        if (seen.has(c.key)) throw new Error('doublon ' + c.key);
        seen.add(c.key);
        for (let i = 1; ; i++) {
          if (i > this.maxProbes()) throw new Error(`${c.key} hors de sa suite d'essais`);
          const p = this.probe(c.key, i);
          if (p === v) break;
          if (!T[p]) throw new Error(`${c.key} inaccessible (case ${p} vide)`);
        }
      });
    }

    keys() {
      const out = [];
      for (const c of this.s.T) {
        if (Array.isArray(c)) c.forEach((e) => out.push(e.key));
        else if (c && !c.tomb) out.push(c.key);
      }
      return out.sort((a, b) => a - b);
    }

    /* --- dessin ------------------------------------------------------- */
    draw(S) {
      const { size: m, method } = this.s.cfg;
      const T = this.s.T;
      const X = (i) => (i - (m - 1) / 2) * CW;
      S.text('title', 0, -124, ['hash.m.' + method], { cls: 'title' });
      S.text('formula', 0, -102, method === 'double' ? ['hash.formulaD', { m, m1: m - 1 }] : ['hash.formula', { m }], {
        cls: 'mono dim',
      });
      let bottom = 20;
      for (let i = 0; i < m; i++) {
        const c = T[i];
        const tomb = c && c.tomb;
        S.node('slot:' + i, {
          shape: 'cell',
          x: X(i),
          y: 0,
          w: 44,
          h: 40,
          top: String(i),
          label: tomb ? '†' : '',
          cls: tomb ? 'muted' : '',
          fontSize: tomb ? 24 : undefined,
        });
      }
      for (let i = 0; i < m; i++) {
        const c = T[i];
        if (method === 'chain') {
          let prev = 'slot:' + i;
          c.forEach((e, j) => {
            const y = 74 + j * 50;
            S.node('k:' + e.id, { shape: 'box', x: X(i), y, w: 40, h: 30, label: e.key, cls: 'key' });
            S.edge(prev, 'k:' + e.id, { arrow: true, fromSide: 'bottom', toSide: 'top', cls: 'thin' });
            prev = 'k:' + e.id;
            bottom = Math.max(bottom, y + 15);
          });
        } else if (c && !c.tomb) {
          S.node('k:' + c.id, { shape: 'box', x: X(i), y: 0, w: 44, h: 40, label: c.key, cls: 'key' });
        }
      }
      const n = this.count();
      let y = bottom + 30;
      S.text('alpha', 0, y, ['hash.alpha', { n, m, a: dec(n / m, 2) }], { cls: 'dim' });
      for (const [j, line] of (this.info || []).entries()) {
        y += 24;
        S.text('info:' + j, 0, y, line, { cls: 'mono' });
      }
      if (this.trail && this.trail.length) {
        y += 24;
        S.text('trail', 0, y, ['hash.trail', { l: this.trail.join(' → ') }], { cls: 'mono accent' });
      }
    }
  }

  const methods = ['linear', 'quadratic', 'double', 'chain'];
  HashTable.controls = [
    { type: 'input', name: 'key', size: 10, placeholder: 'ctl.keys' },
    { type: 'button', label: 'ctl.insert', op: 'insert', args: ['key'], primary: true },
    { type: 'button', label: 'ctl.delete', op: 'delete', args: ['key'] },
    { type: 'button', label: 'ctl.search', op: 'search', args: ['key'] },
    { type: 'sep' },
    {
      type: 'select',
      name: 'method',
      label: 'hash.ctl.method',
      op: 'setMethod',
      value: 'linear',
      options: methods.map((v) => ({ value: v, label: METHOD_NAMES[v] })),
    },
    {
      type: 'select',
      name: 'size',
      label: 'hash.ctl.size',
      op: 'setSize',
      value: '11',
      options: [7, 11, 13, 17].map((v) => ({ value: String(v), label: String(v) })),
    },
    { type: 'sep' },
    { type: 'button', label: 'ctl.random', op: 'random' },
  ];

  HashTable.code = {
    insert: {
      title: { fr: 'Ajout (transparents du cours)', en: 'Insertion (lecture slides)' },
      source: 'course',
      lines: [
        'def H_Ajout(x, T, h):',
        '    """ elt * Table * FonctionH -> Table',
        '        Renvoie la table resultant de l\'ajout de x."""',
        '',
        '    v = h(x)',
        '    if EstVide(T[v]):',
        '        T[v] = x',
        '    elif T[v] != x:',
        '        GererCollision(x, T)',
        '',
        '    return T',
      ],
    },
    collision: {
      title: { fr: 'Adressage ouvert : gestion des collisions', en: 'Open addressing: collision handling' },
      source: 'site',
      lines: [
        'def GererCollision(x, T):',
        '    """ essais h_1(x) = h(x), h_2(x), ... """',
        '    libre = None    # premiere pierre tombale vue',
        '    for i in range(1, m + 1):',
        '        v = h_i(x)',
        '        if EstVide(T[v]):',
        '            if libre is None: libre = v',
        '            T[libre] = x; return T',
        '        if EstSupprimee(T[v]):',
        '            if libre is None: libre = v',
        '        elif T[v] == x:',
        '            return T',
        '    if libre is None: erreur("table pleine")',
        '    T[libre] = x; return T',
      ],
    },
    hfun: {
      title: { fr: 'Fonctions de hachage et suites d’essais', en: 'Hash functions and probe sequences' },
      source: 'site',
      lines: [
        'def h(x): return x % m             # division',
        'def d(x): return 1 + x % (m - 1)   # double hachage',
        '# i-eme essai, i = 1, 2, ..., m',
        'def h_i(x): return (h(x) + i - 1) % m           # lineaire',
        'def h_i(x): return (h(x) + (i - 1)**2) % m      # quadratique',
        'def h_i(x): return (h(x) + d(x) * (i - 1)) % m  # double',
      ],
    },
    search: {
      title: { fr: 'Recherche (adressage ouvert)', en: 'Search (open addressing)' },
      source: 'site',
      lines: [
        'def H_Recherche(x, T):',
        '    for i in range(1, m + 1):',
        '        v = h_i(x)',
        '        if EstVide(T[v]):',
        '            return False',
        '        if not EstSupprimee(T[v]) and T[v] == x:',
        '            return True',
        '    return False',
      ],
    },
    delete: {
      title: { fr: 'Suppression (adressage ouvert)', en: 'Deletion (open addressing)' },
      source: 'site',
      lines: [
        'def H_Suppression(x, T):',
        '    for i in range(1, m + 1):',
        '        v = h_i(x)',
        '        if EstVide(T[v]):',
        '            return T    # x absent',
        '        if not EstSupprimee(T[v]) and T[v] == x:',
        '            T[v] = SUPPRIMEE    # pierre tombale',
        '            return T',
        '    return T',
      ],
    },
    chain: {
      title: { fr: 'Chaînage séparé', en: 'Separate chaining' },
      source: 'site',
      lines: [
        'def HCS_Ajout(x, T, h):',
        '    v = h(x)',
        '    if not Appartient(x, T[v]):',
        '        T[v] = AjoutFin(x, T[v])',
        '    return T',
        '',
        'def HCS_Recherche(x, T, h):',
        '    return Appartient(x, T[h(x)])',
        '',
        'def HCS_Suppression(x, T, h):',
        '    v = h(x)',
        '    T[v] = Supprimer(x, T[v])',
        '    return T',
      ],
    },
  };

  HashTable.legend = [
    ['var(--cmp)', { fr: 'case examinée', en: 'probed slot' }],
    ['var(--ok)', { fr: 'clé trouvée / rangée', en: 'key found / stored' }],
    ['var(--bad)', { fr: 'échec, clé supprimée', en: 'failure, deleted key' }],
  ];

  DT.register('hash', HashTable);
})();