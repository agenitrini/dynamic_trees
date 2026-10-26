/*
 * Structures arborescentes dynamiques
 * Copyright (C) 2024-2026 Antoine Genitrini (développeur principal)
 * Contributeurs (projet PSTL 2023-2024, Sorbonne Université) :
 *   Tracy Hong, Julien Fang, Jean-Marc Zhuang, Laura Rattanavan
 * Licence : GNU GPL version 3 ou ultérieure (voir le fichier LICENSE).
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/*
 * Tableau de bord des avis : compteurs par page, remise à zéro, signalements.
 * Le mot de passe est vérifié par le service (Google Apps Script), jamais ici :
 * il est seulement gardé en mémoire le temps de la session de l'onglet.
 */
(function () {
  'use strict';

  const DT = window.DT;
  const t = DT.i18n.t;
  const R = DT.i18n.resolve;

  DT.i18n.add({
    fr: {
      'adm.title': 'Tableau de bord des <span class="grad">avis</span>',
      'adm.lead': 'Pouces en l’air et en bas de chaque page, et signalements des visiteurs.',
      'adm.password': 'Mot de passe',
      'adm.enter': 'Entrer',
      'adm.votes': 'Votes par page',
      'adm.reports': 'Signalements (pouces en bas)',
      'adm.refresh': 'Actualiser',
      'adm.resetAll': 'Tout remettre à zéro',
      'adm.reset': 'Remettre à zéro',
      'adm.page': 'Page',
      'adm.up': 'Pouces en l’air',
      'adm.down': 'Pouces en bas',
      'adm.none': 'Aucun vote pour l’instant.',
      'adm.noReports': 'Aucun signalement.',
      'adm.open': 'Ouvrir la page',
      'adm.confirmAll': 'Remettre à zéro les compteurs de toutes les pages ?',
      'adm.confirmOne': 'Remettre à zéro les compteurs de « {p} » ?',
      'adm.badPassword': 'Mot de passe incorrect.',
      'adm.locked': 'Trop d’essais : tableau de bord bloqué pendant 10 minutes.',
      'adm.noService': 'Le service d’avis n’est pas configuré (js/config.js).',
      'adm.error': 'Le service ne répond pas.',
      'adm.home': 'Accueil',
      'adm.examples': 'Bibliothèque d’exemples',
      'adm.total': 'Total',
    },
    en: {
      'adm.title': 'Feedback <span class="grad">dashboard</span>',
      'adm.lead': 'Thumbs up and down for every page, and visitors’ reports.',
      'adm.password': 'Password',
      'adm.enter': 'Enter',
      'adm.votes': 'Votes per page',
      'adm.reports': 'Reports (thumbs down)',
      'adm.refresh': 'Refresh',
      'adm.resetAll': 'Reset everything',
      'adm.reset': 'Reset',
      'adm.page': 'Page',
      'adm.up': 'Thumbs up',
      'adm.down': 'Thumbs down',
      'adm.none': 'No votes yet.',
      'adm.noReports': 'No reports.',
      'adm.open': 'Open the page',
      'adm.confirmAll': 'Reset the counters of every page?',
      'adm.confirmOne': 'Reset the counters of “{p}”?',
      'adm.badPassword': 'Wrong password.',
      'adm.locked': 'Too many attempts: dashboard locked for 10 minutes.',
      'adm.noService': 'The feedback service is not configured (js/config.js).',
      'adm.error': 'The service does not respond.',
      'adm.home': 'Home',
      'adm.examples': 'Example library',
      'adm.total': 'Total',
    },
  });

  DT.buildHeader({});

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const $ = (id) => document.getElementById(id);
  let password = null;
  let data = null;

  /** Nom lisible d'une page à partir de sa clé (index, examples, viz:avl…). */
  function pageName(key) {
    if (key === 'index') return t('adm.home');
    if (key === 'examples') return t('adm.examples');
    const e = key.startsWith('viz:') && DT.catalog.find(key.slice(4));
    return e ? R(e.name) : key;
  }
  function pageUrl(key) {
    if (key === 'index') return 'index.html';
    if (key === 'examples') return 'examples.html';
    return 'viz.html?algo=' + encodeURIComponent(key.slice(4));
  }

  async function call(op, extra) {
    const res = await DT.feedbackApi.post(Object.assign({ action: 'admin', password, op }, extra || {}));
    if (res.error === 'password') throw new Error(t('adm.badPassword'));
    if (res.error === 'locked') throw new Error(t('adm.locked'));
    if (res.error) throw new Error(t('adm.error'));
    return res;
  }

  function render() {
    if (!data) return;
    const pages = data.pages.slice().sort((a, b) => b.down - a.down || b.up - a.up);
    const totUp = pages.reduce((s, p) => s + p.up, 0);
    const totDown = pages.reduce((s, p) => s + p.down, 0);
    $('votes').innerHTML = pages.length
      ? `<tr><th>${t('adm.page')}</th><th class="num">${t('adm.up')}</th><th class="num">${t('adm.down')}</th><th></th></tr>` +
        pages
          .map(
            (p) =>
              `<tr><td><a href="${esc(pageUrl(p.page))}" target="_blank" rel="noopener">${esc(pageName(p.page))}</a></td>` +
              `<td class="num up">${p.up}</td><td class="num down">${p.down}</td>` +
              `<td class="act"><button class="btn ghost small" data-reset="${esc(p.page)}">${t('adm.reset')}</button></td></tr>`
          )
          .join('') +
        `<tr class="tot"><td>${t('adm.total')}</td><td class="num">${totUp}</td><td class="num">${totDown}</td><td></td></tr>`
      : `<tr><td>${t('adm.none')}</td></tr>`;

    const fmt = new Intl.DateTimeFormat(DT.i18n.lang, { dateStyle: 'medium', timeStyle: 'short' });
    $('reports').innerHTML = data.avis.length
      ? data.avis
          .map((a) => {
            const link = /^https?:\/\//.test(a.url) ? a.url : pageUrl(a.page);
            const d = new Date(a.date);
            return (
              `<article class="report"><header><b>${esc(pageName(a.page))}</b>` +
              `<span>${isNaN(d) ? esc(a.date) : esc(fmt.format(d))} · ${esc(a.lang)}</span>` +
              `<a href="${esc(link)}" target="_blank" rel="noopener">${t('adm.open')} ↗</a></header>` +
              `<p>${esc(a.message)}</p><code>${esc(link)}</code></article>`
            );
          })
          .join('')
      : `<p class="muted">${t('adm.noReports')}</p>`;
  }

  async function load(op, extra) {
    data = await call(op || 'list', extra);
    render();
  }

  $('login').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('loginErr').textContent = '';
    if (!DT.config.feedbackUrl) {
      $('loginErr').textContent = t('adm.noService');
      return;
    }
    password = $('pw').value;
    const btn = e.submitter || $('login').querySelector('button');
    btn.disabled = true;
    try {
      await load('list');
      $('login').hidden = true;
      $('board').hidden = false;
    } catch (err) {
      password = null;
      $('loginErr').textContent = err.message === 'Failed to fetch' ? t('adm.error') : err.message;
    } finally {
      btn.disabled = false;
    }
  });

  $('refresh').addEventListener('click', () => load('list').catch((err) => alert(err.message)));
  $('resetAll').addEventListener('click', () => {
    if (confirm(t('adm.confirmAll'))) load('reset').catch((err) => alert(err.message));
  });
  $('votes').addEventListener('click', (e) => {
    const b = e.target.closest('[data-reset]');
    if (!b) return;
    const page = b.dataset.reset;
    if (confirm(t('adm.confirmOne', { p: pageName(page) }))) load('reset', { page }).catch((err) => alert(err.message));
  });

  DT.i18n.apply(document);
  DT.i18n.onChange(render);
})();
