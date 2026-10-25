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

/* Page d'accueil : liste des structures par chapitre et bulles d'information. */
(function () {
  'use strict';

  const DT = window.DT;
  const t = DT.i18n.t;
  const R = DT.i18n.resolve;

  DT.i18n.add({
    fr: {
      'home.title': 'Visualiser les <span class="grad">structures arborescentes dynamiques</span>',
      'home.lead':
        'Animations pas à pas des structures du cours d’algorithmique avancée : ajoutez, supprimez, cherchez, et suivez chaque comparaison, rotation ou éclatement, avec le pseudo-code du cours.',
      'home.filter': 'Filtrer les structures…',
      'home.goal': 'Objectif',
      'home.footer':
        'Cours d’algorithmique avancée (AlgAv), Master 1 Informatique, Sorbonne Université. ' +
        '© 2024-2026 Antoine Genitrini (développeur principal), avec les contributions du projet PSTL 2023-2024 : ' +
        'Tracy Hong, Julien Fang, Jean-Marc Zhuang, Laura Rattanavan. ' +
        'Logiciel libre sous <a href="LICENSE">licence GNU GPL v3</a>. ' +
        'Inspiré des visualisations de David Galles (USF). <a href="examples.html">Bibliothèque d’exemples</a>.',
      'home.none': 'Aucune structure ne correspond.',
    },
    en: {
      'home.title': 'Visualize <span class="grad">dynamic tree structures</span>',
      'home.lead':
        'Step-by-step animations of the data structures of the advanced algorithms course: insert, delete, search, and follow every comparison, rotation or split, with the lecture pseudo-code.',
      'home.filter': 'Filter structures…',
      'home.goal': 'Goal',
      'home.footer':
        'Advanced Algorithms course (AlgAv), MSc Computer Science year 1, Sorbonne Université. ' +
        '© 2024-2026 Antoine Genitrini (lead developer), with contributions from the 2023-2024 PSTL project: ' +
        'Tracy Hong, Julien Fang, Jean-Marc Zhuang, Laura Rattanavan. ' +
        'Free software under the <a href="LICENSE">GNU GPL v3 license</a>. ' +
        'Inspired by David Galles’ visualizations (USF). <a href="examples.html">Example library</a>.',
      'home.none': 'No structure matches.',
    },
  });

  DT.buildHeader({ active: 'home' });

  const root = document.getElementById('chapters');
  const tip = document.getElementById('tooltip');
  const filter = document.getElementById('filter');

  function render() {
    root.innerHTML = '';
    for (const ch of DT.catalog.chapters) {
      const card = document.createElement('article');
      card.className = 'chapter';
      card.innerHTML =
        `<h2><span class="num">${ch.n}</span>${t('chap.' + ch.n)}</h2>` + `<p class="chap-sub">${R(ch.sub)}</p><ul></ul>`;
      const ul = card.querySelector('ul');
      for (const e of DT.catalog.entries.filter((x) => x.chapter === ch.n)) {
        const li = document.createElement('li');
        li.dataset.id = e.id;
        const n = (e.examples || []).length;
        li.innerHTML = `<a href="viz.html?algo=${e.id}"><span class="dot"></span>${R(e.name)}` +
          (n ? `<span class="tag">${n} ex.</span>` : '') + '</a>';
        ul.appendChild(li);
      }
      root.appendChild(card);
    }
    applyFilter();
  }

  function norm(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function applyFilter() {
    const q = norm(filter.value.trim());
    root.querySelectorAll('li').forEach((li) => {
      const e = DT.catalog.find(li.dataset.id);
      const hay = norm([e.name.fr, e.name.en, e.short.fr, e.short.en, e.id].join(' '));
      li.classList.toggle('hidden', !!q && !hay.includes(q));
    });
    root.querySelectorAll('.chapter').forEach((c) => {
      c.style.display = c.querySelector('li:not(.hidden)') ? '' : 'none';
    });
  }

  /* --- bulle d'information ------------------------------------------------ */
  function show(li) {
    const e = DT.catalog.find(li.dataset.id);
    const cost = (e.costs || [])[0];
    tip.innerHTML =
      `<h3>${R(e.name)}</h3><p>${R(e.short)}</p>` +
      `<p class="goal"><b>${t('home.goal')}${t('punct.colon')}</b> ${R(e.goal)}</p>` +
      (cost ? `<div class="cx">${R(cost[0])}${t('punct.colon')} ${R(cost[1])}</div>` : '');
    const r = li.getBoundingClientRect();
    tip.classList.add('show');
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    let x = r.right + 12;
    let y = r.top + r.height / 2 - th / 2;
    if (x + tw > window.innerWidth - 12) {
      // pas de place à droite : à gauche si possible, sinon sous l'élément
      if (r.left - tw - 12 >= 12) x = r.left - tw - 12;
      else {
        x = r.left + 20;
        y = r.bottom + 8;
        if (y + th > window.innerHeight - 12) y = r.top - th - 8;
      }
    }
    y = Math.min(y, window.innerHeight - th - 12);
    tip.style.left = Math.max(12, x) + 'px';
    tip.style.top = Math.max(12, y) + 'px';
  }

  function hide() {
    tip.classList.remove('show');
  }

  root.addEventListener('mouseover', (ev) => {
    const li = ev.target.closest('li');
    if (li) show(li);
  });
  root.addEventListener('mouseout', (ev) => {
    const li = ev.target.closest('li');
    if (li && !li.contains(ev.relatedTarget)) hide();
  });
  root.addEventListener('focusin', (ev) => {
    const li = ev.target.closest('li');
    if (li) show(li);
  });
  root.addEventListener('focusout', hide);
  window.addEventListener('scroll', hide, { passive: true });

  filter.addEventListener('input', applyFilter);
  filter.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      const first = root.querySelector('li:not(.hidden) a');
      if (first) location.href = first.href;
    }
  });

  DT.i18n.apply(document);
  DT.i18n.onChange(() => {
    hide();
    render();
  });
  render();
})();
