// Where the facts on the site come from. Camp heights differ between sources by up to a few hundred metres;
// the site uses middle values and says they are approximate.
export const SOURCES: Record<string, { title: string; url: string }> = {
  'arnette-everest-routes': { title: 'Alan Arnette — Everest Southeast Ridge route', url: 'https://www.alanarnette.com/everest/everestsouthroutes.php' },
  'arnette-numbers-2026': { title: 'Alan Arnette — Everest by the Numbers, 2026 edition (Himalayan Database data)', url: 'https://www.alanarnette.com/2026/01/26/everest-by-the-numbers-2026-edition/' },
  'wiki-everest': { title: 'Wikipedia — Mount Everest', url: 'https://en.wikipedia.org/wiki/Mount_Everest' },
  'arnette-k2-abruzzi': { title: 'Alan Arnette — K2 winter on the Abruzzi', url: 'https://www.alanarnette.com/2020/12/23/k2-winter-on-the-abruzzi/' },
  'wiki-k2': { title: 'Wikipedia — K2', url: 'https://en.wikipedia.org/wiki/K2' },
  'wiki-8000-deaths': { title: 'Wikipedia — List of deaths on eight-thousanders', url: 'https://en.wikipedia.org/wiki/List_of_deaths_on_eight-thousanders' },
  'guinness-k2-winter': { title: 'Guinness World Records — First winter ascent of K2', url: 'https://www.guinnessworldrecords.com/world-records/665319-first-winter-ascent-of-k2' },
  'explorersweb-manaslu': { title: 'Explorersweb — Manaslu: a climber’s guide', url: 'https://explorersweb.com/manaslu-a-climbers-guide/' },
  'horrell-manaslu-summit': { title: 'Mark Horrell — The true summit of Manaslu', url: 'https://markhorrell.com/blog/2020/the-true-summit-of-manaslu-a-long-standing-mystery-solved' },
  'wiki-manaslu': { title: 'Wikipedia — Manaslu', url: 'https://en.wikipedia.org/wiki/Manaslu' },
  'explorersweb-ama': { title: 'Explorersweb — Ama Dablam: a climbers’ guide', url: 'https://explorersweb.com/ama-dablam-a-climbers-guide/' },
  'wiki-ama': { title: 'Wikipedia — Ama Dablam', url: 'https://en.wikipedia.org/wiki/Ama_Dablam' },
  'copernicus-dem': { title: 'Copernicus DEM GLO-30 (ESA), terrain on every map', url: 'https://spacedata.copernicus.eu/collections/copernicus-digital-elevation-model' },
  'sentinel2': { title: 'Contains modified Copernicus Sentinel-2 data (2020, 2025), imagery on every map', url: 'https://registry.opendata.aws/sentinel-2-l2a-cogs/' },
  'barometric': { title: 'International Standard Atmosphere — pressure with height', url: 'https://en.wikipedia.org/wiki/Barometric_formula' },
};
