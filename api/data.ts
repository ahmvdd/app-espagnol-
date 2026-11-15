import { db, json, lireSession, MAX_OCTETS, VERSIONS_GARDEES } from './_lib.js';

type Ligne = { data: unknown; updated_at: string };

/** Données de l'espace connecté. */
export async function GET(req: Request) {
  const s = lireSession(req);
  if (!s) return json({ erreur: 'Non connecté' }, 401);
  const { sql, pret } = db();
  await pret;
  const [row] = await sql`SELECT data, updated_at FROM espaces WHERE id = ${s.id}` as Ligne[];
  return json(row ? { data: row.data, updatedAt: new Date(row.updated_at).toISOString() } : { data: null, updatedAt: null });
}

/**
 * Enregistre les données. `base` = date de la version sur laquelle l'appareil a travaillé :
 * si un autre appareil a enregistré entre-temps, on refuse (409) et on renvoie la version en ligne.
 * La version remplacée est toujours gardée dans l'historique (30 dernières).
 */
export async function PUT(req: Request) {
  const s = lireSession(req);
  if (!s) return json({ erreur: 'Non connecté' }, 401);
  const texte = await req.text();
  if (texte.length > MAX_OCTETS) return json({ erreur: 'Données trop volumineuses' }, 413);
  let body: { data?: unknown; base?: unknown; force?: unknown };
  try { body = JSON.parse(texte); } catch { return json({ erreur: 'Requête illisible' }, 400); }
  const d = body.data as Record<string, unknown> | undefined;
  if (!d || typeof d !== 'object' || !Array.isArray(d.classes)) return json({ erreur: 'Format inconnu' }, 400);

  const { sql, pret } = db();
  await pret;
  const [row] = await sql`SELECT data, updated_at FROM espaces WHERE id = ${s.id}` as Ligne[];
  if (row && body.force !== true) {
    const enLigne = new Date(row.updated_at).toISOString();
    if (body.base !== enLigne) return json({ conflit: true, data: row.data, updatedAt: enLigne }, 409);
  }
  const contenu = JSON.stringify(d);
  const [res] = await sql.transaction([
    ...(row ? [sql`INSERT INTO versions (espace, data) VALUES (${s.id}, ${JSON.stringify(row.data)}::jsonb)`] : []),
    sql`INSERT INTO espaces (id, data, updated_at) VALUES (${s.id}, ${contenu}::jsonb, now())
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now() RETURNING updated_at`,
    sql`DELETE FROM versions WHERE espace = ${s.id} AND n NOT IN (SELECT n FROM versions WHERE espace = ${s.id} ORDER BY n DESC LIMIT ${VERSIONS_GARDEES})`
  ]).then(r => r[row ? 1 : 0]) as Ligne[];
  return json({ updatedAt: new Date(res.updated_at).toISOString() });
}
