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

/* Lecteur : parcourt les étapes enregistrées (lecture, pause, pas à pas, vitesse). */
(function () {
  'use strict';

  const DT = (window.DT = window.DT || {});

  // durée totale d'une étape (ms) selon le curseur de vitesse 1..10
  const STEP_MS = [2600, 1900, 1400, 1050, 800, 600, 440, 300, 180, 70];

  class Player {
    constructor(renderer, onFrame) {
      this.r = renderer;
      this.onFrame = onFrame || (() => {});
      this.frames = [];
      this.i = 0;
      this.playing = false;
      this.timer = null;
      this.speed = 5;
      this.onState = () => {};
    }

    get total() {
      return STEP_MS[this.speed - 1];
    }
    get trans() {
      return Math.max(60, this.total * 0.62);
    }
    get hold() {
      return this.total * 0.38;
    }

    setSpeed(v) {
      this.speed = Math.max(1, Math.min(10, v | 0));
    }

    /** Charge une nouvelle suite d'étapes et la lance éventuellement. */
    load(frames, autoplay) {
      this.pause();
      this.frames = frames;
      this.i = 0;
      if (!frames.length) return;
      this.r.render(frames[0].scene, Math.min(this.trans, 400));
      this.onFrame(0);
      if (autoplay && frames.length > 1) {
        this.playing = true;
        this.onState();
        this.timer = setTimeout(() => this.advance(), this.hold);
      }
      this.onState();
    }

    advance() {
      this.timer = null;
      if (!this.playing) return;
      if (this.i >= this.frames.length - 1) {
        this.pause();
        return;
      }
      this.i++;
      this.onFrame(this.i);
      this.r.render(this.frames[this.i].scene, this.trans, () => {
        if (this.playing) this.timer = setTimeout(() => this.advance(), this.hold);
      });
    }

    play() {
      if (!this.frames.length) return;
      if (this.i >= this.frames.length - 1) this.goto(0, false);
      this.playing = true;
      this.onState();
      this.advance();
    }

    pause() {
      this.playing = false;
      if (this.timer) clearTimeout(this.timer);
      this.timer = null;
      this.onState();
    }

    toggle() {
      if (this.playing) this.pause();
      else this.play();
    }

    goto(i, animate) {
      if (!this.frames.length) return;
      i = Math.max(0, Math.min(this.frames.length - 1, i));
      this.i = i;
      this.r.render(this.frames[i].scene, animate ? Math.min(this.trans, 450) : 0);
      this.onFrame(i);
      this.onState();
    }

    next() {
      this.pause();
      if (this.i < this.frames.length - 1) this.goto(this.i + 1, true);
    }

    prev() {
      this.pause();
      if (this.i > 0) this.goto(this.i - 1, true);
    }

    first() {
      this.pause();
      this.goto(0, true);
    }

    last() {
      this.pause();
      this.r.stop();
      this.goto(this.frames.length - 1, true);
    }

    /** Termine sans animation (avant de lancer une nouvelle opération). */
    finish() {
      this.pause();
      this.r.stop();
    }
  }

  DT.Player = Player;
})();
