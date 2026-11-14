import { FILES, MOUNTAINS, type FileId, type Lang } from '../content/mountains';
import { SOURCES } from '../content/sources';
import { LANGS, pickLang, t, type Key } from '../i18n';

export const PHONE = '+39 0471 000 849';
export const TEL = 'tel:+390471000849';
export const BASE = import.meta.env.BASE_URL;
export const fileUrl = (id: FileId) => `${BASE}${id}/`;
export const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

let lang: Lang = 'en';
const listeners: ((l: Lang) => void)[] = [];
export const getLang = () => lang;
export const onLang = (cb: (l: Lang) => void) => { listeners.push(cb); };

function readSaved(): string | null { try { return localStorage.getItem('om-lang'); } catch { return null; } }

/** Applies a language to every [data-t] element and tells the page. */
export function setLang(l: Lang, save = true): void {
  lang = l;
  if (save) try { localStorage.setItem('om-lang', l); } catch { /* storage off */ }
  document.documentElement.lang = l;
  document.title = document.body.dataset.file ? `${MOUNTAINS[document.body.dataset.file as FileId].name[l]} — Ottomila` : t(l, 'meta.title');
  document.querySelectorAll<HTMLElement>('[data-t]').forEach(el => { el.textContent = t(l, el.dataset.t as Key); });
  document.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
  listeners.forEach(cb => cb(l));
}

export function header(active?: FileId): string {
  const tabs = FILES.map(id => `<a href="${fileUrl(id)}" class="mono${id === active ? ' on' : ''}"${id === active ? ' aria-current="page"' : ''}>${MOUNTAINS[id].no} <span data-name="${id}"></span></a>`).join('');
  return `<header class="top">
    <a class="logo mono" href="${BASE}">OTTOMILA</a>
    <nav class="files" aria-label="Files">${tabs}</nav>
    <div class="tools">
      <div class="langs mono" role="group" aria-label="Language">${LANGS.map(l => `<button type="button" data-lang="${l}">${l.toUpperCase()}</button>`).join('')}</div>
      <a class="phone mono" href="${TEL}"><span class="full">${PHONE}</span><span class="short" data-t="nav.call"></span></a>
    </div>
  </header>`;
}

export function footer(): string {
  const src = Object.entries(SOURCES).map(([, s]) => `<li><a href="${esc(s.url)}" rel="noopener">${esc(s.title)}</a></li>`).join('');
  return `<footer class="foot">
    <div class="foot-call"><img class="night" src="${BASE}photos/night-1600.webp" alt="" width="1600" height="1074" loading="lazy"><p class="mono" data-t="call.title"></p><a class="big-phone" href="${TEL}">${PHONE}</a><p data-t="call.lead"></p></div>
    <div class="foot-cols">
      <div><h2 class="mono" data-t="foot.sources"></h2><ul class="src">${src}</ul><p class="mono small" data-t="foot.terrain"></p></div>
      <div><h2 class="mono" data-t="foot.credits"></h2><ul class="src" id="credits"></ul></div>
    </div>
    <p class="demo mono"><span data-t="demo.note"></span> · <span data-t="foot.by"></span> · <a href="https://yehorss.github.io/" data-t="foot.portfolio"></a></p>
  </footer>`;
}

interface Credit { name: string; alt: Record<Lang, string>; creator: string; license: string; licenseUrl?: string; page: string }
let credits: Credit[] = [];
export const creditFor = (name: string) => credits.find(c => c.name === name);

/** Header, footer, language and the names in the file tabs; resolves once the credits are in. */
export async function boot(active?: FileId): Promise<void> {
  document.body.insertAdjacentHTML('afterbegin', header(active));
  document.body.insertAdjacentHTML('beforeend', footer());
  document.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang as Lang)));
  onLang(l => {
    document.querySelectorAll<HTMLElement>('[data-name]').forEach(el => { el.textContent = MOUNTAINS[el.dataset.name as FileId].name[l]; });
    const list = document.getElementById('credits');
    if (list) list.innerHTML = credits.map(c => `<li>${esc(c.alt[l])}: <a href="${esc(c.page)}" rel="noopener">${esc(c.creator)}</a>, ${c.licenseUrl ? `<a href="${esc(c.licenseUrl)}" rel="noopener">${esc(c.license)}</a>` : esc(c.license)}</li>`).join('');
  });
  try { credits = await (await fetch(`${BASE}photos/credits.json`)).json(); } catch { credits = []; }
  setLang(pickLang(navigator.language, readSaved()), false);
}

/** Adds .in to [data-rise] elements as they come into view. */
export function rise(): void {
  const els = document.querySelectorAll<HTMLElement>('[data-rise]');
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  els.forEach(e => io.observe(e));
}
