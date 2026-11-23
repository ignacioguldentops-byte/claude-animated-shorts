// The cast of "El perro que encontró la Copa" (London, 1966). Our own bean-head designs; nobody is a likeness of a
// real person. Every role has its own silhouette: hat, hair, coat colour, build.
import { Char } from "./toon";
const WH = "#fbfaf2", BLK = "#23202a";
const SKL = ["#fbd3b8", "#f6c9a8", "#fde3cc", "#f1c9a2", "#f9c9ae", "#eebfa0"], SKD = ["#8f5d3e", "#a8744e", "#c98a60"];
const HC = ["#2a1d16", "#3a2a1e", "#5a3b22", "#16100c", "#8a5a34", "#c9a24a", "#b9b3bd", "#a8502a"];
const pick = <T,>(a: readonly T[], i: number) => a[((i % a.length) + a.length) % a.length];
/** Pickles' owner: young, dark quiff under a brown flat cap, navy donkey jacket, grey trousers */
export const OWNER: Char = { skin: "#f6c9a8", hair: { k: "quiff", c: "#2a1d16" }, hat: { k: "coppola", c: "#7a5a3a", c2: "#5a4028" }, top: "#24304a", collar: "#e9e4d6", vest: "#9a8a6a", legs: "#5a5a62", shoes: "#3a2a1e", brows: 1.2 };
/** the thief: beige trench coat, dark trilby pulled low, sunglasses, a thin moustache */
export const THIEF: Char = { skin: "#eebfa0", hair: { k: "short", c: "#16100c" }, hat: { k: "trilby", c: "#2c2a30", c2: "#5a2a2a" }, glasses: "sun", stache: "#16100c", top: "#b89a6a", belt: "#8a6a40", collar: WH, tie: "#5a2a2a", buttons: "#5a4028", legs: "#3a3438", shoes: BLK, brows: 1.4 };
/** the exhibition guard: navy uniform, peaked cap, grey walrus moustache, stout */
export const GUARD: Char = { skin: "#f1c9a2", hair: { k: "side", c: "#b9b3bd" }, hat: { k: "peaked", c: "#1f2a44", c2: "#1a1a20", c3: "#e8c45a" }, stache: "#d9d5dd", build: "stout", top: "#1f2a44", buttons: "#e8c45a", collar: WH, tie: BLK, legs: "#1f2a44", shoes: BLK, brows: 1.3 };
/** the football chairman: bald with grey sides, round glasses, pinstripe suit, red bow tie */
export const CHAIRMAN: Char = { skin: "#fbd3b8", hair: { k: "bald", c: "#b9b3bd" }, glasses: "round", build: "stout", top: "#2c3040", pat: { k: "v", c: "#4a5068" }, vest: "#2c3040", collar: WH, bow: "#b8262e", pocket: true, legs: "#2c3040", shoes: BLK, brows: 1.3 };
/** two detectives: grey and brown raincoats, trilbies */
export const DET1: Char = { skin: "#f9c9ae", hair: { k: "side", c: "#3a2a1e" }, hat: { k: "trilby", c: "#6a6a70", c2: "#2a2a30" }, stache: "#3a2a1e", top: "#8a8a86", belt: "#6a6a66", collar: WH, tie: "#2a3a5a", legs: "#3a3438", shoes: BLK };
export const DET2: Char = { skin: "#fde3cc", hair: { k: "short", c: "#a8502a" }, hat: { k: "trilby", c: "#5a4028", c2: "#2a1d16" }, top: "#7a5a3a", belt: "#5a4028", collar: WH, tie: "#7a2630", legs: "#4a4038", shoes: "#3a2a1e", build: "stout" };
/** the man they arrest: black leather jacket, greased quiff, stubble */
export const SUSPECT: Char = { skin: "#eebfa0", hair: { k: "quiff", c: "#16100c" }, stubble: true, top: "#1c1c22", collar: "#e9e4d6", legs: "#3a4660", shoes: BLK, brows: 1.4 };
/** visitors at the stamp exhibition: sixties coats and suits, bobs and beehives, a few hats */
export const visitor = (i: number): Char => i % 2 === 0
  ? { skin: pick(SKL, i), hair: { k: pick(["bun", "long", "bun"] as const, i), c: pick(HC, i + 1) }, hat: i % 6 === 4 ? { k: "beanie", c: "#e8c0c0", c2: "#c8342e" } : undefined, top: pick(["#c8342e", "#2f6f8a", "#e8b84a", "#6a8a4a", "#e8c0c0", "#7a2630"], i), skirt: pick(["#c8342e", "#2f6f8a", "#e8b84a", "#6a8a4a", "#e8c0c0", "#7a2630"], i), buttons: WH, necklace: i % 4 === 0 ? "#fbfbf6" : undefined, legs: "#d8b8a0", shoes: pick([BLK, "#7a2630", "#5a3b22"], i) }
  : { skin: i % 7 === 3 ? pick(SKD, i) : pick(SKL, i + 2), hair: { k: pick(["side", "short", "bald", "quiff", "curly"] as const, i), c: pick(HC, i + 3) }, hat: i % 5 === 1 ? { k: "trilby", c: pick(["#3a3438", "#6a5a48"], i), c2: BLK } : undefined, glasses: i % 4 === 3 ? "round" : undefined, stache: i % 3 === 0 ? pick(HC, i + 3) : undefined,
      top: pick(["#3a4660", "#5a4c40", "#2c2a38", "#6a6a70", "#4a5a3a"], i), collar: WH, tie: pick([BLK, "#7a2630", "#2f4f7a", "#c9a24a"], i), legs: pick(["#3a3438", "#4a4038"], i), shoes: BLK, build: i % 6 === 5 ? "stout" : "adult" };
/** the champions at their banquet: dark suits, white shirts, team ties, all different heads */
export const player = (i: number): Char => ({ skin: pick(SKL, i * 3), hair: { k: pick(["side", "short", "quiff", "curly", "bald", "side", "tuft"] as const, i), c: pick(HC, i * 2 + 1) }, stache: i === 4 ? "#3a2a1e" : undefined, brows: 1 + 0.1 * (i % 3),
  top: pick(["#1f2a44", "#23202a", "#2c3040"], i), collar: WH, tie: pick(["#b8262e", "#1f2f5c"], i), pocket: i % 2 === 0, legs: pick(["#1f2a44", "#23202a"], i), shoes: BLK, build: i % 5 === 2 ? "stout" : "adult" });
/** waiters: white jackets, black bow ties, hair slicked back */
export const waiter = (i: number): Char => ({ skin: pick(SKL, i + 1), hair: { k: pick(["side", "short"] as const, i), c: pick(HC, i) }, stache: i % 2 ? "#2a1d16" : undefined, top: WH, buttons: "#c9a24a", collar: WH, bow: BLK, legs: BLK, shoes: BLK });
/** ladies at the banquet: evening dresses */
export const lady66 = (i: number): Char => ({ skin: pick(SKL, i + 4), hair: { k: pick(["bun", "long"] as const, i), c: pick(HC, i + 5) }, top: pick(["#c8342e", "#2f6f8a", "#e8c45a", "#7a2a6a"], i), skirt: pick(["#c8342e", "#2f6f8a", "#e8c45a", "#7a2a6a"], i), necklace: "#fbfbf6", legs: "#d8b8a0", shoes: BLK });
