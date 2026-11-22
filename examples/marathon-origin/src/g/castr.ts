// The cast of "La trastienda" (our own bean-head designs; nobody is a likeness of a real person).
import { Char } from "./toon";
const WH = "#fbfaf2", CREAM = "#f1ecdc", NAVY = "#1f2f5c", BLK = "#23202a";
const SKL = ["#fbd3b8", "#f6c9a8", "#fde3cc", "#f1c9a2", "#f9c9ae", "#eebfa0"], SKD = ["#8f5d3e", "#a8744e", "#7a4c32", "#b98360"];
const HK = ["short", "side", "curly", "quiff", "tuft", "short"] as const, HC = ["#3a2a1e", "#5a3b22", "#2a1d16", "#8a5a34", "#16100c", "#6a4a2a"];
/** the two brothers of the cloth shop: dark suits, waistcoats, big moustaches */
export const JUAN: Char = { skin: "#f6c9a8", hair: { k: "side", c: "#2a1d16" }, stache: "#2a1d16", build: "stout", top: "#2c2a38", vest: "#7a2630", collar: WH, tie: "#e8c45a", buttons: "#e8c45a", pocket: true, legs: "#2c2a38", shoes: BLK };
export const CARLOS: Char = { skin: "#fbd3b8", hair: { k: "quiff", c: "#5a3b22" }, stache: "#5a3b22", top: "#3a4660", vest: "#2f6a4a", collar: WH, bow: "#b8362e", buttons: "#e8c45a", legs: "#3a4660", shoes: BLK };
export const JUAN_HAT: Char = { ...JUAN, hat: { k: "bowler", c: BLK, c2: "#3a3438" } };
export const CARLOS_HAT: Char = { ...CARLOS, hat: { k: "top", c: BLK, c2: "#7a2630" } };
/** in the shop: shirtsleeves and an apron */
export const CARLOS_SHOP: Char = { ...CARLOS, top: WH, apron: "#2f6a4a" };
/** students of 1902 kicking a ball about: shirtsleeves, braces of all colours, long shorts, caps */
const SHIRT = ["#f4efe2", "#e9dcc6", "#c9d8ea", "#f1d2c0", "#dfe8c8", "#f7f5ee"];
export const student = (i: number): Char => ({ skin: SKL[i % 6], hair: { k: HK[i % 6], c: HC[i % 6] }, stache: i % 3 === 1 ? HC[i % 6] : undefined, build: i % 5 === 3 ? "stout" : "adult", hat: i % 3 === 0 ? { k: "coppola", c: ["#6a5a4a", "#3a3438", "#8a7a66"][i % 3] } : undefined,
  top: SHIRT[i % 6], pat: i % 4 === 2 ? { k: "v", c: "#b8c4d8" } : undefined, collar: WH, legs: "#3a3028", shorts: ["#3a3438", "#5a4c40", "#2c2a38"][i % 3], socks: ["#7a2630", "#2c2a38", "#3a4660"][i % 3], shoes: "#3a2a1e" });
/** the Madrid side of 1902: white shirt, white shorts, dark socks, a dark cap now and then */
export const mad = (i: number): Char => ({ skin: SKL[(i + 1) % 6], hair: { k: HK[(i + 2) % 6], c: HC[(i + 1) % 6] }, stache: i % 2 === 0 ? HC[(i + 1) % 6] : undefined, build: i % 6 === 4 ? "stout" : "adult", hat: i % 4 === 1 ? { k: "cap", c: NAVY } : undefined, top: WH, collar: CREAM, buttons: "#d9d2c0", legs: "#3a3028", shorts: WH, socks: NAVY, shoes: "#3a2a1e" });
/** the visitors from Barcelona: blue and claret stripes */
export const bar = (i: number): Char => ({ skin: SKL[(i + 3) % 6], hair: { k: HK[(i + 1) % 6], c: HC[(i + 3) % 6] }, stache: i % 2 === 1 ? HC[(i + 3) % 6] : undefined, build: i % 5 === 2 ? "stout" : "adult", top: "#274c9c", pat: { k: "v", c: "#8f1f3c" }, collar: WH, legs: "#3a3028", shorts: WH, socks: BLK, shoes: "#3a2a1e" });
/** their founder and centre-forward: fair hair, a big fair moustache */
export const FOUNDER: Char = { ...bar(0), skin: "#fde3cc", hair: { k: "side", c: "#d8b04a" }, stache: "#d8b04a", build: "stout" };
export const KEEPER: Char = { ...mad(2), top: "#5a6a7a", hat: { k: "coppola", c: "#3a3438" }, stache: "#3a2a1e" };
/** London gentlemen amateurs: white shirts, dark knickerbockers, caps, waxed moustaches */
export const gent = (i: number): Char => ({ skin: SKL[(i * 2) % 6], hair: { k: HK[(i + 1) % 6], c: ["#c9a24a", "#8a5a34", "#b9772e", "#5a3b22"][i % 4] }, stache: ["#c9a24a", "#8a5a34", "#b9772e", "#5a3b22"][i % 4], build: i % 3 === 2 ? "stout" : "adult", hat: i % 2 ? { k: "cap", c: ["#7a2630", NAVY][i % 2], c2: WH } : undefined, top: WH, collar: WH, buttons: "#c9d2de", legs: "#3a3028", shorts: NAVY, socks: NAVY, shoes: "#3a2a1e" });
/** townspeople of 1902: top hats, bowlers, boaters, long skirts, shawls */
const COAT = ["#2c2a38", "#5a4c40", "#3a4660", "#6a5a4a", "#7a2630", "#2f4a3a", "#8a7a66", "#4a4250"], DRESS = ["#d9a8a0", "#a8b8c8", "#e8c9a0", "#c9b0d8", "#b8d0b0", "#f1e3c4", "#c98b86"];
export const towns = (i: number): Char => { const lady = i % 3 === 1, kid = i % 9 === 5;
  return lady ? { skin: SKL[i % 6], hair: { k: "bun", c: HC[(i + 2) % 6] }, hat: i % 2 ? { k: "straw", c: ["#f4efe2", "#e9d9a8", "#f6d7d2"][i % 3], c2: ["#7a2630", "#2f6a4a", "#3f6fb0"][i % 3] } : undefined, top: DRESS[i % 7], skirt: DRESS[(i + 3) % 7], collar: WH, necklace: i % 2 ? "#fbfbf6" : undefined, legs: "#5a4c40", shoes: "#3a2a1e" }
    : { skin: i % 7 === 3 ? SKD[i % 4] : SKL[i % 6], hair: { k: HK[i % 6], c: i % 5 === 0 ? "#b9b3bd" : HC[i % 6] }, stache: i % 2 === 0 ? (i % 5 === 0 ? "#b9b3bd" : HC[i % 6]) : undefined, beard: i % 8 === 6 ? "#e9e6ee" : undefined, build: kid ? "kid" : i % 4 === 2 ? "stout" : "adult",
      hat: kid ? { k: "coppola", c: "#6a5a4a" } : i % 4 === 0 ? { k: "top", c: BLK, c2: "#3a3438" } : i % 4 === 2 ? { k: "bowler", c: ["#23202a", "#5a4c40"][i % 2], c2: "#3a3438" } : i % 4 === 3 ? { k: "straw", c: "#e9d9a8", c2: "#7a2630" } : { k: "boina", c: "#23202a" },
      top: COAT[i % 8], vest: i % 3 === 0 ? ["#7a2630", "#8a7a66", "#2f6a4a"][i % 3] : undefined, tie: i % 2 ? ["#b8362e", "#e8c45a", "#1f2f5c"][i % 3] : undefined, collar: WH, legs: COAT[(i + 3) % 8], shoes: BLK }; };
/** the tavern keeper */
export const KEEP: Char = { skin: "#f1c9a2", hair: { k: "bald", c: "#3a2a1e" }, stache: "#3a2a1e", build: "stout", top: "#e9dcc6", apron: "#fbfaf2", collar: WH, legs: "#5a4c40", shoes: BLK };
/** the young king in the royal box, and the officer beside him */
export const KING: Char = { skin: "#fde3cc", hair: { k: "side", c: "#5a3b22" }, build: "adult", hat: { k: "crown", c: "#e8c45a", c2: "#b8362e" }, top: NAVY, buttons: "#e8c45a", collar: "#b8362e", scarf: ["#b8362e", "#e8c45a"], pocket: true, legs: "#b8362e", shoes: BLK };
export const OFFICER: Char = { skin: "#f6c9a8", hair: { k: "short", c: "#8a7f86" }, stache: "#8a7f86", build: "stout", hat: { k: "cap", c: NAVY, c2: "#e8c45a" }, top: NAVY, buttons: "#e8c45a", collar: "#b8362e", legs: NAVY, shoes: BLK };
export const REF: Char = { skin: "#f6c9a8", hair: { k: "side", c: "#3a2a1e" }, stache: "#3a2a1e", hat: { k: "coppola", c: "#3a3438" }, top: "#3a3438", vest: "#5a4c40", collar: WH, tie: BLK, legs: "#5a4c40", shorts: "#3a3438", socks: BLK, shoes: BLK };
export const PHOTOG: Char = { skin: "#fbd3b8", hair: { k: "curly", c: "#8a5a34" }, stache: "#8a5a34", hat: { k: "bowler", c: "#5a4c40" }, top: "#8a7a66", vest: "#3a4660", collar: WH, bow: BLK, legs: "#5a4c40", shoes: BLK };
/** today: the players in white, the keeper they beat, the fans */
export const star = (i: number): Char => ({ skin: [SKL[1], SKD[1], SKL[3], SKD[0]][i % 4], hair: { k: (["quiff", "short", "curly", "dreads"] as const)[i % 4], c: ["#2a1d16", "#16100c", "#5a3b22", "#16100c"][i % 4] }, stubble: i % 2 === 1, top: WH, collar: "#e8c45a", legs: "#3a3028", shorts: WH, socks: WH, bare: true, shoes: ["#e8c45a", "#e2453c", "#2fb0a0", "#fbfaf2"][i % 4] });
export const rival = (i: number): Char => ({ skin: [SKD[2], SKL[0], SKL[4]][i % 3], hair: { k: (["short", "side", "tuft"] as const)[i % 3], c: "#2a1d16" }, top: "#d0342e", collar: BLK, legs: "#3a3028", shorts: BLK, socks: "#d0342e", bare: true, shoes: BLK });
export const GOALIE: Char = { skin: SKL[2], hair: { k: "short", c: "#8a5a34" }, top: "#57c05a", collar: BLK, legs: "#3a3028", shorts: "#57c05a", socks: "#57c05a", bare: true, shoes: BLK };
const FAN = ["#fbfaf2", "#f7f5ee", "#fbfaf2", "#1f2f5c", "#fbfaf2", "#6a4c9a", "#fbfaf2"];
export const fan = (i: number): Char => ({ skin: i % 3 === 1 ? SKD[i % 4] : SKL[i % 6], hair: { k: i % 4 === 2 ? "long" : i % 4 === 3 ? "bun" : HK[i % 6], c: HC[(i + 2) % 6] }, build: i % 5 === 1 ? "stout" : i % 6 === 3 ? "kid" : "adult", hat: i % 4 === 0 ? { k: "cap", c: [WH, NAVY][i % 2] } : i % 7 === 3 ? { k: "beanie", c: WH, c2: NAVY } : undefined, glasses: i % 6 === 1 ? "round" : undefined, stubble: i % 4 === 1,
  top: FAN[i % 7], collar: i % 2 ? "#e8c45a" : undefined, scarf: i % 2 === 0 ? [WH, i % 4 ? NAVY : "#6a4c9a"] : undefined, legs: ["#3b5b9a", "#2c2a38", "#5a4c40"][i % 3], shoes: WH });
/** the fan who cannot believe it */
export const DOUBT: Char = { skin: "#f6c9a8", hair: { k: "curly", c: "#3a2a1e" }, stubble: true, glasses: "round", top: WH, collar: "#e8c45a", scarf: [WH, NAVY], legs: "#3b5b9a", shoes: WH };
