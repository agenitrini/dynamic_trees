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
 * Scène, mise en page des arbres et classe de base des algorithmes.
 *
 * Principe : un algorithme manipule un modèle de données pur (this.s) ; à chaque
 * étape intéressante il appelle this.step(message). L'étape capture une « scène »
 * (liste de nœuds, arêtes, textes positionnés) dessinée par this.draw(). Le
 * moteur de rendu anime ensuite le passage d'une scène à la suivante en
 * interpolant les positions des éléments de même identifiant.
 */
(function () {
  'use strict';

  const DT = (window.DT = window.DT || {});

  /* ------------------------------------------------------------------------
     Scène
     ------------------------------------------------------------------------ */
  class Scene {
    constructor() {
      this.items = [];
      this.byId = new Map();
    }

    _add(item) {
      if (this.byId.has(item.id)) {
        // identifiant déjà utilisé : on remplace (le dernier dessin l'emporte)
        const i = this.items.indexOf(this.byId.get(item.id));
        this.items[i] = item;
      } else {
        this.items.push(item);
      }
      this.byId.set(item.id, item);
      return item;
    }

    /**
     * Nœud. Formes : circle (r), keys (liste de clés, cellW, h), box (w, h),
     * cell (w, h), dot (r). Champs optionnels : label, sub (sous le nœud),
     * top (au-dessus), badge (pastille), cls (classes CSS), enter ({x, y} :
     * position d'apparition), keyCls (classes par clé).
     */
    node(id, spec) {
      const n = Object.assign({ shape: 'circle' }, spec, { id: String(id), type: 'node' });
      if (n.shape === 'circle' && n.r === undefined) n.r = 20;
      if (n.shape === 'dot' && n.r === undefined) n.r = 6;
      if (n.shape === 'keys') {
        n.cellW = n.cellW || 34;
        n.h = n.h || 32;
        n.w = Math.max(1, n.keys.length) * n.cellW;
      }
      if ((n.shape === 'box' || n.shape === 'cell') && n.w === undefined) n.w = 40;
      if ((n.shape === 'box' || n.shape === 'cell') && n.h === undefined) n.h = 34;
      return this._add(n);
    }

    /** Arête de from vers to. Options : label, cls, port (indice de port du nœud source), arrow, curve. */
    edge(from, to, spec) {
      spec = spec || {};
      const id = spec.id || `e:${from}>${to}`;
      return this._add(Object.assign({}, spec, { id, type: 'edge', from: String(from), to: String(to) }));
    }

    /** Texte libre. Options : cls, anchor (start | middle | end). */
    text(id, x, y, text, spec) {
      return this._add(Object.assign({ anchor: 'middle' }, spec || {}, { id: String(id), type: 'text', x, y, text }));
    }

    /** Anneau de surbrillance (cercle de rayon r ou rectangle w × h). */
    ring(id, spec) {
      return this._add(Object.assign({}, spec, { id: String(id), type: 'ring' }));
    }

    get(id) {
      return this.byId.get(String(id));
    }
  }

  DT.Scene = Scene;

  /* ------------------------------------------------------------------------
     Mise en page « compacte » d'arbres (contours à la Reingold–Tilford)
     ------------------------------------------------------------------------ */

  /**
   * Calcule la position de chaque nœud d'un arbre.
   *
   * opts.children(n) : liste des enfants, qui peut contenir null pour réserver
   *                    une place vide (ex. enfant gauche absent d'un ABR) ;
   * opts.width(n)    : largeur du nœud (défaut 40) ;
   * opts.gap         : espace horizontal minimal entre sous-arbres voisins ;
   * opts.phantom     : largeur réservée pour un enfant null ;
   * opts.levelGap    : distance verticale entre deux niveaux ;
   * opts.x, opts.y   : position de la racine.
   *
   * Renvoie { pos: Map(nœud -> {x, y, depth}), minX, maxX, maxDepth }.
   */
  function layoutTree(root, opts) {
    const o = Object.assign(
      { width: () => 40, gap: 14, phantom: 26, levelGap: 72, x: 0, y: 0 },
      opts
    );
    const offset = new Map();
    const pos = new Map();
    if (!root) return { pos, minX: o.x, maxX: o.x, maxDepth: -1 };

    function rec(n) {
      const w = o.width(n);
      const kids = o.children(n) || [];
      if (!kids.some((k) => k)) return { left: [-w / 2], right: [w / 2] };

      const res = kids.map((k) =>
        k ? rec(k) : { left: [-o.phantom / 2], right: [o.phantom / 2], phantom: true }
      );
      const at = [];
      let accL = [];
      let accR = [];
      res.forEach((r, i) => {
        let p = 0;
        if (i > 0) {
          p = -Infinity;
          const m = Math.min(accR.length, r.left.length);
          for (let d = 0; d < m; d++) p = Math.max(p, accR[d] - r.left[d] + o.gap);
          p = Math.max(p, at[i - 1]);
        }
        at.push(p);
        for (let d = 0; d < r.left.length; d++) {
          accL[d] = accL[d] === undefined ? r.left[d] + p : Math.min(accL[d], r.left[d] + p);
          accR[d] = accR[d] === undefined ? r.right[d] + p : Math.max(accR[d], r.right[d] + p);
        }
      });
      const mid = (at[0] + at[at.length - 1]) / 2;
      kids.forEach((k, i) => {
        if (k) offset.set(k, at[i] - mid);
      });
      return {
        left: [-w / 2].concat(accL.map((v) => v - mid)),
        right: [w / 2].concat(accR.map((v) => v - mid)),
      };
    }

    const c = rec(root);
    let minX = Infinity;
    let maxX = -Infinity;
    let maxDepth = 0;
    (function place(n, x, depth) {
      pos.set(n, { x, y: o.y + depth * o.levelGap, depth });
      const w = o.width(n);
      minX = Math.min(minX, x - w / 2);
      maxX = Math.max(maxX, x + w / 2);
      maxDepth = Math.max(maxDepth, depth);
      for (const k of o.children(n) || []) if (k) place(k, x + offset.get(k), depth + 1);
    })(root, o.x, 0);
    // les enfants fantômes peuvent dépasser : on prend aussi les contours
    minX = Math.min(minX, o.x + Math.min(...c.left));
    maxX = Math.max(maxX, o.x + Math.max(...c.right));
    return { pos, minX, maxX, maxDepth };
  }

  /** Raccourci pour un arbre binaire (champs left / right). */
  function layoutBinary(root, opts) {
    return layoutTree(
      root,
      Object.assign(
        {
          children: (n) => (n.left || n.right ? [n.left, n.right] : []),
          width: () => 40,
        },
        opts
      )
    );
  }

  /**
   * Place plusieurs arbres côte à côte (forêt). Renvoie la même structure
   * que layoutTree, avec en plus la liste des boîtes englobantes par arbre.
   */
  function layoutForest(roots, opts) {
    const o = Object.assign({ treeGap: 40, x: 0 }, opts);
    const pos = new Map();
    const boxes = [];
    let x = o.x;
    let maxDepth = -1;
    for (const r of roots) {
      const L = layoutTree(r, Object.assign({}, o, { x: 0 }));
      const dx = x - L.minX;
      for (const [n, p] of L.pos) pos.set(n, { x: p.x + dx, y: p.y, depth: p.depth });
      boxes.push({ root: r, minX: L.minX + dx, maxX: L.maxX + dx, rootX: dx });
      x = L.maxX + dx + o.treeGap;
      maxDepth = Math.max(maxDepth, L.maxDepth);
    }
    return { pos, boxes, minX: o.x, maxX: x - o.treeGap, maxDepth };
  }

  DT.layout = { tree: layoutTree, binary: layoutBinary, forest: layoutForest };

  /* ------------------------------------------------------------------------
     Outils
     ------------------------------------------------------------------------ */
  DT.util = {
    /** Entier aléatoire dans [a, b]. */
    rand(a, b) {
      return a + Math.floor(Math.random() * (b - a + 1));
    },
    /** k entiers distincts aléatoires dans [a, b]. */
    randDistinct(k, a, b) {
      const s = new Set();
      while (s.size < Math.min(k, b - a + 1)) s.add(DT.util.rand(a, b));
      return [...s];
    },
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
    /** Code binaire sur `bits` bits de la lettre (A = 1, ..., Z = 26), comme dans le cours. */
    letterCode(c, bits) {
      const v = c.toUpperCase().charCodeAt(0) - 64;
      return v.toString(2).padStart(bits || 5, '0');
    },
  };

  /* ------------------------------------------------------------------------
     Classe de base des algorithmes
     ------------------------------------------------------------------------ */
  class Algo {
    constructor() {
      this.s = this.initState();
      this.marks = new Map(); // id de nœud (ou id#i pour une clé) -> classe
      this.edgeMarks = new Map(); // "from>to" -> classe
      this.rings = new Map(); // nom -> { at: id de nœud, cls }
      this.floats = new Map(); // nom -> nœud flottant (bulle qui suit le parcours)
      this.frames = null;
      this.codeKey = null;
    }

    /** État initial (objet de données pur, clonable par structuredClone). */
    initState() {
      return { nextId: 1 };
    }

    newId() {
      return this.s.nextId++;
    }

    /* --- décorations ---------------------------------------------------- */
    mark(id, cls) {
      this.marks.set(String(id), cls);
    }
    unmark(id) {
      this.marks.delete(String(id));
    }
    markEdge(from, to, cls) {
      this.edgeMarks.set(`${from}>${to}`, cls);
    }
    unmarkEdge(from, to) {
      this.edgeMarks.delete(`${from}>${to}`);
    }
    /** Place un anneau de surbrillance (nommé) autour du nœud id. */
    ring(id, cls, name) {
      if (id === null || id === undefined) this.rings.delete(name || 'main');
      else this.rings.set(name || 'main', { at: String(id), cls: cls || '' });
    }
    /**
     * Nœud flottant nommé (ex. la clé en cours d'ajout) : spec contient id,
     * label, cls, et soit at (id d'un nœud de la scène, avec décalage dx, dy),
     * soit x, y. Passer null pour le retirer.
     */
    float(name, spec) {
      if (!spec) this.floats.delete(name);
      else this.floats.set(name, spec);
    }
    clearMarks() {
      this.marks.clear();
      this.edgeMarks.clear();
      this.rings.clear();
      this.floats.clear();
    }

    /* --- enregistrement des étapes ------------------------------------- */

    /** Choisit le bloc de pseudo-code affiché (clé de this.constructor.code). */
    code(key) {
      this.codeKey = key;
    }

    /**
     * Enregistre une étape. msg : clé de traduction, [clé, paramètres] ou null.
     * opts.line : ligne du pseudo-code à surligner (à partir de 1).
     */
    step(msg, opts) {
      if (!this.frames) return;
      opts = opts || {};
      this.frames.push({
        scene: this.snapshot(),
        msg: typeof msg === 'string' ? [msg] : msg,
        code: opts.code !== undefined ? opts.code : this.codeKey,
        line: opts.line || 0,
        op: !!opts.op,
      });
    }

    snapshot() {
      const S = new Scene();
      this.draw(S);
      for (const f of this.floats.values()) {
        const ref = f.at !== undefined && f.at !== null ? S.get(f.at) : null;
        const x = ref ? ref.x + (f.dx !== undefined ? f.dx : 36) : f.x || 0;
        const y = ref ? ref.y + (f.dy !== undefined ? f.dy : -34) : f.y || 0;
        const spec = Object.assign({ shape: 'circle', r: 17 }, f, { x, y });
        delete spec.at;
        S.node(f.id, spec);
      }
      for (const it of S.items) {
        if (it.type === 'node') {
          const m = this.marks.get(it.id);
          if (m) it.cls = (it.cls ? it.cls + ' ' : '') + m;
          if (it.shape === 'keys') {
            it.keyCls = it.keyCls ? it.keyCls.slice() : [];
            it.keys.forEach((k, i) => {
              const km = this.marks.get(`${it.id}#${i}`);
              if (km) it.keyCls[i] = km;
            });
          }
        } else if (it.type === 'edge') {
          const m = this.edgeMarks.get(`${it.from}>${it.to}`);
          if (m) it.cls = (it.cls ? it.cls + ' ' : '') + m;
        }
      }
      for (const [name, r] of this.rings) {
        const n = S.get(r.at);
        if (!n) continue;
        const spec = { x: n.x, y: n.y, cls: r.cls };
        if (n.shape === 'circle' || n.shape === 'dot') spec.r = n.r + 6;
        else {
          spec.w = n.w + 12;
          spec.h = n.h + 12;
        }
        S.ring('ring:' + name, spec);
      }
      return S;
    }

    /** Exécute fn en enregistrant les étapes ; renvoie la liste des étapes. */
    record(fn) {
      this.frames = [];
      this.clearMarks();
      try {
        fn();
      } finally {
        this.clearMarks();
        this.codeKey = null;
      }
      const frames = this.frames;
      this.frames = null;
      return frames;
    }

    save() {
      return structuredClone(this.s);
    }

    restore(state) {
      this.s = structuredClone(state);
    }

    /** Vide la structure en conservant ses réglages (this.s.cfg). */
    clear() {
      const cfg = this.s.cfg;
      this.s = this.initState();
      if (cfg) this.s.cfg = cfg;
      this.step('msg.cleared');
    }

    /** Dessine l'état courant dans la scène S (à redéfinir). */
    draw(S) {} // eslint-disable-line no-unused-vars

    /** Analyse une saisie ; renvoie la liste des valeurs (défaut : entiers). */
    parse(name, raw) {
      const parts = String(raw).split(/[\s,;]+/).filter(Boolean);
      const out = [];
      for (const p of parts) {
        if (!/^-?\d+$/.test(p)) throw new DT.UserError('err.int', { v: p });
        const v = parseInt(p, 10);
        if (Math.abs(v) > 9999) throw new DT.UserError('err.range', { v: p });
        out.push(v);
      }
      return out;
    }
  }

  DT.Algo = Algo;

  /** Erreur de saisie affichée à l'utilisateur (message traduit). */
  class UserError extends Error {
    constructor(key, params) {
      super(key);
      this.key = key;
      this.params = params;
    }
  }
  DT.UserError = UserError;

  /** Registre des algorithmes (alimenté par js/algos/*.js). */
  DT.algos = DT.algos || {};
  DT.register = function (id, cls) {
    DT.algos[id] = cls;
  };
})();
