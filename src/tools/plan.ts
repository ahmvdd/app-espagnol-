import type { Tool } from './index';
import type { Classe, Plan } from '../lib/storage';
import { state, update, uid } from '../lib/state';
import { classeOptions, currentClasseId, rememberClasse } from '../lib/classes';
import { confirmModal } from '../lib/modal';
import { $, $$, esc, shuffle, toast } from '../lib/ui';

type Seat = { x: number; y: number; table: number };
type Dispo = Plan['disposition'];

const DISPOS: { id: Dispo; label: string }[] = [
  { id: 'rangees', label: '▤ Rangées' },
  { id: 'ilots', label: '▦ Îlots' },
  { id: 'u', label: '⊔ En U' }
];

/** Places en % de la salle (le tableau est en haut). Même « table » = voisins. */
function seats(d: Dispo): Seat[] {
  const out: Seat[] = [];
  if (d === 'rangees') {
    [16, 39, 61, 84].forEach((cx, c) => [27, 45, 63, 81].forEach((y, r) => {
      const table = r * 4 + c;
      out.push({ x: cx - 5, y, table }, { x: cx + 5, y, table });
    }));
  } else if (d === 'ilots') {
    [16, 39, 61, 84].forEach((cx, c) => [38, 75].forEach((cy, r) => {
      const table = r * 4 + c;
      for (const [dx, dy] of [[-5, -7], [5, -7], [-5, 7], [5, 7]]) out.push({ x: cx + dx, y: cy + dy, table });
    }));
  } else {
    for (let i = 0; i < 10; i++) out.push({ x: 7, y: 22 + i * 7.6, table: Math.floor(i / 2) });
    for (let i = 0; i < 10; i++) out.push({ x: 17 + i * 7.3, y: 92, table: 5 + Math.floor(i / 2) });
    for (let i = 0; i < 10; i++) out.push({ x: 93, y: 90.4 - i * 7.6, table: 10 + Math.floor(i / 2) });
  }
  return out.sort((a, b) => a.y - b.y || a.x - b.x);
}

const plansDe = (c: Classe) => state.plans.filter(p => p.classeId === c.id);

/** Placement aléatoire en évitant de mettre côte à côte (même table) les élèves incompatibles. */
function melanger(c: Classe, p: Plan) {
  const st = seats(p.disposition);
  const bad = new Set(c.incompatibles.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]));
  let best: (string | null)[] = [];
  for (let k = 0; k < 200; k++) {
    const ids: (string | null)[] = shuffle(c.eleves.map(e => e.id)).slice(0, st.length);
    while (ids.length < st.length) ids.push(null);
    const placed = shuffle(ids);
    const ok = st.every((s, i) => st.every((t, j) => j <= i || s.table !== t.table || !placed[i] || !placed[j] || !bad.has(`${placed[i]}|${placed[j]}`)));
    best = placed;
    if (ok) return { places: placed, ok: true };
  }
  return { places: best, ok: false };
}

const planTool: Tool = el => {
  let src = currentClasseId();
  let planId = '';
  let selection: { from: 'liste' | number; id: string } | null = null;

  const classe = () => state.classes.find(c => c.id === src);
  const plan = () => state.plans.find(p => p.id === planId);

  const assurerPlan = (c: Classe) => {
    if (plansDe(c).some(p => p.id === planId)) return;
    planId = plansDe(c)[0]?.id ?? '';
    if (!planId) {
      const p: Plan = { id: uid(), classeId: c.id, nom: 'Plan 1', disposition: 'rangees', places: seats('rangees').map(() => null) };
      update(s => s.plans.push(p));
      planId = p.id;
    }
  };

  const placer = (cible: number | 'liste') => {
    const p = plan()!, sel = selection!;
    update(() => {
      if (cible === 'liste') { if (sel.from !== 'liste') p.places[sel.from] = null; return; }
      const occupant = p.places[cible];
      if (sel.from !== 'liste') p.places[sel.from] = occupant;
      p.places[cible] = sel.id;
    });
    selection = null;
    render();
  };

  const render = () => {
    const c = classe();
    if (!c?.eleves.length) {
      el.innerHTML = `
        ${state.classes.length ? `<label class="field">Classe <select id="src">${classeOptions(src)}</select></label>` : ''}
        <p class="center big">Il faut d’abord une classe avec des prénoms.</p>
        <p class="center"><a class="btn" href="#/profe">Gérer les classes</a></p>`;
      $<HTMLSelectElement>('#src', el)?.addEventListener('change', e => { src = (e.target as HTMLSelectElement).value; rememberClasse(src); render(); });
      return;
    }
    assurerPlan(c);
    const p = plan()!;
    const st = seats(p.disposition);
    const nom = new Map(c.eleves.map(e => [e.id, e.prenom]));
    p.places = p.places.slice(0, st.length).map(id => (id && nom.has(id) ? id : null));
    while (p.places.length < st.length) p.places.push(null);
    const nonPlaces = c.eleves.filter(e => !p.places.includes(e.id));
    const tables = [...new Set(st.map(s => s.table))].map(t => {
      const ss = st.filter(s => s.table === t);
      const xs = ss.map(s => s.x), ys = ss.map(s => s.y);
      return { l: Math.min(...xs) - 5, t: Math.min(...ys) - 4.5, w: Math.max(...xs) - Math.min(...xs) + 10, h: Math.max(...ys) - Math.min(...ys) + 9 };
    });

    el.innerHTML = `
      <div class="row wrap plan-barre">
        <label class="field">Classe <select id="src">${classeOptions(src)}</select></label>
        <label class="field">Plan
          <select id="plan">${plansDe(c).map(x => `<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>${esc(x.nom)}</option>`).join('')}</select></label>
        <button class="btn ghost sm" id="new">+ Nouveau plan</button>
        <button class="btn ghost sm" id="rename">Renommer</button>
        <button class="btn ghost sm danger" id="del">Supprimer</button>
      </div>
      <div class="row wrap plan-barre">
        <div class="row wrap" role="group" aria-label="Disposition">${DISPOS.map(d => `<button class="btn ghost sm" data-d="${d.id}" aria-pressed="${d.id === p.disposition}">${d.label}</button>`).join('')}</div>
        <button class="btn sm" id="mix">🔀 Mélanger</button>
        <button class="btn ghost sm" id="vider">Vider</button>
        <button class="btn ghost sm" id="print">🖨 Imprimer</button>
      </div>
      <div class="plan">
        <section class="non-places panel" data-liste aria-label="Élèves non placés">
          <h2 class="h3">À placer (${nonPlaces.length})</h2>
          <div class="chips">${nonPlaces.map(e => `<button class="chip" data-drag="${e.id}" data-from="liste" aria-pressed="${selection?.id === e.id}">${esc(e.prenom)}</button>`).join('') || '<p class="muted small">Tout le monde est placé.</p>'}</div>
          <p class="muted small">Glisse un prénom sur une place, ou touche-le puis touche la place. Glisse un élève ici pour le retirer.</p>
        </section>
        <div class="salle ${p.disposition}" id="salle">
          <div class="tableau">Tableau · Pizarra</div>
          ${tables.map(t => `<i class="table" style="left:${t.l}%;top:${t.t}%;width:${t.w}%;height:${t.h}%"></i>`).join('')}
          ${st.map((s, i) => {
            const id = p.places[i];
            return `<button class="place ${id ? 'pleine' : ''} ${selection?.from === i ? 'sel' : ''}" data-seat="${i}" ${id ? `data-drag="${id}" data-from="${i}"` : ''}
              style="left:${s.x}%;top:${s.y}%" aria-label="Place ${i + 1}${id ? ' : ' + esc(nom.get(id)) : ', libre'}">${id ? esc(nom.get(id)) : ''}</button>`;
          }).join('')}
        </div>
      </div>`;

    $<HTMLSelectElement>('#src', el).onchange = e => { src = (e.target as HTMLSelectElement).value; rememberClasse(src); planId = ''; selection = null; render(); };
    $<HTMLSelectElement>('#plan', el).onchange = e => { planId = (e.target as HTMLSelectElement).value; selection = null; render(); };
    $('#new', el).onclick = () => {
      const np: Plan = { id: uid(), classeId: c.id, nom: `Plan ${plansDe(c).length + 1}`, disposition: p.disposition, places: st.map(() => null) };
      update(s => s.plans.push(np)); planId = np.id; render();
    };
    $('#rename', el).onclick = () => {
      const lab = $('#plan', el).parentElement!;
      lab.innerHTML = `Plan <form class="row" id="ren"><input id="ren-in" value="${esc(p.nom)}" aria-label="Nom du plan"><button class="btn sm">OK</button></form>`;
      const inp = $<HTMLInputElement>('#ren-in', el); inp.focus(); inp.select();
      $<HTMLFormElement>('#ren', el).onsubmit = ev => { ev.preventDefault(); update(() => { p.nom = inp.value.trim() || p.nom; }); render(); };
    };
    $('#del', el).onclick = async () => {
      if (!(await confirmModal(`Supprimer « ${p.nom} » ?`, 'Le plan sera effacé de cet appareil.', 'Supprimer', { danger: true }))) return;
      update(s => { s.plans = s.plans.filter(x => x !== p); }); planId = ''; render();
    };
    $$('[data-d]', el).forEach(b => b.onclick = () => {
      const d = b.dataset.d as Dispo;
      update(() => { const ids = p.places.filter(Boolean); p.disposition = d; p.places = seats(d).map((_, i) => ids[i] ?? null); });
      render();
    });
    $('#mix', el).onclick = () => {
      const r = melanger(c, p);
      update(() => { p.places = r.places; });
      if (!r.ok) toast('Impossible de séparer toutes les paires : plan fait au mieux');
      if (c.eleves.length > st.length) toast(`${c.eleves.length - st.length} élève(s) sans place dans cette disposition`);
      render();
    };
    $('#vider', el).onclick = () => { update(() => { p.places = p.places.map(() => null); }); render(); };
    $('#print', el).onclick = () => {
      const zone = document.createElement('div');
      zone.className = 'print-area';
      zone.innerHTML = `<h1 class="print-titre">${esc(c.nom)} · ${esc(p.nom)}</h1>${$('#salle', el).outerHTML}`;
      document.body.append(zone);
      addEventListener('afterprint', () => zone.remove(), { once: true });
      print();
    };

    // Toucher pour sélectionner puis toucher la destination (clavier et tablette).
    $$<HTMLButtonElement>('[data-seat], [data-from="liste"]', el).forEach(b => b.onclick = () => {
      if (justDragged) return;
      const seat = b.dataset.seat !== undefined ? Number(b.dataset.seat) : null;
      if (selection) {
        if (seat !== null) return placer(seat);
        if (b.dataset.from === 'liste') { selection = { from: 'liste', id: b.dataset.drag! }; return render(); }
      }
      if (b.dataset.drag) { selection = { from: seat ?? 'liste', id: b.dataset.drag }; render(); }
    });
    $('[data-liste]', el).addEventListener('click', e => { if (selection && selection.from !== 'liste' && !(e.target as HTMLElement).closest('[data-drag]')) placer('liste'); });
  };

  // Glisser-déposer à la souris et au doigt (Pointer Events).
  let drag: { id: string; from: 'liste' | number; x: number; y: number; ghost?: HTMLElement } | null = null;
  let justDragged = false;
  const down = (e: PointerEvent) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-drag]');
    if (!t || !el.contains(t)) return;
    drag = { id: t.dataset.drag!, from: t.dataset.from === 'liste' ? 'liste' : Number(t.dataset.from), x: e.clientX, y: e.clientY };
  };
  const move = (e: PointerEvent) => {
    if (!drag) return;
    if (!drag.ghost && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
    if (!drag.ghost) {
      drag.ghost = document.createElement('div');
      drag.ghost.className = 'ghost-chip';
      drag.ghost.textContent = classe()?.eleves.find(x => x.id === drag!.id)?.prenom ?? '';
      document.body.append(drag.ghost);
    }
    drag.ghost.style.left = e.clientX + 'px';
    drag.ghost.style.top = e.clientY + 'px';
    e.preventDefault();
  };
  const up = (e: PointerEvent) => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.ghost) return;
    d.ghost.remove();
    justDragged = true; setTimeout(() => { justDragged = false; }, 50);
    const cible = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const seat = cible?.closest<HTMLElement>('[data-seat]');
    selection = { from: d.from, id: d.id };
    if (seat && el.contains(seat)) placer(Number(seat.dataset.seat));
    else if (cible?.closest('[data-liste]')) placer('liste');
    else { selection = null; render(); }
  };
  el.addEventListener('pointerdown', down);
  addEventListener('pointermove', move, { passive: false });
  addEventListener('pointerup', up);

  render();
  return () => {
    removeEventListener('pointermove', move);
    removeEventListener('pointerup', up);
  };
};

export default planTool;
