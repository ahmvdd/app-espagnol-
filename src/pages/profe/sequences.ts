import type { Niveau } from '../../content/types';
import type { Sequence } from '../../lib/storage';
import { state, update } from '../../lib/state';
import { AXES, COULEUR, CECRL, NIVEAUX, THEMES, dernierTheme } from '../../lib/content';
import { currentClasseId } from '../../lib/classes';
import { modifierSuivi, suiviDe } from '../../lib/suivi';
import { creerSequence, DUREES_SEANCE, NB_SEANCES } from '../../lib/sequence';
import { apercu, SITE_NOM } from '../../lib/documents';
import { confirmModal } from '../../lib/modal';
import { btnAide } from '../../lib/aide';
import { $, $$, esc, toast } from '../../lib/ui';

const titreChap = (n: Niveau, id: string) => THEMES[n].find(t => t.id === id)?.titreFr ?? id;
const nomClasse = (id?: string) => state.classes.find(c => c.id === id)?.nom;

/** Version imprimable de la séquence. */
function seqHtml(s: Sequence): string {
  const n = s.niveau;
  return `<article class="doc doc-seq" style="--c:${COULEUR[n]}">
    <header class="doc-tete">
      <div class="doc-ligne-haut"><span class="doc-site">${SITE_NOM}</span><span class="doc-niv">${n} · ${CECRL[n]}</span> <span class="doc-type">Séquence</span></div>
      <h1>${esc(s.titre)}</h1>
      <p>${s.nbSeances} séances de ${s.duree} min${nomClasse(s.classeId) ? ` · classe ${esc(nomClasse(s.classeId)!)}` : ''}</p>
    </header>
    ${s.seances.map((x, i) => `<section class="doc-bloc">
      <h2>Séance ${i + 1} · ${esc(x.titre)}</h2>
      <p><strong>Objectif :</strong> ${esc(x.objectif)}</p>
      <table class="doc-table"><tbody>${x.etapes.map(e => `<tr><td class="doc-min">${e.min} min</td><td>${esc(e.texte)}</td></tr>`).join('')}</tbody></table>
      ${x.devoirs ? `<p><strong>Pour la prochaine fois :</strong> ${esc(x.devoirs)}</p>` : ''}
    </section>`).join('')}
    ${s.notes ? `<section class="doc-bloc"><h2>Notes</h2><p>${esc(s.notes)}</p></section>` : ''}
  </article>`;
}

export function renderSequences(el: HTMLElement): void {
  const q = new URLSearchParams(location.hash.split('?')[1] ?? '');
  let ouverte: string | null = q.get('id');
  let cid = state.classes.length ? currentClasseId() : '';
  let niveau: Niveau = (NIVEAUX.includes(q.get('n') as Niveau) ? q.get('n') : state.classes.find(c => c.id === cid)?.niveau ?? '5e') as Niveau;
  let chap = THEMES[niveau].some(t => t.id === q.get('t')) ? q.get('t')! : dernierTheme(niveau).id;
  if (q.get('n')) cid = state.classes.find(c => c.niveau === niveau)?.id ?? '';
  let nb = 5, duree = 55;
  let filtre: 'tous' | Niveau = 'tous';

  const enregistrer = (s: Sequence) => update(d => { const i = d.sequences.findIndex(x => x.id === s.id); if (i >= 0) d.sequences[i] = s; });

  const liste = () => {
    el.innerHTML = `
      <section class="panel seq-form">
        <h2>🗂 Créer une séquence ${btnAide('sequence')}</h2>
        <div class="field">Classe
          <div class="row wrap" role="group" aria-label="Classe">
            ${state.classes.map(c => `<button class="btn ghost sm" data-c="${c.id}" aria-pressed="${c.id === cid}">${esc(c.nom || 'Sans nom')} · ${c.niveau}</button>`).join('')}
            <button class="btn ghost sm" data-c="" aria-pressed="${cid === ''}">Sans classe</button>
          </div>
        </div>
        ${cid ? '' : `<div class="field">Niveau <div class="row wrap" role="group" aria-label="Niveau">${NIVEAUX.map(n => `<button class="btn ghost sm" data-n="${n}" aria-pressed="${n === niveau}">${n}</button>`).join('')}</div></div>`}
        <label class="field">Chapitre
          <select id="chap">${AXES[niveau].filter(a => a.themes.length).map(a => `<optgroup label="Axe ${a.n} · ${esc(a.titre)}">
            ${a.themes.map(t => `<option value="${t.id}" ${t.id === chap ? 'selected' : ''}>${esc(t.titreFr)}</option>`).join('')}</optgroup>`).join('')}
          </select>
        </label>
        <div class="field">Nombre de séances <div class="row wrap" role="group" aria-label="Nombre de séances">${NB_SEANCES.map(k => `<button class="btn ghost sm" data-nb="${k}" aria-pressed="${k === nb}">${k}</button>`).join('')}</div></div>
        <div class="field">Durée d’une séance <div class="row wrap" role="group" aria-label="Durée">${DUREES_SEANCE.map(k => `<button class="btn ghost sm" data-d="${k}" aria-pressed="${k === duree}">${k} min</button>`).join('')}</div></div>
        <button class="btn bigbtn" id="creer">Créer la séquence</button>
      </section>
      <h2>Mes séquences</h2>
      ${state.sequences.length ? `
        <div class="row wrap" role="group" aria-label="Filtrer par niveau">
          ${(['tous', ...NIVEAUX] as const).map(f => `<button class="btn ghost sm" data-filtre="${f}" aria-pressed="${f === filtre}">${f === 'tous' ? 'Tous les niveaux' : f} <span class="muted small">(${f === 'tous' ? state.sequences.length : state.sequences.filter(s => s.niveau === f).length})</span></button>`).join('')}
        </div>
        ${NIVEAUX.filter(nv => (filtre === 'tous' || filtre === nv) && state.sequences.some(s => s.niveau === nv)).map(nv => `
          <section class="seq-niveau">
            <h3><span class="niveau-badge" style="background:${COULEUR[nv]}">${nv}</span> ${state.sequences.filter(s => s.niveau === nv).length} séquence(s)</h3>
            <div class="seq-liste">${state.sequences.filter(s => s.niveau === nv)
              .sort((a, b) => (nomClasse(a.classeId) ?? '').localeCompare(nomClasse(b.classeId) ?? '') || b.creeLe.localeCompare(a.creeLe)).map(s => `
              <div class="panel seq-carte">
                <div><strong>${esc(s.titre)}</strong><br><span class="muted small">${nomClasse(s.classeId) ? `Classe ${esc(nomClasse(s.classeId)!)} · ` : ''}${s.nbSeances} séances · ${s.duree} min · créée le ${new Date(s.creeLe).toLocaleDateString('fr-FR')}</span></div>
                <div class="row wrap"><button class="btn sm" data-ouvrir="${s.id}">Ouvrir</button><button class="btn ghost sm danger" data-suppr="${s.id}">Supprimer</button></div>
              </div>`).join('')}</div>
          </section>`).join('') || '<p class="muted">Aucune séquence pour ce niveau.</p>'}` : '<p class="muted">Aucune séquence pour l’instant : crée la première avec le formulaire.</p>'}`;

    $$('[data-filtre]', el).forEach(b => b.onclick = () => { filtre = b.dataset.filtre as typeof filtre; liste(); });

    $$('[data-c]', el).forEach(b => b.onclick = () => {
      cid = b.dataset.c!;
      const c = state.classes.find(x => x.id === cid);
      if (c && c.niveau !== niveau) { niveau = c.niveau; chap = dernierTheme(niveau).id; }
      liste();
    });
    $$('[data-n]', el).forEach(b => b.onclick = () => { niveau = b.dataset.n as Niveau; chap = dernierTheme(niveau).id; liste(); });
    $<HTMLSelectElement>('#chap', el).onchange = e => { chap = (e.target as HTMLSelectElement).value; };
    $$('[data-nb]', el).forEach(b => b.onclick = () => { nb = Number(b.dataset.nb); liste(); });
    $$('[data-d]', el).forEach(b => b.onclick = () => { duree = Number(b.dataset.d); liste(); });
    $('#creer', el).onclick = () => {
      const s = creerSequence(niveau, chap, nb, duree, cid || undefined);
      if (!s) return toast('Chapitre introuvable');
      update(d => { d.sequences.push(s); });
      const c = state.classes.find(x => x.id === cid);
      if (c && suiviDe(c, chap).statut === 'pas-vu') modifierSuivi(c, chap, x => { x.statut = 'en-cours'; });
      toast('Séquence créée ✓');
      ouverte = s.id; vue();
    };
    $$('[data-ouvrir]', el).forEach(b => b.onclick = () => { ouverte = b.dataset.ouvrir!; vue(); });
    $$('[data-suppr]', el).forEach(b => b.onclick = async () => {
      const s = state.sequences.find(x => x.id === b.dataset.suppr);
      if (!s || !(await confirmModal('Supprimer la séquence ?', `« ${s.titre} » sera supprimée.`, 'Supprimer', { danger: true }))) return;
      update(d => { d.sequences = d.sequences.filter(x => x.id !== s.id); });
      liste();
    });
  };

  const vue = () => {
    const s = state.sequences.find(x => x.id === ouverte);
    if (!s) { ouverte = null; return liste(); }
    const ed = (champ: string, val: string, cls = '') => `<span class="seq-ed ${cls}" contenteditable="true" spellcheck="true" data-ed="${champ}">${esc(val)}</span>`;
    el.innerHTML = `
      <div class="row wrap seq-barre">
        <button class="btn ghost sm" id="retour">← Mes séquences</button>
        <button class="btn sm" id="imprimer">🖨 Imprimer / PDF</button>
        <a class="btn ghost sm" href="#/nivel/${s.niveau}/${s.chapId}">📖 Ouvrir le chapitre</a>
        <span class="muted small" id="etat" aria-live="polite">Clique sur un texte pour le modifier : c’est enregistré tout seul.</span>
      </div>
      <h2 class="seq-titre">${ed('titre', s.titre)}</h2>
      <p class="muted">${s.niveau} · ${esc(titreChap(s.niveau, s.chapId))} · ${s.nbSeances} séances de ${s.duree} min${nomClasse(s.classeId) ? ` · ${esc(nomClasse(s.classeId)!)}` : ''}</p>
      ${s.seances.map((x, i) => `
        <section class="panel seq-seance">
          <h3>Séance ${i + 1} · ${ed(`s${i}.titre`, x.titre)} <span class="pill">${x.etapes.reduce((a, e) => a + e.min, 0)} min</span></h3>
          <p><strong>Objectif :</strong> ${ed(`s${i}.objectif`, x.objectif)}</p>
          <ol class="seq-etapes">${x.etapes.map((e, j) => `
            <li><input type="number" min="1" max="60" value="${e.min}" data-min="${i}.${j}" aria-label="Durée en minutes" class="seq-min"> min
              ${ed(`s${i}.e${j}`, e.texte, 'seq-texte')}
              ${e.lien ? `<a class="btn ghost sm" href="${e.lien}">Ouvrir ▸</a>` : ''}
              <button class="btn ghost sm" data-del="${i}.${j}" aria-label="Supprimer cette étape">✕</button></li>`).join('')}
          </ol>
          <button class="btn ghost sm" data-add="${i}">+ Ajouter une étape</button>
          <p><strong>Pour la prochaine fois :</strong> ${ed(`s${i}.devoirs`, x.devoirs || '—')}</p>
        </section>`).join('')}
      <section class="panel"><h3>Notes</h3>${ed('notes', s.notes || 'Tes remarques sur la séquence…', 'seq-notes')}</section>`;

    let t: number | undefined;
    const etat = $('#etat', el);
    const sauver = () => { clearTimeout(t); t = window.setTimeout(() => { enregistrer(s); etat.textContent = 'Enregistré ✓'; }, 500); };
    $$('[data-ed]', el).forEach(n => n.addEventListener('input', () => {
      const v = (n.textContent ?? '').trim(), k = n.dataset.ed!;
      const m = /^s(\d+)\.(titre|objectif|devoirs|e(\d+))$/.exec(k);
      if (k === 'titre') s.titre = v;
      else if (k === 'notes') s.notes = v;
      else if (m) {
        const x = s.seances[Number(m[1])];
        if (m[3] !== undefined) x.etapes[Number(m[3])].texte = v;
        else (x as Record<string, unknown>)[m[2]] = v;
      }
      etat.textContent = 'Modification…'; sauver();
    }));
    $$<HTMLInputElement>('[data-min]', el).forEach(inp => inp.onchange = () => {
      const [i, j] = inp.dataset.min!.split('.').map(Number);
      s.seances[i].etapes[j].min = Math.max(1, Math.min(60, Number(inp.value) || 1));
      enregistrer(s); vue();
    });
    $$('[data-del]', el).forEach(b => b.onclick = () => { const [i, j] = b.dataset.del!.split('.').map(Number); s.seances[i].etapes.splice(j, 1); enregistrer(s); vue(); });
    $$('[data-add]', el).forEach(b => b.onclick = () => { s.seances[Number(b.dataset.add)].etapes.push({ min: 5, texte: 'Nouvelle étape' }); enregistrer(s); vue(); });
    $('#retour', el).onclick = () => { ouverte = null; liste(); };
    $('#imprimer', el).onclick = () => apercu(`Séquence · ${s.titre}`, seqHtml(s));
    return () => clearTimeout(t);
  };

  ouverte ? vue() : liste();
}
