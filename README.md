# Clase Viva

_(anciennement « El Rincón de la Profe » ; les clés de stockage internes `rincon.*` sont conservées pour ne perdre aucune donnée)_

Mini-site d'aide à la gestion de classe et à l'animation des cours d'espagnol (5e, 4e, 3e),
pour une professeure de collège. Stage de Souhaïla du 23/11 au 04/12/2026.

**Surprise : ne rien publier ni partager avant la remise du site.**

## Principes
- Utilisable debout, une main libre, 3 clics max.
- 3 espaces, chacun protégé par un mot secret (variables d'environnement Vercel, jamais dans le code).
- Données de l'espace gardées sur l'appareil (localStorage, marche hors ligne) et synchronisées dans Neon (Postgres, UE) ; 30 versions conservées par espace.
- Se déconnecter efface l'appareil. Sauvegarde fichier .json toujours possible en secours.
- Positif uniquement : les points ne se retirent jamais.
- Accessibilité : Atkinson Hyperlegible, jamais d'info par la couleur seule, bouton muet toujours visible.

## Stack
Vite + TypeScript (sans framework) · vite-plugin-pwa · polices auto-hébergées (@fontsource) · contenu en JSON.

## Lancer
```bash
npm install
npm run dev      # http://localhost:5173 (accessible sur le réseau local avec --host)
npm run build    # vérifie le contenu puis sortie dans dist/
npm test         # tests unitaires (équipes)
```

## Structure
```
src/
  main.ts            point d'entrée (son, projection, rappel sauvegarde, routes)
  router.ts          routeur par hash (#/herramientas ...)
  lib/storage.ts     localStorage + 10 points de retour + export/import .json
  lib/sync.ts        synchronisation de l'espace avec /api (Neon)
  lib/sound.ts       bips doux + mode muet
  lib/speech.ts      synthèse vocale espagnole (es-ES / es-MX)
  lib/state.ts       état partagé (update / subscribe)
  lib/timer.ts       compte à rebours sans dérive (startTimer)
  lib/content.ts     accès au contenu : axes, thèmes, activités, refranes
  pages/             une vue par page (profe/ : classes, sauvegardes, QR)
  tools/             un fichier par outil de classe (TOOLS dans index.ts)
  games/             moteur de jeux commun + un fichier par jeu
  content/           niveaux (6 axes officiels), activités, SOS, escape, pays (JSON, vérifiés au build)
scripts/
  check-content.mjs  validation du contenu, lancée par npm run build
docs/
  ROADMAP.md         phases et checklist
  prototype/         prototype « La Clase Viva » (référence visuelle et code à porter)
```

## Espaces et base de données (Vercel + Neon)
1. Vercel → projet → Storage → Neon (région Frankfurt) : crée `DATABASE_URL`.
2. Vercel → Settings → Environment Variables : voir `.env.example` (`SESSION_SECRET`, `ESPACE_n_NOM`, `ESPACE_n_SECRET`).
3. Redéployer. Les tables se créent seules au premier appel.

Connexion : un seul champ « mot secret », qui ouvre l'espace auquel il appartient (les 3 mots secrets doivent être différents).
Fonctions serveur dans `api/` : `login` (15 essais ratés / 15 min), `logout`, `session`, `data` (GET / PUT avec détection de conflit).
