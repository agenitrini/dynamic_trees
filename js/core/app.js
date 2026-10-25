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
 * Application de la page de visualisation (viz.html?algo=identifiant).
 * Charge le script de l'algorithme, construit la barre de commandes à partir
 * de sa description, et relie le lecteur, le journal des étapes, le panneau de
 * pseudo-code et la fiche d'information.
 */
(function () {
  'use strict';

  const DT = (window.DT = window.DT || {});
  const t = (k, p) => DT.i18n.t(k, p);
  const R = (v) => DT.i18n.resolve(v);

  DT.i18n.add({
    fr: {
      'ctl.insert': 'Ajouter',
      'ctl.delete': 'Supprimer',
      'ctl.search': 'Rechercher',
      'ctl.clear': 'Vider',
      'ctl.random': 'Aléatoire',
      'ctl.undo': 'Annuler',
      'ctl.key': 'Clé',
      'ctl.keys': 'clés…',
      'ctl.word': 'mot(s)…',
      'ctl.text': 'texte…',
      'ctl.examples': 'Exemples',
      'ctl.load': 'Charger',
      'ctl.choose': '— choisir un exemple —',
      'player.first': 'Début (Origine)',
      'player.prev': 'Étape précédente (←)',
      'player.play': 'Lecture / pause (Espace)',
      'player.next': 'Étape suivante (→)',
      'player.last': 'Fin (Fin)',
      'player.speed': 'Vitesse',
      'zoom.in': 'Zoom avant',
      'zoom.out': 'Zoom arrière',
      'zoom.fit': 'Recentrer (double-clic)',
      'panel.toggle': 'Afficher / masquer le panneau',
      'tab.steps': 'Étapes',
      'tab.code': 'Pseudo-code',
      'tab.info': 'Fiche',
      'code.none': 'Pas de pseudo-code pour cette opération.',
      'code.from': 'Pseudo-code dans le style Python du cours.',
      'code.src.course': 'Transparents du cours',
      'code.src.pstl': 'Code du projet PSTL',
      'code.src.site': 'Écrit dans le style du cours',
      'info.ops': 'Opération',
      'info.cost': 'Coût',
      'info.keys': 'Raccourcis : <kbd>Espace</kbd> lecture/pause, <kbd>←</kbd> <kbd>→</kbd> pas à pas, <kbd>Entrée</kbd> dans un champ pour valider. Molette pour zoomer, glisser pour déplacer.',
      'info.examples': 'Voir aussi la bibliothèque d’exemples.',
      'info.credits': '© 2024-2026 Antoine Genitrini (développeur principal) · contributions PSTL 2023-2024 : Tracy Hong, Julien Fang, Jean-Marc Zhuang, Laura Rattanavan · <a href="LICENSE">GNU GPL v3</a>',
      'err.int': '« {v} » n’est pas un entier.',
      'err.range': '« {v} » : choisissez un entier entre -9999 et 9999.',
      'err.empty': 'Saisissez au moins une valeur.',
      'err.word': '« {v} » : utilisez uniquement les lettres a à z.',
      'err.letter': '« {v} » : saisissez des lettres (A à Z).',
      'err.full': 'La structure est pleine.',
      'err.toolong': 'Texte trop long (au plus {n} caractères).',
      'err.internal': 'Erreur interne : {m}',
      'err.load': 'Impossible de charger cette visualisation.',
      'err.unknown': 'Structure inconnue : « {id} ».',
      'msg.cleared': 'La structure est vide.',
      'msg.empty': 'La structure est vide.',
      'op.insert': 'Ajout de {x}',
      'op.delete': 'Suppression de {x}',
      'op.search': 'Recherche de {x}',
      'op.clear': 'Réinitialisation',
      'op.random': 'Ajouts aléatoires',
      'op.build': 'Construction',
      'op.extractMin': 'Suppression du minimum',
      'op.example': 'Exemple : {name}',
      'msg.start': 'Prêt. Saisissez une valeur puis choisissez une opération.',
    },
    en: {
      'ctl.insert': 'Insert',
      'ctl.delete': 'Delete',
      'ctl.search': 'Search',
      'ctl.clear': 'Clear',
      'ctl.random': 'Random',
      'ctl.undo': 'Undo',
      'ctl.key': 'Key',
      'ctl.keys': 'keys…',
      'ctl.word': 'word(s)…',
      'ctl.text': 'text…',
      'ctl.examples': 'Examples',
      'ctl.load': 'Load',
      'ctl.choose': '— pick an example —',
      'player.first': 'Start (Home)',
      'player.prev': 'Previous step (←)',
      'player.play': 'Play / pause (Space)',
      'player.next': 'Next step (→)',
      'player.last': 'End (End)',
      'player.speed': 'Speed',
      'zoom.in': 'Zoom in',
      'zoom.out': 'Zoom out',
      'zoom.fit': 'Fit to view (double-click)',
      'panel.toggle': 'Show / hide the side panel',
      'tab.steps': 'Steps',
      'tab.code': 'Pseudo-code',
      'tab.info': 'About',
      'code.none': 'No pseudo-code for this operation.',
      'code.from': 'Pseudo-code in the lecture’s Python style.',
      'code.src.course': 'From the lecture slides',
      'code.src.pstl': 'From the PSTL project code',
      'code.src.site': 'Written in the lecture’s style',
      'info.ops': 'Operation',
      'info.cost': 'Cost',
      'info.keys': 'Shortcuts: <kbd>Space</kbd> play/pause, <kbd>←</kbd> <kbd>→</kbd> step, <kbd>Enter</kbd> in a field to submit. Wheel to zoom, drag to pan.',
      'info.examples': 'See also the example library.',
      'info.credits': '© 2024-2026 Antoine Genitrini (lead developer) · 2023-2024 PSTL contributions: Tracy Hong, Julien Fang, Jean-Marc Zhuang, Laura Rattanavan · <a href="LICENSE">GNU GPL v3</a>',
      'err.int': '“{v}” is not an integer.',
      'err.range': '“{v}”: pick an integer between -9999 and 9999.',
      'err.empty': 'Enter at least one value.',
      'err.word': '“{v}”: use only the letters a to z.',
      'err.letter': '“{v}”: enter letters (A to Z).',
      'err.full': 'The structure is full.',
      'err.toolong': 'Text too long (at most {n} characters).',
      'err.internal': 'Internal error: {m}',
      'err.load': 'Unable to load this visualization.',
      'err.unknown': 'Unknown structure: “{id}”.',
      'msg.cleared': 'The structure is empty.',
      'msg.empty': 'The structure is empty.',
      'op.insert': 'Insert {x}',
      'op.delete': 'Delete {x}',
      'op.search': 'Search {x}',
      'op.clear': 'Reset',
      'op.random': 'Random insertions',
      'op.build': 'Build',
      'op.extractMin': 'Extract the minimum',
      'op.example': 'Example: {name}',
      'msg.start': 'Ready. Enter a value, then choose an operation.',
    },
  });

  const ICONS = {
    first: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg>',
    prev: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 5v14L6 12z"/></svg>',
    play: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>',
    pause: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
    next: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l11-7z"/></svg>',
    last: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 5v14l11-7zM16 5h2v14h-2z"/></svg>',
    plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
    fit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    panel: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/></svg>',
  };

  /** Coloration syntaxique minimale du pseudo-code Python. */
  function highlightPython(line) {
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const re = /("""[^"]*"""|"""[^"]*$|"[^"]*"|'[^']*'|#.*$|\b(?:def|return|if|elif|else|for|while|in|and|or|not|None|True|False|is|break|continue)\b)/g;
    let out = '';
    let last = 0;
    let m;
    while ((m = re.exec(line))) {
      out += esc(line.slice(last, m.index));
      const tok = m[0];
      if (tok[0] === '#') out += `<span class="com">${esc(tok)}</span>`;
      else if (tok[0] === '"' || tok[0] === "'") out += `<span class="str">${esc(tok)}</span>`;
      else out += `<span class="kw">${tok}</span>`;
      last = m.index + tok.length;
    }
    return out + esc(line.slice(last));
  }

  /** Charge un script (fonctionne aussi en file://). */
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error(src));
      document.head.appendChild(s);
    });
  }

  class App {
    constructor() {
      const params = new URLSearchParams(location.search);
      this.id = params.get('algo') || 'abr';
      this.exampleId = params.get('ex');
      this.entry = DT.catalog.find(this.id);
      this.undoStack = [];
      this.frames = [];
      this.lastMsgFrame = -1;
    }

    async start() {
      const title = document.createElement('div');
      title.className = 'viz-title';
      title.innerHTML = '<h1></h1><span class="chap"></span>';
      this.titleEl = title;
      DT.buildHeader({ slot: title });
      this.statusEl = document.getElementById('status');

      if (!this.entry) {
        this.setStatus(['err.unknown', { id: this.id }], true);
        return;
      }
      try {
        for (const dep of ['_common'].concat(this.entry.deps || [])) await loadScript(`js/algos/${dep}.js`);
        await loadScript(`js/algos/${this.id}.js`);
      } catch (e) {
        this.setStatus(['err.load'], true);
        return;
      }
      this.Algo = DT.algos[this.id];
      this.algo = new this.Algo();

      this.renderer = new DT.Renderer(document.getElementById('svg'));
      this.renderer.topReserve = () => (this.statusEl.offsetHeight || 40) + 24;
      this.player = new DT.Player(this.renderer, (i) => this.onFrame(i));
      this.player.onState = () => this.updatePlayerUI();

      this.buildControls();
      this.buildPlayer();
      this.buildSide();
      this.bindKeys();
      DT.i18n.apply(document);
      this.refreshTexts();
      DT.i18n.onChange(() => {
        this.refreshTexts();
        this.renderer.relabel();
        this.renderLog();
        this.renderCode();
        this.renderInfo();
        this.onFrame(this.player.i);
      });

      // scène initiale
      this.frames = this.algo.record(() => this.algo.step('msg.start'));
      this.player.load(this.frames, false);
      this.renderLog();

      if (this.exampleId) {
        const ex = (this.entry.examples || []).find((e) => e.id === this.exampleId);
        if (ex) {
          this.exSelect.value = ex.id;
          this.loadExample(ex);
        }
      }
    }

    refreshTexts() {
      const name = R(this.entry.name);
      this.titleEl.querySelector('h1').textContent = name;
      this.titleEl.querySelector('.chap').textContent =
        t('chap.n', { n: this.entry.chapter }) + ' · ' + t('chap.' + this.entry.chapter);
      document.title = name + ' — ' + t('site.short');
      if (this.exSelect) {
        this.exSelect.options[0].textContent = t('ctl.choose');
        (this.entry.examples || []).forEach((ex, i) => {
          this.exSelect.options[i + 1].textContent = R(ex.name);
        });
      }
      for (const sel of this.selects || []) {
        [...sel.el.options].forEach((o, i) => (o.textContent = R(sel.spec.options[i].label)));
      }
    }

    /* ------------------------------------------------------------------ */
    /* Barre de commandes                                                  */
    /* ------------------------------------------------------------------ */

    buildControls() {
      const bar = document.getElementById('controls');
      const inputs = {};
      this.inputs = inputs;
      this.selects = [];
      let group = document.createElement('div');
      group.className = 'group';
      bar.appendChild(group);
      const newGroup = () => {
        const sep = document.createElement('div');
        sep.className = 'sep';
        bar.appendChild(sep);
        group = document.createElement('div');
        group.className = 'group';
        bar.appendChild(group);
      };

      for (const c of this.Algo.controls || []) {
        if (c.type === 'sep') {
          newGroup();
        } else if (c.type === 'input') {
          const inp = document.createElement('input');
          inp.type = 'text';
          inp.size = c.size || 8;
          inp.dataset.i18nPlaceholder = c.placeholder || 'ctl.keys';
          inp.setAttribute('autocomplete', 'off');
          inp.setAttribute('spellcheck', 'false');
          if (c.value !== undefined) inp.value = c.value;
          inputs[c.name] = inp;
          if (c.label) {
            const l = document.createElement('label');
            l.className = 'lbl';
            l.dataset.i18n = c.label;
            group.appendChild(l);
          }
          group.appendChild(inp);
          inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              const primary = (this.Algo.controls || []).find(
                (b) => b.type === 'button' && b.primary && (b.args || []).includes(c.name)
              );
              if (primary) this.perform(primary.op, primary.args, primary);
            }
          });
        } else if (c.type === 'button') {
          const b = document.createElement('button');
          b.className = 'btn' + (c.primary ? ' primary' : '');
          b.dataset.i18n = c.label;
          b.addEventListener('click', () => this.perform(c.op, c.args, c));
          group.appendChild(b);
        } else if (c.type === 'select') {
          if (c.label) {
            const l = document.createElement('label');
            l.className = 'lbl';
            l.dataset.i18n = c.label;
            group.appendChild(l);
          }
          const sel = document.createElement('select');
          for (const o of c.options) {
            const opt = document.createElement('option');
            opt.value = o.value;
            sel.appendChild(opt);
          }
          sel.value = c.value !== undefined ? c.value : c.options[0].value;
          this.selects.push({ el: sel, spec: c });
          inputs[c.name] = sel;
          sel.addEventListener('change', () => {
            if (c.op) this.run([[c.op, [sel.value]]]);
          });
          group.appendChild(sel);
        }
      }

      // annuler / vider
      newGroup();
      const undo = document.createElement('button');
      undo.className = 'btn ghost';
      undo.dataset.i18n = 'ctl.undo';
      undo.addEventListener('click', () => this.undo());
      this.undoBtn = undo;
      group.appendChild(undo);
      const clear = document.createElement('button');
      clear.className = 'btn ghost';
      clear.dataset.i18n = 'ctl.clear';
      clear.addEventListener('click', () => this.run([['clear', []]]));
      group.appendChild(clear);

      // exemples
      if ((this.entry.examples || []).length) {
        newGroup();
        const l = document.createElement('label');
        l.className = 'lbl';
        l.dataset.i18n = 'ctl.examples';
        group.appendChild(l);
        const sel = document.createElement('select');
        sel.appendChild(document.createElement('option')).value = '';
        for (const ex of this.entry.examples) sel.appendChild(document.createElement('option')).value = ex.id;
        this.exSelect = sel;
        group.appendChild(sel);
        sel.addEventListener('change', () => {
          const ex = this.entry.examples.find((e) => e.id === sel.value);
          if (ex) this.loadExample(ex);
        });
      }
      this.updateUndo();
    }

    /** Lit les arguments d'une commande et lance l'opération (une fois par valeur saisie). */
    perform(op, args, spec) {
      args = args || [];
      try {
        if (!args.length) {
          this.run([[op, []]]);
          return;
        }
        // un seul champ peut contenir plusieurs valeurs : une opération par valeur
        const lists = args.map((name) => {
          const inp = this.inputs[name];
          if (inp.tagName === 'SELECT') return [inp.value];
          const vals = this.algo.parse(name, inp.value, op);
          if (!vals.length) throw new DT.UserError('err.empty');
          return vals;
        });
        const multi = lists.findIndex((l) => l.length > 1);
        const ops = [];
        if (multi < 0 || spec.single) ops.push([op, lists.map((l) => (spec.single ? l : l[0]))]);
        else for (const v of lists[multi]) ops.push([op, lists.map((l, i) => (i === multi ? v : l[0]))]);
        this.run(ops);
        const first = this.inputs[args[0]];
        if (first && first.tagName === 'INPUT' && !spec.keep) {
          first.value = '';
          first.focus();
        }
      } catch (e) {
        this.showError(e);
      }
    }

    /** Exécute une suite d'opérations [[nom, arguments], ...] et anime le résultat. */
    run(ops, header) {
      this.player.finish();
      const before = this.algo.save();
      let frames;
      try {
        frames = this.algo.record(() => {
          if (header) this.algo.step(header, { op: true });
          for (const [op, args] of ops) {
            if (typeof this.algo[op] !== 'function') throw new Error('op ' + op);
            const key = DT.i18n.has(`${this.id}.op.${op}`) ? `${this.id}.op.${op}` : `op.${op}`;
            this.algo.step([key, { x: args.map((a) => (Array.isArray(a) ? a.join(' ') : R(a))).join(' ') }], { op: true, code: null });
            this.algo[op](...args);
            this.algo.clearMarks();
            this.algo.codeKey = null;
            this.algo.step(null);
          }
        });
      } catch (e) {
        this.algo.restore(before);
        this.algo.frames = null;
        this.showError(e);
        return;
      }
      this.undoStack.push(before);
      if (this.undoStack.length > 60) this.undoStack.shift();
      this.updateUndo();
      this.frames = frames;
      this.player.load(frames, true);
      this.renderLog();
      this.syncSelects();
    }

    loadExample(ex) {
      this.player.finish();
      const before = this.algo.save();
      this.algo = new this.Algo();
      // réglages de l'exemple (ordre d'un arbre B, taille de table...)
      for (const [name, value] of Object.entries(ex.settings || {})) {
        if (this.inputs[name]) this.inputs[name].value = value;
      }
      const ops = [];
      for (const [name, value] of Object.entries(ex.settings || {})) {
        const sel = this.selects.find((s) => s.spec.name === name);
        if (sel && sel.spec.op) ops.push([sel.spec.op, [value]]);
      }
      if (ops.length) this.algo.record(() => ops.forEach(([op, args]) => this.algo[op](...args)));
      this.frames = [];
      const prev = this.undoStack.slice();
      this.run(ex.ops, ['op.example', { name: ex.name }]);
      // on peut annuler le chargement de l'exemple
      this.undoStack = prev.concat([before]);
      this.updateUndo();
    }

    undo() {
      if (!this.undoStack.length) return;
      this.player.finish();
      this.algo.restore(this.undoStack.pop());
      this.frames = this.algo.record(() => this.algo.step(null));
      this.player.load(this.frames, false);
      this.renderLog();
      this.updateUndo();
      this.syncSelects();
    }

    /** Aligne les listes de réglages sur l'état de l'algorithme (this.s.cfg). */
    syncSelects() {
      const cfg = this.algo.s.cfg || {};
      for (const sel of this.selects || []) {
        const v = cfg[sel.spec.name];
        if (v !== undefined && [...sel.el.options].some((o) => o.value === String(v))) sel.el.value = String(v);
      }
    }

    updateUndo() {
      if (this.undoBtn) this.undoBtn.disabled = !this.undoStack.length;
    }

    showError(e) {
      if (e instanceof DT.UserError) this.setStatus([e.key, e.params], true);
      else {
        console.error(e); // eslint-disable-line no-console
        this.setStatus(['err.internal', { m: e.message }], true);
      }
    }

    setStatus(msg, error) {
      this.statusEl.textContent = msg ? R(msg) : '';
      this.statusEl.classList.toggle('error', !!error);
    }

    /* ------------------------------------------------------------------ */
    /* Lecteur                                                             */
    /* ------------------------------------------------------------------ */

    buildPlayer() {
      const p = document.getElementById('player');
      p.innerHTML =
        `<div class="pbtns">` +
        `<button class="pbtn" data-a="first" data-i18n-title="player.first">${ICONS.first}</button>` +
        `<button class="pbtn" data-a="prev" data-i18n-title="player.prev">${ICONS.prev}</button>` +
        `<button class="pbtn play" data-a="toggle" data-i18n-title="player.play">${ICONS.play}</button>` +
        `<button class="pbtn" data-a="next" data-i18n-title="player.next">${ICONS.next}</button>` +
        `<button class="pbtn" data-a="last" data-i18n-title="player.last">${ICONS.last}</button>` +
        `</div><div class="progress"><input type="range" min="0" max="0" value="0" class="scrub">` +
        `<span class="counter">0 / 0</span></div>` +
        `<label class="speed"><span data-i18n="player.speed"></span><input type="range" min="1" max="10" class="spd"></label>` +
        `<button class="icon-btn" data-a="panel" data-i18n-title="panel.toggle">${ICONS.panel}</button>`;
      p.querySelectorAll('[data-a]').forEach((b) =>
        b.addEventListener('click', () => {
          const a = b.dataset.a;
          if (a === 'panel') {
            document.querySelector('.viz-main').classList.toggle('panel-hidden');
            return;
          }
          this.player[a]();
        })
      );
      this.scrub = p.querySelector('.scrub');
      this.scrub.addEventListener('input', () => {
        this.player.pause();
        this.player.goto(+this.scrub.value, false);
      });
      const spd = p.querySelector('.spd');
      let saved = 5;
      try {
        saved = +(localStorage.getItem('dt-speed') || 5);
      } catch (e) {
        /* ignoré */
      }
      spd.value = saved;
      this.player.setSpeed(saved);
      spd.addEventListener('input', () => {
        this.player.setSpeed(+spd.value);
        try {
          localStorage.setItem('dt-speed', spd.value);
        } catch (e) {
          /* ignoré */
        }
      });
      this.counter = p.querySelector('.counter');
      this.playBtn = p.querySelector('.play');

      const zoom = document.getElementById('zoom');
      zoom.innerHTML =
        `<button class="icon-btn" data-z="in" data-i18n-title="zoom.in">${ICONS.plus}</button>` +
        `<button class="icon-btn" data-z="out" data-i18n-title="zoom.out">${ICONS.minus}</button>` +
        `<button class="icon-btn" data-z="fit" data-i18n-title="zoom.fit">${ICONS.fit}</button>`;
      zoom.querySelectorAll('[data-z]').forEach((b) =>
        b.addEventListener('click', () => {
          const z = b.dataset.z;
          if (z === 'fit') this.renderer.fit();
          else this.renderer.zoom(z === 'in' ? 0.8 : 1.25);
        })
      );
    }

    updatePlayerUI() {
      const n = this.player.frames.length;
      this.scrub.max = Math.max(0, n - 1);
      this.scrub.value = this.player.i;
      this.counter.textContent = `${n ? this.player.i + 1 : 0} / ${n}`;
      this.playBtn.innerHTML = this.player.playing ? ICONS.pause : ICONS.play;
    }

    onFrame(i) {
      const f = this.frames[i];
      if (!f) return;
      // message courant : celui de l'étape, ou le dernier message non vide avant elle
      let j = i;
      while (j > 0 && !this.frames[j].msg) j--;
      const m = this.frames[j].msg;
      this.setStatus(m);
      this.lastMsgFrame = j;
      this.updateLogCursor(j, i);
      this.highlightCode(f);
      this.updatePlayerUI();
    }

    bindKeys() {
      document.addEventListener('keydown', (e) => {
        const tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
        if (e.key === ' ') {
          e.preventDefault();
          this.player.toggle();
        } else if (e.key === 'ArrowRight') this.player.next();
        else if (e.key === 'ArrowLeft') this.player.prev();
        else if (e.key === 'Home') this.player.first();
        else if (e.key === 'End') this.player.last();
      });
    }

    /* ------------------------------------------------------------------ */
    /* Panneau latéral                                                     */
    /* ------------------------------------------------------------------ */

    buildSide() {
      const side = document.getElementById('side');
      side.innerHTML =
        `<div class="tabs"><button data-tab="steps" class="on" data-i18n="tab.steps"></button>` +
        `<button data-tab="code" data-i18n="tab.code"></button>` +
        `<button data-tab="info" data-i18n="tab.info"></button></div>` +
        `<div class="tab on" data-tab="steps"><ol class="log"></ol></div>` +
        `<div class="tab" data-tab="code"></div>` +
        `<div class="tab info" data-tab="info"></div>`;
      side.querySelectorAll('.tabs button').forEach((b) =>
        b.addEventListener('click', () => {
          side.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('on', x === b));
          side.querySelectorAll('.tab').forEach((x) => x.classList.toggle('on', x.dataset.tab === b.dataset.tab));
          if (b.dataset.tab === 'code') this.highlightCode(this.frames[this.player.i]);
        })
      );
      this.logEl = side.querySelector('.log');
      this.codeEl = side.querySelector('.tab[data-tab="code"]');
      this.infoEl = side.querySelector('.tab[data-tab="info"]');
      this.logEl.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (li) {
          this.player.pause();
          this.player.goto(+li.dataset.f, true);
        }
      });
      this.renderCode();
      this.renderInfo();
    }

    renderLog() {
      const html = [];
      this.frames.forEach((f, i) => {
        if (!f.msg) return;
        html.push(`<li data-f="${i}" class="${f.op ? 'op' : ''}">${escapeHtml(R(f.msg))}</li>`);
      });
      this.logEl.innerHTML = html.join('');
      this.logItems = [...this.logEl.children];
      this.updateLogCursor(this.lastMsgFrame, this.player.i);
    }

    updateLogCursor(j, i) {
      if (!this.logItems) return;
      let curEl = null;
      for (const li of this.logItems) {
        const f = +li.dataset.f;
        li.classList.toggle('cur', f === j);
        li.classList.toggle('future', f > i);
        if (f === j) curEl = li;
      }
      if (curEl && this.logEl.parentElement.classList.contains('on')) {
        const box = this.logEl.parentElement;
        const top = curEl.offsetTop - box.offsetTop;
        if (top < box.scrollTop + 10 || top > box.scrollTop + box.clientHeight - 40) {
          box.scrollTop = top - box.clientHeight / 2;
        }
      }
    }

    renderCode() {
      const code = this.Algo.code || {};
      const keys = Object.keys(code);
      if (!keys.length) {
        this.codeEl.innerHTML = `<p class="code-empty">${t('code.none')}</p>`;
        this.codeBlocks = {};
        return;
      }
      this.codeBlocks = {};
      this.codeEl.innerHTML = `<p class="code-empty">${t('code.from')}</p>`;
      for (const k of keys) {
        const block = code[k];
        const h = document.createElement('p');
        h.className = 'code-title';
        h.textContent = R(block.title);
        if (block.source) {
          const src = document.createElement('span');
          src.className = 'code-src ' + block.source;
          src.textContent = t('code.src.' + block.source);
          h.appendChild(src);
        }
        const pre = document.createElement('div');
        pre.className = 'code';
        pre.innerHTML = block.lines.map((l) => `<div>${highlightPython(l) || ' '}</div>`).join('');
        this.codeEl.appendChild(h);
        this.codeEl.appendChild(pre);
        this.codeBlocks[k] = pre;
      }
      if (this.frames.length) this.highlightCode(this.frames[this.player.i]);
    }

    highlightCode(f) {
      if (!this.codeBlocks) return;
      for (const pre of Object.values(this.codeBlocks)) {
        pre.querySelectorAll('.on').forEach((d) => d.classList.remove('on'));
      }
      if (!f || !f.code || !f.line) return;
      const pre = this.codeBlocks[f.code];
      if (!pre) return;
      const line = pre.children[f.line - 1];
      if (!line) return;
      line.classList.add('on');
      if (this.codeEl.classList.contains('on')) {
        const box = this.codeEl;
        const top = line.offsetTop - box.offsetTop;
        if (top < box.scrollTop + 20 || top > box.scrollTop + box.clientHeight - 40) {
          box.scrollTop = top - box.clientHeight / 3;
        }
      }
    }

    renderInfo() {
      const e = this.entry;
      let html = `<h2>${escapeHtml(R(e.name))}</h2>`;
      html += `<p>${R(e.desc)}</p>`;
      if (e.goal) html += `<p>${R(e.goal)}</p>`;
      if (e.details) html += `<p>${R(e.details)}</p>`;
      if (e.costs && e.costs.length) {
        html += `<table><tr><th>${t('info.ops')}</th><th>${t('info.cost')}</th></tr>`;
        for (const [op, cx] of e.costs) html += `<tr><td>${escapeHtml(R(op))}</td><td class="cx">${escapeHtml(R(cx))}</td></tr>`;
        html += '</table>';
      }
      if (this.Algo.legend) {
        html += '<div class="legend">';
        for (const [color, label] of this.Algo.legend) {
          html += `<span><i style="border-color:${color}"></i>${escapeHtml(R(label))}</span>`;
        }
        html += '</div>';
      }
      html += `<p>${t('info.keys')}</p>`;
      html += `<p><a href="examples.html#${e.id}">${t('info.examples')}</a></p>`;
      html += `<p class="credits">${t('info.credits')}</p>`;
      this.infoEl.innerHTML = html;
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  DT.App = App;
})();
