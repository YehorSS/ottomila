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
};
const credits = JSON.parse(readFileSync('assets/credits.json', 'utf8'));
const list = [];
for (const [name, [file, en, it, uk]] of Object.entries(PICK)) {
  const c = credits.find(x => x.file === `assets/${file}`);
  if (!c) throw new Error(`no credit for ${file}`);
  // the author's rule: high-resolution sources, 960/1600/2560 widths, quality 82–88
  const meta = await sharp(`assets/${file}`).metadata();
  if (meta.width < 2560) console.warn(`${file} is only ${meta.width}px wide`);
  for (const w of [960, 1600, 2560]) {
    await sharp(`assets/${file}`).resize({ width: Math.min(w, meta.width), withoutEnlargement: true }).webp({ quality: 84 }).toFile(`${OUT}/${name}-${w}.webp`);
  }
  list.push({ name, alt: { en, it, uk }, creator: c.creator.replace(/^(.+) \1$/, '$1'), license: c.license, licenseUrl: c.licenseUrl, page: c.page });
}
writeFileSync(`${OUT}/credits.json`, JSON.stringify(list, null, 1));
console.log(list.map(l => `${l.name}: ${l.creator} · ${l.license}`).join('\n'));
