export type Niveau = '5e' | '4e' | '3e';
export type Diff = 'bronce' | 'plata' | 'oro';
export type Ambiance = 'calme' | 'normale' | 'agitee';

export type Question = { q: string; o: string[]; a: number; diff: Diff };

export type Theme = {
  id: string;
  titre: string;
  /** false tant que l'espagnol n'a pas été relu. */
  relu: boolean;
  vocab: [string, string][];
  phrases: string[];
  quiz: Question[];
  parole: string[];
};

export type NiveauFile = { niveau: Niveau; couleur: string; themes: Theme[] };

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
export type Refran = [string, string];
