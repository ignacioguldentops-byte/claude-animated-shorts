// The cast of "Cómo nació el maratón" (our own bean-head designs; nobody is a likeness of a real person).
// Every role gets its own silhouette: hair, headgear, clothes and colour so the viewer tells them apart at a glance.
import { Char } from "./toon";
const WH = "#fbfaf2", BLK = "#23202a", LINEN = "#ece0c4", BRONZE = "#c9973f";
const SKL = ["#fbd3b8", "#f6c9a8", "#fde3cc", "#f1c9a2", "#f9c9ae", "#eebfa0"], SKT = ["#e3a77e", "#d89a6e", "#c98a60", "#e8b48e", "#b97a52"], SKD = ["#8f5d3e", "#a8744e", "#7a4c32"];
const HC = ["#2a1d16", "#3a2a1e", "#5a3b22", "#16100c", "#8a5a34", "#c9a24a", "#b9b3bd"];
const pick = <T,>(a: readonly T[], i: number) => a[((i % a.length) + a.length) % a.length];

// ---------------- 490 BC ----------------
/** the messenger: young, red headband, short linen tunic, red cape that streams behind him, sandals */
export const MESSENGER: Char = { skin: "#e3a77e", hair: { k: "curly", c: "#2a1d16" }, band: "#d0342e", top: LINEN, tunic: LINEN, belt: "#7a4b2a", cape: "#c0392b", legs: "#3a3028", bare: true, shoes: "#7a4b2a", brows: 1.2 };
/** hoplites: bronze cuirass, helmet pushed up with a crest, red tunic, bearded */
export const hoplite = (i: number): Char => ({ skin: pick(SKT, i), hair: { k: "curly", c: pick(HC, i) }, beard: i % 3 === 2 ? undefined : pick(HC, i + 1), beardLen: 0.5, stache: pick(HC, i + 1),
  hat: { k: "corinth", c: BRONZE, c2: pick(["#c8342e", "#23202a", "#ece6d8", "#2a5fb0", "#e8a33a"], i) }, top: BRONZE, muscle: true, pteruges: LINEN, tunic: pick(["#a8322a", "#7a2630", "#2f4f7a"], i), legs: "#3a3028", bare: true, socks: "#b08a50", shoes: "#6a4a2c", build: i % 4 === 1 ? "stout" : "adult" });
/** Athenians: chiton and himation in undyed linen, ochre, sea blue; beards, curls, a few bald heads; women with buns */
export const athenian = (i: number): Char => { const w = i % 3 === 1, col = pick([LINEN, "#d9b56a", "#7aa3c8", "#c98a6a", WH, "#a9b88a"], i);
  return w ? { skin: pick(SKL, i), hair: { k: i % 2 ? "bun" : "long", c: pick(HC, i + 2) }, band: i % 4 === 1 ? "#d8b04a" : undefined, top: col, skirt: col, sash: pick(["#7a2630", "#2f4f7a", "#5a7a3a"], i), necklace: i % 2 ? "#e8c45a" : undefined, legs: "#5a4c40", shoes: "#6a4a2c" }
    : { skin: pick(SKT, i + 1), hair: { k: pick(["curly", "short", "bald", "curly", "side"] as const, i), c: pick(HC, i) }, beard: i % 2 ? pick(HC, i + 3) : undefined, beardLen: 0.6, stache: pick(HC, i + 3), top: col, tunic: col, sash: pick([WH, "#7a2630", "#2f4f7a", LINEN], i + 1), legs: "#3a3028", bare: true, shoes: "#6a4a2c", build: i % 5 === 3 ? "stout" : "adult" }; };
/** Persian soldiers by the ships: soft caps with lappets, patterned coats, trousers */
export const persian = (i: number): Char => ({ skin: pick(SKT, i + 2), hair: { k: "curly", c: BLK }, beard: BLK, beardLen: 0.7, stache: BLK, hat: { k: "phrygian", c: pick(["#e8d9b0", "#b8452e", "#d8a03a"], i), c2: pick(["#2f4f7a", "#7a2630", "#2a6a4a"], i) },
  top: pick(["#2f4f7a", "#7a2630", "#2a6a4a", "#8a5a2a"], i), pat: { k: i % 2 ? "dots" : "check", c: pick(["#e8c45a", "#ece0c4"], i) }, belt: "#e8c45a", legs: pick(["#e8c45a", "#b8452e", "#ece0c4"], i + 1), shoes: "#6a4a2c" });
/** the historian: white beard, bald, a blue himation, a scroll */
export const HISTORIAN: Char = { skin: "#f1c9a2", hair: { k: "bald", c: "#d9d5dd" }, beard: "#eeebf2", stache: "#d9d5dd", build: "stout", top: WH, skirt: WH, sash: "#3f6f8a", legs: "#5a4c40", shoes: "#6a4a2c", brows: 1.4 };

// ---------------- 1896 ----------------
/** the linguist who proposed the race: grey beard, round glasses, top hat, frock coat; he brings the silver cup */
export const LINGUIST: Char = { skin: "#fbd3b8", hair: { k: "side", c: "#b9b3bd" }, stache: "#d9d5dd", beard: "#e9e6ee", beardLen: 0.7, glasses: "round", build: "stout", hat: { k: "top", c: BLK, c2: "#3a3438" }, top: "#2c2a38", vest: "#8a7a66", collar: WH, bow: BLK, legs: "#3a3438", shoes: BLK };
/** the water carrier who wins: moustache, white shirt, Greek-blue sash and shorts */
export const WATERMAN: Char = { skin: "#e8b48e", hair: { k: "side", c: "#16100c" }, stache: "#16100c", top: WH, collar: WH, sash: "#2a5fb0", shorts: "#2a5fb0", legs: "#3a3028", bare: true, socks: WH, shoes: "#2a1d16", brows: 1.25 };
/** the other runners of 1896: caps, headbands, striped vests, all different */
export const runner96 = (i: number): Char => ({ skin: i % 6 === 4 ? pick(SKD, i) : pick(SKL, i), hair: { k: pick(["short", "quiff", "curly", "side", "tuft", "short"] as const, i), c: pick(HC, i) },
  stache: i % 3 === 0 ? pick(HC, i) : undefined, hat: i % 4 === 1 ? { k: "cap", c: pick([WH, "#c8342e", "#2f4f7a"], i), c2: "#c9c4b4" } : undefined, band: i % 4 === 3 ? pick(["#c8342e", WH, "#2a6a4a"], i) : undefined,
  top: pick([WH, "#f1ecdc", "#e9e4f0", WH], i), pat: i % 5 === 2 ? { k: "h", c: pick(["#c8342e", "#2f4f7a"], i) } : undefined, collar: WH, sash: i % 5 === 4 ? pick(["#c8342e", "#2a6a4a"], i) : undefined,
  shorts: pick([BLK, WH, "#1f2f5c", "#7a2630", "#2c2a38"], i), legs: "#3a3028", bare: true, socks: pick([BLK, "#7a2630", WH], i), shoes: "#3a2a1e" });
/** Greek villagers and spectators: fezzes, flat caps, boaters, kerchiefs; fustanella white for some */
export const greek = (i: number): Char => { const w = i % 3 === 2;
  return w ? { skin: pick(SKL, i + 1), hair: { k: "bun", c: pick(HC, i) }, hat: i % 2 ? { k: "scarf", c: pick(["#23202a", "#7a2630", "#2f4f7a"], i), c2: "#e8c45a" } : undefined, top: pick(["#7a2630", "#2f4f7a", "#5a4c40", WH], i), skirt: pick(["#23202a", "#5a4c40", "#2f4f7a"], i), apron: i % 2 ? WH : undefined, legs: "#5a4c40", shoes: BLK }
    : { skin: pick(SKT, i + 3), hair: { k: pick(["short", "side", "curly"] as const, i), c: pick(HC, i + 1) }, stache: i % 2 ? undefined : pick(HC, i + 1), hat: pick([{ k: "fez", c: "#b8262e", c2: BLK }, { k: "coppola", c: "#5a4c40" }, { k: "straw", c: "#e9d9a8", c2: "#2f4f7a" }, { k: "bowler", c: BLK }] as const, i),
      top: pick(["#2c2a38", WH, "#5a4c40", "#3a4660"], i), vest: i % 2 ? pick(["#7a2630", BLK], i) : undefined, collar: WH, legs: pick(["#3a3438", WH, "#5a4c40"], i), shoes: BLK, build: i % 4 === 1 ? "stout" : "adult" }; };
/** officers in dark blue with gold */
export const officer = (i: number): Char => ({ skin: pick(SKL, i), hair: { k: "side", c: pick(HC, i) }, stache: pick(HC, i), hat: { k: "cap", c: "#23304a", c2: "#e8c45a" }, top: "#23304a", buttons: "#e8c45a", belt: "#e8c45a", collar: "#e8c45a", legs: "#23304a", shoes: BLK });
export const STARTER: Char = { skin: "#f6c9a8", hair: { k: "side", c: "#5a3b22" }, stache: "#5a3b22", hat: { k: "straw", c: "#e9d9a8", c2: "#2a5fb0" }, top: WH, buttons: "#c9a24a", collar: WH, bow: "#2a5fb0", legs: WH, shoes: BLK };
export const TAVERNER: Char = { skin: "#d89a6e", hair: { k: "bald", c: "#3a2a1e" }, stache: "#3a2a1e", build: "stout", hat: { k: "fez", c: "#b8262e", c2: BLK }, top: WH, vest: "#23202a", apron: "#ece0c4", legs: "#3a3438", shoes: BLK };

// ---------------- 1908 ----------------
export const RUNNER08: Char = { skin: "#f6c9a8", hair: { k: "short", c: "#16100c" }, stache: "#16100c", band: WH, top: WH, collar: WH, shorts: "#b8262e", legs: "#3a3028", bare: true, socks: BLK, shoes: BLK, brows: 1.2 };
export const runner08 = (i: number): Char => ({ ...runner96(i + 7), band: undefined, hat: i % 3 === 0 ? { k: "cap", c: WH, c2: "#c9c4b4" } : undefined });
/** stewards in boaters and striped blazers */
export const steward = (i: number): Char => ({ skin: pick(SKL, i + 2), hair: { k: pick(["side", "short", "quiff"] as const, i), c: pick(HC, i + 4) }, stache: i % 2 ? pick(HC, i + 4) : undefined, hat: { k: "straw", c: "#e9d9a8", c2: pick(["#7a2630", "#1f2f5c", "#2a6a4a"], i) },
  top: pick(["#1f2f5c", "#7a2630", WH], i), pat: { k: "v", c: pick([WH, "#e8c45a"], i) }, collar: WH, tie: pick(["#7a2630", BLK], i), legs: WH, shoes: BLK, build: i % 3 === 2 ? "stout" : "adult" });
/** a queen in the royal box: tiara, pearls, lilac */
export const QUEEN: Char = { skin: "#fde3cc", hair: { k: "bun", c: "#8a7f86" }, hat: { k: "tiara", c: "#f2c64a" }, top: "#cbb7e3", skirt: "#cbb7e3", necklace: "#fbfbf6", collar: WH, legs: "#5a4c40", shoes: "#5a3b2a" };
export const lady08 = (i: number): Char => ({ skin: pick(SKL, i), hair: { k: "bun", c: pick(HC, i + 1) }, hat: { k: pick(["straw", "bowler", "top"] as const, i), c: pick(["#f4efe2", "#7a2630", "#2f4f7a", "#e9d9a8"], i), c2: pick(["#c8342e", "#e8c45a", WH], i) }, top: pick(["#f7f3ea", "#cbb7e3", "#a9c8d8", "#e8c0c0"], i), skirt: pick(["#f7f3ea", "#5a4c40", "#2f4f7a"], i), necklace: i % 2 ? "#fbfbf6" : undefined, legs: "#5a4c40", shoes: "#5a3b2a" });
export const gent08 = (i: number): Char => ({ skin: pick(SKL, i + 3), hair: { k: pick(["side", "short", "bald", "quiff"] as const, i), c: pick(HC, i + 2) }, stache: i % 2 ? pick(HC, i + 2) : undefined, hat: { k: pick(["bowler", "straw", "top", "coppola"] as const, i), c: pick([BLK, "#e9d9a8", BLK, "#5a4c40"], i), c2: "#3a3438" }, top: pick(["#2c2a38", "#3a4660", "#5a4c40", "#1f2f5c"], i), collar: WH, tie: pick([BLK, "#7a2630"], i), legs: "#3a3438", shoes: BLK, build: i % 4 === 2 ? "stout" : "adult" });
