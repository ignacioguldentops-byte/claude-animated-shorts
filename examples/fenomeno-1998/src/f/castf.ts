// The cast of "El Fenómeno y la final". Our own bean-head designs; nobody is a likeness of a real person. Every role
// has its own silhouette: hair, build, kit, glasses, moustache.
import { Char } from "./toon";
const WH = "#fbfaf2", BLK = "#23202a";
const SKL = ["#fbd3b8", "#f6c9a8", "#fde3cc", "#f1c9a2", "#f9c9ae", "#eebfa0"], SKD = ["#8f5d3e", "#a8744e", "#7a4c32", "#b98360", "#6a4028"];
const HC = ["#2a1d16", "#3a2a1e", "#16100c", "#5a3b22", "#8a5a34"];
const pick = <T,>(a: readonly T[], i: number) => a[((i % a.length) + a.length) % a.length];
export const YEL = "#f6d21a", GRN = "#2f8a3a", BLU = "#1f4fa8", FRB = "#22357e", FRR = "#d0342e";
/** the striker: brown skin, shaved head, yellow training shirt with a green collar, blue shorts */
export const R9_HOTEL: Char = { skin: "#a8744e", hair: { k: "short", c: "#16100c" }, brows: 1.2, top: YEL, collar: GRN, legs: "#a8744e", shorts: BLU, socks: WH, bare: true, shoes: WH };
/** in the clinic: a hospital gown over his shorts */
export const R9_GOWN: Char = { ...R9_HOTEL, top: "#cfe6ee", pat: { k: "dots", c: "#9fc4d4" }, collar: "#cfe6ee", shoes: WH };
/** match kit 1998: yellow shirt, green trim, number 9, blue shorts, white socks */
export const R9_KIT: Char = { ...R9_HOTEL, num: "9", socks: WH, shoes: BLK };
/** 2002: the same man with the famous little tuft at the front */
export const R9_2002: Char = { ...R9_KIT, hair: { k: "tuft", c: "#16100c" } };
/** his room-mate, the left-back: shorter and stocky, darker skin, shaved, blue training shirt */
export const LB_HOTEL: Char = { skin: "#7a4c32", hair: { k: "bald", c: "#16100c" }, build: "stout", brows: 1.4, top: BLU, collar: YEL, legs: "#7a4c32", shorts: WH, socks: WH, bare: true, shoes: WH };
/** team-mates at the hotel: training kits of yellow, blue and white */
export const mate = (i: number): Char => ({ skin: pick([...SKD, ...SKL], i * 3 + 1), hair: { k: pick(["curly", "quiff", "side", "dreads", "tuft"] as const, i), c: pick(HC, i) }, stache: i === 2 ? "#2a1d16" : undefined, stubble: i % 3 === 1, build: i % 4 === 3 ? "stout" : "adult",
  top: pick([BLU, YEL, WH, GRN], i), collar: pick([YEL, GRN, BLU, YEL], i), legs: pick([...SKD, ...SKL], i * 3 + 1), shorts: pick([WH, BLU, BLU, WH], i), socks: WH, bare: true, shoes: WH });
/** in match kit */
export const bra = (i: number): Char => ({ ...mate(i), top: YEL, collar: GRN, shorts: BLU, socks: WH, num: pick(["2", "4", "3", "5", "6", "8", "10", "7", "18", "20", "11"], i), shoes: BLK });
/** the keeper: grey jersey */
export const BRA_GK: Char = { skin: "#f1c9a2", hair: { k: "side", c: "#2a1d16" }, top: "#6a7480", collar: BLK, legs: "#f1c9a2", shorts: "#3a3f46", socks: "#6a7480", bare: true, shoes: BLK };
/** the coach: in his late sixties, white hair, big glasses, a blue tracksuit jacket */
export const COACH: Char = { skin: "#f6c9a8", hair: { k: "side", c: "#e9e6ee" }, glasses: "round", brows: 1.4, build: "stout", top: "#1f2f5c", collar: YEL, buttons: YEL, legs: "#1f2f5c", shoes: BLK };
/** the match official who takes the team sheet: dark suit, tie, a badge */
export const OFFICIAL: Char = { skin: "#fde3cc", hair: { k: "side", c: "#8a5a34" }, stache: "#8a5a34", top: "#2c2a38", collar: WH, tie: "#2f6a9a", pocket: true, legs: "#2c2a38", shoes: BLK };
/** the team doctor: grey beard, white coat, stethoscope */
export const DOCTOR: Char = { skin: "#f1c9a2", hair: { k: "bald", c: "#b9b3bd" }, beard: "#d9d5dd", glasses: "round", top: WH, buttons: "#c9d2de", collar: "#cfe0ea", necklace: "#3a3f46", pocket: true, legs: "#5a5a62", shoes: BLK };
/** a nurse at the clinic */
export const NURSE: Char = { skin: "#fbd3b8", hair: { k: "bun", c: "#5a3b22" }, top: "#9fd0c4", collar: WH, legs: "#9fd0c4", shoes: WH };
/** France 1998: blue shirts, white shorts, red socks */
export const fra = (i: number): Char => ({ skin: pick(["#fbd3b8", "#8f5d3e", "#f1c9a2", "#6a4028", "#f9c9ae"], i), hair: { k: pick(["short", "bald", "quiff", "side", "curly"] as const, i), c: pick(HC, i + 1) }, stubble: i % 2 === 0, build: i % 3 === 2 ? "stout" : "adult",
  top: FRB, collar: WH, legs: pick(["#fbd3b8", "#8f5d3e", "#f1c9a2", "#6a4028", "#f9c9ae"], i), shorts: WH, socks: FRR, bare: true, shoes: BLK });
/** the French playmaker who heads them in: tall, the top of his head bald */
export const FRA10: Char = { ...fra(1), skin: "#f1c9a2", hair: { k: "bald", c: "#3a2a1e" }, stubble: true, num: "10" };
/** Germany 2002: white shirts, black shorts; their keeper in green */
export const ger = (i: number): Char => ({ skin: pick(SKL, i + 2), hair: { k: pick(["side", "short", "quiff", "tuft"] as const, i), c: pick(["#c9a24a", "#5a3b22", "#8a5a34", "#2a1d16"], i) }, top: WH, collar: BLK, legs: pick(SKL, i + 2), shorts: BLK, socks: WH, bare: true, shoes: BLK });
export const GER_GK: Char = { skin: "#fde3cc", hair: { k: "short", c: "#d8b04a" }, brows: 1.5, build: "stout", top: "#3f9a4a", collar: BLK, legs: "#fde3cc", shorts: "#2a2e36", socks: "#3f9a4a", bare: true, shoes: BLK };
/** stadium fans of 1998 / 2002: yellow and green, blue white and red */
const FAN = [YEL, YEL, GRN, FRB, WH, FRR, YEL, BLU, WH];
export const fan98 = (i: number): Char => ({ skin: i % 3 === 1 ? pick(SKD, i) : pick(SKL, i), hair: { k: i % 4 === 2 ? "long" : i % 4 === 3 ? "bun" : pick(["short", "side", "curly", "quiff", "tuft"] as const, i), c: pick(HC, i + 2) }, build: i % 5 === 1 ? "stout" : i % 6 === 3 ? "kid" : "adult",
  hat: i % 5 === 0 ? { k: "cap", c: pick([YEL, FRB, WH], i) } : undefined, top: pick(FAN, i), collar: i % 2 ? GRN : undefined, scarf: i % 3 === 0 ? [pick([YEL, FRB], i), pick([GRN, WH], i)] : undefined, legs: pick(["#3b5b9a", "#2c2a38", "#5a4c40"], i), shoes: WH });
