/**
 * Modes d'emploi : un petit « ? » discret à côté de chaque titre (outil, jeu, section).
 * Un clic ouvre une fiche courte : à quoi ça sert, comment faire, une astuce.
 */
import { esc } from './ui';

type Aide = { titre: string; quoi: string; etapes: string[]; astuce?: string };

export const AIDES: Record<string, Aide> = {
  // ——— Accueil et pages
  rituels: { titre: 'Rituels du jour', quoi: 'Quatre petits rituels à projeter en début de cours, en espagnol.', etapes: ['Mot du jour : choisis la classe (5e, 4e, 3e), fais deviner le sens, puis « Révéler la traduction ».', 'La fecha y el tiempo : demande la date aux élèves et écris-la, puis clique la météo du jour.', '¿Qué tal? : chaque élève vote pour son humeur.', 'La pregunta del día : une question à poser à l’oral, « Otra pregunta » pour en changer.'], astuce: 'Le bouton ⛶ agrandit un rituel en plein écran pour le projeter.' },
  minutes: { titre: 'J’ai… minutes', quoi: 'Une idée d’activité adaptée au temps qu’il te reste, à ta classe et à son ambiance.', etapes: ['Choisis la durée, puis la classe, puis l’ambiance (calme, normale, agitée).', '« Lancer » ouvre directement l’outil ou le jeu proposé.', '« Autre idée » en propose une autre.'] },
  raccourcis: { titre: 'Raccourcis', quoi: 'Les outils les plus utilisés, à un clic.', etapes: ['Minuteur, roulette et équipes s’ouvrent directement.', 'Bilan de séance : moins d’une minute en fin de cours pour noter ce qui a été fait.', 'SOS : une idée immédiate quand la classe décroche.'] },
  programme: { titre: 'Programme', quoi: 'Les 6 axes du programme officiel par niveau, découpés en chapitres.', etapes: ['Choisis un niveau (5e, 4e, 3e).', 'Clique un chapitre pour ouvrir sa page : vocabulaire, documents à imprimer, diaporamas, jeux.', 'L’axe 6 est obligatoire ; 5 axes sur 6 sont à traiter dans l’année.'] },
  culture: { titre: 'Culture', quoi: 'Les fêtes du monde hispanique dans l’année et des photos à décrire en classe.', etapes: ['Clique une fête pour la projeter.', 'Photo à décrire : les élèves décrivent la photo en espagnol, « Afficher l’aide » donne le vocabulaire et des débuts de phrases.'] },
  sos: { titre: 'SOS', quoi: 'Une idée tout de suite, selon la situation de la classe.', etapes: ['Choisis la situation (bruyante, endormie, retour de récré…).', 'Clique une idée : elle ouvre l’outil qui va avec.'] },
  outils: { titre: 'Outils', quoi: 'Les outils de gestion de classe à projeter.', etapes: ['Clique un outil pour l’ouvrir.', '« Plein écran » le met en grand pour le fond de la salle.', 'Chaque outil a son propre « ? » avec son mode d’emploi.'] },
  jeux: { titre: 'Jeux', quoi: 'Des jeux en équipes pour réviser le vocabulaire et faire parler espagnol.', etapes: ['Choisis un jeu.', 'Choisis le niveau, le chapitre et le nombre d’équipes, puis « ¡Jugar! ».', 'Les scores sont gardés d’un jeu à l’autre pendant la séance ; « +1 » donne un point à la main.'], astuce: 'Les jeux de plateau (La paga del mes, El misterio, Ruta por España, El juego de la oca) et ¡Dibújalo! demandent au moins 2 équipes.' },
  profe: { titre: 'Espace Prof', quoi: 'Tes classes, le suivi des chapitres, le carnet de bord et les sauvegardes.', etapes: ['Classes : crée une classe et colle la liste des prénoms, un par ligne.', 'Suivi : coche où en est chaque classe (vu, en cours, à revoir).', 'Carnet : un mini-bilan après chaque séance.', 'Tout est enregistré automatiquement dans ton espace en ligne.'] },
  sequence: { titre: 'Créer une séquence', quoi: 'Le plan complet d’une séquence, séance par séance, prêt à imprimer et à modifier.', etapes: ['Choisis la classe (ou le niveau), le chapitre, le nombre de séances et la durée d’une séance.', '« Créer la séquence » : chaque séance est remplie avec des activités, des liens vers les outils et les documents, et les devoirs.', 'Modifie ce que tu veux directement dans le texte : c’est enregistré tout seul.', '« Imprimer » ou « PDF » pour l’avoir sur papier. Tes séquences sont gardées dans « Mes séquences ».'], astuce: 'Les séquences créées pour une classe apparaissent aussi dans son suivi.' },
  // ——— Page chapitre
  'ch-vocab': { titre: 'Vocabulaire du chapitre', quoi: 'Les mots du chapitre en cartes à retourner, à projeter.', etapes: ['Clique la carte pour la retourner, ← → pour changer de carte.', '« Écouter » lit le mot avec la voix espagnole de l’appareil.', '« Commencer par le français » : les élèves trouvent le mot espagnol.'] },
  'ch-docs': { titre: 'Documents à imprimer', quoi: 'Les documents élèves du chapitre.', etapes: ['Cours, synthèse (une feuille), exercices, corrigés (pour toi).', 'Carte mentale : complète, ou à compléter par les élèves.', 'Clique un document pour l’aperçu, puis « Imprimer » ou « PDF ». La croix ✕ en haut à droite ramène au chapitre.'] },
  'ch-diapos': { titre: 'Diaporamas du chapitre', quoi: 'Deux diaporamas différents, prêts à projeter et modifiables.', etapes: ['Aperçu (début de chapitre, 5 à 8 diapos) : où va-t-on ? Objectifs, mots clés, grammaire, tâche finale. 10 minutes à la première séance.', 'Synthèse (fin de chapitre, 10 à 15 diapos) : révision avec règles, exemples, erreurs fréquentes et mini-questions. Dernière séance avant l’évaluation.', '« Présenter » : plein écran, flèches ou clic pour avancer.', '« Modifier » : change n’importe quel texte, ajoute, supprime ou déplace des diapos. Tes changements sont enregistrés.', '« Retouches » propose une nouvelle version du diaporama, sans quitter le site : tu choisis de l’utiliser ou non, puis tu la modifies.', '« PowerPoint » télécharge un fichier modifiable (PowerPoint, Keynote, Google Slides).'] },
  'ch-ress': { titre: 'Ressources pour l’enseignante', quoi: 'Tout pour préparer et évaluer le chapitre.', etapes: ['Fiche enseignante, déroulé de séance, supports à projeter, cartes à imprimer.', 'Fiche simplifiée et fiche approfondie pour différencier.', 'Évaluation et son corrigé, plus les documents de l’axe (vue d’ensemble, grille d’oral, tâches finales).'] },
  'ch-jeux': { titre: 'Jouer avec ce chapitre', quoi: 'Les jeux lancés directement avec le vocabulaire de ce chapitre.', etapes: ['Clique un jeu : le niveau et le chapitre sont déjà choisis.'] },
  // ——— Outils
  minuteur: { titre: 'Minuteur', quoi: 'Un grand compte à rebours visible de toute la classe.', etapes: ['Choisis une durée ou tape-la.', 'Espace : démarrer / pause.', 'Choisis l’affichage (chiffres, sablier…) ; un son marque la fin.'] },
  ruleta: { titre: 'Roulette', quoi: 'Tirer un élève au sort, sans que ce soit toujours le même.', etapes: ['Choisis la classe (les prénoms viennent de l’espace Prof).', 'Espace ou « Girar » pour tirer.', 'Un élève tiré ne revient pas avant que tout le monde soit passé.'] },
  equipos: { titre: 'Équipes', quoi: 'Faire des équipes équilibrées en un clic.', etapes: ['Choisis la classe et le nombre d’équipes.', 'Les élèves « à séparer » (réglés dans Prof) ne sont jamais ensemble.', 'Projette le résultat ; « Refaire » mélange à nouveau.'] },
  congelados: { titre: 'Congelados', quoi: 'Un compte à rebours, puis toute la classe se fige.', etapes: ['Espace pour lancer.', 'Au zéro, tout le monde s’arrête net : silence et immobilité.', 'Un clic ou Échap pour reprendre.'] },
  voz: { titre: 'Niveau de voix', quoi: 'Afficher le niveau de voix attendu, du silence à la voix de classe.', etapes: ['Touches 0 à 3, ou clic sur un niveau.', 'Laisse-le projeté pendant l’activité.'] },
  sonometre: { titre: 'Sonomètre', quoi: 'Le micro mesure le bruit de la classe en direct.', etapes: ['Autorise le micro quand le navigateur le demande.', 'Règle les seuils orange et rouge.', 'Rien n’est enregistré : le son est analysé puis oublié.'] },
  rituel: { titre: 'Rituel d’entrée', quoi: 'Une consigne d’entrée en classe, 3 minutes et un mini-défi.', etapes: ['Choisis la classe.', '« Lancer les 3 minutes » pendant que les élèves s’installent.', '« Otro reto » change de mini-défi ; « Lire la consigne » la lit en espagnol.'] },
  pauses: { titre: 'Pauses énergie', quoi: 'Une pause active de 2 à 3 minutes en espagnol.', etapes: ['Choisis une pause (Simón dice, mimes, étirements…).', 'Suis les étapes affichées, avec les consignes en espagnol.'] },
  mundo: { titre: 'Le monde hispanophone', quoi: 'Les 21 pays où l’on parle espagnol.', etapes: ['Clique un pays sur la carte ou dans la liste.', 'Capitale, fête, accent et mots typiques s’affichent.'] },
  vuelta: { titre: 'La Vuelta', quoi: 'Une course d’étapes par équipes sur la carte, sur plusieurs séances.', etapes: ['Choisis le parcours (Espagne ou Amérique latine).', 'Donne des points aux équipes (bonnes réponses, bon comportement) : elles avancent d’étape en étape.', 'Les scores sont gardés d’une séance à l’autre ; une affiche du vainqueur peut s’imprimer.'] },
  recompenses: { titre: 'Récompenses', quoi: 'Diplômes, titres et mots de félicitations à imprimer.', etapes: ['Choisis un titre et tape le prénom.', '« Diplôme » ouvre l’aperçu à imprimer.'] },
  plan: { titre: 'Plan de classe', quoi: 'Placer les élèves dans la salle.', etapes: ['Choisis la classe et la disposition (rangées, îlots, U).', 'Glisse chaque prénom à sa place.', 'Le plan est enregistré et peut s’imprimer.'] },
  roles: { titre: 'Rôles tournants', quoi: 'Secrétaire, gardien du temps… des rôles qui tournent à chaque séance.', etapes: ['Choisis la classe.', 'Les rôles avancent tout seuls à chaque nouveau jour.'] },
  rotations: { titre: 'Travail de groupe', quoi: 'Un travail de groupe minuté : speed meeting, world café, classe puzzle.', etapes: ['Choisis le format et les durées.', 'Le site annonce chaque changement avec un son et une voix.'] },
  consignes: { titre: 'Consignes en images', quoi: 'Des pictogrammes bilingues pour donner les consignes sans parler français.', etapes: ['Clique une consigne pour la projeter en grand.'] },
  // ——— Jeux
  quiz: { titre: 'Quiz en direct', quoi: 'Des questions projetées, réponses à l’oral ou sur ardoise.', etapes: ['Lis la question, laisse le temps de répondre.', 'Espace : révéler la réponse, puis question suivante.', 'Donne les points avec « +1 ».'] },
  rosco: { titre: 'Rosco (Pasapalabra)', quoi: 'Un mot par lettre de l’alphabet, comme à la télé espagnole.', etapes: ['La définition s’affiche avec la lettre.', 'Touches : C (correct), P (pasapalabra, on revient plus tard), E (erreur).', 'Le but : faire le tour du rosco avec le plus de bonnes réponses.'] },
  ahorcado: { titre: 'Pendu', quoi: 'Deviner le mot espagnol lettre par lettre.', etapes: ['Les élèves proposent des lettres (en espagnol : « la a, la be… »).', 'Clique les lettres proposées.'] },
  memory: { titre: 'Memory', quoi: 'Retrouver chaque mot espagnol et sa traduction.', etapes: ['Une équipe retourne deux cartes en disant les mots à voix haute.', 'Paire trouvée : l’équipe rejoue.'] },
  bomba: { titre: 'La bomba', quoi: 'Traduire avant l’explosion.', etapes: ['On se passe un objet (la « bombe »).', 'Celui qui la tient traduit le mot affiché, puis la passe.', 'Quand elle explose, il donne un mot de plus.'] },
  basta: { titre: 'Basta', quoi: 'Une lettre, des catégories, 2 minutes.', etapes: ['Chaque équipe écrit un mot espagnol par catégorie qui commence par la lettre.', 'La première qui a tout crie « ¡Basta! ».'] },
  taboo: { titre: 'Taboo', quoi: 'Faire deviner un mot en espagnol, sans dire les mots interdits.', etapes: ['1 minute par équipe.', 'Interdit : les mots tabous, le français et le mime.'] },
  escape: { titre: 'Escape game', quoi: 'Des énigmes à résoudre pour trouver le code du cadenas (axe 6).', etapes: ['Choisis la durée (20, 30 ou 45 minutes).', 'Chaque énigme résolue donne un chiffre.', 'Un indice coûte 2 minutes.'] },
  loteria: { titre: 'Lotería', quoi: 'Un bingo avec des cartes imprimables.', etapes: ['Imprime une carte par élève ou binôme.', 'Tire les mots un par un.', 'Le premier qui remplit sa carte crie « ¡Lotería! ».'] },
  paga: { titre: 'La paga del mes', quoi: 'Un mois de budget sur un calendrier : argent, métiers, météo et imprévus.', etapes: ['Chaque équipe lance le dé et avance du 1er au 31.', 'Imprévu : on lit la carte en espagnol, puis on dit ce qu’on paie ou gagne.', 'Facture : un calcul ou une traduction en 25 secondes.', 'Le 31, l’équipe réclame son salaire en espagnol. La plus riche gagne.', 'Les boutons ✓ / ✗ servent à valider l’oral : une phrase bien dite rapporte un bonus.'], astuce: 'En 5e, les montants restent sous 100 €.' },
  misterio: { titre: 'El misterio de la clase', quoi: 'Une enquête façon Cluedo : qui, avec quoi, où ?', etapes: ['L’appli cache le coupable, l’objet et le lieu.', 'À son tour, l’équipe choisit une carte par colonne et dit son hypothèse en espagnol.', 'L’appli répond en espagnol et barre une carte pour tout le monde.', 'Une équipe sûre d’elle peut accuser : juste = +5 points.'], astuce: 'En 4e et 3e, les phrases sont au passé (Creo que fue…) ; en 5e, au présent.' },
  ruta: { titre: 'Ruta por España', quoi: 'Un Monopoly des villes d’Espagne et d’Amérique latine.', etapes: ['Pour acheter une ville : réussir une mini-colle, puis dire « Compro… por… euros ».', 'Chez une autre équipe : payer le loyer en disant la phrase sans hésiter (sinon c’est le double).', 'Suerte = quiz culturel ; Caja = défi oral.', '« Terminer la partie » quand tu veux : l’équipe la plus riche gagne.'] },
  oca: { titre: 'El juego de la oca', quoi: 'Le jeu de l’oie, que tous les élèves espagnols connaissent, avec les questions du chapitre.', etapes: ['L’équipe lance le dé et avance.', 'Case normale : une question du chapitre. Juste = +1 et on reste ; faux = on recule de 2.', 'Case oie : on saute à l’oie suivante et on rejoue en disant « ¡De oca a oca y tiro porque me toca! ».', 'Pont, auberge, labyrinthe, puits, tête de mort : une phrase à dire en espagnol et leur effet.', 'Première équipe à la case 40 : +5 points.'] },
  dibujalo: { titre: '¡Dibújalo!', quoi: 'Un Pictionary au tableau avec le vocabulaire du chapitre.', etapes: ['Un élève vient au tableau et maintient « Voir » pour lire le mot (la classe ne le voit pas).', 'Il dessine sans lettres ni chiffres ; son équipe devine en espagnol (« ¿Es un…? »).', '« Trouvé » = +1, « Passer » = mot suivant. 1 minute par équipe.'], astuce: 'Sur tablette ou TNI, le mot reste caché dès qu’on lâche le bouton.' },
  quefalta: { titre: '¿Qué falta?', quoi: 'Un jeu de mémoire (jeu de Kim) : un mot disparaît, il faut dire lequel.', etapes: ['La classe mémorise les mots affichés (le temps augmente avec le nombre de mots).', 'Les mots sont mélangés et l’un d’eux a disparu.', 'On répond à l’oral : « Falta… ». « Voir la réponse » puis Trouvé / Raté.', 'Chaque manche réussie ajoute un mot (de 5 à 12).'], astuce: 'Sans équipes, toute la classe joue ensemble.' }
};

/** Bouton « ? » discret. */
export const btnAide = (id: string) => AIDES[id]
  ? `<button type="button" class="aide-btn" data-aide-id="${id}" aria-label="Mode d’emploi : ${esc(AIDES[id].titre)}" title="Mode d’emploi">?</button>`
  : '';

/** Ouvre la fiche d'aide (petite fenêtre, Échap ou clic à côté pour fermer). */
export function ouvrirAide(id: string): void {
  const a = AIDES[id];
  if (!a) return;
  const prev = document.activeElement as HTMLElement | null;
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `
    <div class="modal aide-modal" role="dialog" aria-modal="true" aria-labelledby="aide-t">
      <button class="overlay-x aide-x" aria-label="Fermer">✕</button>
      <h2 id="aide-t">❓ ${esc(a.titre)}</h2>
      <p>${esc(a.quoi)}</p>
      <ol>${a.etapes.map(e => `<li>${esc(e)}</li>`).join('')}</ol>
      ${a.astuce ? `<p class="aide-astuce">💡 ${esc(a.astuce)}</p>` : ''}
      <button class="btn" data-ok>J’ai compris</button>
    </div>`;
  document.body.append(back);
  const fermer = () => { back.remove(); removeEventListener('keydown', key, true); prev?.focus?.(); };
  const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); fermer(); } };
  addEventListener('keydown', key, true);
  back.onclick = e => { if (e.target === back) fermer(); };
  back.querySelector<HTMLButtonElement>('.aide-x')!.onclick = fermer;
  back.querySelector<HTMLButtonElement>('[data-ok]')!.onclick = fermer;
  back.querySelector<HTMLButtonElement>('[data-ok]')!.focus();
}

/** Un seul écouteur pour tous les « ? » du site. */
export function activerAides(): void {
  document.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-aide-id]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    ouvrirAide(b.dataset.aideId!);
  });
}
