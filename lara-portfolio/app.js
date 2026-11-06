/* Lara Al-Khaffaf — portfolio.
   Content lives in the DATA section; design rules live in DESIGN.md (Vellum). */
(() => {
  'use strict';

  /* =========================================================
     DATA
     ========================================================= */

  const SITE = {
    name: 'Lara Al-Khaffaf',
    email: 'larakhaffaf@gmail.com',
    location: 'Dubai, UAE',
    cv: 'assets/Lara-Al-Khaffaf-CV.pdf',
  };

  // Image sizes (px) so the layout doesn't jump while loading.
  // Existing drawings in compare pairs are registered onto their proposed drawing (same size, aligned lines).
  const IMG = {
    'res-elev-front-existing': [1563, 989], 'res-elev-front-proposed': [1563, 989], 'res-plan-ground': [795, 1557],
    'res-elev-side-existing': [2201, 1054], 'res-elev-side-proposed': [2201, 1054], 'res-elev-rear-existing': [1566, 1084],
    'res-garden-house': [1554, 1234], 'res-section-existing': [2201, 1161], 'res-section-proposed': [2201, 1161],
    'res-model': [2201, 821], 'res-render-front': [2082, 758], 'res-render-pool': [1592, 989], 'res-render-rear': [1834, 860],
    'int-plan': [1033, 1195], 'int-elev-ab': [2401, 1424], 'int-elev-cd': [2401, 1475],
    'int-render-1': [1025, 1025], 'int-render-2': [1025, 1025], 'int-render-3': [1025, 1025], 'int-render-4': [1025, 1025],
    'land-satellite': [1577, 1399], 'land-os-prow': [915, 903], 'land-cad-site': [1575, 1455], 'land-constraints': [1593, 1411],
    'land-cad-detail': [1529, 1153], 'land-cad-layout': [1425, 1411], 'land-sketch': [1330, 1182],
    'land-render-1': [1331, 1183], 'land-render-2': [1416, 1111], 'land-render-3': [788, 577],
    'con-axo': [1109, 1228], 'con-roof-plan': [1026, 1148], 'con-joint': [825, 743], 'con-beam-joint': [557, 781],
    'con-crown-plan': [1051, 746], 'con-crown-elev': [1384, 583], 'con-wall-section': [318, 1217], 'con-section-persp': [550, 1269],
  };

  // Backdrop render for each page (projects set their own).
  const BG = { home: 'res-render-front', work: 'land-render-2', about: 'int-render-3', contact: 'res-render-pool' };

  const EXPERIENCE = [
    { role: 'Landscape architecture training', place: 'Kent, United Kingdom', date: 'Jun – Aug 2026',
      points: ['Site analysis and a Green Belt feasibility study for a 7-hectare woodland.', 'AutoCAD layouts, hand sketches and material for the client report.'] },
    { role: 'Interior design training', place: 'Dubai, United Arab Emirates', date: 'Jan – Apr 2026',
      points: ['Bathroom design within residential interior projects.', 'Plans, detailed elevations and renders for each client.'] },
    { role: 'Trainee Architect, GriDesign', place: 'London, United Kingdom', date: 'May – Dec 2025',
      points: ['Led a full Building Control drawing set in AutoCAD, under supervision.', 'Built SketchUp models and detailed roof designs for client submissions.', 'Revised designs in response to client feedback with the lead architect.'] },
    { role: 'Trainee Architect, Diar Consult', place: 'Dubai, United Arab Emirates', date: 'May – Jun 2024',
      points: ['Trained at the Dubai head office under the Chairman and Principal Design Architect.', 'Contextual analysis and concept design for a commercial and retail project in Abu Dhabi.', 'Joined client meetings and prepared presentations for senior stakeholders.'] },
  ];

  const EDUCATION = [
    { title: 'BSc Architecture', place: 'University of Reading, United Kingdom', date: '2022–2025' },
    { title: 'International Baccalaureate Diploma, 38 points', place: 'Amman Baccalaureate School, Jordan', date: '2011–2020' },
  ];

  const SKILLS = [
    { group: 'Drafting and BIM', items: ['AutoCAD', 'Revit', 'Rhino', 'SketchUp'] },
    { group: 'Visualisation', items: ['D5 Render', 'Photoshop', 'Illustrator', 'InDesign'] },
    { group: 'Motion and presentation', items: ['After Effects', 'Premiere Pro', 'PowerPoint', 'Canva'] },
    { group: 'Practice', items: ['Concept design', 'Technical drawing', 'Hand drawing', '3D modelling', 'BIM', 'Construction detailing'] },
  ];

  /* Media items: { src } image, { compare: [existing, proposed] } slider, { model } 3D viewer.
     w: full | two | half | third. paper: drawing on white. ar: fixed aspect ratio. rows: 2 to span two rows.
     To show a SketchUp export: { model: 'glb', src: 'assets/models/house.glb', fallback: 'res-model', cap: '…' } */
  const PROJECTS = [
    {
      slug: 'residential-renovation', num: '01', icon: 'house', tint: 'var(--tint-blue)',
      title: 'Residential Renovation', discipline: 'Residential', year: '2025',
      cover: 'res-render-front', coverCap: 'Rendered front view of the proposal', bg: 'res-render-rear',
      summary: 'A more contemporary face for a private house, with refined masonry, new sunroofs and a garden house that carries the architecture into the garden.',
      meta: ['2025', 'Internship at GriDesign', 'London, UK'],
      glance: [['Role', 'Trainee Architect'], ['Studio', 'GriDesign'], ['Drawings', 'Plans, elevations, sections, 3D model, renders'], ['Tools', 'AutoCAD, SketchUp']],
      intro: [
        'During my internship at GriDesign, I worked on the renovation of a private house whose owners wanted a more contemporary facade.',
        'The proposal reworks the external envelope selectively, with updated masonry detailing across the key masses. It sharpens the elevations and gives the house a more modern presence while keeping the character of the original building. New sunroofs bring more daylight into the interior.',
      ],
      chapters: [
        {
          title: 'Existing and proposed',
          text: ['Updated masonry detailing across the key masses sharpens the rear elevation, where a new kitchen extension opens onto the garden. The proportions and character of the original house stay intact. Drag across the drawing to compare.'],
          media: [{ compare: ['res-elev-front-existing', 'res-elev-front-proposed'], cap: 'Rear elevation', w: 'full' }],
        },
        {
          title: 'Plan, elevation and section',
          text: ['Working in AutoCAD from the existing plans, I drew the ground floor plan, elevations and sections for the scheme, including the new sunroofs and the garden house at the end of the plot.'],
          media: [
            { src: 'res-plan-ground', cap: 'Ground floor plan', w: 'third', rows: 2, paper: true },
            { compare: ['res-elev-side-existing', 'res-elev-side-proposed'], cap: 'Side elevation', w: 'two' },
            { compare: ['res-section-existing', 'res-section-proposed'], cap: 'Section', w: 'two' },
          ],
        },
        {
          title: 'Garden house',
          text: ['A garden house was added as a secondary building on the site. It defines the site edge and extends the language of the main house into the landscape, so the house and its garden read as one composition.'],
          media: [
            { src: 'res-elev-rear-existing', cap: 'Front elevation, existing', w: 'half', paper: true },
            { src: 'res-garden-house', cap: 'Garden house elevation, proposed', w: 'half', paper: true },
          ],
        },
        {
          title: '3D model',
          text: [
            'For the client review, I built a SketchUp model of the proposal so the design could be understood in three dimensions rather than through drawings alone.',
            'It made the new roof profile, the material changes and the relationship between the house and the garden house much easier for the client to assess and approve.',
          ],
          media: [{ src: 'res-model', cap: 'SketchUp model of the proposal', w: 'full', paper: true }],
        },
        {
          title: 'Visualisation',
          text: ['A series of rendered views turns the drawings into a realistic picture of the house, so the new facade materials, roof changes and contemporary character read at a glance.'],
          media: [
            { src: 'res-render-front', cap: 'Front approach', w: 'full' },
            { src: 'res-render-rear', cap: 'Garden elevation', w: 'half', ar: '1592 / 989' },
            { src: 'res-render-pool', cap: 'Pool terrace', w: 'half' },
          ],
        },
        {
          title: 'No. 45 in 3D',
          text: ['Turn the house and its garden, switch between the existing house and the proposal, and pick out the new work in blue, the way my drawings mark it.'],
          media: [
            { model: 'terrace-house', w: 'full', fallback: 'res-plan-ground', label: '3D model of the terraced house at No. 45 with its rear extension, garden and garden house',
              cap: 'A simplified 3D model made for this website from my plan, elevations and section. Not to construction accuracy.' },
          ],
        },
      ],
    },
    {
      slug: 'interior-design', num: '02', icon: 'arch', tint: 'var(--tint-amber)',
      title: 'Interior Design', discipline: 'Interiors', year: '2026',
      cover: 'int-render-4', coverCap: 'Render of a bathroom with an arched opening', bg: 'int-render-3',
      summary: 'Bathrooms within wider residential interiors, each shaped around the client’s taste, practical needs and the character of the home.',
      meta: ['2026', 'Training placement', 'Dubai, UAE'],
      glance: [['Role', 'Interior design trainee'], ['Focus', 'Bathroom design'], ['Drawings', 'Plans, elevations A to D, renders']],
      intro: [
        'During a training placement in Dubai, I worked mainly on bathroom design within wider residential interior projects.',
        'Each scheme started from the client’s taste, practical needs and the character of the house, then worked through layout, fixture placement, materials and finishes. The aim was a room that works hard and still feels calm, and that belongs to the rest of the home.',
      ],
      chapters: [
        {
          title: 'Layout',
          text: ['Bathroom plans fix the position of every key element: sanitaryware, fittings and circulation. Settling the arrangement early meant each scheme was practical and resolved before any detailing began.'],
          media: [
            { src: 'int-plan', cap: 'Floor plan', w: 'half', paper: true, ar: '1 / 1' },
            { src: 'int-render-2', cap: 'Vanity wall', w: 'half', ar: '1 / 1' },
          ],
        },
        {
          title: 'Elevations',
          text: ['Elevations A to D set the heights and dimensions of every element: the walk-in shower and its niche, recessed shelving, the wall-hung WC, the floating vanity and an arched mirror with backlit LED lighting.'],
          media: [
            { src: 'int-elev-ab', cap: 'Elevations A and B', w: 'full', paper: true },
            { src: 'int-elev-cd', cap: 'Elevations C and D', w: 'full', paper: true },
          ],
        },
        {
          title: 'Renders',
          text: ['Renders of the elevations show the finished room: warm stone and tile, brushed-brass fittings, timber vanities and soft arches.'],
          media: [
            { src: 'int-render-1', cap: 'Shower and vanity', w: 'third' },
            { src: 'int-render-3', cap: 'Shelving and shower niche', w: 'third' },
            { src: 'int-render-4', cap: 'Arched opening', w: 'third' },
          ],
        },
        {
          title: 'The room in 3D',
          text: ['Turn the bathroom, or jump straight to elevations A to D as I drew them. The walls between you and the room fall away, like a section.'],
          media: [
            { model: 'bathroom', w: 'full', fallback: 'int-plan', label: '3D model of the bathroom with walk-in shower, wall-hung WC, recessed shelving, floating vanity and arched mirror',
              cap: 'A 3D model made for this website from my plan and elevations A to D. Finishes are approximate.' },
          ],
        },
      ],
    },
    {
      slug: 'landscape-architecture', num: '03', icon: 'tree', tint: 'var(--tint-green)',
      title: 'Landscape Architecture', discipline: 'Landscape and masterplanning', year: '2026',
      cover: 'land-render-2', coverCap: 'Aerial render of the proposed layout in the woodland', bg: 'land-render-1',
      summary: 'A feasibility study for a 7-hectare woodland in the Kent Green Belt. The brief asked for 20 to 30 homes. The site could take 4 to 7.',
      meta: ['2026', 'Training placement', 'Kent, UK'],
      glance: [['Role', 'Trainee, working with an architect'], ['Type', 'Feasibility study, masterplanning'], ['Drawings', 'Site analysis, AutoCAD layouts, sketch, renders'], ['Tools', 'AutoCAD, hand sketching']],
      figures: [
        { v: '7 ha', l: 'Woodland site in the Green Belt' },
        { v: '0.24 ha', l: 'Clearing free of trees' },
        { v: '4–7', l: 'Homes, at local plot sizes' },
        { v: '1', l: 'Access point, from Downs Road' },
      ],
      intro: [
        'During landscape architecture training with an architect, I worked on an early-stage masterplan in Kent for clients who had bought a 7-hectare site.',
        'The brief was to lay out 20 to 30 homes. Research and site analysis showed that only a small part of the land could actually be developed. That changed the direction of the project and called for a more realistic, site-led plan.',
      ],
      chapters: [
        {
          title: 'Reading the site',
          text: ['Satellite imagery and the OS MasterMap rights-of-way layer set the context: dense woodland edged by housing, with a public footpath crossing the land.'],
          media: [
            { src: 'land-satellite', cap: 'Satellite photograph of the site', w: 'half', ar: '1 / 1' },
            { src: 'land-os-prow', cap: 'OS MasterMap, public rights of way', w: 'half', ar: '1 / 1' },
          ],
        },
        {
          title: 'Constraints',
          text: [
            'I mapped every constraint on the land: trees protected by a Tree Preservation Order, the public footpath, the electricity wayleave and the covenants on the titles. I also checked the planning policy context to see whether building could be allowed at all.',
            'Only one grassland clearing, about 0.24 hectares, was free of trees and suitable for housing. Measured in AutoCAD and tested against plot sizes on the surrounding streets, it gave a starting figure of 4 to 7 homes. The rest of the woodland stays as a natural buffer and gives the Green Belt a clear, lasting edge.',
          ],
          legend: [
            ['#b0605c', 'Proposed development zone'], ['#d32f2f', 'Site border'], ['#6f9c7f', 'Retained woodland'],
            ['#8fd19e', 'Tree Preservation Order'], ['#2f80ed', 'Kent County Council PROW'], ['#e0409a', 'Proposed access point'],
          ],
          media: [
            { src: 'land-constraints', cap: 'Constraints map', w: 'half' },
            { src: 'land-cad-site', cap: 'AutoCAD drawing of the site', w: 'half', paper: true, ar: '1593 / 1411' },
          ],
        },
        {
          title: 'Access',
          text: [
            'The clearing sits behind two other plots, so access was the main design problem. I proposed a single access point from Downs Road, on the northern side of the frontage.',
            'From there a narrow road runs north through the woodland to the clearing. It keeps away from the protected beech trees, passes behind the neighbouring gardens rather than through them, and curves between retained trees to limit its impact.',
          ],
          media: [
            { src: 'land-cad-layout', cap: 'AutoCAD, access and layout', w: 'third', paper: true, ar: '1 / 1' },
            { src: 'land-cad-detail', cap: 'AutoCAD, housing layout', w: 'third', paper: true, ar: '1 / 1' },
            { src: 'land-sketch', cap: 'Hand-drawn sketch', w: 'third', paper: true, ar: '1 / 1' },
          ],
        },
        {
          title: 'Proposal',
          text: [
            'Because the footpath crosses the clearing, I recommended formally diverting it into a landscaped walk along the edge of the new housing, and a tree survey to confirm root zones before the road layout is fixed.',
            'AI-assisted renders in the feasibility report show the client the access road and a layout that respects every constraint.',
          ],
          media: [
            { src: 'land-render-2', cap: 'AI-assisted render, proposed layout', w: 'two', rows: 2 },
            { src: 'land-render-1', cap: 'Access road through the woodland', w: 'third' },
            { src: 'land-render-3', cap: 'Homes around the clearing', w: 'third' },
          ],
        },
        {
          title: 'The site in 3D',
          text: ['Turn the site, switch between the existing woodland and the proposal, and layer on each constraint to see how it shaped the plan: the protected trees, the public footpaths and the one clearing that could take housing.'],
          media: [
            { model: 'kent-site', w: 'full', fallback: 'land-constraints', label: '3D site model of the Kent woodland with the proposed housing in the clearing',
              cap: 'A schematic site model made for this website, traced from my constraints map. Positions are approximate, not survey-accurate.' },
          ],
        },
      ],
    },
    {
      slug: 'construction-studies', num: '04', icon: 'axo', tint: 'var(--tint-violet)',
      title: 'Construction Studies', discipline: 'Construction technology', year: '2023',
      cover: 'con-axo', coverPaper: true, coverCap: 'Axonometric hand drawing of the Railway Sleeper House', bg: 'con-axo',
      summary: 'Hand-drawn studies of two buildings defined by how they are built: Shin Takasuga’s Railway Sleeper House and Mies van der Rohe’s Crown Hall.',
      meta: ['2023', 'BSc Architecture, Year 1', 'University of Reading'],
      glance: [['Module', 'Construction Technology'], ['Case studies', 'Railway Sleeper House, Crown Hall'], ['Medium', 'Hand drawing']],
      intro: [
        'In my first year at the University of Reading I took Construction Technology, researching buildings from around the world through their materials, structural systems and construction methods.',
        'It taught me how much architectural form owes to building technique and material choice. Every drawing here is mine, drawn by hand. The two 3D models were made for this website to explain the structures.',
      ],
      chapters: [
        {
          title: 'Railway Sleeper House', kicker: 'Shin Takasuga',
          text: [
            'Built in the 1970s, the Railway Sleeper House reflects the independence Japanese architects were looking for at the time, joining traditional Japanese building with a contemporary look.',
            'Takasuga used untreated, reclaimed hardwood railway sleepers because of the budget, and construction took five years. What makes the house unique is not the timber but the use of one element for the whole structure: floors, columns, walls, roof and even the built-in furniture. Where the crossed and stacked sleepers overlap, they form a stable, balanced horizontal and vertical arrangement.',
          ],
          sources: 'Architecture H. (2018); Deplazes, A. (2004), p. 109.',
          media: [
            { src: 'con-axo', cap: 'Axonometric', w: 'half', paper: true, ar: '1 / 1' },
            { src: 'con-roof-plan', cap: 'Plan of roof void', w: 'half', paper: true, ar: '1 / 1' },
            { src: 'con-joint', cap: 'Construction joint detail', w: 'half', paper: true, ar: '4 / 3' },
            { src: 'con-beam-joint', cap: 'Column and beam timber joint', w: 'half', paper: true, ar: '4 / 3' },
            { model: 'sleeper', w: 'full', fallback: 'con-axo', label: '3D diagram of sleepers crossed and stacked into a column',
              cap: 'Crossing and stacking: a 3D diagram made for this website from my study. Add courses or pull them apart.' },
          ],
        },
        {
          title: 'Crown Hall', kicker: 'Ludwig Mies van der Rohe',
          text: [
            'Mies developed his constructional ideas from stereotomy, the art and craft of masonry construction. Building with beams, columns and load-bearing walls can be read throughout his drawings for the hall.',
            'Steel was chosen for its economy and strength, and paired with glass. Four steel frames stand 60 feet apart with a 20-foot overhang at each end, so the main floor stays one open space where students can move freely. Vertical mullions 3.05 m apart give the elevations their strong vertical rhythm.',
          ],
          sources: 'Stach, E. (2018), pp. 4–5; Garcia-Requejo, Z. (2021), p. 5.',
          media: [
            { src: 'con-crown-plan', cap: 'Plan', w: 'half', paper: true, ar: '3 / 2' },
            { src: 'con-crown-elev', cap: 'Elevations', w: 'half', paper: true, ar: '3 / 2' },
            { model: 'crown-hall', w: 'full', fallback: 'con-crown-plan', label: '3D massing model of Crown Hall',
              cap: 'Crown Hall in 3D, made for this website from my study. Switch layers to separate structure from envelope.' },
          ],
        },
        {
          title: 'Wall section', kicker: 'Crown Hall',
          text: ['The enclosure is translucent glass from the basement up to the main floor (2.36 m) and clear above, apart from the fully clear north and south entrances. Daylight comes in, the trees outside stay in view, and ventilation grilles in the lower fixed frames let air circulate.'],
          list: ['Steel angle cap', 'Gravel over roofing felt', 'Rigid insulation on steel deck', 'Sprayed insulation', 'Roof purlin', 'Mild steel fascia plate', 'Louvred ventilators with door', 'Concrete floor slab'],
          sources: 'Garcia-Requejo, Z. (2021), p. 5.',
          media: [
            { src: 'con-wall-section', cap: 'Section through external wall', w: 'half', paper: true, ar: '4 / 5' },
            { src: 'con-section-persp', cap: 'Sectional perspective through external wall', w: 'half', paper: true, ar: '4 / 5' },
          ],
        },
      ],
    },
  ];

  /* =========================================================
     HELPERS
     ========================================================= */

  const ICONS = {
    home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    mail: 'M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5zM3.5 6.5 12 13l8.5-6.5',
    download: 'M12 4v11M7 10.5l5 5 5-5M5 20h14',
    house: 'M3 21h18M5 21V9l7-5 7 5v12M8.5 12h2.5v2.5H8.5zM13 12h2.5v2.5H13zM10.5 21v-3.5h3V21',
    arch: 'M5 21V10a7 7 0 0 1 14 0v11M3 21h18M9 21v-9a3 3 0 0 1 6 0v9',
    tree: 'M12 21v-6M12 15c-4 0-7-2.5-7-6a7 7 0 0 1 14 0c0 3.5-3 6-7 6zM9 21h6',
    axo: 'M12 3 20 7.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12 4 7.5M12 12v9',
    chevL: 'M15 5l-7 7 7 7',
    chevR: 'M9 5l7 7-7 7',
    close: 'M6 6l12 12M18 6 6 18',
    copy: 'M9 9h10v11H9zM5 15V4h10',
    check: 'M5 12.5 10 17 19 7',
    drag: 'M9 7l-5 5 5 5M15 7l5 5-5 5',
    expand: 'M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7',
  };
  const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[n]}"/></svg>`;
  const src = (n) => `assets/img/${n}.jpg`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const nextFrame = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn));

  function pic(name, alt, { cls = '', lazy = true, zoom = true } = {}) {
    const [w, h] = IMG[name];
    return `<img src="${src(name)}" width="${w}" height="${h}" alt="${esc(alt)}"` +
      (lazy ? ' loading="lazy" decoding="async"' : '') +
      (zoom ? ` data-zoom data-cap="${esc(alt)}"` : '') +
      (cls ? ` class="${cls}"` : '') + ' draggable="false">';
  }

  function greeting() {
    const h = new Date().getHours();
    return h >= 5 && h < 12 ? 'Good morning.' : h >= 12 && h < 18 ? 'Good afternoon.' : 'Good evening.';
  }

  /* =========================================================
     VIEWS
     ========================================================= */

  const VIEWS = {
    home() {
      const rows = PROJECTS.map((p) => `
        <li><a class="index-row" href="#/work/${p.slug}" data-slug="${p.slug}" style="--tint:${p.tint}">
          <span class="index-num">${p.num}</span>
          <span class="index-thumb${p.coverPaper ? ' paper' : ''}">${pic(p.cover, '', { zoom: false })}</span>
          <span class="index-title">${p.title}</span>
          <span class="index-meta">${p.discipline}</span>
          <span class="index-year">${p.year}</span>
        </a></li>`).join('');
      return `
        <section class="intro-hero reveal">
          <p class="greeting">${greeting()}</p>
          <h1 class="t-display" tabindex="-1">${SITE.name}</h1>
          <p class="lede">Architecture graduate working across residential renovation, interiors and landscape masterplanning, between London and Dubai.</p>
          <div class="actions">
            <a class="btn btn--primary" href="#/work">View work</a>
            <a class="btn btn--glass" href="#/about">About me</a>
          </div>
          <p class="meta-line"><span>BSc Architecture, University of Reading</span><span>Based in Dubai</span><span>AutoCAD, Revit, SketchUp</span></p>
        </section>
        <div class="grid">
          <section class="window index-window reveal s8" style="--i:1">
            <div class="panel-head"><h2 class="t-title-3">Selected work</h2><a class="link-quiet" href="#/work">All projects ${icon('chevR')}</a></div>
            <ol class="index" id="index">${rows}</ol>
          </section>
          <section class="window panel reveal s4" style="--i:2">
            <div class="panel-head"><h2 class="t-title-3">Experience</h2><a class="link-quiet" href="#/about">More ${icon('chevR')}</a></div>
            <ul class="timeline compact">
              ${EXPERIENCE.map((e) => `<li><div class="tl-role">${e.role}</div><div class="tl-place">${e.place} · <span class="tabular">${e.date}</span></div></li>`).join('')}
            </ul>
          </section>
        </div>`;
    },

    work() {
      return `
        <section class="page-head reveal">
          <h1 class="t-title-1" tabindex="-1">Selected work</h1>
          <p class="lede">Four projects from 2023 to 2026, across practice, training and university.</p>
        </section>
        <div class="cards">${PROJECTS.map(card).join('')}</div>`;
    },

    project(p) {
      const n = PROJECTS.length;
      const k = PROJECTS.indexOf(p);
      const prev = PROJECTS[(k - 1 + n) % n];
      const next = PROJECTS[(k + 1) % n];
      const thumb = (q) => `<div class="thumb${q.coverPaper ? ' paper' : ''}">${pic(q.cover, '', { zoom: false })}</div>`;
      return `
        <section class="window proj-head reveal">
          <div class="proj-nav">
            <a class="pill pill--quiet" href="#/work">${icon('chevL')} All work</a>
            <span class="t-footnote ink-3 tabular">${p.num} / ${String(n).padStart(2, '0')}</span>
          </div>
          <p class="eyebrow">${p.discipline}</p>
          <h1 class="t-display" tabindex="-1">${p.title}</h1>
          <p class="lede">${p.summary}</p>
          <p class="meta-line">${p.meta.map((m) => `<span>${m}</span>`).join('')}</p>
        </section>
        <figure class="window hero-media reveal" style="--i:1">
          <div class="frame${p.coverPaper ? ' paper' : ''}">${pic(p.cover, p.coverCap, { lazy: false })}</div>
        </figure>
        ${p.figures ? `<section class="window figures reveal" aria-label="Key figures">${p.figures.map((f) => `<div><b>${f.v}</b><span>${f.l}</span></div>`).join('')}</section>` : ''}
        <div class="grid">
          <section class="window intro reveal s8">${p.intro.map((t) => `<p>${t}</p>`).join('')}</section>
          <aside class="window glance reveal s4" style="--i:1">
            <dl>${p.glance.map(([d, v]) => `<div><dt>${d}</dt><dd>${v}</dd></div>`).join('')}</dl>
          </aside>
        </div>
        ${p.chapters.map(chapter).join('')}
        <nav class="pager" aria-label="More projects">
          <a class="glass reveal" href="#/work/${prev.slug}">${thumb(prev)}<div><small>Previous</small><b>${prev.title}</b></div></a>
          <a class="glass reveal next" style="--i:1" href="#/work/${next.slug}"><div><small>Next</small><b>${next.title}</b></div>${thumb(next)}</a>
        </nav>`;
    },

    about() {
      return `
        <section class="page-head reveal">
          <h1 class="t-title-1" tabindex="-1">Hello, I’m Lara.</h1>
          <p class="lede">Architecture graduate from the University of Reading, based in Dubai, with experience in practice in the UK and the UAE.</p>
        </section>
        <div class="grid">
          <section class="window profile reveal s8">
            <div class="avatar" aria-hidden="true">LA</div>
            <div>
              <h2 class="t-title-2">${SITE.name}</h2>
              <p class="role">BSc Architecture, University of Reading</p>
              <p class="bio">I graduated in architecture from the University of Reading in 2025 and have since trained in practice in London, Dubai and Kent. I work across technical drawing, 3D modelling and visualisation, and use AutoCAD and Revit for precise documentation. I’m comfortable at any stage of a project, from concept to Building Control drawings, and I’m looking to keep growing within a strong team.</p>
              <div class="actions">
                <a class="btn btn--primary" href="${SITE.cv}" target="_blank" rel="noopener">${icon('download')} Download CV</a>
                <a class="btn btn--glass" href="#/contact">Contact</a>
              </div>
            </div>
          </section>
          <dl class="window facts reveal s4" style="--i:1">
            <div><dt>Based in</dt><dd>${SITE.location}</dd></div>
            <div><dt>Languages</dt><dd>English and Arabic, fluent</dd></div>
            <div><dt>Degree</dt><dd>BSc Architecture, 2025</dd></div>
            <div><dt>Certification</dt><dd>BIM, Revit Architecture 2026: Zero to Advanced. Amir Karami, 2025</dd></div>
          </dl>
          <section class="window about-block reveal s7">
            <div class="panel-head"><h2 class="t-title-3">Experience</h2></div>
            <ol class="timeline">
              ${EXPERIENCE.map((e) => `
                <li><div class="tl-date">${e.date}</div>
                  <div><div class="tl-role">${e.role}</div><div class="tl-place">${e.place}</div>
                    <ul class="tl-points">${e.points.map((t) => `<li>${t}</li>`).join('')}</ul></div></li>`).join('')}
            </ol>
          </section>
          <section class="window about-block reveal s5" style="--i:1">
            <div class="panel-head"><h2 class="t-title-3">Education</h2></div>
            <ol class="timeline">
              ${EDUCATION.map((e) => `<li><div class="tl-date">${e.date}</div><div><div class="tl-role">${e.title}</div><div class="tl-place">${e.place}</div></div></li>`).join('')}
            </ol>
          </section>
          <section class="window about-block reveal s12">
            <div class="panel-head"><h2 class="t-title-3">Skills</h2></div>
            <div class="skill-groups">
              ${SKILLS.map((g) => `<div><h3>${g.group}</h3><ul>${g.items.map((t) => `<li>${t}</li>`).join('')}</ul></div>`).join('')}
            </div>
          </section>
        </div>`;
    },

    contact() {
      return `
        <section class="window contact reveal">
          <p class="eyebrow">Contact</p>
          <h1 class="contact-email" tabindex="-1"><a href="mailto:${SITE.email}">${SITE.email.replace('@', '<wbr>@')}</a></h1>
          <p class="lede">For roles, collaborations or the full portfolio, email is the quickest way to reach me.</p>
          <div class="actions">
            <button type="button" class="btn btn--primary" data-copy><span class="btn-label">${icon('copy')} Copy email</span></button>
            <a class="btn btn--glass" href="${SITE.cv}" target="_blank" rel="noopener">${icon('download')} Download CV</a>
          </div>
          <p class="meta-line"><span>${SITE.location}</span><span>English and Arabic</span></p>
        </section>`;
    },
  };

  function card(p, i) {
    return `
      <a class="card glass reveal" style="--tint:${p.tint};--i:${i}" href="#/work/${p.slug}">
        <div class="card-media${p.coverPaper ? ' paper' : ''}">${pic(p.cover, p.coverCap, { zoom: false })}</div>
        <div class="card-body">
          <div class="card-top"><span class="dot"></span><span>${p.num} · ${p.discipline}</span><span class="year">${p.year}</span></div>
          <h2>${p.title}</h2>
          <p>${p.summary}</p>
        </div>
      </a>`;
  }

  function chapter(c, i) {
    const idx = String(i + 1).padStart(2, '0') + (c.kicker ? ` · ${c.kicker}` : '');
    return `
      <section class="window chapter reveal">
        <header class="chapter-head">
          <div><span class="chapter-idx">${idx}</span><h2 class="t-title-2">${c.title}</h2></div>
          <div class="chapter-text">
            ${c.text.map((t) => `<p>${t}</p>`).join('')}
            ${c.legend ? `<ul class="legend">${c.legend.map(([col, t]) => `<li><i style="background:${col}"></i>${t}</li>`).join('')}</ul>` : ''}
            ${c.list ? `<ol>${c.list.map((t) => `<li>${t}</li>`).join('')}</ol>` : ''}
            ${c.sources ? `<p class="sources">Sources: ${c.sources}</p>` : ''}
          </div>
        </header>
        <div class="media">${c.media.map(mediaItem).join('')}</div>
      </section>`;
  }

  function mediaItem(m) {
    const cls = `m-${m.w || 'full'}${m.rows ? ' r2' : ''}`;
    if (m.compare) return compareItem(m, cls);
    if (m.model) return modelItem(m, cls);
    const paper = m.paper ? ' paper' : '';
    const fixed = m.ar ? ` fixed" style="aspect-ratio:${m.ar}` : '';
    return `
      <figure class="${cls}">
        <div class="frame${paper}${fixed}">${pic(m.src, m.cap)}</div>
        ${m.cap ? `<figcaption>${m.cap}</figcaption>` : ''}
      </figure>`;
  }

  function compareItem(m, cls) {
    const [a, b] = m.compare;
    const ratio = Math.min(IMG[a][0] / IMG[a][1], IMG[b][0] / IMG[b][1]);
    return `
      <figure class="compare ${cls}">
        <div class="cmp" style="aspect-ratio:${ratio.toFixed(4)}">
          ${pic(a, `${m.cap}, existing`, { cls: 'cmp-a' })}
          ${pic(b, `${m.cap}, proposed`, { cls: 'cmp-b' })}
          <span class="cmp-tag a" aria-hidden="true">Existing</span>
          <span class="cmp-tag b" aria-hidden="true">Proposed</span>
          <div class="cmp-handle" role="slider" tabindex="0" aria-label="${esc(m.cap)}: existing to proposed" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
            <span class="cmp-knob">${icon('drag')}</span>
          </div>
        </div>
        <div class="cmp-bar">
          <figcaption>${m.cap}</figcaption>
          <div class="cmp-tools">
            <button type="button" class="link-quiet" data-to="100">Existing</button>
            <button type="button" class="link-quiet" data-to="0">Proposed</button>
            <button type="button" class="orb orb--sm glass-thin" data-expand aria-label="View ${esc(m.cap)} full screen">${icon('expand')}</button>
          </div>
        </div>
      </figure>`;
  }

  function modelItem(m, cls) {
    return `
      <figure class="viewer ${cls}" data-scene="${m.model}"${m.src ? ` data-src="${esc(m.src)}"` : ''}>
        <div class="viewer-stage" role="img" aria-label="${esc(m.label || m.cap)}">
          <div class="viewer-loading">Loading 3D model…</div>
          <div class="viewer-labels" aria-hidden="true"></div>
          <span class="viewer-hint glass-thin">${finePointer.matches ? 'Drag to turn' : 'Swipe sideways to turn'}</span>
          <div class="viewer-ui"></div>
          <div class="viewer-fallback" hidden>${pic(m.fallback, m.cap, { zoom: false })}</div>
        </div>
        <figcaption>${m.cap}</figcaption>
      </figure>`;
  }

  /* =========================================================
     CHROME: backdrop, tabs, dock
     ========================================================= */

  const view = $('#view');
  const tabs = $('#tabs');
  const dock = $('#dock');
  let bgFront = $('#bgA');
  let bgBack = $('#bgB');
  let bgName = '';

  // Dissolve
  function setBg(name) {
    if (name === bgName) return;
    bgName = name;
    const url = src(name);
    const im = new Image();
    im.onload = im.onerror = () => {
      if (bgName !== name) return;
      bgBack.style.backgroundImage = `url("${url}")`;
      bgBack.classList.toggle('drawing', name === 'con-axo');
      bgBack.classList.add('show');
      bgFront.classList.remove('show');
      [bgFront, bgBack] = [bgBack, bgFront];
    };
    im.src = url;
  }

  // Slide-follow: move an indicator under the active item
  function slide(ind, el) {
    if (!el) { ind.style.opacity = '0'; return; }
    ind.style.opacity = '1';
    ind.style.width = `${el.offsetWidth}px`;
    ind.style.translate = `${el.offsetLeft}px 0`;
  }
  function layoutTabs(animate) {
    if (!animate) tabs.classList.add('no-anim');
    slide($('.tab-ind', tabs), $('a[aria-current="page"]', tabs));
    if (!animate) nextFrame(() => tabs.classList.remove('no-anim'));
  }

  function buildDock() {
    const item = (href, key, ic, label) =>
      `<a href="${href}" data-key="${key}" aria-label="${esc(label)}">${icon(ic)}<span class="tip glass-thick" aria-hidden="true">${label}</span></a>`;
    dock.innerHTML =
      item('#/', 'home', 'home', 'Home') + '<hr>' +
      PROJECTS.map((p) => item(`#/work/${p.slug}`, p.slug, p.icon, p.title)).join('') + '<hr>' +
      item('#/contact', 'contact', 'mail', 'Contact');

    // Tooltips: the first waits 400ms; neighbours open instantly while the dock is "warm"
    let warmTimer, coolTimer;
    dock.addEventListener('pointerover', (e) => {
      if (!e.target.closest('a')) return;
      clearTimeout(coolTimer);
      if (!dock.classList.contains('warm')) warmTimer = setTimeout(() => dock.classList.add('warm'), 400);
    });
    dock.addEventListener('pointerleave', () => {
      clearTimeout(warmTimer);
      coolTimer = setTimeout(() => dock.classList.remove('warm'), 600);
    });
  }

  let firstChrome = true;
  function updateChrome(r) {
    const tab = r.name === 'project' ? 'work' : r.name;
    $$('a', tabs).forEach((a) => (a.dataset.tab === tab ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    const key = r.name === 'project' ? r.p.slug : r.name;
    $$('a', dock).forEach((a) => (a.dataset.key === key ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    $('#backBtn').hidden = r.name !== 'project';
    layoutTabs(!firstChrome && !reduced);
    firstChrome = false;
  }

  /* =========================================================
     ROUTER
     ========================================================= */

  function parse() {
    const [a, b] = location.hash.replace(/^#\/?/, '').split('/');
    if (a === 'work' && b) {
      const p = PROJECTS.find((x) => x.slug === b);
      return p ? { name: 'project', p } : { name: 'work' };
    }
    return ['work', 'about', 'contact'].includes(a) ? { name: a } : { name: 'home' };
  }

  let currentKey = '';
  let navToken = 0;

  async function route() {
    const r = parse();
    const key = r.name === 'project' ? r.p.slug : r.name;
    if (key === currentKey) return;
    const first = !currentKey;
    currentKey = key;
    const token = ++navToken;

    setBg(r.name === 'project' ? r.p.bg : BG[r.name]);
    updateChrome(r);
    hidePreview();

    // Exit is faster than the entrance that follows
    if (!first) {
      view.classList.add('leaving');
      await wait(reduced ? 0 : 160);
      if (token !== navToken) return;
    }
    teardown();
    view.innerHTML = VIEWS[r.name](r.p);
    view.classList.remove('leaving');
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.title = r.name === 'home' ? `${SITE.name} — Architecture`
      : `${r.name === 'project' ? r.p.title : r.name[0].toUpperCase() + r.name.slice(1)} — ${SITE.name}`;
    hydrate();
    if (!first) $('h1', view)?.focus({ preventScroll: true });
  }

  /* =========================================================
     PAGE BEHAVIOUR
     ========================================================= */

  const revealIO = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 })
    : null;

  function hydrate() {
    // Materialise, staggering only siblings that enter together
    $$('.reveal', view).forEach((el) => (revealIO ? revealIO.observe(el) : el.classList.add('in')));
    $$('.compare', view).forEach(initCompare);
    $$('.viewer', view).forEach((v) => (viewerIO ? viewerIO.observe(v) : mountViewer(v)));
    const index = $('#index', view);
    if (index) initPreview(index);
  }

  function teardown() {
    viewers.forEach((v) => v.dispose());
    viewers = [];
    viewerIO?.disconnect();
  }

  /* ---------- Cursor preview over the work index ---------- */

  const preview = $('#cursorPreview');
  preview.innerHTML = PROJECTS.map((p) =>
    `<img src="${src(p.cover)}" alt="" data-slug="${p.slug}" class="out${p.coverPaper ? ' paper' : ''}" loading="lazy">`).join('');
  // Critically damped spring (Apple: damping 1.0, response ~0.35s)
  const pv = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, on: false, raf: 0, last: 0, slug: '' };
  const K = (2 * Math.PI / 0.35) ** 2;
  const C = 2 * Math.sqrt(K);

  function pvTarget(e) {
    const w = preview.offsetWidth;
    const h = preview.offsetHeight;
    let x = e.clientX + 28;
    if (x + w > innerWidth - 16) x = e.clientX - w - 28;
    pv.tx = x;
    pv.ty = clamp(e.clientY - h / 2, 16, innerHeight - h - 16);
    preview.style.transformOrigin = x > e.clientX ? 'left center' : 'right center';
  }
  function pvTick(t) {
    const dt = Math.min(0.032, (t - pv.last) / 1000 || 0.016);
    pv.last = t;
    pv.vx += (K * (pv.tx - pv.x) - C * pv.vx) * dt;
    pv.vy += (K * (pv.ty - pv.y) - C * pv.vy) * dt;
    pv.x += pv.vx * dt;
    pv.y += pv.vy * dt;
    preview.style.transform = `translate3d(${pv.x}px, ${pv.y}px, 0)`;
    const settled = Math.abs(pv.tx - pv.x) < 0.3 && Math.abs(pv.ty - pv.y) < 0.3 && Math.abs(pv.vx) < 1 && Math.abs(pv.vy) < 1;
    pv.raf = settled ? 0 : requestAnimationFrame(pvTick);
  }
  function pvStart() { if (!pv.raf) { pv.last = performance.now(); pv.raf = requestAnimationFrame(pvTick); } }
  function pvShow(slug) {
    if (slug === pv.slug) return;
    pv.slug = slug;
    $$('img', preview).forEach((im) => im.classList.toggle('out', im.dataset.slug !== slug)); // Blur-swap
  }
  function hidePreview() { pv.on = false; preview.classList.remove('show'); }

  function initPreview(index) {
    index.addEventListener('pointermove', (e) => {
      if (!finePointer.matches || innerWidth <= 900) return;
      const row = e.target.closest('.index-row');
      if (!row) return;
      pvTarget(e);
      if (!pv.on) { // appear at the pointer, don't fly in from the corner
        pv.on = true;
        pv.x = pv.tx; pv.y = pv.ty; pv.vx = pv.vy = 0;
        preview.style.transform = `translate3d(${pv.x}px, ${pv.y}px, 0)`;
        preview.classList.add('show');
      }
      pvShow(row.dataset.slug);
      pvStart();
    });
    index.addEventListener('pointerleave', hidePreview);
  }
  window.addEventListener('scroll', () => { if (pv.on) hidePreview(); }, { passive: true });

  /* ---------- Compare slider (Reveal) ---------- */

  function initCompare(fig) {
    const cmp = $('.cmp', fig);
    const top = $('.cmp-b', cmp);
    const handle = $('.cmp-handle', cmp);
    let pos = 50;
    let drag = null;

    const set = (p, snap) => {
      pos = clamp(p, 0, 100);
      cmp.classList.toggle('snap', !!snap && !reduced);
      top.style.clipPath = `inset(0 0 0 ${pos}%)`;
      handle.style.translate = `${(pos / 100) * cmp.clientWidth}px 0`;
      handle.setAttribute('aria-valuenow', String(Math.round(pos)));
      handle.setAttribute('aria-valuetext', pos > 95 ? 'Existing' : pos < 5 ? 'Proposed' : `${Math.round(100 - pos)}% proposed`);
    };
    const fromX = (x) => {
      const r = cmp.getBoundingClientRect();
      return ((x - r.left) / r.width) * 100;
    };
    const grab = (e) => {
      drag.active = true;
      cmp.setPointerCapture(e.pointerId);
      cmp.classList.add('dragging');
    };

    cmp.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, active: false };
      // Mouse responds on press; touch waits to see if this is a scroll
      if (e.pointerType === 'mouse') { grab(e); set(fromX(e.clientX), false); }
    });
    cmp.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.active) {
        const dx = e.clientX - drag.x0;
        const dy = e.clientY - drag.y0;
        if (Math.hypot(dx, dy) < 8) return;
        if (Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
        grab(e);
      }
      set(fromX(e.clientX), false);
    });
    const end = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.active && e.type === 'pointerup') set(fromX(e.clientX), true); // a tap on touch
      drag = null;
      cmp.classList.remove('dragging');
    };
    cmp.addEventListener('pointerup', end);
    cmp.addEventListener('pointercancel', end);

    // Keyboard moves instantly (never animate keyboard-initiated changes)
    handle.addEventListener('keydown', (e) => {
      const steps = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageDown: -10, PageUp: 10 };
      if (e.key in steps) set(pos + steps[e.key], false);
      else if (e.key === 'Home') set(0, false);
      else if (e.key === 'End') set(100, false);
      else return;
      e.preventDefault();
    });
    $$('[data-to]', fig).forEach((b) => b.addEventListener('click', () => set(Number(b.dataset.to), true)));
    $('[data-expand]', fig).addEventListener('click', () => openLb(pos >= 50 ? $('.cmp-a', cmp) : top));

    fig.relayout = () => set(pos, false);
    set(50, false);
  }

  /* ---------- 3D viewers ---------- */

  let viewers = [];
  const viewerIO = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { viewerIO.unobserve(e.target); mountViewer(e.target); }
      });
    }, { rootMargin: '300px 0px' })
    : null;

  function viewerFallback(stage) {
    $('.viewer-fallback', stage).hidden = false;
    $('.viewer-loading', stage).classList.add('gone');
    $('.viewer-hint', stage).classList.add('gone');
  }

  function mountViewer(fig) {
    const stage = $('.viewer-stage', fig);
    import('./scenes.js')
      .then((m) => {
        if (!fig.isConnected) return;
        viewers.push(m.mount(stage, fig.dataset.scene, { reduced, src: fig.dataset.src, onFail: () => viewerFallback(stage) }));
      })
      .catch((err) => {
        console.warn('3D viewer unavailable:', err);
        if (fig.isConnected) viewerFallback(stage);
      });
  }

  /* ---------- Lightbox ---------- */

  const lb = $('#lightbox');
  const lbImg = $('#lbImg');
  const lbFig = $('#lbFigure');
  const lbDim = $('#lbDim');
  const lbStage = $('#lbStage');
  let gallery = [];
  let gi = 0;

  function renderLb() {
    const im = gallery[gi];
    lbImg.src = im.currentSrc || im.src;
    lbImg.alt = im.alt;
    $('#lbCap').textContent = im.dataset.cap || '';
    $('#lbCount').textContent = `${gi + 1} / ${gallery.length}`;
    lbFig.classList.toggle('paper', !!im.closest('.paper, .cmp'));
    $('#lbPrev').disabled = gi === 0;
    $('#lbNext').disabled = gi === gallery.length - 1;
  }
  function resetLb() {
    lbFig.style.transition = 'none';
    lbFig.style.transform = '';
    lbFig.style.opacity = '';
    lbDim.style.transition = '';
    lbDim.style.opacity = '';
  }
  function openLb(img) {
    gallery = $$('img[data-zoom]', view);
    gi = Math.max(0, gallery.indexOf(img));
    resetLb();
    renderLb();
    lb.classList.remove('closing');
    if (!lb.open) lb.showModal();
  }
  function closeLb() {
    if (!lb.open || lb.classList.contains('closing')) return;
    lb.classList.add('closing');
    lbDim.style.transition = `opacity ${reduced ? 0 : 160}ms ease-out`;
    lbDim.style.opacity = '0';
    setTimeout(() => { lb.close(); lb.classList.remove('closing'); resetLb(); }, reduced ? 0 : 160);
  }
  // Move to a neighbour: animated for pointer input, instant for keys
  function go(dir, animate) {
    const ni = gi + dir;
    if (ni < 0 || ni >= gallery.length) { snapBack(); return; }
    if (!animate || reduced) { gi = ni; renderLb(); resetLb(); return; }
    const w = lbStage.clientWidth;
    lbFig.style.transition = 'transform 180ms var(--ease-out), opacity 180ms ease';
    lbFig.style.transform = `translateX(${-dir * w * 0.4}px)`;
    lbFig.style.opacity = '0';
    setTimeout(() => {
      gi = ni;
      renderLb();
      lbFig.style.transition = 'none';
      lbFig.style.transform = `translateX(${dir * w * 0.2}px)`;
      nextFrame(() => {
        lbFig.style.transition = 'transform 300ms var(--ease-drawer), opacity 300ms var(--ease-out)';
        lbFig.style.transform = '';
        lbFig.style.opacity = '';
      });
    }, 180);
  }
  function snapBack() {
    lbFig.style.transition = 'transform 300ms var(--ease-drawer)';
    lbFig.style.transform = '';
    lbDim.style.transition = 'opacity 300ms ease';
    lbDim.style.opacity = '';
  }

  // Rubber-band: the further past the edge, the less it follows
  const rubber = (o, dim, c = 0.55) => (o * dim * c) / (dim + c * Math.abs(o));
  let d = null;
  lbStage.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    d = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, axis: null, onImg: e.target === lbImg, hist: [{ x: e.clientX, y: e.clientY, t: e.timeStamp }] };
    lbStage.setPointerCapture(e.pointerId);
    lbFig.style.transition = 'none';
    lbDim.style.transition = 'none';
  });
  lbStage.addEventListener('pointermove', (e) => {
    if (!d || e.pointerId !== d.id) return;
    d.dx = e.clientX - d.x0;
    d.dy = e.clientY - d.y0;
    d.hist.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
    if (d.hist.length > 6) d.hist.shift();
    if (!d.axis) {
      if (Math.hypot(d.dx, d.dy) < 8) return;
      d.axis = Math.abs(d.dx) > Math.abs(d.dy) ? 'x' : 'y';
    }
    if (d.axis === 'x') {
      const atEdge = (d.dx > 0 && gi === 0) || (d.dx < 0 && gi === gallery.length - 1);
      lbFig.style.transform = `translateX(${atEdge ? rubber(d.dx, lbStage.clientWidth) : d.dx}px)`;
    } else {
      const p = Math.min(Math.abs(d.dy) / 400, 1);
      lbFig.style.transform = `translateY(${d.dy}px) scale(${1 - p * 0.08})`;
      lbDim.style.opacity = String(1 - p * 0.7);
    }
  });
  const lbEnd = (e) => {
    if (!d || e.pointerId !== d.id) return;
    const g = d;
    d = null;
    if (!g.axis) { if (!g.onImg && e.type === 'pointerup') closeLb(); return; }
    const a = g.hist[0];
    const b = g.hist[g.hist.length - 1];
    const span = Math.max(1, b.t - a.t);
    const fresh = e.timeStamp - b.t < 80;
    const vx = fresh ? (b.x - a.x) / span : 0;
    const vy = fresh ? (b.y - a.y) / span : 0;
    if (g.axis === 'x') {
      const dir = g.dx < 0 ? 1 : -1;
      // Throw: a fast flick commits regardless of distance
      const commit = Math.abs(g.dx) > lbStage.clientWidth * 0.25 || (Math.abs(vx) > 0.11 && Math.sign(vx) === Math.sign(g.dx));
      commit ? go(dir, true) : snapBack();
    } else if (Math.abs(g.dy) > 120 || (Math.abs(vy) > 0.11 && Math.sign(vy) === Math.sign(g.dy))) {
      lbFig.style.transition = 'transform 240ms var(--ease-drawer), opacity 240ms ease';
      lbFig.style.transform = `translateY(${Math.sign(g.dy) * innerHeight * 0.5}px) scale(0.92)`;
      lbFig.style.opacity = '0';
      closeLb();
    } else {
      snapBack();
    }
  };
  lbStage.addEventListener('pointerup', lbEnd);
  lbStage.addEventListener('pointercancel', lbEnd);

  $('#lbClose').innerHTML = icon('close');
  $('#lbPrev').innerHTML = icon('chevL');
  $('#lbNext').innerHTML = icon('chevR');
  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', () => go(-1, true));
  $('#lbNext').addEventListener('click', () => go(1, true));
  lb.addEventListener('cancel', (e) => { e.preventDefault(); closeLb(); });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') go(1, false);
    if (e.key === 'ArrowLeft') go(-1, false);
  });

  /* ---------- Copy email ---------- */

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }
  async function copyEmail(btn) {
    const label = $('.btn-label', btn);
    try { await navigator.clipboard.writeText(SITE.email); }
    catch { toast(`Couldn’t copy. The address is ${SITE.email}`); return; }
    // Blur-swap the label to show the state change
    const swap = async (html) => {
      label.classList.add('swapping');
      await wait(reduced ? 0 : 120);
      label.innerHTML = html;
      label.classList.remove('swapping');
    };
    await swap(`${icon('check')} Copied`);
    clearTimeout(btn.resetTimer);
    btn.resetTimer = setTimeout(() => swap(`${icon('copy')} Copy email`), 1800);
  }

  view.addEventListener('click', (e) => {
    const copy = e.target.closest('[data-copy]');
    if (copy) { copyEmail(copy); return; }
    const img = e.target.closest('img[data-zoom]');
    if (img && !img.closest('.cmp')) openLb(img);
  });

  $('#toTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));

  /* =========================================================
     BOOT
     ========================================================= */

  $$('[data-icon]').forEach((el) => { el.innerHTML = icon(el.dataset.icon); });
  $('#backBtn').innerHTML = icon('chevL');
  $('#year').textContent = new Date().getFullYear();
  buildDock();
  window.addEventListener('hashchange', route);
  window.addEventListener('resize', () => {
    layoutTabs(false);
    $$('.compare', view).forEach((f) => f.relayout?.());
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => layoutTabs(false));
  route();

  // Warm the other backdrops once the first view has settled
  const warm = () => [...Object.values(BG), ...PROJECTS.map((p) => p.bg)].forEach((n) => { new Image().src = src(n); });
  'requestIdleCallback' in window ? requestIdleCallback(warm, { timeout: 3000 }) : setTimeout(warm, 2000);
})();
