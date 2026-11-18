import { db, json, lireSession } from './_lib.js';

/**
 * Génère un diaporama avec Gemini, sans quitter le site.
 * La clé reste côté serveur : variable d'environnement GEMINI_API_KEY (Vercel).
 * Modèle : GEMINI_MODEL (par défaut gemini-3.8-flash).
 */
const MAX_PAR_HEURE = 30;
const BORNES = { apercu: [5, 8], synthese: [10, 15] } as const;

type Diapo = { ico?: string; titre: string; corps: string; reponse?: string; note?: string; grand?: boolean };

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    diapos: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          ico: { type: 'STRING', description: 'Un seul emoji illustrant la diapo' },
          titre: { type: 'STRING', description: 'Titre court, en espagnol' },
          lignes: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Une ligne par puce, courtes' },
          reponse: { type: 'STRING', description: 'Seulement pour une mini-question : la réponse, révélée au clic' },
          note: { type: 'STRING', description: 'Note pour l’enseignante, en français (non projetée)' },
          grand: { type: 'BOOLEAN', description: 'true pour une diapo de titre centrée (première et dernière)' }
        },
        required: ['titre', 'lignes']
      }
    }
  },
  required: ['diapos']
};

export async function POST(req: Request) {
  const s = lireSession(req);
  if (!s) return json({ erreur: 'Non connecté' }, 401);
  const cle = process.env.GEMINI_API_KEY;
  if (!cle) return json({ erreur: 'La génération avec Gemini n’est pas encore activée (clé GEMINI_API_KEY absente dans Vercel).', code: 'sans-cle' }, 503);

  let body: { consigne?: unknown; type?: unknown };
  try { body = await req.json(); } catch { return json({ erreur: 'Requête illisible' }, 400); }
  const type = body.type === 'synthese' ? 'synthese' : body.type === 'apercu' ? 'apercu' : null;
  if (!type || typeof body.consigne !== 'string' || body.consigne.length > 20_000) return json({ erreur: 'Demande invalide' }, 400);

  // Limite d'usage par espace (protège le quota gratuit)
  const { sql, pret } = db();
  await pret;
  await sql`CREATE TABLE IF NOT EXISTS generations (espace text NOT NULL, at timestamptz NOT NULL DEFAULT now())`;
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM generations WHERE espace = ${s.id} AND at > now() - interval '1 hour'` as { n: number }[];
  if (n >= MAX_PAR_HEURE) return json({ erreur: 'Beaucoup de diaporamas générés cette heure-ci : réessaie un peu plus tard.' }, 429);
  await sql`INSERT INTO generations (espace) VALUES (${s.id})`;

  const [min, max] = BORNES[type];
  const consigne = `${body.consigne}

Réponds uniquement avec le JSON demandé : entre ${min} et ${max} diapositives au total.
Chaque diapo : un emoji (ico), un titre court en espagnol, des lignes courtes (pas de paragraphe), une note pour l’enseignante en français.
Pour une mini-question : la question dans « lignes » (avec les choix éventuels A, B, C…), la réponse dans « reponse ».
Première et dernière diapo : grand = true.`;

  const modele = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  let r: Response;
  try {
    r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modele)}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': cle },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: consigne }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0.7 }
      })
    });
  } catch { return json({ erreur: 'Gemini ne répond pas : réessaie dans un instant.' }, 502); }
  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    console.error('Gemini', r.status, detail.slice(0, 500));
    return json({ erreur: r.status === 429 ? 'Quota Gemini atteint : réessaie plus tard.' : r.status === 400 || r.status === 403 ? 'Clé ou modèle Gemini refusé : vérifie GEMINI_API_KEY (et GEMINI_MODEL) dans Vercel.' : 'Gemini a renvoyé une erreur : réessaie.' }, 502);
  }

  let diapos: Diapo[] = [];
  try {
    const data = await r.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const texte = data.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? '';
    const brut = JSON.parse(texte) as { diapos?: { ico?: string; titre?: string; lignes?: string[]; reponse?: string; note?: string; grand?: boolean }[] };
    const court = (x: unknown, n: number) => String(x ?? '').trim().slice(0, n);
    diapos = (brut.diapos ?? []).slice(0, max).map(d => ({
      ico: court(d.ico, 8) || undefined,
      titre: court(d.titre, 120) || '…',
      corps: (Array.isArray(d.lignes) ? d.lignes : []).map(l => court(l, 220)).filter(Boolean).slice(0, 10).join('\n'),
      reponse: court(d.reponse, 200) || undefined,
      note: court(d.note, 400) || undefined,
      grand: d.grand === true || undefined
    })).filter(d => d.corps || d.grand);
  } catch { return json({ erreur: 'Réponse de Gemini illisible : réessaie.' }, 502); }
  if (diapos.length < Math.min(3, min)) return json({ erreur: 'Gemini n’a pas produit assez de diapos : réessaie.' }, 502);
  return json({ diapos: JSON.parse(JSON.stringify(diapos)) });
}
