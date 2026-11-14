import { MOUNTAINS, FILES, type FileId, type Lang, type Mountain } from '../content/mountains';
import { clear, type Answers } from '../clearance';
import { euro, num, t } from '../i18n';
import { esc, fileUrl, TEL } from './shell';

const dms = (v: number, pos: string, neg: string) => {
  const a = Math.abs(v), d = Math.floor(a), m = Math.floor((a - d) * 60), s = Math.round(((a - d) * 60 - m) * 60);
  return `${d}°${String(m).padStart(2, '0')}′${String(s).padStart(2, '0')}″${v >= 0 ? pos : neg}`;
};
export const coords = (m: Mountain) => `${dms(m.summit.lat, 'N', 'S')} ${dms(m.summit.lon, 'E', 'W')}`;

/** The file card: stamp line, name, height, tagline, facts. */
export function dossier(m: Mountain, l: Lang, opts: { open?: boolean } = {}): string {
  const level = ['I', 'II', 'III', 'IV'][m.level - 1];
  return `<div class="stamp-line mono"><span>FILE ${m.no} · ${esc(m.region[l]).toUpperCase()}</span><em>${m.level === 4 ? esc(t(l, 'file.invite')).toUpperCase() : esc(t(l, 'file.level', { level })).toUpperCase()}</em></div>
    <h1 class="name">${esc(m.name[l])}</h1>
    <p class="coords mono">${num(l, m.height)} m · ${coords(m)}</p>
    <h2 class="tagline">${esc(m.tagline[l])}</h2>
    <p class="lead">${esc(m.lead[l])}</p>
    <dl class="facts mono">
      <div><dt>${esc(t(l, 'file.route')).toUpperCase()}</dt><dd>${esc(m.route[l])}</dd></div>
      <div><dt>${esc(t(l, 'file.first')).toUpperCase()}</dt><dd>${m.firstAscent.year}</dd></div>
      <div><dt>${esc(t(l, 'file.season')).toUpperCase()}</dt><dd>${esc(m.season[l])}</dd></div>
      <div><dt>${esc(t(l, 'file.time')).toUpperCase()}</dt><dd>${esc(t(l, 'file.weeks', { n: m.weeks }))}</dd></div>
      <div><dt>${esc(t(l, 'file.team')).toUpperCase()}</dt><dd>${esc(t(l, 'file.group', { n: m.group }))}</dd></div>
      <div><dt>${esc(t(l, 'file.price')).toUpperCase()}</dt><dd>${esc(t(l, 'file.from', { price: euro(l, m.priceFrom) }))}*</dd></div>
    </dl>
    <div class="acts">${opts.open ? `<a class="btn" href="${fileUrl(m.id)}">${esc(t(l, 'home.open', { no: m.no }))} →</a>` : ''}<a class="btn ghost" href="${TEL}">${esc(t(l, 'nav.call'))}</a></div>`;
}

const Q: { key: keyof Answers; q: string; opts: [string, unknown][] }[] = [
  { key: 'alt', q: 'clear.q1', opts: [['clear.a0', 0], ['clear.a1', 1], ['clear.a2', 2], ['clear.a3', 3]] },
  { key: 'eight', q: 'clear.q2', opts: [['clear.no', false], ['clear.yes', true]] },
  { key: 'weeks', q: 'clear.q3', opts: [['clear.w0', 0], ['clear.w1', 1], ['clear.w2', 2]] },
  { key: 'training', q: 'clear.q4', opts: [['clear.t0', 0], ['clear.t1', 1], ['clear.t2', 2]] },
];

/** The clearance quiz; stamps every file, or only `focus` first when shown on a file page. */
export function mountClearance(root: HTMLElement, getLang: () => Lang, focus?: FileId): (l: Lang) => void {
  let answers: Partial<Answers> = {};
  let done = false;
  const render = (l: Lang) => {
    const form = Q.map(({ key, q, opts }, qi) => `<fieldset><legend>${esc(t(l, q as never))}</legend><div class="opts">${opts.map(([k, v], i) => {
      const id = `c-${key}-${i}`, checked = answers[key] === v ? ' checked' : '';
      return `<input type="radio" name="${key}" id="${id}" value="${i}"${checked}${qi === 0 && i === 0 ? ' required' : ''}><label for="${id}" class="mono">${esc(t(l, k as never))}</label>`;
    }).join('')}</div></fieldset>`).join('');
    let result = '';
    if (done && Q.every(q => q.key in answers)) {
      const r = clear(answers as Answers);
      const order = focus ? [focus, ...FILES.filter(f => f !== focus)] : FILES;
      const any = FILES.some(f => r[f].ok);
      result = `<div class="stamps" aria-live="polite">${order.map(f => {
        const s = r[f], m = MOUNTAINS[f], level = ['I', 'II', 'III', 'IV'][m.level - 1];
        const label = !s.ok ? t(l, 'stamp.denied') : s.invite ? t(l, 'stamp.invite') : t(l, 'stamp.cleared', { level });
        return `<div class="stamp-card ${s.ok ? 'ok' : 'no'}"><span class="mono no">${m.no}</span><b>${esc(m.name[l])}</b><span class="stamp mono">${esc(label)}</span>${s.reason ? `<span class="why mono">${esc(t(l, `reason.${s.reason}` as never))}</span>` : ''}</div>`;
      }).join('')}</div>
      <p class="after">${any ? `<a class="btn" href="${TEL}">${esc(t(l, 'clear.call', { name: MOUNTAINS[[...FILES].reverse().find(f => r[f].ok)!].name[l] }))}</a>` : esc(t(l, 'clear.none'))} <button type="button" class="link mono" data-again>${esc(t(l, 'clear.again'))}</button></p>`;
    }
    root.innerHTML = `<form class="quiz" novalidate>${form}<div class="quiz-act"><button type="submit" class="btn">${esc(t(l, 'clear.submit'))}</button><span class="mono small">${esc(t(l, 'clear.privacy'))}</span></div></form>${result}`;
    root.querySelector('form')!.addEventListener('change', e => {
      const el = e.target as HTMLInputElement, q = Q.find(x => x.key === el.name)!;
      answers = { ...answers, [q.key]: q.opts[Number(el.value)][1] };
    });
    root.querySelector('form')!.addEventListener('submit', e => {
      e.preventDefault();
      const missing = Q.find(q => !(q.key in answers));
      if (missing) { root.querySelector<HTMLInputElement>(`input[name="${missing.key}"]`)?.focus(); return; }
      done = true; render(getLang());
      root.querySelector<HTMLElement>('.stamps')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
    });
    root.querySelector('[data-again]')?.addEventListener('click', () => { answers = {}; done = false; render(getLang()); });
  };
  render(getLang());
  return render;
}
