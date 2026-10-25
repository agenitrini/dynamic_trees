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

/* Filtre de Bloom (chapitre 4). */
(function () {
  'use strict';

  const DT = window.DT;

  const SUBS = '₀₁₂₃₄₅₆₇₈₉';
  const sub = (n) => String(n).split('').map((c) => SUBS[+c]).join('');
  const dec = (v, n) => ({ fr: v.toFixed(n).replace('.', ','), en: v.toFixed(n) });

  /*
   * Fonctions de hachage : h_i(s) = ((Σ s_j · b_i^(L−1−j)) mod 1009) mod m,
   * avec s_j le rang de la lettre (a = 1, ..., z = 26), calculé par Horner, et
   * des bases distinctes b = 31, 37, 41, 43 (hachage polynomial du cours).
   */
  const BASES = [31, 37, 41, 43];
  const P = 1009;

  DT.i18n.add({
    fr: {
      'bloom.ctl.m': 'm =',
      'bloom.ctl.k': 'k =',
      'bloom.op.setM': 'Taille du filtre : m = {x} bits',
      'bloom.op.setK': 'Nombre de fonctions : k = {x}',
      'bloom.setM': 'Filtre de m = {m} bits : le filtre est vidé.',
      'bloom.setK': 'k = {k} fonctions de hachage : le filtre est vidé.',
      'bloom.name': 'Filtre de Bloom',
      'bloom.title': (p) => `m = ${p.m} bits, k = ${p.k} fonction${p.k > 1 ? 's' : ''} de hachage`,
      'bloom.formula': 'h_i(s) = ((Σ s_j · b_i^(L−1−j)) mod 1009) mod {m},  b = {b},  a = 1, …, z = 26',
      'bloom.stats': (p) => `n = ${p.n} mot${p.n > 1 ? 's' : ''} ajouté${p.n > 1 ? 's' : ''}, ${p.b} bit${p.b > 1 ? 's' : ''} à 1 sur ${p.m}`,
      'bloom.prob': 'P(faux positif) ≈ (1 − e^(−kn/m))^k = (1 − e^(−{kn}/{m}))^{k} ≈ {p}',
      'bloom.real': 'Pour ce filtre : (bits à 1 / m)^k = ({b}/{m})^{k} ≈ {p}',
      'bloom.empty': 'Aucun mot ajouté.',
      'bloom.hashing': 'Ajout de « {x} » : on calcule ses {k} valeurs de hachage.',
      'bloom.again': '« {x} » a déjà été ajouté : ses bits sont déjà à 1.',
      'bloom.set': '{h}({x}) = {p} : F[{p}] passe à 1.',
      'bloom.setAlready': '{h}({x}) = {p} : F[{p}] vaut déjà 1.',
      'bloom.added': '« {x} » est ajouté au filtre.',
      'bloom.testing': 'Test de « {x} » : tous les bits F[h_i({x})] valent-ils 1 ?',
      'bloom.one': '{h}({x}) = {p} : F[{p}] = 1.',
      'bloom.zero': '{h}({x}) = {p} : F[{p}] = 0 → NON, « {x} » n’est sûrement pas dans l’ensemble.',
      'bloom.yes': 'Tous les bits valent 1 → OUI, et « {x} » a bien été ajouté.',
      'bloom.fp':
        'Tous les bits valent 1 → OUI… mais « {x} » n’a jamais été ajouté : c’est un FAUX POSITIF (ses bits ont été mis à 1 par d’autres mots).',
      'bloom.v.no': 'NON',
      'bloom.v.yes': 'OUI',
      'bloom.v.fp': 'OUI : faux positif !',
    },
    en: {
      'bloom.ctl.m': 'm =',
      'bloom.ctl.k': 'k =',
      'bloom.op.setM': 'Filter size: m = {x} bits',
      'bloom.op.setK': 'Number of functions: k = {x}',
      'bloom.setM': 'Filter of m = {m} bits: the filter is cleared.',
      'bloom.setK': 'k = {k} hash functions: the filter is cleared.',
      'bloom.name': 'Bloom filter',
      'bloom.title': (p) => `m = ${p.m} bits, k = ${p.k} hash function${p.k > 1 ? 's' : ''}`,
      'bloom.formula': 'h_i(s) = ((Σ s_j · b_i^(L−1−j)) mod 1009) mod {m},  b = {b},  a = 1, …, z = 26',
      'bloom.stats': (p) => `n = ${p.n} word${p.n > 1 ? 's' : ''} inserted, ${p.b} bit${p.b > 1 ? 's' : ''} set to 1 out of ${p.m}`,
      'bloom.prob': 'P(false positive) ≈ (1 − e^(−kn/m))^k = (1 − e^(−{kn}/{m}))^{k} ≈ {p}',
      'bloom.real': 'For this filter: (bits set / m)^k = ({b}/{m})^{k} ≈ {p}',
      'bloom.empty': 'No word inserted.',
      'bloom.hashing': 'Insert “{x}”: compute its {k} hash values.',
      'bloom.again': '“{x}” was already inserted: its bits are already 1.',
      'bloom.set': '{h}({x}) = {p}: F[{p}] becomes 1.',
      'bloom.setAlready': '{h}({x}) = {p}: F[{p}] is already 1.',
      'bloom.added': '“{x}” is added to the filter.',
      'bloom.testing': 'Test “{x}”: are all the bits F[h_i({x})] equal to 1?',
      'bloom.one': '{h}({x}) = {p}: F[{p}] = 1.',
      'bloom.zero': '{h}({x}) = {p}: F[{p}] = 0 → NO, “{x}” is certainly not in the set.',
      'bloom.yes': 'All the bits are 1 → YES, and “{x}” was indeed inserted.',
      'bloom.fp':
        'All the bits are 1 → YES… but “{x}” was never inserted: this is a FALSE POSITIVE (its bits were set by other words).',
      'bloom.v.no': 'NO',
      'bloom.v.yes': 'YES',
      'bloom.v.fp': 'YES: false positive!',
    },
  });

  const CW = 38; // espacement des cases

  class Bloom extends DT.Algo {
    initState(cfg) {
      cfg = cfg || { m: 16, k: 3 };
      return { nextId: 1, cfg: { m: cfg.m, k: cfg.k }, F: new Array(cfg.m).fill(0), words: [] };
    }

    clear() {
      this.s = this.initState(this.s.cfg);
      this.step('msg.cleared');
    }

    clearMarks() {
      super.clearMarks();
      this.cur = null;
    }

    parse(name, raw) {
      return DT.common.parseWords(raw);
    }

    setM(v) {
      const m = parseInt(v, 10);
      if (![8, 12, 16, 24, 32].includes(m)) throw new Error('m ' + v);
      this.s = this.initState({ m, k: this.s.cfg.k });
      this.step(['bloom.setM', { m }]);
    }

    setK(v) {
      const k = parseInt(v, 10);
      if (!(k >= 1 && k <= 4)) throw new Error('k ' + v);
      this.s = this.initState({ m: this.s.cfg.m, k });
      this.step(['bloom.setK', { k }]);
    }

    /** i-ème fonction de hachage (i = 1..k). */
    hash(w, i) {
      let v = 0;
      for (const c of w) v = (v * BASES[i - 1] + c.charCodeAt(0) - 96) % P;
      return v % this.s.cfg.m;
    }

    positions(w) {
      const out = [];
      for (let i = 1; i <= this.s.cfg.k; i++) out.push(this.hash(w, i));
      return out;
    }

    /** Réponse du filtre (sans étapes). */
    test(w) {
      return this.positions(w).every((p) => this.s.F[p] === 1);
    }

    /* --- ajout -------------------------------------------------------- */
    insert(w) {
      this.code('insert');
      const pos = this.positions(w);
      const known = this.s.words.includes(w);
      this.cur = { node: 'w:' + w, word: w, pos, shown: 0, cls: 'new', verdict: null };
      this.step(['bloom.hashing', { x: w, k: pos.length }], { line: 1 });
      pos.forEach((p, j) => {
        const i = j + 1;
        this.cur.shown = i;
        this.ring('bit:' + p, 'cmp');
        const was = this.s.F[p];
        this.s.F[p] = 1;
        this.mark('bit:' + p, was ? 'ok' : 'new');
        this.step([was ? 'bloom.setAlready' : 'bloom.set', { h: 'h' + sub(i), x: w, p }], { line: 3 });
      });
      this.ring(null);
      this.cur = null;
      if (known) {
        this.mark('w:' + w, 'ok');
        this.step(['bloom.again', { x: w }], { line: 4 });
        return;
      }
      this.s.words.push(w);
      this.mark('w:' + w, 'new');
      this.step(['bloom.added', { x: w }], { line: 4 });
    }

    /* --- test d'appartenance ------------------------------------------ */
    search(w) {
      this.code('search');
      const pos = this.positions(w);
      this.cur = { node: 'q', word: w, pos, shown: 0, cls: 'cmp', verdict: null };
      this.step(['bloom.testing', { x: w }], { line: 1 });
      for (let j = 0; j < pos.length; j++) {
        const p = pos[j];
        const i = j + 1;
        this.cur.shown = i;
        this.ring('bit:' + p, 'cmp');
        if (this.s.F[p] === 0) {
          this.ring('bit:' + p, 'bad');
          this.mark('bit:' + p, 'bad');
          this.cur.cls = 'bad';
          this.cur.verdict = ['bloom.v.no', 'ok'];
          this.step(['bloom.zero', { h: 'h' + sub(i), x: w, p }], { line: 4 });
          return false;
        }
        this.mark('bit:' + p, 'ok');
        this.step(['bloom.one', { h: 'h' + sub(i), x: w, p }], { line: 3 });
      }
      this.ring(null);
      if (this.s.words.includes(w)) {
        this.cur.cls = 'ok';
        this.cur.verdict = ['bloom.v.yes', 'ok'];
        this.mark('w:' + w, 'ok');
        this.step(['bloom.yes', { x: w }], { line: 5 });
      } else {
        this.cur.cls = 'bad';
        this.cur.verdict = ['bloom.v.fp', 'bad'];
        this.step(['bloom.fp', { x: w }], { line: 5 });
      }
      return true;
    }

    random() {
      this.clear();
      const pool = ('arbre table cle tas file pile liste graphe noeud feuille racine page bit code mot lettre ' +
        'chat chien loup ours lion tigre pomme poire kiwi prune').split(' ');
      DT.util.shuffle(pool);
      const n = Math.max(3, Math.round(this.s.cfg.m / (2 * this.s.cfg.k)) + 1);
      for (const w of pool.slice(0, n)) {
        this.step(['op.insert', { x: w }], { op: true, code: null });
        this.insert(w);
        this.clearMarks();
      }
    }

    /** Invariant : aucun faux négatif (tout mot ajouté passe le test). */
    check() {
      if (this.s.F.length !== this.s.cfg.m) throw new Error('taille du filtre');
      for (const w of this.s.words) if (!this.test(w)) throw new Error('faux négatif ' + w);
    }

    keys() {
      return this.s.words.slice().sort();
    }

    /* --- dessin ------------------------------------------------------- */
    draw(S) {
      const { m, k } = this.s.cfg;
      const F = this.s.F;
      const X = (i) => (i - (m - 1) / 2) * CW;
      const width = m * CW;
      S.text('name', 0, -222, ['bloom.name'], { cls: 'title' });
      S.text('title', 0, -198, ['bloom.title', { m, k }], { cls: 'dim' });
      S.text('formula', 0, -176, ['bloom.formula', { m, b: BASES.slice(0, k).join(', ') }], { cls: 'mono dim' });
      for (let i = 0; i < m; i++) {
        S.node('bit:' + i, {
          shape: 'cell',
          x: X(i),
          y: 0,
          w: 34,
          h: 38,
          sub: String(i),
          label: String(F[i]),
          cls: F[i] ? '' : 'muted',
        });
      }
      // mots ajoutés, sur plusieurs lignes si besoin
      const rowW = Math.max(width, 320);
      let x = 0;
      let row = [];
      const rows = [row];
      for (const w of this.s.words) {
        const bw = 16 + 9 * w.length;
        if (x + bw > rowW && row.length) {
          row = [];
          rows.push(row);
          x = 0;
        }
        row.push({ w, bw, x });
        x += bw + 10;
      }
      let y = 96;
      for (const r of rows) {
        if (!r.length) continue;
        const total = r[r.length - 1].x + r[r.length - 1].bw;
        for (const it of r) {
          S.node('w:' + it.w, { shape: 'box', x: it.x - total / 2 + it.bw / 2, y, w: it.bw, h: 30, label: it.w, cls: 'key' });
        }
        y += 44;
      }
      if (!this.s.words.length) {
        S.text('nowords', 0, y, ['bloom.empty'], { cls: 'dim' });
        y += 30;
      }
      // mot courant, au-dessus du tableau, avec les flèches h_i
      const c = this.cur;
      if (c) {
        const shown = c.pos.slice(0, Math.max(c.shown, 1));
        const cx = shown.reduce((a, p) => a + X(p), 0) / shown.length;
        const bw = 20 + 9 * c.word.length;
        const lim = width / 2 - bw / 2;
        S.node(c.node, { shape: 'box', x: Math.max(-lim, Math.min(lim, cx)), y: -118, w: bw, h: 32, label: c.word, cls: c.cls });
        const labels = new Map();
        for (let j = 0; j < c.shown; j++) {
          const p = c.pos[j];
          labels.set(p, (labels.has(p) ? labels.get(p) + ', ' : '') + 'h' + sub(j + 1));
        }
        for (const [p, lbl] of labels) {
          S.edge(c.node, 'bit:' + p, { id: 'arrow:' + p, arrow: true, toSide: 'top', label: lbl, labelAt: 0.45, cls: 'hl' });
        }
        if (c.verdict) {
          S.text('verdict', Math.max(-lim, Math.min(lim, cx)), -150, [c.verdict[0]], { cls: 'big ' + c.verdict[1] });
        }
      }
      // statistiques
      const n = this.s.words.length;
      const b = F.reduce((a, v) => a + v, 0);
      y += 4;
      S.text('stats', 0, y, ['bloom.stats', { n, b, m }], { cls: 'dim' });
      if (n) {
        S.text('prob', 0, y + 24, ['bloom.prob', { kn: k * n, m, k, p: dec(Math.pow(1 - Math.exp((-k * n) / m), k), 3) }], {
          cls: 'mono',
        });
        S.text('real', 0, y + 48, ['bloom.real', { b, m, k, p: dec(Math.pow(b / m, k), 3) }], { cls: 'mono dim' });
      }
    }
  }

  Bloom.controls = [
    { type: 'input', name: 'word', size: 12, placeholder: 'ctl.word' },
    { type: 'button', label: 'ctl.insert', op: 'insert', args: ['word'], primary: true },
    { type: 'button', label: 'ctl.search', op: 'search', args: ['word'] },
    { type: 'sep' },
    {
      type: 'select',
      name: 'm',
      label: 'bloom.ctl.m',
      op: 'setM',
      value: '16',
      options: [8, 12, 16, 24, 32].map((v) => ({ value: String(v), label: String(v) })),
    },
    {
      type: 'select',
      name: 'k',
      label: 'bloom.ctl.k',
      op: 'setK',
      value: '3',
      options: [1, 2, 3, 4].map((v) => ({ value: String(v), label: String(v) })),
    },
    { type: 'sep' },
    { type: 'button', label: 'ctl.random', op: 'random' },
  ];

  Bloom.code = {
    insert: {
      title: { fr: 'Construction du filtre', en: 'Building the filter' },
      source: 'course',
      lines: ['def Bloom_Ajout(s, F):', '    for i in range(1, k + 1):', '        F[h_i(s)] = 1', '    return F'],
    },
    search: {
      title: { fr: 'Test d’appartenance', en: 'Membership test' },
      source: 'course',
      lines: [
        'def Bloom_Test(x, F):',
        '    for i in range(1, k + 1):',
        '        if F[h_i(x)] == 0:',
        '            return False   # NON : x surement absent',
        '    return True            # OUI : x peut-etre present',
      ],
    },
    hfun: {
      title: { fr: 'Fonctions de hachage utilisées ici', en: 'Hash functions used here' },
      source: 'site',
      lines: [
        'B = (31, 37, 41, 43)    # une base par fonction',
        'def h_i(s):             # i = 1, ..., k',
        '    v = 0',
        '    for c in s:         # rang : a = 1, ..., z = 26',
        '        v = (v * B[i-1] + rang(c)) % 1009',
        '    return v % m',
      ],
    },
  };

  Bloom.legend = [
    ['var(--new)', { fr: 'bit mis à 1', en: 'bit set to 1' }],
    ['var(--ok)', { fr: 'bit déjà à 1 / OUI', en: 'bit already 1 / YES' }],
    ['var(--bad)', { fr: 'bit à 0 (NON) / faux positif', en: 'bit 0 (NO) / false positive' }],
  ];

  DT.register('bloom', Bloom);
})();