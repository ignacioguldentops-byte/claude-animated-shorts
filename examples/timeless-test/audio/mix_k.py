# "Sin límite": original score + synthesized SFX, ducked under the voice.
# usage: python3 mix_p.py <voice.wav> <tag>   ->  mix_raw<tag>.wav
import numpy as np, soundfile as sf, sys, json, re, os
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
ts = open(HERE + "/../src/k/timing.ts").read()
LINES = json.loads(re.search(r"LINES[^=]*= (\[.*?\]);", ts, re.S).group(1)); FR = int(re.search(r"TOTAL = (\d+)", ts).group(1))
L = lambda l: LINES[l - 1][0]; E = lambda l: LINES[l - 1][1]; A = lambda l, t=0.0: round(L(l) + (E(l) - L(l)) * t); CUT = 3
B = dict(diez=A(1, 0.22), sin=A(1, 0.45), barco=A(1, 0.68), sud=L(2) - CUT, ing=A(2, 0.3), limite=A(2, 0.6),
         dia=L(3) - CUT, tres=A(3, 0.2), seis=A(3, 0.34), comer=A(3, 0.47), dom=A(3, 0.79), espera=L(4) - CUT, q=A(4, 0.4),
         veras=L(5) - CUT, mientras=A(5, 0.57), diez2=L(6) - CUT, dos=A(6, 0.52), decimo=L(7) - CUT, llover=A(7, 0.73),
         barco2=L(8) - CUT, maletas=A(8, 0.5), largo=L(9) - CUT, empate=A(9, 0.62), hoy=L(10) - CUT, aun=A(10, 0.5), end=FR)
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
# ---------- music: a jaunty two-step for 1939 (tuba, stride piano, clarinet), a music box for tea, a clock for the days ----------
bpm = 116; beat = 60 / bpm; bar = 4 * beat
CH = [(0, [0, 4, 7]), (0, [0, 4, 7]), (5, [5, 9, 12]), (0, [0, 4, 7]), (7, [7, 11, 14]), (5, [5, 9, 12]), (0, [0, 4, 7]), (7, [7, 11, 14])]   # G G C G D C G D
MEL = [[(12, 1), (16, 0.5), (19, 0.5), (24, 1), (19, 1)], [(21, 0.5), (19, 0.5), (16, 1), (12, 2)], [(17, 1), (21, 0.5), (24, 0.5), (29, 1), (24, 1)], [(23, 0.5), (24, 0.5), (19, 1), (16, 2)],
       [(14, 1), (18, 0.5), (21, 0.5), (26, 1), (21, 1)], [(24, 0.5), (21, 0.5), (17, 1), (21, 2)], [(19, 1), (16, 0.5), (12, 0.5), (16, 1), (19, 1)], [(18, 1), (21, 1), (26, 2)]]
two = np.zeros(N); cl = np.zeros(N); box = np.zeros(N); pn = np.zeros(N); st = np.zeros(N); brs = np.zeros(N); low = np.zeros(N)
nb = int(TOTAL / bar) + 1
for b in range(nb):
    t0 = b * bar; root, ch = CH[b % 8]
    for i in range(4):
        if i % 2 == 0: at(two, tuba(G_(root - 24 + (7 if i == 2 else 0)), 0.4) * 0.5, t0 + i * beat, 1.0)
        else: at(two, squeeze([G_(k - 12) for k in ch], 0.2), t0 + i * beat, 1.6); at(two, piano(G_(ch[0]), 0.5, 0.5) + piano(G_(ch[1]), 0.5, 0.4) + piano(G_(ch[2]), 0.5, 0.4), t0 + i * beat, 0.6); at(two, hat(0.7), t0 + i * beat, 1.0)
    t = 0.0
    for m, d in MEL[b % 8]: at(cl, reed(G_(m), d * beat * 0.95), t0 + t * beat, 1.0); at(box, glock(G_(m + 12), 1.4), t0 + t * beat, 1.0); t += d
    for i, k in enumerate((root - 12, ch[1] - 12, ch[2] - 12, ch[0], ch[2] - 12, ch[1], ch[2] - 12, ch[0])): at(pn, piano(G_(k), 2.2, 0.55 if i else 0.8), t0 + i * beat / 2, 1.0)
    at(st, strings([G_(k - 12) for k in ch] + [G_(root - 24)], bar + 0.8), t0, 1.0)
    at(low, strings([G_(root - 24), G_(root - 17)], bar + 0.4, 700), t0, 1.0)
    at(brs, brass([G_(k) for k in ch] + [G_(root - 12)], beat * 1.4), t0, 1.0); at(brs, brass([G_(k) for k in ch], beat * 0.6), t0 + 2.5 * beat, 0.8)
def sec(spans):
    g = np.zeros(N)
    for a, b, x in spans: g[(tt >= F(a)) & (tt < F(b))] = x
    return lp(g, 4.0)
mus = (two * sec([(B["sud"], B["comer"], 1.0), (B["veras"], B["llover"], 1.0), (B["hoy"], FR - 24, 1.1)])
       + cl * sec([(B["sud"], B["dia"], 1.0), (B["dia"], B["comer"], 0.6), (B["veras"], B["decimo"], 1.0), (B["hoy"], FR - 24, 0.9)])
       + box * sec([(B["comer"], B["espera"], 1.0), (B["diez"], B["sin"], 0.5)])
       + pn * sec([(B["comer"], B["espera"], 0.6), (B["llover"] + 14, B["largo"], 0.5), (B["largo"], B["hoy"], 1.0)])
       + st * 3.0 * sec([(B["espera"], B["veras"], 0.7), (B["largo"], B["hoy"], 1.0), (B["llover"] + 14, B["largo"], 0.5)])
       + low * 5.0 * sec([(0, B["sud"], 1.0), (B["decimo"], B["llover"], 0.6)])
       + brs * sec([(B["decimo"], B["llover"], 0.5), (B["aun"], FR - 24, 0.8)]))
for k in (0, 4, 7, 12, 16): at(mus, piano(G_(k - 12 if k < 12 else k), 4.0, 0.9), F(FR - 30) + 0.03 * k / 3, 1.0); at(mus, glock(G_(k + 12), 2.0), F(FR - 30) + 0.05 * k / 3, 0.6)
# ---------- sfx ----------
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
crowdn = bp(rng.standard_normal(N), 250, 1100) * (0.6 + 0.4 * lp(np.abs(rng.standard_normal(N)), 3) * 4) * 0.05
rainn = (bp(rng.standard_normal(N), 1800, 9000) * 0.06 + bp(rng.standard_normal(N), 300, 1200) * 0.03)
birds = np.zeros(N)
for f in np.arange(0, FR, 7.0): c = gull()[: int(0.12 * SR)] * 0.5; at(birds, np.interp(np.arange(int(len(c) * 0.6)) / 0.6, np.arange(len(c)), c), F(f + 3 * rng.random()), 0.5 + 0.5 * rng.random())
sfx += bed(crowdn, [(0, B["diez"]), (B["sud"], B["seis"]), (B["veras"], B["llover"] + 12)], 2.2) + bed(crowdn, [(B["decimo"], B["llover"]), (B["hoy"], FR)], 3.4)
sfx += bed(rainn, [(B["llover"] + 14, B["barco2"])], 3.2) + bed(rainn, [(B["barco2"], B["largo"])], 1.8) + bed(rainn, [(B["largo"], B["hoy"])], 1.2)
sfx += bed(birds, [(B["diez"], B["barco"]), (B["comer"], B["veras"]), (B["aun"], FR)], 1.0)
# HOOK: the run-up, the ball, the bat; the man asleep; three watches; the liner
steps(2, 16, 2.6, 0.4, 230); at(sfx, whoosh(0.3, 300, 3200), F(14), 1.0); at(sfx, whoosh(0.55, 600, 5000), F(17), 0.7); at(sfx, knock(1.6), F(34), 1.0); roar(34, B["diez"] + 6, 0.5, 0.2)
at(sfx, snore(1.1), F(B["diez"] + 4), 1.2); at(sfx, snore(1.0), F(B["diez"] + 30), 1.1)
for f in np.arange(B["sin"], B["barco"], 3.0): at(sfx, tick(int(f / 3) % 2 == 0), F(f), 0.7)
for k in range(3): at(sfx, pop(700 + 150 * k), F(B["sin"] + 5 + k * 9), 0.5)
waves(B["barco"], B["sud"], 1.6); at(sfx, gull(), F(B["barco"] + 6), 0.6); at(sfx, gull(), F(B["barco"] + 40), 0.5); at(sfx, horn(1.7), F(B["barco"] + 24), 3.0); hiss(B["barco"] + 24, B["barco"] + 70, 0.8)
# South Africa, 1939: the toss, the handshake, the watch
at(sfx, whoosh(0.6, 200, 1600), F(B["sud"] - 6), 0.7); applause(B["ing"] + 12, B["ing"] + 50, 1.6)
at(sfx, ding(2093), F(B["limite"] + 4), 0.6); at(sfx, clink((3100, 4700), 0.05), F(B["limite"] + 22), 0.6)
for f in np.arange(B["limite"] + 27, B["limite"] + 44, 3.0): at(sfx, tick(int(f / 3) % 2 == 0), F(f), 0.8)
at(sfx, slidew(0.6, 900, 2200), F(B["limite"] + 44), 0.6); at(sfx, thud(180, 0.05), F(B["limite"] + 62), 0.7); at(sfx, clink((1900, 2900), 0.03), F(B["limite"] + 63), 0.6)
# the days go by: a clock running away, the same ball again and again
for f in np.arange(B["dia"], B["comer"], 2.0): at(sfx, tick(int(f / 2) % 2 == 0), F(f), 0.55)
for k in range(1, 4): at(sfx, knock(1.0), F(B["dia"] + 26 * k), 0.8)
for a_, n_ in ((B["dia"], 1), (B["tres"], 3), (B["seis"], 6)): at(sfx, pop(600 + 120 * n_), F(a_ + 3), 0.6)
at(sfx, slidew(0.5, 520, 420), F(B["seis"] + 8), 0.35)                                                                    # an owl of sorts
# tea and Sunday
for f in np.arange(B["comer"] + 4, B["dom"], 9.0): at(sfx, clink((2400 + 500 * rng.random(), 3600), 0.03), F(f + 2 * rng.random()), 0.5)
hiss(B["comer"] + 14, B["comer"] + 34, 0.4, 600, 2500)
for k in range(2): at(sfx, snore(1.0), F(B["dom"] + 4 + k * 24), 1.1)
# wait...
at(sfx, snore(0.35), F(B["espera"] + 4), 1.2); at(sfx, pop(), F(B["q"]), 0.6)
# the batsman who will not budge; the bowler who cannot go on
at(sfx, ding(988), F(B["veras"] + 1), 0.6)
for r in (10, 54): at(sfx, whoosh(0.5, 600, 5000), F(B["veras"] + r), 0.5); at(sfx, knock(1.5), F(B["veras"] + r + 16), 1.0); at(sfx, thud(240, 0.04), F(B["veras"] + r + 28), 0.4)
at(sfx, slidew(0.25, 1300, 1700), F(B["veras"] + 48), 0.3); at(sfx, slidew(0.3, 1700, 1500), F(B["veras"] + 56), 0.3)   # he whistles
steps(B["mientras"] + 2, B["mientras"] + 38, 3.2, 0.4, 230); at(sfx, whoosh(0.3, 300, 3200), F(B["mientras"] + 36), 0.9); at(sfx, knock(1.3), F(B["mientras"] + 54), 0.9)
at(sfx, slidew(0.3, 900, 300), F(B["mientras"] + 60), 0.6); at(sfx, thud(70, 0.4), F(B["mientras"] + 70), 1.5); at(sfx, sparkle(), F(B["mientras"] + 74), 0.5)
# ten... twice... each side
for f in np.arange(B["diez2"] + 2, B["dos"], 5.1): at(sfx, pop(500 + 60 * ((f - B["diez2"]) / 5.1)), F(f), 0.35)
for k, d in enumerate((0, 2, 16, 26)): at(sfx, thud(120 + 30 * k, 0.1), F(B["dos"] + d), 0.9); at(sfx, pop(600 + 200 * k), F(B["dos"] + d + 1), 0.5)
# day ten: they run; the scoreboard; the first drop
steps(B["decimo"] + 6, B["decimo"] + 66, 2.4, 0.45, 250); roar(B["decimo"] + 4, B["decimo"] + 70, 1.4, 1.2); applause(B["decimo"] + 20, B["decimo"] + 70, 1.6)
at(sfx, whoosh(0.4, 300, 3000), F(B["decimo"] + 66), 0.9)
for k in range(3): at(sfx, ding(1568 * 2 ** (k / 12)), F(B["decimo"] + 76 + k * 8), 0.5)
at(sfx, ding(2637), F(B["llover"] + 12), 0.7); at(sfx, pop(1200), F(B["llover"] + 13), 0.4)
at(sfx, thud(42, 0.9), F(B["llover"] + 16), 2.4); at(sfx, lp(rng.standard_normal(int(1.6 * SR)), 180) * env(int(1.6 * SR), 0.05, 0.6) * 1.5, F(B["llover"] + 17), 1.0)   # thunder
steps(B["llover"] + 20, B["barco2"], 2.6, 0.3, 260)
# the train
hiss(B["barco2"], B["maletas"], 1.0); at(sfx, whistle(0.9, 1500), F(B["barco2"] + 30), 0.8)
at(sfx, whistle(1.2, 760), F(B["maletas"] + 6), 1.2)
f = B["maletas"] + 14.0; gap = 9.0
while f < B["largo"] - 4: at(sfx, chuff(1.0), F(f), 1.4); at(sfx, thud(60, 0.08), F(f), 0.5); f += gap; gap = max(2.6, gap * 0.9)
steps(B["maletas"], B["maletas"] + 52, 2.5, 0.4, 250); at(sfx, whoosh(0.3, 300, 2600), F(B["maletas"] + 20), 0.6); at(sfx, whoosh(0.3, 300, 2600), F(B["maletas"] + 30), 0.6); at(sfx, whoosh(0.45, 300, 2600), F(B["maletas"] + 44), 0.8)
# a draw
at(sfx, clink((1500, 2300), 0.04), F(B["empate"]), 0.8); at(sfx, thud(300, 0.03), F(B["empate"] + 1), 0.5); at(sfx, slidew(0.5, 700, 400), F(B["empate"] + 10), 0.35)
# today
roar(B["hoy"], B["aun"], 1.0, 0.8); applause(B["hoy"] + 4, B["aun"], 1.4)
for k in range(5): at(sfx, pop(600 + 150 * k), F(B["hoy"] + 8 + k * 9), 0.6); at(sfx, ding(1046 * 2 ** (2 * k / 12)), F(B["hoy"] + 9 + k * 9), 0.4)
at(sfx, snore(1.0), F(B["aun"] + 4), 1.1); at(sfx, snore(0.35), F(B["aun"] + 34), 1.2); at(sfx, pop(), F(B["aun"] + 42), 0.6)
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
