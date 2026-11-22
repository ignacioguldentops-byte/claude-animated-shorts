// The cast of "Media carrera en coche" (our own bean-head designs; nobody is a likeness of a real person).
import { Char } from "./toon";
const WH = "#fbfaf2", BLK = "#23202a";
const SKL = ["#fbd3b8", "#f6c9a8", "#fde3cc", "#f1c9a2", "#f9c9ae", "#eebfa0"], SKD = ["#8f5d3e", "#a8744e", "#7a4c32", "#b98360"];
const HK = ["short", "side", "curly", "quiff", "tuft", "short"] as const, HC = ["#3a2a1e", "#5a3b22", "#2a1d16", "#8a5a34", "#16100c", "#c9a24a"];
const SHORTS = ["#2c2a38", WH, "#1f2f5c", "#7a2630", "#2c2a38", "#3a4660"];
/** a marathon runner of 1904: vest, shorts to the knee, dark socks */
export const runner = (i: number): Char => ({ skin: i % 5 === 3 ? SKD[i % 4] : SKL[i % 6], hair: { k: HK[i % 6], c: HC[i % 6] }, stache: i % 3 === 0 ? HC[i % 6] : undefined, build: "adult", hat: i % 4 === 1 ? { k: "cap", c: WH, c2: "#c9c4b4" } : undefined,
  top: [WH, "#f1ecdc", WH, "#e9e4f0"][i % 4], pat: i % 5 === 2 ? { k: "h", c: "#c8342e" } : undefined, collar: WH, legs: "#3a3028", shorts: SHORTS[i % 6], socks: ["#2c2a38", "#7a2630", WH][i % 3], shoes: "#3a2a1e" });
/** the man who rode in the car: white vest, black shorts, curly hair */
export const LORZ: Char = { skin: "#f6c9a8", hair: { k: "curly", c: "#2a1d16" }, top: WH, collar: WH, legs: "#3a3028", shorts: "#23202a", socks: "#23202a", shoes: "#3a2a1e" };
/** the Cuban postman: long-sleeved white shirt, trousers cut off at the knee, a beret, street shoes */
export const CARTERO: Char = { skin: "#d8a07a", hair: { k: "short", c: "#16100c" }, stache: "#16100c", hat: { k: "boina", c: BLK }, top: WH, buttons: "#c9c4b4", collar: WH, legs: "#3a3028", shorts: "#3a4660", socks: "#5a4c40", shoes: "#2a1d16" };
/** the real winner, pale and done in */
export const HICKS: Char = { skin: "#f4e2d6", hair: { k: "side", c: "#8a5a34" }, stache: "#8a5a34", top: WH, collar: WH, legs: "#3a3028", shorts: "#1f2f5c", socks: "#1f2f5c", shoes: "#3a2a1e" };
/** the runner the dogs chase */
export const TAU: Char = { skin: SKD[2], hair: { k: "short", c: "#16100c" }, top: "#f1ecdc", collar: WH, legs: "#3a3028", shorts: WH, socks: WH, shoes: "#3a2a1e" };
/** trainers in suits and bowlers */
export const trainer = (i: number): Char => ({ skin: SKL[(i + 2) % 6], hair: { k: HK[(i + 1) % 6], c: HC[(i + 1) % 6] }, stache: HC[(i + 1) % 6], build: i ? "stout" : "adult", hat: { k: "bowler", c: BLK, c2: "#3a3438" }, top: ["#3a3438", "#5a4c40"][i % 2], vest: "#7a2630", collar: WH, tie: BLK, legs: ["#3a3438", "#5a4c40"][i % 2], shoes: BLK });
/** officials: white jackets and boaters */
export const official = (i: number): Char => ({ skin: SKL[(i + 4) % 6], hair: { k: HK[(i + 3) % 6], c: "#8a7f86" }, stache: i % 2 ? "#8a7f86" : undefined, build: i % 2 ? "stout" : "adult", hat: { k: "straw", c: "#e9d9a8", c2: ["#7a2630", "#1f2f5c"][i % 2] }, top: "#f4efe2", buttons: "#c9a24a", collar: WH, tie: ["#7a2630", "#1f2f5c"][i % 2], legs: "#d8d0c0", shoes: "#5a3b2a" });
/** the organiser with his stopwatch: top hat, frock coat, grey beard */
export const ORGANIZER: Char = { skin: "#f6c9a8", hair: { k: "side", c: "#b9b3bd" }, stache: "#d9d5dd", beard: "#e9e6ee", build: "stout", hat: { k: "top", c: BLK, c2: "#3a3438" }, top: "#2c2a38", vest: "#8a7a66", collar: WH, bow: BLK, legs: "#3a3438", shoes: BLK };
/** chauffeurs: dusters, goggles, flat caps */
export const driver = (i: number): Char => ({ skin: SKL[(i * 2) % 6], hair: { k: "short", c: HC[i % 6] }, stache: i % 2 ? HC[i % 6] : undefined, glasses: "round", hat: { k: "coppola", c: ["#5a4c40", "#3a3438", "#8a7a66"][i % 3] }, top: "#d8c8a6", collar: "#c9b48c", buttons: "#5a4c40", legs: "#5a4c40", shoes: BLK });
/** the lady with the laurel wreath */
export const LADY: Char = { skin: "#fde3cc", hair: { k: "bun", c: "#8a5a34" }, hat: { k: "straw", c: "#f4efe2", c2: "#c8342e" }, top: "#f7f3ea", skirt: "#f7f3ea", collar: WH, necklace: "#fbfbf6", legs: "#5a4c40", shoes: "#5a3b2a" };
export const PHOTOG: Char = { skin: "#fbd3b8", hair: { k: "curly", c: "#8a5a34" }, stache: "#8a5a34", hat: { k: "bowler", c: "#5a4c40" }, top: "#8a7a66", vest: "#3a4660", collar: WH, bow: BLK, legs: "#5a4c40", shoes: BLK };
