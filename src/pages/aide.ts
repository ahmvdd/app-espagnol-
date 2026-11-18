import type { View } from '../router';
import { $, esc } from '../lib/ui';
import { CREDITS_PHOTOS } from './cultura';

export const aide: View = el => {
  el.innerHTML = `
    <h1>Aide · Clase Viva</h1>

    <section class="panel prose">
      <h2>Mode d’emploi en une page</h2>
      <ol>
        <li><strong>Prof</strong> : crée tes classes et colle la liste des prénoms (un par ligne).</li>
        <li><strong>Accueil → J’ai… minutes</strong> : choisis la durée, la classe et l’ambiance, puis <em>Lancer</em>.</li>
        <li><strong>Outils</strong> : minuteur, roulette, équipes, Congelados, niveau de voix. Bouton <em>Plein écran</em> pour le projecteur.</li>
        <li><strong>Jeux</strong> : choisis le niveau et le thème, fais les équipes, compte les points.</li>
        <li><strong>SOS</strong> : une idée immédiate quand la classe est bruyante, décroche ou rentre de récré.</li>
        <li><strong>Projection</strong> (en haut) : grossit tout pour le fond de la salle. <strong>Son</strong> : coupe tous les sons.</li>
      </ol>
      <h3>Raccourcis clavier</h3>
      <ul>
        <li><kbd>Espace</kbd> : démarrer / pause (minuteur), tirer (roulette), lancer (Congelados), retourner (flashcards)</li>
        <li><kbd>←</kbd> <kbd>→</kbd> : changer de flashcard · <kbd>0</kbd>–<kbd>3</kbd> : niveau de voix · <kbd>Échap</kbd> : sortir</li>
      </ul>
      <h3>Sauvegarder (important)</h3>
      <p>Tes classes, ton suivi et ton carnet sont <strong>sauvegardés automatiquement dans ton espace</strong> (pastille ☁️ en haut).
        Sur un autre appareil, connecte-toi avec le même mot secret pour tout retrouver. Hors ligne, tout reste enregistré sur l’appareil et part en ligne au retour du réseau.
        Sur un ordinateur partagé, pense à <em>Se déconnecter</em> (pastille de l’espace) : les données de l’appareil sont alors effacées.</p>
    </section>

    <section class="panel prose" id="confidentialite">
      <h2>Confidentialité</h2>
      <ul>
        <li>Chaque espace est protégé par un mot secret. Seul cet espace accède à ses données.</li>
        <li>Les données d’un espace (classes avec les prénoms des élèves, plans de classe, suivi, carnet de bord, réglages) sont enregistrées sur l’appareil et sauvegardées dans une base de données hébergée dans l’Union européenne. Les 30 dernières versions sont conservées pour pouvoir revenir en arrière.</li>
        <li>Seuls les prénoms sont enregistrés : pas de nom de famille, de note ni de photo d’élève.</li>
        <li>Aucune statistique de visite, aucune publicité, aucune donnée revendue.</li>
        <li>Se déconnecter efface les données de l’appareil (elles restent dans l’espace en ligne).</li>
        <li>Le micro (sonomètre) est analysé en direct sur l’appareil, jamais enregistré.</li>
      </ul>
    </section>

    <section class="panel prose" id="credits">
      <h2>Crédits</h2>
      <p>Créée par Souhaïla Hasnoun.</p>
      <ul>
        <li>Polices : Atkinson Hyperlegible (Braille Institute, OFL), Bricolage Grotesque (OFL), OpenDyslexic (OFL), auto-hébergées.</li>
        <li>Sons : générés par le navigateur (Web Audio), aucun fichier externe.</li>
        <li>Voix : synthèse vocale de l’appareil (Web Speech API).</li>
        <li>Drapeaux et carte : dessinés en CSS et SVG pour ce site.</li>
        <li>Pictogrammes : emojis du système.</li>
        <li>Photos (Wikimedia Commons, licences libres, redimensionnées pour le site) :
          <ul>${CREDITS_PHOTOS.map(c => `<li>${esc(c.lieu)} — ${esc(c.auteur)}, ${esc(c.licence)}, <span class="small">${esc(c.source)}</span></li>`).join('')}</ul></li>
        <li>Contenus pédagogiques : alignés sur le programme d’espagnol du collège (BO), rédigés pour ce site et à faire relire.</li>
      </ul>
    </section>

    <section class="panel prose">
      <h2>Mentions</h2>
      <p>Clase Viva : site personnel réalisé pour un usage en classe, non commercial. Hébergement privé, accès réservé.</p>
    </section>`;

  const target = location.hash.split('/')[2];
  if (target) $(`#${target}`, el)?.scrollIntoView();
};
