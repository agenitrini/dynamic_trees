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
 * Moteur de rendu SVG : affiche une scène et anime la transition depuis la
 * scène précédente (interpolation des positions et de l'opacité des éléments
 * de même identifiant). Gère aussi le cadrage automatique, le zoom et le
 * déplacement à la souris / au doigt.
 */
(function () {
  'use strict';

  const DT = (window.DT = window.DT || {});
  const NS = 'http://www.w3.org/2000/svg';
  const R = (v) => DT.i18n.resolve(v);

  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;

  /** Taille de police adaptée à la longueur d'une étiquette. */
  function fitFont(label, room, base) {
    const n = String(label).length;
    if (n <= 2) return base;
    return Math.max(9, Math.min(base, (room * 1.7) / n));
  }

  class Renderer {
    constructor(svg) {
      this.svg = svg;
      svg.classList.add('scene');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      // l'anneau de surbrillance est sous les nœuds : il dépasse du nœud sans masquer sa pastille
      this.gE = el('g', { class: 'edges' }, svg);
      this.gR = el('g', { class: 'rings' }, svg);
      this.gN = el('g', { class: 'nodes' }, svg);
      this.gT = el('g', { class: 'texts' }, svg);
      this.els = new Map();
      this.vb = { x: -400, y: -80, w: 800, h: 500 };
      this.vbFrom = null;
      this.vbTo = null;
      this.auto = true;
      this.raf = null;
      this.scene = null;
      this.applyViewBox();
      this.initInteraction();
      if (window.ResizeObserver) {
        new ResizeObserver(() => {
          if (this.auto && this.scene) {
            this.vb = this.fitBox(this.scene);
            this.applyViewBox();
          }
        }).observe(svg);
      }
    }

    /* ------------------------------------------------------------------ */
    /* Affichage d'une scène                                               */
    /* ------------------------------------------------------------------ */

    /** Affiche la scène ; anime pendant dur ms puis appelle done(). */
    render(scene, dur, done) {
      this.scene = scene;
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;

      for (const rec of this.els.values()) rec.from = Object.assign({}, rec.cur);
      const seen = new Set();
      for (const item of scene.items) {
        seen.add(item.id);
        let rec = this.els.get(item.id);
        if (rec && rec.type !== item.type) {
          rec.g.remove();
          this.els.delete(item.id);
          rec = null;
        }
        if (!rec) {
          rec = this.create(item);
          const start = item.enter || item;
          rec.cur = { x: start.x || 0, y: start.y || 0, o: 0 };
          if (item.type === 'ring') Object.assign(rec.cur, { r: item.r, w: item.w, h: item.h });
          rec.from = Object.assign({}, rec.cur);
          this.els.set(item.id, rec);
        }
        rec.spec = item;
        rec.removing = false;
        rec.to = { x: item.x || 0, y: item.y || 0, o: item.opacity !== undefined ? item.opacity : 1 };
        if (item.type === 'ring') Object.assign(rec.to, { r: item.r, w: item.w, h: item.h });
        this.build(rec);
      }
      for (const rec of this.els.values()) {
        if (!seen.has(rec.id)) {
          rec.removing = true;
          rec.to = Object.assign({}, rec.cur, { o: 0 });
        }
      }

      this.vbFrom = Object.assign({}, this.vb);
      this.vbTo = this.auto ? this.fitBox(scene) : null;

      if (!dur || dur <= 0 || document.hidden) {
        this.tick(1);
        this.finish();
        if (done) done();
        return;
      }
      const t0 = performance.now();
      const loop = (now) => {
        const t = Math.min(1, (now - t0) / dur);
        this.tick(ease(t));
        if (t < 1) this.raf = requestAnimationFrame(loop);
        else {
          this.raf = null;
          this.finish();
          if (done) done();
        }
      };
      this.raf = requestAnimationFrame(loop);
    }

    /** Termine immédiatement l'animation en cours. */
    stop() {
      if (this.raf) {
        cancelAnimationFrame(this.raf);
        this.raf = null;
        this.tick(1);
        this.finish();
      }
    }

    finish() {
      for (const [id, rec] of this.els) {
        if (rec.removing) {
          rec.g.remove();
          this.els.delete(id);
        }
      }
    }

    /** Reconstruit les libellés (changement de langue). */
    relabel() {
      for (const rec of this.els.values()) {
        rec.sig = null;
        this.build(rec);
      }
      this.tick(1);
    }

    tick(t) {
      for (const rec of this.els.values()) {
        const f = rec.from;
        const g = rec.to;
        rec.cur = {
          x: lerp(f.x, g.x, t),
          y: lerp(f.y, g.y, t),
          o: lerp(f.o, g.o, t),
        };
        if (rec.type === 'ring') {
          rec.cur.r = lerp(f.r || g.r || 0, g.r || 0, t);
          rec.cur.w = lerp(f.w || g.w || 0, g.w || 0, t);
          rec.cur.h = lerp(f.h || g.h || 0, g.h || 0, t);
        }
        if (rec.type !== 'edge') this.place(rec);
      }
      for (const rec of this.els.values()) if (rec.type === 'edge') this.placeEdge(rec);
      if (this.vbTo) {
        const a = this.vbFrom;
        const b = this.vbTo;
        this.vb = { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) };
        this.applyViewBox();
      }
    }

    /* ------------------------------------------------------------------ */
    /* Création et mise à jour des éléments                                */
    /* ------------------------------------------------------------------ */

    create(item) {
      const parent = { node: this.gN, edge: this.gE, text: this.gT, ring: this.gR }[item.type];
      const g = el('g', {}, parent);
      return { id: item.id, type: item.type, g, sig: null };
    }

    build(rec) {
      const s = rec.spec;
      if (rec.type === 'node') this.buildNode(rec, s);
      else if (rec.type === 'edge') this.buildEdge(rec, s);
      else if (rec.type === 'text') this.buildText(rec, s);
      else this.buildRing(rec, s);
    }

    buildNode(rec, s) {
      const g = rec.g;
      g.setAttribute('class', `n ${s.shape} ${s.cls || ''}`);
      const sig = [s.shape, s.r, s.w, s.h, s.keys ? s.keys.length : '', s.badge !== undefined && s.badge !== null,
        s.sub !== undefined && s.sub !== null, s.top !== undefined && s.top !== null].join('|');
      if (rec.sig !== sig) {
        rec.sig = sig;
        while (g.firstChild) g.firstChild.remove();
        rec.parts = {};
        const P = rec.parts;
        if (s.shape === 'circle' || s.shape === 'dot') {
          P.shape = el('circle', { r: s.r }, g);
          if (s.shape === 'circle') P.lbl = el('text', { class: 'lbl' }, g);
          if (s.badge !== undefined && s.badge !== null) {
            const b = el('g', { class: 'badge', transform: `translate(${s.r * 0.82},${-s.r * 0.82})` }, g);
            el('circle', { r: 9 }, b);
            P.badge = el('text', {}, b);
          }
        } else if (s.shape === 'keys') {
          const w = s.w;
          const h = s.h;
          P.shape = el('rect', { class: 'box', x: -w / 2, y: -h / 2, width: w, height: h, rx: 7 }, g);
          P.cells = [];
          P.keyTexts = [];
          const n = Math.max(1, s.keys.length);
          for (let i = 0; i < n; i++) {
            const x0 = -w / 2 + i * s.cellW;
            P.cells.push(el('rect', { class: 'kcell', x: x0 + 2, y: -h / 2 + 2, width: s.cellW - 4, height: h - 4, rx: 5 }, g));
            if (i > 0) el('line', { class: 'sepl', x1: x0, x2: x0, y1: -h / 2, y2: h / 2 }, g);
            P.keyTexts.push(el('text', { class: 'lbl', x: x0 + s.cellW / 2 }, g));
          }
        } else {
          const cls = s.shape === 'cell' ? 'cell' : 'box';
          P.shape = el('rect', { class: cls, x: -s.w / 2, y: -s.h / 2, width: s.w, height: s.h, rx: s.shape === 'cell' ? 4 : 9 }, g);
          P.lbl = el('text', { class: 'lbl' }, g);
        }
        const hh = s.shape === 'circle' || s.shape === 'dot' ? s.r : s.h / 2;
        if (s.sub !== undefined && s.sub !== null) P.sub = el('text', { class: 'sub', y: hh + 11 }, g);
        if (s.top !== undefined && s.top !== null) P.top = el('text', { class: 'top', y: -hh - 10 }, g);
      }
      const P = rec.parts;
      if (P.lbl) {
        const label = R(s.label);
        P.lbl.textContent = label;
        const room = s.shape === 'circle' ? s.r * 2 - 6 : s.w - 8;
        P.lbl.style.fontSize = (s.fontSize || fitFont(label, room, s.shape === 'circle' ? 15 : 14)) + 'px';
      }
      if (P.keyTexts) {
        P.keyTexts.forEach((t, i) => {
          const label = s.keys[i] !== undefined ? R(s.keys[i]) : '';
          t.textContent = label;
          t.style.fontSize = fitFont(label, s.cellW - 6, 14) + 'px';
          P.cells[i].setAttribute('class', 'kcell ' + ((s.keyCls && s.keyCls[i]) || ''));
        });
      }
      if (P.badge) P.badge.textContent = R(s.badge);
      if (P.sub) P.sub.textContent = R(s.sub);
      if (P.top) P.top.textContent = R(s.top);
      if (s.title) {
        if (!P.title) P.title = el('title', {}, g);
        P.title.textContent = R(s.title);
      }
    }

    buildEdge(rec, s) {
      const g = rec.g;
      g.setAttribute('class', `e ${s.cls || ''}`);
      const sig = [!!s.arrow, s.label !== undefined && s.label !== null && s.label !== ''].join('|');
      if (rec.sig !== sig) {
        rec.sig = sig;
        while (g.firstChild) g.firstChild.remove();
        rec.parts = { path: el('path', {}, g) };
        if (s.arrow) rec.parts.head = el('path', { class: 'arrowhead' }, g);
        if (sig.endsWith('true')) {
          rec.parts.bg = el('rect', { class: 'elbl', rx: 4 }, g);
          rec.parts.lbl = el('text', {}, g);
        }
      }
      if (rec.parts.lbl) {
        const t = R(s.label);
        rec.parts.lbl.textContent = t;
        rec.labelW = 7.2 * t.length + 8;
      }
    }

    buildText(rec, s) {
      const g = rec.g;
      g.setAttribute('class', `t ${s.cls || ''}`);
      if (!rec.parts) rec.parts = { t: el('text', {}, g) };
      rec.parts.t.style.textAnchor = s.anchor || 'middle';
      if (s.size) rec.parts.t.style.fontSize = s.size + 'px';
      rec.parts.t.textContent = R(s.text);
    }

    buildRing(rec, s) {
      const g = rec.g;
      g.setAttribute('class', `ring ${s.cls || ''}`);
      const kind = s.r ? 'circle' : 'rect';
      if (rec.sig !== kind) {
        rec.sig = kind;
        while (g.firstChild) g.firstChild.remove();
        rec.parts = { shape: el(kind, kind === 'rect' ? { rx: 10 } : {}, g) };
      }
    }

    /* ------------------------------------------------------------------ */
    /* Positionnement                                                      */
    /* ------------------------------------------------------------------ */

    place(rec) {
      const c = rec.cur;
      rec.g.setAttribute('transform', `translate(${c.x.toFixed(2)},${c.y.toFixed(2)})`);
      rec.g.style.opacity = Math.max(0, Math.min(1, c.o)).toFixed(3);
      if (rec.type === 'ring') {
        const sh = rec.parts.shape;
        if (rec.sig === 'circle') sh.setAttribute('r', Math.max(0, c.r).toFixed(2));
        else {
          sh.setAttribute('x', (-c.w / 2).toFixed(2));
          sh.setAttribute('y', (-c.h / 2).toFixed(2));
          sh.setAttribute('width', Math.max(0, c.w).toFixed(2));
          sh.setAttribute('height', Math.max(0, c.h).toFixed(2));
        }
      }
    }

    /** Point d'attache sur le bord du nœud rec, dans la direction de (tx, ty). */
    anchor(rec, tx, ty, port, side) {
      const s = rec.spec;
      const c = rec.cur;
      if (side) {
        const hw = s.shape === 'circle' || s.shape === 'dot' ? s.r : s.w / 2;
        const hh = s.shape === 'circle' || s.shape === 'dot' ? s.r : s.h / 2;
        if (side === 'bottom') return { x: c.x, y: c.y + hh };
        if (side === 'top') return { x: c.x, y: c.y - hh };
        if (side === 'left') return { x: c.x - hw, y: c.y };
        if (side === 'right') return { x: c.x + hw, y: c.y };
      }
      if (s.shape === 'keys' && port !== undefined && port !== null) {
        return { x: c.x - s.w / 2 + port * s.cellW, y: c.y + s.h / 2 };
      }
      const dx = tx - c.x;
      const dy = ty - c.y;
      const len = Math.hypot(dx, dy) || 1;
      if (s.shape === 'circle' || s.shape === 'dot') {
        return { x: c.x + (dx / len) * s.r, y: c.y + (dy / len) * s.r };
      }
      const hw = s.w / 2;
      const hh = s.h / 2;
      const k = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
      return { x: c.x + dx * k, y: c.y + dy * k };
    }

    placeEdge(rec) {
      const s = rec.spec;
      const a = this.els.get(s.from);
      const b = this.els.get(s.to);
      if (!a || !b || !a.spec || !b.spec) {
        rec.g.style.opacity = 0;
        return;
      }
      let ax = a.cur.x;
      let ay = a.cur.y;
      if (a.spec.shape === 'keys' && s.port !== undefined && s.port !== null) {
        ax = a.cur.x - a.spec.w / 2 + s.port * a.spec.cellW;
        ay = a.cur.y + a.spec.h / 2;
      }
      const p2 = this.anchor(b, ax, ay, s.toPort, s.toSide);
      const p1 = this.anchor(a, p2.x, p2.y, s.port, s.fromSide);
      let x1 = p1.x;
      let y1 = p1.y;
      let x2 = p2.x;
      let y2 = p2.y;
      const len = Math.hypot(x2 - x1, y2 - y1) || 1;
      const curve = s.curve || 0;
      // point de contrôle d'une courbe de Bézier quadratique
      const mx = (x1 + x2) / 2 - ((y2 - y1) / len) * curve * len;
      const my = (y1 + y2) / 2 + ((x2 - x1) / len) * curve * len;
      let tx = curve ? x2 - mx : x2 - x1;
      let ty = curve ? y2 - my : y2 - y1;
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      if (s.arrow) {
        const hl = 9;
        const ex = x2;
        const ey = y2;
        x2 -= tx * hl * 0.8;
        y2 -= ty * hl * 0.8;
        const px = -ty;
        const py = tx;
        rec.parts.head.setAttribute(
          'd',
          `M${ex.toFixed(1)},${ey.toFixed(1)} L${(ex - tx * hl + px * 4.5).toFixed(1)},${(ey - ty * hl + py * 4.5).toFixed(1)} ` +
            `L${(ex - tx * hl - px * 4.5).toFixed(1)},${(ey - ty * hl - py * 4.5).toFixed(1)} Z`
        );
      }
      const d = curve
        ? `M${x1.toFixed(1)},${y1.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`
        : `M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)}`;
      rec.parts.path.setAttribute('d', d);
      if (rec.parts.lbl) {
        let lx = curve ? 0.25 * x1 + 0.5 * mx + 0.25 * x2 : (x1 + x2) / 2;
        let ly = curve ? 0.25 * y1 + 0.5 * my + 0.25 * y2 : (y1 + y2) / 2;
        if (s.labelAt !== undefined) {
          lx = x1 + (x2 - x1) * s.labelAt;
          ly = y1 + (y2 - y1) * s.labelAt;
        }
        rec.parts.lbl.setAttribute('x', lx.toFixed(1));
        rec.parts.lbl.setAttribute('y', ly.toFixed(1));
        rec.parts.bg.setAttribute('x', (lx - rec.labelW / 2).toFixed(1));
        rec.parts.bg.setAttribute('y', (ly - 8).toFixed(1));
        rec.parts.bg.setAttribute('width', rec.labelW.toFixed(1));
        rec.parts.bg.setAttribute('height', 16);
      }
      const o = Math.min(rec.cur.o, a.cur.o, b.cur.o);
      rec.g.style.opacity = Math.max(0, Math.min(1, o)).toFixed(3);
    }

    /* ------------------------------------------------------------------ */
    /* Cadrage, zoom et déplacement                                        */
    /* ------------------------------------------------------------------ */

    bbox(scene) {
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      const add = (a, b, c, d) => {
        x0 = Math.min(x0, a);
        y0 = Math.min(y0, b);
        x1 = Math.max(x1, c);
        y1 = Math.max(y1, d);
      };
      for (const it of scene.items) {
        if (it.type === 'node') {
          const hw = it.shape === 'circle' || it.shape === 'dot' ? it.r : it.w / 2;
          const hh = it.shape === 'circle' || it.shape === 'dot' ? it.r : it.h / 2;
          add(it.x - hw, it.y - hh - (it.top !== undefined && it.top !== null ? 18 : 0), it.x + hw,
            it.y + hh + (it.sub !== undefined && it.sub !== null ? 18 : 0));
        } else if (it.type === 'text') {
          const w = String(R(it.text)).length * (it.size ? it.size * 0.55 : 7.8);
          const a = it.anchor === 'start' ? 0 : it.anchor === 'end' ? 1 : 0.5;
          add(it.x - w * a, it.y - 10, it.x + w * (1 - a), it.y + 10);
        } else if (it.type === 'ring') {
          const hw = it.r || it.w / 2;
          const hh = it.r || it.h / 2;
          add(it.x - hw, it.y - hh, it.x + hw, it.y + hh);
        }
      }
      if (x0 === Infinity) return { x: -200, y: -100, w: 400, h: 300 };
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }

    fitBox(scene) {
      const b = this.bbox(scene);
      const cw = this.svg.clientWidth || 800;
      const ch = this.svg.clientHeight || 500;
      const pad = 30;
      // place réservée en haut pour le message d'état (en pixels écran)
      const top = Math.min(ch * 0.4, this.topReserve ? this.topReserve() : 64);
      const bw = b.w + 2 * pad;
      const bh = b.h + 2 * pad;
      const scale = Math.min(cw / bw, (ch - top) / bh, 1.25);
      const w = cw / scale;
      const h = ch / scale;
      const avail = (ch - top) / scale;
      return { x: b.x + b.w / 2 - w / 2, y: b.y - pad - top / scale - (avail - bh) / 2, w, h };
    }

    applyViewBox() {
      const v = this.vb;
      this.svg.setAttribute('viewBox', `${v.x.toFixed(2)} ${v.y.toFixed(2)} ${v.w.toFixed(2)} ${v.h.toFixed(2)}`);
    }

    /** Recadre automatiquement (bouton « recentrer »). */
    fit() {
      this.auto = true;
      if (!this.scene) return;
      const from = Object.assign({}, this.vb);
      const to = this.fitBox(this.scene);
      const t0 = performance.now();
      const loop = (now) => {
        const t = ease(Math.min(1, (now - t0) / 350));
        this.vb = { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t), w: lerp(from.w, to.w, t), h: lerp(from.h, to.h, t) };
        this.applyViewBox();
        if (t < 1) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    zoom(factor, cx, cy) {
      this.auto = false;
      this.vbTo = null;
      const v = this.vb;
      const rect = this.svg.getBoundingClientRect();
      // coordonnées de la scène sous le point (cx, cy) de l'écran
      const sx = cx === undefined ? v.x + v.w / 2 : v.x + ((cx - rect.left) / rect.width) * v.w;
      const sy = cy === undefined ? v.y + v.h / 2 : v.y + ((cy - rect.top) / rect.height) * v.h;
      const w = Math.min(Math.max(v.w * factor, 120), 20000);
      const h = (w / v.w) * v.h;
      this.vb = { x: sx - ((sx - v.x) * w) / v.w, y: sy - ((sy - v.y) * h) / v.h, w, h };
      this.applyViewBox();
    }

    initInteraction() {
      const svg = this.svg;
      svg.addEventListener(
        'wheel',
        (e) => {
          e.preventDefault();
          this.zoom(Math.exp(e.deltaY * 0.0015), e.clientX, e.clientY);
        },
        { passive: false }
      );
      let drag = null;
      const pointers = new Map();
      svg.addEventListener('pointerdown', (e) => {
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        svg.setPointerCapture(e.pointerId);
        if (pointers.size === 1) {
          drag = { x: e.clientX, y: e.clientY, vb: Object.assign({}, this.vb), moved: false };
        } else if (pointers.size === 2) {
          const [p, q] = [...pointers.values()];
          drag = { pinch: Math.hypot(p.x - q.x, p.y - q.y), vb: Object.assign({}, this.vb) };
        }
      });
      svg.addEventListener('pointermove', (e) => {
        if (!drag || !pointers.has(e.pointerId)) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const rect = svg.getBoundingClientRect();
        if (drag.pinch && pointers.size === 2) {
          const [p, q] = [...pointers.values()];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          this.vb = Object.assign({}, drag.vb);
          this.zoom(drag.pinch / d, (p.x + q.x) / 2, (p.y + q.y) / 2);
          return;
        }
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) < 3) return;
        drag.moved = true;
        svg.classList.add('dragging');
        this.auto = false;
        this.vbTo = null;
        this.vb = {
          x: drag.vb.x - (dx / rect.width) * drag.vb.w,
          y: drag.vb.y - (dy / rect.height) * drag.vb.h,
          w: drag.vb.w,
          h: drag.vb.h,
        };
        this.applyViewBox();
      });
      const end = (e) => {
        pointers.delete(e.pointerId);
        if (pointers.size === 0) {
          drag = null;
          svg.classList.remove('dragging');
        }
      };
      svg.addEventListener('pointerup', end);
      svg.addEventListener('pointercancel', end);
      svg.addEventListener('dblclick', () => this.fit());
    }
  }

  DT.Renderer = Renderer;
})();
