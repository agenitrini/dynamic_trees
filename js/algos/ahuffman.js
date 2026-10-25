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

/* Huffman adaptatif (chapitre 1) : algorithmes Modification et Traitement du cours. */
(function () {
  'use strict';

  const DT = window.DT;

  DT.i18n.add({
    fr: {
      'ahuffman.op.encode': 'Compression de « {x} »',
      'ahuffman.op.decode': 'Décompression de {x}',
      'ahuffman.read': 'Lecture du symbole {x}.',
      'ahuffman.emitFirst': 'H = # : première lettre, on transmet seulement son code fixe {f}.',
      'ahuffman.emitNew': '{x} ∉ H : on transmet le code de # dans H ({c}) puis le code fixe de {x} ({f}).',
      'ahuffman.emitKnown': '{x} ∈ H : on transmet son code dans H, {c}.',
      'ahuffman.m.root': 'H = # : l’arbre est réduit à la feuille spéciale.',
      'ahuffman.m.first': 'H devient un nœud interne de poids 1, d’enfant gauche # et d’enfant droit {x} (poids 1).',
      'ahuffman.m.notIn': '{x} n’est pas dans H.',
      'ahuffman.m.q#': 'Q = parent(#), le nœud n°{q}.',
      'ahuffman.m.replace': 'La feuille # est remplacée par un nœud de poids 1, d’enfant gauche # et d’enfant droit {x} (poids 1).',
      'ahuffman.m.leaf': '{x} est dans H : Q = feuille({x}), n°{q}.',
      'ahuffman.m.special': 'Cas particulier : les enfants de parent(Q) sont {Q, #} et parent(Q) = finBloc(H, Q) = n°{p}.',
      'ahuffman.m.noSpecialSib': 'Condition fausse : le frère de Q n’est pas #.',
      'ahuffman.m.noSpecialEnd': 'Condition fausse : les enfants de parent(Q) sont {Q, #}, mais finBloc(H, Q) = n°{b} et non parent(Q) = n°{p}.',
      'ahuffman.m.noSpecialRoot': 'Condition fausse : Q est la racine.',
      'ahuffman.m.incQ': 'On ajoute 1 au poids de Q ({x} passe à {w}).',
      'ahuffman.m.fix': 'Attention, correction hors pseudo-code du cours : des nœuds de même poids séparent Q (n°{q}) de parent(Q) (n°{p}) dans l’ordre GDBH, incrémenter Q sur place casserait l’ordre. On échange d’abord Q avec le n°{b}, dernier nœud du bloc avant parent(Q).',
      'ahuffman.m.fixed': 'Échange fait : Q n’est plus le frère de #, on applique Traitement(H, Q) normalement.',
      'ahuffman.m.up': 'Q = parent(Q), le nœud n°{q}.',
      'ahuffman.m.trait': 'Appel de Traitement(H, Q) avec Q = n°{q}.',
      'ahuffman.t.path': 'Traitement(H, Q) : Γ_Q = chemin de Q à la racine, nœuds n° {p}.',
      'ahuffman.t.allInc': 'Tous les nœuds de Γ_Q sont incrémentables (chacun a un poids strictement inférieur à son successeur dans l’ordre GDBH).',
      'ahuffman.t.inc': 'On ajoute 1 à chaque poids du chemin Γ_Q. L’arbre est encore un AHA.',
      'ahuffman.t.m': 'Le nœud n°{m} (poids {w}) n’est pas incrémentable : son successeur n°{s} a le même poids.',
      'ahuffman.t.b': 'Bloc de poids {w} : nœuds n°{m} à n°{b}. Fin de bloc : b = n°{b}.',
      'ahuffman.t.incPart': 'On ajoute 1 à chaque poids du chemin de Q à Q_m (nœuds n° {p}).',
      'ahuffman.t.swap': 'On échange les sous-arbres enracinés en Q_m et Q_b.',
      'ahuffman.t.swapped': 'Sous-arbres échangés ; on recommence avec Q = parent(Q_m), n°{q}.',
      'ahuffman.d.first': 'H = # : on lit les {k} premiers bits {f} → {x}.',
      'ahuffman.d.leaf': 'Bits {c} : de la racine à la feuille {x}.',
      'ahuffman.d.sharp': 'Bits {c} : de la racine à la feuille # ; on lit les {k} bits suivants {f} → {x}.',
      'ahuffman.done': 'Fin : {n} lettres, {b} bits transmis (code fixe seul : {f} bits).',
      'ahuffman.ddone': 'Fin : texte décompressé « {t} ».',
      'ahuffman.out': 'Sortie : {b} bits (code fixe seul : {f} bits)',
      'ahuffman.in': 'Bits restants : {r}',
      'ahuffman.gdbh': 'Ordre GDBH',
      'ahuffman.empty': 'H = # (arbre réduit à la feuille spéciale)',
      'ahuffman.err.letter': '« {v} » : seules les lettres a à z sont acceptées (code fixe sur 5 bits, a = 00000, …, z = 11001).',
      'ahuffman.err.bits': '« {v} » : saisissez une suite de bits (0 et 1).',
      'ahuffman.err.trunc': 'Suite de bits incomplète à la position {i}.',
      'ahuffman.err.code': 'Code fixe {f} invalide (au plus 11001 = z).',
      'ahuffman.ctl.encode': 'Compresser',
      'ahuffman.ctl.decode': 'Décompresser',
      'ahuffman.legend.path': 'chemin Γ_Q / code émis',
      'ahuffman.legend.m': 'nœud non incrémentable Q_m',
      'ahuffman.legend.block': 'bloc de Q_m',
      'ahuffman.legend.b': 'fin de bloc Q_b (anneau vert)',
      'ahuffman.legend.inc': 'poids incrémentés',
    },
    en: {
      'ahuffman.op.encode': 'Compress “{x}”',
      'ahuffman.op.decode': 'Decompress {x}',
      'ahuffman.read': 'Read the symbol {x}.',
      'ahuffman.emitFirst': 'H = #: first letter, output only its fixed code {f}.',
      'ahuffman.emitNew': '{x} ∉ H: output the code of # in H ({c}), then the fixed code of {x} ({f}).',
      'ahuffman.emitKnown': '{x} ∈ H: output its code in H, {c}.',
      'ahuffman.m.root': 'H = #: the tree is just the special leaf.',
      'ahuffman.m.first': 'H becomes an internal node of weight 1, with left child # and right child {x} (weight 1).',
      'ahuffman.m.notIn': '{x} is not in H.',
      'ahuffman.m.q#': 'Q = parent(#), node {q}.',
      'ahuffman.m.replace': 'The leaf # is replaced by a node of weight 1, with left child # and right child {x} (weight 1).',
      'ahuffman.m.leaf': '{x} is in H: Q = leaf({x}), node {q}.',
      'ahuffman.m.special': 'Special case: the children of parent(Q) are {Q, #} and parent(Q) = endBlock(H, Q) = node {p}.',
      'ahuffman.m.noSpecialSib': 'Condition false: the sibling of Q is not #.',
      'ahuffman.m.noSpecialEnd': 'Condition false: the children of parent(Q) are {Q, #}, but endBlock(H, Q) = node {b}, not parent(Q) = node {p}.',
      'ahuffman.m.noSpecialRoot': 'Condition false: Q is the root.',
      'ahuffman.m.incQ': 'Add 1 to the weight of Q ({x} becomes {w}).',
      'ahuffman.m.fix': 'Warning, correction beyond the course pseudo-code: nodes of the same weight separate Q (node {q}) from parent(Q) (node {p}) in GDBH order, so incrementing Q in place would break the order. First swap Q with node {b}, the last node of the block before parent(Q).',
      'ahuffman.m.fixed': 'Swap done: Q is no longer the sibling of #; apply Traitement(H, Q) as usual.',
      'ahuffman.m.up': 'Q = parent(Q), node {q}.',
      'ahuffman.m.trait': 'Call Traitement(H, Q) with Q = node {q}.',
      'ahuffman.t.path': 'Traitement(H, Q): Γ_Q = path from Q to the root, nodes {p}.',
      'ahuffman.t.allInc': 'All nodes of Γ_Q are incrementable (each weighs strictly less than its successor in GDBH order).',
      'ahuffman.t.inc': 'Add 1 to every weight on the path Γ_Q. The tree is still an adaptive Huffman tree.',
      'ahuffman.t.m': 'Node {m} (weight {w}) is not incrementable: its successor {s} has the same weight.',
      'ahuffman.t.b': 'Block of weight {w}: nodes {m} to {b}. End of block: b = {b}.',
      'ahuffman.t.incPart': 'Add 1 to every weight on the path from Q to Q_m (nodes {p}).',
      'ahuffman.t.swap': 'Swap the subtrees rooted at Q_m and Q_b.',
      'ahuffman.t.swapped': 'Subtrees swapped; start again with Q = parent(Q_m), node {q}.',
      'ahuffman.d.first': 'H = #: read the first {k} bits {f} → {x}.',
      'ahuffman.d.leaf': 'Bits {c}: from the root to the leaf {x}.',
      'ahuffman.d.sharp': 'Bits {c}: from the root to the leaf #; read the next {k} bits {f} → {x}.',
      'ahuffman.done': 'Done: {n} letters, {b} bits output (fixed code alone: {f} bits).',
      'ahuffman.ddone': 'Done: decompressed text “{t}”.',
      'ahuffman.out': 'Output: {b} bits (fixed code alone: {f} bits)',
      'ahuffman.in': 'Remaining bits: {r}',
      'ahuffman.gdbh': 'GDBH order',
      'ahuffman.empty': 'H = # (tree reduced to the special leaf)',
      'ahuffman.err.letter': '“{v}”: only the letters a to z are accepted (5-bit fixed code, a = 00000, …, z = 11001).',
      'ahuffman.err.bits': '“{v}”: enter a sequence of bits (0 and 1).',
      'ahuffman.err.trunc': 'Incomplete bit sequence at position {i}.',
      'ahuffman.err.code': 'Invalid fixed code {f} (at most 11001 = z).',
      'ahuffman.ctl.encode': 'Compress',
      'ahuffman.ctl.decode': 'Decompress',
      'ahuffman.legend.path': 'path Γ_Q / emitted code',
      'ahuffman.legend.m': 'non-incrementable node Q_m',
      'ahuffman.legend.block': 'block of Q_m',
      'ahuffman.legend.b': 'end of block Q_b (green ring)',
      'ahuffman.legend.inc': 'incremented weights',
    },
  });

  // clés génériques utilisées par le banc de test (si aucun autre module ne les définit)
  if (!DT.i18n.has('op.encode')) {
    DT.i18n.add({
      fr: { 'op.encode': 'Compression de {x}', 'op.decode': 'Décompression de {x}' },
      en: { 'op.encode': 'Compress {x}', 'op.decode': 'Decompress {x}' },
    });
  }

  const K = 5; // longueur du code fixe
  const fixedCode = (c) => (c.charCodeAt(0) - 97).toString(2).padStart(K, '0');
  const LEVEL = 66;

  class AHuffman extends DT.Algo {
    initState() {
      // H = # (feuille spéciale de poids 0) ; id 1 conservé pendant toute la vie de #
      return {
        nextId: 2,
        root: { id: 1, ch: '#', w: 0, left: null, right: null },
        mode: 'enc',
        items: [], // une case par lettre : { ch, code, fixed }
        pending: '', // lettres restant à traiter dans l'opération en cours
        bits: '', // décompression : bits d'entrée
        pos: 0,
      };
    }

    parse(name, raw, op) {
      if (op === 'decode') {
        const b = String(raw).replace(/[\s,;]+/g, '');
        if (!b) return [];
        const bad = b.match(/[^01]/);
        if (bad) throw new DT.UserError('ahuffman.err.bits', { v: bad[0] });
        if (b.length > 400) throw new DT.UserError('err.toolong', { n: 400 });
        return [b];
      }
      const s = String(raw).replace(/[\s,;]+/g, '').toLowerCase();
      if (!s) return [];
      this.validate(s);
      return [s];
    }

    validate(s) {
      for (const c of s) if (c < 'a' || c > 'z') throw new DT.UserError('ahuffman.err.letter', { v: c });
      if (this.s.items.length + s.length > 60) throw new DT.UserError('err.toolong', { n: 60 });
    }

    /* --- outils sur l'arbre ------------------------------------------- */

    /** Parcours GDBH : niveaux du bas vers le haut, chacun de gauche à droite. */
    gdbh() {
      const levels = [];
      let cur = [this.s.root];
      while (cur.length) {
        levels.push(cur);
        const next = [];
        for (const n of cur) if (n.left) next.push(n.left, n.right);
        cur = next;
      }
      return levels.reverse().flat();
    }

    numbers() {
      const order = this.gdbh();
      const num = new Map();
      order.forEach((n, i) => num.set(n, i + 1));
      return { order, num };
    }

    parentOf(x) {
      let res = null;
      (function rec(n) {
        if (!n || res) return;
        if (n.left === x || n.right === x) res = n;
        else {
          rec(n.left);
          rec(n.right);
        }
      })(this.s.root);
      return res;
    }

    find(ch) {
      let res = null;
      (function rec(n) {
        if (!n || res) return;
        if (!n.left && n.ch === ch) res = n;
        rec(n.left);
        rec(n.right);
      })(this.s.root);
      return res;
    }

    /** Chemin [x, parent(x), ..., racine]. */
    pathUp(x) {
      const p = [x];
      for (let q = this.parentOf(x); q; q = this.parentOf(q)) p.push(q);
      return p;
    }

    codeOf(x) {
      const path = this.pathUp(x).reverse();
      let c = '';
      for (let i = 0; i + 1 < path.length; i++) c += path[i].left === path[i + 1] ? '0' : '1';
      return c;
    }

    /** Indice (dans order) de la fin du bloc de order[i]. */
    finBloc(order, i) {
      let j = i;
      while (j + 1 < order.length && order[j + 1].w === order[i].w) j++;
      return j;
    }

    markPath(x, cls) {
      const p = this.pathUp(x);
      for (let i = 0; i + 1 < p.length; i++) this.markEdge(p[i + 1].id, p[i].id, cls);
    }

    /* --- compression -------------------------------------------------- */
    encode(text) {
      text = String(text).toLowerCase();
      if (this.s.mode !== 'enc') {
        this.s.mode = 'enc';
        this.s.bits = '';
        this.s.pos = 0;
      }
      this.validate(text);
      this.s.pending = text;
      while (this.s.pending.length) {
        const ch = this.s.pending[0];
        this.s.pending = this.s.pending.slice(1);
        this.encodeOne(ch);
      }
      this.clearMarks();
      const b = this.totalBits();
      this.step(['ahuffman.done', { n: this.s.items.length, b, f: K * this.s.items.length }]);
    }

    totalBits() {
      return this.s.items.reduce((a, it) => a + it.code.length + it.fixed.length, 0);
    }

    encodeOne(ch) {
      const s = this.s;
      this.code('compress');
      const item = { ch, code: '', fixed: '', cur: true };
      s.items.forEach((it) => (it.cur = false));
      s.items.push(item);
      this.step(['ahuffman.read', { x: ch }], { line: 2 });
      const leaf = this.find(ch);
      if (leaf) {
        item.code = this.codeOf(leaf);
        this.markPath(leaf, 'hl');
        this.mark(leaf.id, 'hl');
        this.step(['ahuffman.emitKnown', { x: ch, c: item.code }], { line: 3 });
      } else {
        const sharp = this.find('#');
        item.code = this.codeOf(sharp);
        item.fixed = fixedCode(ch);
        this.markPath(sharp, 'hl');
        this.mark(sharp.id, 'hl');
        if (!item.code) this.step(['ahuffman.emitFirst', { f: item.fixed }], { line: 4 });
        else this.step(['ahuffman.emitNew', { x: ch, c: item.code, f: item.fixed }], { line: 4 });
      }
      this.clearMarks();
      this.modification(ch, 5);
      this.clearMarks();
    }

    /* --- décompression ------------------------------------------------ */
    decode(bits) {
      bits = String(bits).replace(/[\s,;]+/g, '');
      if (!bits || /[^01]/.test(bits)) throw new DT.UserError('ahuffman.err.bits', { v: bits.match(/[^01]/) || bits });
      this.s = this.initState();
      const s = this.s;
      s.mode = 'dec';
      s.bits = bits;
      const readFixed = () => {
        if (s.pos + K > bits.length) throw new DT.UserError('ahuffman.err.trunc', { i: s.pos + 1 });
        const f = bits.slice(s.pos, s.pos + K);
        const v = parseInt(f, 2);
        if (v > 25) throw new DT.UserError('ahuffman.err.code', { f });
        s.pos += K;
        return { f, ch: String.fromCharCode(97 + v) };
      };
      this.code('decompress');
      // 1. H = #, décoder k bits
      const first = readFixed();
      s.items.push({ ch: first.ch, code: '', fixed: first.f, cur: true });
      this.step(['ahuffman.d.first', { k: K, f: first.f, x: first.ch }], { line: 1 });
      this.modification(first.ch, 1);
      this.clearMarks();
      while (s.pos < bits.length) {
        this.code('decompress');
        let n = s.root;
        let c = '';
        while (n.left) {
          if (s.pos >= bits.length) throw new DT.UserError('ahuffman.err.trunc', { i: s.pos + 1 });
          const b = bits[s.pos++];
          c += b;
          n = b === '0' ? n.left : n.right;
        }
        s.items.forEach((it) => (it.cur = false));
        this.markPath(n, 'hl');
        this.mark(n.id, 'hl');
        let ch;
        if (n.ch === '#') {
          const fx = readFixed();
          ch = fx.ch;
          s.items.push({ ch, code: c, fixed: fx.f, cur: true });
          this.step(['ahuffman.d.sharp', { c, k: K, f: fx.f, x: ch }], { line: 3 });
        } else {
          ch = n.ch;
          s.items.push({ ch, code: c, fixed: '', cur: true });
          this.step(['ahuffman.d.leaf', { c, x: ch }], { line: 4 });
        }
        this.clearMarks();
        this.modification(ch, 5);
        this.clearMarks();
      }
      this.step(['ahuffman.ddone', { t: s.items.map((it) => it.ch).join('') }], { line: 6, code: 'decompress' });
    }

    /** Texte correspondant aux cases (lettres traitées). */
    text() {
      return this.s.items.map((it) => it.ch).join('');
    }

    /** Bits émis. */
    output() {
      return this.s.items.map((it) => it.code + it.fixed).join('');
    }

    /* --- Modification(H, s) ------------------------------------------- */
    modification(ch, callerLine) {
      const s = this.s;
      this.code('modif');
      if (!s.root.left) {
        // H == #
        this.ring(s.root.id, 'cmp');
        this.step('ahuffman.m.root', { line: 5 });
        const sharp = s.root;
        const leaf = { id: this.newId(), ch, w: 1, left: null, right: null };
        s.root = { id: this.newId(), ch: null, w: 1, left: sharp, right: leaf };
        this.ring(null);
        this.mark(s.root.id, 'new');
        this.mark(leaf.id, 'new');
        this.step(['ahuffman.m.first', { x: ch }], { line: 6 });
        this.step(null, { line: 9 });
        return;
      }
      let Q;
      let leaf = this.find(ch);
      if (!leaf) {
        const sharp = this.find('#');
        this.ring(sharp.id, 'cmp');
        this.step(['ahuffman.m.notIn', { x: ch }], { line: 11 });
        Q = this.parentOf(sharp);
        this.ring(Q.id, 'hl');
        this.step(['ahuffman.m.q#', { q: this.numbers().num.get(Q) }], { line: 12 });
        leaf = { id: this.newId(), ch, w: 1, left: null, right: null };
        const N = { id: this.newId(), ch: null, w: 1, left: sharp, right: leaf };
        if (Q.left === sharp) Q.left = N;
        else Q.right = N;
        this.mark(N.id, 'new');
        this.mark(leaf.id, 'new');
        this.step(['ahuffman.m.replace', { x: ch }], { line: 13 });
        this.unmark(N.id);
        this.unmark(leaf.id);
      } else {
        Q = leaf;
        const { order, num } = this.numbers();
        this.ring(Q.id, 'hl');
        this.step(['ahuffman.m.leaf', { x: ch, q: num.get(Q) }], { line: 18 });
        const P = this.parentOf(Q);
        let special = false;
        if (!P) {
          this.step('ahuffman.m.noSpecialRoot', { line: 19 });
        } else {
          const sib = P.left === Q ? P.right : P.left;
          if (sib.ch !== '#') this.step('ahuffman.m.noSpecialSib', { line: 19 });
          else {
            const b = order[this.finBloc(order, num.get(Q) - 1)];
            if (b === P) {
              this.ring(P.id, 'cmp', 'p');
              this.step(['ahuffman.m.special', { p: num.get(P) }], { line: 19 });
              const kq = num.get(Q) - 1;
              if (order[kq + 1] === P) special = true;
              else {
                // Correction (hors pseudo-code du cours) : des nœuds de même poids que Q
                // séparent Q de parent(Q) dans l'ordre GDBH ; incrémenter Q sur place
                // casserait l'ordre. On échange d'abord Q avec le nœud qui précède
                // parent(Q) (dernier du bloc avant parent(Q)), puis Traitement(H, Q)
                // s'applique normalement.
                const bp = order[num.get(P) - 2];
                this.ring(bp.id, 'ok', 'b');
                this.mark(bp.id, 'cmp');
                this.step(['ahuffman.m.fix', { q: num.get(Q), b: num.get(bp), p: num.get(P) }], { line: 19 });
                const pb = this.parentOf(bp);
                if (pb === P) {
                  const t = P.left;
                  P.left = P.right;
                  P.right = t;
                } else {
                  if (P.left === Q) P.left = bp;
                  else P.right = bp;
                  if (pb.left === bp) pb.left = Q;
                  else pb.right = Q;
                }
                this.ring(null, null, 'p');
                this.ring(null, null, 'b');
                this.step('ahuffman.m.fixed', { line: 19 });
                this.unmark(bp.id);
              }
            } else {
              this.step(['ahuffman.m.noSpecialEnd', { b: num.get(b), p: num.get(P) }], { line: 19 });
            }
          }
        }
        if (special) {
          Q.w++;
          this.mark(Q.id, 'new');
          this.step(['ahuffman.m.incQ', { x: ch, w: Q.w }], { line: 20 });
          this.ring(null, null, 'p');
          Q = P;
          this.ring(Q.id, 'hl');
          this.step(['ahuffman.m.up', { q: this.numbers().num.get(Q) }], { line: 21 });
        }
      }
      this.ring(Q.id, 'hl');
      this.step(['ahuffman.m.trait', { q: this.numbers().num.get(Q) }], { line: 23 });
      this.traitement(Q);
      this.code(s.mode === 'dec' ? 'decompress' : 'compress');
    }

    /* --- Traitement(H, Q) --------------------------------------------- */
    traitement(Q) {
      for (;;) {
        this.code('trait');
        this.clearMarks();
        const { order, num } = this.numbers();
        const gamma = this.pathUp(Q);
        for (let i = 0; i + 1 < gamma.length; i++) this.markEdge(gamma[i + 1].id, gamma[i].id, 'hl');
        for (const g of gamma) this.mark(g.id, 'hl');
        this.ring(Q.id, 'hl');
        this.step(['ahuffman.t.path', { p: gamma.map((g) => num.get(g)).join(', ') }], { line: 1 });
        // premier nœud non incrémentable de Γ_Q (la racine est toujours incrémentable)
        let mi = -1;
        for (let i = 0; i < gamma.length; i++) {
          const k = num.get(gamma[i]) - 1;
          if (k + 1 < order.length && order[k + 1].w === gamma[i].w) {
            mi = i;
            break;
          }
        }
        if (mi < 0) {
          this.step('ahuffman.t.allInc', { line: 6 });
          for (const g of gamma) {
            g.w++;
            this.mark(g.id, 'ok');
          }
          this.ring(null);
          this.step('ahuffman.t.inc', { line: 7 });
          return;
        }
        const Qm = gamma[mi];
        const km = num.get(Qm) - 1;
        for (const g of gamma) this.unmark(g.id);
        this.mark(Qm.id, 'bad');
        this.ring(Qm.id, 'bad');
        this.mark(order[km + 1].id, 'cmp');
        this.step(['ahuffman.t.m', { m: km + 1, w: Qm.w, s: km + 2 }], { line: 10 });
        const kb = this.finBloc(order, km);
        const Qb = order[kb];
        for (let k = km + 1; k <= kb; k++) this.mark(order[k].id, 'cmp');
        this.ring(Qb.id, 'ok', 'b');
        this.step(['ahuffman.t.b', { w: Qm.w, m: km + 1, b: kb + 1 }], { line: 11 });
        if (this.pathUp(Qm).includes(Qb)) throw new Error('échange avec un ancêtre');
        for (let i = 0; i <= mi; i++) {
          gamma[i].w++;
          this.mark(gamma[i].id, 'new');
        }
        this.step(['ahuffman.t.incPart', { p: gamma.slice(0, mi + 1).map((g) => num.get(g)).join(', ') }], { line: 12 });
        this.step('ahuffman.t.swap', { line: 13 });
        const pm = this.parentOf(Qm);
        const pb = this.parentOf(Qb);
        if (pm === pb) {
          const t = pm.left;
          pm.left = pm.right;
          pm.right = t;
        } else {
          if (pm.left === Qm) pm.left = Qb;
          else pm.right = Qb;
          if (pb.left === Qb) pb.left = Qm;
          else pb.right = Qm;
        }
        this.step(null, { line: 13 });
        Q = this.parentOf(Qm);
        this.ring(null, null, 'b');
        this.ring(Q.id, 'hl');
        this.step(['ahuffman.t.swapped', { q: this.numbers().num.get(Q) }], { line: 14 });
      }
    }

    /** Forme parenthésée de l'arbre, comme sur les transparents : 11(4(b2,r2),7(...)). */
    shape(n) {
      n = n || this.s.root;
      if (!n.left) return n.ch === '#' ? '#' : n.ch + n.w;
      return `${n.w}(${this.shape(n.left)},${this.shape(n.right)})`;
    }

    /** Invariants : poids = somme des enfants, ordre GDBH croissant, une feuille # de poids 0. */
    check() {
      const order = this.gdbh();
      for (let i = 0; i + 1 < order.length; i++) {
        if (order[i].w > order[i + 1].w) throw new Error('ordre GDBH non croissant en ' + (i + 1));
      }
      let sharps = 0;
      const ids = new Set();
      const seen = new Set();
      (function rec(n) {
        if (ids.has(n.id)) throw new Error('id dupliqué ' + n.id);
        ids.add(n.id);
        if (!n.left !== !n.right) throw new Error('nœud incomplet');
        if (!n.left) {
          if (n.ch === '#') {
            sharps++;
            if (n.w !== 0) throw new Error('# de poids non nul');
          } else if (seen.has(n.ch)) throw new Error('lettre en double ' + n.ch);
          seen.add(n.ch);
          return;
        }
        if (n.w !== n.left.w + n.right.w) throw new Error('poids non additif');
        rec(n.left);
        rec(n.right);
      })(this.s.root);
      if (sharps !== 1) throw new Error('feuille # absente ou multiple');
    }

    /* --- dessin ------------------------------------------------------- */
    draw(S) {
      const s = this.s;
      let y = 0;
      // l'arbre est placé d'abord (à y = 0) pour régler la largeur de la bande
      const L = DT.layout.binary(s.root, { width: () => 46, levelGap: LEVEL, gap: 14, phantom: 26, y: 0 });

      // bande des lettres traitées et de leurs codes (retour à la ligne)
      const cells = s.items.map((it) => ({ it, label: it.code + (it.code && it.fixed ? '·' : '') + it.fixed }));
      for (const c of s.pending) cells.push({ it: { ch: c, pend: true }, label: '' });
      if (cells.length) {
        const maxW = Math.max(440, Math.min(760, L.maxX - L.minX + 80));
        const rows = [];
        let row = [];
        let wsum = 0;
        for (const c of cells) {
          c.w = Math.max(26, (c.label || '').length * 8.2 + 12);
          if (row.length && wsum + c.w + 4 > maxW) {
            rows.push(row);
            row = [];
            wsum = 0;
          }
          row.push(c);
          wsum += c.w + 4;
        }
        rows.push(row);
        y = 14;
        rows.forEach((r, ri) => {
          const total = r.reduce((a, c) => a + c.w + 4, -4);
          let x = -total / 2;
          r.forEach((c) => {
            const i = cells.indexOf(c);
            S.node('it:' + i, {
              shape: 'cell',
              x: x + c.w / 2,
              y,
              w: c.w,
              h: 26,
              label: c.label,
              top: c.it.ch,
              fontSize: 12.5,
              cls: c.it.pend ? 'muted' : c.it.cur ? 'hl' : '',
            });
            x += c.w + 4;
          });
          if (ri < rows.length - 1) y += 50;
        });
        y += 34;
        const b = this.totalBits();
        if (s.mode === 'dec') {
          const rest = s.bits.slice(s.pos);
          const r = rest.length > 56 ? rest.slice(0, 55) + '…' : rest || '∅';
          S.text('io', 0, y, ['ahuffman.in', { r }], { cls: 'dim mono' });
        } else {
          S.text('io', 0, y, ['ahuffman.out', { b, f: K * s.items.length }], { cls: 'dim' });
        }
        y += 50;
      }

      // l'arbre
      const dx = -(L.minX + L.maxX) / 2;
      const { order, num } = this.numbers();
      for (const [n, p] of L.pos) {
        const leaf = !n.left;
        S.node(n.id, {
          x: p.x + dx,
          y: p.y + y,
          r: 20,
          label: leaf ? (n.ch === '#' ? '#' : `${n.ch},${n.w}`) : String(n.w),
          badge: num.get(n),
          cls: leaf ? (n.ch === '#' ? 'ghost' : 'key') : '',
        });
      }
      for (const [n] of L.pos) {
        if (!n.left) continue;
        S.edge(n.id, n.left.id, { label: '0' });
        S.edge(n.id, n.right.id, { label: '1' });
      }
      if (!s.root.left) {
        S.text('empty', 0, y + 44, ['ahuffman.empty'], { cls: 'dim' });
        return;
      }

      // suite GDBH des poids (les cases suivent les nœuds lors des échanges)
      const gy = y + L.maxDepth * LEVEL + 74;
      const cw = 30;
      S.text('gT', 0, gy - 34, ['ahuffman.gdbh'], { cls: 'title' });
      order.forEach((n, i) => {
        const rb = this.rings.get('b');
        const m = rb && rb.at === String(n.id) ? 'ok' : this.marks.get(String(n.id));
        S.node('g' + n.id, {
          shape: 'cell',
          x: (i - (order.length - 1) / 2) * cw,
          y: gy,
          w: cw - 2,
          h: 26,
          label: String(n.w),
          sub: String(i + 1),
          cls: (n.left ? '' : 'key ') + (m || ''),
        });
      });
    }
  }

  AHuffman.controls = [
    { type: 'input', name: 'text', size: 16, placeholder: 'ctl.text' },
    { type: 'button', label: 'ahuffman.ctl.encode', op: 'encode', args: ['text'], primary: true },
    { type: 'button', label: 'ahuffman.ctl.decode', op: 'decode', args: ['text'] },
  ];

  AHuffman.legend = [
    ['var(--hl)', 'ahuffman.legend.path'],
    ['var(--bad)', 'ahuffman.legend.m'],
    ['var(--cmp)', 'ahuffman.legend.block'],
    ['var(--ok)', 'ahuffman.legend.b'],
    ['var(--new)', 'ahuffman.legend.inc'],
  ];

  AHuffman.code = {
    compress: {
      title: { fr: 'Algorithme de compression', en: 'Compression algorithm' },
      source: 'course',
      lines: [
        '1. H = feuille spéciale #',
        '2. Soit s le symbole suivant de T',
        '   - Si s dans H, alors transmettre le code de s dans H',
        '     Sinon transmettre le code de # dans H puis le code initial de s',
        '   - Modifier H : H = Modification(H, s)',
        '3. Recommencer l’étape 2 tant que T n’est pas vide',
      ],
    },
    modif: {
      title: { fr: 'Algorithme de modification', en: 'Update algorithm' },
      source: 'course',
      lines: [
        'def Modification(H, s):',
        '    """ AHA * Symbole -> AHA',
        '        Renvoie l\'arbre de Huffman avec s incrémenté """',
        '',
        '    if H == #:',
        '        H devient arbre avec un noeud interne (pds 1)',
        '            avec enfant gauche #',
        '            et enfant droit s (pds 1)',
        '        return H',
        '',
        '    elif s not in H:',
        '        Q = parent(feuille #)',
        '        Remplacer noeud(#) par noeud (pds 1)',
        '            avec enfant gauche #',
        '            et enfant droit s (pds 1)',
        '',
        '    else:',
        '        Q = feuille(s)',
        '        if enfants(parent(Q)) == {Q, #} and parent(Q) == finBloc(H,Q):',
        '            Ajouter 1 au poids de Q',
        '            Q = parent(Q)',
        '',
        '    return Traitement(H, Q)',
      ],
    },
    trait: {
      title: { fr: 'Algorithme de traitement', en: 'Processing algorithm' },
      source: 'course',
      lines: [
        'def Traitement(H, Q):',
        '    """ AHA * noeud  -> AHA',
        '    Q, Q_i1, ..., Q_ik = Gamma_Q le chemin direct de Q jusqu\'à la racine',
        '    x_i0, ..., x_ik = les numéros des noeuds de Gamma_Q"""',
        '',
        '    if tous les noeuds de Gamma_Q sont incrémentables:',
        '         Ajouter 1 à chaque poids sur le chemin de Gamma_Q',
        '         return H',
        '    else:',
        '        m = premier indice de Gamma_Q tel que pds(x_m) == pds(x_(m+1))',
        '        b = finBloc(H,m)',
        '        Ajouter 1 à chaque poids du chemin de Q a Q_m',
        '        Échanger dans H les sous-arbres enracinés en Q_m et Q_b',
        '        return Traitement(H, parent(Q_m))',
      ],
    },
    decompress: {
      title: { fr: 'Algorithme de décompression', en: 'Decompression algorithm' },
      source: 'course',
      lines: [
        '1. H = #, décoder k bits -> s, et H = Modification(H, s)',
        '2. Lire les bits de TC en suivant H à partir de sa racine -> feuille',
        '   - Si c\'est la feuille # alors lire les k bits suivants -> s',
        '     Sinon -> caractère s de la feuille',
        '   - H = Modification(H, s)',
        '3. Recommencer l’étape 2 tant que TC n’est pas vide',
      ],
    },
  };

  DT.register('ahuffman', AHuffman);
})();
