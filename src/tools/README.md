Un fichier par outil de classe, déclaré dans index.ts (TOOLS).
Chaque outil exporte une fonction `(el, params) => cleanup` : il dessine dans `el`,
lit ses options dans `params` (ex. `#/herramientas/minuteur?t=120`) et renvoie
une fonction qui arrête ses minuteries et raccourcis clavier.
