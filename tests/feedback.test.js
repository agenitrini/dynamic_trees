/*
 * Structures arborescentes dynamiques
 * Copyright (C) 2024-2026 Antoine Genitrini (développeur principal)
 * Contributeurs (projet PSTL 2023-2024, Sorbonne Université) :
 *   Tracy Hong, Julien Fang, Jean-Marc Zhuang, Laura Rattanavan
 * Licence : GNU GPL version 3 ou ultérieure (voir le fichier LICENSE).
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/* Service des avis (apps-script/Code.gs) : votes, signalements, tableau de bord. */
'use strict';

const { test, eq, ok } = require('./harness');
const { loadService, TEST_PASSWORD } = require('./gasmock');

test('avis : compteurs à zéro pour une page inconnue', () => {
  const S = loadService();
  eq(S.get({ action: 'counts', page: 'viz:avl' }), { up: 0, down: 0 });
});

test('avis : pouce en l’air puis changement d’avis (un vote par visiteur)', () => {
  const S = loadService();
  eq(S.post({ action: 'vote', page: 'viz:avl', vote: 'up', prev: null }), { up: 1, down: 0 });
  eq(S.post({ action: 'vote', page: 'viz:avl', vote: 'up', prev: null }), { up: 2, down: 0 });
  // le second visiteur change d'avis : son pouce en l'air est retiré
  eq(S.post({ action: 'vote', page: 'viz:avl', vote: 'down', prev: 'up', message: 'RGD mal nommée', url: 'https://x/viz.html?algo=avl' }), { up: 1, down: 1 });
  eq(S.get({ action: 'counts', page: 'viz:avl' }), { up: 1, down: 1 });
  eq(S.get({ action: 'counts', page: 'viz:abr' }), { up: 0, down: 0 });
});

test('avis : un pouce en bas exige un message et l’enregistre avec le lien', () => {
  const S = loadService();
  eq(S.post({ action: 'vote', page: 'viz:a234', vote: 'down', prev: null, message: '' }), { error: 'message' });
  S.post({ action: 'vote', page: 'viz:a234', vote: 'down', prev: null, message: '=SOMME(A1)', url: 'javascript:alert(1)', lang: 'fr' });
  const rows = S.sheets.Avis.rows;
  eq(rows.length, 2);
  eq(rows[1][1], 'viz:a234');
  eq(rows[1][2], '', 'lien non http(s) refusé');
  eq(rows[1][4], "'=SOMME(A1)", 'formule neutralisée');
});

test('avis : entrées invalides refusées', () => {
  const S = loadService();
  eq(S.post({ action: 'vote', page: 'Bad Page!', vote: 'up' }), { error: 'page' });
  eq(S.post({ action: 'vote', page: 'index', vote: 'maybe' }), { error: 'vote' });
  eq(S.get({ action: 'counts', page: '../x' }), { error: 'page' });
  eq(JSON.parse(S.ctx.doPost({ postData: { contents: 'pas du json' } }).text), { error: 'json' });
});

test('tableau de bord : mot de passe vérifié côté serveur, blocage après 5 échecs', () => {
  const S = loadService();
  eq(S.post({ action: 'admin', password: 'faux', op: 'list' }), { error: 'password' });
  const list = S.post({ action: 'admin', password: TEST_PASSWORD, op: 'list' });
  ok(Array.isArray(list.pages) && Array.isArray(list.avis), 'liste');
  for (let i = 0; i < 5; i++) S.post({ action: 'admin', password: 'faux', op: 'list' });
  eq(S.post({ action: 'admin', password: TEST_PASSWORD, op: 'list' }), { error: 'locked' });
});

test('tableau de bord : liste des signalements et remise à zéro', () => {
  const S = loadService();
  S.post({ action: 'vote', page: 'viz:avl', vote: 'up', prev: null });
  S.post({ action: 'vote', page: 'viz:avl', vote: 'down', prev: null, message: 'premier souci', url: 'https://a/viz.html?algo=avl' });
  S.post({ action: 'vote', page: 'index', vote: 'down', prev: null, message: 'second souci', url: 'https://a/index.html' });
  let r = S.post({ action: 'admin', password: TEST_PASSWORD, op: 'list' });
  eq(r.pages, [{ page: 'viz:avl', up: 1, down: 1 }, { page: 'index', up: 0, down: 1 }]);
  eq(r.avis.map((a) => a.message), ['second souci', 'premier souci'], 'plus récents d’abord');
  eq(r.avis[0].url, 'https://a/index.html');
  r = S.post({ action: 'admin', password: TEST_PASSWORD, op: 'reset', page: 'viz:avl' });
  eq(r.pages, [{ page: 'viz:avl', up: 0, down: 0 }, { page: 'index', up: 0, down: 1 }]);
  r = S.post({ action: 'admin', password: TEST_PASSWORD, op: 'reset' });
  eq(r.pages.map((p) => p.up + p.down), [0, 0]);
  eq(r.avis.length, 2, 'les signalements sont conservés');
});
