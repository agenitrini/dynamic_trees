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

/*
 * Banc de test : charge les modules du site dans un contexte Node (sans
 * navigateur) pour vérifier les algorithmes et leurs invariants.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function makeContext() {
  const noop = () => {};
  const fakeEl = () => ({ dataset: {}, style: {}, classList: { add: noop, remove: noop, toggle: noop }, setAttribute: noop });
  const document = {
    documentElement: fakeEl(),
    querySelectorAll: () => [],
    createElement: fakeEl,
    body: { prepend: noop },
  };
  const ctx = {
    console,
    structuredClone,
    document,
    navigator: { language: 'fr-FR' },
    location: { search: '' },
    localStorage: { getItem: () => null, setItem: noop },
    matchMedia: () => ({ matches: false }),
    URLSearchParams,
    Math,
    performance: { now: () => Date.now() },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  return ctx;
}

function loadFile(ctx, rel) {
  const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  vm.runInContext(code, ctx, { filename: rel });
}

/** Charge le cœur et le module id ; renvoie le contexte (ctx.DT). */
function load(id) {
  const ctx = makeContext();
  for (const f of ['js/i18n.js', 'js/catalog.js', 'js/polya_catalog.js', 'js/core/scene.js', 'js/core/app.js', 'js/algos/common.js']) loadFile(ctx, f);
  const entry = ctx.DT.catalog.find(id);
  for (const dep of (entry && entry.deps) || []) loadFile(ctx, `js/algos/${dep}.js`);
  loadFile(ctx, `js/algos/${id}.js`);
  return ctx.DT;
}

/**
 * Exécute des opérations comme le fait l'application (avec enregistrement
 * des étapes) ; renvoie l'instance et la liste des étapes.
 */
function run(DT, id, ops, algo) {
  const A = algo || new DT.algos[id]();
  const frames = A.record(() => {
    for (const [op, args] of ops) {
      const key = DT.i18n.has(`${id}.op.${op}`) ? `${id}.op.${op}` : `op.${op}`;
      A.step([key, { x: args.map((a) => (Array.isArray(a) ? a.join(' ') : a)).join(' ') }], { op: true });
      A[op](...args);
      A.clearMarks();
      A.step(null);
    }
  });
  return { algo: A, frames };
}

/** Vérifie qu'une étape est bien formée (messages traduits, scène cohérente). */
function checkFrames(DT, frames, label) {
  const ids = new Set();
  for (const f of frames) {
    const items = f.scene.items;
    ids.clear();
    for (const it of items) {
      if (ids.has(it.id)) throw new Error(`${label}: identifiant dupliqué ${it.id}`);
      ids.add(it.id);
      if (it.type === 'node' || it.type === 'text') {
        if (!Number.isFinite(it.x) || !Number.isFinite(it.y)) throw new Error(`${label}: position invalide pour ${it.id}`);
      }
    }
    for (const it of items) {
      if (it.type === 'edge' && (!ids.has(it.from) || !ids.has(it.to))) {
        throw new Error(`${label}: arête ${it.id} vers un nœud absent`);
      }
    }
    if (f.msg) {
      for (const lang of ['fr', 'en']) {
        DT.i18n.set(lang);
        const s = DT.i18n.resolve(f.msg);
        if (s === f.msg[0] || /\{\w+\}/.test(s)) throw new Error(`${label}: message non traduit (${lang}) ${JSON.stringify(f.msg)} -> ${s}`);
      }
      DT.i18n.set('fr');
    }
    // textes des nœuds et textes libres traduits
    for (const it of items) {
      const vals = [it.label, it.text, it.sub, it.top].filter((v) => Array.isArray(v));
      for (const v of vals) {
        const s = DT.i18n.resolve(v);
        if (s === v[0] || /\{\w+\}/.test(s)) throw new Error(`${label}: libellé non traduit ${JSON.stringify(v)}`);
      }
    }
  }
}

/* --- mini cadre de test ------------------------------------------------ */
const results = { pass: 0, fail: 0 };
function test(name, fn) {
  try {
    fn();
    results.pass++;
    console.log('  ✓ ' + name);
  } catch (e) {
    results.fail++;
    console.log('  ✗ ' + name + '\n      ' + (e.stack || e).toString().split('\n').slice(0, 3).join('\n      '));
  }
}
function eq(a, b, msg) {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) throw new Error((msg || 'égalité') + `\n        obtenu  : ${sa}\n        attendu : ${sb}`);
}
function ok(c, msg) {
  if (!c) throw new Error(msg || 'assertion');
}

/** Générateur pseudo-aléatoire reproductible. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

module.exports = { load, run, checkFrames, test, eq, ok, rng, results, ROOT };
