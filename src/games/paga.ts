import type { Game } from './engine';
import type { Niveau } from '../content/types';
import { aDire, brancherADire, classement, dire, euros, lancerDe, numero, pion, prix } from './plateau';
import { startTimer, type Timer } from '../lib/timer';
import { beep, chime } from '../lib/sound';
import { $, $$, esc, pick, shuffle } from '../lib/ui';

/**
 * La paga del mes : un mois de budget sur un calendrier de 31 jours.
 * Chaque case fait parler espagnol : imprévus à lire, factures à calculer, météo, salaire à réclamer.
 * Montants : [5e, 4e/3e] (nombres jusqu'à 100 en 5e).
 */
type M = [number, number];
type Imprevisto = { es: string; fr: string; m: M };
type Factura = { es: string; fr: string; m: M };
type Tipo = 'inicio' | 'imprevisto' | 'factura' | 'tiempo' | 'domingo' | 'paga';

const IMPREVISTOS: Imprevisto[] = [
  { es: 'Vas al supermercado a comprar churros.', fr: 'Tu vas au supermarché acheter des churros.', m: [-3, -15] },
  { es: 'Encuentras dinero en la calle.', fr: 'Tu trouves de l’argent dans la rue.', m: [10, 50] },
  { es: 'Hace mal tiempo (llueve), pierdes el autobús y coges un taxi.', fr: 'Il fait mauvais (il pleut), tu rates le bus et tu prends un taxi.', m: [-5, -20] },
  { es: 'Es el cumpleaños de tu abuela: le compras flores.', fr: 'C’est l’anniversaire de ta grand-mère : tu lui achètes des fleurs.', m: [-5, -25] },
  { es: 'Tu tío te regala dinero por tus buenas notas.', fr: 'Ton oncle t’offre de l’argent pour tes bonnes notes.', m: [10, 40] },
  { es: 'Se rompe tu móvil: lo llevas a reparar.', fr: 'Ton portable se casse : tu le fais réparer.', m: [-15, -80] },
  { es: 'Ganas un concurso de dibujo.', fr: 'Tu gagnes un concours de dessin.', m: [15, 60] },
  { es: 'Hace calor: compras helados para toda la familia.', fr: 'Il fait chaud : tu achètes des glaces pour toute la famille.', m: [-4, -12] },
  { es: 'Vas al cine con tus amigos.', fr: 'Tu vas au cinéma avec tes amis.', m: [-6, -18] },
  { es: 'Vendes tus libros viejos en el mercadillo.', fr: 'Tu vends tes vieux livres au marché aux puces.', m: [8, 30] },
  { es: 'Nieva: compras unos guantes y un gorro.', fr: 'Il neige : tu achètes des gants et un bonnet.', m: [-10, -35] },
  { es: 'Ayudas a tu vecina con la compra: te da una propina.', fr: 'Tu aides ta voisine à porter ses courses : elle te donne un pourboire.', m: [5, 15] },
  { es: 'Pierdes tu cartera en el metro.', fr: 'Tu perds ton portefeuille dans le métro.', m: [-10, -40] },
  { es: 'Tu equipo gana el partido: invitas a tus amigos a una pizza.', fr: 'Ton équipe gagne le match : tu invites tes amis à manger une pizza.', m: [-12, -45] },
  { es: 'Cuidas a tu primo pequeño el sábado.', fr: 'Tu gardes ton petit cousin samedi.', m: [12, 50] },
  { es: 'Hay tormenta: se va la luz y tiras la comida del frigorífico.', fr: 'Il y a de l’orage : le courant saute et tu jettes la nourriture du frigo.', m: [-8, -30] },
  { es: 'Compras un regalo para el amigo invisible.', fr: 'Tu achètes un cadeau pour le Père Noël secret.', m: [-5, -20] },
  { es: 'La tienda te devuelve dinero: ¡había un error en el ticket!', fr: 'Le magasin te rembourse : il y avait une erreur sur le ticket !', m: [6, 25] },
  { es: 'Vas a la peluquería.', fr: 'Tu vas chez le coiffeur.', m: [-8, -20] },
  { es: 'Lavas el coche de tu padre: te da dinero.', fr: 'Tu laves la voiture de ton père : il te donne de l’argent.', m: [5, 20] }
];

const FACTURAS: Factura[] = [
  { es: 'la factura del móvil', fr: 'la facture du portable', m: [10, 30] },
  { es: 'la factura del agua', fr: 'la facture d’eau', m: [8, 35] },
  { es: 'la factura de la luz', fr: 'la facture d’électricité', m: [12, 60] },
  { es: 'la factura de internet', fr: 'la facture internet', m: [10, 35] },
  { es: 'la compra del supermercado', fr: 'les courses au supermarché', m: [25, 90] },
  { es: 'el gimnasio', fr: 'la salle de sport', m: [10, 30] },
  { es: 'el abono de transporte', fr: 'l’abonnement de transport', m: [15, 40] },
  { es: 'la cuota del club de fútbol', fr: 'la cotisation du club de foot', m: [10, 25] }
];

const TIEMPOS: { ico: string; es: string; premio: string }[] = [
  { ico: '☀️', es: 'Hace sol.', premio: 'Vendes limonada en el parque.' },
  { ico: '🌧', es: 'Llueve.', premio: 'Vendes paraguas en la calle.' },
  { ico: '❄️', es: 'Nieva.', premio: 'Quitas la nieve delante de las casas.' },
  { ico: '🌬', es: 'Hace viento.', premio: 'Vendes cometas en la playa.' },
  { ico: '🥵', es: 'Hace calor.', premio: 'Vendes agua fresca.' },
  { ico: '🥶', es: 'Hace frío.', premio: 'Vendes chocolate caliente.' },
  { ico: '⛈', es: 'Hay tormenta.', premio: 'Ayudas a recoger las sillas de la terraza.' },
  { ico: '☁️', es: 'Está nublado.', premio: 'Paseas a los perros de tus vecinos.' }
];

const OFICIOS: { es: string; fr: string; ico: string; sueldo: M }[] = [
  { es: 'en una panadería', fr: 'dans une boulangerie', ico: '🥖', sueldo: [80, 950] },
  { es: 'en un hospital', fr: 'dans un hôpital', ico: '🩺', sueldo: [100, 1300] },
  { es: 'en un colegio', fr: 'dans un collège', ico: '🧑‍🏫', sueldo: [90, 1200] },
  { es: 'en un restaurante', fr: 'dans un restaurant', ico: '👩‍🍳', sueldo: [85, 1000] },
  { es: 'en un parque de bomberos', fr: 'dans une caserne de pompiers', ico: '🚒', sueldo: [95, 1100] },
  { es: 'en una tienda de ropa', fr: 'dans un magasin de vêtements', ico: '👕', sueldo: [80, 900] },
  { es: 'en un periódico', fr: 'dans un journal', ico: '📰', sueldo: [90, 1050] },
  { es: 'en una clínica veterinaria', fr: 'dans une clinique vétérinaire', ico: '🐶', sueldo: [95, 1150] }
];

const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
/** Le 1er est un lundi ; chaque semaine : imprévu, facture, météo, imprévu, facture, imprévu, dimanche. */
const SEMAINE: Tipo[] = ['imprevisto', 'factura', 'tiempo', 'imprevisto', 'factura', 'imprevisto', 'domingo'];
const tipoDe = (d: number): Tipo => d === 1 ? 'inicio' : d === 31 ? 'paga' : SEMAINE[(d - 1) % 7];
const INFO: Record<Tipo, { ico: string; es: string }> = {
  inicio: { ico: '🏁', es: 'Inicio' }, imprevisto: { ico: '❓', es: 'Imprevisto' }, factura: { ico: '🧾', es: 'Factura' },
  tiempo: { ico: '🌦', es: 'El tiempo' }, domingo: { ico: '😴', es: 'Domingo' }, paga: { ico: '💰', es: 'Día de paga' }
};

const CAPITAL: Record<Niveau, number[]> = { '5e': [50, 100], '4e': [300, 500, 800], '3e': [300, 500, 800] };
const CHRONO = 25;
const BONO: M = [2, 5];

type Reto = { q: string; o: string[]; a: number; fr?: string };

const paga: Game = (el, ctx) => {
  const k = ctx.niveau === '5e' ? 0 : 1;
  const nb = ctx.teams.length;
  let capital = CAPITAL[ctx.niveau][1];
  let pos: number[] = [], dinero: number[] = [], fini: boolean[] = [], oficio: number[] = [];
  let pileImp: Imprevisto[] = [], phase: 'reglas' | 'juego' | 'fin' = 'reglas';
  let timer: Timer | null = null;
  const montant = (m: M) => m[k];

  const nouveau = () => {
    pos = ctx.teams.map(() => 1); dinero = ctx.teams.map(() => capital); fini = ctx.teams.map(() => false);
    oficio = shuffle(OFICIOS.map((_, i) => i)).slice(0, nb);
    pileImp = shuffle(IMPREVISTOS);
    phase = 'juego';
  };
  const tirerImp = () => { if (!pileImp.length) pileImp = shuffle(IMPREVISTOS); return pileImp.pop()!; };
  const payer = (i: number, delta: number) => { dinero[i] += delta; beep(delta >= 0 ? 880 : 300, 0.12); };

  /** Mini-défi « Factura » : calcul ou traduction, selon le niveau. */
  const reto = (f: Factura): Reto => {
    const m = montant(f.m);
    const opts = (bon: number, ecart: number) => {
      const s = new Set([bon]);
      while (s.size < 4) { const v = bon + (Math.floor(Math.random() * 7) - 3) * ecart; if (v > 0) s.add(v); }
      const o = shuffle([...s]);
      return { o: o.map(v => prix(v)), a: o.indexOf(bon) };
    };
    const types = ctx.niveau === '3e' ? ['suma', 'cambio', 'descuento', 'traduccion'] : ['suma', 'cambio', 'traduccion'];
    const t = pick(types);
    if (t === 'suma') {
      const g = pick(FACTURAS.filter(x => x !== f)), m2 = montant(g.m);
      return { q: `Pagas ${f.es} (${euros(m)}) y ${g.es} (${euros(m2)}). ¿Cuánto pagas en total?`, fr: `Tu paies ${f.fr} et ${g.fr}. Combien paies-tu en tout ?`, ...opts(m + m2, k ? 10 : 5) };
    }
    if (t === 'cambio') {
      const billete = [5, 10, 20, 50, 100, 200].find(b => b > m) ?? 500;
      return { q: `${f.es[0].toUpperCase()}${f.es.slice(1)} cuesta ${euros(m)}. Pagas con un billete de ${numero(billete)}. ¿Cuánto te devuelven?`, fr: 'Combien te rend-on ?', ...opts(billete - m, k ? 5 : 1) };
    }
    if (t === 'descuento') {
      const base = Math.max(10, Math.round(m / 10) * 10);
      return { q: `${f.es[0].toUpperCase()}${f.es.slice(1)} cuesta ${euros(base)}, pero hay un descuento del diez por ciento. ¿Cuánto pagas?`, fr: 'Réduction de 10 % : combien paies-tu ?', ...opts(base - base / 10, 5) };
    }
    const autres = shuffle(FACTURAS.filter(x => x !== f)).slice(0, 3).map(x => x.es);
    const o = shuffle([f.es, ...autres]);
    return { q: `¿Cómo se dice « ${f.fr} » en español?`, o, a: o.indexOf(f.es) };
  };

  const suivant = () => {
    timer?.stop();
    if (fini.every(Boolean)) { phase = 'fin'; chime(); render(); return; }
    do ctx.nextTurn(); while (fini[ctx.turn()]);
    render();
  };

  const plateau = () => {
    const t = ctx.turn();
    return `
      <div class="paga-cal" role="grid" aria-label="Calendrier du mois">
        ${DIAS.map(d => `<div class="paga-dia" lang="es">${d}</div>`).join('')}
        ${Array.from({ length: 31 }, (_, j) => {
          const d = j + 1, ti = tipoDe(d), ici = ctx.teams.map((e, i) => pos[i] === d ? pion(e) : '').join('');
          return `<div class="paga-case paga-${ti} ${pos[t] === d ? 'actuelle' : ''}"><b>${d}</b><span aria-hidden="true">${INFO[ti].ico}</span><small lang="es">${INFO[ti].es}</small><div class="pions">${ici}</div></div>`;
        }).join('')}
      </div>`;
  };

  const banque = () => `<div class="paga-equipes">${ctx.teams.map((e, i) => `
    <div class="paga-eq ${i === ctx.turn() ? 'turn' : ''} ${fini[i] ? 'fini' : ''}">
      <span>${e.icon} ${esc(e.nom)}</span><b>${prix(dinero[i])}</b>
      <small lang="es">${OFICIOS[oficio[i]].ico} Trabajo ${esc(OFICIOS[oficio[i]].es)}</small>${fini[i] ? '<small>✓ fin du mois</small>' : ''}
    </div>`).join('')}</div>`;

  const render = () => {
    timer?.stop();
    if (phase === 'reglas') {
      el.innerHTML = `
        <div class="center plateau-regles">
          <div class="count" aria-hidden="true">💶</div>
          <div class="huge" lang="es">La paga del mes</div>
          <p class="big">Chaque équipe vit un mois avec un budget. On avance sur le calendrier du 1er au 31.</p>
          <ul class="regles">
            <li>❓ <b lang="es">Imprevisto</b> : on lit la carte en espagnol, puis on dit ce qu’on paie ou ce qu’on gagne.</li>
            <li>🧾 <b lang="es">Factura</b> : un calcul ou une traduction en ${CHRONO} secondes. Erreur = un supplément à payer.</li>
            <li>🌦 <b lang="es">El tiempo</b> : trouver la bonne phrase météo pour gagner un peu d’argent.</li>
            <li>😴 <b lang="es">Domingo</b> : repos… si on le dit en espagnol !</li>
            <li>💰 <b lang="es">Día de paga</b> (le 31) : on réclame son salaire en espagnol. L’équipe la plus riche gagne.</li>
            <li>🗣 Chaque phrase bien dite rapporte un bonus de ${BONO[k]} €.</li>
          </ul>
          <div class="row wrap center-row" role="group" aria-label="Capital de départ">Capital de départ :
            ${CAPITAL[ctx.niveau].map(c => `<button class="btn ghost" data-cap="${c}" aria-pressed="${c === capital}">${prix(c)}</button>`).join('')}
          </div>
          <button class="btn bigbtn" id="go">¡Empezamos el mes!</button>
        </div>`;
      $$('[data-cap]', el).forEach(b => b.onclick = () => { capital = Number(b.dataset.cap); render(); });
      $('#go', el).onclick = () => { nouveau(); render(); };
      return;
    }
    if (phase === 'fin') {
      const tri = classement(ctx.teams.map((_, i) => ({ equipe: i, total: dinero[i] })), ctx.point);
      const g = tri[0];
      el.innerHTML = `
        <div class="center">
          <div class="count" aria-hidden="true">🏆</div>
          <div class="huge win" lang="es">¡Se acabó el mes!</div>
          <ol class="paga-podium">${tri.map(l => `<li>${ctx.teams[l.equipe].icon} ${esc(ctx.teams[l.equipe].nom)} : <b>${prix(l.total)}</b></li>`).join('')}</ol>
          <div id="final"></div>
          <p class="muted small">Points de la partie : 3, 2 et 1 aux trois premières équipes.</p>
          <button class="btn bigbtn" id="again">Otro mes</button>
        </div>`;
      const z = $('#final', el), ph = `Tenemos ${euros(dinero[g.equipe])}. ¡Somos los más ricos!`;
      z.innerHTML = aDire(ph, `${ctx.teams[g.equipe].icon} ${esc(ctx.teams[g.equipe].nom)} annonce sa victoire.`);
      brancherADire(z, ph, () => { ctx.point(g.equipe, 1); z.innerHTML = '<p class="big win" lang="es">¡Enhorabuena!</p>'; }, () => { z.innerHTML = ''; });
      $('#again', el).onclick = () => { phase = 'reglas'; render(); };
      return;
    }
    const t = ctx.turn(), e = ctx.teams[t];
    el.innerHTML = `
      <div class="plateau">
        ${banque()}
        <div class="plateau-corps">
          ${plateau()}
          <section class="panel plateau-action" id="action" aria-live="polite">
            <p class="pill">${e.icon} ${esc(e.nom)} · <span lang="es">${DIAS[(pos[t] - 1) % 7]} ${pos[t]}</span></p>
            <div class="de" id="de" aria-hidden="true">🎲</div>
            <button class="btn bigbtn" id="tirar" lang="es">Tira el dado</button>
            <button class="btn ghost sm" id="terminar">Terminer le mois maintenant</button>
          </section>
        </div>
      </div>`;
    $('#terminar', el).onclick = () => { phase = 'fin'; render(); };
    $('#tirar', el).onclick = () => {
      $<HTMLButtonElement>('#tirar', el).disabled = true;
      lancerDe($('#de', el), v => { pos[t] = Math.min(31, pos[t] + v); setTimeout(() => { render(); resoudre(t, v); }, 400); });
    };
  };

  /** Ce qui arrive sur la case : remplace le panneau d'action. */
  const resoudre = (t: number, v: number) => {
    const z = $('#action', el), d = pos[t], ti = tipoDe(d), e = ctx.teams[t];
    const tete = `<p class="pill">${e.icon} ${esc(e.nom)} · +${v} → <span lang="es">${DIAS[(d - 1) % 7]} ${d}</span></p><h3 lang="es">${INFO[ti].ico} ${INFO[ti].es}</h3>`;
    const fin = (msg = '') => {
      z.innerHTML = `${tete}${msg}<p class="big">${e.icon} ${esc(e.nom)} : <b>${prix(dinero[t])}</b></p><button class="btn bigbtn" id="sig" lang="es">Siguiente equipo</button>`;
      $('#sig', z).onclick = suivant;
      $('.paga-equipes', el).outerHTML = banque();
    };
    const parler = (avant: string, phrase: string, apres: (bien: boolean) => void) => {
      z.innerHTML = `${tete}${avant}<div id="dire"></div>`;
      const dz = $('#dire', z);
      dz.innerHTML = aDire(phrase);
      brancherADire(dz, phrase, () => { payer(t, BONO[k]); apres(true); }, () => apres(false));
    };
    const bonus = (b: boolean) => b ? `<p class="win">🗣 ¡Muy bien! Bonus +${BONO[k]} €</p>` : '<p class="muted">On réessaiera au prochain tour.</p>';

    if (ti === 'imprevisto') {
      const c = tirerImp(), m = montant(c.m);
      const phrase = m < 0 ? `Pago ${euros(-m)}.` : `Cobro ${euros(m)}.`;
      parler(`
        <div class="carte-jeu"><p class="big" lang="es">${esc(c.es)}</p>
          <p class="carte-montant ${m < 0 ? 'moins' : 'plus'}" lang="es">${m < 0 ? 'Paga' : 'Cobra'} ${prix(Math.abs(m))}</p>
          <details><summary>Traduction</summary><p>${esc(c.fr)}</p></details>
          <button class="btn ghost sm" id="lire">🔊 Écouter la carte</button></div>`, phrase, b => { payer(t, m); fin(bonus(b)); });
      $('#lire', z).onclick = () => dire(c.es);
      return;
    }
    if (ti === 'factura') {
      const f = pick(FACTURAS), m = montant(f.m), r = reto(f);
      z.innerHTML = `${tete}
        <p lang="es">Tienes que pagar <b>${esc(f.es)}</b> : <b>${prix(m)}</b>. Pero antes… ¡un reto!</p>
        <p class="big" lang="es">${esc(r.q)}</p>${r.fr ? `<details><summary>Aide</summary><p>${esc(r.fr)}</p></details>` : ''}
        <p class="pill chrono" id="chrono" role="timer">${CHRONO} s</p>
        <div class="opts">${r.o.map((o, i) => `<button class="opt opt-btn" data-o="${i}">${esc(o)}</button>`).join('')}</div>`;
      const conclure = (ok: boolean) => {
        timer?.stop();
        const recargo = ok ? 0 : Math.round(m / 5) || 2;
        $$('[data-o]', z).forEach(b => { (b as HTMLButtonElement).disabled = true; if (Number(b.dataset.o) === r.a) b.classList.add('correct'); });
        setTimeout(() => {
          const total = m + recargo;
          parler(ok ? '<p class="win big">¡Correcto!</p>' : `<p class="big">Raté : supplément de ${prix(recargo)} (<span lang="es">recargo</span>).</p>`,
            `Pago ${euros(total)} por ${f.es}.`, b => { payer(t, -total); fin(bonus(b)); });
        }, 900);
      };
      timer = startTimer(CHRONO, () => { beep(200, 0.3); conclure(false); }, l => { const c = $('#chrono', z); if (c) c.textContent = `${l} s`; });
      $$('[data-o]', z).forEach(b => b.onclick = () => conclure(Number(b.dataset.o) === r.a));
      return;
    }
    if (ti === 'tiempo') {
      const w = pick(TIEMPOS), o = shuffle([w, ...shuffle(TIEMPOS.filter(x => x !== w)).slice(0, 3)]), m = Math.round(montant([10, 30]));
      z.innerHTML = `${tete}<div class="meteo-ico" aria-hidden="true">${w.ico}</div><p class="big" lang="es">¿Qué tiempo hace hoy?</p>
        <div class="opts">${o.map((x, i) => `<button class="opt opt-btn" data-o="${i}" lang="es">${esc(x.es)}</button>`).join('')}</div>`;
      $$('[data-o]', z).forEach(b => b.onclick = () => {
        const ok = o[Number(b.dataset.o)] === w;
        if (ok) { dire(w.es); payer(t, m); fin(`<p class="win big" lang="es">¡Sí! ${esc(w.es)}</p><p lang="es">${esc(w.premio)} Cobras ${prix(m)}.</p>`); }
        else { beep(200, 0.25); fin(`<p class="big">Non : <b lang="es">${esc(w.es)}</b> Pas de gain cette fois.</p>`); }
      });
      return;
    }
    if (ti === 'domingo') {
      parler('<p class="big" lang="es">Es domingo: ¡descanso!</p>', 'Hoy es domingo y descanso.', b => fin(bonus(b)));
      return;
    }
    if (ti === 'paga') {
      fini[t] = true;
      const of = OFICIOS[oficio[t]], s = montant(of.sueldo);
      parler(`<p class="big">Fin du mois ! ${e.icon} ${esc(e.nom)} travaille <b lang="es">${esc(of.es)}</b> (${esc(of.fr)}) et touche ${prix(s)}.</p>`,
        `Trabajo ${of.es} y cobro ${euros(s)}.`, b => { payer(t, s); fin(bonus(b)); });
      return;
    }
    fin();
  };

  render();
  return () => timer?.stop();
};

export default paga;
