/*
 * Structures arborescentes dynamiques
 * Copyright (C) 2024-2026 Antoine Genitrini (développeur principal)
 * Contributeurs (projet PSTL 2023-2024, Sorbonne Université) :
 *   Tracy Hong, Julien Fang, Jean-Marc Zhuang, Laura Rattanavan
 * Licence : GNU GPL version 3 ou ultérieure (voir le fichier LICENSE).
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/*
 * Simulation minimale des services Google Apps Script (feuille de calcul en
 * mémoire, propriétés, cache, verrou) pour tester apps-script/Code.gs sous Node.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function makeSheet(name) {
  const rows = [];
  const cell = (r, c) => (rows[r - 1] && rows[r - 1][c - 1] !== undefined ? rows[r - 1][c - 1] : '');
  const set = (r, c, v) => {
    while (rows.length < r) rows.push([]);
    rows[r - 1][c - 1] = v;
  };
  return {
    name,
    rows,
    appendRow(a) {
      rows.push(a.slice());
    },
    setFrozenRows() {},
    getLastRow() {
      return rows.length;
    },
    getRange(r, c, nr, nc) {
      nr = nr || 1;
      nc = nc || 1;
      return {
        getValue: () => cell(r, c),
        getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => cell(r + i, c + j))),
        setValues: (v) => v.forEach((row, i) => row.forEach((x, j) => set(r + i, c + j, x))),
      };
    },
  };
}

/** Charge Code.gs dans un contexte simulé ; renvoie { ctx, sheets, get(params), post(body) }. */
function loadService() {
  const sheets = {};
  const props = {};
  const cache = {};
  const ctx = {
    Date,
    JSON,
    Logger: { log() {} },
    Number,
    String,
    Math,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheetByName: (n) => sheets[n] || null,
        insertSheet: (n) => (sheets[n] = makeSheet(n)),
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: (k) => props[k] || null, setProperty: (k, v) => (props[k] = v) }),
    },
    CacheService: {
      getScriptCache: () => ({ get: (k) => cache[k] || null, put: (k, v) => (cache[k] = v), remove: (k) => delete cache[k] }),
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (s) => ({ text: s, setMimeType() { return this; } }),
    },
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'Code.gs'), 'utf8'), ctx);
  ctx.setup();
  // mot de passe de test (le vrai n'est défini que dans les propriétés du script)
  props.ADMIN_PASSWORD = TEST_PASSWORD;
  return {
    ctx,
    sheets,
    cache,
    get: (params) => JSON.parse(ctx.doGet({ parameter: params }).text),
    post: (body) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(body) } }).text),
  };
}

const TEST_PASSWORD = 'mot-de-passe-de-test';

module.exports = { loadService, TEST_PASSWORD };
