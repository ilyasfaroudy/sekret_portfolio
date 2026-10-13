/* =========================================================
   SEKRET® — projects.js
   Единый источник данных о проектах.
   Отсюда строятся: Project Index на главной, шапка и мета
   case-страниц, блок «Next project», подписи page-transition.

   Кадрирование (crop) задаётся в пикселях исходного файла:
   sw/sh — размер исходника, x/y/w/h — видимая область.
   Это не меняет сами файлы — только то, какая часть видна.
   ========================================================= */

window.SEKRET_CROPS = {
  /* posters-grid.jpg — 6 постеров на одном листе 1800×1350 */
  lyfe:      { src: 'assets/work/posters-grid.jpg', sw: 1800, sh: 1350, x: 190,  y: 77,  w: 460, h: 588 },
  adlOne:    { src: 'assets/work/posters-grid.jpg', sw: 1800, sh: 1350, x: 670,  y: 77,  w: 460, h: 588 },
  adlTwo:    { src: 'assets/work/posters-grid.jpg', sw: 1800, sh: 1350, x: 1150, y: 77,  w: 460, h: 588 },
  effect:    { src: 'assets/work/posters-grid.jpg', sw: 1800, sh: 1350, x: 190,  y: 685, w: 460, h: 588 },
  jellyfish: { src: 'assets/work/posters-grid.jpg', sw: 1800, sh: 1350, x: 670,  y: 685, w: 460, h: 588 },
  fractal:   { src: 'assets/work/posters-grid.jpg', sw: 1800, sh: 1350, x: 1150, y: 685, w: 460, h: 588 },
  postersAll:{ src: 'assets/work/posters-grid.jpg', sw: 1800, sh: 1350, x: 186,  y: 73,  w: 1428, h: 1204 },

  /* леттеринг */
  marks:     { src: 'assets/work/sekret-cluster.jpg', sw: 1400, sh: 646, x: 330, y: 0, w: 1070, h: 540 },
  eye:       { src: 'assets/work/sekret-cluster.jpg', sw: 1400, sh: 646, x: 0,   y: 10, w: 470, h: 470 },
  truck:     { src: 'assets/work/truck-lettering.jpg', sw: 987, sh: 933, x: 16, y: 0, w: 722, h: 933 },
  graphicSheet: { src: 'assets/work/graphic-cover.jpg', sw: 1800, sh: 1050, x: 0, y: 92, w: 1800, h: 958 },

  /* 3D — Sekret Module 25 */
  module:    { src: 'assets/work/3d-cover.jpg',    sw: 1800, sh: 1027, x: 150, y: 116, w: 1500, h: 845 },
  exploded:  { src: 'assets/work/3d-exploded.jpg', sw: 984,  sh: 684,  x: 0,   y: 0,   w: 984,  h: 588 },
  folded:    { src: 'assets/work/3d-folded.jpg',   sw: 900,  sh: 684,  x: 0,   y: 0,   w: 900,  h: 592 },
  lens:      { src: 'assets/work/3d-lens.jpg',     sw: 984,  sh: 516,  x: 48,  y: 0,   w: 936,  h: 414 },
  sky:       { src: 'assets/work/3d-sky.jpg',      sw: 900,  sh: 516,  x: 0,   y: 0,   w: 900,  h: 414 },

  /* Лендинг «Женская безопасность» */
  safetyHero:{ src: 'assets/work/landing-cover.jpg', sw: 1100, sh: 1037, x: 0, y: 0,   w: 1100, h: 940 },
  safetyMap: { src: 'assets/work/landing-01.jpg',    sw: 1100, sh: 1357, x: 0, y: 0,   w: 1100, h: 1357 },
  safetyCopy:{ src: 'assets/work/landing-02.jpg',    sw: 1100, sh: 917,  x: 0, y: 290, w: 1100, h: 627 },
  safetyPlans:{ src: 'assets/work/landing-03.jpg',   sw: 1100, sh: 758,  x: 0, y: 0,   w: 1100, h: 700 },

  /* Обложки 3:2 для Case Wheel в hero */
  postersWheel:{ src: 'assets/work/posters-grid.jpg', sw: 1800, sh: 1350, x: 186, y: 73, w: 1428, h: 952 },
  moduleWheel: { src: 'assets/work/3d-cover.jpg',     sw: 1800, sh: 1027, x: 150, y: 116, w: 1268, h: 845 },
  safetyWheel: { src: 'assets/work/landing-cover.jpg', sw: 1100, sh: 1037, x: 0, y: 40, w: 1100, h: 733 },

  /* Тюнинг-ателье — серия карточек для Яндекс Карт (650×1160) */
  tuningWheel:  { src: 'assets/work/tuning/1.jpg', sw: 650, sh: 1160, x: 0, y: 168, w: 650, h: 433 },
  tuningPreview:{ src: 'assets/work/tuning/1.jpg', sw: 650, sh: 1160, x: 0, y: 120, w: 650, h: 812 }
};

window.SEKRET_PROJECTS = [
  {
    id: 'posters',
    no: '01',
    file: 'project-1.html',
    title: 'Sekret — постеры и леттеринг',
    short: 'Sekret Posters',
    category: 'Графический дизайн · леттеринг',
    tag: 'Graphic / Lettering',
    client: 'Авторский проект',
    role: 'Арт-дирекшн, типографика, леттеринг',
    year: '2023—2025',
    tools: ['Photoshop', 'Illustrator', 'Procreate'],
    featured: true,
    status: 'live',
    cover: 'postersAll',
    wheel: 'postersWheel',
    preview: 'lyfe',
    statement: 'Собрал авторский визуальный язык, который одинаково держится на постере, обложке трека и кузове реального фургона.',
    challenge: 'Сформулировать личный почерк Sekret Design на стыке граффити-культуры и графического дизайна — так, чтобы он работал не только на экране.',
    response: 'Серия ч/б постеров со шрифтовыми композициями, набор леттеринг-знаков и роспись фургона петербургских райтеров — один стиль, перенесённый с листа на объект.',
    value: 'Узнаваемая система знаков и композиций, которая масштабируется между форматами и сохраняет консистентность — от обложки до стрит-арта.'
  },
  {
    id: 'module',
    no: '02',
    file: 'project-4.html',
    title: 'Sekret Module 25',
    short: 'Sekret Module 25',
    category: '3D-визуализация · Blender',
    tag: '3D / Product',
    client: 'Авторский проект',
    role: 'Моделирование, материалы, свет, анимация',
    year: '2025',
    tools: ['Blender'],
    featured: true,
    status: 'live',
    cover: 'module',
    wheel: 'moduleWheel',
    preview: 'exploded',
    statement: 'Показал несуществующий продукт так, чтобы он ощущался осязаемым: материал и разборная схема становятся главным аргументом.',
    challenge: 'Сделать вымышленное модульное устройство убедительным — чтобы зритель поверил в материал, вес и механику продукта.',
    response: 'Полный цикл в Blender: геометрия, анодированный металл, резина и стекло с преломлением, окружение, свет и анимация складывания.',
    value: 'Презентационная 3D-система: разборная схема объясняет устройство, крупные планы продают материал, небо даёт продукту воздух.'
  },
  {
    id: 'safety',
    no: '03',
    file: 'project-5.html',
    title: 'Женская безопасность',
    short: 'Женская безопасность',
    category: 'Веб-дизайн · лендинг',
    tag: 'Web / Landing',
    client: 'Авторский проект',
    role: 'UX-структура, веб-дизайн',
    year: '2025',
    tools: ['Figma'],
    featured: true,
    status: 'live',
    cover: 'safetyHero',
    wheel: 'safetyWheel',
    preview: 'safetyMap',
    statement: 'Выстроил иерархию лендинга так, чтобы ключевые функции считывались с первого экрана, а тон оставался спокойным и заботливым.',
    challenge: 'Рассказать о сервисе безопасности без давления и тревожности — и при этом ясно показать, что именно он умеет.',
    response: 'Модульная сетка, крупная гротескная типографика и мягкая розовая палитра; карта маршрутов, SOS и комьюнити-чаты как три опорных блока.',
    value: 'Чёткий сценарий страницы: оффер, функции и тарифы считываются последовательно, а визуальный тон поддерживает доверие к продукту.'
  },
  {
    id: 'tuning',
    no: '04',
    file: 'project-7.html',
    title: 'Анатомия сидений',
    short: 'Анатомия сидений',
    category: 'Digital-коммуникация · Яндекс Карты',
    tag: 'Commercial / Maps',
    client: 'Тюнинг-ателье, Санкт-Петербург',
    role: 'Визуальная система, инфографика, серия карточек',
    year: '—',
    tools: [],
    featured: true,
    status: 'live',
    cover: 'tuningWheel',
    wheel: 'tuningWheel',
    preview: 'tuningPreview',
    statement: 'Перевёл технически сложную услугу в последовательную визуальную историю: пользователь быстро понимает проблему, процесс и ценность доработки.',
    challenge: 'Объяснить изменение анатомии автомобильных сидений так, чтобы в карточке на Яндекс Картах за несколько секунд было понятно, что меняют, зачем и как проходит работа.',
    response: 'Серия вертикальных карточек: металлическая типографика, технические рендеры кресла, бирюзовые акцентные линии и пошаговая структура — от боли пользователя к технологии.',
    value: 'Последовательное раскрытие информации снижает перегрузку и помогает быстрее понять ценность процедуры, а вертикальный формат рассчитан на мобильный просмотр.'
  },
  {
    id: 'campaign',
    no: '05',
    file: 'project-2.html',
    title: 'Кампания запуска продукта',
    short: 'Кампания запуска',
    category: 'Рекламные креативы',
    tag: 'Campaign / Ads',
    client: 'D2C-бренд (NDA)',
    role: 'Креативы, адаптации, анимация',
    year: '2024',
    tools: ['Photoshop', 'After Effects'],
    featured: false,
    status: 'nda',
    cover: null,
    preview: null,
    statement: 'Единый визуальный код кампании, который не разваливается при адаптации от квадратного поста до вертикальной сторис.',
    challenge: 'Запустить продукт на нескольких площадках сразу — с разными пропорциями и без потери читаемости на маленьком экране.',
    response: 'Серия статичных и анимированных креативов с жёсткой иерархией: оффер — первым, бренд — сразу за ним.',
    value: 'Масштабируемая система креативов: новые форматы собираются из тех же модулей и остаются узнаваемыми.'
  },
  {
    id: 'commerce',
    no: '06',
    file: 'project-3.html',
    title: 'Карточки товаров e-commerce',
    short: 'E-commerce карточки',
    category: 'Digital · продуктовая графика',
    tag: 'E-commerce',
    client: 'Интернет-магазин (NDA)',
    role: 'Шаблоны, инфографика',
    year: '2023',
    tools: ['Photoshop', 'Figma'],
    featured: false,
    status: 'nda',
    cover: null,
    preview: null,
    statement: 'Модульная система карточек: единая сетка и шрифтовая иерархия быстро собирают новый товар без потери узнаваемости.',
    challenge: 'Сделать каталог маркетплейса визуально цельным, когда товаров много, а категории сильно отличаются.',
    response: 'Главное фото, инфографика с характеристиками и набор дополнительных слайдов на общей модульной сетке.',
    value: 'Шаблоны, которые масштабируются на весь каталог и делают ключевые характеристики считываемыми с превью.'
  },
  {
    id: 'social',
    no: '07',
    file: 'project-6.html',
    title: 'Визуалы для соцсетей и презентаций',
    short: 'Соцсети и деки',
    category: 'Digital-графика · контент',
    tag: 'Social / Decks',
    client: 'Несколько клиентов (NDA)',
    role: 'Посты, сторис, питч-деки',
    year: '2023—2024',
    tools: ['Illustrator', 'Photoshop', 'Premiere Pro'],
    featured: false,
    status: 'nda',
    cover: null,
    preview: null,
    statement: 'Перевожу чужую айдентику в формат соцсетей и презентаций, сохраняя её узнаваемость и не скатываясь в шаблонность.',
    challenge: 'Быстро адаптировать разные фирменные стили под посты, сторис и слайды питч-дека.',
    response: 'Набор гибких шаблонов под каждый бренд: сетка, типографика, правила работы с фото и графикой.',
    value: 'Консистентный контент, который команда клиента может продолжать сама, не ломая стиль.'
  }
];
