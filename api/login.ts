import { cookieSession, db, espaces, json, memeSecret } from './_lib.js';

const MAX_ESSAIS = 15; // essais ratés autorisés par quart d'heure, tous espaces confondus

/** Un seul mot secret : il désigne l'espace auquel il appartient. */
export async function POST(req: Request) {
  let body: { secret?: unknown };
  try { body = await req.json(); } catch { return json({ erreur: 'Requête illisible' }, 400); }
  if (typeof body.secret !== 'string' || !body.secret.trim()) return json({ erreur: 'Entre ton mot secret' }, 400);

  const { sql, pret } = db();
  await pret;
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM tentatives WHERE at > now() - interval '15 minutes'` as { n: number }[];
  if (n >= MAX_ESSAIS) return json({ erreur: 'Trop d’essais. Réessaie dans un quart d’heure.' }, 429);

  // On compare avec tous les espaces (même durée quel que soit le résultat)
  const secret = body.secret.trim();
  const trouves = espaces().filter(e => memeSecret(secret, e.secret));
  const esp = trouves.length === 1 ? trouves[0] : null; // deux espaces avec le même secret : refusé
  if (!esp) {
    await sql`INSERT INTO tentatives (espace) VALUES ('*')`;
    await new Promise(r => setTimeout(r, 600)); // ralentit les essais en série
    return json({ erreur: 'Mot secret incorrect' }, 401);
  }
  await sql`DELETE FROM tentatives WHERE at < now() - interval '1 day'`;
  return json({ id: esp.id, nom: esp.nom }, 200, { 'set-cookie': cookieSession(esp.id) });
}
