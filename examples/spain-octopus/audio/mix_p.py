# "El pulpo": original score + synthesized SFX, ducked under the voice.
# Plaza = a Galician muineira (6/8, D major: reed pipe over a drone, drum, tambourine); aquarium = an oompah band
# in the same tempo and key; stadium = crowd + hits. Every cue is placed from src/p/timing.ts, like the picture.
# usage: python3 mix_p.py <voice.wav> <tag>   ->  mix_raw<tag>.wav
import numpy as np, soundfile as sf, sys, json, re, os
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
ts = open(HERE + "/../src/p/timing.ts").read()
LINES = json.loads(re.search(r"LINES[^=]*= (\[.*?\]);", ts, re.S).group(1)); FR = int(re.search(r"TOTAL = (\d+)", ts).group(1))
L = lambda l: LINES[l - 1][0]; E = lambda l: LINES[l - 1][1]; A = lambda l, t=0.0: round(L(l) + (E(l) - L(l)) * t); CUT = 3
B = dict(hookB=A(1, 0.5), aPulpo=A(1, 0.84), final0=L(2) - CUT, manolo=L(3) - CUT, forty=A(3, 0.3), aqua=L(4) - CUT, paul=A(4, 0.55),
         boxes=L(5) - CUT, mussel=A(5, 0.6), opens=L(6) - CUT, gana=A(6, 0.7), mont=L(7) - CUT, m2=A(7, 0.36), m5=A(7, 0.58), laugh=L(8) - CUT, suerte=A(8, 0.55),
         semi=L(9) - CUT, yPaul=L(10) - CUT, elige=A(10, 0.5), mob=L(11) - CUT, plancha=A(11, 0.55), guards=L(12) - CUT, sign=L(13) - CUT, cartel=A(13, 0.45),
         finalN=L(14) - CUT, mejillon=A(14, 0.42), again=L(15) - CUT, goal=L(16) - CUT, iniesta=A(16, 0.42), champs=A(16, 0.58), wait=L(17) - CUT, como=A(17, 0.25),
         veras=L(18) - CUT, colores=A(18, 0.3), rayas=A(18, 0.6), bandera=L(19) - CUT, amarilla=A(19, 0.6), luck=L(20) - CUT, una=A(20, 0.38), igual=L(21) - CUT, pueblo=A(21, 0.12),
         ofrec=A(21, 0.5), fiesta=A(21, 0.8), guest=L(22) - CUT, plato=L(23) - CUT, platoIn=L(23) + 6, end=FR)
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
# ---------- music ----------
e8 = 60 / 120 / 3; bar = 6 * e8
nbars = int(TOTAL / bar) + 1
# muineira (8 bars): melody in semitones from D4, chord roots
mel = [[7, None, 9, 7, 4, 0], [2, None, 4, 2, None, -3], [7, None, 9, 7, 4, 7], [9, 11, 12, 9, None, None],
       [12, None, 11, 9, 7, 9], [7, None, 4, 2, 0, 2], [4, 7, 4, 2, None, 4], [0, None, None, 0, None, None]]
roots = [0, -5, 0, 5, 0, 5, -5, 0]
chord = {0: [0, 4, 7], -5: [-5, -1, 2], 5: [5, 9, 12]}
gal = np.zeros(N); galp = np.zeros(N)
for b in range(nbars):
    t0 = b * bar; r = roots[b % 8]
    i = 0
    while i < 6:
        m = mel[b % 8][i]
        if m is None: i += 1; continue
        k = 1
        while i + k < 6 and mel[b % 8][i + k] is None: k += 1
        at(gal, reed(D(m + 12), e8 * k * 0.96), t0 + i * e8, 0.8); i += k
    at(gal, reed(D(-12), bar, 0.0), t0, 0.28)                          # the drone
    for beat in (0, 3): at(gal, tuba(D(r - 24), e8 * 2), t0 + beat * e8, 0.5)
    for beat in (2, 5):
        for kk in chord[r]: at(gal, pluck(D(kk), 0.25, 0.8), t0 + beat * e8, 0.16)
    for i, g in enumerate((1.0, 0.0, 0.55, 0.8, 0.0, 0.55)):
        if g: at(galp, snare(g), t0 + i * e8, 0.45)
        at(galp, jingle(0.5 if i % 3 else 0.9), t0 + i * e8, 0.4)
    at(galp, drum(95, 0.09), t0, 0.9); at(galp, drum(95, 0.09), t0 + 3 * e8, 0.6)
# oompah (4 bars)
omel = [[0, None, 4, 7, None, 4], [12, None, 9, 7, None, None], [11, None, 9, 7, None, 4], [4, None, 2, 0, None, None]]
oroots = [0, 0, -5, 0]
oom = np.zeros(N); oomp = np.zeros(N)
for b in range(nbars):
    t0 = b * bar; r = oroots[b % 4]
    for k, beat in enumerate((0, 3)): at(oom, tuba(D(r - 24 + (7 if k else 0)), e8 * 2.4), t0 + beat * e8, 1.0)
    for beat in (2, 5): at(oom, squeeze([D(kk - 12) for kk in chord[r]], 0.2), t0 + beat * e8, 1.0)
    i = 0
    while i < 6:
        m = omel[b % 4][i]
        if m is None: i += 1; continue
        k = 1
        while i + k < 6 and omel[b % 4][i + k] is None: k += 1
        at(oom, reed(D(m), e8 * k * 0.8, 0.003), t0 + i * e8, 0.6); i += k
    for beat in (2, 5): at(oomp, jingle(0.8), t0 + beat * e8, 0.5)
    at(oomp, drum(80, 0.1), t0, 0.8); at(oomp, drum(80, 0.1), t0 + 3 * e8, 0.5)
# sections: (frame a, b, muineira gain, its percussion, oompah gain, its percussion)
SEC = [(0, B["final0"], 1.0, 1.0, 0, 0), (B["final0"], B["manolo"], 0, 0, 0, 0), (B["manolo"], B["aqua"], 0.85, 0.6, 0, 0),
       (B["aqua"], B["laugh"], 0, 0, 0.9, 0.7), (B["laugh"], B["semi"], 0.8, 0.5, 0, 0), (B["semi"], B["yPaul"], 0, 0, 0.55, 0.0), (B["yPaul"], B["elige"] + 10, 0, 0, 0, 0),
       (B["elige"] + 10, B["mob"], 0, 0, 0.6, 0.4), (B["mob"], B["guards"], 0, 0, 1.0, 1.0), (B["guards"], B["sign"], 0, 0, 0.45, 0.0), (B["sign"], B["finalN"], 0.6, 0.0, 0, 0),
       (B["finalN"], B["champs"], 0, 0, 0, 0), (B["champs"], B["wait"], 1.15, 1.0, 0, 0), (B["wait"], B["luck"], 0, 0, 0, 0), (B["luck"], B["igual"], 0, 0, 0.35, 0.0),
       (B["igual"], B["plato"], 0.95, 0.9, 0, 0), (B["plato"], FR, 0, 0, 0, 0)]
g1 = np.zeros(N); g2 = np.zeros(N); g3 = np.zeros(N); g4 = np.zeros(N)
for a, b, x1, x2, x3, x4 in SEC: m_ = (tt >= F(a)) & (tt < F(b)); g1[m_] = x1; g2[m_] = x2; g3[m_] = x3; g4[m_] = x4
mus = gal * lp(g1, 8) + galp * lp(g2, 8) * 0.5 + oom * lp(g3, 8) + oomp * lp(g4, 8) * 0.5
# stings and pads
pad = np.zeros(N)
def padnote(fs, a, b, g):
    n = int((b - a) / 30 * SR); t = np.arange(n) / SR; d = n / SR; s = np.zeros(n)
    for f in fs:
        for dt in (0.997, 1.003): s += np.sin(2 * np.pi * f * dt * t) + 0.3 * np.sin(4 * np.pi * f * dt * t)
    at(pad, lp(s, 1800) * np.minimum(1, t / 0.5) * np.minimum(1, (d - t) / 0.4).clip(0, 1) * 0.1, F(a), g)
at(mus, brass([D(-12), D(-5), D(0), D(4)], 1.6), F(B["final0"]), 1.2)                       # the final: fanfare
padnote([D(-24), D(-17)], B["yPaul"], B["elige"] + 10, 1.0)                                 # suspense: Germany or Spain
padnote([D(-24), D(-17), D(-12)], B["finalN"], B["again"], 1.1)                             # the night of the final
padnote([D(-12), D(-5), D(2), D(9)], B["veras"], B["luck"], 0.8)                            # octopus vision
for i, k in enumerate((12, 16, 19, 24)): at(mus, pluck(D(k), 0.6, 1.3), F(B["wait"] + 6 + i * 5), 0.5)           # "wait": question plucks
for i, k in enumerate((0, 4, 7, 12, 16, 19, 24)): at(mus, pluck(D(k), 0.5, 1.3), F(B["rayas"] + i * 3), 0.4)     # the stripe lights up
for kk in (0, 4, 7, 12): at(mus, pluck(D(kk - 12), 1.4, 0.6), F(FR - 20), 0.5)                                     # button
at(mus, tuba(D(-24), 0.9), F(FR - 20), 0.9)
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
def bubble(): n = int(0.14 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * (500 + 2600 * (t / 0.14) ** 2) * t) * env(n, 0.004, 0.04) * 0.4
def slidew(d, f0, f1): n = int(d * SR); t = np.arange(n) / SR; f = f0 + (f1 - f0) * t / d; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.05).clip(0, 1) * 0.35
def slide(d): n = int(d * SR); t = np.arange(n) / SR; return bp(rng.standard_normal(n), 2500, 6000) * (1 - t / d) ** 0.5 * 0.14
def shutter(): n = int(0.1 * SR); return bp(rng.standard_normal(n), 2000, 8000) * (env(n, 0.001, 0.008) + 0.7 * np.roll(env(n, 0.001, 0.008), int(0.045 * SR)))
def kaching(): return np.concatenate([clink((1800, 2700), 0.02)[:int(0.08 * SR)] * 0.7, ding(2093)[:int(0.6 * SR)]])
def crowd(a, b, g, hi=1100):
    n = int((b - a) / 30 * SR)
    if n <= 0: return
    x = bp(rng.standard_normal(n), 250, hi) * (0.6 + 0.4 * lp(np.abs(rng.standard_normal(n)), 3) * 4) + bp(rng.standard_normal(n), hi, 2600) * 0.3
    t = np.arange(n) / SR; d = n / SR
    at(sfx, x * np.minimum(1, t / 0.35) * np.minimum(1, (d - t) / 0.35).clip(0, 1) * 0.06, F(a), g)
def roar(a, b, g):
    n = int((b - a) / 30 * SR); t = np.arange(n) / SR; d = n / SR
    x = bp(rng.standard_normal(n), 300, 2500) * 0.08 + bp(rng.standard_normal(n), 120, 600) * 0.05
    at(sfx, x * np.minimum(1, t / 0.12) * np.minimum(1, (d - t) / 0.5).clip(0, 1), F(a), g)
def water(a, b, g):
    n = int((b - a) / 30 * SR); t = np.arange(n) / SR; d = n / SR
    x = bp(rng.standard_normal(n), 120, 500) * 0.05 * (0.7 + 0.3 * np.sin(t * 2.1))
    at(sfx, x * np.minimum(1, t / 0.3) * np.minimum(1, (d - t) / 0.3).clip(0, 1), F(a), g)
    for k in range(int(d * 2.2)): at(sfx, bubble(), F(a) + rng.uniform(0, d), 0.12 * g)
# ambiences
crowd(0, B["final0"], 1.2); crowd(B["manolo"], B["aqua"], 0.7); crowd(B["laugh"], B["semi"], 0.5); crowd(B["sign"], B["finalN"], 0.5)
crowd(B["finalN"], B["mejillon"], 1.3); crowd(B["igual"], B["plato"], 1.0); crowd(B["mob"], B["guards"], 1.6, 800)
for a, b in ((B["aqua"], B["laugh"]), (B["semi"], B["sign"]), (B["mejillon"], B["goal"]), (B["wait"], B["igual"])): water(a, b, 1.0)
roar(B["final0"], B["manolo"], 1.6); roar(B["goal"], B["iniesta"] - 6, 0.9); roar(B["iniesta"] - 2, B["wait"] + 6, 2.6)
# spot effects
cuts = [B[k] for k in ("hookB", "manolo", "aqua", "boxes", "mussel", "opens", "mont", "m2", "m5", "laugh", "semi", "yPaul", "mob", "guards", "sign", "finalN", "mejillon", "again", "goal", "wait", "veras", "bandera", "luck", "igual", "ofrec", "guest", "plato")]
for f in cuts: at(sfx, whoosh(), F(f - 5), 0.5)
at(sfx, slidew(0.5, 300, 900), F(4), 0.6); at(sfx, sparkle(), F(18), 0.7)                                       # the octopus comes out of the pot
at(sfx, sparkle(), F(B["aPulpo"] - 6), 0.9); at(sfx, ding(1760), F(B["aPulpo"] - 6), 0.7); at(sfx, pop(), F(B["aPulpo"]), 0.8)   # the medal
at(sfx, thud(70, 0.4), F(B["final0"]), 1.4); at(sfx, sparkle(), F(B["final0"] + 6), 0.8)
for k in range(6): at(sfx, clink((2400, 3600), 0.015), F(B["manolo"] + 8 + k * 9), 0.45)                        # scissors
at(sfx, pop(), F(B["paul"]), 0.7); at(sfx, sparkle(), F(B["paul"] + 2), 0.6)
at(sfx, thud(140, 0.15), F(B["boxes"] + 15), 0.7); at(sfx, thud(150, 0.15), F(B["boxes"] + 18), 0.6)            # the boxes land
at(sfx, sparkle(), F(B["mussel"] + 4), 0.6)
at(sfx, whoosh(0.5, 300, 1500), F(B["opens"] + 2), 0.6); at(sfx, clink((900, 1400), 0.03), F(B["opens"] + 16), 0.7); at(sfx, pop(), F(B["opens"] + 24), 0.7)
at(sfx, ding(1568), F(B["gana"]), 0.9)
for f0, n in ((B["mont"] + 14, 1), (B["m2"] + 14, 1), (B["m5"] + 10, 3)):
    for i in range(n): at(sfx, ding(1568 * 2 ** (i * 2 / 12)), F(f0 + i * 4), 0.8)
for f in (B["mont"] + 6, B["m2"] + 6, B["m5"] + 6): at(sfx, shutter(), F(f), 0.6); at(sfx, shutter(), F(f + 9), 0.5)
at(sfx, boing(), F(B["suerte"]), 0.7)
for k in range(8): at(sfx, thud(55, 0.12), F(B["yPaul"] + k * 9), 0.5 + 0.06 * k)                               # heartbeat
at(sfx, whoosh(0.5, 300, 1500), F(B["elige"]), 0.7); at(sfx, clink((900, 1400), 0.03), F(B["elige"] + 12), 0.7); at(sfx, pop(), F(B["elige"] + 20), 0.8)
at(sfx, slidew(0.5, 700, 180), F(B["elige"] + 22), 0.7)                                                           # sad whistle for Germany
for k in range(10): at(sfx, clink((700, 1100, 1900), 0.05), F(B["mob"] + 6 + k * 8 + rng.integers(0, 3)), 0.7)  # pans
at(sfx, boing(), F(B["plancha"]), 0.7)
for k in range(4): at(sfx, pop(), F(B["guards"] + 10 + k * 15), 0.35)                                            # finger snaps
at(sfx, clink((2400, 3600), 0.02), F(B["guards"] + 40), 0.5)
at(sfx, thud(180, 0.1), F(B["cartel"]), 0.8); at(sfx, boing(), F(B["cartel"] + 6), 0.6)
for k in range(9): at(sfx, thud(55, 0.12), F(B["finalN"] + k * 10), 0.6)                                         # heartbeat
at(sfx, sparkle(), F(B["mejillon"] + 6), 0.7)
at(sfx, whoosh(0.5, 300, 1500), F(B["again"]), 0.6); at(sfx, pop(), F(B["again"] + 18), 0.8); at(sfx, ding(1568), F(B["again"] + 22), 0.9)
at(sfx, thud(110, 0.2), F(B["iniesta"] - 6), 1.4); at(sfx, whoosh(0.4, 500, 3000), F(B["iniesta"] - 5), 0.9); at(sfx, slide(0.5), F(B["iniesta"] + 3), 1.2)   # shot + net
at(sfx, thud(70, 0.4), F(B["champs"]), 1.3)
for k in range(3): at(sfx, thud(60, 0.5), F(B["champs"] + 4 + k * 16), 1.0); at(sfx, sparkle(), F(B["champs"] + 6 + k * 16), 0.7)   # fireworks
at(sfx, slidew(0.35, 900, 250), F(B["wait"] - 2), 0.6)                                                            # the music trips
for i in range(8): at(sfx, pop(), F(B["wait"] + 2 + i * 3), 0.4)
at(sfx, boing(), F(B["como"]), 0.7)
at(sfx, slidew(0.4, 500, 250), F(B["colores"]), 0.5); at(sfx, sparkle(), F(B["rayas"]), 0.9); at(sfx, sparkle(), F(B["amarilla"]), 0.9)
for i in range(8): at(sfx, clink((3100, 4650, 6200), 0.08), F(B["luck"] + 3 + i * 4), 0.5); at(sfx, ding(1568), F(B["luck"] + 19 + i * 4), 0.45)
at(sfx, kaching(), F(B["ofrec"] + 14), 0.9); at(sfx, whoosh(0.8, 800, 4000), F(B["ofrec"] + 18), 0.4)
at(sfx, clink((2100, 3300, 4700), 0.05), F(B["guest"] + 10), 0.7)                                                 # a toast
at(sfx, slide(0.7), F(B["plato"] + 2), 1.2); at(sfx, boing(), F(B["platoIn"] + 10), 0.9)
at(sfx, slidew(0.3, 400, 1200), F(B["platoIn"] + 30), 0.6); at(sfx, whoosh(0.3, 800, 4000), F(B["platoIn"] + 30), 0.6)
# ---------- mix: duck music under the voice, music +3 dB, sfx -6 dB (skill standard) ----------
venv = lp(np.abs(voice), 8); duck = 1 - 0.55 * np.clip(venv / (np.percentile(venv, 90) + 1e-9), 0, 1)
m = mus / (np.max(np.abs(mus)) + 1e-9) * 0.2 * 10 ** (3 / 20) * duck + pad / (np.max(np.abs(pad)) + 1e-9) * 0.14 * (0.6 + 0.4 * duck)
s = sfx / (np.max(np.abs(sfx)) + 1e-9) * 0.45 * 10 ** (-6 / 20)
mix = voice * 0.8 + m + s
fade = np.ones(N); fade[-int(0.25 * SR):] = np.linspace(1, 0, int(0.25 * SR)); mix *= fade
mix = np.tanh(mix * 1.1) / 1.1
sf.write(HERE + "/mix_raw" + TAG + ".wav", np.stack([mix, mix], 1), SR)
sf.write(HERE + "/music" + TAG + ".wav", m, SR); sf.write(HERE + "/sfx" + TAG + ".wav", s, SR)
print("ok", N / SR)
