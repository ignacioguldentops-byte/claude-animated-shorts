// The cast of "Al revés" (all our own designs; white bean heads for everyone, as in the house style).
import { Char } from "./toon";
const hs = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const pick = <T,>(a: T[], i: number, s: number) => a[Math.floor(hs(i, s) * a.length) % a.length];
export const PURPLE = "#5a3a9a", WHITE = "#f7f5ee", RED = "#c4202e", GOLDH = "#d9b24a", SAND = "#dcc48e";
const kit = (top: string, helm: string, stripe: string, pants: string, socks: string, num: string, x: Partial<Char> = {}): Char => ({ hat: { k: "helmet", c: helm, c2: stripe }, top, collar: stripe, num, legs: pants, shorts: pants, bare: true, socks, shoes: "#23202a", build: "stout", ...x });
export const MARSHALL: Char = kit(PURPLE, PURPLE, WHITE, WHITE, PURPLE, "70");
export const MARSHALL_BARE: Char = { ...MARSHALL, hat: undefined, hair: { k: "short", c: "#23202a" }, stubble: true };
export const MARSHALL_OLD: Char = { ...MARSHALL, stache: "#b9b6bd" };
export const MARSHALL_OLD_BARE: Char = { ...MARSHALL_BARE, hair: { k: "short", c: "#b9b6bd" }, stache: "#b9b6bd" };
export const viking = (i: number): Char => kit(PURPLE, PURPLE, WHITE, WHITE, PURPLE, String([81, 64, 53, 22, 10, 77, 30, 56][i % 8]), { build: i % 3 ? "stout" : "adult", stubble: hs(i, 3) < 0.3 });
export const niner = (i: number): Char => kit(RED, GOLDH, RED, SAND, RED, String([77, 17, 62, 34, 80, 51, 25, 44][i % 8]), { build: i % 3 ? "stout" : "adult", stache: hs(i, 4) < 0.2 ? "#3b2a1c" : undefined });
export const NINER_OLD: Char = { ...niner(0), stache: "#b9b6bd" };
export const OLDTIMER: Char = { hat: { k: "helmet", c: "#8a5a34", c2: "leather" }, top: "#3c4a6a", legs: "#d9c9a0", shorts: "#d9c9a0", bare: true, socks: "#3c4a6a", shoes: "#3a2a22", build: "stout" };
export const oldmate = (i: number): Char => ({ ...OLDTIMER, build: i % 2 ? "stout" : "adult", stache: i % 2 ? "#3b2a1c" : undefined });
export const COACH: Char = { hat: { k: "bucket", c: "#6a5a4a", c2: "#3a3028" }, glasses: "round", top: "#9a8a6a", collar: "#f7f5ee", tie: PURPLE, buttons: "#5a4a3a", legs: "#4a4038", shoes: "#2a2630", build: "stout" };
export const REF: Char = { hat: { k: "cap", c: "#f7f5ee" }, top: "#f7f5ee", pat: { k: "v", c: "#1c1a20" }, legs: "#f7f5ee", shorts: "#f7f5ee", bare: true, socks: "#1c1a20", shoes: "#1c1a20" };
export const POSTMAN: Char = { hat: { k: "cap", c: "#2f4f8a" }, top: "#2f4f8a", collar: "#f7f5ee", buttons: "#e8c45a", legs: "#2f4f8a", shoes: "#2a2630", stache: "#7a4a2a" };
const TOPS = ["#d95f43", "#3f8fc9", "#e9b93c", "#57a05a", "#8a5ac9", "#e07a9a", "#f4f1ea", "#3c4a6a", "#c96a2c", "#2f9a94"];
const HAIRS = ["#2a1d16", "#3b2a1c", "#16100c", "#7a4a2a", "#c9a24a", "#b9b6bd", "#5a2f1c"];
/** fans in the stands */
export const folk = (i: number): Char => {
  const top = pick(TOPS, i, 2), hr = hs(i, 5);
  const c: Char = { top, legs: pick(["#2c2a38", "#3b5b9a", "#4a3a30"], i, 6), build: hs(i, 7) < 0.25 ? "stout" : "adult" };
  if (hs(i, 4) < 0.3) c.pat = { k: pick(["v", "check", "h"] as const, i, 8), c: "rgba(30,20,40,0.4)" };
  if (hr < 0.25) c.hat = { k: pick(["bucket", "cap", "coppola"] as const, i, 9), c: pick(["#8a7a66", PURPLE, "#d9463f", "#5a5560"], i, 10) };
  else c.hair = { k: pick(["short", "side", "long", "bun", "curly", "bald"] as const, i, 11), c: pick(HAIRS, i, 10) };
  if (hs(i, 3) < 0.25) c.glasses = "round";
  if (hs(i, 13) < 0.2) c.stache = pick(HAIRS, i, 10);
  if (hs(i, 16) < 0.3) c.scarf = [PURPLE, WHITE];
  return c;
};
