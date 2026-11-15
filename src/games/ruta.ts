import type { Game } from './engine';
import { aDire, brancherADire, classement, dire, euros, lancerDe, pion, prix } from './plateau';
import { beep, chime } from '../lib/sound';
import { $, $$, esc, pick, shuffle } from '../lib/ui';

/**
 * Ruta por España : un Monopoly des villes d'Espagne et d'Amérique latine.
 * Acheter = réussir une mini-colle (plat, monument, pays, conjugaison) puis le dire en espagnol.
 * Payer un loyer = formuler la phrase de paiement sans hésiter (sinon c'est le double !).
 */
type Ciudad = { tipo: 'ciudad'; es: string; pais: string; bandera: string; precio: number; monumento: string; plato: string };
type Transporte = { tipo: 'transporte'; es: string; ico: string; precio: number; mot: string; fr: string };
type Especial = { tipo: 'salida' | 'suerte' | 'caja' | 'control' | 'fiesta' | 'alControl'; es: string; ico: string };
type Casilla = Ciudad | Transporte | Especial;

const C = (es: string, pais: string, bandera: string, precio: number, monumento: string, plato: string): Ciudad =>
  ({ tipo: 'ciudad', es, pais, bandera, precio, monumento, plato });

const TABLERO: Casilla[] = [
  { tipo: 'salida', es: 'Salida', ico: '🏁' },
  C('Toledo', 'España', '🇪🇸', 60, 'el Alcázar', 'el mazapán'),
  { tipo: 'suerte', es: 'Suerte', ico: '🍀' },
  C('Salamanca', 'España', '🇪🇸', 60, 'la Universidad', 'el hornazo'),
  C('Granada', 'España', '🇪🇸', 100, 'la Alhambra', 'las tapas'),
  { tipo: 'transporte', es: 'El tren AVE', ico: '🚄', precio: 150, mot: 'el tren', fr: 'le train' },
  { tipo: 'control', es: 'Control de pasaportes', ico: '🛂' },
  C('Sevilla', 'España', '🇪🇸', 120, 'la Giralda', 'el gazpacho'),
  { tipo: 'caja', es: 'Caja de Comunidad', ico: '🎁' },
  C('Valencia', 'España', '🇪🇸', 140, 'la Ciudad de las Artes y las Ciencias', 'la paella'),
  C('Bilbao', 'España', '🇪🇸', 140, 'el Museo Guggenheim', 'los pintxos'),
  { tipo: 'transporte', es: 'El barco', ico: '⛴', precio: 150, mot: 'el barco', fr: 'le bateau' },
  { tipo: 'fiesta', es: '¡Fiesta!', ico: '💃' },
  C('Barcelona', 'España', '🇪🇸', 180, 'la Sagrada Familia', 'el pan con tomate'),
  { tipo: 'suerte', es: 'Suerte', ico: '🍀' },
  C('Madrid', 'España', '🇪🇸', 200, 'el Museo del Prado', 'el bocadillo de calamares'),
  { tipo: 'transporte', es: 'El avión', ico: '✈️', precio: 150, mot: 'el avión', fr: 'l’avion' },
  C('Ciudad de México', 'México', '🇲🇽', 220, 'el Zócalo', 'los tacos'),
  { tipo: 'alControl', es: '¡Al control de pasaportes!', ico: '👮' },
  C('Lima', 'Perú', '🇵🇪', 240, 'la Plaza de Armas', 'el ceviche'),
  { tipo: 'caja', es: 'Caja de Comunidad', ico: '🎁' },
  C('Bogotá', 'Colombia', '🇨🇴', 260, 'el Museo del Oro', 'el ajiaco'),
  C('La Habana', 'Cuba', '🇨🇺', 280, 'el Malecón', 'la ropa vieja'),
  C('Buenos Aires', 'Argentina', '🇦🇷', 300, 'el Obelisco', 'el asado')
];
const N = TABLERO.length;
const CIUDADES = TABLERO.filter((c): c is Ciudad => c.tipo === 'ciudad');
const CONTROL = TABLERO.findIndex(c => c.tipo === 'control');

const CAPITAL = 1500, SALIDA = 200, BONO = 20;
const loyer = (c: Ciudad, niveau: number) => Math.round(c.precio / 10) * [1, 3, 6][niveau];
const prixCasa = (c: Ciudad) => Math.round(c.precio / 2 / 10) * 10;

/** Conjugaisons : présent (5e) ou passé simple (4e/3e) des verbes de l'achat et du voyage. */
const PERSONAS = ['yo', 'tú', 'él / ella', 'nosotros', 'vosotros', 'ellos / ellas'];
const VERBOS: Record<string, { presente: string[]; pasado: string[] }> = {
  comprar: { presente: ['compro', 'compras', 'compra', 'compramos', 'compráis', 'compran'], pasado: ['compré', 'compraste', 'compró', 'compramos', 'comprasteis', 'compraron'] },
  pagar: { presente: ['pago', 'pagas', 'paga', 'pagamos', 'pagáis', 'pagan'], pasado: ['pagué', 'pagaste', 'pagó', 'pagamos', 'pagasteis', 'pagaron'] },
  alquilar: { presente: ['alquilo', 'alquilas', 'alquila', 'alquilamos', 'alquiláis', 'alquilan'], pasado: ['alquilé', 'alquilaste', 'alquiló', 'alquilamos', 'alquilasteis', 'alquilaron'] },
  viajar: { presente: ['viajo', 'viajas', 'viaja', 'viajamos', 'viajáis', 'viajan'], pasado: ['viajé', 'viajaste', 'viajó', 'viajamos', 'viajasteis', 'viajaron'] },
  visitar: { presente: ['visito', 'visitas', 'visita', 'visitamos', 'visitáis', 'visitan'], pasado: ['visité', 'visitaste', 'visitó', 'visitamos', 'visitasteis', 'visitaron'] },
  costar: { presente: ['cuesto', 'cuestas', 'cuesta', 'costamos', 'costáis', 'cuestan'], pasado: ['costé', 'costaste', 'costó', 'costamos', 'costasteis', 'costaron'] }
};

type Pregunta = { q: string; o: string[]; a: number; fr?: string };
const qcm = (q: string, bon: string, autres: string[], fr?: string): Pregunta => {
  const o = shuffle([bon, ...shuffle([...new Set(autres.filter(x => x !== bon))]).slice(0, 3)]);
  return { q, o, a: o.indexOf(bon), fr };
};

/** Cartes « Suerte » : quiz culturels, réponse vérifiée par l'appli. */
const SUERTE: (() => Pregunta)[] = [
  () => qcm('¿Cuál es la capital de España?', 'Madrid', ['Barcelona', 'Sevilla', 'Valencia']),
  () => qcm('¿Cuál es la capital de México?', 'Ciudad de México', ['Cancún', 'Guadalajara', 'Monterrey']),
  () => qcm('¿Cuál es la capital de Argentina?', 'Buenos Aires', ['Córdoba', 'Rosario', 'Mendoza']),
  () => qcm('¿Cuántos países tienen el español como lengua oficial?', 'veintiuno', ['diez', 'quince', 'treinta']),
  () => qcm('¿Qué moneda se usa en España?', 'el euro', ['el peso', 'el dólar', 'la libra']),
  () => qcm('¿Qué moneda se usa en México?', 'el peso', ['el euro', 'el dólar', 'el sol']),
  () => qcm('¿Cómo se dice « un billet de train » en español?', 'un billete de tren', ['una entrada de tren', 'un boleto de avión', 'una carta de tren']),
  () => qcm('¿Cómo se dice « louer » en español?', 'alquilar', ['comprar', 'pagar', 'costar']),
  () => qcm('¿Cómo se dice « ça coûte combien ? » en español?', '¿Cuánto cuesta?', ['¿Cuántos años tienes?', '¿Qué hora es?', '¿Dónde está?']),
  () => qcm('¿Qué pintor nació en Málaga?', 'Pablo Picasso', ['Frida Kahlo', 'Diego Rivera', 'Fernando Botero']),
  () => qcm('¿Dónde está Machu Picchu?', 'en Perú', ['en México', 'en Chile', 'en Cuba']),
  () => qcm('¿Qué baile es típico de Andalucía?', 'el flamenco', ['el tango', 'la salsa', 'el vals']),
  () => qcm('¿Qué baile nació en Buenos Aires?', 'el tango', ['el flamenco', 'la jota', 'la sardana']),
  () => qcm('¿Qué fiesta mexicana se celebra a principios de noviembre?', 'el Día de Muertos', ['la Tomatina', 'San Fermín', 'las Fallas']),
  () => qcm('¿En qué ciudad se celebran las Fallas?', 'Valencia', ['Pamplona', 'Sevilla', 'Bilbao']),
  () => qcm('¿Cuál es el río más largo de España?', 'el Tajo', ['el Ebro', 'el Sena', 'el Amazonas'])
];

/** Cartes « Caja de Comunidad » : défis oraux, validés par l'enseignante. */
const CAJA: { es: string; fr: string }[] = [
  { es: 'Di tres platos típicos españoles.', fr: 'Cite trois plats typiques espagnols.' },
  { es: 'Cuenta de diez en diez hasta cien.', fr: 'Compte de dix en dix jusqu’à cent.' },
  { es: 'Pide un billete de tren para Sevilla.', fr: 'Demande un billet de train pour Séville.' },
  { es: 'Di qué ciudad del tablero te gustaría visitar y por qué: « Me gustaría visitar… porque… »', fr: 'Dis quelle ville du plateau tu aimerais visiter et pourquoi.' },
  { es: 'Nombra cuatro países donde se habla español.', fr: 'Cite quatre pays où l’on parle espagnol.' },
  { es: 'Describe el tiempo que hace hoy en tres frases.', fr: 'Décris le temps qu’il fait aujourd’hui en trois phrases.' },
  { es: 'Pregunta el precio de una habitación de hotel.', fr: 'Demande le prix d’une chambre d’hôtel.' },
  { es: 'Di cinco medios de transporte.', fr: 'Cite cinq moyens de transport.' },
  { es: 'Explica el camino del colegio a tu casa: « Sigo todo recto, giro a la derecha… »', fr: 'Explique le chemin du collège à chez toi.' },
  { es: 'Di tres monumentos de España o de América Latina.', fr: 'Cite trois monuments d’Espagne ou d’Amérique latine.' }
];

const ruta: Game = (el, ctx) => {
  const pasado = ctx.niveau !== '5e';
  let pos: number[] = [], dinero: number[] = [], bloque: boolean[] = [], tours = 0;
  /** Propriétaire et niveau (0 = terrain, 1 = casa, 2 = hotel) de chaque case. */
  let dueno: (number | null)[] = [], nivel: number[] = [];
  let phase: 'reglas' | 'juego' | 'fin' = 'reglas';

  const nouveau = () => {
    pos = ctx.teams.map(() => 0); dinero = ctx.teams.map(() => CAPITAL); bloque = ctx.teams.map(() => false);
    dueno = TABLERO.map(() => null); nivel = TABLERO.map(() => 0); tours = 0; phase = 'juego';
  };
  const payer = (i: number, delta: number) => { dinero[i] += delta; beep(delta >= 0 ? 880 : 300, 0.12); };
  const patrimoine = (i: number) => dinero[i] + TABLERO.reduce((s, c, k) => s + (dueno[k] === i && c.tipo !== 'salida' && 'precio' in c ? c.precio + (c.tipo === 'ciudad' ? nivel[k] * prixCasa(c) : 0) : 0), 0);

  /** Mini-colle pour acheter une ville ou construire. */
  const colle = (c: Ciudad, difficile = false): Pregunta => {
    const sorte = difficile ? 'verbo' : pick(['plato', 'monumento', c.pais === 'España' ? 'verbo' : 'pais', 'verbo']);
    if (sorte === 'plato') return qcm(`¿Cuál es un plato típico de ${c.es}?`, c.plato, CIUDADES.map(x => x.plato));
    if (sorte === 'monumento') return qcm(`¿Qué monumento puedes visitar en ${c.es}?`, c.monumento, CIUDADES.map(x => x.monumento));
    if (sorte === 'pais') return qcm(`¿En qué país está ${c.es}?`, c.pais, ['España', 'México', 'Perú', 'Colombia', 'Cuba', 'Argentina', 'Chile']);
    const v = pick(Object.keys(VERBOS).filter(x => x !== 'costar')), p = Math.floor(Math.random() * 6);
    const formes = VERBOS[v][pasado ? 'pasado' : 'presente'];
    const tiempo = pasado ? 'pretérito indefinido' : 'presente';
    return qcm(`Conjuga « ${v} » (${tiempo}) : ${PERSONAS[p]} …`, formes[p], [...formes, ...VERBOS[v][pasado ? 'presente' : 'pasado']],
      `Conjugue le verbe au ${pasado ? 'passé simple' : 'présent'}.`);
  };

  const suivant = () => {
    ctx.nextTurn();
    if (ctx.turn() === 0) tours++;
    render();
  };

  const plateau = () => {
    // Plateau 7 × 7 : 24 cases sur le pourtour, dans le sens des aiguilles d'une montre.
    const place = (k: number): [number, number] => k <= 6 ? [7, 7 - k] : k <= 12 ? [7 - (k - 6), 1] : k <= 18 ? [1, 1 + (k - 12)] : [1 + (k - 18), 7];
    return `<div class="ruta-plateau">${TABLERO.map((c, k) => {
      const [l, col] = place(k), d = dueno[k], ici = ctx.teams.map((e, i) => pos[i] === k ? pion(e) : '').join('');
      const ico = c.tipo === 'ciudad' ? c.bandera : c.ico;
      const extra = c.tipo === 'ciudad' ? `<small>${prix(c.precio)}</small>${nivel[k] ? `<small>${nivel[k] === 2 ? '🏨' : '🏠'}</small>` : ''}` : c.tipo === 'transporte' ? `<small>${prix(c.precio)}</small>` : '';
      return `<div class="ruta-case ruta-${c.tipo} ${d !== null ? 'possede' : ''}" style="grid-area:${l}/${col};${d !== null ? `--eq:var(--eq${d})` : ''}">
        <span aria-hidden="true">${ico}</span><b lang="es">${esc(c.es)}</b>${extra}${d !== null ? `<i class="proprio">${ctx.teams[d].icon}</i>` : ''}<div class="pions">${ici}</div></div>`;
    }).join('')}
      <div class="ruta-centre"><p class="huge" lang="es">Ruta por España</p><div class="de" id="de" aria-hidden="true">🎲</div><div id="action" class="ruta-action" aria-live="polite"></div></div>
    </div>`;
  };

  const banque = () => `<div class="paga-equipes">${ctx.teams.map((e, i) => `
    <div class="paga-eq ${i === ctx.turn() ? 'turn' : ''}"><span>${e.icon} ${esc(e.nom)}</span><b>${prix(dinero[i])}</b>
      <small>${TABLERO.filter((_, k) => dueno[k] === i).length} propriété(s)${bloque[i] ? ' · 🛂 bloquée' : ''}</small></div>`).join('')}</div>`;

  const render = () => {
    if (phase === 'reglas') {
      el.innerHTML = `
        <div class="center plateau-regles">
          <div class="count" aria-hidden="true">🗺</div>
          <div class="huge" lang="es">Ruta por España</div>
          <p class="big">Un grand voyage en Espagne et en Amérique latine. Chaque équipe part avec ${prix(CAPITAL)}.</p>
          <ul class="regles">
            <li>🏙 <b>Acheter une ville</b> : réussir une mini-colle (plat typique, monument, pays ou conjugaison), puis dire <span lang="es">« Compro… por… euros »</span>.</li>
            <li>🏠 <b>Construire</b> sur sa ville : une question de conjugaison, puis <span lang="es">« Construyo una casa en… »</span>. Le loyer est multiplié.</li>
            <li>💶 <b>Loyer</b> : chez une autre équipe, on paie en disant <span lang="es">« Aquí tienes… euros por el alquiler de… »</span>. Si on hésite : loyer doublé !</li>
            <li>🍀 <b lang="es">Suerte</b> : quiz culturel. 🎁 <b lang="es">Caja de Comunidad</b> : défi oral. Réussi = de l’argent.</li>
            <li>🛂 <b lang="es">Control de pasaportes</b> : se présenter en espagnol pour repartir.</li>
            <li>🏁 Passer par la case <span lang="es">Salida</span> : +${prix(SALIDA)}. À la fin, l’équipe la plus riche (argent + propriétés) gagne.</li>
          </ul>
          <button class="btn bigbtn" id="go">¡Buen viaje!</button>
        </div>`;
      $('#go', el).onclick = () => { nouveau(); render(); };
      return;
    }
    if (phase === 'fin') {
      const tri = classement(ctx.teams.map((_, i) => ({ equipe: i, total: patrimoine(i) })), ctx.point);
      el.innerHTML = `
        <div class="center">
          <div class="count" aria-hidden="true">🏆</div>
          <div class="huge win" lang="es">¡Fin del viaje!</div>
          <ol class="paga-podium">${tri.map(l => `<li>${ctx.teams[l.equipe].icon} ${esc(ctx.teams[l.equipe].nom)} : <b>${prix(l.total)}</b> <small>(argent + propriétés)</small></li>`).join('')}</ol>
          <p class="muted small">Points de la partie : 3, 2 et 1 aux trois premières équipes.</p>
          <button class="btn bigbtn" id="again">Otro viaje</button>
        </div>`;
      $('#again', el).onclick = () => { phase = 'reglas'; render(); };
      return;
    }
    const t = ctx.turn(), e = ctx.teams[t];
    el.innerHTML = `<div class="plateau ruta">${banque()}${plateau()}
      <p class="row wrap center-row"><span class="muted small">Tour ${tours + 1}</span><button class="btn ghost sm" id="terminar">Terminer la partie</button></p></div>`;
    ctx.teams.forEach((_, i) => el.style.setProperty(`--eq${i}`, ['#E3A21A', '#2340B8', '#1F8A70', '#C8326B'][i]));
    $('#terminar', el).onclick = () => { phase = 'fin'; chime(); render(); };
    const z = $('#action', el);
    if (bloque[t]) {
      const ph = pasado ? 'Me llamo…, soy de… y he viajado a…' : 'Me llamo…, soy de… y viajo a…';
      z.innerHTML = `<p class="pill">${e.icon} ${esc(e.nom)}</p><p class="big" lang="es">🛂 Su pasaporte, por favor.</p>${aDire(ph, 'L’équipe se présente en complétant la phrase.')}`;
      brancherADire(z, ph, () => { bloque[t] = false; payer(t, BONO); fin(z, t, '<p class="win" lang="es">¡Bienvenidos! Podéis seguir el viaje.</p>'); },
        () => { bloque[t] = false; fin(z, t, '<p>Refusé : l’équipe passe son tour, elle repartira au prochain.</p>'); });
      return;
    }
    z.innerHTML = `<p class="pill">${e.icon} ${esc(e.nom)}</p><button class="btn bigbtn" id="tirar" lang="es">Tira el dado</button>`;
    $('#tirar', z).onclick = () => {
      $<HTMLButtonElement>('#tirar', z).disabled = true;
      lancerDe($('#de', el), v => {
        const avant = pos[t];
        pos[t] = (pos[t] + v) % N;
        const passe = pos[t] < avant && pos[t] !== 0;
        setTimeout(() => { render(); arriver(t, v, passe); }, 400);
      });
    };
  };

  const fin = (z: HTMLElement, t: number, msg: string) => {
    z.innerHTML = `${msg}<p>${ctx.teams[t].icon} ${esc(ctx.teams[t].nom)} : <b>${prix(dinero[t])}</b></p><button class="btn bigbtn" id="sig" lang="es">Siguiente equipo</button>`;
    $('#sig', z).onclick = suivant;
    $('.paga-equipes', el).outerHTML = banque();
  };

  /** Une question à choix multiple, puis `suite(juste)`. */
  const poser = (z: HTMLElement, avant: string, q: Pregunta, suite: (ok: boolean) => void) => {
    z.innerHTML = `${avant}<p class="big" lang="es">${esc(q.q)}</p>${q.fr ? `<p class="muted small">${esc(q.fr)}</p>` : ''}
      <div class="opts">${q.o.map((o, i) => `<button class="opt opt-btn" data-o="${i}" lang="es">${esc(o)}</button>`).join('')}</div>`;
    $$('[data-o]', z).forEach(b => b.onclick = () => {
      const ok = Number(b.dataset.o) === q.a;
      $$('[data-o]', z).forEach(x => { (x as HTMLButtonElement).disabled = true; if (Number(x.dataset.o) === q.a) x.classList.add('correct'); });
      beep(ok ? 880 : 200, 0.2);
      setTimeout(() => suite(ok), 800);
    });
  };

  const arriver = (t: number, v: number, passe: boolean) => {
    const z = $('#action', el), c = TABLERO[pos[t]], e = ctx.teams[t];
    const tete = `<p class="pill">${e.icon} ${esc(e.nom)} · +${v}</p><h3 lang="es">${c.tipo === 'ciudad' ? c.bandera : c.ico} ${esc(c.es)}${c.tipo === 'ciudad' ? ` <small>(${esc(c.pais)})</small>` : ''}</h3>`;
    const salida = (suite: () => void) => {
      if (!passe && pos[t] !== 0) return suite();
      payer(t, SALIDA);
      const ph = `¡Cobro ${euros(SALIDA)}!`;
      z.innerHTML = `<p class="big">🏁 Passage par la <span lang="es">Salida</span> : +${prix(SALIDA)}</p>${aDire(ph)}`;
      brancherADire(z, ph, () => { payer(t, BONO); suite(); }, suite);
    };

    salida(() => {
      if (c.tipo === 'salida') return fin(z, t, tete);
      if (c.tipo === 'ciudad' || c.tipo === 'transporte') {
        const k = pos[t], d = dueno[k];
        if (d === null) {
          if (dinero[t] < c.precio) return fin(z, t, `${tete}<p>Pas assez d’argent pour acheter (${prix(c.precio)}).</p>`);
          const q = c.tipo === 'ciudad' ? colle(c) : qcm(`¿Cómo se dice « ${c.fr} » en español?`, c.mot, ['el avión', 'el barco', 'el tren', 'el coche', 'el autobús', 'la bicicleta']);
          poser(z, `${tete}<p>À vendre : <b>${prix(c.precio)}</b>. Pour acheter, une mini-colle !</p>`, q, ok => {
            if (!ok) return fin(z, t, `${tete}<p>Raté : pas d’achat ce tour-ci.</p>`);
            const ph = `Compro ${c.es.replace(/^El /, 'el ')} por ${euros(c.precio)}.`;
            z.innerHTML = `${tete}<p class="win">¡Correcto!</p>${aDire(ph)}`;
            brancherADire(z, ph, () => { payer(t, -c.precio); dueno[k] = t; render(); fin($('#action', el), t, `<p class="win big" lang="es">¡${esc(c.es)} es vuestra!</p>`); },
              () => fin(z, t, `${tete}<p>Il faut le dire en espagnol pour acheter : ce sera pour une prochaine fois.</p>`));
          });
          return;
        }
        if (d === t) {
          if (c.tipo !== 'ciudad' || nivel[k] >= 2) return fin(z, t, `${tete}<p lang="es">¡Estáis en casa!</p>`);
          const cout = prixCasa(c), quoi = nivel[k] === 0 ? 'una casa' : 'un hotel';
          if (dinero[t] < cout) return fin(z, t, `${tete}<p lang="es">¡Estáis en casa!</p>`);
          z.innerHTML = `${tete}<p>Construire <b lang="es">${quoi}</b> pour ${prix(cout)} ? Le loyer passera à ${prix(loyer(c, nivel[k] + 1))}.</p>
            <div class="row wrap center-row"><button class="btn" id="oui">Construire</button><button class="btn ghost" id="non">Non merci</button></div>`;
          $('#non', z).onclick = () => fin(z, t, '');
          $('#oui', z).onclick = () => poser(z, tete, colle(c, true), ok => {
            if (!ok) return fin(z, t, `${tete}<p>Raté : pas de construction.</p>`);
            const ph = `Construyo ${quoi} en ${c.es}.`;
            z.innerHTML = `${tete}${aDire(ph)}`;
            brancherADire(z, ph, () => { payer(t, -cout); nivel[k]++; render(); fin($('#action', el), t, `<p class="win big">${nivel[k] === 2 ? '🏨' : '🏠'} <span lang="es">¡Construido!</span></p>`); },
              () => fin(z, t, `${tete}<p>Pas de construction ce tour-ci.</p>`));
          });
          return;
        }
        const nbT = TABLERO.filter((x, j) => x.tipo === 'transporte' && dueno[j] === d).length;
        const montant = c.tipo === 'ciudad' ? loyer(c, nivel[k]) : 25 * nbT;
        const ph = c.tipo === 'ciudad' ? `Aquí tienes ${euros(montant)} por el alquiler de ${c.es}.` : `Aquí tienes ${euros(montant)} por el billete.`;
        z.innerHTML = `${tete}<p>Chez ${ctx.teams[d].icon} ${esc(ctx.teams[d].nom)} : loyer <b>${prix(montant)}</b>. Sans hésiter !</p><div id="dire"></div>`;
        const dz = $('#dire', z);
        dz.innerHTML = aDire(ph, 'Si l’équipe hésite ou se trompe : loyer doublé !');
        brancherADire(dz, ph,
          () => { payer(t, -montant); dinero[d] += montant; fin(z, t, `<p class="win" lang="es">¡Gracias!</p>`); },
          () => { payer(t, -montant * 2); dinero[d] += montant * 2; fin(z, t, `<p class="big">😬 <span lang="es">¡Doble!</span> ${prix(montant * 2)}</p>`); });
        return;
      }
      if (c.tipo === 'suerte') {
        const q = pick(SUERTE)(), gain = 50;
        poser(z, `${tete}<p>Bonne réponse = <b>+${prix(gain)}</b></p>`, q, ok => { if (ok) payer(t, gain); fin(z, t, ok ? `<p class="win big" lang="es">¡Correcto! Cobras ${prix(gain)}.</p>` : '<p>Raté !</p>'); });
        return;
      }
      if (c.tipo === 'caja') {
        const d = pick(CAJA), gain = 40;
        z.innerHTML = `${tete}<p class="big" lang="es">${esc(d.es)}</p><details><summary>Traduction</summary><p>${esc(d.fr)}</p></details>
          <div class="row wrap center-row"><button class="btn ghost sm" id="lire">🔊 Écouter</button><button class="btn ok" id="ok">✓ Réussi (+${prix(gain)})</button><button class="btn warn" id="ko">✗ Pas encore</button></div>`;
        $('#lire', z).onclick = () => dire(d.es);
        $('#ok', z).onclick = () => { payer(t, gain); fin(z, t, `<p class="win big" lang="es">¡Muy bien! Cobras ${prix(gain)}.</p>`); };
        $('#ko', z).onclick = () => fin(z, t, '<p>Ce sera pour la prochaine fois.</p>');
        return;
      }
      if (c.tipo === 'fiesta') {
        const ph = '¡Olé! ¡Viva la fiesta!';
        z.innerHTML = `${tete}<p class="big">Toute l’équipe se lève et danse 💃 !</p>${aDire(ph)}`;
        brancherADire(z, ph, () => { payer(t, 30); fin(z, t, `<p class="win">+${prix(30)}</p>`); }, () => fin(z, t, ''));
        return;
      }
      if (c.tipo === 'alControl') {
        pos[t] = CONTROL; bloque[t] = true; render();
        fin($('#action', el), t, '<p class="big">👮 <span lang="es">¡Al control de pasaportes!</span> Au prochain tour, il faudra se présenter en espagnol.</p>');
        return;
      }
      fin(z, t, `${tete}<p lang="es">Solo de visita.</p>`);
    });
  };

  render();
};

export default ruta;
