// The cast of "La servilleta" (all our own designs; no real likenesses).
import { Char } from "./toon";
const hs = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const pick = <T,>(a: T[], i: number, s: number) => a[Math.floor(hs(i, s) * a.length) % a.length];
export const SKY = "#62b5e5";
export const GENNARO: Char = { hair: { k: "bald", c: "#2a1d16" }, stache: "#2a1d16", top: "#f6f2e8", vest: "#2c2a38", bow: "#cf3a3a", buttons: "#e8c45a", legs: "#2c2a38", build: "stout" };
export const GENNARO_APRON: Char = { ...GENNARO, apron: "#fbf8f0", buttons: undefined };
export const GENNARO_OLD: Char = { ...GENNARO_APRON, hair: { k: "bald", c: "#b9b6bd" }, stache: "#c9c6cc", glasses: "round" };
export const DIEGO: Char = { hair: { k: "curly", c: "#2a1b17" }, top: SKY, collar: "#fbfbf6", num: "10", legs: "#1d2233", build: "stout", shorts: "#fbfbf6", bare: true, socks: SKY, skin: "#fbf1e6" };
export const DIEGO_TRACK: Char = { hair: { k: "curly", c: "#2a1b17" }, top: "#2b4fa8", collar: "#fbfbf6", pat: undefined, legs: "#2b4fa8", build: "stout", skin: "#fbf1e6", necklace: "#e8c45a" };
export const WIFE: Char = { hair: { k: "bun", c: "#8a3b24" }, earring: "#f2c64a", top: "#d9486a", pat: { k: "flower", c: "#fff4f0" }, skirt: "#d9486a", apron: "#f3efe4", legs: "#3b2a30", shoes: "#7a2f3a" };
export const NONNA: Char = { hat: { k: "scarf", c: "#6a4aa8", c2: "#f1e9ff" }, hair: { k: "short", c: "#cfcbd2" }, glasses: "round", top: "#3a3644", skirt: "#3a3644", necklace: "#f4f1ea", legs: "#3a3644", shoes: "#2a2630", build: "kid" };
export const TOURIST: Char = { hat: { k: "bucket", c: "#f2e3b6", c2: "#d95f43" }, glasses: "sun", top: "#f29a2e", pat: { k: "flower", c: "#fff7e0" }, shorts: "#e9e2cf", bare: true, socks: "#ffffff", legs: "#e9e2cf", shoes: "#7a5a3a", skin: "#ffe9dc" };
export const TOURIST2: Char = { hat: { k: "cap", c: "#d9463f" }, hair: { k: "short", c: "#d6b46a" }, top: "#3fa37a", pat: { k: "h", c: "#f4f1ea" }, legs: "#3b5b9a", shoes: "#f4f1ea" };
export const ATTENDANT: Char = { hair: { k: "bun", c: "#2a1d16" }, top: "#2b4fa8", scarf: ["#d9463f", "#ffffff"], skirt: "#2b4fa8", legs: "#2a2630", buttons: "#e8c45a" };
const TOPS = ["#d95f43", "#3f8fc9", "#e9b93c", "#57a05a", "#8a5ac9", "#e07a9a", "#f4f1ea", "#3c4a6a", "#c96a2c", "#2f9a94"];
const HAIRS = ["#2a1d16", "#3b2a1c", "#16100c", "#7a4a2a", "#c9a24a", "#b9b6bd", "#5a2f1c"];
/** deterministic townsfolk / fans; fan = sky-blue scarf or shirt */
export const folk = (i: number, fan = false): Char => {
  const top = fan && hs(i, 1) < 0.55 ? SKY : pick(TOPS, i, 2), r = hs(i, 3), pk = hs(i, 4), hr = hs(i, 5);
  const c: Char = { top, legs: pick(["#2c2a38", "#3b5b9a", "#4a3a30", "#3a4438", "#5a5560"], i, 6), build: hs(i, 7) < 0.25 ? "stout" : "adult" };
  if (pk < 0.22) c.pat = { k: "v", c: top === SKY ? "#fbfbf6" : pick(["#fbfbf6", "#2c2a38", "#ffe07a"], i, 8) };
  else if (pk < 0.38) c.pat = { k: "check", c: "rgba(30,20,40,0.45)" };
  else if (pk < 0.5) c.pat = { k: "h", c: pick(["#fbfbf6", "#2c2a38"], i, 8) };
  else if (pk < 0.58) c.pat = { k: "dots", c: "#fbfbf6" };
  if (hr < 0.16) c.hat = { k: "beanie", c: pick(["#e9b93c", SKY, "#d9463f", "#57a05a"], i, 9) };
  else if (hr < 0.3) c.hat = { k: "coppola", c: pick(["#8a7a66", "#5a5560", "#6a5a4a"], i, 9) };
  else if (hr < 0.4) c.hat = { k: "cap", c: pick([SKY, "#d9463f", "#2c2a38"], i, 9) };
  else if (hr < 0.48) { c.hair = { k: "bald", c: pick(HAIRS, i, 10) }; }
  else c.hair = { k: pick(["short", "side", "short", "long", "bun", "side"] as const, i, 11), c: pick(HAIRS, i, 10) };
  if (c.hat && hs(i, 12) < 0.5) c.hair = undefined;
  if (r < 0.2) c.glasses = "round"; else if (r < 0.26) c.glasses = "sun";
  if (hs(i, 13) < 0.2 && c.hair?.k !== "long" && c.hair?.k !== "bun") c.stache = pick(HAIRS, i, 10);
  if (c.hair?.k === "long" || c.hair?.k === "bun") { if (hs(i, 14) < 0.6) c.skirt = top; if (hs(i, 15) < 0.4) c.earring = "#f2c64a"; }
  if (fan && hs(i, 16) < 0.5) c.scarf = [SKY, "#fbfbf6"];
  else if (hs(i, 17) < 0.14) c.vest = shadeHex(top); else if (hs(i, 18) < 0.12) c.tie = "#c9373a"; else if (hs(i, 19) < 0.2) c.buttons = "#f4f1ea";
  if (hs(i, 20) < 0.15) c.stubble = true;
  return c;
};
const shadeHex = (h: string) => { const n = parseInt(h.slice(1), 16); const f = (v: number) => Math.round(v * 0.6).toString(16).padStart(2, "0"); return "#" + f(n >> 16) + f((n >> 8) & 255) + f(n & 255); };

// ---- La servilleta ----
export const BLAU = "#1f3f9a", GRANA = "#a5003c";
export const PERE: Char = { hair: { k: "side", c: "#3b2a1c" }, stache: "#3b2a1c", top: "#fbf8f0", vest: "#7a2f3a", bow: "#241726", apron: "#fbf8f0", legs: "#2c2a38" };
export const PERE_OLD: Char = { ...PERE, hair: { k: "side", c: "#c9c6cc" }, stache: "#d6d3d9", glasses: "round", build: "stout" };
export const DIRECTOR: Char = { hair: { k: "side", c: "#4a3426" }, glasses: "round", top: "#5a5f74", vest: "#3f4356", tie: GRANA, collar: "#fbfbf6", scarf: [GRANA, BLAU], legs: "#3f4356", build: "stout" };
export const AGENT1: Char = { hair: { k: "bald", c: "#2a1d16" }, stache: "#2a1d16", top: "#8a5a34", vest: "#6a4226", tie: "#e9b93c", collar: "#fbfbf6", legs: "#5a3b22", build: "stout" };
export const AGENT2: Char = { hair: { k: "curly", c: "#16100c" }, glasses: "sun", top: "#2c3a5a", tie: "#62b5e5", collar: "#fbfbf6", legs: "#2c3a5a" };
export const KID: Char = { hair: { k: "short", c: "#5a3b22" }, top: "#c9373a", pat: { k: "v", c: "#241726" }, shorts: "#241726", bare: true, socks: "#c9373a", legs: "#241726", build: "kid", skin: "#fbefe2" };
export const KID_BARCA: Char = { ...KID, top: GRANA, pat: { k: "v", c: BLAU }, shorts: BLAU, socks: BLAU, num: "10", name: "MESSI" };
export const STAR: Char = { hair: { k: "side", c: "#4a3020" }, beard: "#4a3020", top: GRANA, pat: { k: "v", c: BLAU }, num: "10", name: "MESSI", shorts: BLAU, bare: true, socks: BLAU, legs: BLAU, skin: "#fbefe2" };
export const STAR_ALBI: Char = { ...STAR, top: "#8ec9ee", pat: { k: "v", c: "#ffffff" }, shorts: "#241726", socks: "#ffffff", legs: "#241726", cape: ["#17141d", "#e9b93c"] };
export const MATE_ALBI = (i: number): Char => ({ ...STAR_ALBI, beard: undefined, cape: undefined, name: undefined, num: ["7", "11", "23", "24", "9"][i % 5], hair: { k: (["curly", "short", "long", "bald", "tuft"] as const)[i % 5], c: ["#2a1b17", "#5a3b22", "#c9a05a", "#2a1b17", "#3a2a1f"][i % 5] }, skin: ["#fbefe2", "#e9c6a0", "#fbf1e6", "#c98d62", "#fbefe2"][i % 5], build: i % 3 === 2 ? "stout" : "adult" });
export const AUCTIONEER: Char = { hair: { k: "bald", c: "#b9b6bd" }, stache: "#b9b6bd", glasses: "round", top: "#fbfbf6", vest: "#241726", bow: "#241726", buttons: "#e8c45a", legs: "#241726", build: "stout" };
/** big kids in other clubs' kits (generic colours) */
export const bigKid = (i: number): Char => ({ hair: { k: (["short", "tuft", "side", "curly"] as const)[i % 4], c: ["#2a1d16", "#7a4a2a", "#c9a24a", "#16100c"][i % 4] }, top: ["#2f8a4a", "#e9b93c", "#3f8fc9", "#8a5ac9"][i % 4], pat: i % 2 ? { k: "h", c: "#fbfbf6" } : undefined, shorts: "#fbfbf6", bare: true, socks: ["#2f8a4a", "#e9b93c", "#3f8fc9", "#8a5ac9"][i % 4], legs: "#fbfbf6", skin: ["#fbefe2", "#e2b088", "#f1c9a2", "#c99067"][i % 4] });
