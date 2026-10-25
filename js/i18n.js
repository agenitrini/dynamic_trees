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

/* Internationalisation (français / anglais), thème et en-tête commun. */
(function () {
  'use strict';

  const DT = (window.DT = window.DT || {});

  const dict = { fr: {}, en: {} };
  const listeners = [];

  function readPref(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writePref(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* navigation privée : préférence non mémorisée */
    }
  }

  const urlLang = new URLSearchParams(location.search).get('lang');
  let lang = urlLang === 'en' || urlLang === 'fr'
    ? urlLang
    : readPref('dt-lang', (navigator.language || 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en');

  function format(str, params) {
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined ? DT.i18n.resolve(params[k]) : m));
  }

  DT.i18n = {
    get lang() {
      return lang;
    },

    /** Ajoute des traductions : { fr: {...}, en: {...} }. */
    add(entries) {
      for (const l of ['fr', 'en']) Object.assign(dict[l], entries[l] || {});
    },

    has(key) {
      return key in dict[lang] || key in dict.fr;
    },

    /** Traduit une clé, avec paramètres {nom}. */
    t(key, params) {
      const s = dict[lang][key] !== undefined ? dict[lang][key] : dict.fr[key];
      if (s === undefined) return key;
      return typeof s === 'function' ? s(params || {}) : format(s, params);
    },

    /**
     * Résout une valeur affichable : chaîne brute, nombre, objet bilingue {fr, en}
     * ou message à traduire [clé, paramètres].
     */
    resolve(v) {
      if (v === null || v === undefined) return '';
      if (Array.isArray(v)) return DT.i18n.t(v[0], v[1]);
      if (typeof v === 'object') return v[lang] !== undefined ? v[lang] : v.fr;
      return String(v);
    },

    set(l) {
      if (l !== 'fr' && l !== 'en') return;
      lang = l;
      writePref('dt-lang', l);
      document.documentElement.lang = l;
      DT.i18n.apply(document);
      listeners.forEach((f) => f(l));
    },

    onChange(f) {
      listeners.push(f);
    },

    /** Traduit les éléments marqués data-i18n, data-i18n-title, data-i18n-placeholder. */
    apply(root) {
      root.querySelectorAll('[data-i18n]').forEach((el) => {
        el.textContent = DT.i18n.t(el.dataset.i18n);
      });
      root.querySelectorAll('[data-i18n-html]').forEach((el) => {
        el.innerHTML = DT.i18n.t(el.dataset.i18nHtml);
      });
      root.querySelectorAll('[data-i18n-title]').forEach((el) => {
        el.title = DT.i18n.t(el.dataset.i18nTitle);
        el.setAttribute('aria-label', el.title);
      });
      root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
        el.placeholder = DT.i18n.t(el.dataset.i18nPlaceholder);
      });
    },
  };

  DT.t = DT.i18n.t;

  /* ------------------------------------------------------------------------
     Chaînes communes à toutes les pages
     ------------------------------------------------------------------------ */
  DT.i18n.add({
    fr: {
      'site.title': 'Structures arborescentes dynamiques',
      'site.short': 'Arbres dynamiques',
      'site.course': 'AlgAv · M1 Informatique',
      'nav.home': 'Structures',
      'nav.examples': 'Exemples',
      'lang.switch': 'Switch to English',
      'theme.switch': 'Changer de thème (clair / sombre)',
      'chap.1': 'Compression',
      'chap.2': 'Files de priorité',
      'chap.3': 'Arbres de recherche',
      'chap.4': 'Hachage',
      'chap.n': 'Chapitre {n}',
      'punct.colon': '\u00a0:',
    },
    en: {
      'site.title': 'Dynamic Tree Structures',
      'site.short': 'Dynamic Trees',
      'site.course': 'Advanced Algorithms · MSc CS',
      'nav.home': 'Structures',
      'nav.examples': 'Examples',
      'lang.switch': 'Passer en français',
      'theme.switch': 'Toggle theme (light / dark)',
      'chap.1': 'Compression',
      'chap.2': 'Priority queues',
      'chap.3': 'Search trees',
      'chap.4': 'Hashing',
      'chap.n': 'Chapter {n}',
      'punct.colon': ':',
    },
  });

  /* ------------------------------------------------------------------------
     Thème clair / sombre
     ------------------------------------------------------------------------ */
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  let theme = readPref('dt-theme', prefersDark ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = lang;

  DT.toggleTheme = function () {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    writePref('dt-theme', theme);
  };

  /* ------------------------------------------------------------------------
     En-tête commun
     ------------------------------------------------------------------------ */
  const FLAG_FR =
    '<svg viewBox="0 0 3 2" aria-hidden="true"><rect width="1" height="2" fill="#002395"/>' +
    '<rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ED2939"/></svg>';
  const FLAG_EN =
    '<svg viewBox="0 0 60 40" aria-hidden="true"><clipPath id="ukc"><rect width="60" height="40"/></clipPath>' +
    '<g clip-path="url(#ukc)"><rect width="60" height="40" fill="#012169"/>' +
    '<path d="M0,0 60,40 M60,0 0,40" stroke="#fff" stroke-width="8"/>' +
    '<path d="M0,0 60,40 M60,0 0,40" stroke="#C8102E" stroke-width="3"/>' +
    '<path d="M30,0 v40 M0,20 h60" stroke="#fff" stroke-width="12"/>' +
    '<path d="M30,0 v40 M0,20 h60" stroke="#C8102E" stroke-width="7"/></g></svg>';
  const LOGO =
    '<svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">' +
    '<defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent-2)"/></linearGradient></defs>' +
    '<rect width="32" height="32" rx="9" fill="url(#lg)"/>' +
    '<g stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"><path d="M16 9 L10 17 M16 9 L22 17 M10 17 L7 24 M10 17 L13 24"/></g>' +
    '<g fill="#fff"><circle cx="16" cy="9" r="3"/><circle cx="10" cy="17" r="2.6"/><circle cx="22" cy="17" r="2.6"/>' +
    '<circle cx="7" cy="24" r="2.2"/><circle cx="13" cy="24" r="2.2"/></g></svg>';
  const SUN_MOON =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  /**
   * Construit l'en-tête : logo, navigation, zone centrale optionnelle,
   * puis à droite le sélecteur de thème et le bouton drapeau de langue.
   */
  DT.buildHeader = function (opts) {
    opts = opts || {};
    const header = document.createElement('header');
    header.className = 'topbar';
    header.innerHTML =
      `<a class="brand" href="index.html">${LOGO}<span><span data-i18n="site.short"></span> ` +
      `<small data-i18n="site.course"></small></span></a>` +
      `<nav><a href="index.html" data-i18n="nav.home" class="${opts.active === 'home' ? 'active' : ''}"></a>` +
      `<a href="examples.html" data-i18n="nav.examples" class="${opts.active === 'examples' ? 'active' : ''}"></a></nav>` +
      `<div class="slot"></div><div class="spacer"></div>` +
      `<button class="icon-btn theme" data-i18n-title="theme.switch">${SUN_MOON}</button>` +
      `<button class="lang-toggle" data-i18n-title="lang.switch">` +
      `<span data-l="fr">${FLAG_FR}FR</span><span data-l="en">${FLAG_EN}EN</span></button>`;
    document.body.prepend(header);

    const slot = header.querySelector('.slot');
    if (opts.slot) slot.appendChild(opts.slot);
    else slot.remove();

    header.querySelector('.theme').addEventListener('click', DT.toggleTheme);
    const toggle = header.querySelector('.lang-toggle');
    const refresh = () =>
      toggle.querySelectorAll('span').forEach((s) => s.classList.toggle('on', s.dataset.l === lang));
    toggle.addEventListener('click', () => DT.i18n.set(lang === 'fr' ? 'en' : 'fr'));
    DT.i18n.onChange(refresh);
    refresh();
    DT.i18n.apply(header);
    return header;
  };
})();
