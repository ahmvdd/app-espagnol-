import type { View } from '../router';
import { $, $$, esc } from '../lib/ui';

type Idee = { texte: string; lien: string; action: string };

const SITUATIONS: { titre: string; icon: string; idees: Idee[] }[] = [
  {
    titre: 'Trop bruyants', icon: '🔊',
    idees: [
      { texte: 'Lancer ¡Congelados! : à la fin du compte à rebours, plus personne ne bouge ni ne parle.', lien: '#/herramientas/congelados', action: 'Lancer Congelados' },
      { texte: 'Afficher le niveau de voix 0 et attendre le silence complet avant de reprendre.', lien: '#/herramientas/voz?n=0', action: 'Afficher « Silencio »' },
      { texte: 'Lever la main en silence : chaque élève qui voit une main levée lève la sienne et se tait.', lien: '#/herramientas/voz?n=0', action: 'Afficher « Silencio »' }
    ]
  },
  {
    titre: 'Ils décrochent', icon: '😴',
    idees: [
      { texte: 'Ruleta : un élève tiré au sort redit en espagnol le dernier mot appris.', lien: '#/herramientas/ruleta', action: 'Lancer la Ruleta' },
      { texte: 'Défi chrono : 1 minute pour écrire un maximum de mots du thème, par deux.', lien: '#/herramientas/minutero?t=60', action: 'Minuteur 1 min' },
      { texte: 'Équipes express : chaque équipe propose une phrase avec le vocabulaire du jour.', lien: '#/herramientas/equipos', action: 'Faire les équipes' }
    ]
  },
  {
    titre: 'Après la récré', icon: '🔔',
    idees: [
      { texte: '2 minutes pour s’installer et sortir ses affaires en silence, le minuteur au tableau.', lien: '#/herramientas/minutero?t=120', action: 'Minuteur 2 min' },
      { texte: 'Niveau de voix 1 : on s’installe en chuchotant, puis silence pour commencer.', lien: '#/herramientas/voz?n=1', action: 'Afficher « Susurro »' },
      { texte: 'Trois grandes respirations ensemble, puis le mot du jour au tableau.', lien: '#/', action: 'Voir le mot du jour' }
    ]
  }
];

let choix = -1;
const idx = [0, 0, 0];

export const sos: View = el => {
  const render = () => {
    const s = SITUATIONS[choix];
    const idee = s?.idees[idx[choix]];
    el.innerHTML = `
      <h1>SOS</h1>
      <div class="sos-grid" role="group" aria-label="Situation">
        ${SITUATIONS.map((x, i) => `<button class="panel sos-btn" data-i="${i}" aria-pressed="${i === choix}"><span class="ico" aria-hidden="true">${x.icon}</span>${x.titre}</button>`).join('')}
      </div>
      ${idee ? `
        <section class="panel center sos-idee" aria-live="polite">
          <p class="big">${esc(idee.texte)}</p>
          <div class="row wrap center-row">
            <a class="btn bigbtn" href="${idee.lien}">${esc(idee.action)}</a>
            <button class="btn ghost" id="autre">Autre idée</button>
          </div>
        </section>` : ''}`;
    $$('[data-i]', el).forEach(b => b.onclick = () => { choix = Number(b.dataset.i); render(); });
    const autre = $('#autre', el);
    if (autre) autre.onclick = () => { idx[choix] = (idx[choix] + 1) % s.idees.length; render(); };
  };
  render();
};
