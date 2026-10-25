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

/* LZW (chapitre 1) : dictionnaire préfixiel stocké dans un trie et dans une table (parent, lettre). */
(function () {
  'use strict';

  const DT = window.DT;

  if (!DT.i18n.has('op.encode')) {
    DT.i18n.add({
      fr: { 'op.encode': 'Compression de {x}', 'op.decode': 'Décompression de {x}' },
      en: { 'op.encode': 'Compress {x}', 'op.decode': 'Decompress {x}' },
    });
  }

  DT.i18n.add({
    fr: {
      'lzw.op.encode': 'Compression LZW de « {x} »',
      'lzw.op.decode': 'Décompression LZW de {x}',
      'lzw.op.setAlpha': 'Alphabet : {x}',
      'lzw.alpha': 'Alphabet {a} : la table initiale contient les {n} lettres (indices 1 à {n}).',
      'lzw.init': 'Au départ, la table F contient les lettres de l’alphabet.',
      'lzw.walk': '« {f} » ∈ F : on descend dans le trie (nœud {i}).',
      'lzw.longest': '« {g} » ∉ F : f = « {f} » est le plus long préfixe du texte restant présent dans F.',
      'lzw.end': 'Fin du texte : f = « {f} » est le plus long préfixe restant.',
      'lzw.emit': 'On transmet l’indice de f : {i}.',
      'lzw.add': 'On ajoute fx = « {g} » à F : entrée {i} = ({p}, {x}).',
      'lzw.restart': 'On recommence à lire T à partir de x = « {x} ».',
      'lzw.doneEnc': 'C(T) = {c} : {k} indices pour {n} lettres ; {e} entrées ajoutées à la table.',
      'lzw.d.first': 'Premier numéro {i} : on renvoie la lettre « {w} ».',
      'lzw.d.in': 'Numéro {i} présent dans la table : on décode ses (parent, lettre) → w = « {w} ».',
      'lzw.d.addIn': 'On ajoute w_(i−1) suivi de la première lettre de w : « {g} » = ({p}, {x}), entrée {j}.',
      'lzw.d.overlap': 'Numéro {i} absent de la table : cas de chevauchement ! w = w_(i−1) suivi de SA première lettre = « {v} » + « {x} » = « {w} ».',
      'lzw.d.addOv': 'On ajoute « {w} » = ({p}, {x}) à l’indice {i}.',
      'lzw.doneDec': 'T = {t} ({n} lettres).',
      'lzw.th.index': 'index',
      'lzw.th.pl': '(parent, lettre)',
      'lzw.text': 'T',
      'lzw.codes': 'C(T)',
      'lzw.trie': 'Trie du dictionnaire',
      'lzw.trieDec': '(inutile au décompresseur)',
      'lzw.others': '+ {k} autres lettres de l’alphabet',
      'lzw.table': 'Table F',
      'lzw.ctl.alpha': 'Alphabet',
      'lzw.ctl.encode': 'Compresser',
      'lzw.ctl.decode': 'Décompresser',
      'lzw.err.alpha': '« {v} » n’appartient pas à l’alphabet {a}.',
      'lzw.err.code': 'Numéro {i} invalide à cette étape (la table a {n} entrées).',
      'lzw.err.int': '« {v} » : saisissez des numéros (entiers positifs) séparés par des espaces.',
      'lzw.legend.match': 'plus long préfixe en cours',
      'lzw.legend.x': 'lettre suivante x',
      'lzw.legend.new': 'nouvelle entrée',
    },
    en: {
      'lzw.op.encode': 'LZW compression of “{x}”',
      'lzw.op.decode': 'LZW decompression of {x}',
      'lzw.op.setAlpha': 'Alphabet: {x}',
      'lzw.alpha': 'Alphabet {a}: the initial table holds the {n} letters (indices 1 to {n}).',
      'lzw.init': 'Initially the table F holds the letters of the alphabet.',
      'lzw.walk': '“{f}” ∈ F: go down in the trie (node {i}).',
      'lzw.longest': '“{g}” ∉ F: f = “{f}” is the longest prefix of the remaining text that belongs to F.',
      'lzw.end': 'End of text: f = “{f}” is the longest remaining prefix.',
      'lzw.emit': 'Output the index of f: {i}.',
      'lzw.add': 'Add fx = “{g}” to F: entry {i} = ({p}, {x}).',
      'lzw.restart': 'Resume reading T from x = “{x}”.',
      'lzw.doneEnc': 'C(T) = {c}: {k} indices for {n} letters; {e} entries added to the table.',
      'lzw.d.first': 'First index {i}: output the letter “{w}”.',
      'lzw.d.in': 'Index {i} is in the table: decode its (parent, letter) chain → w = “{w}”.',
      'lzw.d.addIn': 'Add w_(i−1) followed by the first letter of w: “{g}” = ({p}, {x}), entry {j}.',
      'lzw.d.overlap': 'Index {i} is not in the table: overlap case! w = w_(i−1) followed by ITS first letter = “{v}” + “{x}” = “{w}”.',
      'lzw.d.addOv': 'Add “{w}” = ({p}, {x}) at index {i}.',
      'lzw.doneDec': 'T = {t} ({n} letters).',
      'lzw.th.index': 'index',
      'lzw.th.pl': '(parent, letter)',
      'lzw.text': 'T',
      'lzw.codes': 'C(T)',
      'lzw.trie': 'Dictionary trie',
      'lzw.trieDec': '(not needed by the decompressor)',
      'lzw.others': '+ {k} other letters of the alphabet',
      'lzw.table': 'Table F',
      'lzw.ctl.alpha': 'Alphabet',
      'lzw.ctl.encode': 'Compress',
      'lzw.ctl.decode': 'Decompress',
      'lzw.err.alpha': '“{v}” is not in the alphabet {a}.',
      'lzw.err.code': 'Invalid index {i} at this step (the table has {n} entries).',
      'lzw.err.int': '“{v}”: enter indices (positive integers) separated by spaces.',
      'lzw.legend.match': 'current longest prefix',
      'lzw.legend.x': 'next letter x',
      'lzw.legend.new': 'new entry',
    },
  });

  const ALPHAS = { abc: 'abc', abcd: 'abcd', benort: 'benort', 'a-z': 'abcdefghijklmnopqrstuvwxyz' };
  const letters = (a) => ALPHAS[a] || a;
  const alphaLabel = (a) => (a === 'a-z' ? '{a, …, z}' : `{${letters(a).split('').join(', ')}}`);

  class LZW extends DT.Algo {
    initState() {
      const s = { nextId: 1, cfg: { alpha: 'abc' }, mode: null, text: '', pos: 0, match: null, out: [], codes: [], k: 0, words: [] };
      s.table = this.initTable('abc');
      return s;
    }

    initTable(alpha) {
      return letters(alpha)
        .split('')
        .map((x, i) => ({ i: i + 1, f: x, p: 0, x }));
    }

    clear() {
      const cfg = this.s.cfg;
      this.s = this.initState();
      this.s.cfg = cfg;
      this.s.table = this.initTable(cfg.alpha);
      this.step('msg.cleared');
    }

    reset(mode) {
      const cfg = this.s.cfg;
      this.s = this.initState();
      this.s.cfg = cfg;
      this.s.table = this.initTable(cfg.alpha);
      this.s.mode = mode;
    }

    setAlpha(a) {
      if (!ALPHAS[a]) a = 'abc';
      this.s = this.initState();
      this.s.cfg = { alpha: a };
      this.s.table = this.initTable(a);
      this.step(['lzw.alpha', { a: alphaLabel(a), n: letters(a).length }]);
    }

    parse(name, raw, op) {
      if (op === 'decode') {
        const parts = String(raw).split(/[\s,;]+/).filter(Boolean);
        for (const p of parts) if (!/^\d+$/.test(p) || +p < 1) throw new DT.UserError('lzw.err.int', { v: p });
        if (parts.length > 60) throw new DT.UserError('err.toolong', { n: 60 });
        return parts.length ? [parts.join(' ')] : [];
      }
      const t = String(raw).replace(/[\s,;]+/g, '').toLowerCase();
      if (!t) return [];
      this.validate(t);
      return [t];
    }

    validate(t) {
      const A = letters(this.s.cfg.alpha);
      for (const c of t) if (!A.includes(c)) throw new DT.UserError('lzw.err.alpha', { v: c, a: alphaLabel(this.s.cfg.alpha) });
      if (t.length > 60) throw new DT.UserError('err.toolong', { n: 60 });
    }

    child(i, x) {
      return this.s.table.find((e) => e.p === i && e.x === x && (i !== 0 || e.i <= letters(this.s.cfg.alpha).length));
    }

    /* --- compression -------------------------------------------------- */
    encode(text) {
      text = String(text).toLowerCase();
      this.validate(text);
      this.reset('enc');
      const s = this.s;
      s.text = text;
      this.code('compress');
      this.step('lzw.init', { line: 3 });
      const N = text.length;
      const added0 = s.table.length;
      while (s.pos < N) {
        let node = null;
        let j = s.pos;
        // plus long préfixe : descente dans le trie
        for (;;) {
          if (j >= N) break;
          const c = node ? this.child(node.i, text[j]) : this.child(0, text[j]);
          if (!c) break;
          node = c;
          j++;
          s.match = [s.pos, j];
          this.clearMarks();
          this.ring('lz' + node.i, 'cmp');
          this.mark('lz' + node.i, 'cmp');
          this.mark('tb:' + node.i, 'cmp');
          this.step(['lzw.walk', { f: text.slice(s.pos, j), i: node.i }], { line: 5 });
        }
        const f = text.slice(s.pos, j);
        this.clearMarks();
        this.ring('lz' + node.i, 'ok');
        this.mark('lz' + node.i, 'ok');
        this.mark('tb:' + node.i, 'ok');
        if (j < N) {
          s.x = j;
          this.step(['lzw.longest', { g: f + text[j], f }], { line: 5 });
        } else {
          s.x = null;
          this.step(['lzw.end', { f }], { line: 5 });
        }
        s.out.push(node.i);
        this.mark('o:' + (s.out.length - 1), 'new');
        this.step(['lzw.emit', { i: node.i }], { line: 6 });
        if (j < N) {
          const e = { i: s.table.length + 1, f: f + text[j], p: node.i, x: text[j] };
          s.table.push(e);
          this.clearMarks();
          this.mark('lz' + e.i, 'new');
          this.mark('tb:' + e.i, 'new');
          this.markEdge('lz' + node.i, 'lz' + e.i, 'new');
          this.step(['lzw.add', { g: e.f, i: e.i, p: e.p, x: e.x }], { line: 9 });
          s.pos = j;
          s.match = null;
          this.clearMarks();
          this.step(['lzw.restart', { x: text[j] }], { line: 10 });
        } else {
          s.pos = j;
        }
      }
      s.match = null;
      s.x = null;
      this.clearMarks();
      this.step(['lzw.doneEnc', { c: s.out.join(' '), k: s.out.length, n: N, e: s.table.length - added0 }], { line: 11 });
    }

    /* --- décompression ------------------------------------------------ */
    decode(raw) {
      const codes = String(raw)
        .split(/[\s,;]+/)
        .filter(Boolean)
        .map((p) => {
          if (!/^\d+$/.test(p) || +p < 1) throw new DT.UserError('lzw.err.int', { v: p });
          return +p;
        });
      if (!codes.length) throw new DT.UserError('err.empty');
      this.reset('dec');
      const s = this.s;
      s.codes = codes;
      this.code('decompress');
      this.step('lzw.init', { line: 3 });
      const nA = letters(s.cfg.alpha).length;
      const i1 = codes[0];
      if (i1 > nA) throw new DT.UserError('lzw.err.code', { i: i1, n: s.table.length });
      s.k = 0;
      let prev = s.table[i1 - 1];
      s.words.push(prev.f);
      this.mark('c:0', 'hl');
      this.mark('w:0', 'new');
      this.mark('tb:' + i1, 'ok');
      this.mark('lz' + i1, 'ok');
      this.step(['lzw.d.first', { i: i1, w: prev.f }], { line: 4 });
      for (let k = 1; k < codes.length; k++) {
        const i = codes[k];
        s.k = k;
        this.clearMarks();
        this.mark('c:' + k, 'hl');
        let w;
        if (i <= s.table.length) {
          w = s.table[i - 1].f;
          // chaîne (parent, lettre) jusqu'à la racine
          for (let e = s.table[i - 1]; e; e = e.p ? s.table[e.p - 1] : null) {
            this.mark('tb:' + e.i, 'cmp');
            this.mark('lz' + e.i, 'cmp');
          }
          this.ring('lz' + i, 'cmp');
          s.words.push(w);
          this.mark('w:' + k, 'new');
          this.step(['lzw.d.in', { i, w }], { line: 7 });
          const e = { i: s.table.length + 1, f: prev.f + w[0], p: prev.i, x: w[0] };
          s.table.push(e);
          this.clearMarks();
          this.mark('c:' + k, 'hl');
          this.mark('tb:' + e.i, 'new');
          this.mark('lz' + e.i, 'new');
          this.step(['lzw.d.addIn', { g: e.f, p: e.p, x: e.x, j: e.i }], { line: 8 });
          prev = s.table[i - 1];
        } else if (i === s.table.length + 1) {
          w = prev.f + prev.f[0];
          this.mark('tb:' + prev.i, 'bad');
          this.mark('lz' + prev.i, 'bad');
          s.words.push(w);
          this.mark('w:' + k, 'bad');
          this.step(['lzw.d.overlap', { i, v: prev.f, x: prev.f[0], w }], { line: 10 });
          const e = { i, f: w, p: prev.i, x: prev.f[0] };
          s.table.push(e);
          this.mark('tb:' + e.i, 'new');
          this.mark('lz' + e.i, 'new');
          this.step(['lzw.d.addOv', { w, p: e.p, x: e.x, i }], { line: 11 });
          prev = e;
        } else {
          throw new DT.UserError('lzw.err.code', { i, n: s.table.length });
        }
      }
      s.k = codes.length;
      this.clearMarks();
      const t = s.words.join('');
      this.step(['lzw.doneDec', { t: t.length > 60 ? t.slice(0, 59) + '…' : t, n: t.length }], { line: 13 });
    }

    result() {
      return this.s.mode === 'enc' ? this.s.out.slice() : this.s.words.join('');
    }

    /** Invariants : table préfixielle cohérente (parent, lettre), indices consécutifs, trie sans doublon. */
    check() {
      const T = this.s.table;
      const seen = new Set();
      T.forEach((e, k) => {
        if (e.i !== k + 1) throw new Error('indices non consécutifs');
        if (seen.has(e.f)) throw new Error('entrée en double ' + e.f);
        seen.add(e.f);
        if (e.p) {
          if (e.p >= e.i) throw new Error('parent postérieur');
          if (T[e.p - 1].f + e.x !== e.f) throw new Error('table non préfixielle en ' + e.i);
        } else if (e.f.length !== 1) throw new Error('lettre initiale invalide');
      });
      const kids = new Set();
      for (const e of T) {
        const key = e.p + ':' + e.x;
        if (kids.has(key)) throw new Error('trie : deux enfants de même lettre');
        kids.add(key);
      }
    }

    /* --- dessin ------------------------------------------------------- */
    /** Rangées de cases avec retour à la ligne ; renvoie l'ordonnée sous la dernière rangée. */
    band(S, prefix, labels, widths, y, title, perCls) {
      const maxW = 720;
      const rows = [];
      let row = [];
      let sum = 0;
      labels.forEach((l, i) => {
        if (row.length && sum + widths[i] + 2 > maxW) {
          rows.push(row);
          row = [];
          sum = 0;
        }
        row.push(i);
        sum += widths[i] + 2;
      });
      if (row.length) rows.push(row);
      S.text(prefix + 'T', 0, y, title, { cls: 'title' });
      y += 28;
      rows.forEach((r) => {
        const total = r.reduce((a, i) => a + widths[i] + 2, -2);
        let x = -total / 2;
        for (const i of r) {
          const id = prefix + i;
          S.node(id, { shape: 'cell', x: x + widths[i] / 2, y, w: widths[i], h: 26, label: labels[i], cls: perCls(i) || this.marks.get(id) || '' });
          x += widths[i] + 2;
        }
        y += 30;
      });
      return y;
    }

    draw(S) {
      const s = this.s;
      let y = 0;
      if (s.mode === 'enc') {
        const t = s.text.split('');
        y = this.band(S, 't:', t, t.map(() => 24), y, ['lzw.text'], (i) => {
          if (s.match && i >= s.match[0] && i < s.match[1]) return 'cmp';
          if (s.x !== null && s.x !== undefined && i === s.x) return 'hl';
          if (i < s.pos) return 'muted';
          return '';
        });
        y += 14;
        if (s.out.length) {
          const o = s.out.map(String);
          y = this.band(S, 'o:', o, o.map((v) => Math.max(26, v.length * 9 + 12)), y, ['lzw.codes'], () => '') + 14;
        }
      } else if (s.mode === 'dec') {
        const c = s.codes.map(String);
        y = this.band(S, 'c:', c, c.map((v) => Math.max(26, v.length * 9 + 12)), y, ['lzw.codes'], (i) =>
          i < s.k ? 'muted' : ''
        );
        y += 14;
        if (s.words.length) {
          y = this.band(S, 'w:', s.words, s.words.map((v) => Math.max(26, v.length * 9 + 12)), y, ['lzw.text'], () => '') + 14;
        }
      }
      y += 30;

      // trie : racine + entrées (enfants triés selon l'ordre de l'alphabet)
      const A = letters(s.cfg.alpha);
      const big = A.length > 8;
      const used = new Set((s.text || '') + s.words.join(''));
      const byParent = new Map();
      for (const e of s.table) {
        if (!byParent.has(e.p)) byParent.set(e.p, []);
        byParent.get(e.p).push(e);
      }
      for (const l of byParent.values()) l.sort((a, b) => A.indexOf(a.x) - A.indexOf(b.x));
      let hidden = 0;
      const root = { i: 0 };
      const kids = (n) => {
        let l = byParent.get(n.i) || [];
        if (n.i === 0 && big) {
          const keep = l.filter((e) => used.has(e.x) || byParent.has(e.i));
          hidden = l.length - keep.length;
          l = keep;
        }
        return l;
      };
      const L = DT.layout.tree(root, { children: kids, width: () => 34, levelGap: 62, gap: 10, y: y + 46 });
      const dx = -L.maxX - 30;
      // titre centré sur le trie, sans déborder sur la table (largeur estimée)
      const tTitle = DT.i18n.t('lzw.trie');
      const tx = Math.min((L.minX + L.maxX) / 2 + dx, -20 - (tTitle.length * 9) / 2);
      S.text('trT', tx, y - 10, ['lzw.trie'], { cls: 'title' });
      if (s.mode === 'dec') S.text('trD', tx, y + 10, ['lzw.trieDec'], { cls: 'dim' });
      for (const [n, p] of L.pos) {
        if (n.i === 0) S.node('lzroot', { x: p.x + dx, y: p.y, r: 13, label: 'ε', cls: 'muted' });
        else S.node('lz' + n.i, { x: p.x + dx, y: p.y, r: 16, label: String(n.i), cls: n.p === 0 ? 'key' : '' });
      }
      for (const [n] of L.pos) {
        for (const c of kids(n)) S.edge(n.i === 0 ? 'lzroot' : 'lz' + n.i, 'lz' + c.i, { label: c.x });
      }
      if (hidden) {
        S.text('trH', (L.minX + L.maxX) / 2 + dx, y + 46 + (L.maxDepth + 1) * 62, ['lzw.others', { k: hidden }], { cls: 'dim' });
      }

      // table (index | f | (parent, lettre)), en colonnes de 14 lignes au plus
      let rows = s.table.slice();
      let summary = null;
      if (big) {
        rows = s.table.slice(A.length);
        summary = { id: 'sum', idx: `1–${A.length}`, f: 'a … z', pl: '' };
      }
      const all = (summary ? [summary] : []).concat(
        rows.map((e) => ({ id: e.i, idx: String(e.i), f: e.f, pl: e.p ? `(${e.p}, ${e.x})` : '' }))
      );
      const maxF = Math.max(2, ...all.map((r) => r.f.length));
      const cols = [summary ? 52 : 40, Math.max(40, maxF * 9 + 14), 70];
      const colW = cols[0] + cols[1] + cols[2] + 6;
      const per = 14;
      const x0 = 30;
      S.text('tbT', x0 + (Math.ceil(all.length / per) * (colW + 20) - 20) / 2, y - 10, ['lzw.table'], { cls: 'title' });
      all.forEach((r, k) => {
        const c = Math.floor(k / per);
        const ry = y + 46 + (k % per) * 26;
        let x = x0 + c * (colW + 20);
        if (k % per === 0) {
          ['lzw.th.index', null, 'lzw.th.pl'].forEach((h, j) => {
            const hx = x + cols.slice(0, j).reduce((a, b) => a + b + 3, 0) + cols[j] / 2;
            S.text(`th${c}:${j}`, hx, y + 18, h ? [h] : 'f', { cls: 'dim' });
          });
        }
        const m = this.marks.get('tb:' + r.id) || '';
        [r.idx, r.f, r.pl].forEach((v, j) => {
          S.node(`tb${j}:${r.id}`, { shape: 'cell', x: x + cols[j] / 2, y: ry, w: cols[j], h: 24, label: v, fontSize: 13, cls: (j === 0 ? 'key ' : '') + m });
          x += cols[j] + 3;
        });
      });
    }
  }

  LZW.controls = [
    {
      type: 'select',
      name: 'alpha',
      label: 'lzw.ctl.alpha',
      op: 'setAlpha',
      options: [
        { value: 'abc', label: '{a, b, c}' },
        { value: 'abcd', label: '{a, b, c, d}' },
        { value: 'benort', label: '{b, e, n, o, r, t}' },
        { value: 'a-z', label: '{a, …, z}' },
      ],
    },
    { type: 'sep' },
    { type: 'input', name: 'text', size: 18, placeholder: 'ctl.text' },
    { type: 'button', label: 'lzw.ctl.encode', op: 'encode', args: ['text'], primary: true },
    { type: 'button', label: 'lzw.ctl.decode', op: 'decode', args: ['text'] },
  ];

  LZW.legend = [
    ['var(--cmp)', 'lzw.legend.match'],
    ['var(--hl)', 'lzw.legend.x'],
    ['var(--new)', 'lzw.legend.new'],
  ];

  LZW.code = {
    compress: {
      title: { fr: 'Compression LZW (d’après les transparents)', en: 'LZW compression (after the slides)' },
      source: 'course',
      lines: [
        'def LZW_Compression(T):',
        '    """ Texte -> suite d\'indices """',
        '    F = table contenant les lettres de A (indices 1, 2, ...)',
        '    while T non vide:',
        '        f = plus long préfixe de T dans F   # descente dans le trie',
        '        transmettre index(f)',
        '        if f n\'est pas tout T:',
        '            x = caractère qui suit f dans T',
        '            ajouter fx dans F, entrée (index(f), x)',
        '        recommencer à lire T à partir de x',
        '    return indices transmis',
      ],
    },
    decompress: {
      title: { fr: 'Décompression LZW (d’après les transparents)', en: 'LZW decompression (after the slides)' },
      source: 'course',
      lines: [
        'def LZW_Decompression(C):',
        '    """ suite d\'indices -> Texte """',
        '    F = table contenant les lettres de A (indices 1, 2, ...)',
        '    w = F[premier numéro] ; écrire w',
        '    for chaque numéro i suivant de C:',
        '        if F[i] a un contenu:',
        '            w_i = décoder F[i]   # chaîne (parent, lettre)',
        '            ajouter (index(w), première lettre de w_i) à F',
        '        else:   # chevauchement : w = bu et w_i = bub',
        '            w_i = w suivi de SA première lettre',
        '            ajouter (index(w), première lettre de w) en F[i]',
        '        écrire w_i ; w = w_i',
        '    return texte écrit',
      ],
    },
  };

  DT.register('lzw', LZW);
})();
