import { json, lireSession } from './_lib.js';

export function GET(req: Request) {
  const s = lireSession(req);
  return s ? json(s) : json({ erreur: 'Non connecté' }, 401);
}
