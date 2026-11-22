# "Media carrera en coche": original score + synthesized SFX, ducked under the voice.
# usage: python3 mix_r.py <voice.wav> <tag>   ->  mix_raw<tag>.wav
import numpy as np, soundfile as sf, sys, json, re, os
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
ts = open(HERE + "/../src/o/timing.ts").read()
LINES = json.loads(re.search(r"LINES[^=]*= (\[.*?\]);", ts, re.S).group(1)); FR = int(re.search(r"TOTAL = (\d+)", ts).group(1))
L = lambda l: LINES[l - 1][0]; E = lambda l: LINES[l - 1][1]; A = lambda l, t=0.0: round(L(l) + (E(l) - L(l)) * t); CUT = 3
B = dict(coche=A(1, 0.8), sanluis=L(2) - 6, polvo=A(2, 0.6), agua=L(3) - 6, cartero=L(4) - 6, perros=A(4, 0.55), momento=L(5) - 6, veras=L(6) - 6, sube=A(6, 0.55), saluda=A(6, 0.8),
         averia=L(7) - 6, baja=A(7, 0.22), corre=A(7, 0.32), primero=A(7, 0.55), medalla=A(7, 0.8), ganador=L(8) - 6, cartero2=L(9) - 6, siesta=A(9, 0.5), cuarto=A(9, 0.82), end=FR)
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
# ---------- music: a ragtime two-step for 1904 (stride piano, banjo, tuba, clarinet), a lazy waltz box for the nap ----------
C = lambda k: 261.63 * 2 ** (k / 12)   # semitones from C4
bpm = 124; beat = 60 / bpm; bar = 4 * beat
CH = [(0, [0, 4, 7]), (0, [0, 4, 7]), (5, [5, 9, 12]), (0, [0, 4, 7]), (2, [2, 6, 9]), (7, [7, 11, 14]), (0, [0, 4, 7]), (7, [7, 11, 14])]   # C C F C D7 G C G
MEL = [[(16, 0.5), (15, 0.5), (16, 0.5), (19, 0.5), (24, 1), (21, 1)], [(19, 0.5), (16, 0.5), (12, 1), (14, 0.5), (16, 1.5)], [(17, 0.5), (16, 0.5), (17, 0.5), (21, 0.5), (24, 1), (21, 1)], [(19, 0.5), (17, 0.5), (16, 1), (12, 2)],
       [(18, 0.5), (19, 0.5), (21, 0.5), (18, 0.5), (14, 1), (18, 1)], [(19, 0.5), (23, 0.5), (26, 1), (23, 0.5), (19, 1.5)], [(16, 0.5), (15, 0.5), (16, 0.5), (19, 0.5), (24, 1), (19, 1)], [(23, 0.5), (21, 0.5), (19, 0.5), (17, 0.5), (14, 2)]]
stride = np.zeros(N); bj = np.zeros(N); cl = np.zeros(N); box = np.zeros(N); st = np.zeros(N); brs = np.zeros(N); low = np.zeros(N); tub = np.zeros(N)
nb = int(TOTAL / bar) + 1
for b in range(nb):
    t0 = b * bar; root, ch = CH[b % 8]
    for i in range(4):
        if i % 2 == 0: at(stride, piano(C(root - 24 + (7 if i == 2 else 0)), 0.6, 0.9), t0 + i * beat, 1.0); at(tub, tuba(C(root - 24 + (7 if i == 2 else 0)), 0.4), t0 + i * beat, 0.5)
        else:
            for j, k in enumerate(ch): at(stride, piano(C(k - 12), 0.4, 0.45), t0 + i * beat + 0.004 * j, 1.0)
            at(stride, hat(0.5), t0 + i * beat, 1.0)
        for j, k in enumerate(ch): at(bj, pluck(C(k), 0.3, 1.6), t0 + i * beat + 0.5 * beat + 0.008 * j, 0.7)
    t = 0.0
    for m, d in MEL[b % 8]: at(cl, reed(C(m - 12), d * beat * 0.92), t0 + t * beat, 1.0); at(box, glock(C(m), 1.2), t0 + t * beat, 1.0); t += d
    at(st, strings([C(k - 12) for k in ch] + [C(root - 24)], bar + 0.8), t0, 1.0); at(low, strings([C(root - 24), C(root - 17)], bar + 0.4, 700), t0, 1.0)
    at(brs, brass([C(k) for k in ch] + [C(root - 12)], beat * 1.2), t0, 1.0)
def sec(spans):
    g = np.zeros(N)
    for a, b, x in spans: g[(tt >= F(a)) & (tt < F(b))] = x
    return lp(g, 4.0)
RAG = [(0, B["momento"], 1.0), (B["veras"], B["ganador"], 1.0), (B["cuarto"] - 40, FR - 20, 1.1)]
mus = (stride * 1.2 * sec(RAG) + tub * sec(RAG) + bj * sec([(B["sanluis"], B["momento"], 0.8), (B["veras"], B["primero"] - 20, 0.9)])
       + cl * sec([(0, B["agua"], 0.8), (B["cartero"], B["momento"], 1.0), (B["sube"], B["primero"], 1.0), (B["cuarto"] - 40, FR - 20, 1.0)])
       + box * sec([(B["cartero2"], B["cuarto"] - 40, 1.0), (B["momento"], B["veras"], 0.5)])
       + st * 3.0 * sec([(B["momento"], B["veras"], 0.8), (B["ganador"], B["cartero2"], 1.0), (B["cartero2"], B["cuarto"] - 40, 0.5)])
       + low * 5.0 * sec([(B["ganador"], B["cartero2"], 0.7)])
       + brs * sec([(B["primero"] - 10, B["ganador"], 0.9), (B["cuarto"], FR - 20, 1.0)]))
for k in (0, 4, 7, 12, 16): at(mus, piano(C(k - 12 if k < 12 else k), 4.0, 0.9), F(FR - 30) + 0.03 * k / 3, 1.0); at(mus, glock(C(k + 12), 2.0), F(FR - 30) + 0.05 * k / 3, 0.6)
sfx = np.zeros(N)
def thud(f=90, d=0.25): n = int(0.4 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t * np.exp(-t * 6)) * env(n, 0.002, d) + lp(rng.standard_normal(n), 300) * env(n, 0.001, 0.03) * 0.5
def whoosh(d=0.32, lo=400, hi=2600): n = int(d * SR); t = np.arange(n) / SR; return bp(rng.standard_normal(n), lo, hi) * np.sin(np.pi * t / d) ** 2 * 0.5
def clink(fs=(2650, 3910, 5200), d=0.06): n = int(0.35 * SR); t = np.arange(n) / SR; return sum(np.sin(2 * np.pi * f * t) for f in fs) / len(fs) * env(n, 0.001, d)
def sparkle():
    out = np.zeros(int(0.7 * SR))
    for k in range(7): c = clink((2000 + 600 * k, 3300 + 700 * k), 0.05) * 0.5; i = int(k * 0.07 * SR); out[i:i + len(c)] += c[:len(out) - i]
    return out
def pop(f0=500): n = int(0.12 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * (f0 + 1800 * t / 0.12) * t) * env(n, 0.001, 0.03) * 0.6
def ding(f=1318): n = int(0.9 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t)) * env(n, 0.002, 0.3) * 0.5
def slidew(d, f0, f1): n = int(d * SR); t = np.arange(n) / SR; f = f0 + (f1 - f0) * t / d; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.05).clip(0, 1) * 0.35
def gull(): n = int(0.35 * SR); t = np.arange(n) / SR; f = 1900 + 900 * np.sin(np.pi * t / 0.35); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.35) ** 2 * 0.25
def knock(g=1.0):                      # willow on leather
    n = int(0.16 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 620 * t * np.exp(-t * 5)) * env(n, 0.0005, 0.03) + np.sin(2 * np.pi * 1450 * t) * env(n, 0.0005, 0.012) * 0.6 + bp(rng.standard_normal(n), 900, 4500) * env(n, 0.0005, 0.008) * 0.8) * g
def tick(hi=True): n = int(0.04 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * (2300 if hi else 1700) * t) * env(n, 0.0005, 0.006) * 0.5
def snore(d=1.1): n = int(d * SR); t = np.arange(n) / SR; return lp(np.sign(np.sin(2 * np.pi * 34 * t)) * (0.6 + 0.4 * rng.standard_normal(n)), 420) * np.sin(np.pi * t / d) ** 2 * 0.5
def horn(d=1.6):                       # the liner
    n = int(d * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in (87.3, 110.0, 130.8):
        for h in range(1, 9): s += np.sin(2 * np.pi * f * h * t + h) / h
    return lp(s, 1400) * np.minimum(1, t / 0.12) * np.minimum(1, (d - t) / 0.35).clip(0, 1) * 0.12
def whistle(d=0.9, f0=1050):           # steam whistle / the station master's
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f0 * t * (1 + 0.004 * np.sin(2 * np.pi * 9 * t))) + 0.7 * np.sin(2 * np.pi * f0 * 1.26 * t) + bp(rng.standard_normal(n), 1500, 6000) * 0.25) * np.minimum(1, t / 0.04) * np.minimum(1, (d - t) / 0.12).clip(0, 1) * 0.2
def chuff(g=1.0): n = int(0.16 * SR); return bp(rng.standard_normal(n), 250, 2600) * env(n, 0.004, 0.045) * g
def hiss(a, b, g, lo=2500, hi=9000):
    n = int((b - a) / 30 * SR); t = np.arange(n) / SR; d = n / SR
    at(sfx, bp(rng.standard_normal(n), lo, hi) * 0.1 * np.minimum(1, t / 0.1) * np.minimum(1, (d - t) / 0.4).clip(0, 1), F(a), g)
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
    for f in np.arange(a, b, every): at(sfx, thud(f0, 0.05), F(f), g)
def bed(x, spans, g):
    gg = np.zeros(N)
    for a, b in spans: gg[(tt >= F(a)) & (tt < F(b))] = 1
    return x * lp(gg, 2.5) * g
def bell(f=1900, d=0.5): n = int(d * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.4 * t) + 0.25 * np.sin(2 * np.pi * f * 3.9 * t)) * env(n, 0.001, d * 0.3) * 0.4
def hoof(g=1.0): n = int(0.07 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * 900 * t * np.exp(-t * 20)) + bp(rng.standard_normal(n), 700, 2600) * 0.5) * env(n, 0.0005, 0.012) * g
def hooves(a, b, g):
    f = float(a)
    while f < b: at(sfx, hoof(), F(f), g); at(sfx, hoof(0.8), F(f + 2.2), g); f += 7.5
def bark(g=1.0): n = int(0.13 * SR); t = np.arange(n) / SR; return lp(np.sign(np.sin(2 * np.pi * (420 - 900 * t) * t)) * (0.7 + 0.3 * rng.standard_normal(n)), 1800) * env(n, 0.004, 0.035) * 0.5 * g
def scratch(d=0.5): n = int(d * SR); t = np.arange(n) / SR; return bp(rng.standard_normal(n), 2500, 7000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 9 * t))) * np.sin(np.pi * t / d) * 0.25
crowdn = bp(rng.standard_normal(N), 250, 1100) * (0.6 + 0.4 * lp(np.abs(rng.standard_normal(N)), 3) * 4) * 0.05
windn = lp(rng.standard_normal(N), 500) * 0.05 * (0.6 + 0.4 * np.sin(2 * np.pi * tt / 5.3))
cric = np.zeros(N)
for f0 in np.arange(0, FR, 4.0): n = int(0.05 * SR); t = np.arange(n) / SR; at(cric, np.sin(2 * np.pi * 4300 * t) * env(n, 0.002, 0.012) * 0.12, F(f0 + 2 * rng.random()), 0.4 + 0.6 * rng.random())
COUNTRY = [(0, B["sanluis"] + 30), (B["sanluis"] + 70, B["primero"] - 26), (B["cartero2"], B["cuarto"] - 34)]
STAD = [(B["sanluis"] + 30, B["sanluis"] + 110), (B["primero"] - 26, B["cartero2"]), (B["cuarto"] - 34, FR)]
sfx += bed(windn, COUNTRY, 1.0) + bed(cric, COUNTRY, 0.8) + bed(crowdn, STAD, 3.0)
def engine(a, b, g, rate=9.0):          # the putt-putt of a 1904 engine
    f = float(a); k = 0
    while f < b: at(sfx, thud(62 + 8 * (k % 2), 0.035), F(f), g); at(sfx, bp(rng.standard_normal(int(0.05 * SR)), 300, 1800) * env(int(0.05 * SR), 0.002, 0.02) * 0.4, F(f), g); f += 30 / rate; k += 1
def honk(t, g=1.0): n = int(0.32 * SR); x = np.arange(n) / SR; at(sfx, np.sign(np.sin(2 * np.pi * 330 * x * (1 - 0.15 * x))) * env(n, 0.005, 0.12) * 0.25, F(t), g)
# HOOK: the car, the horn, runners' feet
engine(0, B["sanluis"] + 20, 0.9, 10); honk(30, 1.0); honk(42, 0.8); steps(0, B["sanluis"], 6.2, 0.35, 220)
# the flight over the fair; the pack and the officials' cars
at(sfx, whoosh(1.2, 200, 1800), F(B["sanluis"] - 4), 1.2); applause(B["sanluis"] + 30, B["sanluis"] + 120, 1.4); engine(B["sanluis"] + 90, B["agua"], 0.6, 8); steps(B["sanluis"] + 90, B["agua"], 2.1, 0.45, 230)
# the well: the creak of the windlass, the stopwatch, the sad runner
at(sfx, whoosh(0.8, 300, 2400), F(B["agua"] - 4), 0.8)
for f0 in np.arange(B["agua"] + 20, B["agua"] + 90, 15.0): at(sfx, tick(int(f0 / 15) % 2 == 0), F(f0), 0.6)
at(sfx, slidew(0.5, 700, 380), F(B["agua"] + 70), 0.5); at(sfx, pop(500), F(B["agua"] + 50), 0.4); steps(B["agua"], B["cartero"], 2.3, 0.4, 230)
# the postman; the dogs and the corn
steps(B["cartero"], B["perros"] + 40, 2.4, 0.5, 220)
for k in range(9): at(sfx, bark(), F(B["perros"] - 20 + k * 7 + 3 * rng.random()), 0.9)
at(sfx, whoosh(0.6, 400, 3000), F(B["perros"] + 20), 0.7)
for k in range(10): at(sfx, bp(rng.standard_normal(int(0.08 * SR)), 1500, 6000) * env(int(0.08 * SR), 0.004, 0.03) * 0.5, F(B["perros"] + 26 + k * 4), 0.7)
# wait...
at(sfx, slidew(0.35, 1400, 500), F(B["momento"] + 2), 0.5); at(sfx, pop(), F(B["momento"] + 22), 0.7)
# the car stops, he jumps in, the horn, off
engine(B["momento"] - 10, B["averia"], 0.9, 9); at(sfx, thud(140, 0.06), F(B["sube"] + 14), 1.0); at(sfx, whoosh(0.4, 300, 2600), F(B["sube"]), 0.8); honk(B["sube"] + 26, 1.0); honk(B["saluda"], 0.9)
# the breakdown: a bang, steam, he runs; the flight; the tape, the roar, the magnesium
at(sfx, thud(55, 0.3), F(B["averia"] + 6), 1.6); hiss(B["averia"] + 8, B["corre"] + 30, 1.4, 1500, 7000); at(sfx, slidew(0.6, 600, 200), F(B["averia"] + 12), 0.5)
steps(B["corre"], B["primero"] - 26, 2.2, 0.5, 240); at(sfx, whoosh(1.0, 200, 2200), F(B["primero"] - 26), 1.2); steps(B["primero"] - 10, B["primero"] + 20, 2.2, 0.5, 240)
roar(B["primero"], B["ganador"], 2.0, 0.3); applause(B["primero"] + 4, B["ganador"], 1.6); at(sfx, sparkle(), F(B["medalla"]), 0.7)
at(sfx, whoosh(0.2, 800, 6000), F(B["medalla"] + 9), 1.3); at(sfx, thud(80, 0.2), F(B["medalla"] + 10), 1.6); hiss(B["medalla"] + 11, B["medalla"] + 28, 0.8, 800, 3000)
# the real winner: murmurs, dragging feet, a gasp at the tape
for f0 in np.arange(B["ganador"] + 4, B["cartero2"] - 30, 8.5): at(sfx, thud(180, 0.05), F(f0), 0.6)
at(sfx, slidew(0.8, 500, 300), F(B["ganador"] + 60), 0.35); applause(B["ganador"] + 140, B["cartero2"], 1.2)
# the orchard: crunch, crunch, snore, the others go by; the flight; fourth
for k in range(3): at(sfx, bp(rng.standard_normal(int(0.12 * SR)), 1200, 7000) * env(int(0.12 * SR), 0.002, 0.04) * 0.8, F(B["cartero2"] + 20 + k * 18), 0.9)
for k in range(2): at(sfx, snore(1.0), F(B["siesta"] + k * 30), 1.1)
steps(B["siesta"], B["siesta"] + 70, 2.4, 0.4, 220); at(sfx, whoosh(1.0, 200, 2200), F(B["cuarto"] - 34), 1.2); steps(B["cuarto"] - 20, B["cuarto"] + 10, 2.3, 0.5, 240)
roar(B["cuarto"], FR - 10, 1.8, 0.3); applause(B["cuarto"] + 4, FR - 10, 1.4); at(sfx, ding(1568), F(B["cuarto"] + 6), 0.6); at(sfx, sparkle(), F(B["cuarto"] + 8), 0.6)
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

