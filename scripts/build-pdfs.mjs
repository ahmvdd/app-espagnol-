// Génère les PDF de chaque chapitre (cours, synthèse, exercices, corrigés) dans dist/pdf/.
// De vrais fichiers hébergés avec le site : téléchargement fiable partout, même là où l'impression est bloquée.
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import puppeteer from 'puppeteer-core';

const DIST = new URL('../dist/', import.meta.url).pathname;
const CHROME = process.env.CHROME_PATH
  ?? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium']
    .find(p => existsSync(p));
if (!CHROME) {
  console.warn('⚠ Chrome introuvable (CHROME_PATH) : PDF non générés. Le bouton « Enregistrer en PDF » sera désactivé.');
  process.exit(0);
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const server = createServer((req, res) => {
  let p = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  let f = join(DIST, p);
  if (!f.startsWith(DIST) || !existsSync(f) || p.endsWith('/')) f = join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': TYPES[extname(f)] ?? 'application/octet-stream' });
  res.end(readFileSync(f));
}).listen(0);
const base = `http://localhost:${server.address().port}/`;

const niveaux = ['5e', '4e', '3e'];
const docs = ['cours', 'synthese', 'exercices', 'corriges',
  'fiche-prof', 'seance', 'projeter', 'cartes', 'simplifiee', 'difficile', 'evaluation', 'evaluation-corrige'];
const docsAxe = ['axe-vue', 'axe-oral', 'axe-taches'];
mkdirSync(join(DIST, 'pdf'), { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.goto(base, { waitUntil: 'networkidle0' });
let n = 0;
async function rendre(hash, titre, niv, paysage = false) {
  await page.evaluate(h => { location.hash = h; }, hash);
  await page.waitForSelector('.doc-ecran .doc');
  await page.evaluate(() => document.fonts.ready);
  const nom = await page.title();
  if (!/^\w+_axe\d(_chapitre\d+)?_[\w-]+\.pdf$/.test(nom)) throw new Error(`Nom de fichier inattendu pour ${hash} : ${nom}`);
  await page.pdf({
    path: join(DIST, 'pdf', nom), format: 'A4', landscape: paysage, printBackground: true,
    margin: { top: '12mm', bottom: '14mm', left: '12mm', right: '12mm' },
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: `<div style="font:8px sans-serif;width:100%;padding:0 12mm;display:flex;justify-content:space-between;color:#56607A">
      <span>Clase Viva · ${niv} · ${titre.replace(/[<&]/g, '')}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`
  });
  n++;
}
for (const niv of niveaux) {
  const contenu = JSON.parse(readFileSync(new URL(`../src/content/${niv}.json`, import.meta.url)));
  for (const axe of contenu.axes) {
    if (!axe.themes.length) continue;
    for (const d of docsAxe) await rendre(`#/doc/${niv}/axe${axe.n}/${d}`, `Axe ${axe.n}`, niv);
    for (const t of axe.themes) for (const d of docs) await rendre(`#/doc/${niv}/${t.id}/${d}`, t.titre, niv, d === 'projeter');
  }
}
await browser.close();
server.close();
console.log(`✓ ${n} PDF générés dans dist/pdf/`);
