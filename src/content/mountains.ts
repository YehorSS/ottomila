// The four files. Facts are real and listed in sources.ts; prices, group sizes and the company are invented (demo).
export type Lang = 'it' | 'en' | 'uk';
export type Text = Record<Lang, string>;
export type FileId = 'ama-dablam' | 'manaslu' | 'everest' | 'k2';

export interface Camp { name: Text; height: number; day: number; note: Text }
export interface Mountain {
  id: FileId;
  no: string;
  level: 1 | 2 | 3 | 4;
  name: Text;
  height: number;
  summit: { lat: number; lon: number };
  /** rough line of the route from base camp to the top; camps are placed on it by height */
  path: [number, number][];
  region: Text;
  route: Text;
  tagline: Text;
  lead: Text;
  firstAscent: { year: number; text: Text };
  season: Text;
  weeks: number;
  group: number;
  /** euro, fictional */
  priceFrom: number;
  camps: Camp[];
  requirements: Text[];
  included: Text[];
  excluded: Text[];
  gear: Text[];
  risks: Text[];
  sources: string[];
}

const T = (it: string, en: string, uk: string): Text => ({ it, en, uk });

// shared lists
const INCLUDED = [
  T('Guida di alta quota con te dal campo base alla vetta', 'A high-altitude guide with you from base camp to the summit', 'Висотний гід поруч із тобою від базового табору до вершини'),
  T('Permesso di salita, ufficiale di collegamento, assicurazione del personale locale', 'Climbing permit, liaison officer, insurance for local staff', 'Дозвіл на сходження, офіцер зв’язку, страхування місцевого персоналу'),
  T('Tende, cucina e cuochi al campo base e nei campi alti', 'Tents, kitchen and cooks at base camp and the high camps', 'Намети, кухня та кухарі в базовому й висотних таборах'),
  T('Corde fisse, radio, telefono satellitare, medico al campo base', 'Fixed ropes, radios, satellite phone, a doctor at base camp', 'Провішені мотузки, рації, супутниковий телефон, лікар у базовому таборі'),
];
const EXCLUDED = [
  T('Voli internazionali e visto', 'International flights and visa', 'Міжнародні перельоти та віза'),
  T('Assicurazione con soccorso in elicottero (obbligatoria)', 'Insurance with helicopter rescue (required)', 'Страховка з евакуацією гелікоптером (обов’язкова)'),
  T('Attrezzatura personale e mance', 'Personal gear and tips', 'Особисте спорядження та чайові'),
];
const GEAR_BASE = [
  T('Scarponi d’alta quota tripli, ramponi', 'Triple high-altitude boots, crampons', 'Потрійні висотні черевики, кішки'),
  T('Imbrago, jumar, discensore, due moschettoni a ghiera', 'Harness, ascender, descender, two locking carabiners', 'Обв’язка, жумар, спусковий пристрій, два карабіни з муфтою'),
  T('Piumino da spedizione e sacco a pelo fino a −40 °C', 'Expedition down suit and sleeping bag to −40 °C', 'Експедиційний пуховий комбінезон і спальник до −40 °C'),
];

export const MOUNTAINS: Record<FileId, Mountain> = {
  'ama-dablam': {
    id: 'ama-dablam', no: '01', level: 1,
    name: T('Ama Dablam', 'Ama Dablam', 'Ама-Даблам'),
    height: 6812,
    summit: { lat: 27.8617, lon: 86.8614 },
    path: [[27.8447, 86.8330], [27.8505, 86.8448], [27.8546, 86.8517], [27.8584, 86.8572], [27.8617, 86.8614]],
    region: T('Khumbu, Nepal', 'Khumbu, Nepal', 'Кхумбу, Непал'),
    route: T('Cresta sud-ovest', 'Southwest Ridge', 'Південно-західний гребінь'),
    tagline: T('Dove scopri se vuoi il resto.', 'Where you find out whether you want the rest.', 'Тут ти дізнаєшся, чи хочеш далі.'),
    lead: T('Roccia, ghiaccio e una cresta sottile sopra la valle del Khumbu. Non è un ottomila, ma è la montagna che insegna tutto quello che servirà dopo.',
      'Rock, ice and a thin ridge above the Khumbu valley. It is not an eight-thousander, but it teaches everything you will need later.',
      'Скеля, лід і тонкий гребінь над долиною Кхумбу. Це не восьмитисячник, але саме тут вчишся всього, що знадобиться далі.'),
    firstAscent: { year: 1961, text: T('13 marzo 1961 — Mike Gill, Barry Bishop, Mike Ward, Wally Romanes (spedizione «Silver Hut»)', '13 March 1961 — Mike Gill, Barry Bishop, Mike Ward, Wally Romanes (the “Silver Hut” expedition)', '13 березня 1961 — Майк Гілл, Баррі Бішоп, Майк Ворд, Воллі Романес (експедиція «Silver Hut»)') },
    season: T('Ottobre–novembre', 'October–November', 'Жовтень–листопад'),
    weeks: 4, group: 8, priceFrom: 9800,
    camps: [
      { name: T('Campo base', 'Base Camp', 'Базовий табір'), height: 4600, day: 1, note: T('Prati sopra Pangboche. Acclimatamento e scuola di corda.', 'Meadows above Pangboche. Acclimatisation and rope practice.', 'Луки над Пангбоче. Акліматизація та тренування з мотузками.') },
      { name: T('Campo 1', 'Camp 1', 'Табір 1'), height: 5800, day: 6, note: T('Tende tra i massi della cresta. Da qui comincia l’arrampicata.', 'Tents among the boulders on the ridge. The climbing starts here.', 'Намети між брилами на гребені. Звідси починається лазіння.') },
      { name: T('Campo 2', 'Camp 2', 'Табір 2'), height: 6000, day: 10, note: T('Sopra la Torre Gialla, il passo più tecnico. Piazzole minuscole e vuoto ovunque.', 'Above the Yellow Tower, the most technical pitch. Tiny ledges, air everywhere.', 'Над Жовтою вежею, найтехнічнішою ділянкою. Крихітні полички, всюди прірва.') },
      { name: T('Campo 3', 'Camp 3', 'Табір 3'), height: 6300, day: 14, note: T('Una cengia sotto il seracco del Dablam. Si parte di notte.', 'A ledge below the Dablam serac. You leave at night.', 'Полиця під сераком Даблам. Виходиш уночі.') },
      { name: T('Vetta', 'Summit', 'Вершина'), height: 6812, day: 15, note: T('Una cupola di neve sopra l’Everest e il Lhotse all’orizzonte.', 'A snow dome, with Everest and Lhotse on the horizon.', 'Сніговий купол, на обрії Еверест і Лхоцзе.') },
    ],
    requirements: [
      T('Hai già fatto vie di misto o salite alpine di grado AD', 'You have climbed mixed routes or alpine routes of AD grade', 'Ти вже ходив комбіновані маршрути або альпійські маршрути категорії AD'),
      T('Sai usare ramponi, jumar e discensore', 'You can use crampons, an ascender and a descender', 'Ти вмієш користуватися кішками, жумаром і спусковим пристроєм'),
      T('Almeno 5000 m già raggiunti, 4 settimane libere', 'You have been above 5000 m and have 4 weeks free', 'Ти вже був вище 5000 м і маєш вільні 4 тижні'),
    ],
    included: INCLUDED, excluded: EXCLUDED,
    gear: [...GEAR_BASE, T('Guanti da roccia leggeri per la Torre Gialla', 'Light rock gloves for the Yellow Tower', 'Легкі рукавиці для скелі на Жовтій вежі')],
    risks: [
      T('Caduta di sassi tra il Campo 1 e il Campo 2', 'Rockfall between Camp 1 and Camp 2', 'Камінепади між таборами 1 і 2'),
      T('Il Campo 3 sta sotto un seracco: lo si usa il meno possibile', 'Camp 3 sits below a serac: we use it as little as possible', 'Табір 3 стоїть під сераком: ми користуємося ним якомога менше'),
      T('Esposizione continua sulla cresta: si è sempre legati alle corde fisse', 'Constant exposure on the ridge: you are always clipped to the fixed lines', 'Постійна відкритість на гребені: ти завжди пристебнутий до мотузок'),
    ],
    sources: ['explorersweb-ama', 'wiki-ama'],
  },

  manaslu: {
    id: 'manaslu', no: '02', level: 2,
    name: T('Manaslu', 'Manaslu', 'Манаслу'),
    height: 8163,
    summit: { lat: 28.5497, lon: 84.5597 },
    path: [[28.5905, 84.6110], [28.5810, 84.6000], [28.5700, 84.5880], [28.5600, 84.5720], [28.5530, 84.5640], [28.5497, 84.5597]],
    region: T('Gorkha, Nepal', 'Gorkha, Nepal', 'Горкха, Непал'),
    route: T('Versante nord-est (via normale)', 'Northeast Face (normal route)', 'Північно-східний схил (класичний маршрут)'),
    tagline: T('Il tuo primo ottomila. Quello vero.', 'Your first eight-thousander. The real one.', 'Твій перший восьмитисячник. Справжній.'),
    lead: T('La «montagna dello spirito». Per anni quasi tutti si sono fermati su un’anticima: noi andiamo sul punto più alto, o torniamo indietro.',
      'The “mountain of the spirit”. For years almost everyone stopped on a fore-summit: we go to the highest point, or we turn back.',
      '«Гора духу». Роками майже всі зупинялися на передвершині: ми йдемо на найвищу точку або повертаємося.'),
    firstAscent: { year: 1956, text: T('9 maggio 1956 — Toshio Imanishi e Gyalzen Norbu Sherpa (spedizione giapponese)', '9 May 1956 — Toshio Imanishi and Gyalzen Norbu Sherpa (Japanese expedition)', '9 травня 1956 — Тосіо Іманісі та Г’ялцен Норбу Шерпа (японська експедиція)') },
    season: T('Settembre–ottobre', 'September–October', 'Вересень–жовтень'),
    weeks: 6, group: 8, priceFrom: 24500,
    camps: [
      { name: T('Campo base', 'Base Camp', 'Базовий табір'), height: 4800, day: 1, note: T('Sopra Samagaon, su una morena con vista sul ghiacciaio.', 'Above Samagaon, on a moraine facing the glacier.', 'Над Самагаоном, на морені навпроти льодовика.') },
      { name: T('Campo 1', 'Camp 1', 'Табір 1'), height: 5700, day: 7, note: T('Sul ghiacciaio, dopo il primo labirinto di crepacci.', 'On the glacier, past the first maze of crevasses.', 'На льодовику, після першого лабіринту тріщин.') },
      { name: T('Campo 2', 'Camp 2', 'Табір 2'), height: 6400, day: 14, note: T('Sopra la seraccata. Qui il corpo impara la quota.', 'Above the icefall. This is where your body learns the height.', 'Над льодопадом. Тут тіло вчиться висоті.') },
      { name: T('Campo 3', 'Camp 3', 'Табір 3'), height: 6800, day: 22, note: T('Sotto il pendio più lungo. Vento, sempre.', 'Below the longest slope. Wind, always.', 'Під найдовшим схилом. Вітер, завжди.') },
      { name: T('Campo 4', 'Camp 4', 'Табір 4'), height: 7400, day: 30, note: T('Sull’altopiano. Ossigeno da qui in su.', 'On the plateau. Oxygen from here up.', 'На плато. Звідси вище — з киснем.') },
      { name: T('Vetta vera', 'True summit', 'Справжня вершина'), height: 8163, day: 31, note: T('Una cresta affilata oltre l’anticima. È lì che si conta.', 'A knife-edge past the fore-summit. That is the one that counts.', 'Гострий гребінь за передвершиною. Рахується саме вона.') },
    ],
    requirements: [
      T('Almeno 6500 m già saliti (per esempio Ama Dablam)', 'You have climbed at least 6500 m (Ama Dablam, for example)', 'Ти вже піднімався щонайменше на 6500 м (наприклад, Ама-Даблам)'),
      T('Sei settimane libere senza scadenze', 'Six weeks free, no deadlines', 'Шість вільних тижнів без дедлайнів'),
      T('Almeno 3 ore di allenamento a settimana per sei mesi', 'At least 3 hours of training a week for six months', 'Щонайменше 3 години тренувань на тиждень протягом пів року'),
    ],
    included: [...INCLUDED, T('Ossigeno dal Campo 3, maschera e regolatore', 'Oxygen from Camp 3, mask and regulator', 'Кисень від табору 3, маска й регулятор')],
    excluded: EXCLUDED,
    gear: [...GEAR_BASE, T('Occhiali da ghiacciaio categoria 4', 'Category 4 glacier glasses', 'Льодовикові окуляри 4-ї категорії')],
    risks: [
      T('Valanghe attorno al Campo 3: nel settembre 2012 una valanga travolse il campo', 'Avalanches around Camp 3: in September 2012 one swept the camp', 'Лавини біля табору 3: у вересні 2012 року лавина накрила табір'),
      T('La vetta vera è oltre una cresta esposta; molti si sono fermati prima', 'The true summit lies past an exposed ridge; many have stopped short', 'Справжня вершина за відкритим гребенем; багато хто зупинявся раніше'),
      T('Edema cerebrale e polmonare d’alta quota', 'High-altitude cerebral and pulmonary oedema', 'Висотний набряк мозку та легень'),
    ],
    sources: ['explorersweb-manaslu', 'horrell-manaslu-summit', 'wiki-manaslu'],
  },

  everest: {
    id: 'everest', no: '03', level: 3,
    name: T('Everest', 'Everest', 'Еверест'),
    height: 8849,
    summit: { lat: 27.9881, lon: 86.925 },
    path: [[28.0043, 86.8571], [27.997, 86.866], [27.986, 86.879], [27.981, 86.9], [27.972, 86.917], [27.973, 86.931], [27.9881, 86.925]],
    region: T('Khumbu, Nepal', 'Khumbu, Nepal', 'Кхумбу, Непал'),
    route: T('Colle Sud', 'South Col', 'Південне сідло'),
    tagline: T('La maggior parte delle persone lo vede solo in foto.', 'Most people only ever see it in photos.', 'Більшість людей бачить його лише на фото.'),
    lead: T('Nove settimane, cinque campi, una cresta fino al punto più alto della Terra. Lassù ogni respiro ha un terzo dell’ossigeno del mare.',
      'Nine weeks, five camps, one ridge to the highest point on Earth. Up there every breath holds a third of the oxygen it does at sea level.',
      'Дев’ять тижнів, п’ять таборів, один гребінь до найвищої точки Землі. Там кожен вдих має третину кисню від рівня моря.'),
    firstAscent: { year: 1953, text: T('29 maggio 1953 — Edmund Hillary e Tenzing Norgay', '29 May 1953 — Edmund Hillary and Tenzing Norgay', '29 травня 1953 — Едмунд Гілларі та Тенцинг Норгей') },
    season: T('Aprile–maggio', 'April–May', 'Квітень–травень'),
    weeks: 9, group: 8, priceFrom: 58000,
    camps: [
      { name: T('Campo base', 'Base Camp', 'Базовий табір'), height: 5364, day: 1, note: T('Sul ghiacciaio del Khumbu. Per sei settimane sarà casa.', 'On the Khumbu Glacier. Home for six weeks.', 'На льодовику Кхумбу. Дім на шість тижнів.') },
      { name: T('Campo 1', 'Camp 1', 'Табір 1'), height: 6065, day: 12, note: T('Oltre la seraccata del Khumbu, all’ingresso della Valle del Silenzio.', 'Past the Khumbu Icefall, at the mouth of the Western Cwm.', 'За льодопадом Кхумбу, на вході в Західний цирк.') },
      { name: T('Campo 2', 'Camp 2', 'Табір 2'), height: 6400, day: 13, note: T('Il campo avanzato. Di giorno fa caldo come in un forno di neve.', 'Advanced base. By day it is as hot as a snow oven.', 'Передовий табір. Удень спекотно, як у сніговій печі.') },
      { name: T('Campo 3', 'Camp 3', 'Табір 3'), height: 7162, day: 23, note: T('Piazzole scavate nella parete del Lhotse.', 'Platforms cut into the Lhotse Face.', 'Майданчики, вирубані в стіні Лхоцзе.') },
      { name: T('Colle Sud', 'South Col', 'Південне сідло'), height: 7920, day: 47, note: T('Zona della morte. Si dorme poche ore, si parte a mezzanotte.', 'The death zone. A few hours of sleep, you leave at midnight.', 'Зона смерті. Кілька годин сну, виходиш опівночі.') },
      { name: T('Vetta', 'Summit', 'Вершина'), height: 8849, day: 48, note: T('Il punto più alto della Terra. Restano dieci minuti e tutta la discesa.', 'The highest point on Earth. Ten minutes, then the whole way down.', 'Найвища точка Землі. Десять хвилин, а потім увесь спуск.') },
    ],
    requirements: [
      T('Un ottomila già salito, o 7000–8000 m con ottimo allenamento', 'One eight-thousander already, or 7000–8000 m and excellent fitness', 'Уже є один восьмитисячник, або 7000–8000 м і відмінна підготовка'),
      T('Nove settimane libere', 'Nine weeks free', 'Дев’ять вільних тижнів'),
      T('Più di 6 ore di allenamento a settimana per un anno', 'More than 6 hours of training a week for a year', 'Понад 6 годин тренувань на тиждень протягом року'),
    ],
    included: [...INCLUDED, T('Ossigeno dal Campo 3, una guida sherpa personale il giorno della vetta', 'Oxygen from Camp 3, a personal Sherpa guide on summit day', 'Кисень від табору 3, особистий гід-шерпа в день сходження')],
    excluded: EXCLUDED,
    gear: [...GEAR_BASE, T('Muffole da 8000 m e scaldini', '8000 m mittens and warmers', 'Рукавиці для 8000 м і грілки')],
    risks: [
      T('339 morti e 13 737 salite in vetta fino al 2025 (Himalayan Database)', '339 deaths and 13,737 summits up to 2025 (Himalayan Database)', '339 загиблих і 13 737 сходжень на вершину до 2025 року (Himalayan Database)'),
      T('La seraccata del Khumbu si muove ogni giorno: la attraversiamo prima dell’alba', 'The Khumbu Icefall moves every day: we cross it before dawn', 'Льодопад Кхумбу рухається щодня: проходимо його до світанку'),
      T('Code sulla cresta finale: orario di rientro fisso, anche a cento metri dalla vetta', 'Queues on the final ridge: a fixed turnaround time, even a hundred metres from the top', 'Черги на останньому гребені: фіксований час розвороту, навіть за сто метрів від вершини'),
    ],
    sources: ['arnette-everest-routes', 'arnette-numbers-2026', 'wiki-everest'],
  },

  k2: {
    id: 'k2', no: '04', level: 4,
    name: T('K2', 'K2', 'K2'),
    height: 8611,
    summit: { lat: 35.8825, lon: 76.5133 },
    path: [[35.8360, 76.5060], [35.8470, 76.5260], [35.8560, 76.5300], [35.8660, 76.5240], [35.8750, 76.5180], [35.8825, 76.5133]],
    region: T('Karakorum, Pakistan', 'Karakoram, Pakistan', 'Каракорум, Пакистан'),
    route: T('Sperone Abruzzi', 'Abruzzi Spur', 'Ребро Абруццо'),
    tagline: T('La montagna che dice no.', 'The mountain that says no.', 'Гора, яка каже «ні».'),
    lead: T('Più ripida, più fredda e più lontana dai soccorsi dell’Everest. Saliamo in sei, e solo con chi è già stato su un ottomila. Nel 1954 la prima salita fu italiana.',
      'Steeper, colder and further from help than Everest. We go as six, and only with people who have stood on an eight-thousander. In 1954 the first ascent was Italian.',
      'Крутіша, холодніша й далі від допомоги, ніж Еверест. Ідемо вшістьох і лише з тими, хто вже стояв на восьмитисячнику. 1954 року перше сходження було італійським.'),
    firstAscent: { year: 1954, text: T('31 luglio 1954 — Achille Compagnoni e Lino Lacedelli (spedizione italiana di Ardito Desio)', '31 July 1954 — Achille Compagnoni and Lino Lacedelli (Italian expedition led by Ardito Desio)', '31 липня 1954 — Акілле Компаньоні та Ліно Лачеделлі (італійська експедиція Ардіто Дезіо)') },
    season: T('Giugno–agosto', 'June–August', 'Червень–серпень'),
    weeks: 9, group: 6, priceFrom: 62000,
    camps: [
      { name: T('Campo base', 'Base Camp', 'Базовий табір'), height: 5000, day: 1, note: T('Sul ghiacciaio Godwin-Austen, dopo più di una settimana di marcia sul Baltoro.', 'On the Godwin-Austen Glacier, after more than a week walking up the Baltoro.', 'На льодовику Годвін-Остен, після понад тижня ходу Балторо.') },
      { name: T('Campo 1', 'Camp 1', 'Табір 1'), height: 6050, day: 8, note: T('Una cresta di roccia esposta ai sassi.', 'A rock rib exposed to falling stones.', 'Скельне ребро під камінепадом.') },
      { name: T('Campo 2', 'Camp 2', 'Табір 2'), height: 6700, day: 15, note: T('Sopra il Camino House, il primo vero esame.', 'Above House’s Chimney, the first real test.', 'Над Камином Гауса, першим справжнім іспитом.') },
      { name: T('Campo 3', 'Camp 3', 'Табір 3'), height: 7300, day: 30, note: T('Oltre la Piramide Nera. Da qui niente è facile.', 'Past the Black Pyramid. Nothing is easy from here.', 'За Чорною пірамідою. Звідси нічого не буває легким.') },
      { name: T('Campo 4', 'Camp 4', 'Табір 4'), height: 7900, day: 44, note: T('La Spalla. Si parte verso il Collo di Bottiglia.', 'The Shoulder. You leave for the Bottleneck.', 'Плече. Виходиш до Пляшкового горла.') },
      { name: T('Collo di Bottiglia', 'Bottleneck', 'Пляшкове горло'), height: 8200, day: 45, note: T('Un canale sotto un seracco sospeso. Si passa in fretta e in silenzio.', 'A couloir under a hanging serac. You pass fast and in silence.', 'Кулуар під навислим сераком. Проходиш швидко й мовчки.') },
      { name: T('Vetta', 'Summit', 'Вершина'), height: 8611, day: 45, note: T('Pochissimi sono stati qui. Adesso anche tu.', 'Very few people have stood here. Now you have.', 'Тут стояли дуже небагато людей. Тепер і ти.') },
    ],
    requirements: [
      T('Almeno un ottomila salito, meglio con noi', 'At least one eight-thousander, ideally with us', 'Щонайменше один восьмитисячник, найкраще з нами'),
      T('Nove settimane libere', 'Nine weeks free', 'Дев’ять вільних тижнів'),
      T('Più di 6 ore di allenamento a settimana, e un colloquio con le nostre guide', 'More than 6 hours of training a week, and an interview with our guides', 'Понад 6 годин тренувань на тиждень і співбесіда з нашими гідами'),
    ],
    included: [...INCLUDED, T('Portatori balti per la marcia del Baltoro, ossigeno dal Campo 4', 'Balti porters for the Baltoro trek, oxygen from Camp 4', 'Носії-балті на переході Балторо, кисень від табору 4')],
    excluded: EXCLUDED,
    gear: [...GEAR_BASE, T('Casco: sulla Piramide Nera cadono sassi', 'Helmet: stones fall on the Black Pyramid', 'Шолом: на Чорній піраміді падає каміння')],
    risks: [
      T('Circa 96 morti e 700 salite fino al 2022; prima del 2000 quasi uno ogni quattro', 'About 96 deaths and 700 summits up to 2022; before 2000 nearly one in four', 'Близько 96 загиблих і 700 сходжень до 2022 року; до 2000-го — майже кожен четвертий'),
      T('Il seracco sopra il Collo di Bottiglia: nel 2008 il suo crollo fu parte della tragedia in cui morirono undici alpinisti', 'The serac above the Bottleneck: in 2008 its collapse was part of a disaster that killed eleven climbers', 'Серак над Пляшковим горлом: 2008 року його обвал став частиною катастрофи, у якій загинули одинадцять альпіністів'),
      T('Il meteo cambia in ore e l’elicottero non può salire in alto: dalla montagna si scende con le proprie gambe', 'The weather turns in hours and helicopters cannot reach the high camps: you come down on your own legs', 'Погода змінюється за години, а гелікоптер не долітає до високих таборів: з гори спускаєшся своїми ногами'),
    ],
    sources: ['arnette-k2-abruzzi', 'wiki-k2', 'wiki-8000-deaths', 'guinness-k2-winter'],
  },
};

export const FILES: FileId[] = ['ama-dablam', 'manaslu', 'everest', 'k2'];
