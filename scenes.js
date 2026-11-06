/* 3D viewers for the portfolio (Vellum §7).
   Loaded on demand by app.js when a viewer scrolls near. Models are diagrams made for the site,
   built in metres. A SketchUp export can be shown with { model: 'glb', src: '…/model.glb' }. */
import * as THREE from 'three';

const FT = 0.3048;
const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rand = (n) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };
// Exponential approach: frame-rate independent ease-out toward a target
const approach = (v, target, dt, tau) => v + (target - v) * (1 - Math.exp(-dt / tau));

export function mount(stage, kind, opts = {}) {
  const build = BUILDERS[kind];
  if (!build) throw new Error(`Unknown scene: ${kind}`);
  return new Viewer(stage, build, opts);
}

/* =========================================================
   Viewer: renderer, orbit with inertia, labels, lifecycle
   ========================================================= */

class Viewer {
  constructor(stage, build, { reduced = false, src = '', onFail = () => {} } = {}) {
    this.stage = stage;
    this.reduced = reduced;
    this.onFail = onFail;
    this.ui = stage.querySelector('.viewer-ui');
    this.hint = stage.querySelector('.viewer-hint');
    this.labelLayer = stage.querySelector('.viewer-labels');

    // Throws when WebGL is unavailable; app.js shows the drawing instead
    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    stage.prepend(r.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 2000);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8f897f, 1.7));
    this.sun = new THREE.DirectionalLight(0xffffff, 2.3);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0005;
    this.sun.shadow.normalBias = 0.03;
    this.scene.add(this.sun, this.sun.target);
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ opacity: 0.24 }));
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    this.model = build({ viewer: this, src });
    this.scene.add(this.model.root);
    this.labels = (this.model.labels || []).map((l) => {
      const el = document.createElement('span');
      el.className = 'viewer-label hidden';
      el.textContent = l.text;
      this.labelLayer.append(el);
      return { ...l, el };
    });
    this.refit(this.model);

    // Turntable intro: ease 30° into the resting angle once, on first view
    this.vel = 0;
    this.tween = null;
    if (!reduced) {
      this.az = this.home.az + 0.52;
      this.tween = { from: { az: this.az, pol: this.pol }, to: { az: this.home.az, pol: this.home.pol }, t: 0, dur: 1400, ease: easeOutCubic };
    }

    this.frame = this.frame.bind(this);
    this.bind();
    this.observe();
    this.resize(); // size and draw now; don't wait for the observers' first callbacks
    stage.querySelector('.viewer-loading')?.classList.add('gone');
  }

  // Frame the camera and shadows around a model
  refit({ target, distance, azimuth, polar, size }) {
    this.target = target.clone();
    this.homeTarget = target.clone();
    this.home = { az: azimuth, pol: polar, dist: distance };
    this.az = azimuth;
    this.pol = polar;
    this.dist = distance;
    // Keep depth precision proportional to the model's scale (a site is ~100× a sleeper)
    this.camera.near = Math.max(0.05, distance / 300);
    this.camera.far = distance * 12;
    this.camera.updateProjectionMatrix();
    this.ground.scale.set(size * 6, size * 6, 1);
    this.sun.position.set(target.x + size * 0.7, size * 1.3, target.z + size * 0.9);
    this.sun.target.position.copy(target);
    const sc = this.sun.shadow.camera;
    sc.left = -size; sc.right = size; sc.top = size; sc.bottom = -size;
    sc.near = 0.1; sc.far = size * 5;
    sc.updateProjectionMatrix();
    this.invalidate();
  }

  fail() { this.onFail(); }

  bind() {
    const st = this.stage;
    this.onDown = (e) => {
      if (e.target.closest('.viewer-ui')) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const mouse = e.pointerType === 'mouse';
      this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, mouse, active: false, hist: [{ x: e.clientX, t: e.timeStamp }] };
      if (mouse) this.grab(e);
    };
    this.onMove = (e) => {
      const d = this.drag;
      if (!d || e.pointerId !== d.id) return;
      if (!d.active) {
        const dx = e.clientX - d.x0;
        const dy = e.clientY - d.y0;
        if (Math.hypot(dx, dy) < 8) return;
        if (Math.abs(dy) > Math.abs(dx)) { this.drag = null; return; } // vertical swipe scrolls the page
        this.grab(e);
      }
      this.az -= (e.clientX - d.x) * 0.008;
      if (d.mouse) this.pol = clamp(this.pol - (e.clientY - d.y) * 0.005, 0.3, 1.45);
      d.x = e.clientX;
      d.y = e.clientY;
      d.hist.push({ x: e.clientX, t: e.timeStamp });
      if (d.hist.length > 6) d.hist.shift();
      this.invalidate();
    };
    this.onUp = (e) => {
      const d = this.drag;
      if (!d || e.pointerId !== d.id) return;
      this.drag = null;
      st.classList.remove('dragging');
      if (!d.active) return;
      // Hand the release velocity to the inertia (radians per ms)
      const a = d.hist[0];
      const b = d.hist[d.hist.length - 1];
      const span = b.t - a.t;
      this.vel = span > 0 && e.timeStamp - b.t < 80 && !this.reduced ? (-(b.x - a.x) / span) * 0.008 : 0;
      this.invalidate();
    };
    st.addEventListener('pointerdown', this.onDown);
    st.addEventListener('pointermove', this.onMove);
    st.addEventListener('pointerup', this.onUp);
    st.addEventListener('pointercancel', this.onUp);
  }

  grab(e) {
    this.drag.active = true;
    this.stage.setPointerCapture(e.pointerId);
    this.stage.classList.add('dragging');
    this.tween = null; // interruptible: carry on from the current angle
    this.vel = 0;
    this.hint?.classList.add('gone');
    this.onGrab?.(); // e.g. a view preset no longer applies once the user turns the model
  }

  reset() {
    this.focus(this.homeTarget, this.home.dist, this.home.pol, this.home.az);
  }

  // Ease the camera to a new view (on-screen movement → ease-in-out); keeps the current turn if az is omitted
  focus(target, dist, pol, az) {
    this.vel = 0;
    const turn = Math.PI * 2;
    const toAz = az === undefined ? this.az : az + turn * Math.round((this.az - az) / turn); // shortest way round
    this.tween = {
      from: { az: this.az, pol: this.pol, dist: this.dist, target: this.target.clone() },
      to: { az: toAz, pol, dist, target: target.clone() },
      t: 0, dur: this.reduced ? 1 : 700, ease: easeInOutCubic,
    };
    this.invalidate();
  }

  observe() {
    this.visible = true;
    this.io = new IntersectionObserver(([en]) => {
      this.visible = en.isIntersecting;
      if (this.visible) this.invalidate();
      else if (this.raf) { cancelAnimationFrame(this.raf); this.raf = 0; }
    });
    this.io.observe(this.stage);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.stage);
  }

  // The canvas, not the stage: on phones the controls sit below the canvas inside the stage
  resize() {
    const w = this.renderer.domElement.clientWidth;
    const h = this.renderer.domElement.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.fit = Math.max(1, 1.3 / this.camera.aspect); // pull back on narrow screens
    this.camera.updateProjectionMatrix();
    this.invalidate();
  }

  invalidate() {
    if (!this.raf && this.visible) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    }
  }

  step(dt) {
    let active = false;
    if (this.tween) {
      const tw = this.tween;
      tw.t += dt;
      const k = Math.min(tw.t / tw.dur, 1);
      const e = tw.ease(k);
      this.az = tw.from.az + (tw.to.az - tw.from.az) * e;
      this.pol = tw.from.pol + (tw.to.pol - tw.from.pol) * e;
      if (tw.to.dist !== undefined) {
        this.dist = tw.from.dist + (tw.to.dist - tw.from.dist) * e;
        this.target.lerpVectors(tw.from.target, tw.to.target, e);
      }
      if (k < 1) active = true; else this.tween = null;
    } else if (!this.drag && Math.abs(this.vel) > 2e-6) {
      this.az += this.vel * dt;
      this.vel *= 0.996 ** dt; // momentum decays like a flicked scroll
      active = true;
    }
    if (this.model.update?.(dt)) active = true;
    return active;
  }

  frame(t) {
    this.raf = 0;
    const dt = Math.min(48, t - this.last);
    this.last = t;
    const active = this.step(dt);
    const s = Math.sin(this.pol);
    const dist = this.dist * (this.fit || 1);
    this.camera.position.set(
      this.target.x + dist * s * Math.sin(this.az),
      this.target.y + dist * Math.cos(this.pol),
      this.target.z + dist * s * Math.cos(this.az),
    );
    this.camera.lookAt(this.target);
    this.renderer.render(this.scene, this.camera);
    this.placeLabels();
    if (active && this.visible) this.raf = requestAnimationFrame(this.frame);
  }

  placeLabels() {
    const w = this.renderer.domElement.clientWidth;
    const h = this.renderer.domElement.clientHeight;
    const compact = w < 520; // small models keep only their key labels
    const v = new THREE.Vector3();
    const cam = this.camera.position;
    const occluders = this.model.occluders || [];
    const ray = new THREE.Ray();
    const hit = new THREE.Vector3();
    for (const l of this.labels) {
      const world = typeof l.pos === 'function' ? l.pos() : l.pos;
      v.copy(world).project(this.camera);
      let on = (!l.when || l.when()) && !(compact && l.minor) && v.z < 1 && Math.abs(v.x) < 0.95 && Math.abs(v.y) < 0.95;
      if (on && occluders.length) { // hide labels with a building between them and the camera
        const dist = cam.distanceTo(world);
        ray.set(cam, hit.copy(world).sub(cam).normalize());
        on = !occluders.some((b) => ray.intersectBox(b, hit) && cam.distanceTo(hit) < dist - 0.5);
      }
      const x = (v.x * 0.5 + 0.5) * w;
      l.width ||= l.el.offsetWidth; // text never changes, so measure once
      const fitsRight = x + l.width + 12 <= w;
      const fitsLeft = x - l.width - 12 >= 0;
      if (!fitsRight && !fitsLeft) on = false; // never spill out of the frame
      l.el.classList.toggle('hidden', !on);
      l.el.classList.toggle('flip', !fitsRight && fitsLeft); // read leftwards near the right edge
      l.el.style.translate = `${x}px ${(-v.y * 0.5 + 0.5) * h}px`;
    }
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.io.disconnect();
    this.ro.disconnect();
    const st = this.stage;
    st.removeEventListener('pointerdown', this.onDown);
    st.removeEventListener('pointermove', this.onMove);
    st.removeEventListener('pointerup', this.onUp);
    st.removeEventListener('pointercancel', this.onUp);
    this.scene.traverse((o) => {
      o.geometry?.dispose();
      const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      ms.forEach((m) => { m.map?.dispose(); m.dispose(); });
    });
    this.scene.environment?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
    this.labels.forEach((l) => l.el.remove());
    if (this.ui) this.ui.innerHTML = '';
  }
}

/* =========================================================
   UI pieces (Vellum controls)
   ========================================================= */

function el(tag, cls, html = '') {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  n.innerHTML = html;
  return n;
}

const ZOOM_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.8-4.8M8 10.5h5M10.5 8v5"/></svg>';
const RESET_ICON ='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5M4 4v4.5h4.5"/></svg>';

// Segmented control with a Slide-follow thumb
function segmented(label, options, initial, onChange) {
  const seg = el('div', 'seg no-anim');
  seg.setAttribute('role', 'group');
  seg.setAttribute('aria-label', label);
  const thumb = el('span', 'seg-thumb');
  thumb.setAttribute('aria-hidden', 'true');
  seg.append(thumb);
  const buttons = options.map(([value, text]) => {
    const b = el('button', '', text);
    b.type = 'button';
    b.dataset.value = value;
    b.setAttribute('aria-pressed', String(value === initial));
    b.addEventListener('click', () => select(value));
    seg.append(b);
    return b;
  });
  function layout() {
    const on = buttons.find((b) => b.getAttribute('aria-pressed') === 'true');
    thumb.style.opacity = on ? '1' : '0';
    if (!on || !seg.isConnected) return;
    thumb.style.width = `${on.offsetWidth}px`;
    thumb.style.translate = `${on.offsetLeft}px 0`;
  }
  function select(value) {
    seg.setValue(value);
    onChange(value);
  }
  // Set the pressed option without firing onChange; null clears it
  seg.setValue = (value) => {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === value)));
    layout();
  };
  requestAnimationFrame(() => { layout(); requestAnimationFrame(() => seg.classList.remove('no-anim')); });
  document.fonts?.ready.then(layout);
  window.addEventListener('resize', layout);
  return seg;
}

function resetButton(viewer) {
  const b = el('button', 'orb orb--sm', RESET_ICON);
  b.type = 'button';
  b.setAttribute('aria-label', 'Reset view');
  b.addEventListener('click', () => viewer.reset());
  return b;
}

function rangeControl(label, min, max, value, onInput) {
  const wrap = el('label', 'range glass-thin');
  const text = el('span', '', label);
  const input = el('input');
  Object.assign(input, { type: 'range', min, max, step: 1, value });
  const out = el('output', '', String(value));
  const paint = () => { input.style.setProperty('--fill', `${((input.value - min) / (max - min)) * 100}%`); out.textContent = input.value; };
  input.addEventListener('input', () => { paint(); onInput(Number(input.value)); });
  paint();
  wrap.append(text, input, out);
  return wrap;
}

function edges(mesh, mat) {
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), mat));
  return mesh;
}

/* =========================================================
   Crown Hall — Mies van der Rohe, IIT Chicago
   220 × 120 ft; four plate girders 60 ft apart with 20 ft
   overhangs; mullions every 10 ft (3.05 m); translucent glass
   to 2.36 m above the main floor, clear above.
   ========================================================= */

function crownHall({ viewer }) {
  const root = new THREE.Group();
  const L = 220 * FT;
  const W = 120 * FT;
  const floorY = 6 * FT; // main floor raised above the basement
  const roofY = floorY + 18 * FT;
  const roofT = 0.4;
  const girderD = 6 * FT;
  const topY = roofY + roofT + girderD;
  const frostedH = 2.36;
  const colZ = W / 2 + 0.7;
  const girderX = [0, 1, 2, 3].map((k) => -L / 2 + 20 * FT + k * 60 * FT);

  const mat = {
    steel: new THREE.MeshStandardMaterial({ color: 0x232327, roughness: 0.5, metalness: 0.35, transparent: true }),
    mullion: new THREE.MeshStandardMaterial({ color: 0x2b2b30, roughness: 0.5, metalness: 0.35, transparent: true }),
    slab: new THREE.MeshStandardMaterial({ color: 0xeceae5, roughness: 0.9, transparent: true }),
    stone: new THREE.MeshStandardMaterial({ color: 0xdcd5c6, roughness: 0.95 }),
    frosted: new THREE.MeshStandardMaterial({ color: 0xf3f5f5, roughness: 0.9, transparent: true, opacity: 0.85 }),
    clear: new THREE.MeshStandardMaterial({ color: 0x9fbccd, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.26, depthWrite: false }),
  };
  const line = new THREE.LineBasicMaterial({ color: 0x1d1d1f, transparent: true, opacity: 0.28 });

  const box = (w, h, d, m, x, y, z, { cast = true, outline = false } = {}) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    if (outline) edges(mesh, line);
    root.add(mesh);
    return mesh;
  };

  // Base: basement band, main floor, entrance platform and steps
  box(L - 0.8, floorY, W - 0.8, mat.frosted, 0, floorY / 2, 0, { cast: false });
  box(L, 0.3, W, mat.slab, 0, floorY - 0.15, 0, { outline: true });
  const zP0 = W / 2 + 1.3;
  const zP1 = zP0 + 12 * FT;
  box(30 * FT, 0.25, zP1 - zP0, mat.stone, 0, 0.82, (zP0 + zP1) / 2, { outline: true });
  for (let i = 1; i <= 3; i++) box(30 * FT, 0.95 - i * 0.31, 0.45, mat.stone, 0, (0.95 - i * 0.31) / 2, zP1 + (i - 0.5) * 0.45);
  for (let j = 1; j <= 3; j++) box(20 * FT, 0.95 + j * 0.29, 0.42, mat.stone, 0, (0.95 + j * 0.29) / 2, zP0 - (j - 0.5) * 0.42, { cast: false });

  // Envelope: translucent lower glass, clear upper glass, mullions and transoms
  const walls = [[L, 0.04, 0, W / 2], [L, 0.04, 0, -W / 2], [0.04, W, L / 2, 0], [0.04, W, -L / 2, 0]];
  for (const [w, d, x, z] of walls) {
    box(w, frostedH, d, mat.frosted, x, floorY + frostedH / 2, z, { cast: false });
    box(w, roofY - floorY - frostedH, d, mat.clear, x, floorY + frostedH + (roofY - floorY - frostedH) / 2, z, { cast: false });
    box(w > 1 ? w : 0.16, 0.1, d > 1 ? d : 0.16, mat.mullion, x, floorY + frostedH, z); // transom
  }
  for (let i = 0; i <= 22; i++) {
    const x = -L / 2 + i * 10 * FT;
    for (const z of [W / 2, -W / 2]) box(0.1, roofY, 0.22, mat.mullion, x, roofY / 2, z);
  }
  for (let j = 1; j < 12; j++) {
    const z = -W / 2 + j * 10 * FT;
    for (const x of [L / 2, -L / 2]) box(0.22, roofY, 0.1, mat.mullion, x, roofY / 2, z);
  }

  // Structure: roof hung from four plate girders on eight columns outside the glass
  box(L, roofT, W, mat.slab, 0, roofY + roofT / 2, 0, { outline: true });
  for (const x of girderX) {
    box(0.6, girderD, colZ * 2 + 0.5, mat.steel, x, roofY + roofT + girderD / 2, 0);
    for (const z of [colZ, -colZ]) box(0.45, topY, 0.45, mat.steel, x, topY / 2, z);
  }

  // Layers fade between states (≈300ms ease-out)
  const LAYERS = {
    building: { steel: 1, mullion: 1, slab: 1, frosted: 0.85, clear: 0.26 },
    structure: { steel: 1, mullion: 0.06, slab: 1, frosted: 0.05, clear: 0.02 },
    envelope: { steel: 0.12, mullion: 1, slab: 0.22, frosted: 0.92, clear: 0.34 },
  };
  let mode = 'building';
  const fading = ['steel', 'mullion', 'slab', 'frosted', 'clear'];
  const update = (dt) => {
    let active = false;
    for (const k of fading) {
      const m = mat[k];
      const target = LAYERS[mode][k];
      m.opacity = viewer.reduced ? target : approach(m.opacity, target, dt, 90);
      if (Math.abs(m.opacity - target) > 0.004) active = true;
      if (k !== 'clear') m.depthWrite = m.opacity > 0.98;
      m.visible = m.opacity > 0.01;
    }
    return active;
  };

  const ui = el('div', 'group glass-thin');
  ui.append(segmented('Layers', [['building', 'Building'], ['structure', 'Structure'], ['envelope', 'Envelope']], mode, (v) => { mode = v; viewer.invalidate(); }), resetButton(viewer));
  viewer.ui.append(ui);

  const is = (m) => () => mode === m;
  return {
    root,
    update,
    target: new THREE.Vector3(0, 4.2, 0),
    distance: 98,
    azimuth: 0.62,
    polar: 1.16,
    size: 48,
    labels: [
      { text: 'Plate girder', pos: new THREE.Vector3(girderX[2], topY + 0.4, -W / 4), when: is('structure') },
      { text: '60 ft bay', pos: new THREE.Vector3(0, roofY + roofT + 0.1, W / 2), when: is('structure') },
      { text: '20 ft overhang', pos: new THREE.Vector3(L / 2 - 10 * FT, roofY + roofT, W / 2), when: is('structure') },
      { text: 'Columns outside the glass', pos: new THREE.Vector3(girderX[0], topY * 0.45, colZ), when: is('structure') },
      { text: 'Mullions every 3.05 m', pos: new THREE.Vector3(L / 4, floorY + 4.2, W / 2 + 0.15), when: is('envelope') },
      { text: 'Translucent to 2.36 m', pos: new THREE.Vector3(-L / 4, floorY + 1.2, W / 2 + 0.1), when: is('envelope') },
      { text: 'Clear above', pos: new THREE.Vector3(-L / 4, floorY + 4.2, W / 2 + 0.1), when: is('envelope') },
    ],
  };
}

/* =========================================================
   Railway Sleeper House — the stacking principle
   One element, crossed and stacked: each course turns 90°
   and the ends project past every crossing.
   ========================================================= */

function woodTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#d8d2c8';
  g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 70; i++) {
    g.strokeStyle = `rgba(40, 26, 16, ${0.05 + rand(i) * 0.16})`;
    g.lineWidth = 0.6 + rand(i + 99) * 2.2;
    const y = rand(i + 7) * c.height;
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= c.width; x += 32) g.lineTo(x, y + Math.sin(x / 60 + i) * 1.6);
    g.stroke();
  }
  for (let i = 0; i < 6; i++) { // checks and splits in old sleepers
    g.fillStyle = 'rgba(30, 20, 12, 0.35)';
    g.fillRect(rand(i + 300) * c.width, rand(i + 400) * c.height, 40 + rand(i) * 90, 1.4);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function sleeperStack({ viewer }) {
  const root = new THREE.Group();
  const SL = 2.1; // sleeper length (m)
  const SH = 0.14; // height
  const SW = 0.22; // width
  const OFF = 0.8; // centre-line offset of each pair
  const MAX = 16;
  const geo = new THREE.BoxGeometry(SL, SH, SW);
  const edgeGeo = new THREE.EdgesGeometry(geo);
  const grain = woodTexture();

  const sleepers = [];
  for (let i = 0; i < MAX; i++) {
    for (let k = 0; k < 2; k++) {
      const m = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x957459).multiplyScalar(0.8 + rand(i * 2 + k) * 0.34),
        map: grain, roughness: 0.95, transparent: true, opacity: 0,
      });
      const mesh = new THREE.Mesh(geo, m);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.add(new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0x1a120c, transparent: true, opacity: 0 })));
      const side = k ? 1 : -1;
      if (i % 2 === 0) mesh.position.set(0, 0, side * OFF);
      else { mesh.rotation.y = Math.PI / 2; mesh.position.set(side * OFF, 0, 0); }
      mesh.rotation.y += (rand(i * 7 + k) - 0.5) * 0.035; // hand-laid, not machine-perfect
      mesh.visible = false;
      root.add(mesh);
      sleepers.push({ mesh, course: i, y: 2, alpha: 0, shown: false, delay: 0 });
    }
  }

  let courses = 0;
  let want = 10;
  let exploded = false;
  let gap = 0;
  const restY = (course) => SH / 2 + course * (SH + gap);

  const update = (dt) => {
    let active = false;
    const g = exploded ? 0.12 : 0;
    gap = viewer.reduced ? g : approach(gap, g, dt, 110);
    if (Math.abs(gap - g) > 0.0005) active = true;
    // Keep the whole stack in frame as it grows or pulls apart
    const h = restY(Math.max(0, want - 1)) + SH / 2;
    const ty = Math.max(0.6, h * 0.5);
    const td = Math.max(5.6, 3.4 + h * 1.5);
    viewer.target.y = viewer.reduced ? ty : approach(viewer.target.y, ty, dt, 140);
    viewer.dist = viewer.reduced ? td : approach(viewer.dist, td, dt, 140);
    viewer.homeTarget.y = ty; // so Reset returns to the current framing
    viewer.home.dist = td;
    if (Math.abs(viewer.target.y - ty) > 0.002 || Math.abs(viewer.dist - td) > 0.005) active = true;
    if (courses !== want) { // stagger new courses 40ms apart; removals are immediate (exits are faster)
      const adding = want > courses;
      sleepers.forEach((s, n) => {
        const on = s.course < want;
        if (on && !s.shown) { s.shown = true; s.delay = adding && !viewer.reduced ? (s.course - courses) * 80 + (n % 2) * 40 : 0; s.y = restY(s.course) + 0.9; }
        if (!on && s.shown) s.shown = false;
      });
      courses = want;
    }
    for (const s of sleepers) {
      const rest = restY(s.course);
      if (s.shown) {
        if (s.delay > 0) { s.delay -= dt; active = true; continue; }
        s.alpha = viewer.reduced ? 1 : Math.min(1, s.alpha + dt / 160);
        s.y = viewer.reduced ? rest : approach(s.y, rest, dt, 70);
      } else {
        s.alpha = viewer.reduced ? 0 : Math.max(0, s.alpha - dt / 120);
        s.y = approach(s.y, rest + 0.3, dt, 70);
      }
      if (Math.abs(s.y - rest) > 0.001 || (s.shown ? s.alpha < 1 : s.alpha > 0)) active = true;
      s.mesh.position.y = s.y;
      s.mesh.material.opacity = s.alpha;
      s.mesh.material.depthWrite = s.alpha > 0.98;
      s.mesh.children[0].material.opacity = s.alpha * 0.4;
      s.mesh.visible = s.alpha > 0.01;
    }
    return active;
  };

  const ui = el('div', 'group glass-thin');
  ui.append(
    segmented('View', [['stacked', 'Stacked'], ['exploded', 'Exploded']], 'stacked', (v) => { exploded = v === 'exploded'; viewer.invalidate(); }),
    resetButton(viewer),
  );
  viewer.ui.append(rangeControl('Courses', 1, MAX, want, (n) => { want = n; viewer.invalidate(); }), ui);

  const topEven = () => (want - 1) - ((want - 1) % 2);
  const midOdd = () => Math.max(1, Math.floor(want / 2) | 1);
  return {
    root,
    update,
    target: new THREE.Vector3(0, 0.8, 0),
    distance: 6.4,
    azimuth: 0.78,
    polar: 1.08,
    size: 4,
    labels: [
      // Both sit on faces turned towards the default camera
      { text: 'Ends project past each crossing', pos: () => new THREE.Vector3(SL / 2 - 0.04, restY(topEven()) + SH / 2, OFF) },
      { text: 'Each course turns 90°', pos: () => new THREE.Vector3(OFF, restY(midOdd()), SL / 2 - 0.04), when: () => want > 2 },
    ],
  };
}

/* =========================================================
   Kent site — schematic site model
   Traced from Lara's constraints map (pixel coordinates below),
   scaled so the site comes to about 7 ha. Not survey-accurate.
   ========================================================= */

const PX = 0.2465; // metres per pixel of land-constraints.jpg
const toM = (pts) => pts.map(([x, y]) => [(x - 850) * PX, (y - 700) * PX]);

const KENT = {
  site: toM([[632, 228], [1398, 18], [1440, 1248], [395, 1358], [270, 945], [268, 680], [636, 600]]),
  zone: toM([[748, 212], [1105, 112], [1118, 200], [1140, 408], [905, 455], [790, 300]]),
  tpo: toM([[290, 988], [440, 965], [560, 962], [700, 955], [800, 930], [900, 915], [1000, 895], [1130, 860], [1250, 840], [1420, 820],
    [1420, 1005], [1380, 1030], [1200, 1040], [1100, 1050], [1050, 1080], [950, 1080], [830, 1095], [760, 1135], [640, 1120], [480, 1110], [330, 1140]]),
  downsRoad: toM([[238, 0], [245, 300], [252, 650], [250, 700], [262, 830], [270, 945], [395, 1358], [410, 1411]]),
  prow: toM([[598, 0], [700, 170], [760, 280], [850, 450], [960, 640], [1100, 880], [1360, 1250], [1470, 1411]]),
  pathExisting: toM([[740, 235], [800, 282], [880, 280], [960, 318], [1050, 380], [1105, 420], [1140, 475], [1142, 640], [1140, 860], [1165, 960]]),
  pathDiverted: toM([[740, 235], [760, 196], [880, 160], [1000, 126], [1110, 100], [1140, 150], [1152, 270], [1158, 400], [1145, 475], [1142, 640], [1140, 860], [1165, 960]]),
  access: toM([[272, 722], [420, 708], [560, 694], [640, 676], [690, 632], [706, 560], [714, 470], [730, 395], [770, 345], [830, 322], [1000, 292]]),
  spine: toM([[1005, 150], [1012, 300], [1022, 440]]),
  accessPoint: toM([[282, 722]])[0],
  // Woodland and gardens outside the site (context)
  woods: [
    toM([[1400, 0], [1593, 0], [1593, 1411], [1450, 1411], [1440, 1248]]),
    toM([[700, 0], [1400, 0], [1398, 18], [700, 205]]),
    toM([[0, 880], [242, 872], [270, 945], [395, 1358], [410, 1411], [0, 1411]]),
  ],
  gardens: [
    toM([[0, 0], [228, 0], [238, 870], [0, 880]]),
    toM([[262, 230], [632, 228], [636, 600], [266, 680]]),
    toM([[262, 0], [598, 0], [690, 150], [632, 228], [262, 230]]),
  ],
  field: toM([[410, 1366], [1440, 1252], [1593, 1240], [1593, 1411], [410, 1411]]),
  // Neighbouring houses: [x px, y px, length m, depth m, rotation°]
  context: [[90, 140, 30, 11, -12], [50, 295, 22, 10, -10], [75, 410, 12, 26, -8], [85, 570, 12, 26, -8], [80, 745, 12, 38, -5], [170, 1100, 10, 22, -5],
    [440, 300, 12, 22, 3], [440, 430, 12, 22, 3], [445, 560, 12, 22, 3], [510, 185, 18, 14, -5], [390, 92, 22, 12, -8], [375, 30, 18, 12, -8],
    [850, 30, 22, 10, -15], [805, 115, 9, 18, -10], [960, 1365, 14, 24, -5]],
  // Proposed homes: [x px, y px, length m, depth m, units] — semis run north–south
  homes: [[845, 255, 12, 9, 1], [930, 232, 12, 9, 1], [915, 382, 11, 10, 1], [1060, 195, 7.5, 10, 2], [1080, 340, 7.5, 10, 2]],
};

const inPoly = ([x, z], poly) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
};
const distToLine = ([x, z], pts) => {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1];
    const [bx, bz] = pts[i];
    const dx = bx - ax;
    const dz = bz - az;
    const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1);
    best = Math.min(best, Math.hypot(x - (ax + t * dx), z - (az + t * dz)));
  }
  return best;
};
const smooth = (pts, n = 120) => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal')
  .getSpacedPoints(n).map((v) => [v.x, v.z]);

// Flat strip(s) along polylines, merged into one geometry
function ribbonGeo(lines, width, y) {
  const pos = [];
  const idx = [];
  for (const pts of lines) {
    const base = pos.length / 3;
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(pts.length - 1, i + 1)];
      const tx = b[0] - a[0];
      const tz = b[1] - a[1];
      const l = Math.hypot(tx, tz) || 1;
      const nx = (-tz / l) * (width / 2);
      const nz = (tx / l) * (width / 2);
      pos.push(p[0] + nx, y, p[1] + nz, p[0] - nx, y, p[1] - nz);
      if (i) { const k = base + (i - 1) * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } // counter-clockwise from above
    });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
// Split a polyline into dashes of a given length and gap (metres)
function dashes(pts, dash, gap) {
  const out = [];
  let cur = [pts[0]];
  let run = 0;
  let on = true;
  for (let i = 1; i < pts.length; i++) {
    let [ax, az] = pts[i - 1];
    const [bx, bz] = pts[i];
    let seg = Math.hypot(bx - ax, bz - az);
    while (seg > 0) {
      const left = (on ? dash : gap) - run;
      if (seg < left) { run += seg; if (on) cur.push([bx, bz]); seg = 0; } else {
        const t = left / seg;
        const px = ax + (bx - ax) * t;
        const pz = az + (bz - az) * t;
        if (on) { cur.push([px, pz]); out.push(cur); } else cur = [[px, pz]];
        on = !on; run = 0; ax = px; az = pz; seg -= left;
      }
    }
  }
  if (on && cur.length > 1) out.push(cur);
  return out;
}
function fillGeo(poly, y) {
  const shape = new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ShapeGeometry(shape);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}
const centroid = (poly) => poly.reduce((a, [x, z]) => [a[0] + x / poly.length, a[1] + z / poly.length], [0, 0]);

// A gabled house: length along local x, ridge along x
function houseGeo(len, dep, eave, ridge) {
  const body = new THREE.BoxGeometry(len, eave, dep);
  body.translate(0, eave / 2, 0);
  const tri = new THREE.Shape([new THREE.Vector2(-dep / 2 - 0.3, 0), new THREE.Vector2(dep / 2 + 0.3, 0), new THREE.Vector2(0, ridge - eave)]);
  const roof = new THREE.ExtrudeGeometry(tri, { depth: len + 0.6, bevelEnabled: false });
  roof.translate(0, 0, -(len + 0.6) / 2);
  roof.rotateY(Math.PI / 2);
  roof.translate(0, eave, 0);
  return { body, roof };
}

function layerChips(label, defs, state, onToggle) {
  const wrap = el('div', 'chips glass-thin');
  wrap.setAttribute('role', 'group');
  wrap.setAttribute('aria-label', label);
  for (const [key, text, color] of defs) {
    const b = el('button', 'layer-chip', `<i style="background:${color}" aria-hidden="true"></i>${text}`);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(state[key]));
    b.addEventListener('click', () => {
      const on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(on));
      onToggle(key, on);
    });
    wrap.append(b);
  }
  return wrap;
}

function kentSite({ viewer }) {
  viewer.ground.visible = false; // the plinth carries the shadows
  const root = new THREE.Group();
  const ROT = 15 * (Math.PI / 180); // the plot grid runs ~15° off north
  const xs = [-850 * PX, (1593 - 850) * PX];
  const zs = [-700 * PX, (1411 - 700) * PX];
  const W = xs[1] - xs[0];
  const D = zs[1] - zs[0];
  const cx = (xs[0] + xs[1]) / 2;
  const cz = (zs[0] + zs[1]) / 2;

  // Plinth, like a physical site model
  const top = new THREE.MeshStandardMaterial({ color: 0xe9e6de, roughness: 0.95 });
  const side = new THREE.MeshStandardMaterial({ color: 0xcfcac0, roughness: 0.95 });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(W, 5, D), [side, side, top, side, side, side]);
  plinth.position.set(cx, -2.5, cz);
  plinth.receiveShadow = true;
  root.add(plinth);

  const flat = (geo, color, { opacity = 1, offset = -1 } = {}) => {
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.95, transparent: opacity < 1, opacity, polygonOffset: true, polygonOffsetFactor: offset, polygonOffsetUnits: offset }));
    m.receiveShadow = true;
    root.add(m);
    return m;
  };
  flat(fillGeo(KENT.field, 0.02), 0xdfe2cc);
  flat(fillGeo(KENT.zone, 0.03), 0xd3dbb4, { offset: -2 }); // the clearing: open grassland
  flat(ribbonGeo([smooth(KENT.downsRoad, 80)], 7, 0.05), 0xb3aea5, { offset: -3 });

  // Proposal: access road, internal road, gardens
  const prop = [];
  const accessPts = smooth(KENT.access, 140);
  const roads = flat(ribbonGeo([accessPts, smooth(KENT.spine, 30)], 5.5, 0.06), 0x9e9a92, { opacity: 0.999, offset: -4 });
  prop.push(roads.material);

  // Houses
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf7f6f2, roughness: 0.85 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x3f4147, roughness: 0.8 });
  const ctxBody = new THREE.MeshStandardMaterial({ color: 0xeeebe5, roughness: 0.9 });
  const ctxRoof = new THREE.MeshStandardMaterial({ color: 0xcdc8be, roughness: 0.9 });
  const line = new THREE.LineBasicMaterial({ color: 0x1d1d1f, transparent: true, opacity: 0.22 });
  const footprints = [];
  const placeHouse = (x, z, len, dep, rot, bm, rm, eave = 5.4, ridge = 9) => {
    const g = new THREE.Group();
    const { body, roof } = houseGeo(len, dep, eave, ridge);
    for (const [geo, mat] of [[body, bm], [roof, rm]]) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      edges(mesh, line);
      g.add(mesh);
    }
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    root.add(g);
    footprints.push([x, z, Math.max(len, dep) / 2 + 3]);
    return g;
  };
  for (const [px, py, len, dep, deg] of KENT.context) {
    const [x, z] = toM([[px, py]])[0];
    placeHouse(x, z, len, dep, -deg * (Math.PI / 180), ctxBody, ctxRoof, 5, 8);
  }
  const homes = [];
  const gardenGeos = [];
  for (const [px, py, len, dep, units] of KENT.homes) {
    const [x, z] = toM([[px, py]])[0];
    const rot = units === 2 ? ROT + Math.PI / 2 : ROT; // semis: ridge north–south
    const ax = [Math.cos(rot), -Math.sin(rot)]; // local x in plan
    for (let u = 0; u < units; u++) {
      const o = units === 2 ? (u - 0.5) * len : 0;
      homes.push(placeHouse(x + ax[0] * o, z + ax[1] * o, len, dep, rot, bodyMat, roofMat));
    }
    // Garden plot around each building
    const gl = len * units + 12;
    const gd = dep + 16;
    const az = [Math.sin(rot), Math.cos(rot)];
    gardenGeos.push(fillGeo([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [x + ax[0] * a * gl / 2 + az[0] * b * gd / 2, z + ax[1] * a * gl / 2 + az[1] * b * gd / 2]), 0.045));
  }
  for (const g of gardenGeos) prop.push(flat(g, 0xc6d4a6, { opacity: 0.999, offset: -3 }).material);

  // Access point pin
  const pinMat = new THREE.MeshStandardMaterial({ color: 0xe0409a, roughness: 0.5, transparent: true });
  const pin = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 20, 8), pinMat);
  pole.position.y = 10;
  const head = new THREE.Mesh(new THREE.SphereGeometry(2.4, 20, 14), pinMat);
  head.position.y = 21;
  pin.add(pole, head);
  pin.position.set(KENT.accessPoint[0], 0, KENT.accessPoint[1]);
  pin.children.forEach((c) => { c.castShadow = true; });
  root.add(pin);
  prop.push(pinMat);

  // Woodland: jittered grid, kept out of the clearing, roads, footpath and houses
  const trees = [];
  const step = 7.4;
  let n = 0;
  for (let gx = xs[0] + 3; gx < xs[1] - 3; gx += step) {
    for (let gz = zs[0] + 3; gz < zs[1] - 3; gz += step) {
      n++;
      const p = [gx + (rand(n * 1.7) - 0.5) * step * 0.9, gz + (rand(n * 2.3) - 0.5) * step * 0.9];
      let kind;
      if (inPoly(p, KENT.site)) {
        if (inPoly(p, KENT.zone) || distToLine(p, KENT.prow) < 3) continue;
        kind = 'site';
      } else if (KENT.woods.some((w) => inPoly(p, w))) kind = 'ctx';
      else if (KENT.gardens.some((g) => inPoly(p, g)) && rand(n * 3.9) < 0.2) kind = 'garden';
      else continue;
      if (distToLine(p, KENT.downsRoad) < 7 || footprints.some(([hx, hz, r]) => Math.hypot(p[0] - hx, p[1] - hz) < r)) continue;
      const r = kind === 'garden' ? 2.2 + rand(n * 5.1) * 1.2 : 3.2 + rand(n * 5.1) * 1.9;
      trees.push({
        x: p[0], z: p[1], r, h: r * 1.15 + (kind === 'garden' ? 3 : 4.5 + rand(n * 6.7) * 3), kind,
        tpo: kind === 'site' && inPoly(p, KENT.tpo),
        road: kind === 'site' && distToLine(p, accessPts) < r + 3,
      });
    }
  }
  const canopy = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), trees.length);
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.32, 1, 5), new THREE.MeshStandardMaterial({ color: 0x8a7a68, roughness: 1 }), trees.length);
  canopy.castShadow = canopy.receiveShadow = trunks.castShadow = true;
  const BASE = { site: new THREE.Color(0x6f9a6b), ctx: new THREE.Color(0xb3c2ad), garden: new THREE.Color(0xa9bca2) };
  const TPO_HI = new THREE.Color(0x24864a);
  const mtx = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const v = new THREE.Vector3();
  const sc = new THREE.Vector3();
  const tint = new THREE.Color();
  const setTree = (i, k) => {
    const t = trees[i];
    const s = Math.max(k, 0.0001);
    sc.set(t.r * s, t.r * 0.85 * s, t.r * s);
    mtx.compose(v.set(t.x, t.h * s, t.z), q, sc);
    canopy.setMatrixAt(i, mtx);
    sc.set(s, Math.max(0.01, t.h - t.r * 0.6) * s, s);
    mtx.compose(v.set(t.x, (t.h - t.r * 0.6) * s / 2, t.z), q, sc);
    trunks.setMatrixAt(i, mtx);
  };
  trees.forEach((t, i) => {
    tint.copy(BASE[t.kind]).multiplyScalar(0.88 + rand(i * 9.1) * 0.24);
    t.color = tint.clone();
    canopy.setColorAt(i, t.color);
    setTree(i, 1);
  });
  root.add(canopy, trunks);
  const roadTrees = trees.map((t, i) => (t.road ? i : -1)).filter((i) => i >= 0);
  const tpoTrees = trees.map((t, i) => (t.tpo ? i : -1)).filter((i) => i >= 0);

  // Constraint layers: drawn over the canopy so they read like the map
  const overlay = (geo, color, opacity, { depth = false, order = 10 } = {}) => {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthTest: depth, depthWrite: false, polygonOffset: depth, polygonOffsetFactor: -5, polygonOffsetUnits: -5 }));
    m.renderOrder = order;
    m.userData.max = opacity;
    root.add(m);
    return m;
  };
  const L = {
    boundary: [overlay(ribbonGeo([[...KENT.site, KENT.site[0]]], 2.6, 0.4), 0xd32f2f, 0.95)],
    tpo: [overlay(fillGeo(KENT.tpo, 0.35), 0x2fae5f, 0.3, { order: 9 }), overlay(ribbonGeo(dashes([...KENT.tpo, KENT.tpo[0]], 5, 4), 1.4, 0.4), 0x2fae5f, 0.95)],
    footpath: [overlay(ribbonGeo([smooth(KENT.prow, 80)], 3, 0.45), 0x2f80ed, 0.95)],
    zone: [overlay(fillGeo(KENT.zone, 0.07), 0xb0605c, 0.4, { depth: true })],
  };
  const pathOld = overlay(ribbonGeo(dashes(smooth(KENT.pathExisting, 90), 5, 3.5), 2.2, 0.45), 0x5aa0ff, 0.95);
  const pathNew = overlay(ribbonGeo(dashes(smooth(KENT.pathDiverted, 110), 5, 3.5), 2.2, 0.45), 0x5aa0ff, 0.95);

  // State: Existing ↔ Proposal, plus four toggleable layers
  let mode = 'proposal';
  const want = { boundary: true, tpo: false, footpath: true, zone: false };
  const cur = { prop: 1, boundary: 0, tpo: 0, footpath: 0, zone: 0 };
  let applied = null;
  const ease = (from, to, dt, tau) => (viewer.reduced ? to : approach(from, to, dt, tau));

  const update = (dt) => {
    const first = !applied;
    cur.prop = first ? 1 : ease(cur.prop, mode === 'proposal' ? 1 : 0, dt, 170);
    for (const k of Object.keys(want)) cur[k] = ease(cur[k], want[k] ? 1 : 0, dt, 90);
    const p = cur.prop;

    // Houses rise in sequence (explanatory, so slower than UI motion)
    homes.forEach((h, i) => {
      const k = easeOutCubic(clamp(p * 1.5 - i * 0.07, 0, 1));
      h.scale.set(1, Math.max(k, 0.001), 1);
      h.visible = k > 0.002;
    });
    prop.forEach((m) => { m.opacity = p; m.visible = p > 0.01; m.depthWrite = p > 0.98; });
    pin.scale.setScalar(Math.max(p, 0.001));
    pin.visible = p > 0.01;
    if (!applied || Math.abs(applied.prop - p) > 1e-4) {
      roadTrees.forEach((i) => setTree(i, 1 - p));
      canopy.instanceMatrix.needsUpdate = true;
      trunks.instanceMatrix.needsUpdate = true;
    }
    if (!applied || Math.abs(applied.tpo - cur.tpo) > 1e-4) {
      tpoTrees.forEach((i) => canopy.setColorAt(i, tint.copy(trees[i].color).lerp(TPO_HI, cur.tpo)));
      canopy.instanceColor.needsUpdate = true;
    }
    for (const [k, meshes] of Object.entries(L)) meshes.forEach((m) => { m.material.opacity = m.userData.max * cur[k]; m.visible = cur[k] > 0.01; });
    pathOld.material.opacity = pathOld.userData.max * cur.footpath * (1 - p);
    pathNew.material.opacity = pathNew.userData.max * cur.footpath * p;
    pathOld.visible = pathOld.material.opacity > 0.01;
    pathNew.visible = pathNew.material.opacity > 0.01;
    applied = { ...cur };

    const target = mode === 'proposal' ? 1 : 0;
    return Math.abs(p - target) > 0.002 || Object.keys(want).some((k) => Math.abs(cur[k] - (want[k] ? 1 : 0)) > 0.004);
  };

  const left = layerChips('Constraint layers', [
    ['boundary', 'Site boundary', '#d32f2f'],
    ['tpo', 'Protected trees', '#2fae5f'],
    ['footpath', 'Footpaths', '#2f80ed'],
    ['zone', 'Development zone', '#b0605c'],
  ], want, (k, on) => { want[k] = on; viewer.invalidate(); });
  const zc = centroid(KENT.zone);
  // Zoom toggle: whole site ↔ the clearing (no wheel zoom, it would trap page scrolling)
  const zoom = el('button', 'orb orb--sm', ZOOM_ICON);
  zoom.type = 'button';
  zoom.setAttribute('aria-label', 'Zoom to the clearing');
  zoom.setAttribute('aria-pressed', 'false');
  zoom.addEventListener('click', () => {
    const on = zoom.getAttribute('aria-pressed') !== 'true';
    zoom.setAttribute('aria-pressed', String(on));
    if (on) viewer.focus(new THREE.Vector3(zc[0] + 8, 0, zc[1] + 10), 230, 0.86);
    else viewer.focus(viewer.homeTarget, viewer.home.dist, viewer.home.pol);
  });
  const reset = resetButton(viewer);
  reset.addEventListener('click', () => zoom.setAttribute('aria-pressed', 'false'));
  const right = el('div', 'group glass-thin');
  right.append(segmented('Scheme', [['existing', 'Existing'], ['proposal', 'Proposal']], mode, (m) => { mode = m; viewer.invalidate(); }), zoom, reset);
  viewer.ui.append(left, right);

  const at = (px, y) => { const [x, z] = toM([px])[0]; return new THREE.Vector3(x, y, z); };
  const tc = centroid(KENT.tpo);
  const is = (m) => () => mode === m;
  return {
    root,
    update,
    target: new THREE.Vector3(-6, 0, -6),
    distance: 700,
    azimuth: 0.3,
    polar: 0.72,
    size: 215,
    labels: [
      { text: 'North', pos: new THREE.Vector3(0, 1, zs[0] + 4), minor: true },
      { text: 'Downs Road', pos: at([250, 470], 1), minor: true },
      { text: 'Access from Downs Road', pos: () => new THREE.Vector3(KENT.accessPoint[0], 24, KENT.accessPoint[1]), when: is('proposal'), minor: true },
      { text: 'The only clearing free of trees', pos: new THREE.Vector3(zc[0], 1, zc[1]), when: is('existing') },
      { text: 'Seven proposed homes', pos: new THREE.Vector3(zc[0] + 6, 12, zc[1] + 4), when: is('proposal') },
      { text: 'Protected trees (TPO)', pos: new THREE.Vector3(tc[0], 15, tc[1]), when: () => want.tpo },
      { text: 'Public footpath', pos: at([985, 690], 1), when: () => want.footpath, minor: true },
      { text: 'Diverted footpath', pos: at([1150, 560], 1), when: () => want.footpath && mode === 'proposal', minor: true },
      { text: 'Footpath across the clearing', pos: at([1140, 560], 1), when: () => want.footpath && mode === 'existing', minor: true },
      { text: 'Retained woodland', pos: at([1250, 1150], 14), minor: true },
    ],
  };
}

/* =========================================================
   Shared material helpers for the building models
   ========================================================= */

// A repeating canvas texture; size is the real-world size (m) one canvas covers
function canvasTex(px, [w, h], draw) {
  const c = document.createElement('canvas');
  c.width = px[0];
  c.height = px[1];
  draw(c.getContext('2d'), c.width, c.height);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / w, 1 / h);
  t.anisotropy = 4;
  return t;
}
const jitter = (rgb, k, n) => `rgb(${rgb.map((v) => Math.round(clamp(v + (rand(n) - 0.5) * k, 0, 255))).join(',')})`;

// Rescale a box's UVs to metres so tiled textures keep their real size on every face
function boxGeo(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0], uv.getY(k) * dims[f][1]); }
  return g;
}
function addBox(parent, [w, h, d], mat, [x, y, z], { cast = true, rotY = 0 } = {}) {
  const m = new THREE.Mesh(boxGeo(w, h, d), mat);
  m.position.set(x, y, z);
  m.rotation.y = rotY;
  m.castShadow = cast;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
// A flat quad facing +z (rotate to place); UVs in metres
function planeGeo(w, h) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * w, uv.getY(k) * h);
  return g;
}

/* =========================================================
   Bathroom — Interior Design, Dubai
   From Lara's plan and elevations A–D: a 2,000 × 2,350 mm room,
   2,600 mm high. x runs from wall D (0) to wall B (2.0);
   z runs from wall A (0, the shower) to wall C (2.35, the arch).
   ========================================================= */

function bathroom({ viewer }) {
  viewer.ground.visible = false;
  const root = new THREE.Group();
  const RW = 2.0;
  const RD = 2.35;
  const RH = 2.6;
  const DUCT = 0.18; // service boxing along wall D
  const TILE_TO = 1.2;
  const SHOWER = 0.915;
  const T = 0.1; // wall thickness

  // Textures, drawn once
  const tileTex = canvasTex([512, 512], [0.3, 0.6], (g, w, h) => {
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
      const n = r * 4 + c;
      const grd = g.createLinearGradient(0, r * h / 2, 0, (r + 1) * h / 2);
      grd.addColorStop(0, jitter([241, 232, 217], 14, n));
      grd.addColorStop(1, jitter([233, 222, 205], 14, n + 50));
      g.fillStyle = grd;
      g.fillRect(c * w / 4, r * h / 2, w / 4, h / 2);
    }
    g.strokeStyle = '#dccdb7';
    g.lineWidth = 3;
    for (let c = 0; c <= 4; c++) { g.beginPath(); g.moveTo(c * w / 4, 0); g.lineTo(c * w / 4, h); g.stroke(); }
    for (let r = 0; r <= 2; r++) { g.beginPath(); g.moveTo(0, r * h / 2); g.lineTo(w, r * h / 2); g.stroke(); }
  });
  const marbleTex = (tile) => canvasTex([512, 512], [tile * 2, tile * 2], (g, w, h) => {
    g.fillStyle = '#ece2d2';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      g.strokeStyle = `rgba(${150 + rand(i) * 40}, ${120 + rand(i + 3) * 30}, ${90 + rand(i + 5) * 30}, ${0.08 + rand(i + 9) * 0.18})`;
      g.lineWidth = 0.6 + rand(i + 11) * 2.4;
      g.beginPath();
      let x = rand(i + 13) * w;
      let y = 0;
      g.moveTo(x, y);
      while (y < h) { x += (rand(x + y + i) - 0.5) * 60; y += 30 + rand(y + i) * 40; g.lineTo(x, y); }
      g.stroke();
    }
    g.strokeStyle = 'rgba(190, 170, 145, 0.7)';
    g.lineWidth = 2;
    g.strokeRect(1, 1, w / 2 - 2, h / 2 - 2);
    g.strokeRect(w / 2 + 1, 1, w / 2 - 2, h / 2 - 2);
    g.strokeRect(1, h / 2 + 1, w / 2 - 2, h / 2 - 2);
    g.strokeRect(w / 2 + 1, h / 2 + 1, w / 2 - 2, h / 2 - 2);
  });
  const floorTex = marbleTex(0.6);
  const stoneTex = marbleTex(1.2);
  const walnutTex = canvasTex([512, 128], [0.9, 0.3], (g, w, h) => {
    g.fillStyle = '#7b5135';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      g.strokeStyle = `rgba(${40 + rand(i) * 30}, ${22 + rand(i + 1) * 15}, 10, ${0.1 + rand(i + 2) * 0.25})`;
      g.lineWidth = 0.5 + rand(i + 3) * 1.5;
      const y = rand(i + 4) * h;
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x / 70 + i) * 3);
      g.stroke();
    }
  });
  const mirrorTex = canvasTex([256, 512], [0.7, 1.06], (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, '#f2f4f5');
    grd.addColorStop(0.55, '#c9cfd2');
    grd.addColorStop(1, '#9ea6ab');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
  });
  mirrorTex.wrapS = mirrorTex.wrapT = THREE.ClampToEdgeWrapping;

  // Every wall group gets its own materials so it can fade on its own
  const makeMats = () => ({
    plaster: new THREE.MeshStandardMaterial({ color: 0xf4efe7, roughness: 0.95 }),
    tile: new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.45 }),
    stone: new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.3 }),
    walnut: new THREE.MeshStandardMaterial({ map: walnutTex, roughness: 0.6 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc9a467, metalness: 0.85, roughness: 0.32 }),
    ceramic: new THREE.MeshStandardMaterial({ color: 0xfbfbf8, roughness: 0.22 }),
    poche: new THREE.MeshStandardMaterial({ color: 0x35312d, roughness: 1 }),
    mirror: new THREE.MeshStandardMaterial({ map: mirrorTex, metalness: 0.25, roughness: 0.12 }),
    glow: new THREE.MeshBasicMaterial({ color: 0xfff1d6 }),
  });
  const groups = {};
  const wallGroup = (key, normal, centre) => {
    const g = new THREE.Group();
    const mats = makeMats();
    groups[key] = { g, mats, normal: new THREE.Vector3(...normal), centre: new THREE.Vector3(...centre), o: 1, show: true };
    root.add(g);
    return { g, m: mats };
  };
  // A thin finish layer (tile or plaster) on a wall face; plane faces +z before rotation
  const skin = (parent, mat, w, h, pos, rotY) => {
    const m = new THREE.Mesh(planeGeo(w, h), mat);
    m.position.set(...pos);
    m.rotation.y = rotY;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const cap = (parent, m, w, d, x, z) => addBox(parent, [w, 0.012, d], m.poche, [x, RH + 0.006, z], { cast: false }); // section cut

  // ---- Wall A (north): the shower's back wall, tiled full height
  {
    const { g, m } = wallGroup('A', [0, 0, -1], [RW / 2, RH / 2, 0]);
    addBox(g, [RW + 2 * T, RH, T], m.plaster, [RW / 2, RH / 2, -T / 2]);
    cap(g, m, RW + 2 * T, T, RW / 2, -T / 2);
    skin(g, m.tile, RW - DUCT, RH, [DUCT + (RW - DUCT) / 2, RH / 2, 0.002], 0);
  }

  // ---- Wall B (east): vanity, arched mirror with backlit LED
  const vz = 1.614; // vanity centre, from elevation B
  {
    const { g, m } = wallGroup('B', [1, 0, 0], [RW, RH / 2, RD / 2]);
    addBox(g, [T, RH, RD], m.plaster, [RW + T / 2, RH / 2, RD / 2]);
    cap(g, m, T, RD, RW + T / 2, RD / 2);
    skin(g, m.tile, SHOWER, RH, [RW - 0.002, RH / 2, SHOWER / 2], -Math.PI / 2);
    skin(g, m.tile, RD - SHOWER, TILE_TO, [RW - 0.002, TILE_TO / 2, SHOWER + (RD - SHOWER) / 2], -Math.PI / 2);
    // Floating vanity: body 430–735, stone top to 760, vessel basin to 900
    addBox(g, [0.5, 0.305, 0.9], m.walnut, [RW - 0.25, 0.5825, vz]);
    addBox(g, [0.52, 0.025, 0.92], m.stone, [RW - 0.26, 0.7475, vz]);
    addBox(g, [0.012, 0.012, 0.42], m.brass, [RW - 0.505, 0.69, vz], { cast: false });
    const bowl = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.09, 0.005], [0.17, 0.04], [0.205, 0.1], [0.21, 0.14], [0.2, 0.14], [0.195, 0.1], [0.16, 0.045], [0.08, 0.018], [0, 0.015]].map(([r, y]) => new THREE.Vector2(r, y)), 40), m.ceramic);
    bowl.position.set(RW - 0.27, 0.76, vz);
    bowl.castShadow = true;
    g.add(bowl);
    // Tall brass mixer and spout
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.3, 16), m.brass);
    stem.position.set(RW - 0.06, 0.91, vz);
    const spout = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[RW - 0.06, 1.05], [RW - 0.07, 1.08], [RW - 0.13, 1.08], [RW - 0.2, 1.05]].map(([x, y]) => new THREE.Vector3(x, y, vz))), 20, 0.01, 10), m.brass);
    const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.08, 8), m.brass);
    lever.rotation.z = Math.PI / 2.4;
    lever.position.set(RW - 0.04, 0.98, vz + 0.025);
    g.add(stem, spout, lever);
    // Arched mirror 700 wide, 1,410–2,470, brass frame, LED halo behind
    const arch = (w, h, r = w / 2) => {
      const s = new THREE.Shape();
      s.moveTo(-w / 2, 0);
      s.lineTo(w / 2, 0);
      s.lineTo(w / 2, h - r);
      s.absarc(0, h - r, r, 0, Math.PI, false);
      s.lineTo(-w / 2, 0);
      return s;
    };
    const place = (mesh, x) => { mesh.position.set(x, 1.41, vz); mesh.rotation.y = -Math.PI / 2; g.add(mesh); return mesh; };
    const halo = place(new THREE.Mesh(new THREE.ShapeGeometry(arch(0.76, 1.1)), m.glow), RW - 0.004);
    halo.position.y = 1.39;
    const frame = arch(0.72, 1.07);
    frame.holes.push(arch(0.68, 1.05));
    place(new THREE.Mesh(new THREE.ExtrudeGeometry(frame, { depth: 0.02, bevelEnabled: false }), m.brass), RW - 0.03);
    const glassGeo = new THREE.ShapeGeometry(arch(0.68, 1.05));
    const uv = glassGeo.attributes.uv;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, (uv.getX(k) + 0.34) / 0.68, uv.getY(k) / 1.05);
    place(new THREE.Mesh(glassGeo, m.mirror), RW - 0.022);
  }

  // ---- Wall C (south): arched opening 800 wide, 2,250 high
  {
    const { g, m } = wallGroup('C', [0, 0, 1], [RW / 2, RH / 2, RD]);
    const ax0 = RW - 0.65 - 0.8;
    const ax1 = RW - 0.65;
    const ar = 0.4;
    const s = new THREE.Shape();
    s.moveTo(-T, 0);
    s.lineTo(ax0, 0);
    s.lineTo(ax0, 2.25 - ar);
    s.absarc((ax0 + ax1) / 2, 2.25 - ar, ar, Math.PI, 0, true);
    s.lineTo(ax1, 0);
    s.lineTo(RW + T, 0);
    s.lineTo(RW + T, RH);
    s.lineTo(-T, RH);
    s.lineTo(-T, 0);
    const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false }), m.plaster);
    wall.position.z = RD;
    wall.castShadow = wall.receiveShadow = true;
    g.add(wall);
    cap(g, m, RW + 2 * T, T, RW / 2, RD + T / 2);
    skin(g, m.tile, ax0 - DUCT, TILE_TO, [(DUCT + ax0) / 2, TILE_TO / 2, RD - 0.002], Math.PI);
    skin(g, m.tile, RW - ax1, TILE_TO, [(ax1 + RW) / 2, TILE_TO / 2, RD - 0.002], Math.PI);
    addBox(g, [0.8, 0.012, T], m.stone, [(ax0 + ax1) / 2, 0.006, RD + T / 2], { cast: false }); // threshold
  }

  // ---- Wall D (west): service boxing with shower niche and shelving, WC on a framed panel
  {
    const { g, m } = wallGroup('D', [-1, 0, 0], [0, RH / 2, RD / 2]);
    addBox(g, [T, RH, RD], m.plaster, [-T / 2, RH / 2, RD / 2]);
    cap(g, m, T + DUCT, RD, (DUCT - T) / 2, RD / 2);
    const NICHE = { z0: 0.142, z1: 0.772, y0: 1.2, y1: 1.55, d: 0.12 }; // shower niche
    const SHELF = { z0: 1.975, z1: 2.175, y0: 0.16, y1: 2.44, d: 0.15 }; // recessed shelving
    const rect = (z0, z1, y0, y1) => { const p = new THREE.Path(); p.moveTo(z0, y0); p.lineTo(z1, y0); p.lineTo(z1, y1); p.lineTo(z0, y1); p.lineTo(z0, y0); return p; };
    // Boxing face in (z, y), extruded back towards the wall, with two recesses cut through
    const face = new THREE.Shape();
    face.moveTo(0, 0); face.lineTo(RD, 0); face.lineTo(RD, RH); face.lineTo(0, RH); face.lineTo(0, 0);
    face.holes.push(rect(NICHE.z0, NICHE.z1, NICHE.y0, NICHE.y1), rect(SHELF.z0, SHELF.z1, SHELF.y0, SHELF.y1));
    const boxGeom = new THREE.ExtrudeGeometry(face, { depth: DUCT, bevelEnabled: false });
    boxGeom.rotateY(-Math.PI / 2);
    boxGeom.translate(DUCT, 0, 0);
    const duct = new THREE.Mesh(boxGeom, m.plaster);
    duct.castShadow = duct.receiveShadow = true;
    g.add(duct);
    // Tile skin across the shower zone, with the niche left open. Drawn in (−z, y) so that
    // rotating +90° about y lands it on world z and faces it into the room (+x).
    const tileFace = new THREE.Shape();
    tileFace.moveTo(-SHOWER, 0); tileFace.lineTo(0, 0); tileFace.lineTo(0, RH); tileFace.lineTo(-SHOWER, RH); tileFace.lineTo(-SHOWER, 0);
    tileFace.holes.push(rect(-NICHE.z1, -NICHE.z0, NICHE.y0, NICHE.y1));
    const ts = new THREE.Mesh(new THREE.ShapeGeometry(tileFace).rotateY(Math.PI / 2), m.tile);
    ts.position.x = DUCT + 0.002;
    ts.receiveShadow = true;
    g.add(ts);
    // Recess backs
    addBox(g, [0.01, NICHE.y1 - NICHE.y0, NICHE.z1 - NICHE.z0], m.stone, [DUCT - NICHE.d, (NICHE.y0 + NICHE.y1) / 2, (NICHE.z0 + NICHE.z1) / 2], { cast: false });
    addBox(g, [0.01, SHELF.y1 - SHELF.y0, SHELF.z1 - SHELF.z0], m.plaster, [DUCT - SHELF.d, (SHELF.y0 + SHELF.y1) / 2, (SHELF.z0 + SHELF.z1) / 2], { cast: false });
    for (const y of [0.75, 1.1, 1.48, 1.8, 2.12]) addBox(g, [SHELF.d, 0.02, SHELF.z1 - SHELF.z0], m.stone, [DUCT - SHELF.d / 2, y, (SHELF.z0 + SHELF.z1) / 2]);
    // Framed panels: a raised moulding around the WC panel and the shelving
    const moulding = (z0, z1, y0, y1) => {
      const t = 0.025;
      addBox(g, [0.015, y1 - y0, t], m.plaster, [DUCT + 0.008, (y0 + y1) / 2, z0]);
      addBox(g, [0.015, y1 - y0, t], m.plaster, [DUCT + 0.008, (y0 + y1) / 2, z1]);
      addBox(g, [0.015, t, z1 - z0 + t], m.plaster, [DUCT + 0.008, y0, (z0 + z1) / 2]);
      addBox(g, [0.015, t, z1 - z0 + t], m.plaster, [DUCT + 0.008, y1, (z0 + z1) / 2]);
    };
    moulding(1.012, 1.815, 0.1, 2.5);
    moulding(1.06, 1.767, 0.15, 2.45);
    moulding(1.91, 2.24, 0.1, 2.5);
    // Wall-hung WC, seat at 420
    const wcz = 1.415;
    const fp = new THREE.Shape();
    fp.moveTo(0, -0.18); fp.lineTo(0.33, -0.18); fp.absarc(0.33, 0, 0.18, -Math.PI / 2, Math.PI / 2, false); fp.lineTo(0, 0.18); fp.lineTo(0, -0.18);
    const wcGeo = new THREE.ExtrudeGeometry(fp, { depth: 0.24, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 4, curveSegments: 20 });
    wcGeo.rotateX(-Math.PI / 2);
    const wc = new THREE.Mesh(wcGeo, m.ceramic);
    wc.position.set(DUCT, 0.13, wcz);
    wc.castShadow = true;
    const seat = new THREE.Mesh(new THREE.ExtrudeGeometry(fp, { depth: 0.02, bevelEnabled: false, curveSegments: 20 }).rotateX(-Math.PI / 2), m.ceramic);
    seat.position.set(DUCT + 0.005, 0.4, wcz);
    g.add(wc, seat);
    addBox(g, [0.012, 0.14, 0.22], m.brass, [DUCT + 0.006, 0.95, wcz]); // flush plate
    addBox(g, [0.03, 0.12, 0.03], m.brass, [DUCT + 0.015, 0.9, 1.714]); // spray holder
    // Shower controls at 1,100 and a hand shower on its hose
    for (const z of [0.36, 0.461, 0.565]) {
      const v = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 24), m.brass);
      v.rotation.z = Math.PI / 2;
      v.position.set(DUCT + 0.01, 1.1, z);
      g.add(v);
    }
    const hose = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[1.06, 0.565], [0.6, 0.6], [0.32, 0.5], [0.4, 0.36], [1.02, 0.33]].map(([y, z]) => new THREE.Vector3(DUCT + 0.025, y, z))), 40, 0.006, 8), m.brass);
    const handset = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.012, 0.2, 12), m.brass);
    handset.position.set(DUCT + 0.03, 1.1, 0.33);
    g.add(hose, handset);
  }

  // ---- Always visible: floor, glass screens, rain shower, drain
  const fixed = makeMats();
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.28 });
  addBox(root, [RW, 0.04, RD], floorMat, [RW / 2, -0.02, RD / 2], { cast: false });
  const glass = new THREE.MeshStandardMaterial({ color: 0xdcebea, transparent: true, opacity: 0.2, roughness: 0.05, metalness: 0.1, depthWrite: false });
  addBox(root, [0.605, RH, 0.01], glass, [DUCT + 0.3025, RH / 2, SHOWER], { cast: false });
  addBox(root, [0.565, RH, 0.01], glass, [RW - 0.2825, RH / 2, SHOWER], { cast: false });
  addBox(root, [0.012, RH, 0.016], fixed.brass, [DUCT + 0.605, RH / 2, SHOWER], { cast: false });
  addBox(root, [0.012, RH, 0.016], fixed.brass, [RW - 0.565, RH / 2, SHOWER], { cast: false });
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.012, 40), fixed.brass);
  head.position.set(0.59, 2.38, 0.4575);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.22, 10), fixed.brass);
  arm.position.set(0.59, 2.49, 0.4575);
  root.add(head, arm);
  addBox(root, [0.06, 0.004, 0.6], fixed.brass, [0.34, 0.002, 0.45], { cast: false }); // linear drain
  const lamp = new THREE.PointLight(0xffe4c4, 3.5, 6, 2); // warm room light
  lamp.position.set(RW / 2, 2.3, RD / 2 + 0.2);
  root.add(lamp);
  // Soft studio reflections so brass, mirror and ceramic read as materials (metals look dark without them)
  import('three/addons/environments/RoomEnvironment.js')
    .then(({ RoomEnvironment }) => {
      const pm = new THREE.PMREMGenerator(viewer.renderer);
      viewer.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
      viewer.scene.environmentIntensity = 0.5;
      pm.dispose();
      viewer.invalidate();
    })
    .catch(() => {}); // plain lighting still works

  // Cutaway: walls between the camera and the room fade away, like a section
  const v = new THREE.Vector3();
  const update = (dt) => {
    let active = false;
    const cam = viewer.camera.position;
    for (const w of Object.values(groups)) {
      const outside = w.normal.dot(v.copy(cam).sub(w.centre)) > 0.05;
      const target = outside ? 0 : 1;
      w.o = viewer.reduced ? target : approach(w.o, target, dt, 70);
      if (Math.abs(w.o - target) > 0.004) active = true;
      const fade = w.o < 0.995;
      for (const mat of Object.values(w.mats)) {
        if (mat.transparent !== fade) { mat.transparent = fade; mat.needsUpdate = true; }
        mat.opacity = w.o;
        mat.depthWrite = !fade;
      }
      w.g.visible = w.o > 0.01;
    }
    return active;
  };

  // Views: the four elevations from Lara's drawings, plus the 3D overview
  let view = '3d';
  const target = new THREE.Vector3(RW / 2, 1.25, RD / 2);
  const VIEWS = { a: 0, b: -Math.PI / 2, c: Math.PI, d: Math.PI / 2 };
  const seg = segmented('Elevations', [['3d', '3D'], ['a', 'A'], ['b', 'B'], ['c', 'C'], ['d', 'D']], view, (k) => {
    view = k;
    if (k === '3d') viewer.reset();
    else viewer.focus(target, 6.6, 1.47, VIEWS[k]);
  });
  seg.querySelectorAll('button').forEach((b) => b.dataset.value !== '3d' && b.setAttribute('aria-label', `Elevation ${b.textContent}`));
  viewer.onGrab = () => { view = 'free'; seg.setValue(null); };
  const ui = el('div', 'group glass-thin');
  ui.append(seg);
  viewer.ui.append(ui);

  const is = (...k) => () => k.includes(view);
  return {
    root,
    update,
    target,
    distance: 8.2,
    azimuth: -0.72,
    polar: 0.92,
    size: 2.8,
    labels: [
      { text: '2.00 × 2.35 m room', pos: new THREE.Vector3(RW / 2, 0.02, RD - 0.35), when: is('3d', 'free') },
      { text: 'Rain shower', pos: new THREE.Vector3(0.59, 2.36, 0.4575), when: is('a') },
      { text: 'Frameless glass, 650 opening', pos: new THREE.Vector3(RW / 2 + 0.1, 1.9, SHOWER), when: is('a') },
      { text: 'Arched mirror, backlit LED', pos: new THREE.Vector3(RW - 0.03, 2.25, vz - 0.2), when: is('b') },
      { text: 'Floating timber vanity', pos: new THREE.Vector3(RW - 0.5, 0.55, vz - 0.3), when: is('b') },
      { text: 'Tiles to 1,200 mm', pos: new THREE.Vector3(RW - 0.01, TILE_TO, 2.15), when: is('b') },
      { text: 'Arched opening, 800 wide', pos: new THREE.Vector3(0.95, 2.3, RD), when: is('c') },
      { text: 'Recessed shelving', pos: new THREE.Vector3(DUCT, 1.95, 2.075), when: is('d') },
      { text: 'Wall-hung WC', pos: new THREE.Vector3(DUCT + 0.45, 0.45, 1.415), when: is('d') },
      { text: 'Shower niche', pos: new THREE.Vector3(DUCT, 1.6, 0.457), when: is('d') },
    ],
  };
}

/* =========================================================
   No. 45 — Residential Renovation, GriDesign
   Traced from Lara's ground floor plan (2.28 cm per pixel, set by
   the 12 m² garden house) with heights from her side elevation and
   section. x runs from No. 47 (−) to No. 43 (+); z from the garden
   (−) to the street (+).
   ========================================================= */

function terraceHouse({ viewer }) {
  viewer.ground.visible = false;
  const root = new THREE.Group();
  const W = 5.5;
  const HW = W / 2;
  const FRONT = 3.0;
  const REAR = -4.22;
  const EAVES = 5.7;
  const RIDGE = 8.5;
  const EXT = -7.0; // rear face of the new extension
  const GH = { x0: -2.67, x1: 2.58, z0: -17.33, zw: -20.39, ze: -21.42 };
  const END = -21.9;

  const brickTex = canvasTex([512, 256], [0.9, 0.45], (g, w, h) => {
    g.fillStyle = '#ddd2c2';
    g.fillRect(0, 0, w, h);
    const rows = 6;
    const bw = w / 4;
    const bh = h / rows;
    for (let r = 0; r < rows; r++) for (let c = -1; c <= 4; c++) {
      g.fillStyle = jitter([172, 116, 88], 34, r * 17 + c);
      g.fillRect(c * bw + (r % 2 ? bw / 2 : 0) + 2, r * bh + 2, bw - 4, bh - 4);
    }
  });
  const tileTex = canvasTex([512, 512], [0.6, 0.6], (g, w, h) => {
    const rows = 6;
    const bw = w / 4;
    const bh = h / rows;
    for (let r = 0; r < rows; r++) for (let c = -1; c <= 4; c++) {
      g.fillStyle = jitter([108, 78, 66], 24, r * 31 + c);
      g.fillRect(c * bw + (r % 2 ? bw / 2 : 0), r * bh, bw - 2, bh);
      g.fillStyle = 'rgba(30, 18, 12, 0.35)';
      g.fillRect(c * bw + (r % 2 ? bw / 2 : 0), (r + 1) * bh - 4, bw - 2, 4);
    }
  });
  const paveTex = canvasTex([512, 512], [1.2, 1.2], (g, w, h) => {
    g.fillStyle = '#c5bdaf';
    g.fillRect(0, 0, w, h);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) { g.fillStyle = jitter([218, 212, 200], 12, r * 2 + c); g.fillRect(c * w / 2 + 3, r * h / 2 + 3, w / 2 - 6, h / 2 - 6); }
  });
  const grassTex = canvasTex([256, 256], [1.5, 1.5], (g, w, h) => {
    g.fillStyle = '#9fb684';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { g.fillStyle = rand(i) > 0.5 ? 'rgba(70,100,50,0.25)' : 'rgba(210,230,170,0.25)'; g.fillRect(rand(i + 1) * w, rand(i + 2) * h, 2, 5); }
  });
  const gravelTex = canvasTex([256, 256], [1, 1], (g, w, h) => {
    g.fillStyle = '#d4ccbc';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${120 + rand(i) * 80}, ${110 + rand(i + 1) * 70}, 95, 0.5)`; g.beginPath(); g.arc(rand(i + 2) * w, rand(i + 3) * h, 1 + rand(i + 4) * 2, 0, Math.PI * 2); g.fill(); }
  });

  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.9, ...o });
  const M = {
    brick: std({ map: brickTex }),
    brickNew: std({ map: brickTex }),
    brickDark: std({ map: brickTex, color: 0x9a8f88 }),
    roof: std({ map: tileTex, roughness: 0.8 }),
    roofNew: std({ map: tileTex, roughness: 0.8 }),
    trim: std({ color: 0xf4f2ed, roughness: 0.6 }),
    glass: std({ color: 0x38434c, roughness: 0.15, metalness: 0.25 }),
    sky: std({ color: 0x8eb1c6, roughness: 0.08, metalness: 0.35 }),
    render: std({ color: 0xece6da }),
    door: std({ color: 0x3d4c46, roughness: 0.6 }),
    timber: std({ color: 0x8c6f56 }),
    sheet: std({ color: 0xc6cacd, roughness: 0.6 }),
    pot: std({ color: 0xa65a3f }),
    pave: std({ map: paveTex }),
    grass: std({ map: grassTex }),
    gravel: std({ map: gravelTex }),
    shrub: std({ color: 0x6f9a6b, flatShading: true }),
    ctx: std({ color: 0xefece6 }),
    ctxRoof: std({ color: 0xd9d4cb }),
    plinthTop: std({ color: 0xe9e6de }),
    plinthSide: std({ color: 0xcfcac0 }),
    street: std({ color: 0xd2cdc4 }),
  };
  const NEW = [M.brickNew, M.brickDark, M.roofNew];
  const NEW_BASE = NEW.map((m) => m.color.clone());

  // Flat ground patch (y slightly above the plinth to avoid z-fighting)
  const patch = (x0, x1, z0, z1, mat, y = 0.01) => {
    const m = new THREE.Mesh(planeGeo(x1 - x0, z1 - z0).rotateX(-Math.PI / 2), mat);
    m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    m.receiveShadow = true;
    root.add(m);
  };
  // Gable roof: ridge along x, pitched front-to-back; caps take the first material
  const gable = (parent, x, z, w, d, base, rise, mats, over = 0.3) => {
    const s = new THREE.Shape([new THREE.Vector2(-d / 2 - over, 0), new THREE.Vector2(d / 2 + over, 0), new THREE.Vector2(0, rise)]);
    const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false }).translate(0, 0, -w / 2).rotateY(Math.PI / 2);
    const m = new THREE.Mesh(g, mats);
    m.position.set(x, base, z);
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  // A side profile in (z, y) extruded across the full width; used for sloped roofs and the extension
  const profile = (parent, pts, mat, w = W, x = 0) => {
    const s = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(-z, y)));
    const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false }).translate(0, 0, -w / 2).rotateY(Math.PI / 2);
    const m = new THREE.Mesh(g, mat);
    m.position.x = x;
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  // Window or door: frame, glass and glazing bars, placed on a face with rotY pointing outwards
  const opening = (parent, x, y, z, w, h, rotY, { bars = 0, sill = true, mat = M.glass } = {}) => {
    const g = new THREE.Group();
    addBox(g, [w + 0.1, h + 0.1, 0.06], M.trim, [0, 0, 0], { cast: false });
    addBox(g, [w, h, 0.07], mat, [0, 0, 0.006], { cast: false });
    for (let i = 1; i <= bars; i++) addBox(g, [0.045, h, 0.08], M.trim, [-w / 2 + (w * i) / (bars + 1), 0, 0.008], { cast: false });
    if (sill) addBox(g, [w + 0.18, 0.05, 0.12], M.trim, [0, -h / 2 - 0.07, 0.05], { cast: false });
    g.position.set(x, y + h / 2, z);
    g.rotation.y = rotY;
    parent.add(g);
    return g;
  };

  // ---- Plinth, street and garden surfaces
  const PX0 = -W * 1.5 - 0.3;
  const PX1 = W * 1.5 + 0.3;
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(PX1 - PX0, 0.5, 7.8 - END + 0.4), [M.plinthSide, M.plinthSide, M.plinthTop, M.plinthSide, M.plinthSide, M.plinthSide]);
  plinth.position.set(0, -0.25, (7.8 + END - 0.4) / 2);
  plinth.receiveShadow = true;
  root.add(plinth);
  patch(PX0, PX1, 5.5, 7.8, M.street);
  patch(-HW, HW, FRONT, 5.47, M.pave);
  patch(-HW, HW, EXT, REAR, M.pave);
  patch(-HW, HW, -9.8, EXT, M.pave);
  patch(-0.39, 0.41, -16.53, -9.8, M.pave);
  patch(-1.82, -0.39, -16.53, -9.8, M.grass);
  patch(0.41, 1.85, -16.53, -9.8, M.grass);
  patch(-HW, -1.82, -16.53, -9.8, M.gravel);
  patch(1.85, HW, -16.53, -9.8, M.gravel);
  patch(-HW, HW, GH.z0, -16.53, M.pave);
  patch(-HW, HW, END, GH.z0, M.grass);
  for (let i = 0; i < 9; i++) { // planting in the gravel beds
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28 + rand(i) * 0.22, 1), M.shrub);
    s.position.set(i % 2 ? 2.25 : -2.27, 0.3, -10.4 - i * 0.7);
    s.castShadow = true;
    root.add(s);
  }
  // Garden walls, rear boundary and the low front wall
  for (const s of [-1, 1]) addBox(root, [0.1, 1.6, REAR - END + 0.5], M.brick, [s * (HW + 0.05), 0.8, (REAR + END - 0.5) / 2]);
  addBox(root, [5.6, 1.8, 0.1], M.brick, [0, 0.9, -21.0], { rotY: 0.18 });
  addBox(root, [4.15, 0.7, 0.12], M.brick, [-HW + 2.075, 0.35, 5.4]);
  addBox(root, [0.35, 0.7, 0.12], M.brick, [HW - 0.175, 0.35, 5.4]);

  // ---- Neighbours, as pale context
  for (const s of [-1, 1]) {
    const cx = s * W;
    addBox(root, [W, EAVES, FRONT - REAR], M.ctx, [cx, EAVES / 2, (FRONT + REAR) / 2]);
    gable(root, cx, (FRONT + REAR) / 2, W, FRONT - REAR, EAVES - 0.15, RIDGE - EAVES + 0.15, [M.ctx, M.ctxRoof]);
    addBox(root, [W * 0.55, 3.0, 2.6], M.ctx, [cx - s * W * 0.2, 1.5, REAR - 1.3]);
    addBox(root, [3.2, EAVES, 0.8], M.ctx, [cx - s * 0.9, EAVES / 2, FRONT + 0.4]);
    addBox(root, [0.1, 1.6, REAR - END], M.ctx, [s * (W * 1.5), 0.8, (REAR + END) / 2]);
    patch(s > 0 ? HW + 0.1 : -W * 1.5, s > 0 ? W * 1.5 : -HW - 0.1, END, REAR - 2.6, M.ctx, 0.005);
  }

  // ---- No. 45: main house
  addBox(root, [W, EAVES, FRONT - REAR], M.brick, [0, EAVES / 2, (FRONT + REAR) / 2]);
  gable(root, 0, (FRONT + REAR) / 2, W, FRONT - REAR, EAVES - 0.15, RIDGE - EAVES + 0.15, [M.brick, M.roof]);
  addBox(root, [0.7, 1.9, 0.9], M.brick, [-HW + 0.35, RIDGE + 0.1, (FRONT + REAR) / 2]); // chimney on the party wall with No. 47
  for (const dx of [-0.15, 0.15]) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.38, 12), M.pot);
    pot.position.set(-HW + 0.35 + dx, RIDGE + 1.24, (FRONT + REAR) / 2);
    pot.castShadow = true;
    root.add(pot);
  }
  // Two-storey canted bay with its own gable
  const bay = [[-2.34, FRONT], [-1.52, FRONT + 0.82], [0.05, FRONT + 0.82], [0.87, FRONT]];
  const bayShape = new THREE.Shape(bay.map(([x, z]) => new THREE.Vector2(x, -z)));
  const bayMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(bayShape, { depth: EAVES, bevelEnabled: false }).rotateX(-Math.PI / 2), M.brick);
  bayMesh.castShadow = bayMesh.receiveShadow = true;
  root.add(bayMesh);
  const band = new THREE.Mesh(new THREE.ExtrudeGeometry(bayShape, { depth: 0.9, bevelEnabled: false }).rotateX(-Math.PI / 2), M.render);
  band.scale.set(1.004, 1, 1.004);
  band.position.set(0.003, 2.55, -0.012);
  root.add(band);
  for (let i = 1; i < bay.length; i++) {
    const [ax, az] = bay[i - 1];
    const [bx, bz] = bay[i];
    const len = Math.hypot(bx - ax, bz - az);
    const rot = Math.atan2(-(bz - az), bx - ax); // outward normal (−dz, dx) → rotation about y
    for (const sill of [0.85, 3.75]) opening(root, (ax + bx) / 2, sill, (az + bz) / 2, len - 0.36, 1.45, rot, { bars: 1 });
  }
  // Starts inside the main roof (its slope is above 7.3 m by z = 0.5) so only the front gable shows
  const bg = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-2.5, 0), new THREE.Vector2(1.03, 0), new THREE.Vector2(-0.735, 1.7)]), { depth: 3.6, bevelEnabled: false });
  const bayRoof = new THREE.Mesh(bg, [M.render, M.roof]);
  bayRoof.position.set(0, EAVES - 0.1, 0.5);
  bayRoof.castShadow = true;
  root.add(bayRoof);
  // Front door with fanlight and canopy, first-floor window above
  addBox(root, [0.9, 2.1, 0.06], M.door, [1.81, 1.05, FRONT + 0.02], { cast: false });
  opening(root, 1.81, 2.16, FRONT, 0.9, 0.32, 0, { sill: false });
  addBox(root, [1.4, 0.1, 0.8], M.trim, [1.81, 2.62, FRONT + 0.4]);
  opening(root, 1.81, 3.75, FRONT, 0.7, 1.45, 0, { bars: 1 });
  // Rear first-floor windows, from the rear elevation
  opening(root, 1.85, 3.7, REAR, 0.6, 1.5, Math.PI, { bars: 1 });
  opening(root, -1.02, 3.7, REAR, 1.03, 1.5, Math.PI, { bars: 1 });

  // ---- Existing only: open lean-to, original rear openings, a shed at the end of the garden
  const old = new THREE.Group();
  root.add(old);
  profile(old, [[REAR, 2.85], [REAR - 1.45, 2.3], [REAR - 1.45, 2.36], [REAR, 2.91]], M.sheet);
  for (const x of [-2.5, 2.5]) addBox(old, [0.08, 2.3, 0.08], M.trim, [x, 1.15, REAR - 1.38]);
  opening(old, 2.2, 0.95, REAR, 0.55, 1.05, Math.PI, { bars: 0 });
  opening(old, 1.45, 0, REAR, 0.75, 2.05, Math.PI, { sill: false, mat: M.door });
  opening(old, -0.85, 0, REAR, 1.1, 2.05, Math.PI, { sill: false, bars: 1 });
  addBox(old, [2.4, 2.0, 2.0], M.timber, [0.9, 1.0, -19.6]);
  addBox(old, [2.6, 0.06, 2.3], M.sheet, [0.9, 2.05, -19.6]);

  // ---- Proposal: rear extension with sunroofs, new brickwork and openings
  const ext = new THREE.Group();
  root.add(ext);
  profile(ext, [[EXT, 0], [REAR, 0], [REAR, 3.7], [EXT, 3.0]], M.brickNew);
  profile(ext, [[EXT - 0.25, 2.94], [REAR, 3.7], [REAR, 3.86], [EXT - 0.25, 3.1]], M.roofNew);
  const slope = Math.atan2(0.7, REAR - EXT);
  for (const x of [0.99, -1.05]) { // two sunroofs, from the rear elevation
    const zc = -5.6;
    const y = 3.1 + ((zc - (EXT - 0.25)) / (REAR - EXT + 0.25)) * 0.76;
    const f = addBox(ext, [1.2, 0.08, 1.0], M.trim, [x, y + 0.03, zc], { cast: false });
    const gl = addBox(ext, [1.04, 0.09, 0.84], M.sky, [x, y + 0.04, zc], { cast: false });
    f.rotation.x = gl.rotation.x = -slope;
  }
  opening(ext, 1.69, 1.14, EXT, 1.14, 1.36, Math.PI, { bars: 1 }); // kitchen window
  opening(ext, -0.885, 0, EXT, 2.93, 2.4, Math.PI, { bars: 3, sill: false }); // French doors with sidelights
  addBox(ext, [W, 0.22, 0.04], M.brickDark, [0, 2.62, EXT - 0.02], { cast: false }); // soldier course over the openings

  // ---- Proposal: garden house, mono-pitched roof rising to the back
  const gh = new THREE.Group();
  root.add(gh);
  const roofY = (z) => 2.05 + (GH.z0 - z) * 0.11;
  const foot = [[GH.x0, GH.z0], [GH.x1, GH.z0], [GH.x1, GH.ze], [GH.x0, GH.zw]];
  const wallPos = [];
  const wallUv = [];
  for (let i = 0; i < 4; i++) {
    const [ax, az] = foot[i];
    const [bx, bz] = foot[(i + 1) % 4];
    const L = Math.hypot(bx - ax, bz - az);
    const ha = roofY(az);
    const hb = roofY(bz);
    wallPos.push(ax, 0, az, bx, 0, bz, bx, hb, bz, ax, 0, az, bx, hb, bz, ax, ha, az);
    wallUv.push(0, 0, L, 0, L, hb, 0, 0, L, hb, 0, ha);
  }
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.Float32BufferAttribute(wallPos, 3));
  wg.setAttribute('uv', new THREE.Float32BufferAttribute(wallUv, 2));
  wg.computeVertexNormals();
  const ghMat = M.brickNew.clone();
  ghMat.side = THREE.DoubleSide;
  NEW.push(ghMat);
  NEW_BASE.push(ghMat.color.clone());
  const ghWalls = new THREE.Mesh(wg, ghMat);
  ghWalls.castShadow = ghWalls.receiveShadow = true;
  gh.add(ghWalls);
  const o = 0.18;
  const rc = [[GH.x0 - o, GH.z0 + o], [GH.x1 + o, GH.z0 + o], [GH.x1 + o, GH.ze - o], [GH.x0 - o, GH.zw - o]];
  const rp = [];
  const ruv = [];
  for (const k of [0, 1, 2, 0, 2, 3]) { const [x, z] = rc[k]; rp.push(x, roofY(z) + 0.08, z); ruv.push(x, z); }
  const rg = new THREE.BufferGeometry();
  rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3));
  rg.setAttribute('uv', new THREE.Float32BufferAttribute(ruv, 2));
  rg.computeVertexNormals();
  const ghRoofMat = M.roofNew.clone();
  ghRoofMat.side = THREE.DoubleSide;
  NEW.push(ghRoofMat);
  NEW_BASE.push(ghRoofMat.color.clone());
  const ghRoof = new THREE.Mesh(rg, ghRoofMat);
  ghRoof.castShadow = true;
  gh.add(ghRoof);
  opening(gh, -1.51, 0, GH.z0, 0.86, 1.85, 0, { sill: false, mat: M.door });
  opening(gh, -0.205, 0.9, GH.z0, 1.07, 0.95, 0, { bars: 1 });
  opening(gh, 1.29, 0.9, GH.z0, 1.07, 0.95, 0, { bars: 1 });

  // ---- State
  let mode = 'proposal';
  const want = { newwork: false };
  let p = 1;
  let hi = 0;
  const BLUE = new THREE.Color(0x3d72e0);
  const PALE_BLUE = new THREE.Color(0xd6e4ff);
  const update = (dt) => {
    p = viewer.reduced ? (mode === 'proposal' ? 1 : 0) : approach(p, mode === 'proposal' ? 1 : 0, dt, 150);
    hi = viewer.reduced ? (want.newwork ? 1 : 0) : approach(hi, want.newwork ? 1 : 0, dt, 90);
    // Rise: the extension first, then the garden house; the old pieces sink as they go
    const rise = (g, k) => { g.scale.y = Math.max(k, 0.001); g.visible = k > 0.003; };
    rise(ext, easeOutCubic(clamp(p * 1.4, 0, 1)));
    rise(gh, easeOutCubic(clamp(p * 1.4 - 0.4, 0, 1)));
    rise(old, easeOutCubic(clamp((1 - p) * 1.4, 0, 1)));
    // Tint plus a soft blue glow: a multiply alone turns red brick a muddy purple
    NEW.forEach((m, i) => { m.color.copy(NEW_BASE[i]).lerp(PALE_BLUE, hi); m.emissive.copy(BLUE).multiplyScalar(hi * 0.45); });
    return Math.abs(p - (mode === 'proposal' ? 1 : 0)) > 0.002 || Math.abs(hi - (want.newwork ? 1 : 0)) > 0.004;
  };

  const chips = layerChips('Layers', [['newwork', 'New work', '#5b8def']], want, (k, on) => { want[k] = on; viewer.invalidate(); });
  const right = el('div', 'group glass-thin');
  right.append(segmented('Scheme', [['existing', 'Existing'], ['proposal', 'Proposal']], mode, (m) => { mode = m; viewer.invalidate(); }), resetButton(viewer));
  viewer.ui.append(chips, right);

  const is = (m) => () => mode === m;
  return {
    root,
    update,
    target: new THREE.Vector3(0, 2.6, -8.6),
    distance: 46,
    azimuth: 2.45,
    polar: 1.0,
    size: 17,
    // The terrace blocks the view between street and garden, so labels behind it hide
    occluders: [
      new THREE.Box3(new THREE.Vector3(-HW, 0, REAR), new THREE.Vector3(HW, RIDGE - 0.6, FRONT + 0.82)),
      new THREE.Box3(new THREE.Vector3(-W * 1.5, 0, REAR), new THREE.Vector3(-HW, RIDGE - 0.6, FRONT)),
      new THREE.Box3(new THREE.Vector3(HW, 0, REAR), new THREE.Vector3(W * 1.5, RIDGE - 0.6, FRONT)),
    ],
    labels: [
      { text: 'No. 45', pos: new THREE.Vector3(0, RIDGE + 1.0, (FRONT + REAR) / 2) },
      { text: 'No. 47', pos: new THREE.Vector3(-W, RIDGE + 0.6, (FRONT + REAR) / 2), minor: true },
      { text: 'No. 43', pos: new THREE.Vector3(W, RIDGE + 0.6, (FRONT + REAR) / 2), minor: true },
      { text: 'Street', pos: new THREE.Vector3(0, 0.05, 6.8), minor: true },
      { text: 'Sunroofs', pos: new THREE.Vector3(0.99, 3.75, -5.6), when: is('proposal') },
      { text: 'New brickwork and openings', pos: new THREE.Vector3(-0.9, 2.7, EXT - 0.05), when: is('proposal') },
      { text: 'Garden house, 12 m²', pos: new THREE.Vector3(0, 2.75, -19.2), when: is('proposal') },
      { text: 'Original lean-to', pos: new THREE.Vector3(0, 3.0, REAR - 0.8), when: is('existing') },
      { text: 'Garden shed', pos: new THREE.Vector3(0.9, 2.3, -19.6), when: is('existing'), minor: true },
    ],
  };
}

/* =========================================================
   GLB — a model exported from SketchUp (or Blender)
   ========================================================= */

function glbModel({ viewer, src }) {
  const root = new THREE.Group();
  import('three/addons/loaders/GLTFLoader.js')
    .then(({ GLTFLoader }) => new GLTFLoader().loadAsync(src))
    .then((gltf) => {
      const obj = gltf.scene;
      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3());
      const centre = box.getCenter(new THREE.Vector3());
      obj.position.sub(new THREE.Vector3(centre.x, box.min.y, centre.z)); // sit it on the ground
      obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      root.add(obj);
      const span = Math.max(size.x, size.z, size.y);
      viewer.refit({ target: new THREE.Vector3(0, size.y * 0.4, 0), distance: span * 2.2, azimuth: 0.62, polar: 1.12, size: span });
    })
    .catch(() => viewer.fail());
  const ui = el('div', 'group glass-thin');
  ui.append(resetButton(viewer));
  viewer.ui.append(ui);
  return { root, target: new THREE.Vector3(0, 1, 0), distance: 20, azimuth: 0.62, polar: 1.12, size: 10 };
}

const BUILDERS = { 'crown-hall': crownHall, sleeper: sleeperStack, 'kent-site': kentSite, bathroom, 'terrace-house': terraceHouse, glb: glbModel };
