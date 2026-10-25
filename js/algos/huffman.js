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

/* Huffman statique (chapitre 1). */
(function () {
  'use strict';

  const DT = window.DT;

  DT.i18n.add({
    fr: {
      'huffman.op.build': 'Codage de Huffman de « {x} »',
      'huffman.op.encode': 'Codage de Huffman de « {x} »',
      'huffman.count': 'On parcourt T ({N} caractères) pour compter les occurrences : {n} lettres distinctes.',
      'huffman.heap': 'FP = construireTas : une feuille par lettre, de poids sa fréquence. File rangée par poids croissant ; à poids égal, l’arbre créé le plus tôt passe d’abord (feuilles dans l’ordre d’apparition dans T).',
      'huffman.extractG': 'G = {t}, de poids minimal {w}, est extrait de la file.',
      'huffman.extractD': 'D = {t}, de poids minimal {w} parmi les arbres restants, est extrait.',
      'huffman.merge': 'R = nouvel arbre de sous-arbre gauche G et droit D, de poids {g} + {d} = {w}.',
      'huffman.insert': 'R (poids {w}) est ajouté à la file ; il reste {k} arbre(s).',
      'huffman.root': 'Il ne reste qu’un arbre : c’est l’arbre de Huffman (poids total {w}).',
      'huffman.single': 'Une seule lettre : l’arbre est réduit à une feuille (code vide, cas dégénéré).',
      'huffman.code': 'C({c}) = {code} : chemin de la racine à la feuille (0 à gauche, 1 à droite) ; f × |C| = {f} × {l} = {p}.',
      'huffman.total': '||T_C|| = Σ f(a) × |C(a)| = {t} bits (code fixe sur {k} bits : {n} × {k} = {fx} bits).',
      'huffman.dyck': 'Codage compact de l’arbre (Dyck-ABCIF, parcours préfixe : 0 = nœud interne, 1 = feuille suivie de sa lettre).',
      'huffman.text': 'T = {t}',
      'huffman.freq': 'Fréquences',
      'huffman.queue': 'File de priorité (par poids croissant)',
      'huffman.th.letter': 'lettre',
      'huffman.th.code': 'code',
      'huffman.sum': 'Σ = {t} bits',
      'huffman.bits': 'T_C ({n} bits) :',
      'huffman.dyckLbl': 'Arbre (Dyck) : {d}',
      'huffman.err.empty': 'Saisissez un texte.',
      'huffman.subtree': 'l’arbre [{l}]',
    },
    en: {
      'huffman.op.build': 'Huffman coding of “{x}”',
      'huffman.op.encode': 'Huffman coding of “{x}”',
      'huffman.count': 'Scan T ({N} characters) to count occurrences: {n} distinct letters.',
      'huffman.heap': 'FP = buildHeap: one leaf per letter, weighted by its frequency. The queue is ordered by increasing weight; on ties, the tree created first comes first (leaves in order of appearance in T).',
      'huffman.extractG': 'G = {t}, of minimal weight {w}, is extracted from the queue.',
      'huffman.extractD': 'D = {t}, of minimal weight {w} among the remaining trees, is extracted.',
      'huffman.merge': 'R = new tree with left subtree G and right subtree D, of weight {g} + {d} = {w}.',
      'huffman.insert': 'R (weight {w}) is inserted into the queue; {k} tree(s) left.',
      'huffman.root': 'Only one tree is left: it is the Huffman tree (total weight {w}).',
      'huffman.single': 'Only one letter: the tree is a single leaf (empty code, degenerate case).',
      'huffman.code': 'C({c}) = {code}: path from the root to the leaf (0 left, 1 right); f × |C| = {f} × {l} = {p}.',
      'huffman.total': '||T_C|| = Σ f(a) × |C(a)| = {t} bits (fixed {k}-bit code: {n} × {k} = {fx} bits).',
      'huffman.dyck': 'Compact tree encoding (Dyck-ABCIF, preorder: 0 = internal node, 1 = leaf followed by its letter).',
      'huffman.text': 'T = {t}',
      'huffman.freq': 'Frequencies',
      'huffman.queue': 'Priority queue (by increasing weight)',
      'huffman.th.letter': 'letter',
      'huffman.th.code': 'code',
      'huffman.sum': 'Σ = {t} bits',
      'huffman.bits': 'T_C ({n} bits):',
      'huffman.dyckLbl': 'Tree (Dyck): {d}',
      'huffman.err.empty': 'Enter a text.',
      'huffman.subtree': 'the tree [{l}]',
    },
  });

  const show = (c) => (c === ' ' ? '␣' : c);
  const kids = (n) => (n.left ? [n.left, n.right] : []);

  class Huffman extends DT.Algo {
    constructor() {
      super();
      this.tags = new Map(); // id de racine -> « G » / « D »
    }

    initState() {
      return { nextId: 1, text: '', freq: [], row: [], ord: 0, codes: null, bits: '', dyck: '', phase: 'empty' };
    }

    clearMarks() {
      super.clearMarks();
      if (this.tags) this.tags.clear();
    }

    parse(name, raw) {
      const s = String(raw).trim().replace(/\s+/g, ' ');
      if (!s) return [];
      if (s.length > 80) throw new DT.UserError('err.toolong', { n: 80 });
      return [s];
    }

    letters(n) {
      const out = [];
      (function rec(t) {
        if (!t.left) out.push(show(t.ch));
        else {
          rec(t.left);
          rec(t.right);
        }
      })(n);
      return out;
    }

    desc(n) {
      return n.left ? ['huffman.subtree', { l: this.letters(n).join(' ') }] : show(n.ch);
    }

    sortRow() {
      this.s.row.sort((a, b) => a.w - b.w || a.ord - b.ord);
    }

    /* --- construction ------------------------------------------------- */
    build(text) {
      text = String(text);
      if (!text.length) throw new DT.UserError('huffman.err.empty');
      if (text.length > 1000) throw new DT.UserError('err.toolong', { n: 1000 });
      this.s = this.initState();
      const s = this.s;
      s.text = text;
      // 1. fréquences, dans l'ordre d'apparition
      this.code('compress');
      const idx = new Map();
      for (const c of text) {
        if (!idx.has(c)) {
          idx.set(c, s.freq.length);
          s.freq.push({ ch: c, f: 0 });
        }
        s.freq[idx.get(c)].f++;
      }
      s.phase = 'count';
      for (const fr of s.freq) this.mark('fq:' + fr.ch, 'new');
      this.step(['huffman.count', { N: text.length, n: s.freq.length }], { line: 1 });
      this.clearMarks();

      // 2. arbre de Huffman : Huffman(A, F)
      this.code('huffman');
      s.phase = 'tree';
      s.row = s.freq.map((fr) => ({ id: this.newId(), ch: fr.ch, w: fr.f, ord: s.ord++, left: null, right: null }));
      this.sortRow();
      for (const n of s.row) this.mark(n.id, 'new');
      this.step('huffman.heap', { line: 7 });
      this.clearMarks();
      if (s.row.length === 1) this.step('huffman.single', { line: 14 });
      for (let i = 1; i < s.freq.length; i++) {
        const G = s.row[0];
        this.mark(G.id, 'hl');
        this.ring(G.id, 'hl', 'G');
        this.tags.set(String(G.id), 'G');
        this.step(['huffman.extractG', { t: this.desc(G), w: G.w }], { line: 9 });
        const D = s.row[1];
        this.mark(D.id, 'cmp');
        this.ring(D.id, 'cmp', 'D');
        this.tags.set(String(D.id), 'D');
        this.step(['huffman.extractD', { t: this.desc(D), w: D.w }], { line: 10 });
        const R = { id: this.newId(), ch: null, w: G.w + D.w, ord: s.ord++, left: G, right: D };
        s.row.splice(0, 2, R);
        this.ring(null, null, 'G');
        this.ring(null, null, 'D');
        this.mark(R.id, 'new');
        this.tags.set(String(R.id), 'R');
        this.step(['huffman.merge', { g: G.w, d: D.w, w: R.w }], { line: 11 });
        this.sortRow();
        this.ring(R.id, 'ok', 'R');
        this.step(['huffman.insert', { w: R.w, k: s.row.length }], { line: 12 });
        this.clearMarks();
      }
      const root = s.row[0];
      this.ring(root.id, 'ok');
      this.step(['huffman.root', { w: root.w }], { line: 14 });
      this.clearMarks();

      // 3. table des codes (feuilles de gauche à droite)
      this.code('compress');
      s.phase = 'codes';
      s.codes = [];
      const leaves = [];
      (function rec(n, code, path) {
        if (!n.left) leaves.push({ n, code, path });
        else {
          rec(n.left, code + '0', path.concat([n]));
          rec(n.right, code + '1', path.concat([n]));
        }
      })(root, '', []);
      for (const { n, code, path } of leaves) {
        this.clearMarks();
        const chain = path.concat([n]);
        for (let k = 0; k + 1 < chain.length; k++) this.markEdge(chain[k].id, chain[k + 1].id, 'hl');
        this.mark(n.id, 'ok');
        s.codes.push({ ch: n.ch, f: n.w, code, id: n.id });
        this.mark('ct:' + n.ch, 'new');
        this.step(['huffman.code', { c: show(n.ch), code: code || 'ε', f: n.w, l: code.length, p: n.w * code.length }], { line: 3 });
      }
      this.clearMarks();

      // 4. texte compressé
      const map = new Map(s.codes.map((c) => [c.ch, c.code]));
      s.bits = [...text].map((c) => map.get(c)).join('');
      s.phase = 'bits';
      const k = Math.max(1, Math.ceil(Math.log2(s.freq.length)));
      this.step(['huffman.total', { t: s.bits.length, k, n: text.length, fx: k * text.length }], { line: 4 });

      // 5. codage de l'arbre (mot de Dyck enrichi)
      s.dyck = this.dyck(root);
      s.phase = 'done';
      this.step('huffman.dyck', { line: 5 });
    }

    encode(text) {
      this.build(text);
    }

    dyck(n) {
      return n.left ? '0' + this.dyck(n.left) + this.dyck(n.right) : '1' + show(n.ch);
    }

    /** Taille du texte compressé (||T_C||). */
    cost() {
      return this.s.bits.length;
    }

    /** Invariants : arbre complet, poids = somme des enfants, feuilles = fréquences. */
    check() {
      const s = this.s;
      if (s.phase === 'empty') return;
      const freq = new Map(s.freq.map((f) => [f.ch, f.f]));
      const ids = new Set();
      let total = 0;
      const rec = (n) => {
        if (ids.has(n.id)) throw new Error('id dupliqué ' + n.id);
        ids.add(n.id);
        if (!n.left !== !n.right) throw new Error('nœud incomplet ' + n.id);
        if (!n.left) {
          if (freq.get(n.ch) !== n.w) throw new Error('poids de feuille faux ' + n.ch);
          return;
        }
        if (n.w !== n.left.w + n.right.w) throw new Error('poids non additif en ' + n.id);
        total += n.w;
        rec(n.left);
        rec(n.right);
      };
      for (const r of s.row) rec(r);
      if (s.phase === 'done' || s.phase === 'bits') {
        if (s.row.length !== 1) throw new Error('plusieurs arbres');
        if (s.bits.length !== total) throw new Error('||T_C|| ≠ somme des poids internes');
      }
    }

    /* --- dessin ------------------------------------------------------- */
    draw(S) {
      const s = this.s;
      if (s.phase === 'empty') {
        S.text('empty', 0, 30, ['c.emptyTree'], { cls: 'dim' });
        return;
      }
      const t = s.text.length > 64 ? s.text.slice(0, 63) + '…' : s.text;
      S.text('txt', 0, 0, ['huffman.text', { t }], { cls: 'mono big' });

      // table des fréquences (deux lignes de cases)
      const n = s.freq.length;
      const cw = 30;
      S.text('fqT', -(n * cw) / 2 - 14 - 40, 53, ['huffman.freq'], { cls: 'dim' });
      s.freq.forEach((fr, i) => {
        const x = (i - (n - 1) / 2) * cw;
        S.node('fq:' + fr.ch, { shape: 'cell', x, y: 40, w: cw - 2, h: 26, label: show(fr.ch), cls: 'key' });
        S.node('fv:' + fr.ch, { shape: 'cell', x, y: 66, w: cw - 2, h: 26, label: String(fr.f) });
        const m = this.marks.get('fq:' + fr.ch);
        if (m) S.get('fv:' + fr.ch).cls = m;
      });
      if (!s.row.length) return;

      // forêt (file de priorité) ou arbre final
      const top = 150;
      const L = DT.layout.forest(s.row, {
        children: kids,
        width: () => 46,
        levelGap: 66,
        gap: 12,
        phantom: 26,
        treeGap: 30,
        y: top,
      });
      const dx = -(L.minX + L.maxX) / 2;
      if (s.phase === 'tree' && s.row.length > 1) {
        S.text('qT', 0, top - 44, ['huffman.queue'], { cls: 'title' });
      }
      for (const [nd, p] of L.pos) {
        const leaf = !nd.left;
        const spec = {
          x: p.x + dx,
          y: p.y,
          r: 21,
          label: leaf ? `${show(nd.ch)},${nd.w}` : String(nd.w),
          cls: leaf ? 'key' : '',
        };
        const tag = this.tags.get(String(nd.id));
        if (tag) spec.top = tag;
        S.node(nd.id, spec);
      }
      for (const [nd] of L.pos) {
        if (!nd.left) continue;
        S.edge(nd.id, nd.left.id, { label: '0' });
        S.edge(nd.id, nd.right.id, { label: '1' });
      }
      const bottom = top + L.maxDepth * 66 + 30;

      // table des codes à droite de l'arbre
      if (s.codes) {
        const x0 = L.maxX + dx + 50;
        const maxLen = Math.max(2, ...s.codes.map((c) => c.code.length));
        const cols = [34, 34, Math.max(46, maxLen * 9 + 14), 50];
        const xs = [];
        let acc = x0;
        for (const w of cols) {
          xs.push(acc + w / 2);
          acc += w + 2;
        }
        const y0 = top;
        ['huffman.th.letter', 'f', 'huffman.th.code', 'f×|C|'].forEach((h, i) =>
          S.text('ch' + i, xs[i], y0, h.startsWith('huffman') ? [h] : h, { cls: 'dim' })
        );
        s.codes.forEach((c, r) => {
          const y = y0 + 26 + r * 26;
          const m = this.marks.get('ct:' + c.ch) || '';
          const vals = [show(c.ch), String(c.f), c.code || 'ε', String(c.f * c.code.length)];
          vals.forEach((v, i) =>
            S.node(`ct${i}:${c.ch}`, { shape: 'cell', x: xs[i], y, w: cols[i], h: 24, label: v, cls: (i === 0 ? 'key ' : '') + m, fontSize: 13 })
          );
        });
        if (s.phase === 'bits' || s.phase === 'done') {
          const total = s.codes.reduce((a, c) => a + c.f * c.code.length, 0);
          S.text('csum', (x0 + acc) / 2, y0 + 26 + s.codes.length * 26 + 10, ['huffman.sum', { t: total }], { cls: 'ok' });
        }
      }

      // texte compressé, découpé en lignes
      if (s.phase === 'bits' || s.phase === 'done') {
        // les textes sont centrés (la feuille de style impose text-anchor: middle)
        const x = 0;
        S.text('bitsT', x, bottom + 20, ['huffman.bits', { n: s.bits.length }], { cls: 'dim' });
        const per = 48;
        const lines = [];
        for (let i = 0; i < s.bits.length && lines.length < 4; i += per) lines.push(s.bits.slice(i, i + per));
        if (s.bits.length > per * 4) lines[3] = lines[3].slice(0, per - 1) + '…';
        lines.forEach((l, i) => S.text('bits' + i, x, bottom + 44 + i * 20, l, { cls: 'mono' }));
        if (s.phase === 'done') {
          const d = s.dyck.length > 70 ? s.dyck.slice(0, 69) + '…' : s.dyck;
          S.text('dyck', x, bottom + 56 + lines.length * 20, ['huffman.dyckLbl', { d }], { cls: 'mono accent' });
        }
      }
    }
  }

  Huffman.controls = [
    { type: 'input', name: 'text', size: 18, placeholder: 'ctl.text', value: 'saperlipopette' },
    { type: 'button', label: 'huffman.ctl.build', op: 'build', args: ['text'], primary: true, keep: true },
  ];

  DT.i18n.add({
    fr: { 'huffman.ctl.build': 'Construire', 'huffman.legend.g': 'G : premier arbre extrait', 'huffman.legend.d': 'D : second arbre extrait', 'huffman.legend.r': 'R : nouvel arbre' },
    en: { 'huffman.ctl.build': 'Build', 'huffman.legend.g': 'G: first extracted tree', 'huffman.legend.d': 'D: second extracted tree', 'huffman.legend.r': 'R: new tree' },
  });

  Huffman.legend = [
    ['var(--hl)', 'huffman.legend.g'],
    ['var(--cmp)', 'huffman.legend.d'],
    ['var(--new)', 'huffman.legend.r'],
  ];

  Huffman.code = {
    compress: {
      title: { fr: 'Algorithme de compression', en: 'Compression algorithm' },
      source: 'course',
      lines: [
        '1. Parcourir T pour compter le nombre d’occurrences de chaque caractère',
        '2. Construire l’arbre de Huffman à partir des fréquences des caractères',
        '3. Calculer la table des codes à partir de l’arbre de Huffman',
        '4. Compresser T en concaténant les codes de chaque caractère -> TC',
        '5. Coder l’arbre de Huffman de façon compacte',
      ],
    },
    huffman: {
      title: { fr: 'Construction de l’arbre de Huffman', en: 'Building the Huffman tree' },
      source: 'course',
      lines: [
        'def Huffman(A, F):',
        '    """ Alphabet * Fréquences -> ArbreHuffman',
        '        Hypothèse : A = [a_1, a_2, ... a_n]',
        '        Hypothèse : F = [f_1, f_2, ... f_n]',
        '        Renvoie l\'arbre de Huffman associé à F. """',
        '',
        '    FP = construireTas((a_1,f_1), ..., (a_n, f_n))',
        '    for i in 1..len(A)-1:',
        '        (G, FP1) = extraireMinTas(FP)',
        '        (D, FP2) = extraireMinTas(FP1)',
        '        R = ABvalué(G, D, pds(G)+pds(D))',
        '        FP = ajouterTas(FP2, R)',
        '',
        '    return extraireMinTas(FP)',
      ],
    },
  };

  DT.register('huffman', Huffman);
})();
