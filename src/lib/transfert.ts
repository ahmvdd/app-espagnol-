import type { Classe } from './storage';

/** Au-delà, le QR devient illisible pour une webcam : on passe par le fichier de sauvegarde. */
export const MAX_QR = 1800;

type Paquet = { n: string; v: Classe['niveau']; e: string[]; i: [number, number][] };

const b64url = (u8: Uint8Array) => btoa(String.fromCharCode(...u8)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

async function pipe(data: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([data as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/** Classe → texte compact (deflate + base64url). Les ids ne voyagent pas : on les recrée à l'import. */
export async function encodeClasse(c: Classe): Promise<string> {
  const idx = new Map(c.eleves.map((e, k) => [e.id, k]));
  const p: Paquet = { n: c.nom, v: c.niveau, e: c.eleves.map(e => e.prenom), i: c.incompatibles.map(([a, b]) => [idx.get(a)!, idx.get(b)!]) };
  return b64url(await pipe(new TextEncoder().encode(JSON.stringify(p)), new CompressionStream('deflate-raw')));
}

export async function decodeClasse(s: string): Promise<Paquet> {
  let p: Paquet;
  try {
    p = JSON.parse(new TextDecoder().decode(await pipe(deB64url(s), new DecompressionStream('deflate-raw'))));
  } catch { throw new Error('Ce QR code n’est pas une classe du site.'); }
  if (typeof p?.n !== 'string' || !Array.isArray(p.e) || !['5e', '4e', '3e'].includes(p.v)) throw new Error('Ce QR code n’est pas une classe du site.');
  return { n: p.n, v: p.v, e: p.e.filter(x => typeof x === 'string').slice(0, 60), i: (p.i ?? []).filter(x => Array.isArray(x) && x.length === 2) };
}

export const lienImport = (code: string) => `${location.origin}${location.pathname}#/import/${code}`;

/** Extrait le code d'un lien d'import scanné (ou le code seul). */
export const codeDepuis = (texte: string) => texte.includes('#/import/') ? texte.split('#/import/')[1] : texte.trim();
