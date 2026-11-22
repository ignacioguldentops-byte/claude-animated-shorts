// The layout of "Cómo nació el maratón". One Attic valley 700 m long: Athens at the west end (x < 40: in 490 BC the
// city wall, gate and agora; in 1896 the marble stadium), the dirt road east through olive groves, stone walls and
// villages (the taverna of 1896 at x = 330) to the plain and bay of Marathon (camp at 690, beach 720, sea 765).
// Hills rise from 80 m either side of the road and mountains close every horizon. England is 5 km away (x > 4600):
// the castle lawn and an avenue of oaks to the stadium of 1908. Heights come from one function shared by the
// terrain, the props, the grass and the cast (so feet always stand on the ground).
export const GATE_X = 40, TAV_X = 330, VILLAGE_X = 618, CAMP_X = 690, BEACH_X = 722, SEA_X = 765;
export const ACRO = [-260, -50] as const, STAD = { x0: -150, x1: 36, z: 0, w: 56 }, ARDET = [-120, 110] as const;
export const ENG = 5000, CASTLE = [ENG - 40, -70] as const, WCITY = { x: ENG + 430, z: 0 };
export const roadZ = (x: number): number => (x < GATE_X ? 0 : x > CAMP_X ? roadZ(CAMP_X) : 16 * Math.sin((x - GATE_X) / 105) + 6 * Math.sin((x - GATE_X) / 41));
export const roadDir = (x: number): [number, number] => { const d = roadZ(x + 0.5) - roadZ(x - 0.5), l = Math.hypot(1, d); return [1 / l, d / l]; };
/** the Sparta path: from the gate south up the hill */
export const pathX = (z: number) => GATE_X + 16 + 0.28 * Math.max(0, -z - 12) + 6 * Math.sin(-z / 23);
// ---- noise (non-periodic value noise) ----
const hsh = (i: number, j: number, s: number) => { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export const vnoise = (x: number, z: number, s = 0) => { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hsh(i, j, s), b = hsh(i + 1, j, s), c = hsh(i, j + 1, s), d = hsh(i + 1, j + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
export const fbm2 = (x: number, z: number, o = 4, s = 0) => { let a = 0, w = 0.5, t = 0, f = 1; for (let k = 0; k < o; k++) { a += w * vnoise(x * f, z * f, s + k * 31); t += w; w *= 0.5; f *= 2.03; } return a / t; };
export const sst = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const valleyZ = (x: number) => roadZ(Math.min(CAMP_X, Math.max(GATE_X, x)));
/** distance from the valley floor line (road, extended straight through Athens and to the sea) */
export const fromRoad = (x: number, z: number) => Math.abs(z - valleyZ(x));
export const H = (x: number, z: number): number => {
  if (x > 3000) return HE(x, z);
  const dr = fromRoad(x, z), n = fbm2(x / 260, z / 260, 4, 3), d0 = Math.hypot(x - 250, z * 1.4);
  let h = 1.4 * (fbm2(x / 38, z / 38, 3, 7) - 0.5) + 0.0035 * dr;
  // the hills of the valley sides; on the plain of Marathon they stand back to leave the plain open to the sea
  const open = sst(560, 700, x) * (1 - sst(150, 330, dr)), side = sst(80, 270, dr) * (32 + 120 * n) * (1 - open);
  h += side;
  // far mountains closing the horizon
  h += sst(700, 1900, d0) * (180 + 420 * fbm2(x / 700, z / 700, 4, 11));
  // Athens: the city plain is flat, the Acropolis rock stands up out of it, Ardettos hill behind the stadium
  const city = (1 - sst(-40, 60, x - 0)) * (1 - sst(120, 220, Math.abs(z)));
  h *= 1 - 0.85 * city;
  { const d = Math.hypot(x - ACRO[0], (z - ACRO[1]) * 1.6); h += 72 * sst(78, 44, d) * (0.92 + 0.16 * fbm2(x / 20, z / 20, 3, 5)) + 14 * sst(140, 60, d); }
  { const d = Math.hypot(x - ARDET[0], z - ARDET[1]); h += 34 * sst(110, 20, d) * (0.85 + 0.3 * fbm2(x / 40, z / 40, 3, 9)); }
  // the stadium hollow and the agora are level
  { const inS = (1 - sst(0, 30, Math.max(STAD.x0 - x, x - STAD.x1 - 20, 0))) * (1 - sst(STAD.w / 2 + 16, STAD.w / 2 + 40, Math.abs(z - STAD.z))); h *= 1 - inS; }
  // the mountain at the north end of the plain and the long cape that closes the bay; the beach and the sea
  { const d = Math.hypot((x - 560) * 0.8, z + 300); h += 150 * sst(260, 60, d) * (0.8 + 0.4 * fbm2(x / 60, z / 60, 3, 13)); }
  const cape = x > 640 ? sst(70, 20, Math.abs(z + 300 + 0.12 * (x - 700))) * sst(1500, 1100, x) : 0;
  if (x > BEACH_X - 40) { const t = sst(BEACH_X - 6, SEA_X + 12, x), sm = sst(BEACH_X - 30, BEACH_X, x) * (1 - cape); h = h * (1 - sm) + (0.9 - 1.5 * t) * sm - 3.5 * sst(SEA_X, SEA_X + 60, x) * (1 - cape); }
  h += cape * (12 + 34 * fbm2(x / 50, z / 50, 3, 17)) * sst(BEACH_X - 20, BEACH_X + 40, x);
  return h;
};
/** England: a gentle park, the castle on its mound */
export const HE = (x: number, z: number) => { const d = Math.hypot(x - CASTLE[0], z - CASTLE[1]); return 1.6 * (fbm2(x / 60, z / 60, 3, 21) - 0.5) + 9 * sst(70, 26, d) + 0.004 * Math.hypot(x - ENG - 200, z) * sst(300, 900, Math.hypot(x - ENG - 200, z)) * 20; };
export const onRoad = (x: number, off = 0, y = 0): [number, number, number] => { const [dx, dz] = roadDir(x), px = x - dz * off, pz = roadZ(x) + dx * off; return [px, H(px, pz) + y, pz]; };
export const ground = (x: number, z: number, y = 0): [number, number, number] => [x, H(x, z) + y, z];
