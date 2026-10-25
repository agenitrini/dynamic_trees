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

/* Arbre B d'ordre m (chapitre 3), d'après le code PSTL ArbreB.py. */
(function () {
  'use strict';

  const DT = window.DT;
  const CW = 34; // largeur d'une case de clé
  const LEVEL = 80; // distance entre deux niveaux

  DT.i18n.add({
    fr: {
      'btree.order': 'Ordre m',
      'btree.m1': 'm = 1 (1 à 2 clés)',
      'btree.m2': 'm = 2 (2 à 4 clés)',
      'btree.m3': 'm = 3 (3 à 6 clés)',
      'btree.op.setOrder': 'Changement d’ordre',
      'btree.orderSet': 'Ordre m = {m} : chaque page contient entre {m} et {M} clés (la racine entre 1 et {M}). L’arbre est vidé.',
      'btree.caption': (p) =>
        `ordre m = ${p.m} : ${p.m} à ${p.M} clés par page (racine : 1 à ${p.M})` +
        (p.n ? ` · ${p.n} clé${p.n > 1 ? 's' : ''} · hauteur ${p.h}` : ''),
      'btree.inserted': '{x} est ajouté.',
      'btree.deleted': '{x} est supprimé.',
      'btree.goFirst': '{x} < {a} : on descend dans l’enfant n° 1.',
      'btree.goMid': '{a} < {x} < {b} : on descend dans l’enfant n° {i}.',
      'btree.goLast': '{x} > {a} : on descend dans le dernier enfant (n° {i}).',
      'btree.notHere': '{x} n’est pas dans la feuille {t} : {x} est absent.',
      'btree.leafAdd': 'La page {t} est une feuille : on y insère {x}, elle devient {u} ({n} ≤ 2m = {M} clés).',
      'btree.leafOver': 'On insère {x} dans la feuille, qui devient {t} : {n} clés > 2m = {M}, débordement.',
      'btree.overflow': 'Éclatement de {t} : la médiane {b} (indice ⌊{n}/2⌋ = {h}) remonte, les {h} clés de chaque côté forment deux pages.',
      'btree.splitRoot': 'La racine a éclaté : {b} forme la nouvelle racine (la hauteur augmente de 1).',
      'btree.splitDone': 'Les pages {l} et {r} remplacent la page éclatée ; {b} est inséré dans le parent {p}.',
      'btree.splitCascade': 'Les pages {l} et {r} remplacent la page éclatée ; {b} est inséré dans le parent {p}, qui déborde à son tour.',
      'btree.dLeaf': '{x} est dans la feuille {t} : on le retire.',
      'btree.lastKey': '{x} était la seule clé de l’arbre : l’arbre devient vide.',
      'btree.dInternal': '{x} est dans une page interne : il sera remplacé par son prédécesseur {y}, la plus grande clé de l’enfant gauche de {x} (on descend toujours à droite).',
      'btree.dReplaced': '{y} remplace {x} ; on supprime maintenant {y} de la feuille {t}.',
      'btree.deficit': 'La page {t} est en déficit : {n} clé(s) < m = {m}.',
      'btree.borrowL': 'Le frère gauche {s} a plus de m clés : emprunt ({y} monte dans le parent, {z} descend dans la page).',
      'btree.borrowR': 'Le frère gauche ne peut rien prêter, mais le frère droit {s} a plus de m clés : emprunt ({y} monte dans le parent, {z} descend dans la page).',
      'btree.borrowed': 'Après l’emprunt, la page contient {t} : déficit compensé.',
      'btree.mergeL': 'Aucun frère ne peut prêter de clé : fusion avec le frère gauche {s} et la clé {z} du parent.',
      'btree.mergeR': 'Pas de frère gauche et le frère droit {s} n’a que m clés : fusion avec lui et la clé {z} du parent.',
      'btree.merged': 'Page fusionnée : {t}. Le parent a perdu la clé {z}.',
      'btree.rootShrink': 'La racine n’a plus de clé : son unique enfant devient la racine (la hauteur diminue de 1).',
    },
    en: {
      'btree.order': 'Order m',
      'btree.m1': 'm = 1 (1 to 2 keys)',
      'btree.m2': 'm = 2 (2 to 4 keys)',
      'btree.m3': 'm = 3 (3 to 6 keys)',
      'btree.op.setOrder': 'Change of order',
      'btree.orderSet': 'Order m = {m}: each page holds between {m} and {M} keys (the root between 1 and {M}). The tree is cleared.',
      'btree.caption': (p) =>
        `order m = ${p.m}: ${p.m} to ${p.M} keys per page (root: 1 to ${p.M})` +
        (p.n ? ` · ${p.n} key${p.n > 1 ? 's' : ''} · height ${p.h}` : ''),
      'btree.inserted': '{x} is inserted.',
      'btree.deleted': '{x} is deleted.',
      'btree.goFirst': '{x} < {a}: go down into child #1.',
      'btree.goMid': '{a} < {x} < {b}: go down into child #{i}.',
      'btree.goLast': '{x} > {a}: go down into the last child (#{i}).',
      'btree.notHere': '{x} is not in leaf {t}: {x} is absent.',
      'btree.leafAdd': 'Page {t} is a leaf: insert {x} into it, it becomes {u} ({n} ≤ 2m = {M} keys).',
      'btree.leafOver': 'Insert {x} into the leaf, which becomes {t}: {n} keys > 2m = {M}, overflow.',
      'btree.overflow': 'Split {t}: the median {b} (index ⌊{n}/2⌋ = {h}) moves up, the {h} keys on each side form two pages.',
      'btree.splitRoot': 'The root was split: {b} forms the new root (the height grows by 1).',
      'btree.splitDone': 'Pages {l} and {r} replace the split page; {b} is inserted into the parent {p}.',
      'btree.splitCascade': 'Pages {l} and {r} replace the split page; {b} is inserted into the parent {p}, which overflows in turn.',
      'btree.dLeaf': '{x} is in leaf {t}: remove it.',
      'btree.lastKey': '{x} was the only key of the tree: the tree becomes empty.',
      'btree.dInternal': '{x} is in an internal page: it will be replaced by its predecessor {y}, the largest key of the left child of {x} (always go right).',
      'btree.dReplaced': '{y} replaces {x}; now delete {y} from leaf {t}.',
      'btree.deficit': 'Page {t} is deficient: {n} key(s) < m = {m}.',
      'btree.borrowL': 'The left sibling {s} has more than m keys: borrow ({y} moves up into the parent, {z} moves down into the page).',
      'btree.borrowR': 'The left sibling cannot lend, but the right sibling {s} has more than m keys: borrow ({y} moves up into the parent, {z} moves down into the page).',
      'btree.borrowed': 'After borrowing, the page holds {t}: deficit fixed.',
      'btree.mergeL': 'No sibling can lend a key: merge with the left sibling {s} and the parent key {z}.',
      'btree.mergeR': 'No left sibling and the right sibling {s} has only m keys: merge with it and the parent key {z}.',
      'btree.merged': 'Merged page: {t}. The parent lost key {z}.',
      'btree.rootShrink': 'The root has no key left: its only child becomes the root (the height decreases by 1).',
    },
  });

  const tup = (keys) => '(' + keys.join(', ') + ')';
  const isLeaf = (n) => !n.kids.length;
  /** bisect_left : indice de l'enfant où poursuivre la recherche de x. */
  const bisect = (keys, x) => {
    let i = 0;
    while (i < keys.length && keys[i] < x) i++;
    return i;
  };
  const cellDx = (n, i) => -(Math.max(1, n.keys.length) * CW) / 2 + (i + 0.5) * CW;
  const halfW = (n) => (Math.max(1, n.keys.length) * CW) / 2;

  class BTree extends DT.Algo {
    initState() {
      return { nextId: 1, root: null, cfg: { order: 2 } };
    }

    get m() {
      return this.s.cfg.order;
    }

    setOrder(v) {
      const m = Math.min(3, Math.max(1, parseInt(v, 10) || 2));
      this.s = this.initState();
      this.s.cfg.order = m;
      this.step(['btree.orderSet', { m, M: 2 * m }]);
    }

    /* --- décorations -------------------------------------------------- */
    bubble(x, n, cls) {
      if (!n) this.float('cand', { id: 'cand', label: x, cls: cls || 'new', x: 0, y: 0 });
      else this.float('cand', { id: 'cand', label: x, cls: cls || 'new', at: n.id, dx: halfW(n) + 18, dy: -40 });
    }

    keyFloat(name, label, n, i, cls) {
      this.float(name, { id: 'f:' + name, label, cls: cls || 'hl', shape: 'box', w: CW - 4, h: 28, at: n.id, dx: cellDx(n, i), dy: 0 });
    }

    descend(n, i, x, line) {
      const k = n.keys.length;
      if (i > 0) this.mark(`${n.id}#${i - 1}`, 'cmp');
      if (i < k) this.mark(`${n.id}#${i}`, 'cmp');
      this.markEdge(n.id, n.kids[i].id, 'cmp');
      let msg;
      if (i === 0) msg = ['btree.goFirst', { x, a: n.keys[0] }];
      else if (i === k) msg = ['btree.goLast', { x, a: n.keys[k - 1], i: k + 1 }];
      else msg = ['btree.goMid', { x, a: n.keys[i - 1], b: n.keys[i], i: i + 1 }];
      this.step(msg, { line });
    }

    /* --- ajout (PSTL _ajout / _eclatement) ---------------------------- */
    insert(x) {
      this.code('insert');
      const M = 2 * this.m;
      if (!this.s.root) {
        const id = this.newId();
        this.bubble(x, null);
        this.step(['c.newRoot', { x }], { line: 2 });
        this.float('cand', null);
        this.s.root = { id, keys: [x], kids: [] };
        this.mark(id, 'new');
        this.step(['btree.inserted', { x }], { line: 2 });
        return;
      }
      const path = [];
      let n = this.s.root;
      for (;;) {
        this.clearMarks();
        this.bubble(x, n);
        this.ring(n.id, 'cmp');
        const ki = n.keys.indexOf(x);
        if (ki >= 0) {
          this.mark(`${n.id}#${ki}`, 'ok');
          this.ring(n.id, 'ok');
          this.step(['c.already', { x }], { line: isLeaf(n) ? 7 : 5 });
          return;
        }
        if (isLeaf(n)) break;
        const i = bisect(n.keys, x);
        this.descend(n, i, x, 6);
        path.push([n, i]);
        n = n.kids[i];
      }
      const before = tup(n.keys);
      n.keys.splice(bisect(n.keys, x), 0, x);
      this.clearMarks();
      this.mark(`${n.id}#${n.keys.indexOf(x)}`, 'new');
      if (n.keys.length <= M) {
        this.ring(n.id, 'new');
        this.step(['btree.leafAdd', { x, t: before, u: tup(n.keys), n: n.keys.length, M }], { line: 8 });
        return;
      }
      this.mark(n.id, 'bad');
      this.step(['btree.leafOver', { x, t: tup(n.keys), n: n.keys.length, M }], { line: 9 });

      while (n.keys.length > M) {
        const len = n.keys.length;
        const h = Math.floor(len / 2);
        const b = n.keys[h];
        this.clearMarks();
        this.mark(n.id, 'bad');
        this.mark(`${n.id}#${h}`, 'hl');
        this.keyFloat('med', b, n, h);
        this.step(['btree.overflow', { t: tup(n.keys), b, n: len, h }], { line: 11 });

        const right = { id: this.newId(), keys: n.keys.slice(h + 1), kids: n.kids.slice(h + 1) };
        n.keys = n.keys.slice(0, h);
        n.kids = n.kids.slice(0, h + 1);
        const top = path.pop();
        this.clearMarks();
        this.mark(n.id, 'new');
        this.mark(right.id, 'new');
        if (!top) {
          const root = { id: this.newId(), keys: [b], kids: [n, right] };
          this.s.root = root;
          this.mark(`${root.id}#0`, 'hl');
          this.keyFloat('med', b, root, 0);
          this.step(['btree.splitRoot', { b }], { line: 14 });
          this.float('med', null);
          return;
        }
        const [p, pi] = top;
        p.keys.splice(pi, 0, b);
        p.kids.splice(pi + 1, 0, right);
        this.mark(`${p.id}#${pi}`, 'hl');
        this.keyFloat('med', b, p, pi);
        this.markEdge(p.id, n.id, 'new');
        this.markEdge(p.id, right.id, 'new');
        const over = p.keys.length > M;
        if (over) this.mark(p.id, 'bad');
        else this.ring(p.id, 'ok');
        this.step([over ? 'btree.splitCascade' : 'btree.splitDone', { l: tup(n.keys), r: tup(right.keys), b, p: tup(p.keys) }], {
          line: over ? 16 : 15,
        });
        this.float('med', null);
        n = p;
      }
    }

    /* --- recherche (PSTL _recherche) ---------------------------------- */
    search(x) {
      this.code('search');
      let n = this.s.root;
      if (!n) {
        this.step(['c.notFound', { x }], { line: 2 });
        return false;
      }
      for (;;) {
        this.clearMarks();
        this.float('probe', { id: 'probe', label: x, cls: 'cmp', at: n.id, dx: halfW(n) + 18, dy: -40 });
        this.ring(n.id, 'cmp');
        const ki = n.keys.indexOf(x);
        if (ki >= 0) {
          this.ring(n.id, 'ok');
          this.mark(`${n.id}#${ki}`, 'ok');
          this.float('probe', null);
          this.step(['c.found', { x }], { line: 5 });
          return true;
        }
        if (isLeaf(n)) {
          this.float('probe', null);
          this.ring(n.id, 'bad');
          this.step(['btree.notHere', { x, t: tup(n.keys) }], { line: 6 });
          return false;
        }
        const i = bisect(n.keys, x);
        this.descend(n, i, x, 7);
        n = n.kids[i];
      }
    }

    /* --- suppression (PSTL _suppression / _compensation_deficit) ------ */
    delete(x) {
      this.code('delete');
      const m = this.m;
      const x0 = x;
      let n = this.s.root;
      if (!n) {
        this.step(['c.notFound', { x }], { line: 3 });
        return;
      }
      const path = []; // [page, indice de l'enfant suivi]
      let ki;
      for (;;) {
        this.clearMarks();
        this.ring(n.id, 'cmp');
        ki = n.keys.indexOf(x);
        if (ki >= 0) break;
        if (isLeaf(n)) {
          this.ring(n.id, 'bad');
          this.step(['btree.notHere', { x, t: tup(n.keys) }], { line: 3 });
          return;
        }
        const i = bisect(n.keys, x);
        this.descend(n, i, x, 2);
        path.push([n, i]);
        n = n.kids[i];
      }

      if (!isLeaf(n)) {
        // clé interne : remplacée par son prédécesseur (max de l'enfant gauche)
        path.push([n, ki]);
        let p = n.kids[ki];
        while (!isLeaf(p)) {
          path.push([p, p.kids.length - 1]);
          p = p.kids[p.kids.length - 1];
        }
        const pi = p.keys.length - 1;
        const y = p.keys[pi];
        this.clearMarks();
        this.ring(n.id, 'bad');
        this.mark(`${n.id}#${ki}`, 'bad');
        this.ring(p.id, 'hl', 'pred');
        this.mark(`${p.id}#${pi}`, 'hl');
        this.keyFloat('mv', y, p, pi);
        this.step(['btree.dInternal', { x, y }], { line: 5 });
        n.keys[ki] = y;
        this.clearMarks();
        this.mark(`${n.id}#${ki}`, 'hl');
        this.mark(`${p.id}#${pi}`, 'bad');
        this.ring(p.id, 'bad');
        this.keyFloat('mv', y, n, ki);
        this.step(['btree.dReplaced', { x, y, t: tup(p.keys) }], { line: 7 });
        this.float('mv', null);
        x = y;
        n = p;
        ki = pi;
      } else {
        this.mark(`${n.id}#${ki}`, 'bad');
        this.ring(n.id, 'bad');
        this.step(['btree.dLeaf', { x, t: tup(n.keys) }], { line: 8 });
      }

      if (n === this.s.root && n.keys.length === 1) {
        this.s.root = null;
        this.clearMarks();
        this.step(['btree.lastKey', { x }], { line: 8 });
        return;
      }
      n.keys.splice(ki, 1);

      for (;;) {
        this.clearMarks();
        if (n === this.s.root) {
          if (!n.keys.length && n.kids.length === 1) {
            this.s.root = n.kids[0];
            this.ring(this.s.root.id, 'new');
            this.step(['btree.rootShrink'], { line: 11 });
          }
          break;
        }
        if (n.keys.length >= m) break;
        this.mark(n.id, 'bad');
        this.ring(n.id, 'bad');
        this.step(['btree.deficit', { t: tup(n.keys), n: n.keys.length, m }], { line: 9 });
        const [p, pi] = path.pop();
        this.fixDeficit(n, p, pi);
        n = p;
      }
      this.clearMarks();
      this.step(['btree.deleted', { x: x0 }], { line: 21 });
    }

    /** Compense le déficit de la page n (enfant pi de p) : emprunt à gauche, à droite, sinon fusion. */
    fixDeficit(n, p, pi) {
      const m = this.m;
      const ls = pi > 0 ? p.kids[pi - 1] : null;
      const rs = pi < p.kids.length - 1 ? p.kids[pi + 1] : null;
      if ((ls && ls.keys.length > m) || (rs && rs.keys.length > m)) {
        const left = !!(ls && ls.keys.length > m);
        const s = left ? ls : rs;
        const si = left ? pi - 1 : pi; // clé du parent échangée
        const yi = left ? s.keys.length - 1 : 0;
        const y = s.keys[yi];
        const z = p.keys[si];
        this.mark(s.id, 'cmp');
        this.mark(`${s.id}#${yi}`, 'hl');
        this.mark(`${p.id}#${si}`, 'hl');
        this.keyFloat('up', y, s, yi);
        this.keyFloat('down', z, p, si);
        this.step([left ? 'btree.borrowL' : 'btree.borrowR', { s: tup(s.keys), y, z }], { line: left ? 13 : 15 });
        if (left) {
          n.keys.unshift(z);
          p.keys[si] = s.keys.pop();
          if (!isLeaf(n)) n.kids.unshift(s.kids.pop());
        } else {
          n.keys.push(z);
          p.keys[si] = s.keys.shift();
          if (!isLeaf(n)) n.kids.push(s.kids.shift());
        }
        const zi = n.keys.indexOf(z);
        this.clearMarks();
        this.mark(n.id, 'new');
        this.mark(`${n.id}#${zi}`, 'hl');
        this.mark(`${p.id}#${si}`, 'hl');
        this.keyFloat('up', y, p, si);
        this.keyFloat('down', z, n, zi);
        this.step(['btree.borrowed', { t: tup(n.keys) }], { line: left ? 13 : 15 });
        this.float('up', null);
        this.float('down', null);
        return;
      }
      const left = !!ls;
      const si = left ? pi - 1 : pi;
      const s = left ? ls : rs;
      const z = p.keys[si];
      this.mark(s.id, 'cmp');
      this.mark(`${p.id}#${si}`, 'hl');
      this.keyFloat('mv', z, p, si);
      this.step([left ? 'btree.mergeL' : 'btree.mergeR', { s: tup(s.keys), z }], { line: left ? 17 : 19 });
      // fusion : la page de gauche garde son identifiant
      const A = left ? ls : n;
      const B = left ? n : rs;
      A.keys = A.keys.concat([z], B.keys);
      A.kids = A.kids.concat(B.kids);
      p.keys.splice(si, 1);
      p.kids.splice(si + 1, 1);
      const zi = A.keys.indexOf(z);
      this.clearMarks();
      this.mark(A.id, 'new');
      this.mark(`${A.id}#${zi}`, 'hl');
      this.keyFloat('mv', z, A, zi);
      this.step(['btree.merged', { t: tup(A.keys), z }], { line: left ? 17 : 19 });
      this.float('mv', null);
    }

    random() {
      this.clear();
      for (const v of DT.util.randDistinct(6 * this.m + 8, 1, 99)) {
        this.step(['op.insert', { x: v }], { op: true, code: null });
        this.insert(v);
        this.clearMarks();
      }
    }

    /** Invariants : m à 2m clés (racine 1 à 2m), ordre, feuilles au même niveau, identifiants uniques. */
    check() {
      const m = this.m;
      const root = this.s.root;
      if (!root) return;
      const ids = new Set();
      let leafDepth = -1;
      (function rec(n, lo, hi, d) {
        if (ids.has(n.id)) throw new Error('id dupliqué ' + n.id);
        ids.add(n.id);
        const k = n.keys.length;
        const min = n === root ? 1 : m;
        if (k < min || k > 2 * m) throw new Error(`page ${tup(n.keys)} : ${k} clés (ordre ${m})`);
        for (let i = 0; i < k; i++) {
          if (!(n.keys[i] > lo && n.keys[i] < hi)) throw new Error('ordre violé en ' + n.keys[i]);
          if (i > 0 && !(n.keys[i] > n.keys[i - 1])) throw new Error('clés non triées ' + tup(n.keys));
        }
        if (!n.kids.length) {
          if (leafDepth < 0) leafDepth = d;
          else if (leafDepth !== d) throw new Error('feuilles à des niveaux différents');
          return;
        }
        if (n.kids.length !== k + 1) throw new Error(`page ${tup(n.keys)} : ${n.kids.length} enfants`);
        n.kids.forEach((c, i) => rec(c, i === 0 ? lo : n.keys[i - 1], i === k ? hi : n.keys[i], d + 1));
      })(root, -Infinity, Infinity, 0);
    }

    keys() {
      const out = [];
      (function rec(n) {
        if (!n) return;
        n.keys.forEach((k, i) => {
          if (n.kids.length) rec(n.kids[i]);
          out.push(k);
        });
        if (n.kids.length) rec(n.kids[n.kids.length - 1]);
      })(this.s.root);
      return out;
    }

    height() {
      let h = -1;
      for (let n = this.s.root; n; n = n.kids[0]) h++;
      return h;
    }

    /* --- dessin ------------------------------------------------------- */
    draw(S) {
      const m = this.m;
      if (!this.s.root) {
        S.text('empty', 0, 30, ['c.emptyTree'], { cls: 'dim' });
        S.text('caption', 0, 58, ['btree.caption', { m, M: 2 * m, n: 0 }], { cls: 'dim' });
        return;
      }
      const L = DT.layout.tree(this.s.root, {
        children: (n) => n.kids,
        width: (n) => Math.max(1, n.keys.length) * CW,
        gap: 18,
        levelGap: LEVEL,
      });
      for (const [n, p] of L.pos) S.node(n.id, { shape: 'keys', keys: n.keys.slice(), cellW: CW, x: p.x, y: p.y });
      for (const [n] of L.pos) n.kids.forEach((c, i) => S.edge(n.id, c.id, { port: i }));
      S.text('caption', (L.minX + L.maxX) / 2, (L.maxDepth + 1) * LEVEL - 18,
        ['btree.caption', { m, M: 2 * m, n: this.keys().length, h: this.height() }], { cls: 'dim' });
    }
  }

  BTree.controls = [
    {
      type: 'select',
      name: 'order',
      label: 'btree.order',
      op: 'setOrder',
      value: '2',
      options: [
        { value: '1', label: ['btree.m1'] },
        { value: '2', label: ['btree.m2'] },
        { value: '3', label: ['btree.m3'] },
      ],
    },
    { type: 'sep' },
    { type: 'input', name: 'key', size: 10, placeholder: 'ctl.keys' },
    { type: 'button', label: 'ctl.insert', op: 'insert', args: ['key'], primary: true },
    { type: 'button', label: 'ctl.delete', op: 'delete', args: ['key'] },
    { type: 'button', label: 'ctl.search', op: 'search', args: ['key'] },
    { type: 'sep' },
    { type: 'button', label: 'ctl.random', op: 'random' },
  ];

  BTree.code = {
    insert: {
      title: { fr: 'Ajout dans un arbre B d’ordre m (PSTL)', en: 'Insertion into a B-tree of order m (PSTL)' },
      source: 'pstl',
      lines: [
        'def Ajout(cle, A):',
        '    if EstVide(A): return Page([cle])',
        '    P = Racine(A)',
        '    while not EstFeuille(P):            # descente guidee par la recherche',
        '        if cle in P.cles: return A      # deja presente',
        '        P = P.enfants[bisect_left(P.cles, cle)]',
        '    if cle in P.cles: return A',
        '    insort_left(P.cles, cle)            # ajout a la feuille',
        '    while len(P.cles) > 2*m:            # debordement : eclatement',
        '        moitie = len(P.cles) // 2',
        '        mediane = P.cles[moitie]',
        '        G, D = Page(P.cles[:moitie]), Page(P.cles[moitie+1:])',
        '        if P est la racine:',
        '            return Page([mediane], [G, D])    # la hauteur augmente',
        '        insort_left(Parent(P).cles, mediane)  # G et D remplacent P',
        '        P = Parent(P)',
        '    return A',
      ],
    },
    search: {
      title: { fr: 'Recherche dans un arbre B (PSTL)', en: 'B-tree search (PSTL)' },
      source: 'pstl',
      lines: [
        'def Recherche(cle, A):',
        '    if EstVide(A): return False',
        '    P = Racine(A)',
        '    while True:',
        '        if cle in P.cles: return True',
        '        if EstFeuille(P): return False',
        '        P = P.enfants[bisect_left(P.cles, cle)]',
      ],
    },
    delete: {
      title: { fr: 'Suppression dans un arbre B (PSTL)', en: 'B-tree deletion (PSTL)' },
      source: 'pstl',
      lines: [
        'def Suppression(cle, A):',
        '    P = page contenant cle (descente comme pour Recherche)',
        '    if cle est absente: return A',
        '    if not EstFeuille(P):                 # page interne',
        '        i = P.cles.index(cle); pred = max(P.enfants[i])',
        '        P.cles[i] = pred                  # predecesseur',
        '        P, cle = feuille contenant pred, pred',
        '    P.cles.remove(cle)                    # P est une feuille',
        '    while P est en deficit:               # < m cles (racine : < 1)',
        '        if P est la racine:',
        '            A = P.enfants[0]; break       # la hauteur diminue',
        '        if frere gauche a plus de m cles:',
        '            emprunter au frere gauche     # via la cle du parent',
        '        elif frere droit a plus de m cles:',
        '            emprunter au frere droit',
        '        elif P a un frere gauche:',
        '            P = fusion(frere gauche, cle du parent, P)',
        '        else:',
        '            P = fusion(P, cle du parent, frere droit)',
        '        P = Parent(P)',
        '    return A',
      ],
    },
  };

  DT.register('btree', BTree);
})();
