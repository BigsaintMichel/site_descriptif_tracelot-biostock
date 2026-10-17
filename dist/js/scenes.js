/* TraceLot & BioStock — scènes 3D low-poly (Three.js) */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const TL = window.TL || (window.TL = { journey: 0 });
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = window.matchMedia('(max-width: 767px)').matches;
const DPR = TL.dpr || Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);

/* ---------- utilitaires ---------- */
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const smooth = (t) => t * t * (3 - 2 * t);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch (e) { return false; }
}

const MATS = new Map();
function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!MATS.has(key)) MATS.set(key, new THREE.MeshStandardMaterial(Object.assign({ color, flatShading: true, roughness: 0.88, metalness: 0 }, opts)));
  return MATS.get(key);
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const shadowTex = canvasTex(64, 64, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
  gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
function blob(w, d, o = 0.55) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: o }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.04; m.renderOrder = 1;
  return m;
}

const qrTex = canvasTex(64, 80, (g) => {
  g.fillStyle = '#F5F7FA'; g.fillRect(0, 0, 64, 80);
  g.fillStyle = '#0F1E2E';
  for (let y = 0; y < 13; y++) for (let x = 0; x < 13; x++) if (rnd() > 0.52) g.fillRect(6 + x * 4, 6 + y * 4, 4, 4);
  [[6, 6], [42, 6], [6, 42]].forEach(([x, y]) => { g.fillRect(x, y, 16, 16); g.fillStyle = '#F5F7FA'; g.fillRect(x + 3, y + 3, 10, 10); g.fillStyle = '#0F1E2E'; g.fillRect(x + 6, y + 6, 4, 4); });
  g.fillStyle = '#1B7A3E'; g.fillRect(0, 66, 64, 14);
  g.fillStyle = '#fff'; g.font = 'bold 9px monospace'; g.textAlign = 'center'; g.fillText('TG-0418', 32, 76);
});

/* ---------- objets ---------- */
function makeTruck() {
  const g = new THREE.Group();
  const box = (w, h, d, c, x, y, z, o) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, o)); m.position.set(x, y, z); g.add(m); return m; };
  box(5.4, 0.3, 1.7, '#1C232B', 0, 0.62, 0);
  box(1.55, 1.35, 1.9, '#E9EEF2', 1.85, 1.5, 0);
  box(0.75, 0.85, 1.86, '#E9EEF2', 2.95, 1.25, 0);
  box(0.06, 0.6, 1.62, '#1A3A55', 2.63, 1.85, 0, { roughness: 0.25, metalness: 0.4 });
  box(1.4, 0.55, 0.06, '#1A3A55', 1.9, 1.85, 0.96, { roughness: 0.25, metalness: 0.4 });
  box(1.4, 0.55, 0.06, '#1A3A55', 1.9, 1.85, -0.96, { roughness: 0.25, metalness: 0.4 });
  box(1.57, 0.2, 1.93, '#1B7A3E', 1.85, 1.0, 0);
  box(3.5, 0.14, 1.95, '#3A2E22', -0.85, 0.84, 0);
  box(3.5, 0.62, 0.08, '#1B7A3E', -0.85, 1.22, 0.95);
  box(3.5, 0.62, 0.08, '#1B7A3E', -0.85, 1.22, -0.95);
  box(0.08, 0.62, 1.95, '#16653A', -2.6, 1.22, 0);
  box(0.08, 0.9, 1.95, '#16653A', 0.92, 1.35, 0);
  const lamp = { emissive: '#FFE3A1', emissiveIntensity: 1.4 };
  box(0.05, 0.16, 0.34, '#FFF3C4', 3.34, 1.12, 0.62, lamp);
  box(0.05, 0.16, 0.34, '#FFF3C4', 3.34, 1.12, -0.62, lamp);
  box(0.05, 0.12, 0.2, '#DC2626', -2.66, 0.75, 0.75, { emissive: '#DC2626', emissiveIntensity: 0.8 });
  box(0.05, 0.12, 0.2, '#DC2626', -2.66, 0.75, -0.75, { emissive: '#DC2626', emissiveIntensity: 0.8 });
  const wheels = [];
  const wg = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 12);
  const hg = new THREE.CylinderGeometry(0.2, 0.2, 0.34, 8);
  [2.15, -0.95, -1.95].forEach((x) => [0.92, -0.92].forEach((z) => {
    const w = new THREE.Group();
    const t = new THREE.Mesh(wg, mat('#15191F')); t.rotation.x = Math.PI / 2;
    const h = new THREE.Mesh(hg, mat('#8A96A3')); h.rotation.x = Math.PI / 2;
    w.add(t, h); w.position.set(x, 0.42, z); g.add(w); wheels.push(w);
  }));
  const sh = blob(7, 3.2, 0.6); sh.position.set(0.2, 0.04, 0); g.add(sh);
  return { g, wheels };
}

const sackGeo = new THREE.LatheGeometry([
  new THREE.Vector2(0.0, 0), new THREE.Vector2(0.3, 0.02), new THREE.Vector2(0.35, 0.16), new THREE.Vector2(0.34, 0.4),
  new THREE.Vector2(0.27, 0.56), new THREE.Vector2(0.12, 0.63), new THREE.Vector2(0.07, 0.72), new THREE.Vector2(0, 0.74)
], 7);
function makeSack(big = false) {
  const g = new THREE.Group();
  const s = new THREE.Mesh(sackGeo, mat('#A27B4C')); s.scale.set(1, 1, 0.85);
  g.add(s);
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(big ? 0.34 : 0.2, big ? 0.42 : 0.25), new THREE.MeshBasicMaterial({ map: qrTex }));
  tag.position.set(0, 0.34, 0.31); tag.rotation.x = -0.12;
  g.add(tag);
  return g;
}

function makeHut() {
  const g = new THREE.Group();
  const w = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.1, 1.2, 9), mat('#B8794A')); w.position.y = 0.6;
  const r = new THREE.Mesh(new THREE.ConeGeometry(1.45, 1.25, 9), mat('#C9A35A')); r.position.y = 1.8;
  const d = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.75, 0.1), mat('#4A2F1E')); d.position.set(0, 0.38, 1.07);
  g.add(w, r, d, blob(3.4, 3.4, 0.45));
  return g;
}

function makePerson(shirt = '#1B7A3E') {
  const g = new THREE.Group();
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.8, 6), mat('#2A3442')); legs.position.y = 0.4;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.7, 7), mat(shirt)); body.position.y = 1.15;
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 1), mat('#5A3826')); head.position.y = 1.68;
  const phone = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.02), mat('#10B981', { emissive: '#10B981', emissiveIntensity: 1.2 }));
  phone.position.set(0.18, 1.18, 0.22);
  g.add(legs, body, head, phone, blob(1, 1, 0.5));
  return g;
}

function makePlant() {
  const g = new THREE.Group();
  const box = (w, h, d, c, x, y, z, o) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, o)); m.position.set(x, y, z); g.add(m); return m; };
  box(8, 5, 6, '#D5DCE2', 0, 2.5, 0);
  box(8.4, 0.3, 6.4, '#8E9AA6', 0, 5.15, 0);
  box(5, 3.4, 5, '#BCC6CF', -6.4, 1.7, 0.4);
  box(7.2, 0.32, 0.05, '#FFC979', 0, 3.6, 3.03, { emissive: '#FFB547', emissiveIntensity: 0.9 });
  const conv = box(7.5, 0.35, 0.9, '#5B6670', -4, 3.2, 4.4); conv.rotation.z = 0.36;
  const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.62, 15, 10), mat('#CBD3DA')); ch.position.set(2.6, 7.5, -1.4); g.add(ch);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.46, 1.1, 10), mat('#DC2626')); band.position.set(2.6, 13.8, -1.4); g.add(band);
  [[-10.4, 2.2], [-10.4, -1.2]].forEach(([x, z]) => {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 5.2, 12), mat('#B5BFC8')); s.position.set(x, 2.6, z); g.add(s);
    const c = new THREE.Mesh(new THREE.ConeGeometry(1.35, 0.8, 12), mat('#97A3AE')); c.position.set(x, 5.6, z); g.add(c);
  });
  g.add(blob(22, 14, 0.4));
  const smoke = [];
  const sg = new THREE.IcosahedronGeometry(0.9, 0);
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: '#E3E9EE', flatShading: true, transparent: true, opacity: 0.3, depthWrite: false, roughness: 1 }));
    g.add(m); smoke.push(m);
  }
  return { g, smoke, top: V(2.6, 15.2, -1.4) };
}
function animateSmoke(plant, t) {
  plant.smoke.forEach((m, i) => {
    const ph = (t * 0.07 + i / plant.smoke.length) % 1;
    m.position.set(plant.top.x + ph * 5, plant.top.y + ph * 9, plant.top.z - ph * 1.5);
    const s = 0.5 + ph * 2.4; m.scale.set(s, s, s);
    m.rotation.set(ph * 2, ph * 3, 0);
    m.material.opacity = 0.42 * (1 - ph) * Math.min(1, ph * 6);
  });
}

function makeGround(size, segs) {
  const geo = new THREE.PlaneGeometry(size, size, segs, segs);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const cols = [];
  const pal = ['#3A6838', '#43703F', '#355F36', '#4C783E', '#66773C'].map((c) => new THREE.Color(c));
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, (rnd() - 0.5) * 0.35);
    const c = pal[(rnd() * pal.length) | 0]; cols.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const g = geo.toNonIndexed(); g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
}

function ribbon(curve, width, color, y = 0.06, segs = 240) {
  const pos = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, p = curve.getPointAt(t), tg = curve.getTangentAt(t);
    const side = V(-tg.z, 0, tg.x).normalize().multiplyScalar(width / 2);
    pos.push(p.x + side.x, y, p.z + side.z, p.x - side.x, y, p.z - side.z);
    if (i < segs) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat(color, { flatShading: false, roughness: 1 }));
  m.receiveShadow = false;
  return m;
}

function nearRoad(samples, x, z, d) {
  for (let i = 0; i < samples.length; i++) { const s = samples[i]; if ((s.x - x) ** 2 + (s.z - z) ** 2 < d * d) return true; }
  return false;
}

/* Plantation de cacaoyers instanciée : tronc, feuillage, cabosses sur le tronc */
function plantation(spots) {
  const n = spots.length;
  const g = new THREE.Group();
  const trunkG = new THREE.CylinderGeometry(0.1, 0.17, 1.7, 5); trunkG.translate(0, 0.85, 0);
  const leafG = new THREE.IcosahedronGeometry(1, 0);
  const podG = new THREE.SphereGeometry(0.1, 5, 4); podG.scale(1, 1.8, 1);
  const trunks = new THREE.InstancedMesh(trunkG, mat('#5B3A24'), n);
  const leaves = new THREE.InstancedMesh(leafG, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9, color: '#ffffff' }), n * 2);
  const pods = new THREE.InstancedMesh(podG, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.7, color: '#ffffff' }), n * 3);
  const shadows = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.5 }), n);
  const leafPal = ['#1F5A32', '#2C6B3C', '#245232', '#3A7A3F', '#2F6236'].map((c) => new THREE.Color(c));
  const podPal = ['#D98A2B', '#E3B53A', '#9C4A2E', '#C8702B'].map((c) => new THREE.Color(c));
  const o = new THREE.Object3D();
  spots.forEach((s, i) => {
    const sc = s.s || 0.8 + rnd() * 0.5;
    o.position.set(s.x, 0, s.z); o.rotation.set(0, rnd() * 6.28, 0); o.scale.set(sc, sc, sc); o.updateMatrix();
    trunks.setMatrixAt(i, o.matrix);
    o.scale.set(2.4 * sc, 0.4, 2.4 * sc); o.position.y = 0.05; o.updateMatrix(); shadows.setMatrixAt(i, o.matrix);
    for (let k = 0; k < 2; k++) {
      const ls = sc * (0.85 + rnd() * 0.45);
      o.position.set(s.x + (rnd() - 0.5) * 0.8 * sc, (1.75 + k * 0.55) * sc, s.z + (rnd() - 0.5) * 0.8 * sc);
      o.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); o.scale.set(ls * 1.1, ls * 0.85, ls); o.updateMatrix();
      leaves.setMatrixAt(i * 2 + k, o.matrix); leaves.setColorAt(i * 2 + k, leafPal[(rnd() * leafPal.length) | 0]);
    }
    for (let k = 0; k < 3; k++) {
      const a = rnd() * 6.28;
      o.position.set(s.x + Math.cos(a) * 0.17 * sc, (0.45 + rnd() * 0.8) * sc, s.z + Math.sin(a) * 0.17 * sc);
      o.rotation.set(0.2, a, 0.15); o.scale.set(sc, sc, sc); o.updateMatrix();
      pods.setMatrixAt(i * 3 + k, o.matrix); pods.setColorAt(i * 3 + k, podPal[(rnd() * podPal.length) | 0]);
    }
  });
  [trunks, leaves, pods, shadows].forEach((m) => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; g.add(m); });
  return g;
}

function addLights(scene) {
  scene.add(new THREE.HemisphereLight('#D2E2EC', '#4A3420', 1.05));
  const sun = new THREE.DirectionalLight('#FFD6A8', 2.5); sun.position.set(-34, 30, 18); scene.add(sun);
  const rim = new THREE.DirectionalLight('#FFB27A', 0.9); rim.position.set(-20, 12, -60); scene.add(rim);
  const fill = new THREE.DirectionalLight('#A8CBEA', 0.5); fill.position.set(30, 40, 50); scene.add(fill);
}

/* Ciel : dôme en dégradé, raccordé exactement à la couleur du brouillard */
function skyDome(top, horizon, glow) {
  const geo = new THREE.SphereGeometry(240, 40, 20);
  const pos = geo.attributes.position, cols = [];
  const T = new THREE.Color(top), H = new THREE.Color(horizon), G = new THREE.Color(glow), c = new THREE.Color();
  const sunDir = V(-0.45, 0, -0.9).normalize(), n = V(0, 0, 0);
  for (let i = 0; i < pos.count; i++) {
    n.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize();
    const h = smooth(clamp01(n.y / 0.42));
    c.copy(H).lerp(T, h);
    const d = Math.max(0, n.x * sunDir.x + n.z * sunDir.z);
    c.lerp(G, Math.pow(d, 5) * (1 - h) * 0.75);
    cols.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
}

/* Boucle de rendu : ne tourne que si la scène est à l'écran */
function runner(host, renderer, frame) {
  let visible = false, raf = 0, last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    frame(dt, now / 1000);
    if (visible) raf = requestAnimationFrame(loop);
  };
  const io = new IntersectionObserver((es) => {
    const v = es[0].isIntersecting;
    if (v && !visible) { visible = true; last = performance.now(); raf = requestAnimationFrame(loop); }
    if (!v) { visible = false; cancelAnimationFrame(raf); }
  }, { rootMargin: '120px' });
  io.observe(host);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); }
    else if (visible) { last = performance.now(); raf = requestAnimationFrame(loop); }
  });
}

function makeRenderer(host) {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  r.setPixelRatio(DPR);
  r.setClearColor(0x000000, 0);
  host.appendChild(r.domElement);
  return r;
}

function sizer(host, renderer, camera, offset) {
  const apply = () => {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const o = offset(w, h);
    camera.fov = o.fov;
    camera.setViewOffset(w, h, o.x, o.y, w, h);
    camera.updateProjectionMatrix();
  };
  apply();
  new ResizeObserver(apply).observe(host);
  return apply;
}

/* =================================================================== */
/* HERO : un camion traverse la plantation vers la centrale            */
/* =================================================================== */
function initHero() {
  const host = document.getElementById('hero-scene');
  if (!host) return;
  const renderer = makeRenderer(host);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#3A4A3C', 45, 200);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 500);
  addLights(scene);
  const sky = skyDome('#07121F', '#3A4A3C', '#D9894F'); scene.add(sky);

  const ground = makeGround(420, mobile ? 50 : 90); ground.position.z = -80; scene.add(ground);
  const curve = new THREE.CatmullRomCurve3([V(-6, 0, 46), V(0, 0, 24), V(6, 0, 6), V(11, 0, -14), V(10, 0, -34), V(15, 0, -56), V(19, 0, -78), V(21, 0, -96)]);
  scene.add(ribbon(curve, 4.8, '#7C3F22', 0.05));
  scene.add(ribbon(curve, 3.6, '#B4582F', 0.08));
  const samples = curve.getSpacedPoints(160);

  const spots = [];
  const N = mobile ? 120 : 260;
  for (let i = 0; i < N * 4 && spots.length < N; i++) {
    const z = 30 - rnd() * 150;
    const x = -70 + rnd() * 130;
    if (nearRoad(samples, x, z, 3.8)) continue;
    if (x > 8 && x < 40 && z < -92) continue;
    if ((x - 0) ** 2 + (z - 32) ** 2 < 18 ** 2) continue;
    spots.push({ x, z });
  }
  scene.add(plantation(spots));

  const plant = makePlant(); plant.g.position.set(26, 0, -110); plant.g.rotation.y = -0.35; plant.g.scale.setScalar(1.8); scene.add(plant.g);

  const truck = makeTruck(); scene.add(truck.g);
  for (let i = 0; i < 8; i++) {
    const s = makeSack(); s.position.set(-2.2 + (i % 4) * 0.62, 0.92, ((i / 4) | 0) * 0.75 - 0.37); s.rotation.y = rnd(); truck.g.add(s);
  }

  sizer(host, renderer, camera, (w, h) => (w / h < 1
    ? { fov: 56, x: 0, y: -h * 0.12 }
    : { fov: 34, x: -w * 0.17, y: -h * 0.04 }));
  camera.position.set(0, 6.5, 32);
  const look = V(-3, 3.5, -60);

  const status = document.getElementById('hero-status');
  const gps = document.getElementById('hero-gps');
  let lastStatus = '', lastGps = 0;
  const tmp = V(0, 0, 0), tg = V(0, 0, 0);

  const frame = (dt, t) => {
    const u = reduce ? 0.3 : (TL.heroU != null ? TL.heroU : 0.04 + (t / 32) % 1 * 0.94);
    curve.getPointAt(u, tmp); curve.getTangentAt(u, tg);
    truck.g.position.copy(tmp);
    truck.g.rotation.y = Math.atan2(-tg.z, tg.x);
    truck.wheels.forEach((w) => { w.rotation.z -= dt * 5.2; });
    animateSmoke(plant, t);
    const sway = reduce ? 0 : Math.sin(t * 0.12);
    camera.position.set(sway * 2, 6.5 + Math.sin(t * 0.09) * 0.4, 32);
    camera.lookAt(look.x + sway * 1.2, look.y, look.z);
    sky.position.copy(camera.position);
    renderer.render(scene, camera);

    const s = u > 0.93 ? 'Arrivé' : 'En transit';
    if (status && s !== lastStatus) { status.textContent = s; lastStatus = s; }
    if (gps && t - lastGps > 0.6) {
      lastGps = t;
      const lat = (5.812 + u * 0.025).toFixed(3).replace('.', ',');
      const lon = (5.301 + u * 0.056).toFixed(3).replace('.', ',');
      gps.textContent = lat + '° N · ' + lon + '° O';
    }
  };
  if (reduce) { frame(0, 0); return; }
  runner(host, renderer, frame);
}

/* =================================================================== */
/* PARCOURS : village → chargement → route → pont-bascule → serveur    */
/* =================================================================== */
function initJourney() {
  const host = document.getElementById('journey-scene');
  const section = document.querySelector('.journey');
  if (!host || !section || !section.classList.contains('is-live')) return;
  const renderer = makeRenderer(host);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#3A4A3C', 34, 120);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 500);
  addLights(scene);
  const sky = skyDome('#0A1828', '#3A4A3C', '#D9894F'); scene.add(sky);

  const ground = makeGround(260, mobile ? 60 : 110); ground.position.x = 45; scene.add(ground);
  const village = new THREE.CatmullRomCurve3([V(-24, 0, 0), V(-8, 0, 0.2), V(6, 0, 0)]);
  const road = new THREE.CatmullRomCurve3([V(6, 0, 0), V(14, 0, -1.6), V(24, 0, 2.6), V(36, 0, -2.6), V(48, 0, 2.2), V(60, 0, -2.2), V(70, 0, 0.4), V(78, 0, 0)]);
  const after = new THREE.CatmullRomCurve3([V(78, 0, 0), V(90, 0, 0), V(110, 0, 0)]);
  [village, road, after].forEach((c) => { scene.add(ribbon(c, 4.8, '#7C3F22', 0.05)); scene.add(ribbon(c, 3.6, '#B4582F', 0.08)); });
  const samples = [].concat(village.getSpacedPoints(40), road.getSpacedPoints(160), after.getSpacedPoints(40));

  // Village
  [[-6, -6.5, 0.2], [-1.5, -8.5, 1], [-10, -2.8, 2], [-5.5, 6.5, 3], [-11, 7, 0.5], [0.5, 9, 2.4]].forEach(([x, z, r]) => {
    const h = makeHut(); h.position.set(x, 0, z); h.rotation.y = r; scene.add(h);
  });
  const agent = makePerson('#1B7A3E'); agent.position.set(1.6, 0, 4.6); agent.rotation.y = 2.4; scene.add(agent);

  // Arbres : brousse et cacaoyers, hors route et hors clairières
  const spots = [];
  const N = mobile ? 170 : 340;
  for (let i = 0; i < N * 4 && spots.length < N; i++) {
    const x = -30 + rnd() * 140, z = -34 + rnd() * 50;
    if (nearRoad(samples, x, z, 4.2)) continue;
    if (x > -14 && x < 6 && z > -11 && z < 11) continue;
    if (z > 2.5 && z < 20) continue;
    if (x > 70 && x < 106 && z > -18 && z < 12) continue;
    spots.push({ x, z });
  }
  scene.add(plantation(spots));

  // Sacs : 8 sacs, le premier porte un grand tag
  const pileAt = (i) => V(2.6 + (i % 4) * 0.66, 0, 2.6 + ((i / 4) | 0) * 0.7);
  const slotAt = (i) => V(-2.2 + (i % 4) * 0.62, 0.92, ((i / 4) | 0) * 0.75 - 0.37);
  const sacks = [];
  for (let i = 0; i < 8; i++) {
    const s = makeSack(i === 0);
    s.position.copy(pileAt(i)); s.rotation.y = -0.4 + rnd() * 0.3;
    scene.add(s); sacks.push(s);
  }
  const ringMat = new THREE.MeshBasicMaterial({ color: '#10B981', transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.68, 32), ringMat); ring.rotation.x = -Math.PI / 2; scene.add(ring);

  // Repère GPS
  const pin = new THREE.Group();
  const pinMat = mat('#3B82F6', { emissive: '#3B82F6', emissiveIntensity: 0.7 });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 10), pinMat); cone.rotation.x = Math.PI; cone.position.y = 0.3;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), pinMat); head.position.y = 0.75;
  pin.add(cone, head); pin.scale.setScalar(0.7); scene.add(pin);

  // Camion
  const truck = makeTruck(); scene.add(truck.g);
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 1.8), new THREE.MeshBasicMaterial({ color: '#34D399', transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
  scene.add(beam);

  // Cadenas au-dessus du camion
  const lock = new THREE.Group();
  const lm = mat('#10B981', { emissive: '#10B981', emissiveIntensity: 0.9 });
  const lb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.62, 0.3), lm);
  const ls = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.07, 8, 16, Math.PI), lm); ls.position.y = 0.31;
  lock.add(lb, ls); scene.add(lock);

  // Pont-bascule
  const wb = new THREE.Group();
  const plat = new THREE.Mesh(new THREE.BoxGeometry(8, 0.22, 3.2), mat('#5D6873')); plat.position.y = 0.11; wb.add(plat);
  [-4.4, 4.4].forEach((x) => { const r = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 3.2), mat('#4B5560')); r.position.set(x, 0.06, 0); wb.add(r); });
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 1.8), mat('#E2E8EE')); cab.position.set(0, 1, -3.5); wb.add(cab);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.18, 2.1), mat('#1B7A3E')); roof.position.set(0, 2.08, -3.5); wb.add(roof);
  const mkDisplay = (txt, col) => canvasTex(256, 96, (g, w, h) => {
    g.fillStyle = '#04110B'; g.fillRect(0, 0, w, h);
    g.fillStyle = col; g.font = 'bold 44px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 2);
  });
  const dIdle = mkDisplay('-- --- kg', '#2F6B4C');
  const dOn = mkDisplay('2 455 kg', '#34D399');
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.56), new THREE.MeshBasicMaterial({ map: dIdle }));
  disp.position.set(-4.6, 2.05, 2.62); wb.add(disp);
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.8, 0.16), mat('#3A4652')); post.position.set(-4.6, 0.9, 2.45); wb.add(post);
  const frameM = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.72, 0.12), mat('#1C2630')); frameM.position.set(-4.6, 2.05, 2.52); wb.add(frameM);
  wb.add(blob(10, 6, 0.4));
  wb.position.set(78, 0, 0); scene.add(wb);
  const recv = makePerson('#E8EEF3'); recv.position.set(75.6, 0, -2.6); recv.rotation.y = 0.6; scene.add(recv);

  // Serveur
  const srv = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.3, 2.2), mat('#33404D')); base.position.y = 0.15; srv.add(base);
  const stripMat = new THREE.MeshStandardMaterial({ color: '#3B82F6', emissive: '#3B82F6', emissiveIntensity: 0.5, flatShading: true });
  [-0.7, 0.7].forEach((x) => {
    const rack = new THREE.Mesh(new THREE.BoxGeometry(1, 2.3, 1), mat('#1C2B3B')); rack.position.set(x, 1.45, 0); srv.add(rack);
    for (let k = 0; k < 5; k++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.02), stripMat); st.position.set(x, 0.6 + k * 0.4, 0.51); srv.add(st); }
  });
  srv.add(blob(4.5, 3.5, 0.45));
  srv.position.set(85, 0, -6); srv.rotation.y = -0.35; scene.add(srv);
  const pulses = [];
  const pg = new THREE.BoxGeometry(0.16, 0.16, 0.16);
  const pm = new THREE.MeshBasicMaterial({ color: '#93C5FD' });
  for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(pg, pm); scene.add(m); pulses.push(m); }
  const P0 = V(78, 2.3, -3.5), P1 = V(81.5, 5.5, -6), P2 = V(85, 2.9, -6);

  // Centrale + stock de cabosses
  const plant = makePlant(); plant.g.position.set(96, 0, -11); plant.g.rotation.y = -0.25; scene.add(plant.g);
  const stock = new THREE.Group();
  [[0, 0, 2.6, 1.6], [2.6, 0.8, 2, 1.2], [-2.2, 0.6, 1.8, 1.1]].forEach(([x, z, r, h]) => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 9), mat('#6B4A2F')); m.position.set(x, h / 2, z); stock.add(m);
  });
  stock.position.set(102, 0, -2); stock.scale.setScalar(0.8); scene.add(stock);

  // Verdict : anneau + badge
  const vMat = new THREE.MeshBasicMaterial({ color: '#10B981', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const vRing = new THREE.Mesh(new THREE.RingGeometry(3.6, 3.95, 48), vMat); vRing.rotation.x = -Math.PI / 2; vRing.position.set(78, 0.12, 0); scene.add(vRing);
  const badge = new THREE.Group();
  const bm = mat('#10B981', { emissive: '#10B981', emissiveIntensity: 1 });
  badge.add(new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.11, 8, 28), bm));
  const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.13, 0.13), bm); c1.position.set(-0.17, -0.08, 0); c1.rotation.z = -0.8;
  const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.13, 0.13), bm); c2.position.set(0.14, 0.06, 0); c2.rotation.z = 0.85;
  badge.add(c1, c2); badge.position.set(78, 4.6, 0); scene.add(badge);

  const portrait = () => host.clientWidth / Math.max(1, host.clientHeight) < 1;
  sizer(host, renderer, camera, (w, h) => (w / h < 1
    ? { fov: 54, x: 0, y: h * 0.2 }
    : { fov: 36, x: -w * 0.13, y: h * 0.04 }));

  const tPos = V(0, 0, 0), tTan = V(0, 0, 0), camPos = V(7, 4.2, 11), camLook = V(2.5, 0.8, 2);
  const wantPos = V(0, 0, 0), wantLook = V(0, 0, 0);
  const keys = [
    [0.00, [6.4, 3.2, 10.5], [3.4, 0.9, 2.6]],
    [0.13, [8.5, 4, 12.5], [4.2, 1, 1.8]],
    [0.30, [11, 6, 14], [5, 1, 0.5]],
  ];
  const lateKeys = [
    [0.57, [83, 6, 13], [77.5, 1, 0]],
    [0.68, [82.5, 4.6, 11], [77.5, 1.3, -1.6]],
    [0.80, [88, 5.6, 10.5], [82.8, 1.8, -4.6]],
    [1.00, [97, 12.5, 25], [86, 2, -2]],
  ];
  const interp = (list, p, outP, outL) => {
    for (let i = 0; i < list.length - 1; i++) {
      const [pa, A, LA] = list[i], [pb, B, LB] = list[i + 1];
      if (p <= pb || i === list.length - 2) {
        const k = smooth(seg(p, pa, pb));
        outP.set(A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k);
        outL.set(LA[0] + (LB[0] - LA[0]) * k, LA[1] + (LB[1] - LA[1]) * k, LA[2] + (LB[2] - LA[2]) * k);
        return;
      }
    }
  };

  let sp = TL.journey || 0;
  let lastU = 0;
  const tmp = V(0, 0, 0), q = new THREE.Quaternion();

  const frame = (dt, t) => {
    sp += ((TL.journey || 0) - sp) * (TL.instant ? 1 : Math.min(1, dt * 7));
    const p = sp;

    // camion
    const u = ease(seg(p, 0.34, 0.57));
    road.getPointAt(u, tPos); road.getTangentAt(u, tTan);
    truck.g.position.copy(tPos);
    truck.g.rotation.y = Math.atan2(-tTan.z, tTan.x);
    const moved = (u - lastU) * road.getLength(); lastU = u;
    truck.wheels.forEach((w) => { w.rotation.z -= moved / 0.42; });
    truck.g.updateMatrixWorld(true);
    truck.g.getWorldQuaternion(q);

    // sacs : pile → benne
    sacks.forEach((s, i) => {
      const a = 0.175 + i * 0.016, k = ease(seg(p, a, a + 0.04));
      const slot = truck.g.localToWorld(slotAt(i));
      if (k <= 0) { s.position.copy(pileAt(i)); s.rotation.set(0, -0.4 + i * 0.07, 0); }
      else {
        const from = pileAt(i);
        s.position.lerpVectors(from, slot, k); s.position.y += Math.sin(k * Math.PI) * 1.6;
        if (k >= 1) s.quaternion.copy(q);
      }
    });

    // tag mis en avant + GPS
    const ringOn = 1 - seg(p, 0.14, 0.18);
    ring.position.set(sacks[0].position.x, 0.07, sacks[0].position.z);
    const pul = 1 + ((t * 0.9) % 1) * 0.9;
    ring.scale.set(pul, pul, pul); ringMat.opacity = ringOn * (1 - ((t * 0.9) % 1)) * 0.9;
    const pinIn = ease(seg(p, 0.005, 0.05)), pinOut = 1 - seg(p, 0.16, 0.2);
    pin.position.set(3.6, 4.6 - pinIn * 2.4 + Math.sin(t * 2) * 0.08, 3);
    pin.scale.setScalar(Math.max(0.001, 0.7 * pinIn * pinOut));
    pin.rotation.y = t;

    // faisceau de scan
    const scanOn = seg(p, 0.165, 0.18) * (1 - seg(p, 0.315, 0.335));
    beam.visible = scanOn > 0.01;
    if (beam.visible) {
      tmp.set(-2.75, 1.3 + Math.sin(t * 5) * 0.45, 0); truck.g.localToWorld(tmp);
      beam.position.copy(tmp); beam.quaternion.copy(q); beam.rotateZ(Math.PI / 2); beam.material.opacity = 0.85 * scanOn;
    }

    // cadenas pendant la route
    const lockOn = seg(p, 0.33, 0.36) * (1 - seg(p, 0.56, 0.6));
    lock.visible = lockOn > 0.01;
    lock.position.set(tPos.x - 0.6, 3.4 + Math.sin(t * 2.2) * 0.12, tPos.z);
    lock.rotation.y = t * 0.8; lock.scale.setScalar(Math.max(0.001, lockOn));

    // pont-bascule
    const weighed = p > 0.6;
    disp.material.map = weighed ? dOn : dIdle;

    // flux de données vers le serveur
    const dataOn = seg(p, 0.67, 0.7) * (1 - seg(p, 0.86, 0.9));
    pulses.forEach((m, i) => {
      m.visible = dataOn > 0.02;
      if (!m.visible) return;
      const k = (t * 0.55 + i / pulses.length) % 1, a = 1 - k;
      m.position.set(a * a * P0.x + 2 * a * k * P1.x + k * k * P2.x, a * a * P0.y + 2 * a * k * P1.y + k * k * P2.y, a * a * P0.z + 2 * a * k * P1.z + k * k * P2.z);
      m.rotation.set(t * 2, t * 3, 0); m.scale.setScalar(dataOn);
    });
    stripMat.emissiveIntensity = 0.5 + dataOn * (1.2 + Math.sin(t * 9) * 0.5);

    // verdict
    const vOn = seg(p, 0.86, 0.93);
    vMat.opacity = vOn * 0.85;
    const vs = 1 + Math.sin(t * 2) * 0.03; vRing.scale.set(vs, vs, vs);
    badge.visible = vOn > 0.01;
    badge.scale.setScalar(Math.max(0.001, vOn));
    badge.position.y = 4.6 + Math.sin(t * 1.8) * 0.15;
    badge.rotation.y = Math.sin(t * 0.8) * 0.5;

    animateSmoke(plant, t);

    // caméra
    if (p < 0.33) interp(keys, Math.min(p, 0.3), wantPos, wantLook);
    else if (p < 0.57) { wantPos.set(tPos.x + 5, 6, tPos.z + 13); wantLook.set(tPos.x - 0.5, 1, tPos.z); }
    else interp(lateKeys, p, wantPos, wantLook);
    if (portrait()) wantPos.sub(wantLook).multiplyScalar(1.3).add(wantLook);
    const damp = TL.instant ? 1 : Math.min(1, dt * 5);
    camPos.lerp(wantPos, damp); camLook.lerp(wantLook, damp);
    camera.position.copy(camPos); camera.lookAt(camLook);
    sky.position.copy(camPos);

    renderer.render(scene, camera);
  };
  runner(host, renderer, frame);
}

if (webglOK()) {
  const start = () => {
    try { initHero(); } catch (e) { console.warn('Scène hero indisponible', e); }
    try { initJourney(); } catch (e) { console.warn('Scène parcours indisponible', e); }
  };
  // Le parcours doit être en mode "live" (posé par main.js) avant l'initialisation
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
}
