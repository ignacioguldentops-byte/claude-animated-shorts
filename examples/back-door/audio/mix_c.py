# "La puerta de atrás": original melancholy score + synthesized SFX, ducked under the voice.
# Slow felt piano (A minor: Am F C G) over a string pad; it turns to the relative major when Paula appears.
# Rain, a distant crowd, knocks on a door. Every cue is placed from src/c/timing.ts, like the picture.
# usage: python3 mix_p.py <voice.wav> <tag>   ->  mix_raw<tag>.wav
import numpy as np, soundfile as sf, sys, json, re, os
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
ts = open(HERE + "/../src/c/timing.ts").read()
LINES = json.loads(re.search(r"LINES[^=]*= (\[.*?\]);", ts, re.S).group(1)); FR = int(re.search(r"TOTAL = (\d+)", ts).group(1))
L = lambda l: LINES[l - 1][0]; E = lambda l: LINES[l - 1][1]; A = lambda l, t=0.0: round(L(l) + (E(l) - L(l)) * t); CUT = 3
B = dict(tv=A(1, 0.3), tres=A(1, 0.58), burger=A(1, 0.8), antes=L(2) - CUT, cuarto=A(2, 0.45), doce=L(3) - CUT, madre=A(3, 0.52), futb=A(3, 0.84),
         llama=L(4) - CUT, lloron=A(4, 0.72), hambre=L(5) - CUT, asi=L(6) - CUT, puerta=A(6, 0.42), sobra=A(6, 0.84), abren=L(7) - CUT, edna=A(7, 0.55),
         dan=L(8) - CUT, sinp=A(8, 0.6), espera=L(9) - CUT, porque=A(9, 0.25), veras=L(10) - CUT, todo=A(10, 0.36), nunca=A(10, 0.56),
         dijo=L(11) - CUT, devol=A(11, 0.62), una=L(12) - CUT, paula=A(12, 0.3), siva=A(12, 0.75), deudas=L(13) - CUT, misma=L(14) - CUT, knock=A(14, 0.5), end=FR)
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
# ---------- music: slow felt piano + strings, 66 bpm ----------
Am = lambda k: 220.0 * 2 ** (k / 12)   # semitones from A3
def piano(f, dur=2.4, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for d in (1.0, 1.0015):
        for h in range(1, 7): s += np.sin(2 * np.pi * f * d * h * t + h * 0.3) * np.exp(-t * (0.9 + 0.75 * h)) / h ** 1.7
    return lp(s, 2600) * np.minimum(1, t / 0.006) * 0.3 * g
def strings(fs, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in fs:
        for dt in (0.996, 1.0, 1.004):
            for h in range(1, 6): s += np.sin(2 * np.pi * f * dt * h * t + h) / h ** 1.3
    return lp(s, 1500) * np.minimum(1, t / 0.9) * np.minimum(1, (dur - t) / 0.9).clip(0, 1) * 0.03
beat = 60 / 66; bar = 4 * beat
t_turn = F(B["una"])
minor = [(0, [0, 3, 7]), (-4, [-4, 0, 3]), (3, [3, 7, 10]), (-2, [-2, 2, 5])]          # Am F C G
major = [(3, [3, 7, 10]), (-2, [-2, 2, 5]), (0, [0, 3, 7]), (-4, [-4, 0, 3])]          # C G Am F
melm = [[(19, 2), (15, 1), (14, 1)], [(12, 2), (15, 1), (17, 1)], [(19, 2), (22, 1), (19, 1)], [(17, 3), (14, 1)]]
melM = [[(19, 2), (22, 1), (24, 1)], [(26, 2), (22, 1), (19, 1)], [(24, 2), (19, 1), (15, 1)], [(17, 2), (19, 2)]]
pn = np.zeros(N); st = np.zeros(N)
nb = int(TOTAL / bar) + 1
for b in range(nb):
    t0 = b * bar; brt = t0 >= t_turn; root, ch = (major if brt else minor)[b % 4]
    for i, k in enumerate((root - 12, ch[1] - 12 + 12 * 0, ch[2] - 12, ch[0], ch[2] - 12, ch[1], ch[2] - 12, ch[0])): at(pn, piano(Am(k), 2.2, 0.55 if i else 0.8), t0 + i * beat / 2, 1.0)
    t = 0.0
    for m, d in (melM if brt else melm)[b % 4]: at(pn, piano(Am(m), 2.6, 0.9), t0 + t * beat + 0.012, 1.0); t += d
    at(st, strings([Am(k - 12) for k in ch] + [Am(root - 24)], bar + 1.2), t0, 1.0)
SEC = [(0, B["tres"], 0.0, 0.7), (B["tres"], B["burger"], 0.25, 0.8), (B["burger"], B["espera"], 0.85, 0.8), (B["espera"], B["veras"], 0.4, 0.6), (B["veras"], B["nunca"], 1.0, 1.25),
       (B["nunca"], B["una"], 0.8, 0.8), (B["una"], FR - 30, 1.0, 1.0), (FR - 30, FR, 0.0, 0.5)]
g1 = np.zeros(N); g2 = np.zeros(N)
for a, b, x1, x2 in SEC: m_ = (tt >= F(a)) & (tt < F(b)); g1[m_] = x1; g2[m_] = x2
mus = pn * lp(g1, 2.5) + st * lp(g2, 2.0) * 3.0
for k in (3, 7, 10, 15, 19): at(mus, piano(Am(k - 12 if k < 12 else k), 4.0, 0.9), F(FR - 34) + 0.03 * k / 3, 1.0)        # last chord: C major, left to ring
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
def steps(a, b, every, g, f0=170):
    for f in np.arange(a, b, every): at(sfx, thud(f0, 0.05), F(f), g)
def bed(x, spans, g):
    gg = np.zeros(N)
    for a, b in spans: gg[(tt >= F(a)) & (tt < F(b))] = 1
    return x * lp(gg, 2.5) * g
rainn = hp(lp(rng.standard_normal(N), 9000), 1800) * 0.05 + bp(rng.standard_normal(N), 300, 900) * 0.02
sfx += bed(rainn, [(B["burger"], B["antes"]), (B["llama"], B["hambre"]), (B["espera"], B["veras"]), (B["nunca"], B["dijo"])], 1.0)
crowdn = bp(rng.standard_normal(N), 250, 1100) * (0.6 + 0.4 * lp(np.abs(rng.standard_normal(N)), 3) * 4) * 0.05
sfx += bed(crowdn, [(0, B["burger"])], 2.6) + bed(crowdn, [(B["veras"], B["nunca"])], 4.0)
cab = bp(rng.standard_normal(N), 70, 420) * 0.07 + bp(rng.standard_normal(N), 900, 2400) * 0.01
sfx += bed(cab, [(B["doce"], B["llama"])], 2.2)
wind = bp(rng.standard_normal(N), 200, 800) * (0.5 + 0.5 * np.sin(tt * 1.1)) * 0.04
sfx += bed(wind, [(B["antes"], B["doce"]), (B["hambre"], B["espera"]), (B["dijo"], FR)], 2.6)
roar(B["veras"] + 4, B["nunca"], 1.3)
# spot effects
for k in ("tv", "burger", "madre", "edna", "sinp", "todo"): at(sfx, whoosh(0.5, 300, 1800), F(B[k] - 6), 0.3)
for f0 in (6, 20, 44): at(sfx, shutter(), F(f0), 0.5)
at(sfx, pop(), F(B["tv"]), 0.4)                                                    # microphone
for i in range(3): at(sfx, pop(), F(B["tres"] + 4 + i * 10), 0.5)                 # three silhouettes
at(sfx, sparkle(), F(B["burger"] + 6), 0.5)
at(sfx, whoosh(2.4, 150, 900), F(B["doce"] + 4), 0.8)                              # the plane passes
steps(B["hambre"] + 2, B["asi"], 8, 0.3)
for k in (B["puerta"] + 6, B["puerta"] + 14, B["puerta"] + 22): at(sfx, thud(150, 0.1), F(k), 1.2)   # knock, knock, knock
at(sfx, slidew(0.5, 190, 300), F(B["abren"] - 2), 0.5); at(sfx, clink((900, 1300), 0.03), F(B["abren"] + 4), 0.4)   # the door opens
at(sfx, sparkle(), F(B["edna"] + 4), 0.4)
at(sfx, slide(0.5), F(B["dan"] + 6), 1.0); at(sfx, slide(0.3), F(B["dan"] + 16), 0.7)                   # the paper bag
for i in range(4): at(sfx, slide(0.15), F(B["sinp"] + 6 + i * 9), 0.5)
at(sfx, pop(), F(B["porque"]), 0.5)
for k in range(3): at(sfx, thud(60, 0.5), F(B["veras"] + 6 + k * 14), 0.7); at(sfx, sparkle(), F(B["veras"] + 8 + k * 14), 0.5)
steps(B["una"] + 4, B["paula"] + 14, 10, 0.4, 320)                                  # her steps
at(sfx, sparkle(), F(B["siva"]), 0.6)
at(sfx, slide(0.3), F(B["deudas"] + 8), 0.6)
for k in (B["knock"], B["knock"] + 8): at(sfx, thud(150, 0.1), F(k), 1.2)
at(sfx, slidew(0.6, 190, 300), F(B["knock"] + 14), 0.5); at(sfx, sparkle(), F(B["knock"] + 22), 0.5)
# ---------- mix: duck music under the voice, music +3 dB, sfx -6 dB (skill standard) ----------
venv = lp(np.abs(voice), 8); duck = 1 - 0.45 * np.clip(venv / (np.percentile(venv, 90) + 1e-9), 0, 1)
m = mus / (np.max(np.abs(mus)) + 1e-9) * 0.2 * 10 ** (3 / 20) * duck + pad / (np.max(np.abs(pad)) + 1e-9) * 0.14 * (0.6 + 0.4 * duck)
s = sfx / (np.max(np.abs(sfx)) + 1e-9) * 0.45 * 10 ** (-6 / 20)
mix = voice * 0.8 + m + s
fade = np.ones(N); fade[-int(0.8 * SR):] = np.linspace(1, 0, int(0.8 * SR)); mix *= fade
mix = np.tanh(mix * 1.1) / 1.1
sf.write(HERE + "/mix_raw" + TAG + ".wav", np.stack([mix, mix], 1), SR)
sf.write(HERE + "/music" + TAG + ".wav", m, SR); sf.write(HERE + "/sfx" + TAG + ".wav", s, SR)
print("ok", N / SR)
