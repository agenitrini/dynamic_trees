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

/* Outils partagés par les modules d'algorithmes. */
(function () {
  'use strict';

  const DT = window.DT;

  DT.i18n.add({
    fr: {
      'c.found': '{x} est présent.',
      'c.notFound': '{x} est absent.',
      'c.already': '{x} est déjà présent : rien à faire.',
      'c.emptyTree': 'Arbre vide.',
      'c.newRoot': 'Arbre vide : {x} devient la racine.',
      'c.cmpLess': '{x} < {y} : on descend à gauche.',
      'c.cmpMore': '{x} > {y} : on descend à droite.',
      'c.cmpEq': '{x} = {y}.',
      'c.leafHere': 'Sous-arbre vide : on crée la feuille {x}.',
      'c.done': 'Terminé.',
      'c.bit0': 'Bit {i} de {x} = 0 : à gauche.',
      'c.bit1': 'Bit {i} de {x} = 1 : à droite.',
    },
    en: {
      'c.found': '{x} is present.',
      'c.notFound': '{x} is absent.',
      'c.already': '{x} is already present: nothing to do.',
      'c.emptyTree': 'Empty tree.',
      'c.newRoot': 'Empty tree: {x} becomes the root.',
      'c.cmpLess': '{x} < {y}: go left.',
      'c.cmpMore': '{x} > {y}: go right.',
      'c.cmpEq': '{x} = {y}.',
      'c.leafHere': 'Empty subtree: create the leaf {x}.',
      'c.done': 'Done.',
      'c.bit0': 'Bit {i} of {x} = 0: go left.',
      'c.bit1': 'Bit {i} of {x} = 1: go right.',
    },
  });

  DT.common = {
    /** Dessine un arbre binaire (nœuds {id, key, left, right}) ; renvoie la mise en page. */
    drawBinary(S, root, opts) {
      opts = opts || {};
      const L = DT.layout.binary(root, {
        levelGap: opts.levelGap || 70,
        gap: opts.gap || 14,
        phantom: opts.phantom || 26,
        width: opts.width || (() => 40),
        x: opts.x || 0,
        y: opts.y || 0,
      });
      for (const [n, p] of L.pos) {
        const spec = Object.assign({ x: p.x, y: p.y, label: n.key }, opts.node ? opts.node(n) : {});
        S.node(n.id, spec);
      }
      for (const [n] of L.pos) {
        for (const side of ['left', 'right']) {
          const c = n[side];
          if (c) S.edge(n.id, c.id, opts.edge ? opts.edge(n, c, side) : {});
        }
      }
      return L;
    },

    /** Saisie de lettres (A à Z), séparées ou non : « ASER » ou « A S E R ». */
    parseLetters(raw) {
      const s = String(raw).replace(/[\s,;]+/g, '').toUpperCase();
      for (const c of s) if (c < 'A' || c > 'Z') throw new DT.UserError('err.letter', { v: c });
      return s.split('');
    },

    /** Saisie de mots en minuscules a à z. */
    parseWords(raw) {
      const ws = String(raw).toLowerCase().split(/[\s,;]+/).filter(Boolean);
      for (const w of ws) {
        if (!/^[a-z]+$/.test(w)) throw new DT.UserError('err.word', { v: w });
        if (w.length > 16) throw new DT.UserError('err.toolong', { n: 16 });
      }
      return ws;
    },
  };
})();
