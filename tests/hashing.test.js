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

/* Tests du chapitre 4 : table de hachage, filtre de Bloom, hachage dynamique et extensible. */
'use strict';

const { load, run, checkFrames, test, eq, ok, rng } = require('./harness');

const COURSE = [10, 22, 31, 4, 15, 28, 17, 88, 59];
const ins = (xs) => xs.map((x) => ['insert', [x]]);

/* ---------------------------------------------------------------- hash */
{
  const DT = load('hash');
  const make = (method, size) => {
    const A = new DT.algos.hash();
    A.record(() => {
      A.setMethod(method);
      A.setSize(String(size));
    });
    return A;
  };
  const table = (A) => A.s.T.map((c) => (c && !c.tomb ? c.key : c && c.tomb ? '†' : null));
  const lastMsg = (frames) => frames.filter((f) => f.msg && !f.op).slice(-1)[0].msg;

  for (const [method, expected, probes] of [
    ['linear', [22, 88, null, null, 4, 15, 28, 17, 59, 31, 10], 5],
    ['double', [22, null, 59, 17, 4, 15, 28, 88, null, 31, 10], 3],
  ]) {
    test(`hash ${method} : exemple du cours (m = 11), 59 en ${probes} essais`, () => {
      const A = make(method, 11);
      const r1 = run(DT, 'hash', ins(COURSE.slice(0, -1)), A);
      checkFrames(DT, r1.frames, method);
      const { frames } = run(DT, 'hash', ins([59]), A);
      checkFrames(DT, frames, method);
      eq(table(A), expected, 'table');
      const m = lastMsg(frames);
      eq(m[0], 'hash.stored');
      eq(m[1].n, probes, 'nombre d’essais pour 59');
      eq(frames.filter((f) => f.msg && /^hash\.p\./.test(f.msg[0])).length, probes, 'étapes d’essai');
      A.check();
    });
  }

  test('hash : chaînage séparé, listes du cours', () => {
    const A = make('chain', 11);
    run(DT, 'hash', ins(COURSE), A);
    eq(A.s.T.map((L) => L.map((e) => e.key)), [[22, 88], [], [], [], [4, 15, 59], [], [28, 17], [], [], [31], [10]]);
    A.check();
  });

  test('hash : pierres tombales (sautées en recherche, réutilisées en insertion)', () => {
    const A = make('linear', 11);
    run(DT, 'hash', ins([4, 15, 26, 37]).concat([['delete', [15]]]), A);
    eq(table(A).slice(4, 8), [4, '†', 26, 37]);
    let res;
    A.record(() => (res = A.search(37)));
    ok(res === true, 'recherche de 37 à travers la pierre tombale');
    A.record(() => (res = A.search(15)));
    ok(res === false, '15 supprimé');
    run(DT, 'hash', ins([48]), A);
    eq(table(A).slice(4, 9), [4, 48, 26, 37, null], '48 réutilise la pierre tombale');
    run(DT, 'hash', ins([26]), A);
    eq(A.keys(), [4, 26, 37, 48], 'pas de doublon');
    A.check();
  });

  test('hash : table pleine, sondage quadratique incomplet', () => {
    const A = make('linear', 7);
    run(DT, 'hash', ins([1, 2, 3, 4, 5, 6, 7]), A);
    const { frames } = run(DT, 'hash', ins([8]), A);
    eq(lastMsg(frames)[0], 'hash.full');
    const Q = make('quadratic', 7);
    run(DT, 'hash', ins([0, 1, 4, 2]), Q); // cases 0, 1, 2, 4 = h + {0, 1, 4, 9 mod 7 = 2}
    const r = run(DT, 'hash', ins([7]), Q);
    eq(lastMsg(r.frames)[0], 'hash.quadFull');
    Q.check();
  });

  for (const method of ['linear', 'quadratic', 'double', 'chain']) {
    test(`hash ${method} : 400 opérations aléatoires conformes à un ensemble`, () => {
      const r = rng(7 + method.length);
      const A = make(method, 13);
      const ref = new Set();
      for (let i = 0; i < 400; i++) {
        const x = Math.floor(r() * 60);
        const u = r();
        const op = u < 0.5 ? 'insert' : u < 0.8 ? 'delete' : 'search';
        let res;
        const free = method === 'chain' ? 1 : A.s.T.filter((c) => !c || c.tomb).length;
        const frames = A.record(() => (res = A[op](x)));
        if (i % 40 === 0) checkFrames(DT, frames, `${method}#${i}`);
        if (op === 'insert' && !ref.has(x)) {
          const done = A.keys().includes(x);
          if (method === 'quadratic' && !done) ok(/full|Full/.test(lastMsg(frames)[0]), 'échec non signalé');
          else eq(done, free > 0, `ajout de ${x}`);
          if (done) ref.add(x);
        }
        if (op === 'delete') ref.delete(x);
        if (op === 'search') eq(res, ref.has(x), `search ${x}`);
        A.check();
        eq(A.keys(), [...ref].sort((a, b) => a - b), `${method} après ${op} ${x}`);
      }
    });
  }
}

/* --------------------------------------------------------------- bloom */
{
  const DT = load('bloom');
  const make = (m, k) => {
    const A = new DT.algos.bloom();
    A.record(() => {
      A.setM(String(m));
      A.setK(String(k));
    });
    return A;
  };

  test('bloom : jamais de faux négatif (ensembles aléatoires)', () => {
    const r = rng(99);
    const word = () => {
      let w = '';
      const L = 2 + Math.floor(r() * 6);
      for (let i = 0; i < L; i++) w += String.fromCharCode(97 + Math.floor(r() * 26));
      return w;
    };
    for (const [m, k] of [[8, 1], [12, 2], [16, 3], [24, 4], [32, 2]]) {
      const A = make(m, k);
      const ws = [];
      for (let i = 0; i < 12; i++) ws.push(word());
      const { frames } = run(DT, 'bloom', ws.map((w) => ['insert', [w]]), A);
      checkFrames(DT, frames, `bloom ${m}/${k}`);
      A.check();
      for (const w of ws) {
        let res;
        A.record(() => (res = A.search(w)));
        ok(res === true, `faux négatif ${w}`);
      }
      eq(A.keys(), [...new Set(ws)].sort());
    }
  });

  test('bloom : l’exemple « Un faux positif » produit un faux positif', () => {
    const ex = DT.catalog.find('bloom').examples.find((e) => e.id === 'fp');
    const A = make(ex.settings.m, ex.settings.k);
    const { frames } = run(DT, 'bloom', ex.ops, A);
    ok(frames.some((f) => f.msg && f.msg[0] === 'bloom.fp'), 'aucun faux positif');
    ok(frames.some((f) => f.msg && f.msg[0] === 'bloom.zero'), 'aucune réponse NON');
    let res;
    A.record(() => (res = A.search('loup')));
    ok(res === true && !A.s.words.includes('loup'), 'loup est un faux positif');
  });
}

/* ----------------------------------------------- hachage dynamique / extensible */
{
  const DTd = load('dynhash');
  const DTe = load('exthash');
  const make = (DT, id, cap) => {
    const A = new DT.algos[id]();
    A.record(() => A.setCap(String(cap)));
    return A;
  };
  const letters = (s) => s.split('').map((c) => ['insert', [c]]);

  test('dynhash : exemple du cours (C = 4)', () => {
    const A = make(DTd, 'dynhash', 4);
    const { frames } = run(DTd, 'dynhash', letters('EUTFRNCLSGBV'), A);
    checkFrames(DTd, frames, 'dynhash');
    A.check();
    eq(A.shape(), [[['BC', 'EFG'], 'LN'], [['RS', 'TUV'], '']]);
  });

  test('exthash : exemple du cours (C = 4, d = 3)', () => {
    const A = make(DTe, 'exthash', 4);
    const { frames } = run(DTe, 'exthash', letters('EUTFRNCLSGBV'), A);
    checkFrames(DTe, frames, 'exthash');
    A.check();
    eq(A.s.d, 3);
    eq(A.shape(), [
      ['000', 'BC', 3],
      ['001', 'EFG', 3],
      ['010', 'LN', 2],
      ['011', 'LN', 2],
      ['100', 'RS', 3],
      ['101', 'TUV', 3],
      ['110', '', 2],
      ['111', '', 2],
    ]);
    eq(new Set(A.s.dir).size, 6, '6 pages');
  });

  for (const [DT, id] of [[DTd, 'dynhash'], [DTe, 'exthash']]) {
    for (const cap of [2, 3, 4]) {
      test(`${id} C = ${cap} : 300 opérations aléatoires conformes à un ensemble`, () => {
        const r = rng(cap * 31 + id.length);
        const A = make(DT, id, cap);
        const ref = new Set();
        for (let i = 0; i < 300; i++) {
          const x = String.fromCharCode(65 + Math.floor(r() * 26));
          const u = r();
          const op = u < 0.55 ? 'insert' : u < 0.8 ? 'delete' : 'search';
          let res;
          const frames = A.record(() => (res = A[op](x)));
          if (i % 30 === 0) checkFrames(DT, frames, `${id}#${i}`);
          if (op === 'insert') ref.add(x);
          if (op === 'delete') ref.delete(x);
          if (op === 'search') eq(res, ref.has(x), `search ${x}`);
          A.check();
          eq(A.keys(), [...ref].sort(), `${id} après ${op} ${x}`);
        }
      });
    }

    test(`${id} : page de débordement quand plus de C clés ont le même haché`, () => {
      const A = make(DT, id, 2);
      A.hcode = (x) => (x < 'M' ? '00000' : '11111');
      const { frames } = run(DT, id, letters('ABCDN'), A);
      checkFrames(DT, frames, id + ' débordement');
      ok(frames.some((f) => f.msg && f.msg[0] === id + '.overflowPage'), 'pas de page de débordement');
      A.check();
      eq(A.keys(), ['A', 'B', 'C', 'D', 'N']);
      let res;
      A.record(() => (res = A.search('D')));
      ok(res, 'D dans la page de débordement');
      run(DT, id, [['delete', ['A']], ['delete', ['B']]], A);
      A.check();
    });
  }
}
