import './styles/base.css';
import { FILES, MOUNTAINS, type FileId, type Lang } from './content/mountains';
import { SOURCES } from './content/sources';
import { num, t } from './i18n';
import { oxygenShare } from './oxygen';
import { mountTerrain } from './terrain/scene';
import { boot, BASE, esc, fileUrl, getLang, onLang, rise } from './ui/shell';
import { dossier, mountClearance } from './ui/dossier';

const id = document.body.dataset.file as FileId;
const m = MOUNTAINS[id];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = matchMedia('(max-width: 760px)').matches;
const main = document.getElementById('main')!;

main.innerHTML = `
<div class="stage fixed"><canvas id="map" aria-hidden="true"></canvas><div class="overlay" id="overlay"></div></div>
<div class="column">
  <section class="file intro" id="intro"></section>
  <section class="climb" aria-labelledby="climb-title">
    <h2 class="sec-title" id="climb-title" data-t="file.climb"></h2>
    <p class="mono small hint" data-t="file.scroll"></p>
    <ol class="camps" id="camps"></ol>
    <p class="mono small" data-t="file.approx"></p>
  </section>
  <section class="details" id="details"></section>
  <section class="clearance" aria-labelledby="clear-title">
    <h2 class="sec-title" id="clear-title" data-t="clear.title"></h2>
    <p class="sec-lead" data-t="clear.lead"></p>
    <div id="quiz"></div>
  </section>
</div>`;

await boot(id);

const view = mountTerrain(document.getElementById('map') as HTMLCanvasElement, document.getElementById('overlay')!, { reduced, small, shift: 0.19 });
const pins = (l: Lang) => m.camps.map((c, i) => i === m.camps.length - 1 ? `<b>${esc(c.name[l])}</b>${num(l, m.height)} m` : `${esc(c.name[l])}<i>${num(l, c.height)} m</i>`);

const list = (title: string, items: string[]) => `<div class="block" data-rise><h3 class="mono">${esc(title).toUpperCase()}</h3><ul>${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>`;

function render(l: Lang) {
  document.getElementById('intro')!.innerHTML = dossier(m, l);
  document.getElementById('camps')!.innerHTML = m.camps.map((c, i) => `<li class="camp" data-stop="${i + 1}">
      <p class="mono day">${esc(t(l, 'file.day', { n: c.day }))}</p>
      <h3>${esc(c.name[l])}</h3>
      <p class="alt mono">${num(l, c.height)} m · ${esc(t(l, 'file.oxygen', { p: Math.round(oxygenShare(c.height) * 100) }))}</p>
      <p>${esc(c.note[l])}</p>
    </li>`).join('');
  const next = FILES[FILES.indexOf(id) + 1];
  document.getElementById('details')!.innerHTML = `
    <p class="first">${esc(t(l, 'file.first'))}: ${esc(m.firstAscent.text[l])}</p>
    ${list(t(l, 'file.who'), m.requirements.map(r => r[l]))}
    ${list(t(l, 'file.included'), m.included.map(r => r[l]))}
    ${list(t(l, 'file.excluded'), m.excluded.map(r => r[l]))}
    ${list(t(l, 'file.gear'), m.gear.map(r => r[l]))}
    ${list(t(l, 'file.risks'), m.risks.map(r => r[l]))}
    <p class="mono small">* ${esc(t(l, 'file.priceNote'))}</p>
    <div class="block"><h3 class="mono">${esc(t(l, 'file.sources')).toUpperCase()}</h3><ul class="src">${m.sources.map(s => `<li><a href="${esc(SOURCES[s].url)}" rel="noopener">${esc(SOURCES[s].title)}</a></li>`).join('')}</ul></div>
    <nav class="next mono"><a href="${BASE}">← ${esc(t(l, 'file.all'))}</a>${next ? `<a href="${fileUrl(next)}">${esc(t(l, 'file.next', { name: MOUNTAINS[next].name[l] }))} →</a>` : ''}</nav>`;
  view.setLabels(pins(l));
  watchCamps();
  rise();
}

// the camp in the middle of the screen sets the camera; the intro shows the whole route
let io: IntersectionObserver | null = null;
function watchCamps() {
  io?.disconnect();
  io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const s = Number((e.target as HTMLElement).dataset.stop ?? 0);
    view.setStop(s);
    document.querySelectorAll('.camp').forEach(c => c.classList.toggle('on', c === e.target));
  }), { rootMargin: '-45% 0px -45% 0px' });
  document.querySelectorAll('#intro, .camp, #details').forEach(el => io!.observe(el));
}

const quiz = mountClearance(document.getElementById('quiz')!, getLang, id);
onLang(l => { render(l); quiz(l); });
await view.show(m, pins(getLang()));
render(getLang());
view.setStop(0);
