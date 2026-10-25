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

/* Files binomiales (chapitre 2) : suites de tournois binomiaux, union = addition binaire. */
(function () {
  'use strict';

  const DT = window.DT;

  const SUB = '₀₁₂₃₄₅₆₇₈₉';
  const sub = (n) => String(n).split('').map((c) => SUB[+c]).join('');
  const nu = (n) => n.toString(2).split('').filter((b) => b === '1').length;
  const bin = (n) => n.toString(2) + '₂';
  /** Nom d'un tournoi de degré k : TB₃ (fr) / T₃ (en). */
  const tb = (k) => ({ fr: 'TB' + sub(k), en: 'T' + sub(k) });
  /** Nom d'une file de taille n : FB₅ (fr) / BQ₅ (en). */
  const fb = (n) => ({ fr: 'FB' + sub(n), en: 'BQ' + sub(n) });
  const plural = (c, w) => `${c} ${w}${c > 1 ? 's' : ''}`;

  DT.i18n.add({
    fr: {
      'binomial.ctl.build': 'Construire',
      'binomial.ctl.union': 'Union',
      'binomial.ctl.extract': 'Supprimer le min',
      'binomial.ctl.decrease': 'Diminuer',
      'binomial.ctl.old': 'clé',
      'binomial.ctl.new': 'nouvelle',
      'binomial.op.union': 'Union avec la file {x}',
      'op.union': 'Union : {x}',
      'op.decreaseKey': 'Diminution d’une clé : {x}',
      'binomial.op.decreaseKey': (p) => {
        const [a, b] = String(p.x).split(' ');
        return `Diminution de la clé ${a} en ${b}`;
      },
      'binomial.empty': 'File vide.',
      'binomial.queue': '{f} : n = {b}',
      'binomial.zone': '{r} = {f} : n = {b}',
      'binomial.zoneEmpty': '{r} : vide',
      'binomial.carry': 'Retenue T',
      'binomial.carryEmpty': 'Retenue T : vide',
      'binomial.res': 'Résultat',
      'binomial.noMin': 'La file est vide : pas de minimum à supprimer.',
      'binomial.errDup': '{v} est déjà présent : les clés doivent être distinctes.',
      'binomial.errDec': '{y} n’est pas plus petit que {x} : la nouvelle clé doit être plus petite.',
      'binomial.fb1': 'On crée la file {f} réduite au tournoi {t} de racine {x}, puis on fait l’union.',
      'binomial.f2': 'Seconde file F2 = {f}, construite à partir de {l}.',
      'binomial.start': 'UnionFile(F1, F2) = UFret(F1, F2, vide) : c’est l’addition binaire {a} + {b}.',
      'binomial.f1Empty': 'Pas de retenue et F1 est vide : on renvoie F2, dont les tournois complètent le résultat.',
      'binomial.f2Empty': 'Pas de retenue et F2 est vide : on renvoie F1, dont les tournois complètent le résultat.',
      'binomial.minDeg': 'Pas de retenue. T1 = MinDeg(F1) = {a} (racine {x}), T2 = MinDeg(F2) = {b} (racine {y}).',
      'binomial.lt': 'Degre(T1) = {i} < Degre(T2) = {j} : AjoutMin(T1, UnionFile(Reste(F1), F2)).',
      'binomial.gt': 'Degre(T2) = {j} < Degre(T1) = {i} : AjoutMin(T2, UnionFile(Reste(F2), F1)) ; F1 et F2 échangent leurs rôles.',
      'binomial.eq': 'Degre(T1) = Degre(T2) = {i} : UFret(Reste(F1), Reste(F2), Union2Tid(T1, T2)).',
      'binomial.cmp': 'Union2Tid : on compare les racines {x} et {y} (une comparaison).',
      'binomial.linked': '{x} < {y} : {y} devient le premier enfant de {x}. On obtient {t}, la nouvelle retenue T.',
      'binomial.cF1Empty': 'Retenue T = {t} et F1 vide : UnionFile(File(T), F2).',
      'binomial.cF2Empty': 'Retenue T = {t} et F2 vide : UnionFile(File(T), F1) ; File(T) devient F1.',
      'binomial.carryMin': 'Retenue T = {t} (racine {z}), T1 = MinDeg(F1) = {a}, T2 = MinDeg(F2) = {b}.',
      'binomial.cLt': 'Degre(T) < Degre(T1) et Degre(T) < Degre(T2) : AjoutMin(T, UnionFile(F1, F2)).',
      'binomial.cEq3': 'Trois tournois de degré {i} : AjoutMin(T, UFret(Reste(F1), Reste(F2), Union2Tid(T1, T2))). T rejoint le résultat.',
      'binomial.cEq1': 'Degre(T) = Degre(T1) = {i} < Degre(T2) : UFret(Reste(F1), F2, Union2Tid(T1, T)).',
      'binomial.cEq2': 'Degre(T) = Degre(T2) = {i} < Degre(T1) : UFret(Reste(F2), F1, Union2Tid(T2, T)) ; F1 et F2 échangent leurs rôles.',
      'binomial.done': (p) =>
        `Union terminée : ${DT.i18n.resolve(p.f)}, avec ${plural(p.c, 'comparaison')} = ν(${p.n}) + ν(${p.m}) − ν(${p.s}) = ${p.a} + ${p.b} − ${p.d}.`,
      'binomial.first': 'Recherche du minimum parmi les racines : minimum provisoire {x}.',
      'binomial.newMin': '{y} < {x} : nouveau minimum provisoire {y}.',
      'binomial.keepMin': '{y} > {x} : le minimum provisoire reste {x}.',
      'binomial.min': (p) =>
        `Le minimum est ${p.x}, racine de ${DT.i18n.resolve(p.t)} (${plural(p.c, 'comparaison')} = ν(n) − 1).`,
      'binomial.decap': 'Decapite : sans sa racine, {t} donne la file ⟨{l}⟩ (F2). On fait l’union avec le reste de la file (F1).',
      'binomial.decapLeaf': 'Decapite : {t} réduit à sa racine donne la file vide (F2). On fait l’union avec le reste de la file (F1).',
      'binomial.extracted': 'Minimum supprimé : {x}.',
      'binomial.bStart': 'Construction par adjonctions successives des clés {l}.',
      'binomial.bAdd': 'Ajout de {x} : le tournoi {t} est placé à droite (FB₁ ∪ FB{k}).',
      'binomial.bCmp': 'Deux tournois {t} : Union2Tid compare leurs racines {x} et {y}.',
      'binomial.bLinked': '{x} < {y} : {y} devient le premier enfant de {x}, ce qui donne {t}.',
      'binomial.bDone': (p) =>
        `File construite : ${DT.i18n.resolve(p.f)}, avec ${plural(p.c, 'comparaison')} = n − ν(n) = ${p.n} − ${p.v}.`,
      'binomial.decFound': '{x} est trouvé (accès direct au nœud supposé).',
      'binomial.decSet': 'Sa clé devient {y} : elle doit éventuellement remonter.',
      'binomial.decSwap': '{y} < {z}, clé de son père : on les échange.',
      'binomial.decStop': '{y} > {z}, clé de son père : le tournoi est de nouveau croissant.',
      'binomial.decRoot': '{y} est à la racine de son tournoi : terminé.',
    },
    en: {
      'binomial.ctl.build': 'Build',
      'binomial.ctl.union': 'Union',
      'binomial.ctl.extract': 'Extract min',
      'binomial.ctl.decrease': 'Decrease',
      'binomial.ctl.old': 'key',
      'binomial.ctl.new': 'new',
      'binomial.op.union': 'Union with the queue {x}',
      'op.union': 'Union: {x}',
      'op.decreaseKey': 'Decrease a key: {x}',
      'binomial.op.decreaseKey': (p) => {
        const [a, b] = String(p.x).split(' ');
        return `Decrease key ${a} to ${b}`;
      },
      'binomial.empty': 'Empty queue.',
      'binomial.queue': '{f}: n = {b}',
      'binomial.zone': '{r} = {f}: n = {b}',
      'binomial.zoneEmpty': '{r}: empty',
      'binomial.carry': 'Carry T',
      'binomial.carryEmpty': 'Carry T: empty',
      'binomial.res': 'Result',
      'binomial.noMin': 'The queue is empty: no minimum to extract.',
      'binomial.errDup': '{v} is already present: keys must be distinct.',
      'binomial.errDec': '{y} is not smaller than {x}: the new key must be smaller.',
      'binomial.fb1': 'Create the queue {f} made of the single tournament {t} with root {x}, then take the union.',
      'binomial.f2': 'Second queue F2 = {f}, built from {l}.',
      'binomial.start': 'UnionFile(F1, F2) = UFret(F1, F2, empty): this is the binary addition {a} + {b}.',
      'binomial.f1Empty': 'No carry and F1 is empty: return F2, whose tournaments complete the result.',
      'binomial.f2Empty': 'No carry and F2 is empty: return F1, whose tournaments complete the result.',
      'binomial.minDeg': 'No carry. T1 = MinDeg(F1) = {a} (root {x}), T2 = MinDeg(F2) = {b} (root {y}).',
      'binomial.lt': 'Degree(T1) = {i} < Degree(T2) = {j}: AjoutMin(T1, UnionFile(Reste(F1), F2)).',
      'binomial.gt': 'Degree(T2) = {j} < Degree(T1) = {i}: AjoutMin(T2, UnionFile(Reste(F2), F1)); F1 and F2 swap roles.',
      'binomial.eq': 'Degree(T1) = Degree(T2) = {i}: UFret(Reste(F1), Reste(F2), Union2Tid(T1, T2)).',
      'binomial.cmp': 'Union2Tid: compare the roots {x} and {y} (one comparison).',
      'binomial.linked': '{x} < {y}: {y} becomes the first child of {x}. This gives {t}, the new carry T.',
      'binomial.cF1Empty': 'Carry T = {t} and F1 empty: UnionFile(File(T), F2).',
      'binomial.cF2Empty': 'Carry T = {t} and F2 empty: UnionFile(File(T), F1); File(T) becomes F1.',
      'binomial.carryMin': 'Carry T = {t} (root {z}), T1 = MinDeg(F1) = {a}, T2 = MinDeg(F2) = {b}.',
      'binomial.cLt': 'Degree(T) < Degree(T1) and Degree(T) < Degree(T2): AjoutMin(T, UnionFile(F1, F2)).',
      'binomial.cEq3': 'Three tournaments of degree {i}: AjoutMin(T, UFret(Reste(F1), Reste(F2), Union2Tid(T1, T2))). T joins the result.',
      'binomial.cEq1': 'Degree(T) = Degree(T1) = {i} < Degree(T2): UFret(Reste(F1), F2, Union2Tid(T1, T)).',
      'binomial.cEq2': 'Degree(T) = Degree(T2) = {i} < Degree(T1): UFret(Reste(F2), F1, Union2Tid(T2, T)); F1 and F2 swap roles.',
      'binomial.done': (p) =>
        `Union done: ${DT.i18n.resolve(p.f)}, with ${plural(p.c, 'comparison')} = ν(${p.n}) + ν(${p.m}) − ν(${p.s}) = ${p.a} + ${p.b} − ${p.d}.`,
      'binomial.first': 'Look for the minimum among the roots: current minimum {x}.',
      'binomial.newMin': '{y} < {x}: new current minimum {y}.',
      'binomial.keepMin': '{y} > {x}: the current minimum is still {x}.',
      'binomial.min': (p) =>
        `The minimum is ${p.x}, root of ${DT.i18n.resolve(p.t)} (${plural(p.c, 'comparison')} = ν(n) − 1).`,
      'binomial.decap': 'Decapite: without its root, {t} gives the queue ⟨{l}⟩ (F2). Take the union with the rest of the queue (F1).',
      'binomial.decapLeaf': 'Decapite: {t}, reduced to its root, gives the empty queue (F2). Take the union with the rest of the queue (F1).',
      'binomial.extracted': 'Extracted minimum: {x}.',
      'binomial.bStart': 'Build by successive insertions of the keys {l}.',
      'binomial.bAdd': 'Insert {x}: the tournament {t} is put on the right (BQ₁ ∪ BQ{k}).',
      'binomial.bCmp': 'Two tournaments {t}: Union2Tid compares their roots {x} and {y}.',
      'binomial.bLinked': '{x} < {y}: {y} becomes the first child of {x}, which gives {t}.',
      'binomial.bDone': (p) =>
        `Queue built: ${DT.i18n.resolve(p.f)}, with ${plural(p.c, 'comparison')} = n − ν(n) = ${p.n} − ${p.v}.`,
      'binomial.decFound': '{x} is found (direct access to the node is assumed).',
      'binomial.decSet': 'Its key becomes {y}: it may have to move up.',
      'binomial.decSwap': '{y} < {z}, its parent’s key: swap them.',
      'binomial.decStop': '{y} > {z}, its parent’s key: the tournament is increasing again.',
      'binomial.decRoot': '{y} is at the root of its tournament: done.',
    },
  });

  const deg = (t) => t.ch.length;
  const size = (q) => q.reduce((s, t) => s + (1 << deg(t)), 0);
  const last = (q) => q[q.length - 1];

  class Binomial extends DT.Algo {
    initState() {
      // q : tournois par degrés décroissants ; u : zones de l'union en cours
      return { nextId: 1, nextSid: 1, q: [], u: null };
    }

    constructor() {
      super();
      this.linkCount = 0; // nombre d'appels à Union2Tid (= comparaisons de l'union)
      this.quiet = 0;
    }

    /* --- outils ------------------------------------------------------- */

    /** Étape enregistrée seulement hors mode silencieux. */
    st(msg, opts) {
      if (!this.quiet) this.step(msg, opts);
    }

    /** Nouveau nœud : id = élément affiché (échangé avec la clé), sid = place dans l'arbre. */
    mk(key) {
      return { id: this.newId(), sid: this.s.nextSid++, key, ch: [] };
    }

    *nodes(t) {
      yield t;
      for (const c of t.ch) yield* this.nodes(c);
    }

    allKeys() {
      const out = [];
      const s = this.s;
      const qs = s.u ? [s.u.A, s.u.B, s.u.res, s.u.carry ? [s.u.carry] : []] : [s.q];
      for (const q of qs) for (const t of q) for (const n of this.nodes(t)) out.push(n.key);
      return out;
    }

    has(x) {
      return this.allKeys().includes(x);
    }

    /** Union2Tid : la plus petite racine devient la racine, l'autre son premier enfant. */
    link(a, b) {
      this.linkCount++;
      const [w, l] = a.key < b.key ? [a, b] : [b, a];
      w.ch.unshift(l);
      return w;
    }

    deco() {
      this.marks.clear();
      this.edgeMarks.clear();
      this.rings.clear();
    }

    ringT(t, cls, name) {
      this.ring('b' + t.id, cls, name);
    }

    checkDistinct(list, withCurrent) {
      const seen = new Set(withCurrent ? this.allKeys() : []);
      for (const x of list) {
        if (seen.has(x)) throw new DT.UserError('binomial.errDup', { v: x });
        seen.add(x);
      }
    }

    /**
     * Ajout « compact » (construction) : le tournoi T₀ est placé à droite puis
     * fusionné tant que les deux derniers tournois ont le même degré.
     */
    push(q, x, line) {
      const node = this.mk(x);
      const n = size(q);
      q.push(node);
      this.deco();
      this.mark('b' + node.id, 'new');
      this.st(['binomial.bAdd', { x, t: tb(0), k: sub(n) }], { line });
      while (q.length >= 2 && deg(last(q)) === deg(q[q.length - 2])) {
        const a = q[q.length - 2];
        const b = q[q.length - 1];
        this.deco();
        this.ringT(a, 'cmp', 'a');
        this.ringT(b, 'cmp', 'b');
        this.st(['binomial.bCmp', { t: tb(deg(a)), x: a.key, y: b.key }], { line });
        q.length -= 2;
        const w = this.link(a, b);
        q.push(w);
        this.deco();
        this.markEdge('b' + w.id, 'b' + w.ch[0].id, 'new');
        this.ringT(w, 'hl', 'w');
        this.st(['binomial.bLinked', { x: w.key, y: w.ch[0].key, t: tb(deg(w)) }], { line });
      }
    }

    /* --- union (UnionFile / UFret du cours) ---------------------------- */

    /** Démarre l'union de la file courante (F1) avec la file q2 (F2). */
    beginUnion(q2) {
      this.s.u = { A: this.s.q, B: q2, carry: null, res: [], role: { F1: 'A', F2: 'B' } };
      this.s.q = [];
    }

    unionRun() {
      this.code('union');
      const u = this.s.u;
      const n = size(u.A);
      const m = size(u.B);
      this.linkCount = 0;
      this.deco();
      this.st(['binomial.start', { a: bin(n), b: bin(m) }], { line: 4 });
      const Z = (r) => u[u.role[r]];
      const swapRoles = () => {
        u.role = { F1: u.role.F2, F2: u.role.F1 };
      };
      for (;;) {
        this.deco();
        const F1 = Z('F1');
        const F2 = Z('F2');
        const T = u.carry;
        if (!T) {
          if (!F1.length || !F2.length) {
            const F = F1.length ? F1 : F2;
            for (const t of F) this.mark('b' + t.id, 'ok');
            u.res = F.splice(0).concat(u.res);
            this.st([F1.length ? 'binomial.f2Empty' : 'binomial.f1Empty'], { line: F1.length ? 13 : 11 });
            break;
          }
          const T1 = last(F1);
          const T2 = last(F2);
          this.ringT(T1, 'cmp', 't1');
          this.ringT(T2, 'cmp', 't2');
          const i = deg(T1);
          const j = deg(T2);
          this.st(['binomial.minDeg', { a: tb(i), x: T1.key, b: tb(j), y: T2.key }], { line: 15 });
          if (i !== j) {
            const lt = i < j;
            const src = lt ? F1 : F2;
            const t = src.pop();
            u.res.unshift(t);
            if (!lt) swapRoles();
            this.rings.clear();
            this.mark('b' + t.id, 'ok');
            this.st([lt ? 'binomial.lt' : 'binomial.gt', { i, j }], { line: lt ? 17 : 19 });
            continue;
          }
          this.st(['binomial.eq', { i }], { line: 20 });
          this.union2Tid(F1, F2, 21);
        } else {
          const k = deg(T);
          this.ringT(T, 'hl', 't');
          if (!F1.length || !F2.length) {
            const f1Empty = !F1.length;
            const dest = f1Empty ? F1 : F2;
            dest.push(T);
            u.carry = null;
            if (!f1Empty) swapRoles();
            this.st([f1Empty ? 'binomial.cF1Empty' : 'binomial.cF2Empty', { t: tb(k) }], { line: f1Empty ? 24 : 26 });
            continue;
          }
          const T1 = last(F1);
          const T2 = last(F2);
          const i = deg(T1);
          const j = deg(T2);
          this.ringT(T1, 'cmp', 't1');
          this.ringT(T2, 'cmp', 't2');
          this.st(['binomial.carryMin', { t: tb(k), z: T.key, a: tb(i), b: tb(j) }], { line: 28 });
          if (k < i && k < j) {
            u.res.unshift(T);
            u.carry = null;
            this.rings.clear();
            this.mark('b' + T.id, 'ok');
            this.st(['binomial.cLt'], { line: 30 });
          } else if (k === i && k === j) {
            u.res.unshift(T);
            u.carry = null;
            this.ring(null, '', 't');
            this.mark('b' + T.id, 'ok');
            this.st(['binomial.cEq3', { i: k }], { line: 32 });
            this.unmark('b' + T.id);
            this.union2Tid(F1, F2, 32);
          } else if (k === i) {
            this.st(['binomial.cEq1', { i: k }], { line: 34 });
            this.union2Tid(F1, null, 34);
          } else {
            this.st(['binomial.cEq2', { i: k }], { line: 36 });
            this.union2Tid(F2, null, 36);
            swapRoles();
          }
        }
      }
      // fin : le résultat devient la file courante
      const res = u.res;
      this.s.u = null;
      this.s.q = res;
      this.deco();
      const s = n + m;
      this.code('union');
      this.st(['binomial.done', { f: fb(s), c: this.linkCount, n, m, s, a: nu(n), b: nu(m), d: nu(s) }], { line: 4 });
    }

    /**
     * Union2Tid entre MinDeg(Fa) et MinDeg(Fb) (ou la retenue si Fb est null) ;
     * le tournoi obtenu devient la retenue.
     */
    union2Tid(Fa, Fb, line) {
      const u = this.s.u;
      const A = last(Fa);
      const B = Fb ? last(Fb) : u.carry;
      this.deco();
      this.ringT(A, 'cmp', 'a');
      this.ringT(B, 'cmp', 'b');
      this.st(['binomial.cmp', { x: A.key, y: B.key }], { line });
      Fa.pop();
      if (Fb) Fb.pop();
      u.carry = this.link(A, B);
      const w = u.carry;
      this.deco();
      this.markEdge('b' + w.id, 'b' + w.ch[0].id, 'new');
      this.ringT(w, 'hl', 't');
      this.st(['binomial.linked', { x: w.key, y: w.ch[0].key, t: tb(deg(w)) }], { line });
    }

    /* --- opérations --------------------------------------------------- */
    insert(x) {
      this.code('insert');
      if (this.has(x)) {
        this.st(['c.already', { x }], { line: 3 });
        return;
      }
      const node = this.mk(x);
      this.beginUnion([node]);
      this.mark('b' + node.id, 'new');
      this.st(['binomial.fb1', { f: fb(1), t: tb(0), x }], { line: 3 });
      this.unionRun();
    }

    union(list) {
      this.checkDistinct(list, true);
      this.code('union');
      const q2 = [];
      this.quiet++;
      try {
        for (const x of list) this.push(q2, x, 0);
      } finally {
        this.quiet--;
      }
      this.beginUnion(q2);
      this.deco();
      this.st(['binomial.f2', { f: fb(list.length), l: list.join(' ') }], { line: 1 });
      this.unionRun();
    }

    build(list) {
      this.checkDistinct(list, false);
      const keep = { nextId: this.s.nextId, nextSid: this.s.nextSid };
      this.s = Object.assign(this.initState(), keep);
      this.code('build');
      this.st(['binomial.bStart', { l: list.join(' ') }], { line: 3 });
      this.linkCount = 0;
      for (const x of list) this.push(this.s.q, x, 5);
      this.deco();
      const n = list.length;
      this.st(['binomial.bDone', { f: fb(n), c: this.linkCount, n, v: nu(n) }], { line: 6 });
    }

    extractMin() {
      this.code('extractMin');
      const q = this.s.q;
      if (!q.length) {
        this.st('binomial.noMin', { line: 3 });
        return null;
      }
      let b = 0;
      this.ringT(q[0], 'ok', 'min');
      this.st(['binomial.first', { x: q[0].key }], { line: 3 });
      for (let i = 1; i < q.length; i++) {
        this.ringT(q[i], 'cmp', 'cand');
        const better = q[i].key < q[b].key;
        this.st([better ? 'binomial.newMin' : 'binomial.keepMin', { x: q[b].key, y: q[i].key }], { line: 3 });
        if (better) {
          b = i;
          this.ringT(q[b], 'ok', 'min');
        }
        this.ring(null, '', 'cand');
      }
      const root = q[b];
      this.deco();
      this.mark('b' + root.id, 'bad');
      this.ringT(root, 'bad', 'min');
      this.st(['binomial.min', { x: root.key, t: tb(deg(root)), c: q.length - 1 }], { line: 4 });
      q.splice(b, 1);
      const kids = root.ch;
      this.beginUnion(kids);
      this.deco();
      const t = tb(kids.length);
      if (kids.length) {
        const l = kids.map((c) => tb(deg(c)));
        this.st(['binomial.decap', { t, l: { fr: l.map((x) => x.fr).join(', '), en: l.map((x) => x.en).join(', ') } }], { line: 5 });
      } else {
        this.st(['binomial.decapLeaf', { t }], { line: 5 });
      }
      this.unionRun();
      this.code('extractMin');
      this.st(['binomial.extracted', { x: root.key }], { line: 5 });
      return root.key;
    }

    /** Chemin racine → nœud de clé x (liste de nœuds), ou null. */
    path(x) {
      const rec = (n, acc) => {
        acc.push(n);
        if (n.key === x) return acc;
        for (const c of n.ch) {
          const r = rec(c, acc);
          if (r) return r;
        }
        acc.pop();
        return null;
      };
      for (const t of this.s.q) {
        const r = rec(t, []);
        if (r) return r;
      }
      return null;
    }

    decreaseKey(old, v) {
      this.code('decreaseKey');
      const p = this.path(old);
      if (!p) {
        this.st(['c.notFound', { x: old }], { line: 1 });
        return;
      }
      if (!(v < old)) throw new DT.UserError('binomial.errDec', { x: old, y: v });
      if (this.has(v)) throw new DT.UserError('binomial.errDup', { v });
      let j = p.length - 1;
      this.ringT(p[j], 'hl', 'x');
      this.st(['binomial.decFound', { x: old }], { line: 1 });
      p[j].key = v;
      this.mark('b' + p[j].id, 'new');
      this.st(['binomial.decSet', { y: v }], { line: 3 });
      while (j > 0) {
        const c = p[j];
        const f = p[j - 1];
        this.rings.clear();
        this.ringT(c, 'hl', 'x');
        this.ringT(f, 'cmp', 'p');
        if (!(c.key < f.key)) {
          this.ringT(f, 'ok', 'p');
          this.st(['binomial.decStop', { y: v, z: f.key }], { line: 4 });
          return;
        }
        this.st(['binomial.decSwap', { y: v, z: f.key }], { line: 4 });
        // échange des éléments affichés (clé et identifiant) : les cercles glissent
        [c.id, f.id] = [f.id, c.id];
        [c.key, f.key] = [f.key, c.key];
        j--;
        this.rings.clear();
        this.ringT(p[j], 'hl', 'x');
        this.st(null, { line: 5 });
      }
      this.rings.clear();
      this.ringT(p[0], 'ok', 'x');
      this.st(['binomial.decRoot', { y: v }], { line: 4 });
    }

    random() {
      this.build(DT.util.randDistinct(10, 1, 99));
    }

    /* --- invariants (tests) ------------------------------------------- */
    check() {
      if (this.s.u) throw new Error('union inachevée');
      const ids = new Set();
      const sids = new Set();
      const keys = new Set();
      const rec = (t, k) => {
        if (ids.has(t.id) || sids.has(t.sid)) throw new Error('id dupliqué ' + t.id);
        ids.add(t.id);
        sids.add(t.sid);
        if (keys.has(t.key)) throw new Error('clé dupliquée ' + t.key);
        keys.add(t.key);
        if (t.ch.length !== k) throw new Error(`degré ${t.ch.length} au lieu de ${k} en ${t.key}`);
        t.ch.forEach((c, i) => {
          if (c.key < t.key) throw new Error(`tournoi non croissant en ${t.key}`);
          rec(c, k - 1 - i); // premier enfant : B_{k-1}, ..., dernier : B_0
        });
      };
      const q = this.s.q;
      q.forEach((t, i) => {
        if (i > 0 && !(deg(t) < deg(q[i - 1]))) throw new Error('tailles non strictement décroissantes');
        rec(t, deg(t));
      });
      const n = size(q);
      const bits = q.map(deg);
      const expect = [];
      for (let k = 30; k >= 0; k--) if (n & (1 << k)) expect.push(k);
      if (bits.join() !== expect.join()) throw new Error('tournois ≠ écriture binaire de n');
    }

    keys() {
      return this.allKeys().sort((a, b) => a - b);
    }

    /* --- dessin ------------------------------------------------------- */
    draw(S) {
      const s = this.s;
      const u = s.u;
      const rows = [];
      if (!u) {
        const n = size(s.q);
        rows.push({
          trees: s.q,
          tid: 'tt:main',
          title: n ? ['binomial.queue', { f: fb(n), b: bin(n) }] : ['binomial.empty'],
        });
      } else {
        const roleOf = (z) => (u.role.F1 === z ? 'F1' : 'F2');
        for (const z of ['A', 'B']) {
          const r = roleOf(z);
          const n = size(u[z]);
          rows.push({
            trees: u[z],
            tid: 'tt:' + r,
            title: n ? ['binomial.zone', { r, f: fb(n), b: bin(n) }] : ['binomial.zoneEmpty', { r }],
          });
        }
        rows.push({
          trees: u.carry ? [u.carry] : [],
          tid: 'tt:carry',
          title: u.carry ? ['binomial.carry'] : ['binomial.carryEmpty'],
        });
        rows.push({ trees: u.res, tid: 'tt:res', title: ['binomial.res'] });
      }

      const levelGap = 62;
      const lay = (t) => DT.layout.tree(t, { children: (n) => n.ch, width: () => 40, gap: 10, levelGap });
      // colonnes alignées par degré (comme une addition posée), au plus une par occurrence
      const count = new Map();
      const width = new Map();
      for (const r of rows) {
        const c = new Map();
        for (const t of r.trees) {
          const k = deg(t);
          c.set(k, (c.get(k) || 0) + 1);
          if (!width.has(k)) {
            const L = lay(t);
            width.set(k, L.maxX - L.minX);
          }
        }
        for (const [k, v] of c) count.set(k, Math.max(count.get(k) || 0, v));
      }
      const colX = new Map();
      let x = 0;
      for (const k of [...count.keys()].sort((a, b) => b - a)) {
        for (let j = 0; j < count.get(k); j++) {
          colX.set(k + '#' + j, x);
          x += width.get(k) + 34;
        }
      }

      // titres centrés au-dessus des colonnes (la feuille de style impose text-anchor: middle)
      const midX = Math.max(0, x - 34) / 2;
      let y = 0;
      for (const r of rows) {
        S.text(r.tid, midX, y, r.title, { cls: 'accent' });
        if (!r.trees.length) {
          y += 52;
          continue;
        }
        const rootY = y + 64;
        let depth = 0;
        const occ = new Map();
        for (const t of r.trees) {
          const k = deg(t);
          const j = occ.get(k) || 0;
          occ.set(k, j + 1);
          const L = lay(t);
          const dx = colX.get(k + '#' + j) - L.minX;
          depth = Math.max(depth, L.maxDepth);
          for (const [n, p] of L.pos) {
            S.node('b' + n.id, { x: p.x + dx, y: p.y + rootY, label: n.key });
          }
          // nom du tournoi au-dessus de la racine (assez haut pour ne pas gêner les anneaux)
          S.text('tl:' + t.id, L.pos.get(t).x + dx, rootY - 37, tb(k), { cls: 'dim' });
          for (const n of this.nodes(t)) {
            for (const c of n.ch) S.edge('b' + n.id, 'b' + c.id, { id: 'be' + c.sid });
          }
        }
        y = rootY + depth * levelGap + 64;
      }
    }
  }

  Binomial.controls = [
    { type: 'input', name: 'key', size: 12, placeholder: 'ctl.keys' },
    { type: 'button', label: 'ctl.insert', op: 'insert', args: ['key'], primary: true },
    { type: 'button', label: 'binomial.ctl.union', op: 'union', args: ['key'], single: true },
    { type: 'button', label: 'binomial.ctl.build', op: 'build', args: ['key'], single: true },
    { type: 'button', label: 'binomial.ctl.extract', op: 'extractMin' },
    { type: 'sep' },
    { type: 'input', name: 'old', size: 4, placeholder: 'binomial.ctl.old' },
    { type: 'input', name: 'nv', size: 5, placeholder: 'binomial.ctl.new' },
    { type: 'button', label: 'binomial.ctl.decrease', op: 'decreaseKey', args: ['old', 'nv'] },
    { type: 'sep' },
    { type: 'button', label: 'ctl.random', op: 'random' },
  ];

  Binomial.code = {
    union: {
      title: { fr: 'Union de deux files binomiales', en: 'Union of two binomial queues' },
      source: 'course',
      lines: [
        'def UnionFile(F1, F2):',
        '    """FileB * FileB -> FileB',
        '       Renvoie la file binomiale union des deux files F1 et F2."""',
        '    return UFret(F1, F2, vide)',
        '',
        'def UFret(F1, F2, T):',
        '    """FileB * FileB * TournoiB-> FileB',
        '       Renvoie la file binomiale union de deux files et d\'un tournoi."""',
        '    if EstVide(T):    # pas de tournoi en retenue',
        '        if EstVide(F1):',
        '            return F2',
        '        if EstVide(F2):',
        '            return F1',
        '        T1 = MinDeg(F1)',
        '        T2 = MinDeg(F2)',
        '        if Degre(T1) < Degre(T2):',
        '            return AjoutMin(T1, UnionFile(Reste(F1), F2))',
        '        if Degre(T2) < Degre(T1):',
        '            return AjoutMin(T2, UnionFile(Reste(F2), F1))',
        '        if Degre(T1) == Degre(T2):',
        '            return UFret(Reste(F1), Reste(F2), Union2Tid(T1, T2))',
        '    else:    # T tournoi en retenue',
        '        if EstVide(F1):',
        '            return UnionFile(File(T), F2)',
        '        if EstVide(F2):',
        '            return UnionFile(File(T), F1)',
        '        T1 = MinDeg(F1)',
        '        T2 = MinDeg(F2)',
        '        if Degre(T) < Degre(T1) and Degre(T) < Degre(T2):',
        '            return AjoutMin(T, UnionFile(F1, F2))',
        '        if Degre(T) == Degre(T1) and Degre(T) == Degre(T2):',
        '            return AjoutMin(T, UFret(Reste(F1), Reste(F2), Union2Tid(T1, T2)))',
        '        if Degre(T) == Degre(T1) and Degre(T) < Degre(T2):',
        '            return UFret(Reste(F1), F2, Union2Tid(T1, T))',
        '        if Degre(T) == Degre(T2) and Degre(T) < Degre(T1):',
        '            return UFret(Reste(F2), F1, Union2Tid(T2, T))',
      ],
    },
    insert: {
      title: { fr: 'Ajout d’un élément', en: 'Insertion' },
      source: 'site',
      lines: [
        'def Ajout(x, F):',
        '    """cle * FileB -> FileB"""',
        '    return UnionFile(F, File(x))    # File(x) : la file FB_1',
      ],
    },
    build: {
      title: { fr: 'Construction par adjonctions successives', en: 'Build by successive insertions' },
      source: 'site',
      lines: [
        'def Construction(L):',
        '    """liste de cles -> FileB   (n - nu(n) comparaisons)"""',
        '    F = vide',
        '    for x in L:',
        '        F = UnionFile(F, File(x))',
        '    return F',
      ],
    },
    extractMin: {
      title: { fr: 'Suppression du minimum', en: 'Extract the minimum' },
      source: 'site',
      lines: [
        'def SupprMin(F):',
        '    """FileB -> cle * FileB"""',
        '    T = TournoiRacineMin(F)    # nu(n) - 1 comparaisons',
        '    m = Racine(T)',
        '    return m, UnionFile(F privee de T, Decapite(T))',
      ],
    },
    decreaseKey: {
      title: { fr: 'Diminuer une clé', en: 'Decrease a key' },
      source: 'site',
      lines: [
        'def DiminuerCle(x, v):',
        '    """Noeud * cle -> None   (acces direct au noeud x, v < cle(x))"""',
        '    x.cle = v',
        '    while x.pere is not None and x.cle < x.pere.cle:',
        '        Echange(x, x.pere)    # echange des cles avec le pere',
        '        x = x.pere',
      ],
    },
  };

  DT.register('binomial', Binomial);
})();
