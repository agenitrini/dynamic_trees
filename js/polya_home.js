/*
 * Structures arborescentes dynamiques
 * Copyright (C) 2024-2026 Antoine Genitrini (développeur principal)
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/* Accueil du site « Structures de Pólya » (polya.html). */
(function () {
  'use strict';

  const DT = window.DT;
  const t = DT.i18n.t;
  const R = DT.i18n.resolve;

  DT.i18n.add({
    fr: {
      'polyaHome.title': 'Tirer au hasard des <span class="grad">structures de Pólya</span>',
      'polyaHome.lead':
        'Arbres non étiquetés, symétries, et une décomposition qui explique tout : un squelette de Cayley sur lequel se greffent des décorations.',
      'polyaHome.intro':
        'La série génératrice des <b>arbres de Pólya</b> vérifie T(z) = z exp(Σ<sub>i≥1</sub> T(z<sup>i</sup>)/i). ' +
        'En isolant le terme i = 1, on l’écrit T(z) = C(ζ(z)), où C(z) = z e<sup>C(z)</sup> est la fonction des arbres de Cayley. ' +
        'Cette décomposition se lit dans la <b>méthode récursive</b> de génération uniforme : les <b>pas de Cayley</b> greffent un sous-arbre seul ' +
        'et construisent le <b>squelette</b>, les <b>pas de décoration</b> greffent plusieurs copies identiques. ' +
        'Chaque visualisation tire une structure uniforme de taille donnée (jusqu’à 1000), puis montre le squelette génération par génération, ' +
        'puis les décorations. Les nombres de structures sont stockés sous forme normalisée (w<sub>k</sub> = ρ<sup>k</sup> T<sub>k</sub>) : aucun grand entier n’est calculé.',
      'polyaHome.footer':
        'Illustration de l’article d’A. Genitrini, <i>Full asymptotic expansions and uniform random sampling of Pólya structures</i>. ' +
        '© 2024-2026 Antoine Genitrini. Logiciel libre sous <a href="LICENSE">licence GNU GPL v3</a>. ' +
        'Même moteur que les <a href="index.html">visualisations du cours AlgAv</a>.',
      'polyaHome.chap': 'Familles de structures',
      'polyaHome.chapSub': 'Des perturbations de la fonction de Cayley.',
    },
    en: {
      'polyaHome.title': 'Random sampling of <span class="grad">Pólya structures</span>',
      'polyaHome.lead':
        'Unlabelled trees, symmetries, and a decomposition that explains them: a Cayley skeleton carrying decorations.',
      'polyaHome.intro':
        'The generating function of <b>Pólya trees</b> satisfies T(z) = z exp(Σ<sub>i≥1</sub> T(z<sup>i</sup>)/i). ' +
        'Isolating the term i = 1, we write T(z) = C(ζ(z)), where C(z) = z e<sup>C(z)</sup> is the Cayley tree function. ' +
        'This decomposition can be read in the <b>recursive method</b> of uniform sampling: the <b>Cayley steps</b> graft a single subtree ' +
        'and build the <b>skeleton</b>, the <b>decoration steps</b> graft several identical copies. ' +
        'Each visualization draws a uniform structure of a given size (up to 1000), then shows the skeleton generation by generation, ' +
        'then the decorations. The numbers of structures are stored in normalised form (w<sub>k</sub> = ρ<sup>k</sup> T<sub>k</sub>): no big integer is computed.',
      'polyaHome.footer':
        'Illustration of the paper by A. Genitrini, <i>Full asymptotic expansions and uniform random sampling of Pólya structures</i>. ' +
        '© 2024-2026 Antoine Genitrini. Free software under the <a href="LICENSE">GNU GPL v3 license</a>. ' +
        'Same engine as the <a href="index.html">AlgAv course visualizations</a>.',
      'polyaHome.chap': 'Families of structures',
      'polyaHome.chapSub': 'Perturbations of the Cayley tree function.',
    },
  });

  DT.buildHeader({ active: 'home', page: 'polya', site: 'polya' });

  const root = document.getElementById('chapters');
  const tip = document.getElementById('tooltip');

  function render() {
    root.innerHTML = '';
    const card = document.createElement('article');
    card.className = 'chapter';
    card.innerHTML = `<h2><span class="num">P</span>${t('polyaHome.chap')}</h2><p class="chap-sub">${t('polyaHome.chapSub')}</p><ul></ul>`;
    const ul = card.querySelector('ul');
    for (const e of DT.polyaCatalog.entries) {
      const li = document.createElement('li');
      li.dataset.id = e.id;
      li.innerHTML = `<a href="viz.html?algo=${e.id}"><span class="dot"></span>${R(e.name)}` +
        `<span class="tag">${(e.examples || []).length} ex.</span></a>`;
      li.addEventListener('mouseenter', () => show(li, e));
      li.addEventListener('mouseleave', () => tip.classList.remove('show'));
      ul.appendChild(li);
    }
    root.appendChild(card);
  }

  function show(li, e) {
    tip.innerHTML = `<h3>${R(e.name)}</h3><p>${R(e.short)}</p><p class="goal"><b>${t('home.goal')}${t('punct.colon')}</b> ${R(e.goal)}</p>`;
    const r = li.getBoundingClientRect();
    tip.classList.add('show');
    let x = r.right + 12;
    if (x + tip.offsetWidth > window.innerWidth - 12) x = Math.max(12, r.left - tip.offsetWidth - 12);
    const y = Math.min(r.top, window.innerHeight - tip.offsetHeight - 12);
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }

  DT.i18n.add({ fr: { 'home.goal': 'Objectif' }, en: { 'home.goal': 'Goal' } });
  DT.i18n.apply(document);
  render();
  DT.i18n.onChange(render);
})();
