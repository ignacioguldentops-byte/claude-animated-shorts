// The cast of "La puerta de atrás" (our own bean-head designs; nobody is drawn as a likeness).
import { Char } from "./toon";
const GREEN = "#2f9a5a", WHITE = "#f7f5ee";
export const KID: Char = { build: "kid", hair: { k: "short", c: "#3b2a1c" }, top: GREEN, pat: { k: "h", c: WHITE }, collar: WHITE, legs: WHITE, shorts: WHITE, bare: true, socks: GREEN, shoes: "#23202a" };
export const KID_PJ: Char = { build: "kid", hair: { k: "short", c: "#3b2a1c" }, top: "#8fb8e8", pat: { k: "dots", c: "#f7f5ee" }, legs: "#8fb8e8", shoes: "#ffe2c2" };
export const KID_TRAVEL: Char = { build: "kid", hair: { k: "short", c: "#3b2a1c" }, top: "#c9473f", collar: WHITE, scarf: ["#e9b93c", "#e9b93c"], legs: "#3b5b9a", shoes: "#23202a" };
export const PAL1: Char = { ...KID, hair: { k: "short", c: "#16100c" }, glasses: undefined };
export const PAL2: Char = { ...KID, hair: { k: "side", c: "#c9a24a" }, build: "kid" };
const worker = (hair: Char["hair"], x: Partial<Char> = {}): Char => ({ hat: { k: "cap", c: "#d0342e" }, hair, top: "#f6c419", pat: { k: "v", c: "#f7f5ee" }, collar: "#d0342e", apron: "#8a2f2a", legs: "#3a3028", shoes: "#23202a", ...x });
export const EDNA: Char = worker({ k: "bun", c: "#2a1d16" }, { earring: "#f2c64a" });
export const WORKER2: Char = worker({ k: "long", c: "#7a4a2a" }, { glasses: "round" });
export const WORKER3: Char = worker({ k: "bun", c: "#c9a24a" }, { build: "stout" });
export const STAR: Char = { hair: { k: "side", c: "#16100c" }, top: "#c8102e", collar: "#1f7a3a", num: "7", legs: "#1f7a3a", shorts: "#1f7a3a", bare: true, socks: "#c8102e", shoes: "#f4f1ea" };
export const STAR_SUIT: Char = { hair: { k: "side", c: "#2a1d16" }, top: "#2f3a5e", collar: WHITE, tie: "#8a2f3a", buttons: "#c9cdd4", legs: "#2f3a5e", shoes: "#16100c" };
export const PAULA: Char = { hair: { k: "bun", c: "#8a7a70" }, glasses: "round", earring: "#f2c64a", top: "#7a5a9a", scarf: ["#e9b93c", "#e9b93c"], skirt: "#7a5a9a", legs: "#3b2a30", shoes: "#3a2a22" };
export const mate = (i: number): Char => ({ hair: { k: (["short", "curly", "side", "bald"] as const)[i % 4], c: ["#2a1d16", "#3b2a1c", "#16100c", "#7a4a2a"][i % 4] }, top: "#c8102e", collar: "#1f7a3a", num: String([3, 5, 8, 10, 11, 14][i % 6]), legs: "#1f7a3a", shorts: "#1f7a3a", bare: true, socks: "#c8102e", shoes: "#f4f1ea", stubble: i % 2 === 0 });
/** two strangers asleep on the plane */
export const PASS1: Char = { hair: { k: "bald", c: "#8a7f86" }, stache: "#8a7f86", top: "#7a6a52", collar: "#f7f5ee", legs: "#4a4038", shoes: "#23202a" } as Char;
export const PASS2: Char = { hair: { k: "long", c: "#7a4a2a" }, top: "#3f8a6a", legs: "#3a3028", shoes: "#23202a" };
