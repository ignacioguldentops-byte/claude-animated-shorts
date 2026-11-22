# "Cómo nació el maratón": original score + synthesized SFX, ducked under the voice.
# usage: python3 mix_r.py <voice.wav> <tag>   ->  mix_raw<tag>.wav
import numpy as np, soundfile as sf, sys, json, re, os
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
ts = open(HERE + "/../src/g/timing.ts").read()
LINES = json.loads(re.search(r"LINES[^=]*= (\[.*?\]);", ts, re.S).group(1)); FR = int(re.search(r"TOTAL = (\d+)", ts).group(1))
L = lambda l: LINES[l - 1][0]; E = lambda l: LINES[l - 1][1]; A = lambda l, t=0.0: round(L(l) + (E(l) - L(l)) * t); CUT = 3
B = dict(grecia=L(2) - 8, mensajero=A(2, 0.52), llega=L(3) - 10, grita=A(3, 0.3), cae=A(3, 0.78), momento=L(4) - 4, herodoto=A(4, 0.18), levanta=A(4, 0.38), esparta=A(4, 0.5), siglos=A(4, 0.78),
         veras=L(5) - 10, breal=A(5, 0.45), trofeo=A(5, 0.82), bang=E(5) - 4, gano=L(6) - 6, taberna=A(6, 0.52), copa=A(6, 0.7), sigue=A(6, 0.88), estadio=L(7) - 6, londres=A(7, 0.32), windsor=A(7, 0.52), palco=A(7, 0.76),
         medida=L(8) - 6, meta=A(8, 0.5), reina=A(8, 0.82), end=FR)
ERA = B["siglos"] + 20; ENGS = B["londres"] + 22
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
# 490 BC: a modal piece in D (hijaz: D Eb F# G A Bb C) - plucked lyre/bouzouki ostinato, aulos-like reed melody, frame drum
# 1896: the same tune quicker and brighter, bouzouki tremolo and accordion, a dance (it speeds up)
# 1908: a brass band march in B flat, snare and tuba; a royal fanfare at the finish
Dk = lambda k: 146.83 * 2 ** (k / 12)   # semitones from D3
HJ = [0, 1, 4, 5, 7, 8, 10, 12, 13, 16, 17, 19]
def hj(i): return HJ[i % len(HJ)] + 12 * (i // len(HJ))
def framedrum(low=True): n = int(0.3 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * (70 if low else 180) * t * np.exp(-t * (8 if low else 14))) * env(n, 0.001, 0.12 if low else 0.05) + bp(rng.standard_normal(n), 600, 3000) * env(n, 0.001, 0.02) * (0.15 if low else 0.5))
def tremolo(f, dur, rate=14):         # bouzouki tremolo
    out = np.zeros(int(dur * SR) + SR)
    for k in range(int(dur * rate)): p = pluck(f, 0.18, 1.8) * (0.7 + 0.3 * (k % 2)); i = int(k / rate * SR); out[i:i + len(p)] += p[:len(out) - i]
    return out[:int(dur * SR)]
gre = np.zeros(N); grd = np.zeros(N); greed = np.zeros(N); grst = np.zeros(N)
bpm1 = 108; bt = 60 / bpm1
MEL1 = [(7, 1), (8, 0.5), (7, 0.5), (5, 1), (4, 1), (5, 0.5), (4, 0.5), (2, 1), (1, 2), (0, 1), (1, 0.5), (2, 0.5), (4, 1), (5, 1), (4, 1.5), (2, 0.5), (1, 2), (0, 2)]
t = 0.0; mi = 0
while t < F(ERA) + 2:
    for k in range(8):   # ostinato: D D A D | Eb D C D in eighths
        at(gre, pluck(Dk([0, 0, 7, 0, 1, 0, -2, 0][k]), 0.4, 1.4), t + k * bt / 2, 0.9 if k % 4 == 0 else 0.6)
    for k, lowd in ((0, True), (1.5, False), (2, True), (3, False), (3.5, False)): at(grd, framedrum(lowd), t + k * bt, 1.0)
    at(grst, strings([Dk(0), Dk(7), Dk(12)], 4 * bt + 0.6, 1200), t, 1.0)
    tt0 = 0.0
    while tt0 < 4 - 1e-6: m, d = MEL1[mi % len(MEL1)]; at(greed, reed(Dk(hj(m) + 12), d * bt * 0.95, 0.01), t + tt0 * bt, 1.0); tt0 += d; mi += 1
    t += 4 * bt
# 1896: quicker, the bouzouki tremolo and accordion, accelerating like a dance
dan = np.zeros(N); dand = np.zeros(N); danm = np.zeros(N)
t = F(B["veras"] - 10); k = 0
while t < F(ENGS):
    bpm2 = 120 + 40 * min(1, max(0, (t - F(B["bang"])) / 8)); b2 = 60 / bpm2
    root = [0, 0, -2, -5][(k // 4) % 4]
    for j in range(4):
        at(dan, bass(Dk(root - 12), b2 * 0.9) * 0.6, t + j * b2, 1.0 if j % 2 == 0 else 0.0)
        at(dan, squeeze([Dk(root + 12), Dk(root + 16 if root else root + 15), Dk(root + 19)], b2 * 0.5), t + j * b2 + b2 / 2, 1.0)
        at(dand, framedrum(j % 2 == 0), t + j * b2, 0.9); at(dand, hat(0.6), t + j * b2 + b2 / 2, 1.0)
    m = [7, 5, 4, 2][k % 4]; at(danm, tremolo(Dk(hj(m) + 12), b2 * 1.8), t, 0.9); at(danm, tremolo(Dk(hj(m - 1) + 12), b2 * 1.8), t + 2 * b2, 0.9)
    t += 4 * b2; k += 1
# 1908: a march in B flat
Bb = lambda k: 233.08 * 2 ** (k / 12)
mar = np.zeros(N); mard = np.zeros(N); marb = np.zeros(N)
bpm3 = 116; b3 = 60 / bpm3; t = F(ENGS) - 0.2; k = 0
CH3 = [(0, [0, 4, 7]), (5, [5, 9, 12]), (7, [7, 11, 14]), (0, [0, 4, 7])]
MEL3 = [[(12, 1), (11, 0.5), (12, 0.5), (16, 1), (12, 1)], [(17, 1), (16, 0.5), (14, 0.5), (12, 2)], [(14, 1), (16, 0.5), (17, 0.5), (19, 1), (14, 1)], [(16, 1), (14, 1), (12, 2)]]
while t < TOTAL:
    root, ch = CH3[k % 4]
    for j in range(4):
        at(marb, tuba(Bb(root - 24 + (7 if j % 2 else 0)), b3 * 0.8), t + j * b3, 0.8)
        at(mard, snare(0.8 if j % 2 else 0.5), t + j * b3, 1.0); at(mard, snare(0.35), t + j * b3 + b3 * 0.75, 1.0)
        if j % 2: at(mar, brass([Bb(c - 12) for c in ch], b3 * 0.4), t + j * b3, 0.8)
    tt0 = 0.0
    for mm, d in MEL3[k % 4]: at(mar, brass([Bb(mm)], d * b3 * 0.9) * 1.6, t + tt0 * b3, 1.0); at(mar, glock(Bb(mm + 12), 0.8), t + tt0 * b3, 0.5); tt0 += d
    t += 4 * b3; k += 1
def sec(spans):
    g = np.zeros(N)
    for a, b, x in spans: g[(tt >= F(a)) & (tt < F(b))] = x
    return lp(g, 4.0)
mus = ((gre * 1.0 + grd * 0.8) * sec([(0, B["momento"], 1.0), (B["momento"], B["herodoto"], 0.25), (B["herodoto"], ERA, 0.7)]) + greed * sec([(0, B["llega"], 1.0), (B["llega"], B["cae"], 0.6), (B["herodoto"] + 30, ERA, 0.7)])
       + grst * 3.0 * sec([(B["grecia"], B["momento"], 0.9), (B["momento"], ERA, 1.0)])
       + (dan + dand * 0.8 + danm) * sec([(B["veras"], B["bang"], 0.55), (B["bang"], ENGS - 10, 1.0)])
       + (mar + mard * 0.7 + marb) * sec([(ENGS, B["palco"], 0.8), (B["palco"], FR - 15, 1.0)]))
# a royal fanfare as he crosses the line; the final chord
for k, d in ((0, 0.25), (4, 0.25), (7, 0.25), (12, 1.6)): at(mus, brass([Bb(k), Bb(k + 4), Bb(k + 7)], d) * 3.0, F(B["meta"] + 4) + [0, 0.25, 0.5, 0.75][[0, 4, 7, 12].index(k)], 1.0)
for k in (0, 4, 7, 12): at(mus, brass([Bb(k - 12)], 2.4) * 2.5, F(FR - 32), 1.0); at(mus, glock(Bb(k + 12), 2.0), F(FR - 32) + 0.02 * k, 0.7)
# ---------- sound effects ----------
sfx = np.zeros(N)
def thud(f=90, d=0.25): n = int(0.4 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t * np.exp(-t * 6)) * env(n, 0.002, d) + lp(rng.standard_normal(n), 300) * env(n, 0.001, 0.03) * 0.5
def whoosh(d=0.32, lo=400, hi=2600): n = int(d * SR); t = np.arange(n) / SR; return bp(rng.standard_normal(n), lo, hi) * np.sin(np.pi * t / d) ** 2 * 0.5
def clink(fs=(2650, 3910, 5200), d=0.06): n = int(0.35 * SR); t = np.arange(n) / SR; return sum(np.sin(2 * np.pi * f * t) for f in fs) / len(fs) * env(n, 0.001, d)
def slidew(d, f0, f1): n = int(d * SR); t = np.arange(n) / SR; f = f0 + (f1 - f0) * t / d; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.05).clip(0, 1) * 0.35
def gull(): n = int(0.35 * SR); t = np.arange(n) / SR; f = 1900 + 900 * np.sin(np.pi * t / 0.35); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.35) ** 2 * 0.25
def scratch(d=0.5): n = int(d * SR); t = np.arange(n) / SR; return bp(rng.standard_normal(n), 2500, 7000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 9 * t))) * np.sin(np.pi * t / d) * 0.25
def gun(): n = int(0.6 * SR); t = np.arange(n) / SR; return (bp(rng.standard_normal(n), 200, 5000) * env(n, 0.0005, 0.05) + np.sin(2 * np.pi * 70 * t * np.exp(-t * 4)) * env(n, 0.001, 0.12)) * 0.9
def roar(a, b, g, rise=0.12):
    n = int((b - a) / 30 * SR); t = np.arange(n) / SR; d = n / SR
    x = bp(rng.standard_normal(n), 300, 2500) * 0.08 + bp(rng.standard_normal(n), 120, 600) * 0.05
    at(sfx, x * np.minimum(1, t / rise) * np.minimum(1, (d - t) / 0.5).clip(0, 1), F(a), g)
def applause(a, b, g):
    n = int((b - a) / 30 * SR); t = np.arange(n) / SR; d = n / SR; x = np.zeros(n)
    for k in range(int(d * 70)): i = int(rng.uniform(0, n - 400)); x[i:i + 300] += hp(rng.standard_normal(300), 1500)[:300] * np.exp(-np.arange(300) / 60) * rng.uniform(0.3, 1)
    at(sfx, bp(x, 900, 5000) * 0.05 * np.minimum(1, t / (d * 0.3)) * np.minimum(1, (d - t) / 0.4).clip(0, 1), F(a), g)
def waves(a, b, g):
    n = int((b - a) / 30 * SR); t = np.arange(n) / SR; d = n / SR
    x = bp(rng.standard_normal(n), 250, 1800) * 0.07 * (0.35 + 0.65 * np.sin(2 * np.pi * t / 2.6) ** 2)
    at(sfx, x * np.minimum(1, t / 0.25) * np.minimum(1, (d - t) / 0.3).clip(0, 1), F(a), g)
def steps(a, b, every, g, f0=170):
    for f in np.arange(a, b, every): at(sfx, thud(f0, 0.04), F(f), g)
def bed(x, spans, g):
    gg = np.zeros(N)
    for a, b in spans: gg[(tt >= F(a)) & (tt < F(b))] = 1
    return x * lp(gg, 2.5) * g
crowdn = bp(rng.standard_normal(N), 250, 1100) * (0.6 + 0.4 * lp(np.abs(rng.standard_normal(N)), 3) * 4) * 0.05
windn = lp(rng.standard_normal(N), 500) * 0.05 * (0.6 + 0.4 * np.sin(2 * np.pi * tt / 5.3))
cic = bp(rng.standard_normal(N), 4500, 7500) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 26 * tt))) * (0.4 + 0.6 * np.sin(2 * np.pi * tt / 3.1) ** 2) * 0.02
birds = np.zeros(N)
for f0 in np.arange(0, FR, 9.0): n = int(0.12 * SR); t = np.arange(n) / SR; at(birds, np.sin(2 * np.pi * (2800 + 1400 * np.sin(2 * np.pi * 18 * t)) * t) * env(n, 0.005, 0.04) * 0.12, F(f0 + 4 * rng.random()), 0.4 + 0.6 * rng.random())
COUNTRY = [(B["mensajero"], B["llega"]), (B["esparta"], B["gano"] + 30), (B["gano"] + 30, B["estadio"])]
sfx += bed(cic, COUNTRY, 1.2) + bed(windn, [(B["mensajero"], B["llega"]), (B["siglos"], B["breal"]), (B["londres"] - 20, B["windsor"])], 1.4) + bed(birds, [(B["windsor"] - 20, B["palco"])], 1.0)
sfx += bed(crowdn, [(0, B["mensajero"] + 20), (B["llega"], B["siglos"]), (B["breal"], B["gano"] + 30), (B["estadio"], B["londres"]), (B["windsor"] - 10, FR)], 2.4)
# Marathon: the sea, gulls, the army cheering him off, his sandals on the sand
waves(0, B["mensajero"] + 20, 1.4)
for k in range(6): at(sfx, gull(), F(10 + k * 37 + 10 * rng.random()), 0.7)
roar(0, B["grecia"] + 40, 1.8, 0.05); applause(0, B["grecia"] + 20, 1.0); steps(0, B["grecia"] + 60, 6.4, 0.5, 240)
at(sfx, whoosh(1.6, 200, 1800), F(B["grecia"]), 1.0); at(sfx, whoosh(2.0, 150, 1500), F(B["mensajero"] + 10), 1.1)
# Athens: in through the gate, the cheer, the fall, the gasp
steps(B["llega"] - 20, B["llega"] + 18, 5.5, 0.6, 230); roar(B["llega"] + 10, B["cae"], 1.6, 0.2)
at(sfx, thud(70, 0.3), F(B["cae"] + 14), 1.6); at(sfx, slidew(0.6, 900, 300), F(B["cae"] + 4), 0.7); roar(B["cae"] + 6, B["cae"] + 40, 0.9, 0.05)
# wait a moment: the record scratch; the historian's scroll; the messenger pops up and runs off to Sparta
at(sfx, scratch(0.45), F(B["momento"]), 1.0); at(sfx, bp(rng.standard_normal(int(0.5 * SR)), 1500, 6000) * env(int(0.5 * SR), 0.05, 0.2) * 0.3, F(B["herodoto"] + 30), 0.8)
at(sfx, slidew(0.3, 400, 1400), F(B["levanta"]), 0.6); steps(B["levanta"] + 22, B["veras"], 6.0, 0.5, 230); at(sfx, whoosh(2.2, 150, 1500), F(B["siglos"] + 4), 1.1)
# 1896: the start, the linguist's cup (a sparkle), the pistol; the taverna (clink, gulp); the stadium roars
for k in range(4): at(sfx, clink((2200 + 500 * k, 3600 + 400 * k), 0.05) * 0.5, F(B["trofeo"] + k * 3), 0.6)
at(sfx, gun(), F(B["bang"]), 1.4); roar(B["bang"], B["bang"] + 60, 1.2, 0.05); steps(B["bang"] + 2, B["gano"] + 40, 2.2, 0.5, 240)
at(sfx, whoosh(1.6, 200, 1800), F(B["gano"] + 30), 1.0); steps(B["taberna"] - 20, B["taberna"] - 4, 6.0, 0.5, 240)
at(sfx, clink((2650, 3910, 5200), 0.12), F(B["taberna"] + 6), 1.0); at(sfx, lp(rng.standard_normal(int(0.25 * SR)), 600) * env(int(0.25 * SR), 0.02, 0.08), F(B["copa"]), 0.7); at(sfx, lp(rng.standard_normal(int(0.25 * SR)), 600) * env(int(0.25 * SR), 0.02, 0.08), F(B["copa"] + 14), 0.7)
roar(B["copa"] + 10, B["sigue"], 0.6, 0.1); at(sfx, whoosh(1.4, 200, 1800), F(B["sigue"] + 4), 1.0)
roar(B["estadio"] - 6, B["londres"] + 10, 2.2, 0.2); applause(B["estadio"], B["londres"], 1.6)
# into the clouds and down over England; the castle start; the avenue; the royal box; the finish
at(sfx, whoosh(2.6, 120, 1300), F(B["londres"] - 10), 1.4); at(sfx, whoosh(1.8, 150, 1500), F(ENGS + 4), 1.1)
at(sfx, gun(), F(B["windsor"] + 8), 1.4); applause(B["windsor"] + 8, B["palco"], 1.0); steps(B["windsor"] + 10, B["palco"] - 10, 2.2, 0.5, 240); at(sfx, whoosh(1.4, 200, 1800), F(B["palco"] - 8), 1.0)
steps(B["medida"] + 6, B["meta"] + 6, 6.0, 0.55, 240); roar(B["medida"], FR - 8, 2.0, 0.3); applause(B["meta"], FR - 8, 1.8); at(sfx, ding(1568) if "ding" in globals() else clink(), F(B["meta"] + 6), 0.6)
# ---------- mix: duck music under the voice, music +3 dB, sfx -6 dB (skill standard) ----------
venv = lp(np.abs(voice), 8); duck = 1 - 0.45 * np.clip(venv / (np.percentile(venv, 90) + 1e-9), 0, 1)
m = mus / (np.max(np.abs(mus)) + 1e-9) * 0.2 * 10 ** (3 / 20) * duck
s = sfx / (np.max(np.abs(sfx)) + 1e-9) * 0.45 * 10 ** (-6 / 20)
mix = voice * 0.8 + m + s
fade = np.ones(N); fade[-int(0.8 * SR):] = np.linspace(1, 0, int(0.8 * SR)); mix *= fade
mix = np.tanh(mix * 1.1) / 1.1
sf.write(HERE + "/mix_raw" + TAG + ".wav", np.stack([mix, mix], 1), SR)
print("ok", N / SR)
