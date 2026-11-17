// The hill above Calgary and the ice track that runs down it: terrain height, the track's centre line (plan spline laid on
// the terrain), its banked cross-section swept into geometry, and where a sled is for a distance along it.
import * as THREE from "three";
export type V3 = [number, number, number];
const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sstep = (a: number, b: number, x: number) => { const t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mixn = (a: number, b: number, t: number) => a + (b - a) * t;

export const HILL = { x: 0, z: -150, top: 24, r0: 15, r1: 108 };
/** snow terrain height: the start hill, flat valley floor round the finish and the town, rolling ground far away */
export const terrain = (x: number, z: number) => {
  const d = Math.hypot(x - HILL.x, z - HILL.z);
  let h = d < HILL.r0 ? HILL.top : d < HILL.r1 ? HILL.top * (0.5 + 0.5 * Math.cos((Math.PI * (d - HILL.r0)) / (HILL.r1 - HILL.r0))) : 0;
  const D = Math.hypot(x - 30, z + 10), far = sstep(150, 320, D);
  h = Math.max(h, far * (12 + 9 * Math.sin(x * 0.013 + 1.3) * Math.cos(z * 0.011 + 0.4) + 5 * Math.sin(x * 0.031 + z * 0.027)));
  return h;
};

// ---- centre line ----
const CP: [number, number][] = [[0, -166], [0, -154], [0, -141], [-4.5, -121], [4.5, -101], [-4, -81], [-2, -63], [-9, -47], [-14, -31], [-8, -20], [6, -16], [24, -16], [48, -16], [78, -16], [104, -16], [116, -16]];
const DS = 0.6;
const cr = (p0: number, p1: number, p2: number, p3: number, t: number) => 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
type Smp = { p: THREE.Vector3; t: THREE.Vector3; r: THREE.Vector3; n: THREE.Vector3; b: number; sg: number };
const SAMPLES: Smp[] = (() => {
  const raw: [number, number][] = [];
  for (let i = 1; i < CP.length - 2; i++) for (let k = 0; k < 40; k++) { const t = k / 40; raw.push([cr(CP[i - 1][0], CP[i][0], CP[i + 1][0], CP[i + 2][0], t), cr(CP[i - 1][1], CP[i][1], CP[i + 1][1], CP[i + 2][1], t)]); }
  // resample by arc length
  const pts: [number, number][] = [raw[0]]; let acc = 0;
  for (let i = 1; i < raw.length; i++) {
    let [ax, az] = raw[i - 1]; const [bx, bz] = raw[i]; let seg = Math.hypot(bx - ax, bz - az);
    while (acc + seg >= DS) { const k = (DS - acc) / seg; ax += (bx - ax) * k; az += (bz - az) * k; pts.push([ax, az]); seg = Math.hypot(bx - ax, bz - az); acc = 0; }
    acc += seg;
  }
  const N = pts.length, ys = pts.map(([x, z]) => terrain(x, z) + 0.5), y2 = ys.map((_, i) => { let s = 0, c = 0; for (let k = -6; k <= 6; k++) { const j = cl(i + k, 0, N - 1); s += ys[j]; c++; } return s / c; });
  const P = pts.map(([x, z], i) => new THREE.Vector3(x, y2[i], z));
  const T = P.map((_, i) => P[Math.min(N - 1, i + 1)].clone().sub(P[Math.max(0, i - 1)]).normalize());
  const UP = new THREE.Vector3(0, 1, 0);
  const R = T.map((t) => new THREE.Vector3().crossVectors(t, UP).normalize());
  // signed plan curvature (+ = turning right), smoothed
  const kap = P.map((_, i) => { const a = T[Math.max(0, i - 3)], b = T[Math.min(N - 1, i + 3)]; return (b.clone().sub(a).dot(R[i])) / (6 * DS); });
  const ks = kap.map((_, i) => { let s = 0; for (let k = -8; k <= 8; k++) s += kap[cl(i + k, 0, N - 1)]; return s / 17; });
  return P.map((p, i) => ({ p, t: T[i], r: R[i], n: new THREE.Vector3().crossVectors(R[i], T[i]).normalize(), b: cl((Math.abs(ks[i]) - 0.012) / 0.04), sg: ks[i] > 0 ? -1 : 1 }));
})();
export const TRACK_LEN = (SAMPLES.length - 1) * DS;
/** outer-wall radius / sweep for a bank 0..1 */
const wallR = (b: number) => mixn(0.75, 2.7, b), wallA = (b: number) => mixn(1.3, 1.69, b);
export type Frame = { p: THREE.Vector3; t: THREE.Vector3; r: THREE.Vector3; n: THREE.Vector3; b: number; sg: number };
/** frame of the track floor centre at distance s (metres from the start gate's back end) */
export const trackAt = (s: number): Frame => {
  const f = cl(s / DS, 0, SAMPLES.length - 1.001), i = Math.floor(f), k = f - i, a = SAMPLES[i], b = SAMPLES[i + 1];
  return { p: a.p.clone().lerp(b.p, k), t: a.t.clone().lerp(b.t, k).normalize(), r: a.r.clone().lerp(b.r, k).normalize(), n: a.n.clone().lerp(b.n, k).normalize(), b: mixn(a.b, b.b, k), sg: k < 0.5 ? a.sg : b.sg };
};
/** distance along the track of the sample nearest to (x, z) */
export const sNear = (x: number, z: number) => { let best = 0, bd = 1e9; SAMPLES.forEach((q, i) => { const d = (q.p.x - x) ** 2 + (q.p.z - z) ** 2; if (d < bd) { bd = d; best = i; } }); return best * DS; };
/** where a sled sits: phi = how far up the outer wall it has climbed (radians, 0 = flat on the floor), lat = extra sideways shift on the floor */
export const sledAt = (s: number, phi = 0, lat = 0) => {
  const F = trackAt(s), R = wallR(F.b), c0 = 0.5 * sstep(0, 0.4, phi);
  const u = F.sg * (c0 + R * Math.sin(phi)) + lat, v = R * (1 - Math.cos(phi));
  const pos = F.p.clone().addScaledVector(F.r, u).addScaledVector(F.n, v);
  const up = F.n.clone().multiplyScalar(Math.cos(phi)).addScaledVector(F.r, -F.sg * Math.sin(phi)).normalize();
  return { pos, up, fwd: F.t.clone(), F };
};
/** a point beside the track: lateral metres to the right of travel (negative = left), height above the track floor */
export const beside = (s: number, lat: number, h = 0): V3 => { const F = trackAt(s), q = F.p.clone().addScaledVector(F.r, lat); return [q.x, q.y + h, q.z]; };

/** swept geometry: the ice channel and its outer shell (rim + wall down into the snow) */
export const buildTrackGeo = () => {
  const NA = 9, W = 2 * (NA + 1), N = SAMPLES.length;
  const ip: number[] = [], iuv: number[] = [], ii: number[] = [], sp: number[] = [], suv: number[] = [], si: number[] = [];
  SAMPLES.forEach((S, i) => {
    const prof: [number, number][] = [], tops: [number, number][] = [], outs: number[] = [];
    for (const sd of [-1, 1]) {
      const bk = S.sg === sd ? S.b : 0, R = wallR(bk), A = wallA(bk), arc: [number, number][] = [];
      for (let j = 0; j <= NA; j++) { const ph = (A * j) / NA; arc.push([sd * (0.5 + R * Math.sin(ph)), R * (1 - Math.cos(ph))]); }
      if (sd < 0) arc.reverse();
      prof.push(...arc); tops.push(sd < 0 ? arc[0] : arc[NA]); outs.push(sd * (0.5 + R + 0.28));
    }
    prof.forEach(([u, v], j) => { const q = S.p.clone().addScaledVector(S.r, u).addScaledVector(S.n, v); ip.push(q.x, q.y, q.z); iuv.push(j / (W - 1), (i * DS) / 5); });
    tops.forEach(([u, v], k) => {
      const a = S.p.clone().addScaledVector(S.r, u).addScaledVector(S.n, v), b = S.p.clone().addScaledVector(S.r, outs[k]).addScaledVector(S.n, v);
      sp.push(a.x, a.y, a.z, b.x, b.y, b.z, b.x, S.p.y - 3.2, b.z); const uu = (i * DS) / 3; suv.push(uu, 1, uu, 0.86, uu, 0.86 - (v + 3.2) / 6);
    });
  });
  for (let i = 0; i < N - 1; i++) {
    for (let j = 0; j < W - 1; j++) { const a = i * W + j, b = (i + 1) * W + j; ii.push(a, b, a + 1, b, b + 1, a + 1); }
    for (let k = 0; k < 2; k++) for (let j = 0; j < 2; j++) { const a = i * 6 + k * 3 + j, b = (i + 1) * 6 + k * 3 + j; si.push(a, b, a + 1, b, b + 1, a + 1); }
  }
  const mk = (p: number[], uv: number[], idx: number[]) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; };
  return { ice: mk(ip, iuv, ii), shell: mk(sp, suv, si) };
};
