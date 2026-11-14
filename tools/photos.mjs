// Web sizes and credits for the chosen photographs (downloaded into assets/ by the design skill's assets.mjs --get).
import sharp from 'sharp';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const OUT = 'public/photos';
mkdirSync(OUT, { recursive: true });
const PICK = {
  'ama-dablam': ['himalayas-ama-dablam-nepal.jpg', 'Ama Dablam above the Khumbu valley', 'L’Ama Dablam sopra la valle del Khumbu', 'Ама-Даблам над долиною Кхумбу'],
  manaslu: ['mt-manaslu.jpg', 'Manaslu', 'Il Manaslu', 'Манаслу'],
  everest: ['everest-himalayas.jpg', 'Everest behind the Nuptse ridge', 'L’Everest dietro la cresta del Nuptse', 'Еверест за гребенем Нупцзе'],
  k2: ['k2-from-concordia-3.jpg', 'K2 seen from Concordia', 'Il K2 visto da Concordia', 'K2 з Конкордії'],
  night: ['k2-from-concordia.jpg', 'A tent at Concordia under the Karakoram at night', 'Una tenda a Concordia sotto il Karakorum, di notte', 'Намет на Конкордії під Каракорумом уночі'],
  // one real picture of each camp's place, from cand/
  'everest-bc': ['cand:everest-base-camp-sits-on-top-of.jpg', 'Everest Base Camp on the Khumbu Glacier', 'Il campo base dell’Everest sul ghiacciaio del Khumbu', 'Базовий табір Евересту на льодовику Кхумбу'],
  'everest-c1': ['cand:nepal-sagamartha-trek-186-khumbu-icefall-plus.jpg', 'The Khumbu Icefall above base camp', 'La seraccata del Khumbu sopra il campo base', 'Льодопад Кхумбу над базовим табором'],
  'everest-c2': ['cand:khumbu-icefall-from-kala-patther.jpg', 'The icefall and the mouth of the Western Cwm', 'La seraccata e l’ingresso della Valle del Silenzio', 'Льодопад і вхід до Західного цирку'],
  'everest-c3': ['cand:western-cwm-14th-may-2011.jpg', 'The Western Cwm, with the Lhotse Face at its head', 'La Valle del Silenzio, con la parete del Lhotse in fondo', 'Західний цирк, у кінці — стіна Лхоцзе'],
  'everest-col': ['cand:south-cole.jpg', 'Tents on the South Col', 'Tende al Colle Sud', 'Намети на Південному сідлі'],
  'everest-top': ['cand:hillary-step-near-everest-top-retouched.jpg', 'The summit ridge near the Hillary Step', 'La cresta finale vicino all’Hillary Step', 'Вершинний гребінь біля сходинки Гілларі'],
  'k2-bc': ['cand:approaching-k2-base-camp.jpg', 'Approaching K2 Base Camp on the Godwin-Austen Glacier', 'Verso il campo base del K2 sul ghiacciaio Godwin-Austen', 'Дорога до базового табору K2 на льодовику Годвін-Остен'],
  'k2-c1': ['cand:chogori-3to4.jpg', 'The south face of K2 above base camp', 'La parete sud del K2 sopra il campo base', 'Південна стіна K2 над базовим табором'],
  'k2-bottleneck': ['cand:k2-bottleneck.jpg', 'The Bottleneck and its serac, 1986', 'Il Collo di Bottiglia e il suo seracco, 1986', 'Пляшкове горло та його серак, 1986'],
  'k2-top': ['cand:k2-summit-1954.jpg', 'Lino Lacedelli on the summit of K2, 31 July 1954', 'Lino Lacedelli in vetta al K2, 31 luglio 1954', 'Ліно Лачеделлі на вершині K2, 31 липня 1954'],
  'manaslu-bc': ['cand:mt-manaslu-from-manaslu-basecamp.jpg', 'Manaslu from base camp', 'Il Manaslu dal campo base', 'Манаслу з базового табору'],
  'manaslu-c2': ['cand:camp-2.jpg', 'Camp 2 on Manaslu, above the clouds', 'Il Campo 2 sul Manaslu, sopra le nuvole', 'Табір 2 на Манаслу, над хмарами'],
  'manaslu-c3': ['cand:camp-3-of-mt-manslu.jpg', 'Camp 3 on Manaslu', 'Il Campo 3 sul Manaslu', 'Табір 3 на Манаслу'],
  'ama-bc': ['cand:ama-dablam-himalayas-nepal.jpg', 'The trail to Ama Dablam base camp', 'Il sentiero verso il campo base dell’Ama Dablam', 'Стежка до базового табору Ама-Даблам'],
};
const credits = [...JSON.parse(readFileSync('assets/credits.json', 'utf8')), ...JSON.parse(readFileSync('cand/credits.json', 'utf8'))];
const list = [];
for (const [name, [file, en, it, uk]] of Object.entries(PICK)) {
  const path = file.startsWith('cand:') ? `cand/${file.slice(5)}` : `assets/${file}`;
  const c = credits.find(x => x.file === path);
  if (!c) throw new Error(`no credit for ${file}`);
  // the author's rule: high-resolution sources, 960/1600/2560 widths, quality 82–88
  const meta = await sharp(path).metadata();
  if (meta.width < 2560) console.warn(`${file} is only ${meta.width}px wide`);
  for (const w of [960, 1600, 2560]) {
    await sharp(path).resize({ width: Math.min(w, meta.width), withoutEnlargement: true }).webp({ quality: 84 }).toFile(`${OUT}/${name}-${w}.webp`);
  }
  list.push({ name, alt: { en, it, uk }, creator: c.creator.replace(/^(.+) \1$/, '$1'), license: c.license, licenseUrl: c.licenseUrl, page: c.page });
}
writeFileSync(`${OUT}/credits.json`, JSON.stringify(list, null, 1));
console.log(list.map(l => `${l.name}: ${l.creator} · ${l.license}`).join('\n'));
