import { esc } from './ui';

type Options = { danger?: boolean; typeToConfirm?: string; cancel?: string };

/** Modale de confirmation accessible : focus piégé, Échap pour annuler. */
export function confirmModal(titre: string, texte: string, ok: string, opts: Options = {}): Promise<boolean> {
  return new Promise(resolve => {
    const prev = document.activeElement as HTMLElement | null;
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-t" aria-describedby="m-d">
        <h2 id="m-t">${esc(titre)}</h2>
        <p id="m-d">${esc(texte)}</p>
        ${opts.typeToConfirm ? `<label class="field">Tape « ${esc(opts.typeToConfirm)} » pour confirmer
          <input id="m-in" autocomplete="off" autocapitalize="characters" /></label>` : ''}
        <div class="row wrap">
          <button class="btn ${opts.danger ? 'danger' : ''}" id="m-ok" ${opts.typeToConfirm ? 'disabled' : ''}>${esc(ok)}</button>
          <button class="btn ghost" id="m-no">${esc(opts.cancel ?? 'Annuler')}</button>
        </div>
      </div>`;
    document.body.append(back);
    const okBtn = back.querySelector<HTMLButtonElement>('#m-ok')!;
    const input = back.querySelector<HTMLInputElement>('#m-in');

    const close = (v: boolean) => {
      back.remove();
      removeEventListener('keydown', key, true);
      prev?.focus?.();
      resolve(v);
    };
    const focusables = () => [...back.querySelectorAll<HTMLElement>('button:not([disabled]),input')];
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(false); }
      if (e.key === 'Tab') {
        const f = focusables(), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      e.stopPropagation();
    };
    addEventListener('keydown', key, true);

    if (input) {
      input.oninput = () => { okBtn.disabled = input.value.trim().toUpperCase() !== opts.typeToConfirm; };
      input.onkeydown = e => { if (e.key === 'Enter' && !okBtn.disabled) close(true); };
    }
    okBtn.onclick = () => close(true);
    back.querySelector<HTMLButtonElement>('#m-no')!.onclick = () => close(false);
    back.onclick = e => { if (e.target === back) close(false); };
    (input ?? back.querySelector<HTMLButtonElement>('#m-no')!).focus();
  });
}
