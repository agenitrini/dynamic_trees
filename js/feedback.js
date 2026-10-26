/*
 * Structures arborescentes dynamiques
 * Copyright (C) 2024-2026 Antoine Genitrini (développeur principal)
 * Contributeurs (projet PSTL 2023-2024, Sorbonne Université) :
 *   Tracy Hong, Julien Fang, Jean-Marc Zhuang, Laura Rattanavan
 * Licence : GNU GPL version 3 ou ultérieure (voir le fichier LICENSE).
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/*
 * Avis sur la page : pouce en l'air (confirmation) ou pouce en bas (formulaire),
 * avec compteurs partagés, enregistrés par le service Google Apps Script.
 * Un visiteur a un vote par page (mémorisé dans son navigateur), qu'il peut changer.
 */
(function () {
  'use strict';

  const DT = (window.DT = window.DT || {});
  const t = (k, p) => DT.i18n.t(k, p);

  DT.i18n.add({
    fr: {
      'fb.up': 'Page cohérente avec le cours AlgAv',
      'fb.down': 'Signaler un problème vis-à-vis du cours AlgAv',
      'fb.upTitle': 'Confirmer votre avis',
      'fb.upText': 'Page qui semble cohérente avec le cours AlgAv.',
      'fb.upAsk': 'Confirmez-vous ?',
      'fb.confirm': 'Confirmer',
      'fb.cancel': 'Annuler',
      'fb.send': 'Envoyer',
      'fb.downTitle': 'Signaler un problème',
      'fb.downText':
        'Merci de donner quelques détails sur le problème soulevé vis-à-vis du cours AlgAv : étape ou opération concernée, ce qui diffère du cours, exemple utilisé…',
      'fb.placeholder': 'Décrivez le problème…',
      'fb.tooShort': 'Merci de décrire le problème en quelques mots.',
      'fb.thanksUp': 'Merci pour votre avis !',
      'fb.thanksDown': 'Merci, votre signalement a été transmis.',
      'fb.already': 'Vous avez déjà donné cet avis sur cette page.',
      'fb.changed': 'Votre avis précédent sur cette page sera remplacé.',
      'fb.error': 'L’envoi a échoué, réessayez plus tard.',
      'fb.sending': 'Envoi…',
    },
    en: {
      'fb.up': 'Page consistent with the AlgAv course',
      'fb.down': 'Report a problem with respect to the AlgAv course',
      'fb.upTitle': 'Confirm your feedback',
      'fb.upText': 'This page seems consistent with the AlgAv course.',
      'fb.upAsk': 'Do you confirm?',
      'fb.confirm': 'Confirm',
      'fb.cancel': 'Cancel',
      'fb.send': 'Send',
      'fb.downTitle': 'Report a problem',
      'fb.downText':
        'Please give a few details about the problem with respect to the AlgAv course: step or operation involved, what differs from the course, example used…',
      'fb.placeholder': 'Describe the problem…',
      'fb.tooShort': 'Please describe the problem in a few words.',
      'fb.thanksUp': 'Thank you for your feedback!',
      'fb.thanksDown': 'Thank you, your report has been sent.',
      'fb.already': 'You already gave this feedback on this page.',
      'fb.changed': 'Your previous feedback on this page will be replaced.',
      'fb.error': 'Sending failed, please try again later.',
      'fb.sending': 'Sending…',
    },
  });

  // icônes « pouce » d'après Lucide (licence ISC)
  const THUMB =
    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 10v12"/>' +
    '<path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76' +
    'a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>';

  function readVote(page) {
    try {
      return localStorage.getItem('dt-vote:' + page);
    } catch (e) {
      return null;
    }
  }
  function writeVote(page, v) {
    try {
      localStorage.setItem('dt-vote:' + page, v);
    } catch (e) {
      /* navigation privée : vote non mémorisé */
    }
  }

  /** Appel au service (GET pour lire, POST text/plain pour écrire : pas de pré-vol CORS). */
  DT.feedbackApi = {
    async counts(page) {
      const r = await fetch(`${DT.config.feedbackUrl}?action=counts&page=${encodeURIComponent(page)}`);
      return r.json();
    },
    async post(body) {
      const r = await fetch(DT.config.feedbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body),
      });
      return r.json();
    },
  };

  /** Fenêtre modale simple ; renvoie { box, close }. */
  function modal(html) {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(back);
    const box = back.firstChild;
    const close = () => {
      back.remove();
      document.removeEventListener('keydown', onKey);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    back.addEventListener('mousedown', (e) => {
      if (e.target === back) close();
    });
    return { box, close };
  }

  function toast(msg, error) {
    const el = document.createElement('div');
    el.className = 'toast' + (error ? ' error' : '');
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, 3200);
  }

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /** Ajoute les deux boutons dans l'en-tête pour la page `page`. */
  DT.feedback = {
    mount(header, page) {
      if (!DT.config || !DT.config.feedbackUrl || !page) return;
      const wrap = document.createElement('div');
      wrap.className = 'fb';
      wrap.innerHTML =
        `<button class="fb-btn up" data-i18n-title="fb.up">${THUMB}<span class="n">·</span></button>` +
        `<button class="fb-btn down" data-i18n-title="fb.down">${THUMB}<span class="n">·</span></button>`;
      header.insertBefore(wrap, header.querySelector('.theme'));
      DT.i18n.apply(wrap);
      const upBtn = wrap.querySelector('.up');
      const downBtn = wrap.querySelector('.down');

      const show = (c) => {
        if (!c || c.error) return;
        upBtn.querySelector('.n').textContent = c.up;
        downBtn.querySelector('.n').textContent = c.down;
      };
      const mark = () => {
        const v = readVote(page);
        upBtn.classList.toggle('on', v === 'up');
        downBtn.classList.toggle('on', v === 'down');
      };
      mark();
      DT.feedbackApi.counts(page).then(show).catch(() => {});

      const send = async (body, done) => {
        const res = await DT.feedbackApi.post(body);
        if (!res || res.error) throw new Error((res && res.error) || 'réponse');
        writeVote(page, body.vote);
        mark();
        show(res);
        done();
      };

      upBtn.addEventListener('click', () => {
        const prev = readVote(page);
        if (prev === 'up') {
          toast(t('fb.already'));
          return;
        }
        const m = modal(
          `<h3>${esc(t('fb.upTitle'))}</h3><p class="lead">${esc(t('fb.upText'))}</p>` +
            (prev ? `<p class="note">${esc(t('fb.changed'))}</p>` : '') +
            `<p>${esc(t('fb.upAsk'))}</p>` +
            `<div class="actions"><button class="btn ghost c">${esc(t('fb.cancel'))}</button>` +
            `<button class="btn primary ok">${esc(t('fb.confirm'))}</button></div>`
        );
        m.box.querySelector('.c').addEventListener('click', m.close);
        const ok = m.box.querySelector('.ok');
        ok.focus();
        ok.addEventListener('click', async () => {
          ok.disabled = true;
          ok.textContent = t('fb.sending');
          try {
            await send({ action: 'vote', page, vote: 'up', prev }, () => {
              m.close();
              toast(t('fb.thanksUp'));
            });
          } catch (e) {
            m.close();
            toast(t('fb.error'), true);
          }
        });
      });

      downBtn.addEventListener('click', () => {
        const prev = readVote(page);
        const m = modal(
          `<h3>${esc(t('fb.downTitle'))}</h3><p class="lead">${esc(t('fb.downText'))}</p>` +
            (prev === 'up' ? `<p class="note">${esc(t('fb.changed'))}</p>` : '') +
            `<textarea rows="6" maxlength="2000" placeholder="${esc(t('fb.placeholder'))}"></textarea>` +
            `<p class="err"></p><div class="actions"><button class="btn ghost c">${esc(t('fb.cancel'))}</button>` +
            `<button class="btn primary ok">${esc(t('fb.send'))}</button></div>`
        );
        const ta = m.box.querySelector('textarea');
        const err = m.box.querySelector('.err');
        ta.focus();
        ta.addEventListener('input', () => (err.textContent = ''));
        m.box.querySelector('.c').addEventListener('click', m.close);
        const ok = m.box.querySelector('.ok');
        ok.addEventListener('click', async () => {
          const message = ta.value.trim();
          if (message.length < 5) {
            err.textContent = t('fb.tooShort');
            ta.focus();
            return;
          }
          ok.disabled = true;
          ok.textContent = t('fb.sending');
          try {
            await send({ action: 'vote', page, vote: 'down', prev, message, url: location.href, lang: DT.i18n.lang }, () => {
              m.close();
              toast(t('fb.thanksDown'));
            });
          } catch (e) {
            ok.disabled = false;
            ok.textContent = t('fb.send');
            err.textContent = t('fb.error');
          }
        });
      });
    },
  };
})();
