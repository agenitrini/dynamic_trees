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

/* Arbre 2-3-4 (chapitre 3) : éclatements en descente ou en remontée, suppression en descente. */
(function () {
  'use strict';

  const DT = window.DT;
  const CW = 34; // largeur d'une case de clé
  const LEVEL = 80; // distance entre deux niveaux

  DT.i18n.add({
    fr: {
      'a234.method': 'Méthode',
      'a234.down': 'Éclatements en descente',
      'a234.up': 'Éclatements en remontée',
      'a234.op.setMethod': 'Changement de méthode d’éclatement',
      'a234.methodSet': 'Méthode : {m}. L’arbre est vidé (les deux méthodes ne donnent pas forcément le même arbre).',
      'a234.caption': (p) =>
        `${DT.i18n.resolve(p.m)} · ${p.n} clé${p.n > 1 ? 's' : ''} · hauteur ${p.h}`,
      'a234.inserted': '{x} est ajouté.',
      'a234.deleted': '{x} est supprimé.',
      'a234.goFirst': '{x} < {a} : on descend dans SsA_1.',
      'a234.goMid': '{a} < {x} < {b} : on descend dans SsA_{i}.',
      'a234.goLast': '{x} > {a} : on descend dans SsA_{i} (dernier sous-arbre).',
      'a234.sLess': '{x} < Elem_{j} = {k} : on descend dans SsA_{j}.',
      'a234.sMore': '{x} > Elem_{j} = {k} : on compare à l’élément suivant.',
      'a234.sLast': '{x} > Elem_{j} = {k} : on descend dans SsA_{i} (Elem_{i} = +∞).',
      'a234.sEmpty': 'Le nœud {t} est une feuille : SsA_{i} est vide, {x} est absent.',
      'a234.leafAdd': '{t} est une feuille : on y insère {x}, elle devient le {d}-nœud {u}.',
      'a234.splitRoot': 'La racine {t} est un 4-nœud : éclatement EcR, l’élément médian {b} va former la nouvelle racine.',
      'a234.splitRootDone': 'Nouvelle racine ({b}) avec les 2-nœuds ({a}) et ({c}) : la hauteur augmente de 1.',
      'a234.splitP2': '{t} est un 4-nœud et son parent {p} un 2-nœud : transformation P2, l’élément médian {b} remonte dans le parent.',
      'a234.splitP3': '{t} est un 4-nœud et son parent {p} un 3-nœud : transformation P3, l’élément médian {b} remonte dans le parent.',
      'a234.splitDone': 'Éclatement fait : ({a}) et ({c}) sont deux 2-nœuds, {b} est dans le parent {p}. On poursuit l’ajout de {x}.',
      'a234.overflow': 'La feuille {t} contenait déjà 3 éléments : avec {y}, elle déborde.',
      'a234.splitUp': 'Éclatement du 4-nœud {t} comme en descente : son élément médian {b} remonte, {y} rejoint le nœud {s}.',
      'a234.newRootUp': '{b} forme la nouvelle racine : la hauteur augmente de 1.',
      'a234.medUp': '{b} est inséré dans le parent, qui devient {t} : fin des éclatements.',
      'a234.cascade': '{b} est inséré dans le parent {t}, qui contenait déjà 3 éléments : il déborde à son tour (éclatement en cascade).',
      'a234.dLeaf': '{x} est dans la feuille {t} : on le retire.',
      'a234.dPred': '{x} est dans un nœud interne et SsA_{i} = {t} a au moins 2 éléments : {x} est remplacé par son prédécesseur {y} (maximum de SsA_{i}).',
      'a234.dSucc': '{x} est dans un nœud interne, SsA_{i} est un 2-nœud mais SsA_{j} = {t} a au moins 2 éléments : {x} est remplacé par son successeur {y} (minimum de SsA_{j}).',
      'a234.dReplaced': '{y} remplace {x} ; on supprime maintenant {y} dans le sous-arbre.',
      'a234.dMergeIn': '{x} est dans un nœud interne dont les deux sous-arbres voisins {l} et {r} sont des 2-nœuds : on les fusionne avec {x}.',
      'a234.dMerged': 'Nœud fusionné : {t} (4-nœud). On poursuit la descente.',
      'a234.dMergedRoot': 'Nœud fusionné : {t}. La racine, vide, disparaît : la hauteur diminue de 1.',
      'a234.dBorrowL': 'On doit descendre dans {t}, un 2-nœud : emprunt au frère gauche {s} ({y} monte dans le parent, {z} descend).',
      'a234.dBorrowR': 'On doit descendre dans {t}, un 2-nœud : emprunt au frère droit {s} ({y} monte dans le parent, {z} descend).',
      'a234.dBorrowed': 'Après la rotation par le parent, le nœud contient {t}.',
      'a234.dMergeL': 'On doit descendre dans {t}, un 2-nœud, et aucun frère voisin n’a 2 éléments : fusion avec le frère gauche {s} et l’élément {z} du parent.',
      'a234.dMergeR': 'On doit descendre dans {t}, un 2-nœud, et le frère droit {s} est aussi un 2-nœud : fusion avec lui et l’élément {z} du parent.',
    },
    en: {
      'a234.method': 'Method',
      'a234.down': 'Top-down splitting',
      'a234.up': 'Bottom-up splitting',
      'a234.op.setMethod': 'Change of splitting method',
      'a234.methodSet': 'Method: {m}. The tree is cleared (both methods do not always give the same tree).',
      'a234.caption': (p) =>
        `${DT.i18n.resolve(p.m)} · ${p.n} key${p.n > 1 ? 's' : ''} · height ${p.h}`,
      'a234.inserted': '{x} is inserted.',
      'a234.deleted': '{x} is deleted.',
      'a234.goFirst': '{x} < {a}: go down into SsA_1.',
      'a234.goMid': '{a} < {x} < {b}: go down into SsA_{i}.',
      'a234.goLast': '{x} > {a}: go down into SsA_{i} (last subtree).',
      'a234.sLess': '{x} < Elem_{j} = {k}: go down into SsA_{j}.',
      'a234.sMore': '{x} > Elem_{j} = {k}: compare with the next element.',
      'a234.sLast': '{x} > Elem_{j} = {k}: go down into SsA_{i} (Elem_{i} = +∞).',
      'a234.sEmpty': 'Node {t} is a leaf: SsA_{i} is empty, {x} is absent.',
      'a234.leafAdd': '{t} is a leaf: insert {x} into it, it becomes the {d}-node {u}.',
      'a234.splitRoot': 'The root {t} is a 4-node: split EcR, the middle element {b} will form the new root.',
      'a234.splitRootDone': 'New root ({b}) with the 2-nodes ({a}) and ({c}): the height grows by 1.',
      'a234.splitP2': '{t} is a 4-node and its parent {p} a 2-node: transformation P2, the middle element {b} moves up into the parent.',
      'a234.splitP3': '{t} is a 4-node and its parent {p} a 3-node: transformation P3, the middle element {b} moves up into the parent.',
      'a234.splitDone': 'Split done: ({a}) and ({c}) are two 2-nodes, {b} is in the parent {p}. Continue inserting {x}.',
      'a234.overflow': 'Leaf {t} already held 3 elements: with {y}, it overflows.',
      'a234.splitUp': 'Split the 4-node {t} as in the top-down method: its middle element {b} moves up, {y} joins node {s}.',
      'a234.newRootUp': '{b} forms the new root: the height grows by 1.',
      'a234.medUp': '{b} is inserted into the parent, which becomes {t}: no more splits.',
      'a234.cascade': '{b} is inserted into the parent {t}, which already held 3 elements: it overflows in turn (cascading split).',
      'a234.dLeaf': '{x} is in leaf {t}: remove it.',
      'a234.dPred': '{x} is in an internal node and SsA_{i} = {t} has at least 2 elements: {x} is replaced by its predecessor {y} (maximum of SsA_{i}).',
      'a234.dSucc': '{x} is in an internal node, SsA_{i} is a 2-node but SsA_{j} = {t} has at least 2 elements: {x} is replaced by its successor {y} (minimum of SsA_{j}).',
      'a234.dReplaced': '{y} replaces {x}; now delete {y} from the subtree.',
      'a234.dMergeIn': '{x} is in an internal node whose two neighbouring subtrees {l} and {r} are 2-nodes: merge them with {x}.',
      'a234.dMerged': 'Merged node: {t} (4-node). Keep going down.',
      'a234.dMergedRoot': 'Merged node: {t}. The empty root disappears: the height decreases by 1.',
      'a234.dBorrowL': 'We must go down into {t}, a 2-node: borrow from the left sibling {s} ({y} moves up into the parent, {z} moves down).',
      'a234.dBorrowR': 'We must go down into {t}, a 2-node: borrow from the right sibling {s} ({y} moves up into the parent, {z} moves down).',
      'a234.dBorrowed': 'After the rotation through the parent, the node holds {t}.',
      'a234.dMergeL': 'We must go down into {t}, a 2-node, and no neighbouring sibling has 2 elements: merge with the left sibling {s} and the parent element {z}.',
      'a234.dMergeR': 'We must go down into {t}, a 2-node, and the right sibling {s} is a 2-node too: merge with it and the parent element {z}.',
    },
  });

  const tup = (keys) => '(' + keys.join(', ') + ')';
  const isLeaf = (n) => !n.kids.length;
  /** Indice du sous-arbre où poursuivre la recherche de x (x absent du nœud). */
  const childIdx = (n, x) => {
    let i = 0;
    while (i < n.keys.length && x > n.keys[i]) i++;
    return i;
  };
  /** Décalage horizontal du centre de la case i par rapport au centre du nœud. */
  const cellDx = (n, i) => -(Math.max(1, n.keys.length) * CW) / 2 + (i + 0.5) * CW;

  class A234 extends DT.Algo {
    initState() {
      return { nextId: 1, root: null, cfg: { method: 'down' } };
    }

    setMethod(m) {
      this.s = this.initState();
      this.s.cfg.method = m === 'up' ? 'up' : 'down';
      this.step(['a234.methodSet', { m: ['a234.' + this.s.cfg.method] }]);
    }

    /* --- décorations -------------------------------------------------- */

    /** Bulle de la clé x (en cours d'ajout) à côté du nœud n. */
    bubble(x, n) {
      if (!n) this.float('cand', { id: 'cand', label: x, cls: 'new', x: 0, y: 0 });
      else this.float('cand', { id: 'cand', label: x, cls: 'new', at: n.id, dx: (Math.max(1, n.keys.length) * CW) / 2 + 18, dy: -40 });
    }

    /** Case flottante (clé qui se déplace) posée sur la case i du nœud n. */
    keyFloat(name, label, n, i, cls) {
      this.float(name, { id: 'f:' + name, label, cls: cls || 'hl', shape: 'box', w: CW - 4, h: 28, at: n.id, dx: cellDx(n, i), dy: 0 });
    }

    /** Étape de descente de n vers son sous-arbre i (clés encadrantes en bleu). */
    descend(n, i, x, line) {
      const k = n.keys.length;
      if (i > 0) this.mark(`${n.id}#${i - 1}`, 'cmp');
      if (i < k) this.mark(`${n.id}#${i}`, 'cmp');
      this.markEdge(n.id, n.kids[i].id, 'cmp');
      let msg;
      if (i === 0) msg = ['a234.goFirst', { x, a: n.keys[0] }];
      else if (i === k) msg = ['a234.goLast', { x, a: n.keys[k - 1], i: k + 1 }];
      else msg = ['a234.goMid', { x, a: n.keys[i - 1], b: n.keys[i], i: i + 1 }];
      this.step(msg, { line });
    }

    newRoot(x, line) {
      const id = this.newId();
      this.bubble(x, null);
      this.step(['c.newRoot', { x }], { line });
      this.float('cand', null);
      this.s.root = { id, keys: [x], kids: [] };
      this.mark(id, 'new');
      this.step(['a234.inserted', { x }], { line });
    }

    /* --- ajout -------------------------------------------------------- */
    insert(x) {
      if (this.s.cfg.method === 'up') this.insertUp(x);
      else this.insertDown(x);
    }

    /** Éclatements en descente (algorithme Ajout / EcR / AjoutSimple du cours). */
    insertDown(x) {
      this.code('insertDown');
      if (!this.s.root) {
        this.newRoot(x, 0);
        return;
      }
      let n = this.s.root;
      let parent = null;
      let pi = -1;
      for (;;) {
        this.clearMarks();
        this.bubble(x, n);
        this.ring(n.id, 'cmp');
        const ki = n.keys.indexOf(x);
        if (ki >= 0) {
          this.mark(`${n.id}#${ki}`, 'ok');
          this.ring(n.id, 'ok');
          this.step(['c.already', { x }]);
          return;
        }
        if (n.keys.length === 3) {
          const r = this.splitDown(n, parent, pi, x);
          parent = r.parent;
          n = x < r.b ? n : r.right;
          pi = parent.kids.indexOf(n);
          continue;
        }
        if (isLeaf(n)) {
          const before = tup(n.keys);
          n.keys.push(x);
          n.keys.sort((a, b) => a - b);
          this.clearMarks();
          this.mark(`${n.id}#${n.keys.indexOf(x)}`, 'new');
          this.ring(n.id, 'new');
          this.step(['a234.leafAdd', { x, t: before, u: tup(n.keys), d: n.keys.length + 1 }], { line: 17 });
          return;
        }
        const i = childIdx(n, x);
        this.descend(n, i, x, 19);
        parent = n;
        pi = i;
        n = n.kids[i];
      }
    }

    /** Éclate le 4-nœud n (enfant n° pi de parent, ou racine) : EcR, P2 ou P3. */
    splitDown(n, parent, pi, x) {
      const [a, b, c] = n.keys;
      const isRoot = !parent;
      const kind = isRoot ? 'a234.splitRoot' : parent.keys.length === 1 ? 'a234.splitP2' : 'a234.splitP3';
      const line = isRoot ? 5 : parent.keys.length === 1 ? 21 : 22;
      this.clearMarks();
      this.bubble(x, n);
      this.ring(n.id, 'hl');
      this.mark(`${n.id}#1`, 'hl');
      this.keyFloat('med', b, n, 1);
      if (parent) this.ring(parent.id, 'cmp', 'parent');
      this.step([kind, { t: tup(n.keys), b, p: parent ? tup(parent.keys) : '' }], { line });

      const right = { id: this.newId(), keys: [c], kids: n.kids.slice(2) };
      n.keys = [a];
      n.kids = n.kids.slice(0, 2);
      if (isRoot) {
        parent = { id: this.newId(), keys: [b], kids: [n, right] };
        this.s.root = parent;
      } else {
        parent.keys.splice(pi, 0, b);
        parent.kids.splice(pi + 1, 0, right);
      }
      const bi = parent.keys.indexOf(b);
      this.clearMarks();
      this.bubble(x, x < b ? n : right);
      this.mark(n.id, 'new');
      this.mark(right.id, 'new');
      this.mark(`${parent.id}#${bi}`, 'hl');
      this.keyFloat('med', b, parent, bi);
      this.markEdge(parent.id, n.id, 'new');
      this.markEdge(parent.id, right.id, 'new');
      if (isRoot) this.step(['a234.splitRootDone', { a, b, c }], { line: 11 });
      else this.step(['a234.splitDone', { a, b, c, x, p: tup(parent.keys) }], { line });
      this.float('med', null);
      return { parent, right, b };
    }

    /** Éclatements en remontée : ajout à la feuille, puis éclatements en cascade. */
    insertUp(x) {
      this.code('insertUp');
      if (!this.s.root) {
        this.newRoot(x, 4);
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
          this.step(['c.already', { x }], { line: 5 });
          return;
        }
        if (isLeaf(n)) break;
        const i = childIdx(n, x);
        this.descend(n, i, x, 5);
        path.push([n, i]);
        n = n.kids[i];
      }
      const before = tup(n.keys);
      n.keys.push(x);
      n.keys.sort((a, b) => a - b);
      this.clearMarks();
      this.mark(`${n.id}#${n.keys.indexOf(x)}`, 'new');
      if (n.keys.length <= 3) {
        this.ring(n.id, 'new');
        this.step(['a234.leafAdd', { x, t: before, u: tup(n.keys), d: n.keys.length + 1 }], { line: 6 });
        return;
      }
      this.mark(n.id, 'bad');
      this.step(['a234.overflow', { t: before, y: x }], { line: 8 });

      let y = x; // élément reçu en trop par n
      while (n.keys.length === 4) {
        // on éclate le 4-nœud (a, b, c) d'origine : b remonte, y reste de son côté
        const orig = n.keys.filter((k) => k !== y);
        const b = orig[1];
        const bi = n.keys.indexOf(b);
        const lk = n.keys.slice(0, bi);
        const rk = n.keys.slice(bi + 1);
        this.clearMarks();
        this.mark(n.id, 'bad');
        this.mark(`${n.id}#${bi}`, 'hl');
        this.mark(`${n.id}#${n.keys.indexOf(y)}`, 'new');
        this.keyFloat('med', b, n, bi);
        this.step(['a234.splitUp', { t: tup(orig), b, y, s: tup(y < b ? lk : rk) }], { line: 10 });

        const right = { id: this.newId(), keys: rk, kids: n.kids.slice(bi + 1) };
        n.keys = lk;
        n.kids = n.kids.slice(0, bi + 1);
        const top = path.pop();
        this.clearMarks();
        this.mark(n.id, 'new');
        this.mark(right.id, 'new');
        if (!top) {
          const root = { id: this.newId(), keys: [b], kids: [n, right] };
          this.s.root = root;
          this.mark(`${root.id}#0`, 'hl');
          this.keyFloat('med', b, root, 0);
          this.step(['a234.newRootUp', { b }], { line: 12 });
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
        if (p.keys.length === 4) {
          this.mark(p.id, 'bad');
          this.step(['a234.cascade', { b, t: tup(p.keys) }], { line: 14 });
        } else {
          this.ring(p.id, 'ok');
          this.step(['a234.medUp', { b, t: tup(p.keys) }], { line: 13 });
        }
        this.float('med', null);
        n = p;
        y = b;
      }
    }

    /* --- recherche ---------------------------------------------------- */
    search(x) {
      this.code('search');
      let n = this.s.root;
      if (!n) {
        this.step(['c.notFound', { x }], { line: 5 });
        return false;
      }
      for (;;) {
        this.clearMarks();
        this.float('probe', { id: 'probe', label: x, cls: 'cmp', at: n.id, dx: (Math.max(1, n.keys.length) * CW) / 2 + 18, dy: -40 });
        this.ring(n.id, 'cmp');
        const ki = n.keys.indexOf(x);
        if (ki >= 0) {
          this.ring(n.id, 'ok');
          this.mark(`${n.id}#${ki}`, 'ok');
          this.float('probe', null);
          this.step(['c.found', { x }], { line: 7 });
          return true;
        }
        // comparaisons successives aux éléments du nœud (Elem_i = +∞ s'il n'existe pas)
        let i = 0;
        const k = n.keys.length;
        for (;;) {
          this.mark(`${n.id}#${i}`, 'cmp');
          if (x < n.keys[i]) {
            this.step(['a234.sLess', { x, j: i + 1, k: n.keys[i] }], { line: 9 + 2 * i });
            break;
          }
          if (i === k - 1) {
            this.step(['a234.sLast', { x, j: i + 1, k: n.keys[i], i: k + 1 }], { line: k === 3 ? 14 : 9 + 2 * k });
            i = k;
            break;
          }
          this.step(['a234.sMore', { x, j: i + 1, k: n.keys[i] }], { line: 8 + 2 * i });
          this.unmark(`${n.id}#${i}`);
          i++;
        }
        if (isLeaf(n)) {
          this.float('probe', null);
          this.ring(n.id, 'bad');
          this.step(['a234.sEmpty', { x, t: tup(n.keys), i: i + 1 }], { line: 5 });
          return false;
        }
        n = n.kids[i];
      }
    }

    /* --- suppression (fusions et emprunts en descente) ---------------- */
    delete(x) {
      this.code('delete');
      const x0 = x;
      let n = this.s.root;
      if (!n) {
        this.step(['c.notFound', { x }], { line: 26 });
        return;
      }
      for (;;) {
        this.clearMarks();
        this.ring(n.id, 'cmp');
        const ki = n.keys.indexOf(x);
        if (ki >= 0 && isLeaf(n)) {
          this.mark(`${n.id}#${ki}`, 'bad');
          this.ring(n.id, 'bad');
          this.step(['a234.dLeaf', { x, t: tup(n.keys) }], { line: 8 });
          n.keys.splice(ki, 1);
          if (!n.keys.length) this.s.root = null; // seule la racine peut se vider
          this.clearMarks();
          if (this.s.root) this.ring(n.id, 'ok');
          this.step(['a234.deleted', { x: x0 }], { line: 9 });
          return;
        }
        if (ki >= 0) {
          n = this.deleteInternal(n, ki, x);
          if (n.repl !== undefined) {
            x = n.repl;
            n = n.node;
          }
          continue;
        }
        if (isLeaf(n)) {
          this.ring(n.id, 'bad');
          this.step(['c.notFound', { x }], { line: 26 });
          return;
        }
        const i = childIdx(n, x);
        this.descend(n, i, x, 18);
        n = this.ensureTwo(n, i);
      }
    }

    /**
     * x = Elem_{ki+1}(n), n interne. Renvoie soit { node, repl } (x remplacé par
     * repl, à supprimer dans node), soit le nœud fusionné contenant x.
     */
    deleteInternal(n, ki, x) {
      const L = n.kids[ki];
      const R = n.kids[ki + 1];
      if (L.keys.length >= 2 || R.keys.length >= 2) {
        const pred = L.keys.length >= 2;
        let m = pred ? L : R;
        while (!isLeaf(m)) m = pred ? m.kids[m.kids.length - 1] : m.kids[0];
        const mi = pred ? m.keys.length - 1 : 0;
        const y = m.keys[mi];
        this.mark(`${n.id}#${ki}`, 'bad');
        this.mark(`${m.id}#${mi}`, 'hl');
        this.ring(n.id, 'bad');
        this.ring(m.id, 'hl', 'repl');
        this.keyFloat('mv', y, m, mi);
        if (pred) this.step(['a234.dPred', { x, y, i: ki + 1, t: tup(L.keys) }], { line: 11 });
        else this.step(['a234.dSucc', { x, y, i: ki + 1, j: ki + 2, t: tup(R.keys) }], { line: 13 });
        n.keys[ki] = y;
        this.clearMarks();
        this.mark(`${n.id}#${ki}`, 'hl');
        this.mark(`${m.id}#${mi}`, 'bad');
        this.keyFloat('mv', y, n, ki);
        this.step(['a234.dReplaced', { x, y }], { line: pred ? 12 : 14 });
        this.float('mv', null);
        return { node: pred ? L : R, repl: y };
      }
      // les deux voisins sont des 2-nœuds : fusion (SsA_i, x, SsA_i+1)
      this.mark(L.id, 'cmp');
      this.mark(R.id, 'cmp');
      this.mark(`${n.id}#${ki}`, 'hl');
      this.keyFloat('mv', x, n, ki);
      this.step(['a234.dMergeIn', { x, l: tup(L.keys), r: tup(R.keys) }], { line: 16 });
      return this.merge(n, ki, x, 16);
    }

    /** Fusionne les enfants ki et ki+1 de n avec l'élément séparateur ; renvoie le nœud fusionné. */
    merge(n, ki, x, line) {
      const L = n.kids[ki];
      const R = n.kids[ki + 1];
      const sep = n.keys[ki];
      L.keys = L.keys.concat([sep], R.keys);
      L.kids = L.kids.concat(R.kids);
      n.keys.splice(ki, 1);
      n.kids.splice(ki + 1, 1);
      const shrink = n === this.s.root && !n.keys.length;
      if (shrink) this.s.root = L;
      this.clearMarks();
      this.mark(L.id, 'new');
      const si = L.keys.indexOf(sep);
      this.mark(`${L.id}#${si}`, 'hl');
      this.keyFloat('mv', sep, L, si);
      if (x !== undefined && x !== sep) this.ring(L.id, 'cmp');
      this.step([shrink ? 'a234.dMergedRoot' : 'a234.dMerged', { t: tup(L.keys) }], { line: shrink ? 24 : line });
      this.float('mv', null);
      return L;
    }

    /** Avant de descendre dans l'enfant i de n : lui garantit au moins 2 éléments. */
    ensureTwo(n, i) {
      const f = n.kids[i];
      if (f.keys.length >= 2) return f;
      const ls = i > 0 ? n.kids[i - 1] : null;
      const rs = i < n.keys.length ? n.kids[i + 1] : null;
      const t = tup(f.keys);
      this.clearMarks();
      this.mark(f.id, 'bad');
      this.ring(f.id, 'bad');
      if ((ls && ls.keys.length >= 2) || (rs && rs.keys.length >= 2)) {
        const left = ls && ls.keys.length >= 2;
        const s = left ? ls : rs;
        const si = left ? i - 1 : i; // élément séparateur dans n
        const yi = left ? s.keys.length - 1 : 0;
        const y = s.keys[yi];
        const z = n.keys[si];
        this.mark(s.id, 'cmp');
        this.mark(`${s.id}#${yi}`, 'hl');
        this.mark(`${n.id}#${si}`, 'hl');
        this.keyFloat('up', y, s, yi);
        this.keyFloat('down', z, n, si);
        this.step([left ? 'a234.dBorrowL' : 'a234.dBorrowR', { t, s: tup(s.keys), y, z }], { line: 20 });
        if (left) {
          f.keys.unshift(z);
          n.keys[si] = s.keys.pop();
          if (!isLeaf(s)) f.kids.unshift(s.kids.pop());
        } else {
          f.keys.push(z);
          n.keys[si] = s.keys.shift();
          if (!isLeaf(s)) f.kids.push(s.kids.shift());
        }
        const zi = f.keys.indexOf(z);
        this.clearMarks();
        this.mark(f.id, 'new');
        this.mark(`${f.id}#${zi}`, 'hl');
        this.mark(`${n.id}#${si}`, 'hl');
        this.keyFloat('up', y, n, si);
        this.keyFloat('down', z, f, zi);
        this.step(['a234.dBorrowed', { t: tup(f.keys) }], { line: 21 });
        this.float('up', null);
        this.float('down', null);
        return f;
      }
      const left = !!ls;
      const s = left ? ls : rs;
      const si = left ? i - 1 : i;
      const z = n.keys[si];
      this.mark(s.id, 'cmp');
      this.mark(`${n.id}#${si}`, 'hl');
      this.keyFloat('mv', z, n, si);
      this.step([left ? 'a234.dMergeL' : 'a234.dMergeR', { t, s: tup(s.keys), z }], { line: 23 });
      return this.merge(n, si, undefined, 23);
    }

    random() {
      this.clear();
      for (const v of DT.util.randDistinct(12, 1, 99)) {
        this.step(['op.insert', { x: v }], { op: true, code: null });
        this.insert(v);
        this.clearMarks();
      }
    }

    /** Invariants : 1 à 3 clés par nœud, ordre de recherche, feuilles au même niveau, identifiants uniques. */
    check() {
      const ids = new Set();
      let leafDepth = -1;
      (function rec(n, lo, hi, d) {
        if (!n) return;
        if (ids.has(n.id)) throw new Error('id dupliqué ' + n.id);
        ids.add(n.id);
        const k = n.keys.length;
        if (k < 1 || k > 3) throw new Error(`nœud ${tup(n.keys)} : ${k} clés`);
        for (let i = 0; i < k; i++) {
          if (!(n.keys[i] > lo && n.keys[i] < hi)) throw new Error('ordre violé en ' + n.keys[i]);
          if (i > 0 && !(n.keys[i] > n.keys[i - 1])) throw new Error('clés non triées ' + tup(n.keys));
        }
        if (!n.kids.length) {
          if (leafDepth < 0) leafDepth = d;
          else if (leafDepth !== d) throw new Error('feuilles à des niveaux différents');
          return;
        }
        if (n.kids.length !== k + 1) throw new Error(`nœud ${tup(n.keys)} : ${n.kids.length} sous-arbres`);
        n.kids.forEach((c, i) => rec(c, i === 0 ? lo : n.keys[i - 1], i === k ? hi : n.keys[i], d + 1));
      })(this.s.root, -Infinity, Infinity, 0);
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
      const m = ['a234.' + this.s.cfg.method];
      if (!this.s.root) {
        S.text('empty', 0, 30, ['c.emptyTree'], { cls: 'dim' });
        S.text('caption', 0, 58, m, { cls: 'dim' });
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
        ['a234.caption', { m, n: this.keys().length, h: this.height() }], { cls: 'dim' });
    }
  }

  A234.controls = [
    {
      type: 'select',
      name: 'method',
      label: 'a234.method',
      op: 'setMethod',
      value: 'down',
      options: [
        { value: 'down', label: ['a234.down'] },
        { value: 'up', label: ['a234.up'] },
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

  A234.code = {
    insertDown: {
      title: { fr: 'Ajout avec éclatements en descente (cours)', en: 'Insertion with top-down splitting (lecture)' },
      source: 'course',
      lines: [
        'def Ajout(x, A):',
        '    """ entier * A2-3-4 -> A2-3-4',
        '        Renvoie l\'arbre 2-3-4 dans lequel x a ete ajoute."""',
        '    if Degre(A) == 4:',
        '        return AjoutSimple(x, EcR(A))',
        '    return AjoutSimple(x, A)',
        '',
        'def EcR(A):',
        '    """ A2-3-4 -> A2-3-4',
        '        Renvoie l\'arbre 2-3-4 dans lequel la racine de A a ete eclatee."""',
        '    return < (Elem_2(A)), < (Elem_1(A)), SsA_1(A), SsA_2(A) >',
        '        < (Elem_3(A)), SsA_3(A), SsA_4(A) > >',
        '',
        'def AjoutSimple(x, A):',
        '    """ entier * A2-3-4 -> A2-3-4',
        '        Renvoie l\'arbre 2-3-4 dans lequel x a ete ajoute a la racine."""',
        '    # A feuille et Degre(A) < 4 : x est insere dans Contenu(A)',
        '    if Degre(A) < 4:',
        '        return AjoutSimple(x, Ui)',
        '    if Degre(Parent(A)) == 2:',
        '        return AjoutSimple(x, P2)',
        '    return AjoutSimple(x, P3)',
      ],
    },
    insertUp: {
      title: { fr: 'Ajout avec éclatements en remontée', en: 'Insertion with bottom-up splitting' },
      source: 'site',
      lines: [
        'def AjoutRemontee(x, A):',
        '    """ entier * A2-3-4 -> A2-3-4',
        '        Ajout aux feuilles, puis eclatements en remontee."""',
        '    if EstVide(A): return < (x) >',
        '    F = feuille ou ajouter x (descente comme pour Recherche234)',
        '    inserer x dans Contenu(F)          # insertion triee',
        '    N, y = F, x',
        '    while Degre(N) == 5:               # N = (a, b, c) a recu y',
        '        # eclatement du 4-noeud (a, b, c), comme en descente :',
        '        G, D = < (a), ... >, < (c), ... >   # y rejoint G ou D',
        '        if N est la racine:',
        '            return < (b), G, D >        # la hauteur augmente',
        '        inserer b dans Parent(N) ; G et D remplacent N',
        '        N, y = Parent(N), b',
        '    return A',
      ],
    },
    search: {
      title: { fr: 'Recherche dans un arbre 2-3-4 (cours)', en: '2-3-4 tree search (lecture)' },
      source: 'course',
      lines: [
        'def Recherche234(x, A):',
        '    """ entier * A2-3-4 -> booleen',
        '        Renvoie Vrai ssi x est dans A."""',
        '    if EstVide(A):',
        '        return False',
        '    if EstDans(x, Contenu(A)):',
        '        return True',
        '    if x < Elem_1(A):',
        '        return Recherche234(x, SsA_1(A))',
        '    if x < Elem_2(A):',
        '        return Recherche234(x, SsA_2(A))',
        '    if x < Elem_3(A):',
        '        return Recherche234(x, SsA_3(A))',
        '    return Recherche234(x, SsA_4(A))',
      ],
    },
    delete: {
      title: { fr: 'Suppression (fusions et emprunts en descente)', en: 'Deletion (top-down merges and borrows)' },
      source: 'site',
      lines: [
        'def Suppression(x, A):',
        '    """ entier * A2-3-4 -> A2-3-4',
        '        Tout noeud dans lequel on descend (sauf la racine)',
        '        contient au moins 2 elements."""',
        '    N = A',
        '    while not EstVide(N):',
        '        if EstDans(x, Contenu(N)) and EstFeuille(N):',
        '            retirer x de Contenu(N)',
        '            return A',
        '        if EstDans(x, Contenu(N)):          # x = Elem_i(N)',
        '            if Degre(SsA_i(N)) >= 3:          # predecesseur',
        '                y = Max(SsA_i(N)); remplacer x par y; x, N = y, SsA_i(N)',
        '            elif Degre(SsA_i+1(N)) >= 3:      # successeur',
        '                y = Min(SsA_i+1(N)); remplacer x par y; x, N = y, SsA_i+1(N)',
        '            else:',
        '                N = Fusion(SsA_i(N), x, SsA_i+1(N))   # 4-noeud',
        '            continue',
        '        F = SsA_j(N) ou poursuivre (comme pour Recherche234)',
        '        if Degre(F) == 2:',
        '            if un frere voisin de F a au moins 2 elements:',
        '                Emprunt(F, frere, N)        # rotation par le parent',
        '            else:',
        '                F = Fusion(F, element de N, frere)',
        '                if Contenu(N) vide: A = F    # la hauteur diminue',
        '        N = F',
        '    return A                                # x absent',
      ],
    },
  };

  DT.register('a234', A234);
})();
