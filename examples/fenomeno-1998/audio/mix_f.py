# "El Fenómeno y la final": ONE catchy original theme that loops all the way through (the Maradona-hair recipe the
# user liked), here with a samba groove for Brazil: surdo, tamborim, ganzá, cavaquinho-ish plucks, bass and a whistled
# lead. A minor for the drama (thinned out for the nap, the seizure and the clinic), a dead stop on "Un momento", and
# the SAME tune in A major for 2002. Plus synthesized SFX: the ball, the bed, the corridor, the clinic, the dressing
# room, the stadium crowd, the header, the net, the whistle, the cup.
# usage: python3 mix_f.py <voice.wav> <tag>  ->  mix_raw<tag>.wav
import numpy as np, soundfile as sf, sys, json, re, os
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
ts = open(HERE + "/../src/f/timing.ts").read()
LINES = json.loads(re.search(r"LINES[^=]*= (\[.*?\]);", ts, re.S).group(1)); FR = int(re.search(r"TOTAL = (\d+)", ts).group(1))
L = lambda l: LINES[l - 1][0]; E = lambda l: LINES[l - 1][1]; A = lambda l, t=0.0: round(L(l) + (E(l) - L(l)) * t)
cut = lambda a, b: round((E(a) + L(b)) / 2)
B = dict(mejor=A(1, 0.42), final=A(1, 0.8), comer=L(2), siesta=A(2, 0.36), despiertas=A(2, 0.56), rodeado=A(2, 0.72), francia=L(3), dormia=A(3, 0.3), convulsion=A(3, 0.55), companero=A(3, 0.66), grito=A(3, 0.88),
         nada=A(4, 0.12), clinica=A(4, 0.3), pruebas=A(4, 0.48), entrenador=A(4, 0.62), sin=A(4, 0.88), momento=L(5), entra=A(5, 0.4), resultados=A(5, 0.6), normal=A(5, 0.76), jugar=A(5, 0.92),
         juega=L(6), brasil=A(6, 0.2), zidane=A(6, 0.45), cabeza=A(6, 0.64), gana=A(6, 0.84), veras=L(7), otra=A(7, 0.3), marco=A(7, 0.5), copa=A(7, 0.78), end=FR)
C1, C2, C3, C4, C5 = cut(2, 3), cut(3, 4), A(4, 0.56), L(6) + 24, cut(6, 7)
SIT_AT, LIE_AT, POV_AT = B["siesta"] - 20, B["siesta"] - 4, B["despiertas"] - 4
HEAD_AT = B["zidane"] - 4; NET98 = HEAD_AT + 8; SHOOT = B["marco"] - 8; NET02 = SHOOT + 9; CUP = B["copa"] - 4
SR = 48000; TOTAL = FR / 30; N = int(TOTAL * SR)
rng = np.random.default_rng(31)
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

F = lambda f: f / 30
tt = np.arange(N) / SR
def sec(spans):
    g = np.zeros(N)
    for a, b, x in spans: g[(tt >= F(a)) & (tt < F(b))] = x
    return lp(g, 6.0)
# ---------- the theme: samba, 2/4 at 100 bpm (one bar = 1.2 s, eight bars = 9.6 s, then it loops) ----------
def whistle(f, dur):                     # a breathy whistled lead
    n = int(dur * SR); t = np.arange(n) / SR; vib = 1 + 0.012 * np.sin(2 * np.pi * 5.8 * t) * np.minimum(1, t / 0.15)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR; s = np.sin(ph) + 0.08 * np.sin(2 * ph) + 0.05 * bp(rng.standard_normal(n), f * 0.9, f * 1.3)
    return s * np.minimum(1, t / 0.025) * np.minimum(1, (dur - t) / 0.05).clip(0, 1) * 0.16
def surdo(g=1.0): n = int(0.45 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * 62 * t * np.exp(-t * 2.5)) * env(n, 0.002, 0.18) * g
def tamb(g=1.0): n = int(0.06 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * 1180 * t) * 0.6 + bp(rng.standard_normal(n), 2500, 7000) * 0.4) * env(n, 0.001, 0.018) * g * 0.5
def ganza(g=1.0): n = int(0.07 * SR); return hp(rng.standard_normal(n), 5500) * env(n, 0.006, 0.02) * g * 0.22
Ak = lambda k: 440.0 * 2 ** (k / 12)
s16 = 60 / 100 / 4; bar = 8 * s16
MEL_m = [[None, 12, None, 12, 10, None, 7, None], [8, None, 7, None, 5, None, None, None], [None, 12, None, 12, 10, None, 7, None], [3, None, 5, None, 7, None, None, None],
         [None, 8, None, 8, 7, None, 5, None], [3, None, 2, None, 0, None, None, None], [None, 2, 3, None, 5, None, -1, None], [0, None, None, None, None, None, None, None]]
MAJ = {3: 4, 8: 9, 10: 11}
MEL_M = [[None if m is None else MAJ.get(m, m) for m in b] for b in MEL_m]
CH_m = [[0, 3, 7], [-4, 0, 3], [0, 3, 7], [3, 7, 10], [5, 8, 12], [0, 3, 7], [-5, -1, 2, 5], [0, 3, 7]]
CH_M = [[0, 4, 7], [5, 9, 12], [0, 4, 7], [-5, -1, 2], [5, 9, 12], [0, 4, 7], [-5, -1, 2, 5], [0, 4, 7]]
ROOT_m = [0, -4, 0, 3, 5, 0, -5, 0]; ROOT_M = [0, 5, 0, -5, 5, 0, -5, 0]
TAMB = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0]   # teleco-teco over two bars
CAV = [0, 1, 0, 1, 1, 0, 1, 0]                            # syncopated chord strums
def theme(MEL, CH, ROOT):
    lead, acc, low, perc = np.zeros(N), np.zeros(N), np.zeros(N), np.zeros(N)
    for b in range(int(TOTAL / bar) + 2):
        t0 = b * bar; i = b % 8
        at(low, mbass(Ak(ROOT[i] - 24), s16 * 3.5), t0, 1.0); at(low, mbass(Ak(ROOT[i] - 24 + 7), s16 * 3.5), t0 + 4 * s16, 0.85)
        for k in range(8):
            if CAV[k]:
                for j, kk in enumerate(CH[i]): at(acc, pluck(Ak(kk - 12), 0.22, 0.9), t0 + k * s16 + j * 0.005, 0.16)
            m = MEL[i][k]
            if m is not None: dur = s16 * (2 if k + 1 < 8 and MEL[i][k + 1] is None else 1) * 0.95; at(lead, whistle(Ak(m), dur + 0.05), t0 + k * s16, 1.0); at(lead, pluck(Ak(m), 0.3, 1.3), t0 + k * s16, 0.35)
            at(perc, ganza(1.0 if k % 2 == 0 else 0.6), t0 + k * s16)
            if TAMB[(b % 2) * 8 + k]: at(perc, tamb(0.9), t0 + k * s16)
        at(perc, surdo(0.55), t0); at(perc, surdo(1.0), t0 + 4 * s16)
    return lead, acc, low, perc
lm, am, bm, pm = theme(MEL_m, CH_m, ROOT_m)
lM, aM, bM, pM = theme(MEL_M, CH_M, ROOT_M)
MOM_A, MOM_B = B["momento"] - 2, B["momento"] + 24
# minor: full for the hook, thinner for the nap, almost nothing at the waking and the seizure, thin in the clinic,
# back in the dressing room, a dead stop on "Un momento", full again after it, thin and sad for the 3-0
mg = sec([(0, B["comer"], 1.0), (B["comer"], LIE_AT, 0.85), (LIE_AT, POV_AT, 0.45), (POV_AT, C1, 0.0), (C1, B["convulsion"], 0.5), (B["convulsion"], C2, 0.0), (C2, C3, 0.45), (C3, MOM_A, 0.7), (MOM_B, C4, 0.95), (C4, B["gana"] - 6, 0.7), (B["gana"] - 6, C5 - 4, 0.35)])
pg = sec([(0, B["comer"], 1.0), (B["comer"], LIE_AT, 0.6), (C3, MOM_A, 0.5), (MOM_B, C4, 0.9), (C4, NET98, 0.7)])
Mg = sec([(C5 - 4, FR - 40, 1.0)]); Pg = sec([(C5 - 4, FR - 40, 1.0)])
mus = (lm + am * 0.9 + bm) * mg + pm * pg * 0.55 + (lM + aM * 0.9 + bM) * Mg + pM * Pg * 0.55
# accents: a sting as he wakes, a low pulse under the seizure, a hit on the shout, a sad fall on the 3-0, the cup
acc2 = np.zeros(N)
at(acc2, strings([Ak(-12), Ak(-11), Ak(-6)], 2.6, 1800) * 2.4, F(POV_AT - 2), 1.0)
for f0 in np.arange(B["convulsion"], C2, 15): at(acc2, mbass(Ak(-24), 0.5) * 0.9, F(f0), 0.9 if int((f0 - B["convulsion"]) / 15) % 2 == 0 else 0.6)
at(acc2, strings([Ak(-12), Ak(-6), Ak(-1)], F(C2 - B["convulsion"]) + 0.3, 1500) * 2.2, F(B["convulsion"]), 1.0)
for kk in (0, 3, 6, 12): at(acc2, pluck(Ak(kk - 12), 0.9, 0.8), F(B["grito"] - 4) + 0.01 * kk, 0.7)
at(acc2, trumpet(Ak(-2), 0.8, False) * 1.3, F(B["sin"] - 4), 1.0)
for i, kk in enumerate([7, 5, 3, 0]): at(acc2, whistle(Ak(kk), 0.5) * 1.2, F(B["gana"] - 4) + 0.42 * i, 1.0)
for kk in (0, 4, 7, 12): at(acc2, pluck(Ak(kk - 12), 1.6, 0.6), F(CUP), 0.8); at(acc2, glock(Ak(kk + 12), 1.8), F(CUP) + 0.03 * kk, 0.7)
at(acc2, choir([Ak(4), Ak(7), Ak(11), Ak(16)], 3.0) * 3.0, F(CUP - 6), 1.0)
for kk in (0, 4, 7, 12, 16): at(acc2, pluck(Ak(kk - 12), 2.4, 0.6), F(FR - 40), 0.7)
at(acc2, mbass(Ak(-24), 1.6), F(FR - 40), 1.2); at(acc2, surdo(1.4), F(FR - 40), 1.0)
mus = mus + acc2
# ---------- sound effects ----------
sfx = np.zeros(N)
def pat(g=1.0): n = int(0.09 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * 180 * t * np.exp(-t * 20)) + 0.5 * bp(rng.standard_normal(n), 600, 3000)) * env(n, 0.001, 0.025) * g
def kickball(g=1.0): n = int(0.2 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * 120 * t * np.exp(-t * 25)) + 0.7 * bp(rng.standard_normal(n), 400, 2500) * np.exp(-t * 60)) * env(n, 0.001, 0.05) * g
def swish(d=0.45): n = int(d * SR); t = np.arange(n) / SR; return bp(rng.standard_normal(n), 1800, 7000) * np.sin(np.pi * t / d) ** 1.5 * 0.4
def creak(d=0.5, f0=180): n = int(d * SR); t = np.arange(n) / SR; f = f0 * (1 + 0.3 * np.sin(2 * np.pi * 3 * t)); ph = 2 * np.pi * np.cumsum(f) / SR; x = np.sign(np.sin(ph)) * 0.3 + bp(rng.standard_normal(n), 400, 2000) * 0.4; return bp(x, 300, 2500) * np.sin(np.pi * t / d) * 0.25
def beep(f=1450, d=0.09): n = int(d * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.004) * np.minimum(1, (d - t) / 0.01).clip(0, 1) * 0.12
def whistleRef(d=0.9): n = int(d * SR); t = np.arange(n) / SR; ph = 2 * np.pi * np.cumsum(2900 + 120 * np.sign(np.sin(2 * np.pi * 34 * t))) / SR; return np.sin(ph) * np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.05).clip(0, 1) * 0.18
def pop(): n = int(0.15 * SR); t = np.arange(n) / SR; return (bp(rng.standard_normal(n), 300, 3000) + np.sin(2 * np.pi * 90 * t)) * env(n, 0.001, 0.04) * 0.7
def crowd(a, b, g, roar=None):
    n = int((b - a) / 30 * SR); t = np.arange(n) / SR; d = n / SR; x = bp(rng.standard_normal(n), 300, 2600) * 0.08 * (0.8 + 0.2 * np.sin(2 * np.pi * 0.3 * t))
    x += bp(rng.standard_normal(n), 900, 4200) * 0.03 * np.abs(np.sin(2 * np.pi * 0.83 * t))     # chanting pulse
    if roar is not None: r = np.zeros(n); i = int(F(roar - a) * SR); r[i:] = np.exp(-(np.arange(n - i) / SR) / 2.6) * np.minimum(1, np.arange(n - i) / (0.25 * SR)); x = x * (1 + 3.2 * r)
    at(sfx, x * np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.4).clip(0, 1), F(a), g)
room = lp(rng.standard_normal(N), 400) * 0.025
def thud(f=90, d=0.25): n = int(0.4 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t * np.exp(-t * 6)) * env(n, 0.002, d) + lp(rng.standard_normal(n), 300) * env(n, 0.001, 0.03) * 0.5
def whoosh(d=0.32, lo=400, hi=2600): n = int(d * SR); t = np.arange(n) / SR; return bp(rng.standard_normal(n), lo, hi) * np.sin(np.pi * t / d) ** 2 * 0.5
def clink(fs=(2650, 3910, 5200), d=0.06): n = int(0.35 * SR); t = np.arange(n) / SR; return sum(np.sin(2 * np.pi * f * t) for f in fs) / len(fs) * env(n, 0.001, d)
def scratch(d=0.5): n = int(d * SR); t = np.arange(n) / SR; return bp(rng.standard_normal(n), 2500, 7000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 9 * t))) * np.sin(np.pi * t / d) * 0.25
def rustle(d=0.6, g=1.0): n = int(d * SR); t = np.arange(n) / SR; x = bp(rng.standard_normal(n), 1500, 8000) * (0.4 + 0.6 * np.abs(lp(rng.standard_normal(n), 25)) * 6).clip(0, 1.5); return x * np.sin(np.pi * t / d) * 0.25 * g
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
# 1 the room: the ball on his hands, steps on the carpet, the bed creaks; the room-mate's magazine
for f0 in np.arange(0, B["comer"], 26): at(sfx, pat(0.9), F(f0 + 1), 1.0)
steps(B["comer"] + 4, SIT_AT, 13, 0.35, 160); at(sfx, creak(0.5), F(SIT_AT), 0.8); at(sfx, creak(0.7, 150), F(LIE_AT), 0.9); at(sfx, rustle(0.5), F(40), 0.5)
murmur(POV_AT, C1 + 6, 1.2)
# 2 the seizure: the bed shaking, the magazine dropped, running steps, the door, the corridor, more running
for f0 in np.arange(B["convulsion"] - 4, C2, 5): at(sfx, creak(0.12, 220 + 30 * rng.random()), F(f0), 0.35)
at(sfx, rustle(0.35, 1.4), F(B["convulsion"] + 6), 1.0); at(sfx, thud(110, 0.12), F(B["convulsion"] + 12), 0.6)
steps(B["companero"] - 6, B["companero"] + 60, 7, 0.55, 190); at(sfx, whoosh(0.4, 300, 1500), F(B["companero"] + 44), 0.6)
steps(B["grito"] - 8, B["grito"] + 32, 6, 0.4, 210); murmur(B["grito"], C2 + 6, 1.5)
# 3 the clinic: the EEG beeping, the hum of the lights
for f0 in np.arange(C2 - 6, C3 + 8, 24): at(sfx, beep(), F(f0), 1.0)
# 4 the dressing room: the sheet, the door, steps in the tunnel, the door again, the team's cheer
at(sfx, rustle(0.45, 1.2), F(B["entrenador"]), 1.0); at(sfx, creak(0.6, 140), F(B["sin"] + 14), 0.7); steps(B["sin"] + 6, B["sin"] + 46, 12, 0.35, 230); at(sfx, thud(80, 0.1), F(B["sin"] + 60), 0.5)
at(sfx, creak(0.6, 160), F(B["entra"] - 30), 0.8); steps(B["entra"] - 26, B["entra"] + 6, 11, 0.4, 230); at(sfx, rustle(0.3, 1.0), F(B["resultados"] - 8), 0.8)
laugh(B["normal"] + 2, C4 + 6, 1.4); murmur(C3, B["normal"], 0.8)
# 5-6 the stadium: the crowd all through, the header, the net, the roar; the final whistle; the shot, the net, the roar; the cup
crowd(C4 - 8, C5 + 8, 1.0, NET98); at(sfx, kickball(0.9), F(HEAD_AT), 1.0); at(sfx, swish(), F(NET98), 1.0); at(sfx, whistleRef(), F(B["gana"] - 4), 1.0)
crowd(C5 - 8, FR, 1.0, NET02)
for f0 in range(int(C5), SHOOT, 9): at(sfx, pat(0.4), F(f0), 0.7)
at(sfx, kickball(1.2), F(SHOOT), 1.0); at(sfx, swish(), F(NET02), 1.0)
for k in range(5): at(sfx, pop(), F(CUP) + 0.12 * k, 0.6)
sfx += room * sec([(0, C4, 1.0)])
# ---------- mix: music ducked under the voice, music +3 dB, sfx -6 dB (skill standard) ----------
venv = lp(np.abs(voice), 8); duck = 1 - 0.5 * np.clip(venv / (np.percentile(venv, 90) + 1e-9), 0, 1)
m = mus / (np.max(np.abs(mus)) + 1e-9) * 0.3 * 10 ** (3 / 20) * duck
s = sfx / (np.max(np.abs(sfx)) + 1e-9) * 0.45 * 10 ** (-6 / 20)
mix = voice * 0.8 + m + s
mix = np.tanh(mix * 1.1) / 1.1
sf.write(HERE + "/mix_raw" + TAG + ".wav", np.stack([mix, mix], 1), SR)
print("ok", round(TOTAL, 2))
