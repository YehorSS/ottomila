import './styles/base.css';
import { FILES, MOUNTAINS, type FileId, type Lang } from './content/mountains';
import { euro, num, t } from './i18n';
import { mountTerrain } from './terrain/scene';
import { boot, creditFor, esc, fileUrl, getLang, onLang, photoSet, rise } from './ui/shell';
import { dossier, mountClearance } from './ui/dossier';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = matchMedia('(max-width: 760px)').matches;
const main = document.getElementById('main')!;

main.innerHTML = `
<section class="index" id="files" aria-labelledby="home-title">
  <div class="stage"><canvas id="map" aria-hidden="true"></canvas><div class="overlay" id="overlay"></div></div>
  <div class="legend mono"><span data-t="map.c500"></span><br><span class="thin" data-t="map.c50"></span><br>Copernicus DEM 30 m · Sentinel-2</div>
  <aside class="panel">
    <p class="kicker mono" data-t="home.kicker"></p>
    <p class="home-title" id="home-title" data-t="home.title"></p>
    <div class="tabs mono" role="tablist">${FILES.map(id => `<button type="button" role="tab" data-file="${id}">${MOUNTAINS[id].no} <span data-name="${id}"></span></button>`).join('')}</div>
    <div class="file" id="card" role="tabpanel"></div>
  </aside>
</section>
<section class="ladder" id="ladder" aria-labelledby="ladder-title">
  <h2 class="sec-title" id="ladder-title" data-t="ladder.title"></h2>
  <p class="sec-lead" data-t="ladder.lead"></p>
  <ol class="rungs" id="rungs"></ol>
</section>
<section class="route" aria-labelledby="route-title">
  <h2 class="sec-title" id="route-title" data-t="route.title"></h2>
  <p class="sec-lead" data-t="route.lead"></p>
  <div class="strip" id="strip"></div>
</section>
<section class="clearance" id="clearance" aria-labelledby="clear-title">
  <h2 class="sec-title" id="clear-title" data-t="clear.title"></h2>
  <p class="sec-lead" data-t="clear.lead"></p>
  <div id="quiz"></div>
</section>
<section class="how" id="how" aria-labelledby="how-title">
  <h2 class="sec-title" id="how-title" data-t="how.title"></h2>
  <div class="how-grid">${[1, 2, 3, 4].map(i => `<div data-rise><p class="mono num">0${i}</p><h3 data-t="how.${i}t"></h3><p data-t="how.${i}d"></p></div>`).join('')}</div>
</section>
<section class="faq" id="faq" aria-labelledby="faq-title">
  <h2 class="sec-title" id="faq-title" data-t="faq.title"></h2>
  <div class="faq-list">${[1, 2, 3, 4, 5].map(i => `<details><summary data-t="faq.q${i}"></summary><p data-t="faq.a${i}"></p></details>`).join('')}</div>
</section>`;

await boot();

let current: FileId = (location.hash.slice(1) as FileId) in MOUNTAINS ? (location.hash.slice(1) as FileId) : 'everest';
const view = mountTerrain(document.getElementById('map') as HTMLCanvasElement, document.getElementById('overlay')!, { reduced, small, shift: 0.19, onPick: i => { location.href = `${fileUrl(current)}#camp-${i + 1}`; } });
view.setOrbit(true);
const stage = document.querySelector<HTMLElement>('.stage')!;

const pinLabels = (id: FileId, l: Lang) => {
  const m = MOUNTAINS[id];
  return m.camps.map((c, i) => i === m.camps.length - 1 ? `<b>${esc(m.name[l])}</b>${num(l, c.height)} m` : `${esc(c.name[l])}<i>${num(l, c.height)} m</i>`);
};

async function select(id: FileId, animate = true) {
  current = id;
  const l = getLang();
  document.querySelectorAll<HTMLButtonElement>('.tabs [data-file]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.file === id)));
  document.getElementById('card')!.innerHTML = dossier(MOUNTAINS[id], l, { open: true });
  // start fetching and building while the old map fades out
  view.preload([id]);
  if (animate && !reduced) stage.classList.add('fade');
  await new Promise(r => setTimeout(r, animate && !reduced ? 350 : 0));
  await view.show(MOUNTAINS[id], pinLabels(id, l));
  view.setStop(0);
  stage.classList.remove('fade');
}

document.querySelectorAll<HTMLButtonElement>('.tabs [data-file]').forEach(b => b.addEventListener('click', () => {
  history.replaceState(null, '', `#${b.dataset.file}`);
  void select(b.dataset.file as FileId);
}));

const STRIP: [string, FileId][] = [['everest-c1', 'everest'], ['everest-col', 'everest'], ['k2-bottleneck', 'k2'], ['k2-top', 'k2'], ['manaslu-c3', 'manaslu']];
function renderStrip(l: Lang) {
  document.getElementById('strip')!.innerHTML = STRIP.map(([name, id], i) => `<figure class="${i === 3 ? 'tall' : ''}" data-rise>
      <a href="${fileUrl(id)}"><img ${photoSet(name)} sizes="(max-width: 760px) 90vw, 40vw" alt="${esc(creditFor(name)?.alt[l] ?? '')}" width="1600" height="1066" loading="lazy"></a>
      <figcaption><span class="mono">${MOUNTAINS[id].no} · ${esc(MOUNTAINS[id].name[l]).toUpperCase()}</span>${esc(creditFor(name)?.alt[l] ?? '')}</figcaption>
    </figure>`).join('');
}

function renderLadder(l: Lang) {
  document.getElementById('rungs')!.innerHTML = FILES.map(id => {
    const m = MOUNTAINS[id], level = ['I', 'II', 'III', 'IV'][m.level - 1];
    return `<li class="rung${m.level === 4 ? ' dark' : ''}" data-rise>
      <p class="mono lvl">${esc(t(l, 'file.level', { level })).toUpperCase()}${m.level === 4 ? ` · ${esc(t(l, 'file.invite')).toUpperCase()}` : ''}</p>
      <h3>${esc(m.name[l])}</h3>
      <p class="mono">${num(l, m.height)} m · ${esc(t(l, 'file.weeks', { n: m.weeks }))} · ${esc(t(l, 'file.from', { price: euro(l, m.priceFrom) }))}*</p>
      <img class="shot" ${photoSet(id)} sizes="(max-width: 760px) 100vw, (max-width: 1000px) 50vw, 25vw" alt="${esc(creditFor(id)?.alt[l] ?? m.name[l])}" width="800" height="533" loading="lazy">
      <p>${esc(m.requirements[0][l])}</p>
      <a class="mono" href="${fileUrl(id)}">${esc(t(l, 'home.open', { no: m.no }))} →</a>
    </li>`;
  }).join('');
}

const quiz = mountClearance(document.getElementById('quiz')!, getLang);
onLang(l => {
  renderLadder(l);
  renderStrip(l);
  quiz(l);
  document.getElementById('card')!.innerHTML = dossier(MOUNTAINS[current], l, { open: true });
  view.setLabels(pinLabels(current, l));
  rise();
});
renderLadder(getLang());
renderStrip(getLang());
// drag the strip sideways with a mouse; touch already swipes
{
  const strip = document.getElementById('strip')!;
  let x0 = 0, s0 = 0, moved = false;
  strip.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; x0 = e.clientX; s0 = strip.scrollLeft; moved = false; strip.setPointerCapture(e.pointerId); strip.classList.add('drag'); });
  strip.addEventListener('pointermove', e => { if (!strip.hasPointerCapture(e.pointerId)) return; const d = e.clientX - x0; if (Math.abs(d) > 4) moved = true; strip.scrollLeft = s0 - d; });
  strip.addEventListener('pointerup', e => { strip.releasePointerCapture(e.pointerId); strip.classList.remove('drag'); });
  // a drag is not a click on the picture
  strip.addEventListener('click', e => { if (moved) e.preventDefault(); }, true);
}
rise();
await select(current, false);
// the other three get ready in the background, so the tabs switch quickly
view.preload(FILES.filter(f => f !== current));
