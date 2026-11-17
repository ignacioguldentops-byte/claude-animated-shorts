// The cast of "Hielo caliente" (our own bean-head designs; nobody is a likeness of a real person).
import { Char } from "./toon";
const BLK = "#23202a", GOLD = "#f6c419", GRN = "#1f8a3a", WHITE = "#f7f5ee";
const HELM = { k: "helmet" as const, c: BLK, c2: GOLD, c3: GRN };
type Who = { skin: string; hair: Char["hair"]; build?: Char["build"]; stache?: string; stubble?: boolean; brows?: number };
// the four of the sled + the brother
export const WHO: Who[] = [
  { skin: "#8f5d3e", hair: { k: "short", c: "#16100c" }, stache: "#16100c" },                 // 0 pilot
  { skin: "#7a4c32", hair: { k: "bald", c: "#16100c" }, build: "stout" },                     // 1 the big one (soldier)
  { skin: "#a8744e", hair: { k: "curly", c: "#16100c" } },                                    // 2 the third soldier
  { skin: "#8a583a", hair: { k: "dreads", c: "#2a1d16" }, stubble: true },                    // 3 the reggae singer (the team's reserve: he does not ride in the race)
  { skin: "#96623f", hair: { k: "side", c: "#16100c" }, brows: 1.2 },                         // 4 the pilot's brother
  { skin: "#9c6846", hair: { k: "tuft", c: "#16100c" } },                                     // 5 the team-mate who gets hurt in Calgary
];
const SUIT = { top: BLK, pat: { k: "v" as const, c: GRN }, collar: GOLD, legs: BLK, shoes: GOLD };
/** race suit + helmet */
export const racer = (i: number): Char => ({ ...WHO[i], hat: HELM, ...SUIT });
/** race suit, helmet off */
export const racerBare = (i: number): Char => ({ ...WHO[i], ...SUIT });
/** army fatigues + beret */
export const soldier = (i: number): Char => ({ ...WHO[i], hat: { k: "boina", c: "#7a2f3a" }, top: "#6b8442", collar: "#55692f", buttons: "#d9c27a", pocket: true, legs: "#55692f", shoes: "#23202a" });
export const SINGER: Char = { ...WHO[3], hat: { k: "tam", c: "#d0342e" }, top: GOLD, pat: { k: "flower", c: "#d0342e" }, necklace: "#fbfbf6", legs: "#3b5b9a", shorts: "#3b5b9a", bare: true, shoes: "#8a5a34" };
/** winter clothes in Calgary */
const WIN_C = [GOLD, GRN, "#d0342e", "#3f8fc9", "#f29a2e"];
export const winter = (i: number): Char => ({ ...WHO[i], hat: i === 3 ? { k: "tam", c: "#d0342e" } : { k: "beanie", c: WIN_C[(i + 1) % 5], c2: WIN_C[(i + 3) % 5] }, top: WIN_C[i % 5], collar: WHITE, scarf: [WIN_C[(i + 2) % 5], WHITE], legs: "#3a3028", shoes: "#5a3b2a" });
export const BROTHER_FAN: Char = { ...WHO[4], hat: { k: "beanie", c: GRN, c2: GOLD }, top: "#3f8fc9", scarf: [GOLD, GRN], collar: WHITE, legs: "#3a3028", shoes: "#5a3b2a" };
// the two businessmen
export const BIZ1: Char = { skin: "#f9c9ae", hair: { k: "side", c: "#c9a24a" }, hat: { k: "straw", c: "#e9d9a8", c2: "#d0342e" }, glasses: "sun", top: "#3fb0c9", pat: { k: "flower", c: "#f6f1e6" }, collar: "#f6f1e6", legs: "#e9dcc6", shorts: "#e9dcc6", bare: true, shoes: "#8a5a34" };
export const BIZ2: Char = { skin: "#fbd3b8", hair: { k: "bald", c: "#8a7f86" }, stache: "#7a4a2a", build: "stout", top: "#f29a2e", pat: { k: "flower", c: "#fff3c0" }, collar: "#fff3c0", legs: "#e9dcc6", shorts: "#5f7a9a", bare: true, shoes: "#8a5a34" };
/** tourist on the beach */
export const TOURIST: Char = { skin: "#f6b9a0", hair: { k: "short", c: "#c9a24a" }, hat: { k: "straw", c: "#e9d9a8", c2: "#3f8fc9" }, glasses: "sun", build: "stout", top: "#f25c7a", pat: { k: "flower", c: "#fff3c0" }, legs: "#3fb0c9", shorts: "#3fb0c9", bare: true, shoes: "#f6c419" };
const SK = ["#8f5d3e", "#7a4c32", "#a8744e", "#6b4129", "#b98360"], HK = ["short", "curly", "bald", "side", "bun", "long"] as const;
/** sprinters who say no */
export const sprinter = (i: number): Char => ({ skin: SK[i % 5], hair: { k: HK[i % 4], c: "#16100c" }, top: GOLD, collar: GRN, num: String([4, 9, 2][i % 3]), legs: GRN, shorts: GRN, bare: true, shoes: "#f4f1ea" });
/** boys on the pushcarts and island neighbours */
export const cartKid = (i: number): Char => ({ build: "kid", skin: SK[(i + 1) % 5], hair: { k: HK[(i + 1) % 4], c: "#16100c" }, top: ["#e2453c", "#3f8fc9", GOLD, "#57a05a"][i % 4], legs: "#3a3028", shorts: ["#3b5b9a", "#8a5a34", "#23202a", "#7a2f3a"][i % 4], bare: true, shoes: "#f4f1ea" });
export const islander = (i: number): Char => ({ skin: SK[i % 5], hair: { k: HK[i % 6], c: i % 5 === 3 ? "#8a7f86" : "#16100c" }, build: i % 4 === 1 ? "stout" : i % 5 === 2 ? "kid" : "adult", top: ["#e2453c", "#f29a2e", "#3fb0c9", "#f25c7a", "#57a05a", "#f7f5ee"][i % 6], pat: i % 3 === 0 ? { k: "h", c: "#f7f5ee" } : i % 3 === 1 ? { k: "flower", c: "#fff3c0" } : undefined, skirt: i % 4 === 0 ? "#7a5a9a" : undefined, legs: "#3a3028", shorts: i % 4 ? "#3b5b9a" : undefined, bare: i % 4 !== 0, shoes: "#8a5a34" });
/** people of Calgary in winter gear */
const FS = ["#fbe3cc", "#f6c9a8", "#fff0e0", "#e2b088", "#f9d6c0"], FC = ["#d0342e", "#3f8fc9", "#7a5a9a", "#f29a2e", "#2f7a8a", "#e07a9a", "#57a05a"];
export const fan = (i: number): Char => ({ skin: FS[i % 5], hair: { k: HK[i % 6], c: ["#7a4a2a", "#c9a24a", "#2a1d16", "#8a7f86"][i % 4] }, build: i % 5 === 1 ? "stout" : i % 7 === 3 ? "kid" : "adult", hat: i % 3 ? { k: "beanie", c: FC[(i + 2) % 7], c2: FC[(i + 4) % 7] } : undefined, glasses: i % 6 === 2 ? "round" : undefined, top: FC[i % 7], scarf: i % 2 ? [FC[(i + 3) % 7], "#f7f5ee"] : undefined, collar: "#f7f5ee", legs: "#3a3028", shoes: "#5a3b2a" });
/** the rival crew six years later */
export const rival = (i: number): Char => ({ skin: FS[i % 5], hair: { k: "short", c: "#7a4a2a" }, hat: { k: "helmet", c: "#2f4fa0", c2: "#f7f5ee", c3: "#d0342e" }, top: "#2f4fa0", pat: { k: "v", c: "#d0342e" }, collar: "#f7f5ee", legs: "#2f4fa0", shoes: "#f7f5ee" });
