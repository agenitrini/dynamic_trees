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

/* Tests des modules de compression : Huffman statique, Huffman adaptatif, LZW. */
'use strict';

const { load, run, checkFrames, test, eq, ok, rng } = require('./harness');

/* ---------------------------------------------------------------- Huffman */
{
  const DT = load('huffman');
  const build = (text) => {
    const r = run(DT, 'huffman', [['build', [text]]]);
    r.algo.check();
    return r;
  };

  test('huffman : saperlipopette donne ||T_C|| = 42 (cours)', () => {
    const { algo, frames } = build('saperlipopette');
    checkFrames(DT, frames, 'saperlipopette');
    eq(algo.cost(), 42);
    const f = Object.fromEntries(algo.s.freq.map((x) => [x.ch, x.f]));
    eq([f.p, f.e, f.t, f.s], [3, 3, 2, 1]);
  });

  test('huffman : saperlipopette reproduit l’arbre du cours (Dyck 001p1e001t01s1a001r1l01i1o)', () => {
    eq(build('saperlipopette').algo.s.dyck, '001p1e001t01s1a001r1l01i1o');
  });

  test('huffman : le texte compressé se décode avec la table des codes', () => {
    for (const t of ['abracadabra', 'saperlipopette', 'aabbcccddd', 'le cours d algav']) {
      const { algo } = build(t);
      const inv = new Map(algo.s.codes.map((c) => [c.code, c.ch]));
      let out = '';
      let cur = '';
      for (const b of algo.s.bits) {
        cur += b;
        if (inv.has(cur)) {
          out += inv.get(cur);
          cur = '';
        }
      }
      eq(out, t, 'décodage de ' + t);
    }
  });

  test('huffman : coût optimal sur 200 tables de fréquences aléatoires', () => {
    const r = rng(7);
    const alpha = 'abcdefghijklmnopqrstuvwxyz';
    for (let k = 0; k < 200; k++) {
      const n = 2 + Math.floor(r() * 12);
      let text = '';
      const fs = [];
      for (let i = 0; i < n; i++) {
        const f = 1 + Math.floor(r() * 9);
        fs.push(f);
        text += alpha[i].repeat(f);
      }
      // calcul indépendant : somme des poids fusionnés (tri naïf à chaque étape)
      let q = fs.slice();
      let opt = 0;
      while (q.length > 1) {
        q.sort((a, b) => a - b);
        const w = q[0] + q[1];
        opt += w;
        q = [w].concat(q.slice(2));
      }
      const A = new DT.algos.huffman();
      A.record(() => A.build(text));
      A.check();
      eq(A.cost(), opt, 'fréquences ' + fs.join(','));
    }
  });
}

/* ------------------------------------------------------- Huffman adaptatif */
{
  const DT = load('ahuffman');

  // arbres intermédiaires des transparents (« Huffman dynamique par l'exemple »)
  const COURSE = [
    ['c', '1(#,c1)'],
    ['a', '2(1(#,a1),c1)'],
    ['r', '3(c1,2(1(#,r1),a1))'],
    ['a', '4(a2,2(1(#,r1),c1))'],
    ['m', '5(a2,3(c1,2(1(#,m1),r1)))'],
    ['b', '6(a2,4(2(1(#,b1),m1),2(c1,r1)))'],
    ['a', '7(a3,4(2(1(#,b1),m1),2(c1,r1)))'],
    ['r', '8(a3,5(2(1(#,b1),m1),3(c1,r2)))'],
    ['b', '9(4(b2,r2),5(2(1(#,c1),m1),a3))'],
    ['c', '10(4(b2,r2),6(3(1(#,m1),c2),a3))'],
    ['m', '11(4(b2,r2),7(a3,4(2(#,m2),c2)))'],
  ];

  test('ahuffman : carambarbcm reproduit chacun des 11 arbres du cours', () => {
    const A = new DT.algos.ahuffman();
    for (const [c, shape] of COURSE) {
      const { frames } = run(DT, 'ahuffman', [['encode', [c]]], A);
      checkFrames(DT, frames, 'carambarbcm/' + c);
      A.check();
      eq(A.shape(), shape, 'après ' + c);
    }
  });

  test('ahuffman : encode en une fois = lettre par lettre, et décompression', () => {
    const A = new DT.algos.ahuffman();
    run(DT, 'ahuffman', [['encode', ['carambarbcm']]], A);
    eq(A.shape(), COURSE[COURSE.length - 1][1]);
    const bits = A.output();
    eq(bits.length, 53);
    // préfixe : c (code fixe), puis code(#)=0 + a, code(#)=00 + r, puis a = 11
    ok(bits.startsWith('00010' + '0' + '00000' + '00' + '10001' + '11'), 'début du code');
    const B = new DT.algos.ahuffman();
    const { frames } = run(DT, 'ahuffman', [['decode', [bits]]], B);
    checkFrames(DT, frames, 'decode');
    eq(B.text(), 'carambarbcm');
    eq(B.shape(), A.shape());
  });

  test('ahuffman : cas où des nœuds de même poids séparent Q de parent(Q) (correction signalée)', () => {
    // le cas particulier du cours, appliqué tel quel, donnerait ...4(2(#,i2),g2)... (i2 avant k1, m1 en GDBH)
    const A = new DT.algos.ahuffman();
    run(DT, 'ahuffman', [['encode', ['okgqmioccqqcg']]], A);
    eq(A.shape(), '13(6(3(1(#,i1),g2),c3),7(q3,4(2(k1,m1),o2)))');
    const { frames } = run(DT, 'ahuffman', [['encode', ['i']]], A);
    checkFrames(DT, frames, 'fix');
    A.check();
    ok(frames.some((f) => f.msg && f.msg[0] === 'ahuffman.m.fix'), 'correction affichée');
    const B = new DT.algos.ahuffman();
    B.record(() => B.decode(A.output()));
    eq(B.text(), 'okgqmioccqqcgi');
  });

  test('ahuffman : 150 textes aléatoires, invariants et aller-retour', () => {
    const r = rng(11);
    for (let k = 0; k < 150; k++) {
      const n = 1 + Math.floor(r() * 40);
      const sigma = 1 + Math.floor(r() * 10);
      let t = '';
      for (let i = 0; i < n; i++) t += String.fromCharCode(97 + Math.floor(r() * sigma) * (k % 3 === 0 ? 2 : 1));
      const A = new DT.algos.ahuffman();
      // en plusieurs morceaux : l'état persiste entre deux appels
      const cut = Math.floor(r() * n);
      A.record(() => A.encode(t.slice(0, cut) || t[0]));
      if (cut) A.record(() => A.encode(t.slice(cut)));
      else if (n > 1) A.record(() => A.encode(t.slice(1)));
      A.check();
      const B = new DT.algos.ahuffman();
      B.record(() => B.decode(A.output()));
      B.check();
      eq(B.text(), t, 'texte ' + t);
    }
  });

  test('ahuffman : saisies invalides refusées', () => {
    const A = new DT.algos.ahuffman();
    let err = null;
    try {
      A.parse('text', 'abc1', 'encode');
    } catch (e) {
      err = e;
    }
    ok(err && err.key === 'ahuffman.err.letter', 'chiffre refusé');
    err = null;
    try {
      A.record(() => A.decode('11111'));
    } catch (e) {
      err = e;
    }
    ok(err && err.key === 'ahuffman.err.code', 'code fixe > z refusé');
  });
}

/* -------------------------------------------------------------------- LZW */
{
  const DT = load('lzw');

  test('lzw : compression de ababcbababaaaaaa (cours)', () => {
    const A = new DT.algos.lzw();
    const { frames } = run(DT, 'lzw', [['encode', ['ababcbababaaaaaa']]], A);
    checkFrames(DT, frames, 'lzw-enc');
    A.check();
    eq(A.result(), [1, 2, 4, 3, 5, 8, 1, 10, 11]);
    eq(A.s.table.slice(3).map((e) => [e.i, e.f]), [
      [4, 'ab'], [5, 'ba'], [6, 'abc'], [7, 'cb'], [8, 'bab'], [9, 'baba'], [10, 'aa'], [11, 'aaa'],
    ]);
    eq(A.s.table.slice(3).map((e) => `${e.p}${e.x}`), ['1b', '2a', '4c', '3b', '5b', '8a', '1a', '10a']);
  });

  test('lzw : décompression de 1 2 4 3 5 8 1 10 11 (cours, chevauchements)', () => {
    const A = new DT.algos.lzw();
    const { frames } = run(DT, 'lzw', [['decode', ['1 2 4 3 5 8 1 10 11']]], A);
    checkFrames(DT, frames, 'lzw-dec');
    A.check();
    eq(A.result(), 'ababcbababaaaaaa');
    eq(frames.filter((f) => f.msg && f.msg[0] === 'lzw.d.overlap').length, 3, 'trois chevauchements (8, 10, 11)');
  });

  test('lzw : 200 allers-retours aléatoires sur plusieurs alphabets', () => {
    const r = rng(5);
    const alphas = { abc: 'abc', abcd: 'abcd', benort: 'benort', 'a-z': 'abcdefghijklmnopqrstuvwxyz' };
    for (let k = 0; k < 200; k++) {
      const a = Object.keys(alphas)[k % 4];
      const L = alphas[a];
      const sigma = 1 + Math.floor(r() * Math.min(L.length, 4));
      const n = 1 + Math.floor(r() * 50);
      let t = '';
      for (let i = 0; i < n; i++) t += L[Math.floor(r() * sigma)];
      const A = new DT.algos.lzw();
      A.record(() => A.setAlpha(a));
      A.record(() => A.encode(t));
      A.check();
      const codes = A.result();
      const B = new DT.algos.lzw();
      B.record(() => B.setAlpha(a));
      B.record(() => B.decode(codes.join(' ')));
      B.check();
      eq(B.result(), t, `alphabet ${a}, texte ${t}`);
      eq(B.s.table.map((e) => e.f), A.s.table.map((e) => e.f), 'même table des deux côtés');
    }
  });

  test('lzw : lettre hors alphabet et numéro invalide refusés', () => {
    const A = new DT.algos.lzw();
    let err = null;
    try {
      A.parse('text', 'abd', 'encode');
    } catch (e) {
      err = e;
    }
    ok(err && err.key === 'lzw.err.alpha', 'd hors de {a, b, c}');
    err = null;
    try {
      A.record(() => A.decode('1 7'));
    } catch (e) {
      err = e;
    }
    ok(err && err.key === 'lzw.err.code', 'numéro 7 impossible');
  });
}
