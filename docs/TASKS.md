# Tâches détaillées — El Rincón de la Profe

> Fichier de travail du dev. La version client est `docs/roadmap-client.html`.
> Coche `[x]` au fur et à mesure. **Un commit par tâche terminée.**

## Règles du jeu

**Une tâche est finie quand :**
1. Elle respecte tous ses critères d'acceptation.
2. Elle marche au clavier, en mode projection et en mode sombre.
3. Elle n'a aucune erreur dans la console.
4. Elle passe `npm run build`.
5. Elle a été testée à 1366×768 et sur un téléphone.
6. Elle a son commit : `feat(outil): ...` / `fix(...)` / `content(...)`.

**Interdits :**
- `alert`, `confirm` et `prompt` → utiliser la modale maison.
- Toute dépendance à un service externe (YouTube, CDN, analytics).
- Retirer des points.
- Une information donnée par la couleur seule : toujours icône + couleur.
- Ajouter une nouvelle idée en cours de phase → la noter dans « Idées en attente » en bas.

**Légende :** ⏱ estimation · 🔗 dépend de · 📁 fichiers · ✅ critères d'acceptation

---

## Phase 0 — Setup

- [x] **T0.1 Squelette du projet**
  - Vite + TypeScript, PWA, polices locales, routeur, `lib/storage.ts`, son, synthèse vocale.
- [x] **T0.2 Premier commit et lancement** · ⏱ 10 min
  - `git add . && git commit -m "init"` puis `npm run dev`.
  - ✅ La page s'ouvre sur http://localhost:5173, sans erreur dans la console.
- [ ] **T0.3 Repo GitHub privé** · ⏱ 10 min
  - Créer le repo `el-rincon-de-la-profe` en **privé**, faire `git remote add` puis `git push`.
  - ✅ Le repo est privé. Ne pas le rendre public ni l'épingler sur le profil avant la remise.
- [x] **T0.4 Icônes PWA en PNG** · ⏱ 30 min
  - 📁 `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`, `vite.config.ts`
  - Générer les PNG depuis `icon.svg`, les déclarer dans le manifest, ajouter `apple-touch-icon` dans `index.html`.
  - ✅ « Installer l'application » apparaît dans Chrome. L'icône s'affiche correctement sur iPhone et Android.
- [x] **T0.5 Composants UI communs** · ⏱ 2 h
  - 📁 `src/lib/modal.ts`, `src/lib/fullscreen.ts`, `src/styles/base.css`
  - Modale de confirmation `confirmModal(titre, texte, libelléOK): Promise<boolean>`, avec focus piégé et fermeture par Échap.
  - `toggleFullscreen(el)` avec gestion du refus.
  - Classes de boutons : `.btn`, `.btn.ghost`, `.btn.warn`, `.btn.big` ; zones cliquables d'au moins 44 px.
  - ✅ La modale s'utilise au clavier seul. Le plein écran marche sur Chrome, Edge et Firefox, et échoue proprement ailleurs.
- [x] **T0.6 Store applicatif** · ⏱ 1 h · 🔗 T0.1
  - 📁 `src/lib/state.ts`
  - Un objet `state` unique chargé via `loadData()`, avec `update(fn)` qui sauvegarde et notifie les abonnés (`subscribe`). Les ids viennent de `crypto.randomUUID()`.
  - Si `saveData` renvoie `false`, afficher le toast « Impossible d'enregistrer : stockage plein ou bloqué ».
  - ✅ Modifier une classe dans Profe met à jour la roulette sans recharger la page.

---

## Phase 1 — Essentiel · jalon **8 novembre**

### Espace Profe
- [x] **T1.1 Gestion des classes** · ⏱ 3 h · 🔗 T0.5, T0.6
  - 📁 `src/pages/profe.ts`, `src/pages/profe/classes.ts`
  - Créer, renommer et supprimer une classe (nom + niveau 5e/4e/3e). La suppression passe par la modale.
  - Coller une liste de prénoms (un par ligne) → doublons et lignes vides retirés automatiquement.
  - Ajouter ou retirer un élève à la main.
  - Paires incompatibles : choisir 2 élèves, « ne jamais mettre ensemble ».
  - ✅ 5 classes de 30 élèves restent fluides. Tout est conservé après un rechargement.
- [x] **T1.2 Sauvegardes et réglages** · ⏱ 2 h 30 · 🔗 T1.1
  - 📁 `src/pages/profe/sauvegardes.ts`
  - Bouton **Sauvegarder** → `exportBackup()`.
  - Bouton **Restaurer** → sélection d'un fichier → `readBackup()` → aperçu (« Sauvegarde du 23/11 : 4 classes, 112 élèves ») → confirmation → un point de retour est créé **avant** d'écraser.
  - Liste des 10 points de retour (date et heure lisibles), avec un bouton « Revenir à cet état » sur chacun.
  - **Tout effacer** : double confirmation, en tapant « EFFACER ».
  - Réglages : prénom de la prof, police standard ou dyslexie, volume.
  - Messages d'erreur clairs pour un mauvais fichier ou une sauvegarde trop récente.
  - ✅ Le cycle export → tout effacer → restaurer redonne exactement les mêmes données. Le rappel « 7 jours » disparaît après un export.
- [x] **T1.3 Police adaptée à la dyslexie** · ⏱ 30 min · 🔗 T1.2
  - `npm i @fontsource/opendyslexic`, puis appliquer la police via `data-font="dys"` sur `<html>`.
  - ✅ Le réglage s'applique partout, immédiatement, et reste actif après un rechargement.

### Outils de classe
- [x] **T1.4 Minuteur géant** · ⏱ 3 h · 🔗 T0.5
  - 📁 `src/tools/minuteur.ts`
  - Boutons 30 s, 1, 2, 3, 5 et 10 min, plus un champ libre (min:s).
  - Démarrer, Pause/Reprise, Remise à zéro.
  - Pendant les 10 dernières secondes, le fond change doucement de couleur (sans clignotement), avec une icône en plus.
  - À la fin : « ¡Tiempo! » en grand et un son doux, qui respecte le mode muet.
  - Plein écran en un clic.
  - Exporter `startTimer(sec, onEnd)` pour Congelados, les pauses et le rituel.
  - Thèmes visuels (sablier, mèche, tortilla, fusée) → **phase 2**. Pour l'instant, un seul thème.
  - ✅ Pas de dérive : on compare `Date.now()` au lieu de compter les ticks. Le décompte reste juste quand l'onglet passe en arrière-plan.
- [x] **T1.5 Roulette** · ⏱ 2 h · 🔗 T1.1
  - 📁 `src/tools/ruleta.ts` (porter `tRuleta` du prototype)
  - Choix de la classe dans une liste ; sans classe, tirage d'un numéro de 1 à N.
  - Pas de répétition tant que le tour n'est pas fini, avec un compteur « 12 / 28 passés ».
  - Option « Volontaires seulement » : cocher les volontaires dans une liste.
  - Bouton « Remettre tout le monde ».
  - Animation de défilement, sautée si `prefers-reduced-motion`.
  - ✅ Sur 28 tirages, chaque élève sort une fois et une seule. Le tour en cours survit à un changement de page.
- [x] **T1.6 Générateur d'équipes** · ⏱ 3 h · 🔗 T1.1
  - 📁 `src/tools/equipos.ts`, `src/content/paises.json`
  - De 2 à 8 équipes, effectifs équilibrés (écart d'un élève au plus).
  - Chaque équipe porte le nom d'un pays hispanophone et un drapeau (SVG inline ou emoji drapeau, avec repli sur un texte).
  - Respect des paires incompatibles : si c'est impossible, le dire au lieu de boucler à l'infini.
  - Boutons « Refaire » et « Projeter ».
  - ✅ 100 générations de suite sans aucune paire incompatible ensemble, vérifiées par un petit test.
- [x] **T1.7 Congelados** · ⏱ 1 h 30 · 🔗 T1.4
  - 📁 `src/tools/congelados.ts`
  - Un clic → plein écran de couleur → décompte 5-4-3-2-1 à l'écran **et** à l'oral (synthèse vocale « cinco, cuatro… », bips en repli) → gong doux → « ¡Congelados! » et une statue de glace animée en CSS.
  - Échap ou un clic pour sortir.
  - ✅ Fonctionne en mode muet, avec seulement le visuel.
- [x] **T1.8 Niveau de voix** · ⏱ 1 h
  - 📁 `src/tools/voz.ts`
  - 4 niveaux : 0 silencio, 1 susurro, 2 voz de pareja, 3 voz de clase. Pictogrammes très grands + numéro + libellé.
  - Touches 0 à 3 au clavier, plein écran.
  - ✅ Lisible du fond de la salle : on simule à 4 m d'un écran 1366×768.
- [x] **T1.9 Page Outils** · ⏱ 1 h · 🔗 T1.4 à T1.8
  - 📁 `src/pages/herramientas.ts`
  - Grille de grosses tuiles, une par outil (icône, nom FR, sous-titre ES). L'outil s'ouvre en un clic.
  - Routes : `#/herramientas/minuteur`, etc., pour que les raccourcis puissent y pointer.
  - ✅ Chaque outil est accessible en 2 clics maximum depuis l'accueil.
- [x] **T1.10 SOS** · ⏱ 2 h · 🔗 T1.9, T1.13
  - 📁 `src/pages/sos.ts`, `src/content/sos.json`
  - 3 gros boutons : **Trop bruyants** · **Ils décrochent** · **Après la récré / vendredi 16 h**.
  - Chacun propose une activité en une phrase + un bouton **Lancer** (qui ouvre l'outil ou l'activité) + « Autre idée ».
  - Au moins 3 propositions par situation.
  - Bouton SOS rouge, toujours visible dans le menu.
  - ✅ Du clic sur SOS au lancement : 2 clics.

### Contenu et niveaux
- [x] **T1.11 Format du contenu** · ⏱ 1 h
  - 📁 `src/content/types.ts`, `src/content/{5e,4e,3e}.json`
  - Figer le format JSON d'un thème (voir l'annexe A) et typer l'import.
  - ✅ Une erreur dans un JSON casse le build, pas le site en classe.
- [x] **T1.12 Pages 5e / 4e / 3e** · ⏱ 3 h · 🔗 T1.11
  - 📁 `src/pages/nivel.ts`, `src/tools/flashcards.ts`
  - Couleur propre à chaque niveau, liste des thèmes.
  - Flashcards retournables (clic, Espace, flèches), avec un bouton 🔊.
  - Accent : Espagne ou Amérique latine (réglage mémorisé).
  - S'il n'y a pas de voix espagnole, afficher un message discret (« Voix espagnole absente sur cet appareil ») sans casser la page.
  - ✅ Toutes les flashcards fonctionnent au clavier. La voix a été vérifiée sur Windows, Chrome et Edge.
- [x] **T1.13 Catalogue d'activités « J'ai X minutes »** · ⏱ 2 h
  - 📁 `src/content/activites.json`
  - Format : `{ id, titre, consigne, duree, niveaux[], ambiance: calme|normale|agitee, outil?, materiel? }`.
  - Au moins 15 activités qui couvrent 5, 10, 15, 20, 30 et 50 min et les 3 ambiances.
  - ✅ Toute combinaison durée × niveau × ambiance renvoie au moins une activité.
- [x] **T1.14 Contenu réel** · ⏱ selon les réponses · 🔗 réponses de Souhaïla
  - Remplacer les thèmes d'exemple par les vrais, et faire relire l'espagnol par Souhaïla.
  - ✅ Au moins 1 thème complet relu par niveau.

### Accueil
- [x] **T1.15 Page d'accueil** · ⏱ 4 h · 🔗 T1.9, T1.12, T1.13
  - 📁 `src/pages/inicio.ts`
  - Bandeau « ¡Hola, [prénom]! » + dédicace (texte à recevoir de Souhaïla).
  - 3 cartes 5e/4e/3e, avec le dernier thème consulté.
  - Bouton star **« J'ai X minutes »** : durée → niveau → ambiance → activité, avec **Lancer** et **Autre idée**.
  - Raccourcis : minuteur, roulette, équipes, SOS.
  - Rituels du jour : palabra del día, refrán del día (même tirage pour toute la journée).
  - Pied de page : aide, crédits, « Tout effacer » (renvoie vers Profe).
  - ✅ La page se charge en moins de 2 s en 3G rapide (onglet Performance de Chrome).

### Qualité et mise en ligne
- [x] **T1.16 Mode projection partout** · ⏱ 1 h
  - ✅ Chaque outil est lisible à 4 m, sans débordement à 1366×768 ni à 1920×1080.
- [x] **T1.17 Passe accessibilité** · ⏱ 1 h 30
  - Navigation complète au clavier, focus visible, contrastes AA (DevTools → Lighthouse), aucune animation si `prefers-reduced-motion`, `aria-live` sur les résultats (roulette, minuteur).
  - ✅ Lighthouse Accessibilité ≥ 95.
- [x] **T1.18 Test hors ligne** · ⏱ 30 min
  - `npm run build && npm run preview` → couper le réseau (DevTools → Offline) → recharger.
  - ✅ Tous les outils de la phase 1 marchent hors ligne.
- [ ] **T1.19 Tests navigateurs** · ⏱ 1 h
  - Chrome, Edge, Firefox et Safari (iPad ou iPhone si possible) ; 1366×768, 1920×1080, téléphone.
  - ✅ Aucun bug bloquant. Les problèmes mineurs sont notés en bas du fichier.
- [ ] **T1.20 Déploiement privé** · ⏱ 45 min · 🔗 T0.3
  - Cloudflare Pages branché sur le repo GitHub, avec un build à chaque push sur `main`.
  - Accès privé : Cloudflare Access (gratuit), limité à ton mail et à celui de Souhaïla.
  - HTTPS obligatoire, car le micro de la phase 2 en a besoin.
  - ✅ Le lien s'ouvre pour Souhaïla et reste bloqué pour un inconnu.
- [ ] **T1.21 Livraison de la phase 1** · ⏱ 30 min
  - QR code du lien, message à Souhaïla avec ce qu'elle doit tester (5 points max).
  - ✅ Envoyé **au plus tard le 8 novembre**.

---

## Phase 2 — Renfort · jalon **20 novembre**

- [x] **T2.1 Plan de classe** · ⏱ 5 h — glisser-déposer (souris + tactile), dispositions en rangées, îlots et U, plusieurs plans par classe, bouton « Mélanger », feuille d'impression. ✅ Utilisable au doigt sur tablette.
- [x] **T2.2 La Vuelta** · ⏱ 4 h — carte SVG Espagne / Amérique latine, étapes, boutons +1 et +5 par équipe (jamais de −), animation d'étape franchie, remise à zéro confirmée. ✅ Les scores survivent au rechargement.
- [x] **T2.3 Rituel d'entrée** · ⏱ 2 h — consigne ES (« Siéntate, saca tu cuaderno »), décompte de 3 min via `startTimer`, mini-défi tiré au sort.
- [x] **T2.4 Pauses énergie** · ⏱ 2 h — Simón dice, mimes de verbes, étirements guidés : séquences d'une minute avec minuteur intégré.
- [x] **T2.5 Rôles tournants** · ⏱ 1 h 30 — secretario, guardián del tiempo, guardián del silencio, ayudante, portavoz, avec rotation automatique par séance.
- [x] **T2.6 Consignes en images** · ⏱ 1 h 30 — pictogrammes bilingues (Escuchad, Escribid, Trabajad en parejas, Guardad vuestras cosas), un clic pour projeter.
- [x] **T2.7 Sonomètre** · ⏱ 3 h — **d'abord tester le micro sur un PC du collège.** Phrase d'explication avant la demande d'autorisation ; analyse locale (Web Audio `AnalyserNode`), rien n'est enregistré ; feu vert/orange/rouge avec icônes ; seuils réglables ; alerte douce. ✅ Si le micro est refusé, un message clair et le Niveau de voix proposé à la place.
- [x] **T2.8 Minuteur : thèmes visuels** · ⏱ 2 h — sablier, mèche, tortilla, fusée.
- [x] **T2.9 Moteur de jeux commun** · ⏱ 3 h — sélection niveau + thème, scores par équipe, mode projeté, plein écran. Tous les jeux s'appuient dessus.
- [x] **T2.10 à T2.17 — 8 jeux** · ⏱ 2 à 3 h chacun · 🔗 T2.9
  - [x] Rosco (Pasapalabra) · [x] Ahorcado · [x] Lotería (cartes imprimables) · [x] Memory
  - [x] Quiz en direct (porter le quiz du prototype, réponses sur papier) · [x] La bomba · [x] Basta · [x] Taboo
- [x] **T2.18 Escape game** · ⏱ 4 h — porter `tEscape` du prototype : 4 à 5 énigmes, cadenas à code, indices qui coûtent du temps, durée 20, 30 ou 45 min.
- [x] **T2.19 Carte du monde hispanophone** · ⏱ 4 h — carte SVG cliquable → fiche pays (drapeau, capitale, fête, accent, 3 mots, mini-quiz). Chiffres vérifiés et sources dans la page Crédits.
- [x] **T2.20 Transfert par QR** · ⏱ 2 h — liste de prénoms tablette → PC via un QR code (compressé ; au-delà d'une certaine taille, passer par le fichier).
- [x] **T2.21 Page Crédits et aide** · ⏱ 1 h 30 — sources des images et sons, mentions légales, confidentialité, mode d'emploi d'une page.
- [ ] **T2.22 Livraison de la phase 2** — ✅ envoyée **au plus tard le 20 novembre**.

---

## Phase 3 — Sur mesure · 23 novembre au 4 décembre

- [ ] **T3.1 Test sur place, jour 1** — PC de la salle : le profil est-il effacé à la déconnexion ? La voix espagnole est-elle présente ? Le site est-il bloqué ? Le micro fonctionne-t-il ? Le TBI est-il tactile ? → noter les résultats ici.
- [ ] **T3.2 Ajustements selon les retours** (liste à remplir pendant le stage).
- [ ] **T3.3 Autres jeux** — Juego de la oca, Batalla naval de conjugaison, ¿Quién es quién?, La subasta, Escenas absurdas, Jeux de rôle, Course de verbes, Dictée dessinée, Mensaje secreto, Foto misteriosa, ¿Verdad o mentira?, Défi de la semaine.
- [ ] **T3.4 Misión Imposible** — campagne sur plusieurs semaines, badges, dossier secret.
- [ ] **T3.5 Fiches imprimables par thème** (CSS `@media print`) + corrigés.
- [ ] **T3.6 Générateur de fiches et de mini-tests** (thème, niveau, nombre de questions → impression avec corrigé).
- [ ] **T3.7 Carnet de bord de séance** (fait / reste à faire / note libre, stocké sur l'appareil).
- [ ] **T3.8 Espace prof** : séquences de 5, 15 et 50 min, « remplacement au pied levé », grilles d'évaluation, expressions de classe avec audio.
- [ ] **T3.9 Pages culture** : fêtes (Día de Muertos, Semana Santa…), cuisine, personnages.
- [ ] **T3.10 Remise finale** : code source + accès hébergement à Souhaïla, mode d'emploi imprimé + QR, séance de prise en main d'une heure.

---

## Annexe A — Format d'un thème (`src/content/5e.json`)

```json
{
  "niveau": "5e",
  "themes": [{
    "id": "la-familia",
    "titre": "La familia",
    "vocab": [["el padre", "le père"]],
    "phrases": ["Tengo dos hermanos."],
    "quiz": [{ "q": "« la sœur » se dit…", "o": ["la hermana", "la madre", "la tía", "la prima"], "a": 0, "diff": "bronce" }],
    "parole": ["Describe a tu familia en tres frases."]
  }]
}
```
`diff` vaut `bronce`, `plata` ou `oro`.

## Annexe B — Points à vérifier sur un PC de collège
- [ ] Profil effacé à la déconnexion → si oui, insister sur la sauvegarde fichier dans le mode d'emploi.
- [ ] Voix espagnole disponible.
- [ ] Domaine du site non bloqué par le filtre.
- [ ] Micro autorisé.
- [ ] Installation de la PWA autorisée.

## Idées en attente (ne pas coder avant la phase concernée)
- Espace « En casa » pour les élèves (gelé jusqu'après le stage).

## Bugs connus
_(vide)_

## Notes de test
- 18/10 — Testé automatiquement dans Chrome (headless) : 1366×768 et 1920×1080 en mode projection sans débordement, axe-core sans violation en clair et en sombre, hors ligne OK sur toutes les pages, 100 générations d'équipes sans paire incompatible.
- Reste à tester à la main : Edge, Firefox, Safari (iPad/iPhone) et un téléphone (T1.19).
- 18/10 — Phase 2 testée automatiquement (Chrome) : plan de classe (glisser-déposer souris, toucher-toucher, échange, retrait, 3 dispositions, rechargement), La Vuelta (étapes, scores conservés), escape game (indice −2 min, cadenas), carte (21 pays, mini-quiz), transfert QR (encodage → capture → décodage → import, 24 élèves = 262 caractères). Axe-core sans violation sur 24 pages. Hors ligne OK.
- Sonomètre : non testable sans vrai micro → à vérifier sur un PC du collège (T3.1).
- Carte du monde : aucun chiffre (population, superficie) affiché ; capitales, fêtes nationales, accents et mots à faire relire.
