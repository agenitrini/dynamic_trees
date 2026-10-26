/*
 * Structures arborescentes dynamiques — service des avis (Google Apps Script)
 * Copyright (C) 2024-2026 Antoine Genitrini (développeur principal)
 * Contributeurs (projet PSTL 2023-2024, Sorbonne Université) :
 *   Tracy Hong, Julien Fang, Jean-Marc Zhuang, Laura Rattanavan
 * Licence : GNU GPL version 3 ou ultérieure (voir le fichier LICENSE).
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Ce script, lié à une Google Sheet, enregistre les votes « pouce en l'air /
 * pouce en bas » de chaque page du site et les avis négatifs. Le mot de passe
 * du tableau de bord est vérifié ici, côté serveur (propriété ADMIN_PASSWORD) :
 * il n'apparaît jamais dans le code public du site.
 *
 * Déploiement : voir apps-script/LISEZMOI.md.
 */

var SHEET_VOTES = 'Votes';
var SHEET_AVIS = 'Avis';
var PAGE_RE = /^[a-z0-9:_-]{1,60}$/;
var MAX_MESSAGE = 2000;

/**
 * À exécuter une fois depuis l'éditeur : crée les feuilles. Le mot de passe du
 * tableau de bord n'est jamais écrit dans ce fichier (public) : le définir dans
 * Paramètres du projet → Propriétés du script → ADMIN_PASSWORD.
 */
function setup() {
  sheet_(SHEET_VOTES, ['page', 'pouces_haut', 'pouces_bas']);
  sheet_(SHEET_AVIS, ['date', 'page', 'lien', 'langue', 'message']);
  if (!PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD')) {
    Logger.log('À faire : définir la propriété du script ADMIN_PASSWORD (mot de passe du tableau de bord).');
  }
}

/* ------------------------------------------------------------------------ */
/* Points d'entrée                                                           */
/* ------------------------------------------------------------------------ */

/** GET ?action=counts&page=viz:avl → { up, down } */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'counts') {
    if (!PAGE_RE.test(p.page || '')) return json_({ error: 'page' });
    return json_(counts_(p.page));
  }
  return json_({ ok: true, service: 'avis AlgAv' });
}

/**
 * POST (corps JSON envoyé en text/plain) :
 *   { action: 'vote', page, vote: 'up'|'down', prev: 'up'|'down'|null, message?, url?, lang? }
 *   { action: 'admin', password, op: 'list' }
 *   { action: 'admin', password, op: 'reset', page? }   (sans page : toutes les pages)
 */
function doPost(e) {
  var d;
  try {
    d = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ error: 'json' });
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (d.action === 'vote') return json_(vote_(d));
    if (d.action === 'admin') return json_(admin_(d));
    return json_({ error: 'action' });
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------------------------------------------------ */
/* Votes                                                                     */
/* ------------------------------------------------------------------------ */

function vote_(d) {
  if (!PAGE_RE.test(d.page || '')) return { error: 'page' };
  if (d.vote !== 'up' && d.vote !== 'down') return { error: 'vote' };
  var message = '';
  if (d.vote === 'down') {
    message = String(d.message || '').trim().slice(0, MAX_MESSAGE);
    if (message.length < 5) return { error: 'message' };
  }
  var sh = sheet_(SHEET_VOTES, ['page', 'pouces_haut', 'pouces_bas']);
  var row = findRow_(sh, d.page);
  var up = row ? Number(sh.getRange(row, 2).getValue()) || 0 : 0;
  var down = row ? Number(sh.getRange(row, 3).getValue()) || 0 : 0;
  // un visiteur qui change d'avis retire son vote précédent
  if (d.prev === 'up' && d.vote !== 'up') up = Math.max(0, up - 1);
  if (d.prev === 'down' && d.vote !== 'down') down = Math.max(0, down - 1);
  if (d.vote === 'up' && d.prev !== 'up') up++;
  if (d.vote === 'down' && d.prev !== 'down') down++;
  if (row) sh.getRange(row, 2, 1, 2).setValues([[up, down]]);
  else sh.appendRow([d.page, up, down]);

  if (d.vote === 'down') {
    var avis = sheet_(SHEET_AVIS, ['date', 'page', 'lien', 'langue', 'message']);
    avis.appendRow([new Date(), d.page, safeUrl_(d.url), d.lang === 'en' ? 'en' : 'fr', noFormula_(message)]);
  }
  return { up: up, down: down };
}

function counts_(page) {
  var sh = sheet_(SHEET_VOTES, ['page', 'pouces_haut', 'pouces_bas']);
  var row = findRow_(sh, page);
  if (!row) return { up: 0, down: 0 };
  var v = sh.getRange(row, 2, 1, 2).getValues()[0];
  return { up: Number(v[0]) || 0, down: Number(v[1]) || 0 };
}

/* ------------------------------------------------------------------------ */
/* Tableau de bord                                                           */
/* ------------------------------------------------------------------------ */

function admin_(d) {
  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('fails') || 0);
  if (fails >= 5) return { error: 'locked' };
  var pass = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!pass || String(d.password) !== pass) {
    // 5 essais ratés bloquent le tableau de bord pendant 10 minutes
    cache.put('fails', String(fails + 1), 600);
    return { error: 'password' };
  }
  cache.remove('fails');

  var sh = sheet_(SHEET_VOTES, ['page', 'pouces_haut', 'pouces_bas']);
  if (d.op === 'reset') {
    var last = sh.getLastRow();
    for (var r = 2; r <= last; r++) {
      if (!d.page || sh.getRange(r, 1).getValue() === d.page) sh.getRange(r, 2, 1, 2).setValues([[0, 0]]);
    }
  }
  var pages = [];
  var vals = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues() : [];
  vals.forEach(function (v) {
    pages.push({ page: v[0], up: Number(v[1]) || 0, down: Number(v[2]) || 0 });
  });
  var avisSh = sheet_(SHEET_AVIS, ['date', 'page', 'lien', 'langue', 'message']);
  var avis = [];
  var rows = avisSh.getLastRow() > 1 ? avisSh.getRange(2, 1, avisSh.getLastRow() - 1, 5).getValues() : [];
  rows.forEach(function (v) {
    avis.push({ date: v[0] instanceof Date ? v[0].toISOString() : String(v[0]), page: v[1], url: v[2], lang: v[3], message: String(v[4]).replace(/^'/, '') });
  });
  avis.reverse();
  return { pages: pages, avis: avis };
}

/* ------------------------------------------------------------------------ */
/* Outils                                                                    */
/* ------------------------------------------------------------------------ */

function sheet_(name, header) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(header);
    sh.setFrozenRows(1);
  }
  return sh;
}

function findRow_(sh, page) {
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var col = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < col.length; i++) if (col[i][0] === page) return i + 2;
  return 0;
}

/** N'accepte que des liens http(s) (affichés dans le tableau de bord). */
function safeUrl_(u) {
  u = String(u || '').slice(0, 500);
  return /^https?:\/\//.test(u) ? u : '';
}

/** Empêche qu'un message soit interprété comme une formule par la feuille. */
function noFormula_(s) {
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
