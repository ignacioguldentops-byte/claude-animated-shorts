# "Hielo caliente": original score + synthesized SFX, ducked under the voice.
# An island groove (offbeat organ, bass, steel pan in G) for Jamaica, the same tune with sleigh bells in Calgary, a racing pulse on the
# ice, piano and strings when they walk to the line, and the groove again, with brass, for the ending. Cues come from src/j/timing.ts.
# usage: python3 mix_p.py <voice.wav> <tag>   ->  mix_raw<tag>.wav
import numpy as np, soundfile as sf, sys, json, re, os
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
ts = open(HERE + "/../src/j/timing.ts").read()
LINES = json.loads(re.search(r"LINES[^=]*= (\[.*?\]);", ts, re.S).group(1)); FR = int(re.search(r"TOTAL = (\d+)", ts).group(1))
L = lambda l: LINES[l - 1][0]; E = lambda l: LINES[l - 1][1]; A = lambda l, t=0.0: round(L(l) + (E(l) - L(l)) * t); CUT = 3
B = dict(isla=A(1, 0.2), flake=A(1, 0.4), volcar=A(1, 0.6), jam=L(2) - CUT, carr=A(2, 0.325), piensan=A(2, 0.615), idea=A(2, 0.8),
         velo=L(3) - CUT, no=A(3, 0.1), asi=A(3, 0.36), reggae=A(3, 0.72), calg=L(4) - CUT, vend=A(4, 0.42), tres=L(5) - CUT, slip=A(5, 0.2), herm=A(5, 0.43), animar=A(5, 0.72),
         espera=L(6) - CUT, q=A(6, 0.35), veras=L(7) - CUT, enton=L(8) - CUT, vuelcan=A(8, 0.27), cascos=A(8, 0.55), levan=L(9) - CUT, caminan=A(9, 0.22), publico=A(9, 0.6),
         ult=L(10) - CUT, seis=L(11) - CUT, ganaron=A(11, 0.5), end=FR)
SR = 48000; TOTAL = FR / 30; N = int(TOTAL * SR)
rng = np.random.default_rng(11)
VOICE = sys.argv[1]; TAG = sys.argv[2] if len(sys.argv) > 2 else ""
v, vsr = sf.read(VOICE)
if v.ndim > 1: v = v.mean(1)
vi = np.interp(np.arange(int(len(v) * SR / vsr)) / SR, np.arange(len(v)) / vsr, v)
voice = np.zeros(N); voice[:min(N, len(vi))] = vi[:N]
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], "band", fs=SR, output="sos"), x)
def lp(x, hi, o=2): return sosfilt(butter(o, hi, "low", fs=SR, output="sos"), x)
def hp(x, lo, o=2): return sosfilt(butter(o, lo, "high", fs=SR, output="sos"), x)
def env(n, a, d): t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def at(buf, sig, t, g=1.0):
    i = int(t * SR); j = min(N, i + len(sig))
    if 0 <= i < N: buf[i:j] += g * sig[:j - i]
F = lambda f: f / 30
tt = np.arange(N) / SR
D = lambda k: 293.66 * 2 ** (k / 12)   # semitones from D4
# ---------- instruments ----------
def reed(f, dur, vib=0.006):           # pipe / clarinet-ish reed, legato
    n = int(dur * SR); t = np.arange(n) / SR; ph = 2 * np.pi * f * (t + vib / (2 * np.pi * 5.5) * np.sin(2 * np.pi * 5.5 * t)); s = np.zeros(n)
    for h in range(1, 13): s += np.sin(h * ph + h * 0.7) / h ** 0.9 * (1.0 if h % 2 else 0.55)
    a = np.minimum(1, t / 0.012) * np.minimum(1, (dur - t) / 0.03).clip(0, 1)
    return bp(s, 500, 4200) * a * 0.3
def pluck(f, dur=0.5, bright=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for d in (1, 1.006):
        for h in range(1, 9): s += np.sin(2 * np.pi * f * d * h * t + h) * np.exp(-t * (5 + 2.2 * h) / bright) / h ** 1.1
    return s * np.minimum(1, t / 0.002) * 0.25
def tuba(f, dur): n = int(dur * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(4 * np.pi * f * t) + 0.2 * np.sin(6 * np.pi * f * t)) * np.minimum(1, t / 0.01) * np.exp(-t / 0.22)
def squeeze(fs, dur):                  # accordion "pah"
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in fs:
        for h in range(1, 8): s += np.sin(2 * np.pi * f * h * t * (1 + 0.002 * (h % 2))) / h
    return bp(s, 300, 3500) * np.minimum(1, t / 0.008) * np.exp(-t / 0.09) * 0.12
def jingle(g=1.0): n = int(0.09 * SR); return hp(rng.standard_normal(n), 6500) * env(n, 0.001, 0.022) * g
def drum(f=150, d=0.05): n = int(0.18 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t * np.exp(-t * 9)) * env(n, 0.001, d)
def snare(g=1.0): n = int(0.1 * SR); return (bp(rng.standard_normal(n), 1200, 6000) * 0.7 + drum(260, 0.02)[:n] * 0.6) * env(n, 0.001, 0.03) * g
def brass(fs, dur):                    # fanfare chord
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in fs:
        for h in range(1, 10): s += np.sin(2 * np.pi * f * h * t + h) / h ** 0.8
    return lp(s, 3200) * np.minimum(1, t / 0.03) * np.minimum(1, (dur - t) / 0.15).clip(0, 1) * 0.08

# ---------- instruments for this score ----------
G_ = lambda k: 196.0 * 2 ** (k / 12)   # semitones from G3
def piano(f, dur=2.4, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for d in (1.0, 1.0015):
        for h in range(1, 7): s += np.sin(2 * np.pi * f * d * h * t + h * 0.3) * np.exp(-t * (0.9 + 0.75 * h)) / h ** 1.7
    return lp(s, 2600) * np.minimum(1, t / 0.006) * 0.3 * g
def strings(fs, dur, cut=1500):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in fs:
        for dt in (0.996, 1.0, 1.004):
            for h in range(1, 6): s += np.sin(2 * np.pi * f * dt * h * t + h) / h ** 1.3
    return lp(s, cut) * np.minimum(1, t / 0.5) * np.minimum(1, (dur - t) / 0.6).clip(0, 1) * 0.03
def organ(fs, dur=0.16):               # the offbeat "skank"
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in fs:
        for h, a in ((1, 1), (2, 0.6), (3, 0.35), (4, 0.2)): s += a * np.sin(2 * np.pi * f * h * t)
    return bp(s, 250, 3000) * np.minimum(1, t / 0.004) * np.exp(-t / 0.07) * 0.1
def bass(f, dur=0.42): n = int(dur * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t)) * np.minimum(1, t / 0.008) * np.exp(-t / 0.28) * 0.5
def pan(f, dur=0.9):                   # steel pan
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 4) + 0.5 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 7) + 0.3 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t * 12) + 0.15 * np.sin(2 * np.pi * 4.2 * f * t) * np.exp(-t * 18)
    return s * np.minimum(1, t / 0.003) * 0.3
def glock(f, dur=1.2): n = int(dur * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t * 6)) * np.exp(-t * 3.2) * np.minimum(1, t / 0.002) * 0.22
def rim(): n = int(0.05 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * 1700 * t) + bp(rng.standard_normal(n), 2000, 6000) * 0.6) * env(n, 0.0005, 0.012) * 0.5
def hat(g=1.0): n = int(0.05 * SR); return hp(rng.standard_normal(n), 7000) * env(n, 0.0005, 0.014) * 0.3 * g
def kick(): n = int(0.25 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * 110 * t * np.exp(-t * 14)) * env(n, 0.001, 0.09)
# ---------- music ----------
bpm = 84; beat = 60 / bpm; bar = 4 * beat
CH = [(0, [0, 4, 7]), (5, [5, 9, 12]), (7, [7, 11, 14]), (5, [5, 9, 12])]          # G C D C
MEL = [[(19, 1), (16, 0.5), (19, 0.5), (24, 1), (23, 1)], [(21, 1.5), (17, 0.5), (21, 1), (24, 1)], [(26, 1), (23, 0.5), (26, 0.5), (28, 1), (26, 1)], [(24, 1), (21, 1), (19, 2)]]
grv = np.zeros(N); mel = np.zeros(N); bel = np.zeros(N); pul = np.zeros(N); pn = np.zeros(N); st = np.zeros(N); brs = np.zeros(N)
nb = int(TOTAL / bar) + 1
for b in range(nb):
    t0 = b * bar; root, ch = CH[b % 4]
    for i in range(4):
        at(grv, organ([G_(k) for k in ch]), t0 + (i + 0.5) * beat, 1.0); at(grv, organ([G_(k) for k in ch], 0.1), t0 + (i + 0.5) * beat + 0.09, 0.5); at(grv, hat(), t0 + (i + 0.5) * beat, 1.0); at(grv, hat(0.5), t0 + i * beat, 1.0)
    at(grv, rim(), t0 + 2 * beat, 1.0); at(grv, kick(), t0 + 2 * beat, 0.9)                                    # one drop
    for i, (k, d) in enumerate(((root - 24, 0), (root - 24, 0.75), (root - 17, 1.5), (root - 24, 2.5), (root - 19, 3.0), (root - 17, 3.5))): at(grv, bass(G_(k)), t0 + d * beat, 1.0)
    t = 0.0
    for m, d in MEL[b % 4]: at(mel, pan(G_(m)), t0 + t * beat, 1.0); at(bel, glock(G_(m + 12)), t0 + t * beat, 1.0); t += d
    for i in range(8): at(bel, jingle(0.5 if i % 2 else 0.9), t0 + i * beat / 2, 1.0)
    for i in range(8): at(pul, strings([G_(root - 24), G_(root - 12)], beat / 2 + 0.05, 900)[: int((beat / 2) * SR)] * 6, t0 + i * beat / 2, 1.0); at(pul, kick(), t0 + i * beat / 2, 0.5 if i % 2 else 0.9); at(pul, hat(0.8), t0 + i * beat / 2 + beat / 4, 1.0)
    at(st, strings([G_(k - 12) for k in ch] + [G_(root - 24)], bar + 0.8), t0, 1.0)
    for i, k in enumerate((root - 12, ch[1] - 12, ch[2] - 12, ch[0], ch[2] - 12, ch[1], ch[2] - 12, ch[0])): at(pn, piano(G_(k), 2.2, 0.55 if i else 0.8), t0 + i * beat / 2, 1.0)
    at(brs, brass([G_(k) for k in ch] + [G_(root - 12)], beat * 1.4), t0, 1.0); at(brs, brass([G_(k) for k in ch], beat * 0.6), t0 + 2.5 * beat, 0.8)
def sec(spans):
    g = np.zeros(N)
    for a, b, x in spans: g[(tt >= F(a)) & (tt < F(b))] = x
    return lp(g, 4.0)
E_ = B
mus = (grv * sec([(E_["isla"], E_["volcar"], 0.7), (E_["jam"], E_["espera"], 1.0), (E_["seis"], FR - 24, 1.1)])
       + mel * sec([(E_["isla"], E_["volcar"], 0.9), (E_["jam"], E_["calg"], 1.0), (E_["seis"], FR - 24, 1.0)])
       + bel * sec([(E_["calg"], E_["espera"], 0.8), (E_["ult"], E_["seis"], 0.25)])
       + pul * sec([(0, E_["isla"], 1.0), (E_["volcar"], E_["jam"], 1.1), (E_["veras"], E_["vuelcan"] + 19, 1.1)])
       + st * 3.0 * sec([(E_["espera"], E_["veras"], 0.7), (E_["vuelcan"] + 19, E_["levan"], 0.35), (E_["levan"], E_["seis"], 1.2)])
       + pn * sec([(E_["levan"], E_["ult"], 1.0), (E_["ult"], E_["seis"], 0.5)])
       + brs * sec([(E_["ganaron"], FR - 24, 0.9)]))
for k in (0, 4, 7, 12, 16): at(mus, piano(G_(k - 12 if k < 12 else k), 4.0, 0.9), F(FR - 30) + 0.03 * k / 3, 1.0); at(mus, pan(G_(k + 12), 2.0), F(FR - 30) + 0.05 * k / 3, 0.6)
pad = np.zeros(N)
# ---------- sfx ----------
sfx = np.zeros(N)
def thud(f=90, d=0.25): n = int(0.4 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t * np.exp(-t * 6)) * env(n, 0.002, d) + lp(rng.standard_normal(n), 300) * env(n, 0.001, 0.03) * 0.5
def whoosh(d=0.32, lo=400, hi=2600): n = int(d * SR); t = np.arange(n) / SR; return bp(rng.standard_normal(n), lo, hi) * np.sin(np.pi * t / d) ** 2 * 0.5
def clink(fs=(2650, 3910, 5200), d=0.06): n = int(0.35 * SR); t = np.arange(n) / SR; return sum(np.sin(2 * np.pi * f * t) for f in fs) / len(fs) * env(n, 0.001, d)
def sparkle():
    out = np.zeros(int(0.7 * SR))
    for k in range(7): c = clink((2000 + 600 * k, 3300 + 700 * k), 0.05) * 0.5; i = int(k * 0.07 * SR); out[i:i + len(c)] += c[:len(out) - i]
    return out
def pop(): n = int(0.12 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * (500 + 1800 * t / 0.12) * t) * env(n, 0.001, 0.03) * 0.6
def boing(): n = int(0.3 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * (300 + 500 * t) * t) * env(n, 0.002, 0.07) * 0.5
def ding(f=1318): n = int(0.9 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t)) * env(n, 0.002, 0.3) * 0.5
def slidew(d, f0, f1): n = int(d * SR); t = np.arange(n) / SR; f = f0 + (f1 - f0) * t / d; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.05).clip(0, 1) * 0.35
def kaching(): return np.concatenate([clink((1800, 2700), 0.02)[:int(0.08 * SR)] * 0.7, ding(2093)[:int(0.6 * SR)]])
def gull(): n = int(0.35 * SR); t = np.arange(n) / SR; f = 1900 + 900 * np.sin(np.pi * t / 0.35); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.35) ** 2 * 0.25
def strum(root):
    out = np.zeros(int(1.0 * SR))
    for i, k in enumerate((0, 4, 7, 12, 16)): c = pluck(G_(root + k - 12), 0.8, 1.4); j = int(i * 0.018 * SR); out[j:j + len(c)] += c[:len(out) - j]
    return out
def sled(a, b, g, f0=500, f1=1400):    # runners on ice: hiss + rumble, rising as it comes
    n = int((b - a) / 30 * SR)
    if n <= 0: return
    t = np.arange(n) / SR; d = n / SR; k = t / d
    x = bp(rng.standard_normal(n), 2200, 7500) * 0.1 * (0.5 + 0.5 * k) + bp(rng.standard_normal(n), 60, 260) * 0.25 + np.sin(2 * np.pi * np.cumsum(f0 + (f1 - f0) * k) / SR) * 0.012
    at(sfx, x * np.minimum(1, t / 0.15) * np.minimum(1, (d - t) / 0.12).clip(0, 1), F(a), g)
def scrape(a, b, g):                   # steel and helmets on ice
    n = int((b - a) / 30 * SR); t = np.arange(n) / SR; d = n / SR
    x = bp(rng.standard_normal(n), 2600, 9000) * (0.6 + 0.4 * np.sin(2 * np.pi * 23 * t)) * 0.2 + bp(rng.standard_normal(n), 300, 900) * 0.1
    at(sfx, x * np.minimum(1, t / 0.03) * (1 - t / d) ** 0.7, F(a), g)
def crowd(a, b, g, hi=1100):
    n = int((b - a) / 30 * SR)
    if n <= 0: return
    x = bp(rng.standard_normal(n), 250, hi) * (0.6 + 0.4 * lp(np.abs(rng.standard_normal(n)), 3) * 4) + bp(rng.standard_normal(n), hi, 2600) * 0.3
    t = np.arange(n) / SR; d = n / SR
    at(sfx, x * np.minimum(1, t / 0.35) * np.minimum(1, (d - t) / 0.35).clip(0, 1) * 0.06, F(a), g)
def roar(a, b, g, rise=0.12):
    n = int((b - a) / 30 * SR); t = np.arange(n) / SR; d = n / SR
    x = bp(rng.standard_normal(n), 300, 2500) * 0.08 + bp(rng.standard_normal(n), 120, 600) * 0.05
    at(sfx, x * np.minimum(1, t / rise) * np.minimum(1, (d - t) / 0.5).clip(0, 1), F(a), g)
def applause(a, b, g):
    n = int((b - a) / 30 * SR); t = np.arange(n) / SR; d = n / SR; x = np.zeros(n)
    for k in range(int(d * 70)): i = int(rng.uniform(0, n - 400)); x[i:i + 300] += hp(rng.standard_normal(300), 1500)[:300] * np.exp(-np.arange(300) / 60) * rng.uniform(0.3, 1)
    at(sfx, bp(x, 900, 5000) * 0.05 * np.minimum(1, t / (d * 0.5)) * np.minimum(1, (d - t) / 0.4).clip(0, 1), F(a), g)
def waves(a, b, g):
    n = int((b - a) / 30 * SR); t = np.arange(n) / SR; d = n / SR
    x = bp(rng.standard_normal(n), 250, 1800) * 0.07 * (0.35 + 0.65 * np.sin(2 * np.pi * t / 2.6) ** 2)
    at(sfx, x * np.minimum(1, t / 0.25) * np.minimum(1, (d - t) / 0.3).clip(0, 1), F(a), g)
def steps(a, b, every, g, f0=170):
    for f in np.arange(a, b, every): at(sfx, thud(f0, 0.05), F(f), g)
def bed(x, spans, g):
    gg = np.zeros(N)
    for a, b in spans: gg[(tt >= F(a)) & (tt < F(b))] = 1
    return x * lp(gg, 2.5) * g
wind = bp(rng.standard_normal(N), 200, 800) * (0.5 + 0.5 * np.sin(tt * 1.1)) * 0.04
sfx += bed(wind, [(0, B["isla"]), (B["volcar"], B["jam"]), (B["calg"], B["herm"]), (B["espera"], B["veras"]), (B["cascos"], B["seis"])], 2.4)
crowdn = bp(rng.standard_normal(N), 250, 1100) * (0.6 + 0.4 * lp(np.abs(rng.standard_normal(N)), 3) * 4) * 0.05
sfx += bed(crowdn, [(B["jam"], B["velo"])], 2.4) + bed(crowdn, [(B["herm"], B["espera"]), (B["veras"], B["vuelcan"] + 19)], 2.8) + bed(crowdn, [(B["publico"] - 20, B["ult"]), (B["seis"], FR)], 4.0) + bed(crowdn, [(B["calg"], B["tres"])], 1.2)
# HOOK
sled(0, B["isla"], 2.6, 500, 1900); at(sfx, whoosh(0.35, 200, 3600), F(B["isla"] - 9), 1.2); at(sfx, thud(52, 0.5), F(B["isla"]), 1.2)
waves(B["isla"], B["volcar"], 2.0); at(sfx, gull(), F(B["isla"] + 10), 0.7); at(sfx, gull(), F(B["isla"] + 22), 0.5)
at(sfx, slidew(0.8, 2400, 1500), F(B["flake"] + 2), 0.25); at(sfx, ding(2637), F(B["flake"] + 26), 0.7); at(sfx, pop(), F(B["flake"] + 32), 0.5)
sled(B["volcar"], B["jam"], 2.4, 900, 600); scrape(B["volcar"] + 30, B["jam"], 1.0); at(sfx, pop(), F(B["volcar"] + 56), 0.6); at(sfx, whoosh(0.4, 300, 3000), F(B["jam"] - 10), 1.0)
# Jamaica
waves(B["jam"], B["carr"], 1.0); at(sfx, gull(), F(B["jam"] + 12), 0.5)
for f in np.arange(B["jam"] + 6, B["velo"] - 60, 2.5): at(sfx, clink((700 + 300 * rng.random(), 1500), 0.012), F(f), 0.22 + 0.25 * min(1, (f - B["jam"]) / 120))   # cart wheels rattling
at(sfx, whoosh(0.45, 300, 2400), F(B["piensan"] + 8), 0.9); at(sfx, whoosh(0.45, 300, 2400), F(B["piensan"] + 19), 0.8)
at(sfx, ding(1760), F(B["idea"]), 0.8); at(sfx, sparkle(), F(B["idea"] + 4), 0.6)
waves(B["velo"], B["asi"], 1.4)
for i in range(3): at(sfx, pop(), F(B["no"] + i * 3), 0.4)
at(sfx, whoosh(0.5, 300, 2600), F(B["no"] + 15), 1.0); steps(B["no"] + 16, B["asi"], 3, 0.35, 240)
for i in range(3): at(sfx, thud(140, 0.06), F(B["asi"] + 10 + i * 13), 0.9); at(sfx, snare(0.5), F(B["asi"] + 10 + i * 13), 0.5)   # heels together
for k, f in enumerate(np.arange(B["reggae"] - 6, B["calg"] - 6, 10)): at(sfx, strum((0, 5, 7, 5)[k % 4]), F(f), 0.8)
# Calgary
at(sfx, whoosh(0.6, 200, 1600), F(B["calg"] - 6), 0.7); steps(B["calg"] + 4, B["vend"], 9, 0.25, 300)
for k in range(3): at(sfx, kaching(), F(B["vend"] + 28 + k * 22), 0.7)
steps(B["tres"] + 4, B["slip"], 9, 0.3, 300); at(sfx, slidew(0.38, 1500, 500), F(B["slip"]), 0.7); at(sfx, thud(70, 0.4), F(B["slip"] + 12), 1.6); at(sfx, sparkle(), F(B["slip"] + 16), 0.5)
roar(B["herm"], B["animar"], 0.8); at(sfx, boing(), F(B["animar"]), 0.9); at(sfx, pop(), F(B["animar"] + 4), 0.5)
# the race
for k in range(5): at(sfx, thud(55, 0.12), F(B["espera"] + 6 + k * 13), 1.0); at(sfx, thud(48, 0.1), F(B["espera"] + 10 + k * 13), 0.7)     # heartbeat on the edge
at(sfx, pop(), F(B["q"]), 0.5)
at(sfx, ding(988), F(B["veras"] + 1), 0.7)
for f in np.arange(B["veras"] + 3, B["veras"] + 46, 2.6): at(sfx, thud(260, 0.03), F(f), 0.45)        # spikes on ice
for i in range(4): at(sfx, thud(110, 0.08), F(B["veras"] + 32 + i * 5), 0.8)                          # in they jump
sled(B["veras"] + 20, B["enton"], 1.6, 300, 900); roar(B["veras"] + 30, B["enton"], 1.0, 1.0)
sled(B["enton"], B["vuelcan"] + 19, 2.6, 900, 1700)
at(sfx, thud(46, 0.8), F(B["vuelcan"] + 19), 2.2); at(sfx, thud(70, 0.4), F(B["vuelcan"] + 23), 1.4); scrape(B["vuelcan"] + 19, B["vuelcan"] + 84, 1.6)
at(sfx, sparkle(), F(B["levan"] - 22), 0.4)
for i in range(4): at(sfx, thud(130, 0.06), F(B["levan"] + 8 + i * 5), 0.5)
steps(B["caminan"] + 4, B["ult"], 11, 0.3, 280); applause(B["publico"] - 22, B["ult"] + 10, 2.6); roar(B["publico"] - 10, B["ult"], 0.7, 1.5)
at(sfx, thud(60, 0.4), F(B["ult"] + 26), 0.8)
sled(B["seis"], B["ganaron"], 2.4, 600, 1900); roar(B["seis"] + 6, FR - 10, 1.2, 1.0); at(sfx, whoosh(0.35, 200, 3600), F(B["seis"] + 38), 1.1); at(sfx, ding(1568), F(B["seis"] + 40), 0.8)
applause(B["ganaron"], FR - 6, 2.0)
for i in range(5): at(sfx, thud(70, 0.3), F(B["ganaron"] + 10 + i * 15), 0.9); at(sfx, sparkle(), F(B["ganaron"] + 12 + i * 15), 0.5)   # fireworks
# ---------- mix: duck music under the voice, music +3 dB, sfx -6 dB (skill standard) ----------
venv = lp(np.abs(voice), 8); duck = 1 - 0.45 * np.clip(venv / (np.percentile(venv, 90) + 1e-9), 0, 1)
m = mus / (np.max(np.abs(mus)) + 1e-9) * 0.2 * 10 ** (3 / 20) * duck
s = sfx / (np.max(np.abs(sfx)) + 1e-9) * 0.45 * 10 ** (-6 / 20)
mix = voice * 0.8 + m + s
fade = np.ones(N); fade[-int(0.8 * SR):] = np.linspace(1, 0, int(0.8 * SR)); mix *= fade
mix = np.tanh(mix * 1.1) / 1.1
sf.write(HERE + "/mix_raw" + TAG + ".wav", np.stack([mix, mix], 1), SR)
sf.write(HERE + "/music" + TAG + ".wav", m, SR); sf.write(HERE + "/sfx" + TAG + ".wav", s, SR)
print("ok", N / SR)
