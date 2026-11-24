# "El perro que encontró la Copa": original score + synthesized SFX, ducked under the voice.
# One catchy caper theme in 6/8 that loops all the way through (minor for the crime, major from the find on).
# usage: python3 mix_w.py <voice.wav> <tag>  ->  mix_raw<tag>.wav
import numpy as np, soundfile as sf, sys, json, re, os
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
ts = open(HERE + "/../src/w/timing.ts").read()
LINES = json.loads(re.search(r"LINES[^=]*= (\[.*?\]);", ts, re.S).group(1)); FR = int(re.search(r"TOTAL = (\d+)", ts).group(1))
L = lambda l: LINES[l - 1][0]; E = lambda l: LINES[l - 1][1]; A = lambda l, t=0.0: round(L(l) + (E(l) - L(l)) * t)
cut = lambda a, b: round((E(a) + L(b)) / 2)
B = dict(londres=L(2), vitrina=A(2, 0.42), roba=A(2, 0.78), paquete=L(3), trozo=A(3, 0.42), carta=A(3, 0.66), policia=L(4), sospechoso=A(4, 0.3), nada=A(4, 0.62),
         momento=L(5), semana=A(5, 0.3), pickles=A(5, 0.85), veras=L(6), olfatea=A(6, 0.18), envuelta=A(6, 0.45), copa=A(6, 0.74), gano=L(7), banquete=A(7, 0.42), perro=A(7, 0.8), end=FR)
C1, C2, C3, C4 = cut(1, 2), cut(2, 3), cut(4, 5), cut(6, 7)
GRAB = B["roba"] - 8; UNWRAP = B["copa"] - 12
SR = 48000; TOTAL = FR / 30; N = int(TOTAL * SR)
rng = np.random.default_rng(23)
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
Em = lambda k: 164.81 * 2 ** (k / 12)   # semitones from E3
# ---------- instruments ----------
def ubass(f, dur=0.5):                 # plucked upright bass
    n = int(dur * SR); t = np.arange(n) / SR; s = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(4 * np.pi * f * t) * np.exp(-t * 8) + 0.2 * np.sin(6 * np.pi * f * t) * np.exp(-t * 14)
    return lp(s, 900) * np.minimum(1, t / 0.004) * np.exp(-t / 0.35) * 0.55
def vibe(f, dur=1.4):                  # vibraphone with motor tremolo
    n = int(dur * SR); t = np.arange(n) / SR; s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 4.0 * f * t) * np.exp(-t * 9) + 0.08 * np.sin(2 * np.pi * 10 * f * t) * np.exp(-t * 20)
    return s * np.exp(-t * 1.6) * (0.8 + 0.2 * np.sin(2 * np.pi * 5.5 * t)) * np.minimum(1, t / 0.002) * 0.22
def brush(g=1.0, d=0.09): n = int(0.18 * SR); return bp(rng.standard_normal(n), 1800, 9000) * env(n, 0.004, d) * 0.22 * g
def ride(g=1.0): n = int(0.5 * SR); t = np.arange(n) / SR; return (hp(rng.standard_normal(n), 5000) * 0.5 + np.sin(2 * np.pi * 5300 * t) * 0.1) * env(n, 0.001, 0.18) * 0.18 * g
def kick(g=1.0): n = int(0.25 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * 90 * t * np.exp(-t * 12)) * env(n, 0.001, 0.08) * g
def trumpet(f, dur, mute=True):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n); ph = 2 * np.pi * f * (t + 0.004 / (2 * np.pi * 5) * np.sin(2 * np.pi * 5 * t) * np.minimum(1, t / 0.3))
    for h in range(1, 14): s += np.sin(h * ph) / h ** (0.7 if mute else 0.9)
    s = bp(s, 700, 3800) if mute else lp(s, 4200)
    return s * np.minimum(1, t / 0.02) * np.minimum(1, (dur - t) / 0.05).clip(0, 1) * 0.06
def strings(fs, dur, cut=1600):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in fs:
        for dt in (0.996, 1.0, 1.004):
            for h in range(1, 6): s += np.sin(2 * np.pi * f * dt * h * t + h) / h ** 1.3
    return lp(s, cut) * np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.6).clip(0, 1) * 0.03
def pizz(f, dur=0.35):
    n = int(dur * SR); t = np.arange(n) / SR; s = sum(np.sin(2 * np.pi * f * h * t + h) * np.exp(-t * (9 + 4 * h)) / h for h in range(1, 7)); return s * np.minimum(1, t / 0.002) * 0.25
def glock(f, dur=1.2): n = int(dur * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t * 6)) * np.exp(-t * 3.2) * np.minimum(1, t / 0.002) * 0.22
def choir(fs, dur):                    # soft "aah" pad for the reveal
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in fs:
        for dt in (0.995, 1.0, 1.005):
            ph = 2 * np.pi * f * dt * t; x = sum(np.sin(h * ph) / h for h in range(1, 10)); s += x
    s = bp(s, 500, 1300) + 0.6 * bp(s, 1000, 2600)
    return s * np.minimum(1, t / 0.8) * np.minimum(1, (dur - t) / 1.0).clip(0, 1) * 0.012
def brass(fs, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in fs:
        for h in range(1, 10): s += np.sin(2 * np.pi * f * h * t + h) / h ** 0.8
    return lp(s, 3400) * np.minimum(1, t / 0.03) * np.minimum(1, (dur - t) / 0.12).clip(0, 1) * 0.08
def tuba(f, dur): n = int(dur * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(4 * np.pi * f * t) + 0.2 * np.sin(6 * np.pi * f * t)) * np.minimum(1, t / 0.01) * np.exp(-t / 0.22)
def snare(g=1.0): n = int(0.12 * SR); t = np.arange(n) / SR; return (bp(rng.standard_normal(n), 1200, 6000) * 0.7 + np.sin(2 * np.pi * 220 * t * np.exp(-t * 9)) * 0.5) * env(n, 0.001, 0.035) * g
# ---------- music: ONE catchy theme all the way through (the Maradona-hair recipe the user liked) ----------
# An original 8-bar caper tune in 6/8 (dotted quarter = 120, one bar per second): plucked mandolin lead, chord plucks
# on the off-beats, bass on 1 and 4, tambourine and drum. Minor (D minor) for the theft, the ransom and the police,
# thinned out in the office, a full stop on "Un momento", back for the walk, and the SAME tune in D major from the
# moment the cup comes out of the paper through the banquet. It loops every 8 s, so it sticks.
def pluck(f, dur=0.5, bright=1.0):     # mandolin-ish double string
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for d in (1, 1.006):
        for h in range(1, 9): s += np.sin(2 * np.pi * f * d * h * t + h) * np.exp(-t * (5 + 2.2 * h) / bright) / h ** 1.1
    return s * np.minimum(1, t / 0.002) * 0.25
def mbass(f, dur): n = int(dur * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t)) * env(n, 0.004, 0.28)
def jingle(g=1.0): n = int(0.09 * SR); return hp(rng.standard_normal(n), 6500) * env(n, 0.001, 0.022) * g
def drum(): n = int(0.16 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * 150 * t * np.exp(-t * 9)) * env(n, 0.001, 0.05)
def clap(): n = int(0.12 * SR); return bp(rng.standard_normal(n), 900, 4000) * (env(n, 0.001, 0.02) + 0.6 * np.roll(env(n, 0.001, 0.015), int(0.012 * SR))) * 0.5
Dk = lambda k: 293.66 * 2 ** (k / 12)   # semitones from D4
e8 = 60 / 120 / 3; bar = 6 * e8
MEL_m = [[7, None, 7, 8, 7, 5], [3, None, 2, 0, None, None], [7, None, 7, 8, 7, 5], [10, None, 8, 7, None, None],
         [12, None, 12, 10, 8, 7], [8, None, 7, 5, 3, 2], [3, 5, 7, 2, None, 1], [2, None, None, 0, None, None]]
MAJ = {3: 4, 8: 9, 10: 11, 1: 1}
MEL_M = [[None if m is None else MAJ.get(m, m) for m in b] for b in MEL_m]
CH_m = [[0, 3, 7], [0, 3, 7], [0, 3, 7], [-2, 2, 5], [-7, -2, 2], [-7, -2, 2], [-5, -1, 2, 5], [0, 3, 7]]
CH_M = [[0, 4, 7], [0, 4, 7], [0, 4, 7], [-5, -1, 4], [-7, -1, 2], [-7, -1, 2], [-5, -1, 2, 5], [0, 4, 7]]
ROOT = [0, 0, 0, -2, -7, -7, -5, 0]
def theme(MEL, CH, bright):
    lead, acc, low, perc = np.zeros(N), np.zeros(N), np.zeros(N), np.zeros(N)
    for b in range(int(TOTAL / bar) + 1):
        t0 = b * bar; i = b % 8
        for k, beat in enumerate((0, 3)): at(low, mbass(Dk(ROOT[i] - 24 + (7 if k else 0)), e8 * 2.6), t0 + beat * e8, 0.9)
        for beat in (1, 2, 4, 5):
            for j, kk in enumerate(CH[i]): at(acc, pluck(Dk(kk - 12), 0.3, 0.8), t0 + beat * e8 + j * 0.006, 0.18)
        for j, m in enumerate(MEL[i]):
            if m is not None: at(lead, pluck(Dk(m), 0.34, bright), t0 + j * e8, 0.55)
        for j in range(6): at(perc, jingle(1.0 if j in (0, 3) else 0.45), t0 + j * e8, 0.5)
        at(perc, drum(), t0, 0.6); at(perc, drum(), t0 + 3 * e8, 0.35); at(perc, clap(), t0 + 3 * e8, 0.35)
    return lead, acc, low, perc
lm, am, bm, pm = theme(MEL_m, CH_m, 1.1)
lM, aM, bM, pM = theme(MEL_M, CH_M, 1.4)
spark = np.zeros(N)                       # glockenspiel doubling the lead an octave up in the major sections
for b in range(int(TOTAL / bar) + 1):
    for j, m in enumerate(MEL_M[b % 8]):
        if m is not None: at(spark, glock(Dk(m + 12), 0.6), b * bar + j * e8, 0.35)
def sec(spans):
    g = np.zeros(N)
    for a, b, x in spans: g[(tt >= F(a)) & (tt < F(b))] = x
    return lp(g, 6.0)
MOM_A, MOM_B = C3 - 2, B["momento"] + 24          # the music stops dead on "Un momento" and comes back after it
MIN = [(0, C1, 1.0), (C1, GRAB, 0.9), (GRAB, C2, 1.0), (C2, C3 - 2, 0.0), (MOM_B, UNWRAP - 2, 0.75)]
mi = sec(MIN); ma = sec([(UNWRAP - 2, B["perro"] + 2, 1.0)])
office = sec([(C2, MOM_A, 1.0)])                   # the office: same tune, only lead and bass, no percussion, quieter
pg = sec([(0, C1, 1.0), (C1, GRAB, 0.7), (GRAB, C2, 1.0), (MOM_B, UNWRAP - 2, 0.55), (UNWRAP - 2, C4, 0.8), (C4, B["perro"] + 2, 1.0)])
mus = (lm + am + bm) * mi + (lm * 0.8 + bm) * office * 0.6 + pm * pg * (mi > 0.01) * 0.5 \
      + (lM + aM + bM) * ma + pM * pg * ma * 0.5 + spark * sec([(UNWRAP - 2, UNWRAP + 70, 1.0), (C4, B["perro"] + 2, 0.7)])
# accents kept from the score: the clock ticking in the office, a stab when the glass lifts, a sting on "no aparece",
# the shimmer of the reveal and the final chord on the dog
tick = np.zeros(N)
for f0 in np.arange(C2, MOM_A, 15): n = int(0.03 * SR); at(tick, bp(rng.standard_normal(n), 2500, 6000) * env(n, 0.0005, 0.006) * 0.5, F(f0), 0.9 if int(f0 / 15) % 2 else 0.6)
acc2 = np.zeros(N)
for kk in (0, 3, 7, 12): at(acc2, pluck(Dk(kk - 12), 0.9, 0.7), F(GRAB) + 0.02 * kk, 0.6)
at(acc2, trumpet(Dk(-1), 0.9, False) * 1.2, F(B["nada"]), 1.0)
at(acc2, choir([Dk(4), Dk(7), Dk(11), Dk(16)], F(C4 - UNWRAP) + 1.5), F(UNWRAP - 4), 2.0)
for i, k2 in enumerate([12, 16, 19, 24, 19, 24, 28]): at(acc2, glock(Dk(k2 + 12), 1.6), F(UNWRAP) + 0.12 * i, 0.7)
for kk in (0, 4, 7, 12): at(acc2, pluck(Dk(kk - 12), 1.6, 0.6), F(B["perro"] + 2), 0.6)
at(acc2, mbass(Dk(-24), 1.2), F(B["perro"] + 2), 1.0)
for kk in (0, 4, 7, 12): at(acc2, glock(Dk(kk + 12), 2.0), F(B["perro"] + 2) + 0.03 * kk, 0.6)
mus = mus + tick * 0.8 + acc2
# ---------- sound effects ----------
sfx = np.zeros(N)
def thud(f=90, d=0.25): n = int(0.4 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t * np.exp(-t * 6)) * env(n, 0.002, d) + lp(rng.standard_normal(n), 300) * env(n, 0.001, 0.03) * 0.5
def whoosh(d=0.32, lo=400, hi=2600): n = int(d * SR); t = np.arange(n) / SR; return bp(rng.standard_normal(n), lo, hi) * np.sin(np.pi * t / d) ** 2 * 0.5
def clink(fs=(2650, 3910, 5200), d=0.06): n = int(0.35 * SR); t = np.arange(n) / SR; return sum(np.sin(2 * np.pi * f * t) for f in fs) / len(fs) * env(n, 0.001, d)
def scratch(d=0.5): n = int(d * SR); t = np.arange(n) / SR; return bp(rng.standard_normal(n), 2500, 7000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 9 * t))) * np.sin(np.pi * t / d) * 0.25
def rustle(d=0.6, g=1.0): n = int(d * SR); t = np.arange(n) / SR; x = bp(rng.standard_normal(n), 1500, 8000) * (0.4 + 0.6 * np.abs(lp(rng.standard_normal(n), 25)) * 6).clip(0, 1.5); return x * np.sin(np.pi * t / d) * 0.25 * g
def sniff(): n = int(0.16 * SR); t = np.arange(n) / SR; return bp(rng.standard_normal(n), 900, 4000) * np.sin(np.pi * t / 0.16) ** 2 * 0.35
def dig(): n = int(0.12 * SR); return bp(rng.standard_normal(n), 300, 2500) * env(n, 0.002, 0.04) * 0.6
def jingle(): n = int(0.12 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * 4200 * t) + np.sin(2 * np.pi * 6100 * t)) * env(n, 0.001, 0.03) * 0.12
def bark(g=1.0):
    n = int(0.22 * SR); t = np.arange(n) / SR; f = 520 - 260 * t / 0.22; ph = 2 * np.pi * np.cumsum(f) / SR; x = sum(np.sin(h * ph) / h for h in range(1, 12)) + 0.6 * rng.standard_normal(n)
    return (bp(x, 400, 1400) + 0.6 * bp(x, 1600, 3200)) * env(n, 0.006, 0.07) * 0.5 * g
def laugh(a, b, g):
    n = int((b - a) / 30 * SR); t = np.arange(n) / SR; d = n / SR; x = np.zeros(n)
    for k in range(int(d * 9)):
        i = int(rng.uniform(0, max(1, n - SR))); f0 = rng.uniform(170, 320)
        for s2 in range(rng.integers(3, 6)): m = int(0.09 * SR); tm = np.arange(m) / SR; seg = sum(np.sin(2 * np.pi * f0 * h * tm) / h for h in range(1, 8)) * np.sin(np.pi * tm / 0.09); j = i + int(s2 * 0.15 * SR); x[j:j + m] += bp(seg, 300, 2500)[:len(x[j:j + m])] * 0.2
    at(sfx, x * np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.5).clip(0, 1), F(a), g)
def murmur(a, b, g):
    n = int((b - a) / 30 * SR); t = np.arange(n) / SR; d = n / SR; x = bp(rng.standard_normal(n), 220, 1000) * (0.6 + 0.4 * lp(np.abs(rng.standard_normal(n)), 3) * 4) * 0.05
    at(sfx, x * np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.5).clip(0, 1), F(a), g)
def steps(a, b, every, g, f0=200):
    for f in np.arange(a, b, every): at(sfx, thud(f0, 0.035), F(f), g * (0.8 + 0.4 * rng.random()))
def paws(a, b, every, g):
    for f in np.arange(a, b, every): n = int(0.04 * SR); at(sfx, bp(rng.standard_normal(n), 1500, 5000) * env(n, 0.001, 0.008), F(f), g); at(sfx, jingle(), F(f + 1), g * 0.5)
night = lp(rng.standard_normal(N), 260) * 0.06 * (0.7 + 0.3 * np.sin(2 * np.pi * tt / 7.1))
def bed(x, spans, g):
    gg = np.zeros(N)
    for a, b in spans: gg[(tt >= F(a)) & (tt < F(b))] = 1
    return x * lp(gg, 2.5) * g
sfx += bed(night, [(0, C1 + 4), (C3 - 4, C4 + 4)], 1.4)
# hook: Pickles sniffing at the hedge, rustling leaves, the paper; a distant car passing
for f in np.arange(8, C1 - 30, 22): at(sfx, sniff(), F(f), 0.9); at(sfx, sniff(), F(f + 5), 0.7)
at(sfx, rustle(0.8), F(70), 0.8); at(sfx, rustle(0.6, 0.8), F(128), 1.0); at(sfx, whoosh(3.0, 120, 900) * 0.6, F(40), 0.6)
at(sfx, whoosh(0.5, 300, 3000), F(C1 - 8), 0.9)
# hall: the hum of a gallery, footsteps on parquet, the glass lifting (squeak + clink), the guard snoring
murmur(C1, C2, 1.2); steps(B["vitrina"] + 20, GRAB - 6, 15, 0.5, 260); steps(GRAB + 30, C2, 15, 0.5, 260)
n = int(0.4 * SR); tq = np.arange(n) / SR; at(sfx, np.sin(2 * np.pi * np.cumsum(1400 + 500 * tq / 0.4) / SR) * env(n, 0.02, 0.12) * 0.12, F(GRAB), 1.0); at(sfx, clink((3100, 4700, 6200), 0.1), F(GRAB + 22), 0.9)
for f in np.arange(C1 + 10, C2, 66): n2 = int(1.1 * SR); t2 = np.arange(n2) / SR; at(sfx, lp(rng.standard_normal(n2), 400) * np.sin(np.pi * t2 / 1.1) ** 2 * (0.5 + 0.5 * np.sin(2 * np.pi * 28 * t2)) * 0.25, F(f), 0.5)
at(sfx, whoosh(0.5, 300, 3000), F(C2 - 8), 0.9)
# office: the parcel's paper, the letter unfolding, the detectives' steps, the door
at(sfx, rustle(0.9), F(B["trozo"] - 12), 1.0); at(sfx, rustle(0.5, 1.2), F(B["carta"] - 6), 1.0); at(sfx, thud(140, 0.12), F(B["policia"] - 40), 0.8)
steps(B["policia"] - 36, B["sospechoso"] + 14, 9, 0.6, 210)
at(sfx, whoosh(0.5, 300, 3000), F(C3 - 8), 0.9)
# street: "un momento" (record scratch), the front door, the gate creak, steps and paws, sniffing, digging, the paper, a bark
at(sfx, scratch(0.45), F(B["momento"]), 0.9); at(sfx, thud(110, 0.1), F(C3 + 8), 0.7)
n = int(0.7 * SR); tq = np.arange(n) / SR; at(sfx, np.sin(2 * np.pi * np.cumsum(600 + 300 * np.sin(tq * 9)) / SR) * env(n, 0.05, 0.3) * 0.08, F(B["semana"] + 14), 1.0)
steps(C3 + 10, B["envuelta"] - 14, 17, 0.55, 230); paws(C3 + 10, B["olfatea"] - 6, 6.5, 0.5)
for f in np.arange(B["olfatea"] - 6, B["envuelta"], 9): at(sfx, sniff(), F(f), 1.0)
for f in np.arange(B["envuelta"], B["copa"] - 30, 4.5): at(sfx, dig(), F(f), 0.8)
at(sfx, rustle(1.4, 1.3), F(UNWRAP - 24), 1.2); at(sfx, bark(), F(B["copa"] + 6), 1.0); at(sfx, bark(0.8), F(B["copa"] + 16), 1.0)
at(sfx, whoosh(0.6, 250, 2600), F(C4 - 8), 1.0)
# banquet: laughter and chatter, clinking glasses, a cheer; Pickles barks at the end
murmur(C4, FR, 1.6); laugh(C4 + 10, FR - 6, 1.2)
for k2 in range(10): at(sfx, clink((2400 + 300 * (k2 % 4), 3800 + 200 * (k2 % 3), 5200), 0.08) * 0.6, F(B["banquete"] + 4 + k2 * 2.3 + 2 * rng.random()), 0.7)
at(sfx, bark(1.1), F(B["perro"] + 26), 1.0); laugh(B["perro"] + 28, FR - 4, 1.6)
# ---------- mix ----------
venv = lp(np.abs(voice), 8); duck = 1 - 0.45 * np.clip(venv / (np.percentile(venv, 90) + 1e-9), 0, 1)
m = mus / (np.max(np.abs(mus)) + 1e-9) * 0.2 * 10 ** (3 / 20) * duck
s = sfx / (np.max(np.abs(sfx)) + 1e-9) * 0.45 * 10 ** (-6 / 20)
mix = voice * 0.8 + m + s
fade = np.ones(N); fade[-int(0.8 * SR):] = np.linspace(1, 0, int(0.8 * SR)); mix *= fade
mix = np.tanh(mix * 1.1) / 1.1
sf.write(HERE + "/mix_raw" + TAG + ".wav", np.stack([mix, mix], 1), SR)
print("ok", N / SR)
