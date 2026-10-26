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

/* Bibliothèque d'exemples : tous les exemples du catalogue, avec lien direct. */
(function () {
  'use strict';

  const DT = window.DT;
  const t = DT.i18n.t;
  const R = DT.i18n.resolve;

  DT.i18n.add({
    fr: {
      'ex.title': 'Bibliothèque d’<span class="grad">exemples</span>',
      'ex.lead':
        'Les exemples des transparents du cours et quelques cas instructifs, prêts à être rejoués. Chaque lien ouvre la visualisation et lance l’animation.',
      'ex.filter': 'Filtrer les exemples…',
      'ex.footer': '<a href="index.html">← Retour à la liste des structures</a> · © 2024-2026 Antoine Genitrini et contributeurs du PSTL 2023-2024 · <a href="LICENSE">GNU GPL v3</a>',
      'ex.open': 'Ouvrir la visualisation',
      'ex.verb.insert': 'ajouts',
      'ex.verb.delete': 'suppressions',
      'ex.verb.search': 'recherches',
      'ex.verb.build': 'construction',
      'ex.verb.union': 'union avec',
      'ex.verb.extractMin': 'suppression du min',
      'ex.verb.encode': 'compression',
      'ex.verb.decode': 'décompression',
      'ex.verb.decreaseKey': 'diminution de clé',
    },
    en: {
      'ex.title': 'Example <span class="grad">library</span>',
      'ex.lead':
        'The examples from the lecture slides plus a few instructive cases, ready to replay. Each link opens the visualization and starts the animation.',
      'ex.filter': 'Filter examples…',
      'ex.footer': '<a href="index.html">← Back to the list of structures</a> · © 2024-2026 Antoine Genitrini and the 2023-2024 PSTL contributors · <a href="LICENSE">GNU GPL v3</a>',
      'ex.open': 'Open the visualization',
      'ex.verb.insert': 'insert',
      'ex.verb.delete': 'delete',
      'ex.verb.search': 'search',
      'ex.verb.build': 'build',
      'ex.verb.union': 'union with',
      'ex.verb.extractMin': 'extract-min',
      'ex.verb.encode': 'compress',
      'ex.verb.decode': 'decompress',
      'ex.verb.decreaseKey': 'decrease key',
    },
  });

  DT.buildHeader({ active: 'examples', page: 'examples' });

  const root = document.getElementById('groups');
  const filter = document.getElementById('filter');

  /** Résumé lisible d'une suite d'opérations : « ajouts : 4 35 10 · suppressions : 13 ». */
  function summary(ex) {
    const parts = [];
    for (const [k, v] of Object.entries(ex.settings || {})) parts.push(`${k} = ${v}`);
    let cur = null;
    for (const [op, args] of ex.ops) {
      const shown = args.map((a) => (Array.isArray(a) ? a.join(' ') : a)).join(' ');
      if (cur && cur.op === op) cur.vals.push(shown);
      else {
        cur = { op, vals: shown ? [shown] : [] };
        parts.push(cur);
      }
    }
    return parts
      .map((p) => {
        if (typeof p === 'string') return p;
        const verb = DT.i18n.has('ex.verb.' + p.op) ? t('ex.verb.' + p.op) : p.op;
        return p.vals.length ? `${verb}${t('punct.colon')} ${p.vals.join(' ')}` : verb;
      })
      .join(' · ');
  }

  function render() {
    root.innerHTML = '';
    for (const e of DT.catalog.entries) {
      if (!(e.examples || []).length) continue;
      const g = document.createElement('section');
      g.className = 'ex-group';
      g.id = e.id;
      g.innerHTML =
        `<h2><a href="viz.html?algo=${e.id}">${R(e.name)}</a></h2>` +
        `<p class="chap-sub">${t('chap.n', { n: e.chapter })} · ${t('chap.' + e.chapter)} — ${R(e.short)}</p>` +
        `<div class="ex-list"></div>`;
      const list = g.querySelector('.ex-list');
      for (const ex of e.examples) {
        const a = document.createElement('a');
        a.className = 'ex-card';
        a.href = `viz.html?algo=${e.id}&ex=${ex.id}`;
        a.title = t('ex.open');
        const s = summary(ex);
        a.innerHTML = `<b></b><code></code>`;
        a.querySelector('b').textContent = R(ex.name);
        a.querySelector('code').textContent = s;
        a.dataset.hay = [e.name.fr, e.name.en, ex.name.fr, ex.name.en, s].join(' ');
        list.appendChild(a);
      }
      root.appendChild(g);
    }
    applyFilter();
    if (location.hash) {
      const target = document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    }
  }

  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function applyFilter() {
    const q = norm(filter.value.trim());
    root.querySelectorAll('.ex-group').forEach((g) => {
      let any = false;
      g.querySelectorAll('.ex-card').forEach((c) => {
        const hit = !q || norm(c.dataset.hay).includes(q);
        c.style.display = hit ? '' : 'none';
        any = any || hit;
      });
      g.style.display = any ? '' : 'none';
    });
  }

  filter.addEventListener('input', applyFilter);
  DT.i18n.apply(document);
  DT.i18n.onChange(render);
  render();
})();
