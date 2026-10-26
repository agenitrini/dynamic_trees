/*
 * Structures arborescentes dynamiques
 * Copyright (C) 2024-2026 Antoine Genitrini (développeur principal)
 * Contributeurs (projet PSTL 2023-2024, Sorbonne Université) :
 *   Tracy Hong, Julien Fang, Jean-Marc Zhuang, Laura Rattanavan
 * Licence : GNU GPL version 3 ou ultérieure (voir le fichier LICENSE).
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/* Configuration du site. */
(function () {
  'use strict';

  const DT = (window.DT = window.DT || {});

  DT.config = {
    /*
     * Adresse de l'application web Google Apps Script qui reçoit les avis
     * (voir apps-script/LISEZMOI.md), de la forme
     * https://script.google.com/macros/s/XXXXXXXX/exec
     * Tant qu'elle est vide, les boutons d'avis ne sont pas affichés.
     */
    feedbackUrl: '',
  };
})();
