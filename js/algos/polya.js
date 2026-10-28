/*
 * Structures arborescentes dynamiques
 * Copyright (C) 2024-2026 Antoine Genitrini (développeur principal)
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
 * Structures de Pólya : génération aléatoire uniforme par la méthode récursive
 * générique, dans l'ordre « Cayley d'abord », et visualisation de la
 * décomposition T = C(zeta) : le squelette (pas de Cayley : un sous-arbre greffé
 * seul) puis les décorations (pas de décoration : j >= 2 copies identiques).
 *
 * Familles : arbres de Pólya (polya) et hiérarchies (polya_hier). Les tables
 * w[k] = rho^k T_k (js/algos/polya_tables.js) évitent tout calcul de grands
 * entiers ; la génération est donc uniforme aux arrondis flottants près.
 */
(function () {
  'use strict';

  const DT = window.DT;

  DT.i18n.add({
    fr: {
      'ctl.size': 'Taille',
      'ctl.generate': 'Générer',
      'polya.op.generate': 'Génération d’une structure de taille {x}',
      'polya_hier.op.generate': 'Génération d’une hiérarchie à {x} feuilles',
      'polya_identity.op.generate': 'Génération d’un arbre d’identité de taille {x}',
      'polya_cayley.op.generate': 'Génération d’un arbre de Cayley de taille {x}',
      'polya_schroeder.op.generate': 'Génération d’une partition totale de {x} éléments',
      'polya.err.size': 'Choisissez une taille entre {a} et {b}.',
      'polya.drawn': 'Structure tirée : {n} nœuds, dont {k} dans le squelette et {g} groupes de décorations. Examinons maintenant sa construction.',
      'polya.root': 'Le squelette de Cayley commence par la racine.',
      'polya.skel': 'Squelette : génération {g} ({k} nœuds sur {K}). Chaque nœud a été greffé seul (pas de Cayley).',
      'polya.skelBatch': 'Squelette : générations {g1} à {g2} ({k} nœuds sur {K}).',
      'polya.skelDone': 'Le squelette est complet : {K} nœuds, soit {p} % de l’arbre (prévision asymptotique 2/κ ≈ {q} %).',
      'polya.skelDone2': 'Le squelette est complet : {K} nœuds, soit {p} % de la structure.',
      'polya.deco': 'Décoration : {j} copies identiques d’un sous-arbre de taille {d}, greffées sur un nœud du squelette.',
      'polya.decoBatch': 'Décorations : {m} groupes de copies identiques ({t} nœuds).',
      'polya.done': 'Arbre complet. Choix examinés par la méthode récursive : {c}, soit {r} × n ln n (limite théorique : 1/2).',
      'polya.noDeco': 'Aucune décoration : tous les nœuds appartiennent au squelette.',
      'polya.gen.drawn': 'Structure tirée : {n} nœuds. Tous les choix sont des pas de Cayley (un sous-arbre greffé seul) : montrons-la génération par génération.',
      'polya.gen.level': 'Génération {g} ({k} nœuds sur {K}).',
      'polya.gen.levels': 'Générations {g1} à {g2} ({k} nœuds sur {K}).',
      'polya.gen.done': 'Structure complète. Choix examinés : {c}, soit {r} × n ln n (limite théorique : 1/2).',
      'polya.gen.doneRej': 'Structure complète. Choix examinés : {c}, soit {r} × n ln n (limite théorique : 1/2), dont {rej} essais rejetés.',
    },
    en: {
      'ctl.size': 'Size',
      'ctl.generate': 'Generate',
      'polya.op.generate': 'Generation of a structure of size {x}',
      'polya_hier.op.generate': 'Generation of a hierarchy with {x} leaves',
      'polya_identity.op.generate': 'Generation of an identity tree of size {x}',
      'polya_cayley.op.generate': 'Generation of a Cayley tree of size {x}',
      'polya_schroeder.op.generate': 'Generation of a total partition of {x} elements',
      'polya.err.size': 'Pick a size between {a} and {b}.',
      'polya.drawn': 'Random structure: {n} nodes, {k} of them in the skeleton, and {g} groups of decorations. Let us now look at its construction.',
      'polya.root': 'The Cayley skeleton starts with the root.',
      'polya.skel': 'Skeleton: generation {g} ({k} nodes out of {K}). Each node has been grafted alone (Cayley step).',
      'polya.skelBatch': 'Skeleton: generations {g1} to {g2} ({k} nodes out of {K}).',
      'polya.skelDone': 'The skeleton is complete: {K} nodes, i.e. {p} % of the tree (asymptotic prediction 2/κ ≈ {q} %).',
      'polya.skelDone2': 'The skeleton is complete: {K} nodes, i.e. {p} % of the structure.',
      'polya.deco': 'Decoration: {j} identical copies of a subtree of size {d}, grafted on a node of the skeleton.',
      'polya.decoBatch': 'Decorations: {m} groups of identical copies ({t} nodes).',
      'polya.done': 'Tree complete. Choices examined by the recursive method: {c}, i.e. {r} × n ln n (theoretical limit: 1/2).',
      'polya.noDeco': 'No decoration: all the nodes belong to the skeleton.',
      'polya.gen.drawn': 'Random structure: {n} nodes. All the choices are Cayley steps (a single grafted subtree): let us show it generation by generation.',
      'polya.gen.level': 'Generation {g} ({k} nodes out of {K}).',
      'polya.gen.levels': 'Generations {g1} to {g2} ({k} nodes out of {K}).',
      'polya.gen.done': 'Structure complete. Examined choices: {c}, i.e. {r} × n ln n (theoretical limit: 1/2).',
      'polya.gen.doneRej': 'Structure complete. Examined choices: {c}, i.e. {r} × n ln n (theoretical limit: 1/2), with {rej} rejected trials.',
    },
  });

  const MAX_FRAMES = 70;

  /* ------------------------------------------------------------------------
     Générateurs (sans visualisation) : renvoient un arbre imbriqué
     { k: [enfants], c: 'cay' | 'deco' }.
     ------------------------------------------------------------------------ */

  function clone(t) {
    return { k: t.k.map(clone), c: t.c, g: t.g };
  }

  /**
   * Choix d'un pas dans l'ordre « Cayley d'abord » : d'abord j = 1 par d
   * décroissant, puis j >= 2. weight(d, j) est la probabilité (normalisée) ;
   * forbidFirst interdit le pas (m, 1). Renvoie [d, j, nombre de pas examinés].
   */
  function choose(m, weight, forbidFirst, rnd) {
    let total = 1;
    if (forbidFirst) total -= weight(m, 1);
    let u = rnd() * total;
    let steps = 0;
    let last = null;
    for (let d = m; d >= 1; d--) {
      if (forbidFirst && d === m) continue;
      steps++;
      const p = weight(d, 1);
      last = [d, 1];
      if ((u -= p) < 0) return [d, 1, steps];
    }
    for (let d = Math.floor(m / 2); d >= 1; d--) {
      for (let j = 2; j * d <= m; j++) {
        steps++;
        const p = weight(d, j);
        last = [d, j];
        if ((u -= p) < 0) return [d, j, steps];
      }
    }
    return [last[0], last[1], steps]; // arrondi : on garde le dernier pas
  }

  /** Arbres de Pólya : un arbre de taille n est une racine et une forêt de taille n - 1. */
  function polyaGenerator(tab, rnd) {
    const w = tab.w;
    const rho = tab.rho;
    const wF = (m) => w[m + 1] / rho; // forêts : F_m = T_{m+1}
    const cost = { steps: 0, groups: 0 };
    function forest(m) {
      const kids = [];
      while (m > 0) {
        const mm = m;
        const weight = (d, j) => (d * w[d] * wF(mm - j * d) * Math.pow(rho, (j - 1) * d)) / (mm * wF(mm));
        const [d, j, s] = choose(m, weight, false, rnd);
        cost.steps += s;
        const sigma = tree(d);
        if (j === 1) {
          sigma.c = 'cay';
          kids.push(sigma);
        } else {
          const g = ++cost.groups;
          for (let i = 0; i < j; i++) {
            const c = i ? clone(sigma) : sigma;
            c.c = 'deco';
            c.g = g;
            kids.push(c);
          }
        }
        m -= j * d;
      }
      return kids;
    }
    function tree(n) {
      return { k: forest(n - 1), c: 'cay' };
    }
    return { tree, cost };
  }

  /** Hiérarchies : taille = nombre de feuilles ; forêts F = MSet(T), F_n = 2 T_n (n >= 2). */
  function hierGenerator(tab, rnd) {
    const w = tab.w;
    const wF = tab.wF;
    const rho = tab.rho;
    const cost = { steps: 0, groups: 0 };
    function forest(m, forbidFirst) {
      const kids = [];
      let first = forbidFirst;
      while (m > 0) {
        const mm = m;
        const weight = (d, j) => (d * w[d] * wF[mm - j * d] * Math.pow(rho, (j - 1) * d)) / (mm * wF[mm]);
        const [d, j, s] = choose(m, weight, first, rnd);
        first = false;
        cost.steps += s;
        const sigma = tree(d);
        if (j === 1) {
          sigma.c = 'cay';
          kids.push(sigma);
        } else {
          const g = ++cost.groups;
          for (let i = 0; i < j; i++) {
            const c = i ? clone(sigma) : sigma;
            c.c = 'deco';
            c.g = g;
            kids.push(c);
          }
        }
        m -= j * d;
      }
      return kids;
    }
    function tree(n) {
      if (n === 1) return { k: [], c: 'cay' };
      return { k: forest(n, true), c: 'cay' };
    }
    return { tree, cost };
  }


  /**
   * Arbres d'identité : (n - 1) T_n = sum_i i T_i V_i(n - i), où V_i(m) compte les
   * arbres de taille m dont la racine n'a pas d'enfant isomorphe à un arbre donné
   * de taille i. On tire i, puis sigma, puis tau par rejet. Il n'y a que des pas de Cayley.
   */
  function identityGenerator(tab, rnd) {
    const w = tab.w;
    const rho = tab.rho;
    const cost = { steps: 0, groups: 0, rejections: 0 };
    const canon = (t) => t.cs || (t.cs = '(' + t.k.map(canon).sort().join('') + ')');
    const v = (i, m) => {
      let s = 0;
      for (let j = 0; m - j * i >= 1; j++) s += (j % 2 ? -1 : 1) * w[m - j * i] * Math.pow(rho, j * i);
      return s;
    };
    function tree(n) {
      if (n === 1) return { k: [], c: 'cay' };
      let u = rnd();
      let i = 1;
      for (let d = n - 1; d >= 1; d--) {
        cost.steps++;
        i = d;
        if ((u -= (d * w[d] * v(d, n - d)) / ((n - 1) * w[n])) < 0) break;
      }
      const sigma = tree(i);
      const cs = canon(sigma);
      for (;;) {
        const tau = tree(n - i);
        if (!tau.k.some((c) => canon(c) === cs)) {
          tau.k.push(sigma);
          tau.cs = null;
          return tau;
        }
        cost.rejections++;
      }
    }
    return { tree, cost };
  }

  /**
   * Familles étiquetées (coefficients des séries exponentielles) : arbres de
   * Cayley (une racine et un ensemble d'arbres) et partitions totales (une
   * feuille, ou un ensemble d'au moins deux partitions). Seulement des pas de
   * Cayley ; les étiquettes sont distribuées à la fin par une permutation uniforme.
   */
  function labelledGenerator(tab, rnd, kind) {
    const w = tab.w;
    const wF = tab.wF;
    const cost = { steps: 0, groups: 0 };
    function forest(m, forbidFirst) {
      const kids = [];
      let first = forbidFirst;
      while (m > 0) {
        const mm = m;
        let u = rnd() * (first ? 1 - w[mm] / wF[mm] : 1);
        let d0 = 1;
        for (let d = mm; d >= 1; d--) {
          if (first && d === mm) continue;
          cost.steps++;
          d0 = d;
          if ((u -= (d * w[d] * wF[mm - d]) / (mm * wF[mm])) < 0) break;
        }
        first = false;
        kids.push(tree(d0));
        m -= d0;
      }
      return kids;
    }
    function tree(n) {
      if (kind === 'cayley') return { k: forest(n - 1, false), c: 'cay' };
      if (n === 1) return { k: [], c: 'cay' };
      return { k: forest(n, true), c: 'cay' };
    }
    return { tree, cost };
  }

  /* ------------------------------------------------------------------------
     Visualisation
     ------------------------------------------------------------------------ */

  class PolyaBase extends DT.Algo {
    initState() {
      return { nextId: 1, nodes: [], shown: 0, n: 0 };
    }

    parse(name, raw) {
      const v = String(raw).trim();
      if (!/^\d+$/.test(v)) throw new DT.UserError('err.int', { v: v || '?' });
      const n = parseInt(v, 10);
      const [a, b] = this.constructor.range;
      if (n < a || n > b) throw new DT.UserError('polya.err.size', { a, b });
      return [n];
    }

    /**
     * Aplatit l'arbre généré (parcours en profondeur explicite) : identifiant,
     * parent, profondeur, nature (squelette ou décoration) et groupe de copies.
     * Un nœud est dans le squelette si le chemin depuis la racine ne passe que
     * par des pas de Cayley ; sinon il appartient au groupe de copies identiques
     * dont il descend.
     */
    flatten(root) {
      const nodes = [];
      const stack = [[root, null, 'skel', 0, 0]];
      while (stack.length) {
        const [t, parent, kind, group, depth] = stack.pop();
        const node = { id: this.newId(), parent, kind, group, depth, kids: [], top: false };
        if (parent !== null) {
          const par = nodes[parent];
          par.kids.push(node.id);
          node.parent = par.id;
          node.top = par.kind === 'skel' && kind === 'deco';
        }
        nodes.push(node);
        const idx = nodes.length - 1;
        for (let i = t.k.length - 1; i >= 0; i--) {
          const c = t.k[i];
          const deco = kind === 'deco' || c.c === 'deco';
          stack.push([c, idx, deco ? 'deco' : 'skel', kind === 'deco' ? group : deco ? c.g : 0, depth + 1]);
        }
      }
      return nodes;
    }

    generate(n) {
      const tab = DT.polyaTables[this.constructor.table];
      const gen = this.constructor.makeGenerator(tab, Math.random);
      const t = gen.tree(n);
      this.s.nodes = [];
      this.s.shown = 0;
      const nodes = this.flatten(t);
      this.s.nodes = nodes;
      this.s.n = n;
      const N = nodes.length;
      const skel = nodes.filter((x) => x.kind === 'skel');
      const K = skel.length;
      this.s.visible = nodes.map(() => false);
      const pos = new Map(nodes.map((x, i) => [x, i]));
      this.s.visible[0] = true; // la racine

      if (this.constructor.labelled) this.label(nodes);
      const plain = this.constructor.decorations === false;
      if (plain) this.step(['polya.gen.drawn', { n: N }]);
      else this.step(['polya.drawn', { n: N, k: K, g: gen.cost.groups }]);

      // phase 1 : le squelette, génération par génération
      const maxD = Math.max(...skel.map((x) => x.depth));
      const byDepth = [];
      for (const x of skel) (byDepth[x.depth] = byDepth[x.depth] || []).push(x);
      const per = Math.max(1, Math.ceil((maxD + 1) / (MAX_FRAMES / 2)));
      let shown = 0;
      for (let g0 = 0; g0 <= maxD; g0 += per) {
        const g1 = Math.min(maxD, g0 + per - 1);
        this.clearMarks();
        for (let g = g0; g <= g1; g++) {
          for (const x of byDepth[g] || []) {
            this.s.visible[pos.get(x)] = true;
            this.mark(x.id, 'fresh');
            shown++;
          }
        }
        if (plain) {
          if (per === 1) this.step(['polya.gen.level', { g: g0, k: shown, K }]);
          else this.step(['polya.gen.levels', { g1: g0, g2: g1, k: shown, K }]);
        } else if (g0 === 0 && per === 1) this.step('polya.root');
        else if (per === 1) this.step(['polya.skel', { g: g0, k: shown, K }]);
        else this.step(['polya.skelBatch', { g1: g0, g2: g1, k: shown, K }]);
      }
      this.clearMarks();
      if (plain) {
        const r0 = gen.cost.steps / (n * Math.log(n));
        const rej = gen.cost.rejections;
        this.step([rej === undefined ? 'polya.gen.done' : 'polya.gen.doneRej', { c: gen.cost.steps, r: n > 1 ? r0.toFixed(3) : '–', rej }]);
        return nodes;
      }
      if (this.constructor.skeletonShare) {
        this.step(['polya.skelDone', { K, p: ((100 * K) / N).toFixed(1), q: (100 * this.constructor.skeletonShare).toFixed(1) }]);
      } else {
        this.step(['polya.skelDone2', { K, p: ((100 * K) / N).toFixed(1) }]);
      }

      // phase 2 : les décorations, groupe par groupe
      const groups = [];
      for (let i = 0; i < N; i++) {
        const x = nodes[i];
        if (x.kind !== 'deco') continue;
        (groups[x.group] = groups[x.group] || []).push(i);
      }
      const list = groups.filter(Boolean);
      if (!list.length) this.step('polya.noDeco');
      const perG = Math.max(1, Math.ceil(list.length / (MAX_FRAMES / 2)));
      for (let a = 0; a < list.length; a += perG) {
        this.clearMarks();
        let tot = 0;
        const batch = list.slice(a, a + perG);
        for (const grp of batch) {
          for (const i of grp) {
            this.s.visible[i] = true;
            this.mark(nodes[i].id, 'fresh');
            tot++;
          }
        }
        if (perG === 1) {
          const grp = batch[0];
          const j = grp.filter((i) => nodes[i].top).length;
          this.step(['polya.deco', { j, d: Math.round(grp.length / Math.max(1, j)) }]);
        } else {
          this.step(['polya.decoBatch', { m: batch.length, t: tot }]);
        }
      }
      this.clearMarks();
      const r = gen.cost.steps / (n * Math.log(n));
      this.step(['polya.done', { c: gen.cost.steps, r: n > 1 ? r.toFixed(3) : '–' }]);
      this.lastCost = gen.cost.steps;
      return nodes;
    }

    /** Distribue les étiquettes 1..n par une permutation uniforme (atomes : tous les nœuds, ou les feuilles). */
    label(nodes) {
      const atoms = this.constructor.labelled === 'leaves' ? nodes.filter((x) => !x.kids.length) : nodes;
      const lab = DT.util.shuffle(atoms.map((_, i) => i + 1));
      atoms.forEach((x, i) => (x.label = lab[i]));
    }

    random() {
      const [a, b] = this.constructor.range;
      this.generate(DT.util.rand(a, Math.min(b, 120)));
    }

    draw(S) {
      const nodes = this.s.nodes;
      if (!nodes.length) return;
      const N = nodes.length;
      const labels = this.constructor.labelled && N <= 40;
      const big = N > 60 && !labels;
      const r = labels ? 14 : big ? (N > 400 ? 3.5 : 5) : 9;
      const byId = new Map(nodes.map((x) => [x.id, x]));
      const L = DT.layout.tree(nodes[0], {
        children: (x) => x.kids.map((k) => byId.get(k)),
        width: () => 2 * r + (big ? 2 : 6),
        gap: big ? 2 : 8,
        levelGap: big ? (N > 400 ? 26 : 34) : 56,
      });
      const vis = this.s.visible || [];
      nodes.forEach((x, i) => {
        if (!vis[i]) return;
        const p = L.pos.get(x);
        const par = x.parent !== null ? L.pos.get(byId.get(x.parent)) : null;
        const lab = labels && x.label !== undefined;
        S.node(x.id, {
          shape: lab ? 'circle' : 'dot',
          label: lab ? x.label : undefined,
          r,
          x: p.x,
          y: p.y,
          cls: x.kind,
          enter: par ? { x: par.x, y: par.y } : undefined,
        });
      });
      nodes.forEach((x, i) => {
        if (!vis[i] || x.parent === null) return;
        S.edge(x.parent, x.id, { cls: x.kind });
      });
    }

    /** Invariants : la structure dessinée a la bonne taille et respecte la classe. */
    check() {
      const nodes = this.s.nodes;
      const size = this.constructor.sizeOf(nodes);
      if (size !== this.s.n) throw new Error(`taille ${size} au lieu de ${this.s.n}`);
      this.constructor.checkClass(nodes);
    }
  }

  PolyaBase.controls = [
    { type: 'input', name: 'n', label: 'ctl.size', size: 6, placeholder: 'ctl.size', value: '60' },
    { type: 'button', label: 'ctl.generate', op: 'generate', args: ['n'], primary: true, keep: true },
    { type: 'sep' },
    { type: 'button', label: 'ctl.random', op: 'random' },
  ];

  PolyaBase.code = {};
  PolyaBase.legend = [
    ['var(--node-stroke)', { fr: 'squelette (pas de Cayley)', en: 'skeleton (Cayley steps)' }],
    ['var(--hl)', { fr: 'décorations (copies identiques)', en: 'decorations (identical copies)' }],
  ];

  class PolyaTrees extends PolyaBase {}
  PolyaTrees.table = 'polya';
  PolyaTrees.tau0 = 0.7797450101873204;
  // proportion asymptotique de nœuds du squelette : 2/kappa = 1/(2 tau0^2)
  PolyaTrees.skeletonShare = 1 / (2 * 0.7797450101873204 * 0.7797450101873204);
  PolyaTrees.range = [1, 1000];
  PolyaTrees.makeGenerator = polyaGenerator;
  PolyaTrees.sizeOf = (nodes) => nodes.length;
  PolyaTrees.checkClass = () => {};

  /** Contraintes de classe sur l'arbre aplati (liste de nœuds { id, kids }). */
  DT.polyaCheck = {
    none() {},
    hier(nodes) {
      for (const x of nodes) if (x.kids.length === 1) throw new Error('nœud unaire');
    },
    identity(nodes) {
      const byId = new Map(nodes.map((x) => [x.id, x]));
      const memo = new Map();
      const canon = (x) => {
        if (!memo.has(x.id)) memo.set(x.id, '(' + x.kids.map((k) => canon(byId.get(k))).sort().join('') + ')');
        return memo.get(x.id);
      };
      for (const x of nodes) {
        const cs = x.kids.map((k) => canon(byId.get(k)));
        if (new Set(cs).size !== cs.length) throw new Error('deux enfants isomorphes');
      }
    },
  };

  DT.PolyaBase = PolyaBase;
  DT.polyaGen = {
    polya: polyaGenerator,
    hier: hierGenerator,
    identity: identityGenerator,
    cayley: (tab, rnd) => labelledGenerator(tab, rnd, 'cayley'),
    schroeder: (tab, rnd) => labelledGenerator(tab, rnd, 'schroeder'),
    choose,
  };
  DT.register('polya', PolyaTrees);
})();
