export type Niveau = '5e' | '4e' | '3e';
export type Diff = 'bronce' | 'plata' | 'oro';
export type Ambiance = 'calme' | 'normale' | 'agitee';

export type Question = { q: string; o: string[]; a: number; diff: Diff };

export type Theme = {
  id: string;
  titre: string;
  /** Objet d'étude du programme auquel le thème se rattache. */
  objet: string;
  /** false tant que l'espagnol n'a pas été relu. */
  relu: boolean;
  vocab: [string, string][];
  phrases: string[];
  quiz: Question[];
  parole: string[];
  /** « Lo que aprendí sobre el mundo hispánico » : repères culturels, en français. */
  culture: string[];
};

/** Axe culturel du programme officiel (BO 2025, nouveaux programmes de LVER). */
export type Axe = { n: number; titre: string; objets: string[]; themes: Theme[]; obligatoire?: boolean };

export type NiveauFile = { niveau: Niveau; couleur: string; cecrl: string; axes: Axe[]; grammaire: string[] };

export type Activite = {
  id: string;
  titre: string;
  consigne: string;
  duree: number;
  niveaux: Niveau[];
  ambiance: Ambiance;
  /** Route à ouvrir ; `{n}` est remplacé par le niveau choisi. */
  outil?: string;
  materiel?: string;
};

export type Idee = { texte: string; lien: string; action: string };
export type Situation = { titre: string; icon: string; idees: Idee[] };
