// The cast of "Sin límite" (our own bean-head designs; nobody is a likeness of a real person).
import { Char } from "./toon";
const WH = "#f7f5ee", CREAM = "#f1ecdc", NAVY = "#1f2f5c", GRN = "#1f6b3a", GOLD = "#e8c45a";
const SKL = ["#fbd3b8", "#f6c9a8", "#fde3cc", "#f1c9a2", "#f9c9ae", "#eebfa0"], SKD = ["#8f5d3e", "#a8744e", "#7a4c32", "#b98360"];
const HK = ["short", "side", "curly", "bald", "quiff", "tuft"] as const, HC = ["#5a3b22", "#c9a24a", "#2a1d16", "#8a5a34", "#b9772e", "#3a2a1e"];
const whites = { top: WH, collar: CREAM, buttons: "#d9d2c0", legs: "#e9e4d4", shoes: WH };
/** the visiting side: navy caps */
export const eng = (i: number): Char => ({ skin: SKL[i % 6], hair: { k: HK[i % 6], c: HC[i % 6] }, stache: i % 3 === 0 ? HC[i % 6] : undefined, build: i % 5 === 3 ? "stout" : "adult", hat: { k: "cap", c: NAVY, c2: GOLD }, ...whites });
/** the same man padded up to bat */
export const engBat = (i: number): Char => ({ ...eng(i), pads: "#fbfaf2" });
/** the home side: green caps */
export const saf = (i: number): Char => ({ skin: SKL[(i + 2) % 6], hair: { k: HK[(i + 3) % 6], c: HC[(i + 2) % 6] }, stache: i % 4 === 1 ? HC[(i + 2) % 6] : undefined, build: i % 5 === 2 ? "stout" : "adult", hat: { k: "cap", c: GRN, c2: GOLD }, ...whites });
export const safBat = (i: number): Char => ({ ...saf(i), pads: "#fbfaf2" });
/** captains in their blazers at the toss */
export const CAP_E: Char = { ...eng(0), top: NAVY, pat: { k: "v", c: "#c9d2ea" }, collar: WH, tie: "#b8362e", pocket: true };
export const CAP_S: Char = { ...saf(1), top: GRN, pat: { k: "v", c: GOLD }, collar: WH, tie: GOLD, pocket: true };
/** the umpire: long white coat, dark tie, wide hat */
export const UMP: Char = { skin: "#f6c9a8", hair: { k: "side", c: "#8a7f86" }, stache: "#8a7f86", build: "stout", hat: { k: "straw", c: "#fbfaf2", c2: "#23202a" }, top: "#fbfaf2", apron: "#fbfaf2", tie: "#23202a", collar: WH, legs: "#2c2a38", shoes: "#23202a" };
/** the man in the stand who has seen every ball: k = how long he has been there (0 fresh, 1 stubble, 2 long white beard) */
export const OLD = (k: number): Char => ({ skin: "#fbd3b8", hair: { k: "bald", c: "#b9b3bd" }, glasses: "round", stache: k < 2 ? "#8a7f86" : "#e9e6ee", stubble: k === 1, beard: k >= 2 ? "#f1eef5" : undefined, hat: { k: "straw", c: "#e9d9a8", c2: "#7a2630" }, top: "#b8a078", vest: "#7a2630", bow: "#23202a", collar: WH, legs: "#5a4c40", shoes: "#5a3b2a" });
/** his descendant of today, same nose, same patience */
export const OLD_NOW: Char = { skin: "#fbd3b8", hair: { k: "bald", c: "#b9b3bd" }, glasses: "round", stache: "#e9e6ee", beard: "#f1eef5", hat: { k: "bucket", c: "#f6c419" }, top: "#3fb0c9", pat: { k: "flower", c: "#fff3c0" }, legs: "#3a3028", shorts: "#e9dcc6", bare: true, shoes: "#f7f5ee" };
/** spectators of 1939 */
const SC = ["#e9dcc6", "#a8b8c8", "#c9b79c", "#d9a8a0", "#8a9a7a", "#f4f1ea", "#7a8a9a"], HAT = ["straw", "coppola", "bucket", "straw"] as const;
export const spect = (i: number): Char => ({ skin: i % 4 === 3 ? SKD[i % 4] : SKL[i % 6], hair: { k: i % 3 === 1 ? "bun" : HK[i % 6], c: HC[(i + 1) % 6] }, build: i % 5 === 1 ? "stout" : i % 7 === 4 ? "kid" : "adult", hat: i % 5 === 4 ? undefined : { k: HAT[i % 4], c: ["#e9d9a8", "#6a5a4a", "#f4f1ea", "#d9c9a0"][i % 4], c2: ["#7a2630", "#3a3438", "#3f8fc9", "#2f6a4a"][i % 4] },
  top: SC[i % 7], tie: i % 3 === 0 ? ["#7a2630", "#2f6a4a", "#1f2f5c"][i % 3] : undefined, vest: i % 4 === 2 ? "#8a7a66" : undefined, skirt: i % 3 === 1 ? ["#d9a8a0", "#a8b8c8", "#e8c9a0"][i % 3] : undefined, necklace: i % 3 === 1 ? "#fbfbf6" : undefined, collar: WH, legs: "#5a4c40", shoes: "#5a3b2a" });
/** spectators of today */
const MC = ["#e2453c", "#3f8fc9", "#f6c419", "#57a05a", "#f25c7a", "#f29a2e", "#7a5a9a"];
export const fanNow = (i: number): Char => ({ skin: i % 3 === 1 ? SKD[i % 4] : SKL[i % 6], hair: { k: i % 4 === 2 ? "long" : HK[i % 6], c: HC[(i + 2) % 6] }, build: i % 5 === 1 ? "stout" : i % 6 === 3 ? "kid" : "adult", hat: i % 3 === 0 ? { k: "cap", c: MC[(i + 3) % 7] } : i % 3 === 1 ? { k: "bucket", c: MC[(i + 1) % 7] } : undefined, glasses: i % 4 === 1 ? "sun" : undefined, top: MC[i % 7], num: i % 4 === 0 ? String(7 + i) : undefined, legs: "#3a3028", shorts: ["#3b5b9a", "#e9dcc6", "#23202a"][i % 3], bare: true, shoes: WH });
/** ground staff */
export const staff = (i: number): Char => ({ skin: SKD[i % 4], hair: { k: HK[i % 4], c: "#16100c" }, hat: { k: "coppola", c: ["#8a7a66", "#6a5a4a"][i % 2] }, top: ["#c9b79c", "#a8b8c8"][i % 2], vest: "#6a5a4a", collar: WH, legs: "#5a4c40", shoes: "#3a2a1e" });
/** the ship's officer and the station master */
export const OFFICER: Char = { skin: "#f6c9a8", hair: { k: "short", c: "#8a7f86" }, stache: "#8a7f86", hat: { k: "cap", c: "#fbfaf2", c2: NAVY }, top: "#fbfaf2", buttons: GOLD, collar: NAVY, pocket: true, legs: "#fbfaf2", shoes: "#23202a" };
export const MASTER: Char = { skin: "#fbd3b8", hair: { k: "side", c: "#5a3b22" }, stache: "#5a3b22", build: "stout", hat: { k: "cap", c: NAVY, c2: "#b8362e" }, top: NAVY, buttons: GOLD, collar: WH, tie: "#b8362e", legs: NAVY, shoes: "#23202a" };
