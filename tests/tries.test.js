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

/* Tests des tries : arbre digital, trie binaire, Patricia, R-trie, trie hybride. */
'use strict';

const fs = require('fs');
const path = require('path');
const { load, run, checkFrames, test, eq, ok, rng, ROOT } = require('./harness');

const IDS = ['dst', 'triebin', 'patricia', 'rtrie', 'trieh'];
const exists = (id) => fs.existsSync(path.join(ROOT, 'js/algos', id + '.js'));

function searchRes(A, x) {
  let res;
  A.record(() => (res = A.search(x)));
  return res;
}

/* --- arbre digital : figure du cours ------------------------------------ */
if (exists('dst')) {
  const DT = load('dst');
  test('dst : figure du cours (A S E R C H I N G X M P L)', () => {
    const A = new DT.algos.dst();
    run(DT, 'dst', 'ASERCHINGXMPL'.split('').map((c) => ['insert', [c]]), A);
    A.check();
    const sh = (n) => (n ? `${n.key}(${sh(n.left)},${sh(n.right)})` : '.');
    // A.0=E, A.1=S ; E.0=C, E.1=H ; C.1=G ; H.0=I, H.1=N ; N.0=M ; M.0=L ; S.0=R, S.1=X ; R.0=P
    eq(sh(A.s.root), 'A(E(C(.,G(.,.)),H(I(.,.),N(M(L(.,.),.),.))),S(R(P(.,.),.),X(.,.)))');
  });
  test('dst : la suppression d’une clé interne la remplace par une feuille de son sous-arbre', () => {
    const A = new DT.algos.dst();
    run(DT, 'dst', 'ASERCHINGXMPL'.split('').map((c) => ['insert', [c]]).concat([['delete', ['E']], ['delete', ['A']]]), A);
    A.check();
    eq(A.keys(), 'SRCHINGXMPL'.split('').sort());
  });
}

/* --- trie binaire : indépendance vis-à-vis de l'ordre d'insertion ------- */
if (exists('triebin')) {
  const DT = load('triebin');
  test('triebin : la forme ne dépend pas de l’ordre d’insertion', () => {
    const r = rng(7);
    const keys = 'ASERCHINGXMPL'.split('');
    let ref = null;
    for (let t = 0; t < 30; t++) {
      const perm = keys.slice();
      for (let i = perm.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [perm[i], perm[j]] = [perm[j], perm[i]];
      }
      const A = new DT.algos.triebin();
      run(DT, 'triebin', perm.map((c) => ['insert', [c]]), A);
      A.check();
      if (ref === null) ref = A.shape();
      eq(A.shape(), ref, 'ordre ' + perm.join(''));
    }
    // figure du cours
    eq(ref, '((((A C) (E G)) (((H I) .) ((L M) N))) (((P (R S)) .) X))');
  });
  test('triebin : après suppressions, même forme qu’une construction directe', () => {
    const A = new DT.algos.triebin();
    run(DT, 'triebin', 'ASERCHINGXMPL'.split('').map((c) => ['insert', [c]]).concat(['H', 'R', 'M', 'X'].map((c) => ['delete', [c]])), A);
    A.check();
    const B = new DT.algos.triebin();
    run(DT, 'triebin', 'ASECINGPL'.split('').map((c) => ['insert', [c]]), B);
    eq(A.shape(), B.shape());
  });
}

/* --- opérations aléatoires comparées à un ensemble de référence --------- */
const WORDS = 'a ab abc abd b ba bal balle ballon banc bas base chat chaton chien cle code coder de des dans le les lou loup loups lourd luxe mot mots ver vers vert'.split(' ');
for (const id of IDS) {
  if (!exists(id)) continue;
  const DT = load(id);
  const letters = id === 'dst' || id === 'triebin';
  test(`${id} : 400 opérations aléatoires conformes à un ensemble de référence`, () => {
    const r = rng(123 + id.length);
    const A = new DT.algos[id]();
    const ref = new Set();
    for (let i = 0; i < 400; i++) {
      const x = letters ? String.fromCharCode(65 + Math.floor(r() * 26)) : WORDS[Math.floor(r() * WORDS.length)];
      const u = r();
      const op = u < 0.5 ? 'insert' : u < 0.8 ? 'delete' : 'search';
      let res;
      const frames = A.record(() => {
        A.step(['op.' + op, { x }], { op: true });
        res = A[op](x);
        A.clearMarks();
        A.step(null);
      });
      if (i % 20 === 0) checkFrames(DT, frames, `${id}#${i}`);
      if (op === 'insert') ref.add(x);
      if (op === 'delete') ref.delete(x);
      if (op === 'search') eq(res, ref.has(x) && true, `${id} search ${x}`);
      A.check();
      eq(A.keys(), [...ref].sort(), `${id} après ${op} ${x}`);
    }
  });
  test(`${id} : tout vider par suppressions`, () => {
    const A = new DT.algos[id]();
    const xs = letters ? 'QWERTYUIOPASDF'.split('') : WORDS.slice(0, 20);
    run(DT, id, xs.map((x) => ['insert', [x]]), A);
    run(DT, id, xs.slice().reverse().map((x) => ['delete', [x]]), A);
    A.check();
    eq(A.keys(), []);
  });
  test(`${id} : random() produit une structure valide`, () => {
    const A = new DT.algos[id]();
    const frames = A.record(() => A.random());
    checkFrames(DT, frames, id + '/random');
    A.check();
    ok(A.keys().length >= 5, 'trop peu de clés');
  });
}

/* --- mots préfixes des autres (liste du cours) ------------------------- */
const COURSE = 'lou leve les loups dans le lourd tapis de luxe vert olive'.split(' ');
for (const id of ['rtrie', 'trieh', 'patricia']) {
  if (!exists(id)) continue;
  const DT = load(id);
  test(`${id} : recherches sur la liste du cours (préfixes compris)`, () => {
    const A = new DT.algos[id]();
    run(DT, id, COURSE.map((w) => ['insert', [w]]), A);
    A.check();
    for (const w of COURSE) ok(searchRes(A, w) === true, `${w} devrait être présent`);
    for (const w of ['l', 'lo', 'loup', 'lour', 'lourde', 'leves', 'd', 'da', 'oliv', 'olives', 'x', 'tapi', 'v', 've'])
      ok(searchRes(A, w) === false, `${w} devrait être absent`);
    eq(A.keys(), COURSE.slice().sort());
    // suppression d'un préfixe : les mots plus longs restent
    run(DT, id, [['delete', ['lou']], ['delete', ['le']]], A);
    A.check();
    ok(searchRes(A, 'lou') === false && searchRes(A, 'loups') === true && searchRes(A, 'lourd') === true, 'lou / loups');
    ok(searchRes(A, 'le') === false && searchRes(A, 'les') === true && searchRes(A, 'leve') === true, 'le / les');
  });
}

if (exists('rtrie')) {
  const DT = load('rtrie');
  test('rtrie : valeurs = numéros d’insertion du cours', () => {
    const A = new DT.algos.rtrie();
    run(DT, 'rtrie', COURSE.map((w) => ['insert', [w]]), A);
    const val = (w) => [...w].reduce((n, c) => n.kids[c], A.s.root).val;
    COURSE.forEach((w, i) => eq(val(w), i, w));
  });
}

if (exists('trieh')) {
  const DT = load('trieh');
  test('trieh : la suppression de lou fusionne les sous-arbres Inf et Sup', () => {
    const A = new DT.algos.trieh();
    run(DT, 'trieh', 'lou la lu le'.split(' ').map((w) => ['insert', [w]]), A);
    const { frames } = run(DT, 'trieh', [['delete', ['lou']]], A);
    A.check();
    ok(frames.some((f) => f.msg && f.msg[0] === 'th.useless2'), 'Fusion attendue');
    eq(A.keys(), ['la', 'le', 'lu']);
  });
}
