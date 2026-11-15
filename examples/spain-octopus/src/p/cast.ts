// The cast of "El pulpo" (all our own designs).
import { Char } from "./toon";
const hs = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const pick = <T,>(a: T[], i: number, s: number) => a[Math.floor(hs(i, s) * a.length) % a.length];
export const RED = "#c8102e", NAVY = "#1d2a5c", GOLD = "#f6c419", ORANGE = "#f36c21";
export const MANOLO: Char = { hat: { k: "boina", c: "#23202a" }, hair: { k: "short", c: "#b9b6bd" }, stache: "#b9b6bd", stubble: true, top: "#3f6fb0", pat: { k: "check", c: "rgba(250,250,255,0.5)" }, apron: "#fbf8f0", legs: "#4a4038", shoes: "#3a2a22", build: "stout" };
export const KEEPER: Char = { hat: { k: "cap", c: "#1f8a8a" }, hair: { k: "short", c: "#c9a24a" }, glasses: "round", top: "#1f8a8a", collar: "#fbfbf6", pocket: true, legs: "#3a3f52", shoes: "#2a2630" };
export const REPORTER: Char = { hair: { k: "long", c: "#7a4a2a" }, top: "#d9486a", vest: "#3c4a6a", legs: "#3c4a6a", earring: "#f2c64a" };
export const CAMERAMAN: Char = { hat: { k: "cap", c: "#2c2a38" }, stubble: true, top: "#5a5560", vest: "#3a3f38", legs: "#3a4438", build: "stout" };
export const GUARD: Char = { hair: { k: "bald", c: "#2a1d16" }, glasses: "sun", top: "#23232c", collar: "#fbfbf6", tie: "#101016", legs: "#23232c", shoes: "#101016", build: "stout" };
export const GUARD2: Char = { ...GUARD, hair: { k: "short", c: "#16100c" }, skin: "#ecd0b6" };
export const MAYOR: Char = { hair: { k: "side", c: "#b9b6bd" }, glasses: "round", stache: "#b9b6bd", top: "#4a5568", collar: "#fbfbf6", tie: RED, necklace: "#e8c45a", legs: "#4a5568", shoes: "#2a2630", build: "stout" };
export const BOSS: Char = { hair: { k: "side", c: "#16100c" }, glasses: "sun", top: "#2b3a6a", collar: "#fbfbf6", tie: GOLD, buttons: "#e8c45a", legs: "#2b3a6a", shoes: "#3a2a22" };
export const PLAYER6: Char = { hair: { k: "bald", c: "#8a6a4a" }, top: NAVY, collar: RED, num: "6", legs: NAVY, shorts: NAVY, bare: true, socks: NAVY, shoes: "#f4f1ea", skin: "#fff1e6" };
export const spain = (i: number): Char => ({ hair: { k: pick(["short", "side", "curly", "short", "long"] as const, i, 1), c: pick(["#2a1d16", "#3b2a1c", "#16100c", "#7a4a2a"], i, 2) }, top: RED, collar: GOLD, num: String([1, 3, 5, 7, 8, 11, 14, 16][i % 8]), legs: NAVY, shorts: NAVY, bare: true, socks: "#16100c", shoes: "#f4f1ea", stubble: hs(i, 3) < 0.4 });
export const KEEPER_ES: Char = { hair: { k: "short", c: "#2a1d16" }, top: "#57b85a", collar: "#16100c", num: "1", legs: "#57b85a", shorts: "#57b85a", bare: true, socks: "#57b85a", shoes: "#f4f1ea", stubble: true };
export const dutch = (i: number): Char => ({ hair: { k: pick(["short", "bald", "side"] as const, i, 1), c: pick(["#c9a24a", "#7a4a2a", "#2a1d16"], i, 2) }, top: ORANGE, collar: "#16100c", num: String([3, 4, 2, 6][i % 4]), legs: ORANGE, shorts: ORANGE, bare: true, socks: ORANGE, shoes: "#2a2630" });
export const KEEPER_NL: Char = { hair: { k: "short", c: "#c9a24a" }, top: "#8a8f9a", collar: "#16100c", num: "1", legs: "#8a8f9a", shorts: "#8a8f9a", bare: true, socks: "#8a8f9a", shoes: "#2a2630" };
const TOPS = ["#d95f43", "#3f8fc9", "#e9b93c", "#57a05a", "#8a5ac9", "#e07a9a", "#f4f1ea", "#3c4a6a", "#c96a2c", "#2f9a94"];
const HAIRS = ["#2a1d16", "#3b2a1c", "#16100c", "#7a4a2a", "#c9a24a", "#b9b6bd", "#5a2f1c"];
const shadeHex = (h: string) => { const n = parseInt(h.slice(1), 16); const f = (v: number) => Math.round(v * 0.6).toString(16).padStart(2, "0"); return "#" + f(n >> 16) + f((n >> 8) & 255) + f(n & 255); };
/** deterministic people. kind: "town" (villagers), "es" (Spain fans: red shirts, red-yellow scarves), "de" (Germany fans: white shirts, black-red-gold) */
export const folk = (i: number, kind: "town" | "es" | "de" = "town"): Char => {
  const es = kind === "es", de = kind === "de";
  const top = es && hs(i, 1) < 0.7 ? RED : de && hs(i, 1) < 0.75 ? "#f7f5ee" : pick(TOPS, i, 2), r = hs(i, 3), pk = hs(i, 4), hr = hs(i, 5);
  const c: Char = { top, legs: pick(["#2c2a38", "#3b5b9a", "#4a3a30", "#3a4438", "#5a5560"], i, 6), build: hs(i, 7) < 0.25 ? "stout" : hs(i, 7) > 0.9 ? "kid" : "adult" };
  if (de && top === "#f7f5ee") { c.pat = { k: "h", c: "#1c1a20" }; c.collar = "#1c1a20"; }
  else if (es && top === RED) { if (pk < 0.5) c.collar = GOLD; if (pk < 0.25) c.pat = { k: "v", c: GOLD }; }
  else if (pk < 0.22) c.pat = { k: "v", c: pick(["#fbfbf6", "#2c2a38", "#ffe07a"], i, 8) };
  else if (pk < 0.38) c.pat = { k: "check", c: "rgba(30,20,40,0.45)" };
  else if (pk < 0.5) c.pat = { k: "h", c: pick(["#fbfbf6", "#2c2a38"], i, 8) };
  else if (pk < 0.58) c.pat = { k: "dots", c: "#fbfbf6" };
  const hatC = es ? pick([RED, GOLD, RED, "#2c2a38"], i, 9) : de ? pick(["#1c1a20", "#d0202a", GOLD], i, 9) : pick(["#e9b93c", "#3f8fc9", "#d9463f", "#57a05a"], i, 9);
  if (hr < 0.16) c.hat = { k: "beanie", c: hatC };
  else if (hr < 0.3 && !es && !de) c.hat = { k: kind === "town" && hs(i, 21) < 0.6 ? "boina" : "coppola", c: pick(["#2c2a38", "#5a5560", "#6a5a4a"], i, 9) };
  else if (hr < 0.4) c.hat = { k: "cap", c: hatC };
  else if (hr < 0.48) c.hair = { k: "bald", c: pick(HAIRS, i, 10) };
  else c.hair = { k: pick(["short", "side", "short", "long", "bun", "side", "curly"] as const, i, 11), c: de && hs(i, 22) < 0.6 ? "#d6b46a" : pick(HAIRS, i, 10) };
  if (c.hat && hs(i, 12) < 0.5) c.hair = undefined;
  if (r < 0.2) c.glasses = "round"; else if (r < 0.26) c.glasses = "sun";
  if (hs(i, 13) < 0.2 && c.hair?.k !== "long" && c.hair?.k !== "bun") c.stache = pick(HAIRS, i, 10);
  if (c.hair?.k === "long" || c.hair?.k === "bun") { if (hs(i, 14) < 0.6) c.skirt = top; if (hs(i, 15) < 0.4) c.earring = "#f2c64a"; }
  if (es && hs(i, 16) < 0.55) c.scarf = [RED, GOLD]; else if (de && hs(i, 16) < 0.55) c.scarf = ["#d0202a", GOLD];
  else if (hs(i, 17) < 0.14) c.vest = shadeHex(top); else if (hs(i, 18) < 0.12) c.tie = "#c9373a"; else if (hs(i, 19) < 0.2) c.buttons = "#f4f1ea";
  if (hs(i, 20) < 0.15) c.stubble = true;
  return c;
};
