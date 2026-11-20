# "La trastienda": original score + synthesized SFX, ducked under the voice.
# usage: python3 mix_r.py <voice.wav> <tag>   ->  mix_raw<tag>.wav
import numpy as np, soundfile as sf, sys, json, re, os
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
ts = open(HERE + "/../src/r/timing.ts").read()
LINES = json.loads(re.search(r"LINES[^=]*= (\[.*?\]);", ts, re.S).group(1)); FR = int(re.search(r"TOTAL = (\d+)", ts).group(1))
L = lambda l: LINES[l - 1][0]; E = lambda l: LINES[l - 1][1]; A = lambda l, t=0.0: round(L(l) + (E(l) - L(l)) * t); CUT = 3
B = dict(fund=A(1, 0.24), tras=A(1, 0.56), madrid=L(2) - CUT, rareza=A(2, 0.19), est=A(2, 0.43), toros=A(2, 0.63), taberna=A(2, 0.84),
         falta=L(3) - CUT, llegan=L(4) - CUT, juan=A(4, 0.3), carlos=A(4, 0.38), bcn=A(4, 0.43), tienda=A(4, 0.62),
         su=L(5) - CUT, nace=A(5, 0.52), unif=L(6) - CUT, blanco=A(6, 0.28), londres=A(6, 0.44), espera=L(7) - CUT,
         veras=L(8) - CUT, rey=A(8, 0.4), rival=A(8, 0.7), barca=A(8, 0.86), pierde=L(9) - CUT, gol=A(9, 0.37), suizo=A(9, 0.8),
         asi=L(10) - CUT, fundado=A(10, 0.57), clasico=A(10, 0.83), end=FR)
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
# ---------- music: a street-organ two-step over the Andalusian cadence for 1902 (guitar, tuba, clarinet), a music box for London,
# a wide pad with a heartbeat for today's stadium ----------
Am = lambda k: 220.0 * 2 ** (k / 12)   # semitones from A3
bpm = 118; beat = 60 / bpm; bar = 4 * beat
CH = [(0, [0, 3, 7]), (0, [0, 3, 7]), (-2, [-2, 2, 5]), (-2, [-2, 2, 5]), (-4, [-4, 0, 3]), (-4, [-4, 0, 3]), (-5, [-5, -1, 2]), (-5, [-5, -1, 2])]   # Am Am G G F F E E
MEL = [[(12, 1), (15, 0.5), (19, 0.5), (24, 1), (19, 1)], [(22, 0.5), (19, 0.5), (15, 1), (12, 2)], [(10, 1), (14, 0.5), (17, 0.5), (22, 1), (17, 1)], [(19, 0.5), (17, 0.5), (14, 1), (10, 2)],
       [(8, 1), (12, 0.5), (15, 0.5), (20, 1), (15, 1)], [(17, 0.5), (15, 0.5), (12, 1), (8, 2)], [(7, 1), (11, 0.5), (14, 0.5), (19, 1), (16, 1)], [(17, 0.5), (16, 0.5), (14, 0.5), (11, 0.5), (16, 2)]]
two = np.zeros(N); cl = np.zeros(N); box = np.zeros(N); gt = np.zeros(N); st = np.zeros(N); brs = np.zeros(N); low = np.zeros(N); pulse = np.zeros(N); cast = np.zeros(N)
nb = int(TOTAL / bar) + 1
for b in range(nb):
    t0 = b * bar; root, ch = CH[b % 8]
    for i in range(4):
        if i % 2 == 0: at(two, tuba(Am(root - 24 + (7 if i == 2 else 0)), 0.4) * 0.5, t0 + i * beat, 1.0)
        else: at(two, squeeze([Am(k - 12) for k in ch], 0.2), t0 + i * beat, 1.5); at(two, hat(0.6), t0 + i * beat, 1.0)
        for j, k in enumerate(ch): at(gt, pluck(Am(k), 0.5, 1.2), t0 + i * beat + (0.5 * beat if i % 2 == 0 else 0) + 0.012 * j, 0.9)
        at(cast, rim(), t0 + i * beat + 0.5 * beat, 0.5); 
        if i == 3: at(cast, rim(), t0 + i * beat + 0.75 * beat, 0.4)
        at(pulse, kick(), t0 + i * beat, 1.0 if i % 2 == 0 else 0.5)
    t = 0.0
    for m, d in MEL[b % 8]: at(cl, reed(Am(m), d * beat * 0.95), t0 + t * beat, 1.0); at(box, glock(Am(m + 12), 1.4), t0 + t * beat, 1.0); t += d
    at(st, strings([Am(k - 12) for k in ch] + [Am(root - 24)], bar + 0.8), t0, 1.0)
    at(low, strings([Am(root - 24), Am(root - 17)], bar + 0.4, 700), t0, 1.0)
    at(brs, brass([Am(k) for k in ch] + [Am(root - 12)], beat * 1.4), t0, 1.0); at(brs, brass([Am(k) for k in ch], beat * 0.6), t0 + 2.5 * beat, 0.8)
def sec(spans):
    g = np.zeros(N)
    for a, b, x in spans: g[(tt >= F(a)) & (tt < F(b))] = x
    return lp(g, 4.0)
OLD = [(B["madrid"], B["falta"], 1.0), (B["llegan"], B["londres"], 1.0), (B["veras"], B["pierde"], 1.0), (B["gol"], B["asi"], 1.0)]
mus = (two * sec(OLD)
       + gt * 1.4 * sec(OLD + [(B["fund"] + 6, B["madrid"], 0.7), (B["falta"], B["llegan"], 0.5), (B["pierde"], B["gol"], 0.6)])
       + cast * sec([(B["madrid"], B["falta"], 1.0), (B["llegan"], B["su"], 1.0), (B["veras"], B["pierde"], 1.0)])
       + cl * sec([(B["madrid"], B["falta"], 1.0), (B["llegan"], B["unif"], 1.0), (B["unif"], B["londres"], 0.7), (B["veras"], B["pierde"], 1.0), (B["gol"], B["asi"], 0.9)])
       + box * sec([(B["londres"], B["espera"], 1.0), (B["fund"] + 6, B["madrid"], 0.4)])
       + st * 3.0 * sec([(0, B["fund"], 1.0), (B["falta"], B["llegan"], 0.8), (B["espera"], B["veras"], 0.8), (B["pierde"], B["gol"], 0.7), (B["asi"], FR - 24, 1.1)])
       + low * 5.0 * sec([(0, B["fund"], 1.0), (B["espera"], B["veras"], 0.8), (B["asi"], FR - 24, 0.8)])
       + pulse * 0.5 * sec([(0, B["fund"], 1.0), (B["espera"], B["veras"], 0.7), (B["asi"], FR - 24, 1.0)])
       + brs * sec([(0, B["fund"], 0.8), (B["llegan"], B["bcn"], 0.5), (B["nace"], B["unif"], 0.7), (B["veras"], B["rival"], 0.6), (B["asi"], FR - 24, 1.0)]))
for k in (0, 4, 7, 12, 16): at(mus, piano(Am(k - 12 if k < 12 else k), 4.0, 0.9), F(FR - 30) + 0.03 * k / 3, 1.0); at(mus, glock(Am(k + 12), 2.0), F(FR - 30) + 0.05 * k / 3, 0.6)
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
murmur = bp(rng.standard_normal(N), 180, 700) * (0.5 + 0.5 * lp(np.abs(rng.standard_normal(N)), 2) * 4) * 0.04
STAD = [(0, B["fund"]), (B["espera"], B["veras"]), (B["asi"], FR)]
sfx += bed(crowdn, STAD, 3.2) + bed(crowdn, [(B["veras"], B["asi"])], 1.8) + bed(murmur, [(B["madrid"], B["est"]), (B["llegan"], B["bcn"]), (B["tienda"], B["su"])], 2.2) + bed(crowdn, [(B["est"], B["falta"])], 0.9)
# HOOK: the run, the strike, the net, the roar; then the white flash into 1902 and the ball in his hands
steps(0, 13, 2.4, 0.5, 240); at(sfx, thud(110, 0.12), F(13), 2.2); at(sfx, knock(1.2), F(13), 0.8); at(sfx, whoosh(0.4, 500, 5000), F(13), 1.0); at(sfx, whoosh(0.25, 300, 1800), F(23), 0.9); roar(22, B["fund"] + 4, 2.2, 0.15)
at(sfx, whoosh(0.45, 200, 2400), F(B["fund"] - 6), 1.2); at(sfx, thud(150, 0.08), F(B["fund"] + 8), 1.2); at(sfx, pop(520), F(B["fund"] + 9), 0.5); at(sfx, sparkle(), F(B["tras"] - 2), 0.5)
for f in np.arange(B["fund"] + 14, B["madrid"], 15.0): at(sfx, tick(int(f / 15) % 2 == 0), F(f), 0.5)
# Madrid, 1902: the tram bell, cabs; the ball and the hat
for k in range(2): at(sfx, bell(1750, 0.5), F(B["madrid"] + 6 + k * 7), 0.9)
hooves(B["madrid"] + 4, B["rareza"], 0.5)
at(sfx, whoosh(0.4, 500, 4000), F(B["rareza"] + 18), 0.9); at(sfx, knock(1.3), F(B["rareza"] + 30), 1.0); at(sfx, pop(380), F(B["rareza"] + 30), 0.8); at(sfx, slidew(0.5, 600, 1500), F(B["rareza"] + 31), 0.4); at(sfx, thud(200, 0.04), F(B["rareza"] + 50), 0.5)
for k in range(3): at(sfx, bark(), F(B["rareza"] + 36 + k * 7), 0.8)
# the waste ground: boots on a leather ball, running, a dog; the tavern; the ball goes flat
for f in np.arange(B["est"] + 6, B["taberna"], 13.0): at(sfx, thud(140, 0.06), F(f), 0.9); at(sfx, knock(0.5), F(f), 0.5)
steps(B["toros"], B["taberna"], 2.4, 0.4, 230); at(sfx, bark(), F(B["est"] + 30), 0.6); at(sfx, bark(), F(B["est"] + 36), 0.5)
for i in range(3): at(sfx, whoosh(0.3, 300, 2600), F(B["taberna"] + 2 + i * 13), 0.6); at(sfx, pop(600 + 160 * i), F(B["taberna"] + 19 + i * 13), 0.7); at(sfx, clink((2200 + 300 * i, 3500), 0.04), F(B["taberna"] + 20 + i * 13), 0.4)
at(sfx, thud(170, 0.05), F(B["falta"] + 4), 0.8); at(sfx, slidew(0.7, 900, 240), F(B["falta"] + 9), 0.6); hiss(B["falta"] + 9, B["falta"] + 28, 1.0, 1500, 6000)
# the brothers: steps, the tram behind, a chime for each name; the little train on the map; the shop bell
steps(B["llegan"] + 2, B["bcn"], 6.0, 0.5, 190); at(sfx, bell(1750, 0.5), F(B["llegan"] + 20), 0.5); at(sfx, bell(1750, 0.5), F(B["llegan"] + 27), 0.5)
at(sfx, ding(1568), F(B["juan"]), 0.6); at(sfx, ding(1976), F(B["carlos"]), 0.6)
f = B["bcn"] + 2.0
while f < B["tienda"] - 8: at(sfx, chuff(0.8), F(f), 1.0); f += 3.2
at(sfx, whistle(0.35, 1700), F(B["bcn"] + 4), 0.5); at(sfx, ding(2093), F(B["tienda"] - 8), 0.6)
at(sfx, bell(2600, 0.35), F(B["tienda"] + 6), 0.8); at(sfx, bell(3100, 0.35), F(B["tienda"] + 10), 0.7); hooves(B["tienda"] + 30, B["su"], 0.5)
# the back room: the pen, the clock, and then everybody at once
for f in np.arange(B["su"] + 6, B["nace"] - 4, 11.0): at(sfx, scratch(0.3), F(f), 0.9)
for f in np.arange(B["su"], B["nace"], 15.0): at(sfx, tick(int(f / 15) % 2 == 0), F(f), 0.5)
at(sfx, thud(120, 0.1), F(B["nace"] + 4), 1.4); at(sfx, sparkle(), F(B["nace"] + 5), 0.8); roar(B["nace"] + 4, B["unif"], 0.9, 0.2); applause(B["nace"] + 6, B["unif"], 1.6)
# the kit: the bolt runs out; there he is in white; London: the chimes, the magnesium
at(sfx, whoosh(0.7, 500, 3500), F(B["unif"] + 4), 1.0); at(sfx, thud(260, 0.03), F(B["unif"] + 20), 0.5); at(sfx, whoosh(0.3, 300, 2600), F(B["blanco"] - 9), 0.8)
at(sfx, pop(700), F(B["blanco"] + 2), 0.8); at(sfx, sparkle(), F(B["blanco"] + 3), 0.8)
for k, n in enumerate((4, 0, 2, -5)): at(sfx, bell(330 * 2 ** (n / 12), 1.6), F(B["londres"] + 3 + k * 8), 0.9)
at(sfx, whoosh(0.2, 800, 6000), F(B["londres"] + 33), 1.3); at(sfx, thud(80, 0.2), F(B["londres"] + 34), 1.6); hiss(B["londres"] + 35, B["londres"] + 52, 0.8, 800, 3000)
# wait...
at(sfx, slidew(0.35, 1400, 500), F(B["espera"] + 2), 0.5); at(sfx, pop(), F(B["espera"] + 6), 0.7); at(sfx, pop(900), F(B["espera"] + 16), 0.6)
# the racecourse: applause, hooves, a bugle for the king; the two sides; the referee's whistle
applause(B["veras"] + 4, B["rival"], 1.6); hooves(B["veras"] + 6, B["rey"], 0.4)
for k, n in enumerate((0, 5, 9, 12)): at(sfx, brass([Am(n), Am(n + 12)], 0.22 if k < 3 else 0.6), F(B["rey"] + 3 + k * 5), 1.6)
at(sfx, sparkle(), F(B["rey"] + 22), 0.5)
at(sfx, thud(150, 0.08), F(B["rival"] + 3), 0.9); at(sfx, whoosh(0.35, 300, 3000), F(B["barca"] - 10), 1.0); at(sfx, thud(150, 0.08), F(B["barca"]), 0.9); at(sfx, whistle(0.4, 2100), F(B["barca"] + 10), 0.8)
# three goals
for i, t in enumerate((9, 25, 41)):
    at(sfx, whoosh(0.3, 500, 4500), F(B["pierde"] + t - 9), 0.8); at(sfx, thud(100, 0.12), F(B["pierde"] + t), 1.8); at(sfx, whoosh(0.2, 1500, 6000), F(B["pierde"] + t), 0.6); roar(B["pierde"] + t, B["pierde"] + t + 15, 1.0 + 0.3 * i, 0.1); at(sfx, ding(1046 * 2 ** (2 * i / 12)), F(B["pierde"] + t + 1), 0.4)
at(sfx, thud(70, 0.3), F(B["pierde"] + 47), 1.4); at(sfx, sparkle(), F(B["pierde"] + 50), 0.5)
# the scorer; the Swiss in him
steps(B["gol"] + 4, B["gol"] + 58, 2.4, 0.4, 230); roar(B["gol"], B["suizo"], 1.2, 0.5); applause(B["gol"] + 6, B["suizo"], 1.2)
at(sfx, pop(600), F(B["suizo"] + 6), 0.8)
for k in range(4): at(sfx, clink((620, 930, 1480), 0.12), F(B["suizo"] + 8 + k * 7), 0.9)
for k, (f0, f1) in enumerate(((700, 1050), (1050, 700), (700, 1180), (1180, 880))): at(sfx, slidew(0.2, f0, f1), F(B["suizo"] + 10 + k * 6), 0.5)
# today: the cups, the roar; the question; the shrug; everybody up
roar(B["asi"], B["fundado"], 1.6, 0.6); applause(B["asi"] + 4, B["fundado"], 1.2)
for f in np.arange(B["asi"] + 8, B["fundado"], 9.0): at(sfx, clink((2600 + 900 * rng.random(), 4100), 0.05), F(f), 0.5)
at(sfx, pop(), F(B["fundado"] + 22), 0.7); at(sfx, slidew(0.5, 500, 900), F(B["clasico"] + 2), 0.4); at(sfx, slidew(0.4, 900, 600), F(B["clasico"] + 12), 0.4)
roar(B["clasico"] + 18, FR - 10, 1.8, 0.3); applause(B["clasico"] + 20, FR - 10, 1.4); at(sfx, sparkle(), F(B["clasico"] + 20), 0.7)
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
