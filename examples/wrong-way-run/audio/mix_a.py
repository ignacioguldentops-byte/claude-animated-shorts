# "Al revés": original score + synthesized SFX, ducked under the voice.
# A marching-band two-step (snare, bass drum, tuba, brass melody) for the game, a soft reed tune for the letter,
# crowd and hits. Every cue is placed from src/a/timing.ts, like the picture.
# usage: python3 mix_p.py <voice.wav> <tag>   ->  mix_raw<tag>.wav
import numpy as np, soundfile as sf, sys, json, re, os
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
ts = open(HERE + "/../src/a/timing.ts").read()
LINES = json.loads(re.search(r"LINES[^=]*= (\[.*?\]);", ts, re.S).group(1)); FR = int(re.search(r"TOTAL = (\d+)", ts).group(1))
L = lambda l: LINES[l - 1][0]; E = lambda l: LINES[l - 1][1]; A = lambda l, t=0.0: round(L(l) + (E(l) - L(l)) * t); CUT = 3
B = dict(arrive=A(1, 0.46), celeb=A(1, 0.62), gift=A(1, 0.77), hero=L(2) - CUT, duros=A(2, 0.5), game=L(3) - CUT, suelto=A(3, 0.33), recoge=A(3, 0.5), gira=A(3, 0.7), corre=A(3, 0.86),
         nadie=L(4) - CUT, gritan=A(4, 0.36), cree=L(5) - CUT, fondo=L(6) - CUT, lanza=A(6, 0.42), rival=L(7) - CUT, gracias=A(7, 0.62), espera=L(8) - CUT, como=A(8, 0.24),
         veras=L(9) - CUT, giro=A(9, 0.16), casco=A(9, 0.5), ruido=A(9, 0.62), adren=A(9, 0.74), norte=A(9, 0.86), mejor=L(10) - CUT, jugada=A(10, 0.36), antes=A(10, 0.8),
         carta=L(11) - CUT, otro=A(11, 0.42), y1929=A(11, 0.78), club=L(12) - CUT, risa=A(12, 0.7), veinte=L(13) - CUT, mundo=L(14) - CUT, reves=A(14, 0.55), end=FR)
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
# ---------- music: marching two-step, 2/4 at 126, B flat major ----------
Bb = lambda k: 233.08 * 2 ** (k / 12)   # semitones from B flat 3
q = 60 / 126; bar = 2 * q
nbars = int(TOTAL / bar) + 1
mel = [[(0, 1), (4, 0.5), (7, 0.5)], [(12, 1), (7, 1)], [(9, 0.5), (7, 0.5), (5, 0.5), (4, 0.5)], [(2, 1.5), (None, 0.5)],
       [(2, 1), (5, 0.5), (9, 0.5)], [(14, 1), (9, 1)], [(12, 0.5), (11, 0.5), (9, 0.5), (7, 0.5)], [(12, 1.5), (None, 0.5)]]
roots = [0, 0, 5, -5, -5, -5, 7, 0]; chord = {0: [0, 4, 7], 5: [5, 9, 12], -5: [-5, -1, 2], 7: [-5, -1, 2, 5]}
band = np.zeros(N); bandp = np.zeros(N); soft = np.zeros(N)
for b in range(nbars):
    t0 = b * bar; r = roots[b % 8]; t = 0.0
    for m, d in mel[b % 8]:
        if m is not None: at(band, brass([Bb(m + 12), Bb(m + 12) * 1.003], q * d * 0.92), t0 + t * q, 1.1); at(band, reed(Bb(m + 12), q * d * 0.9, 0.004), t0 + t * q, 0.35)
        t += d
    for k, beat in enumerate((0, 1)): at(band, tuba(Bb((r if r != 7 else -5) - 24 + (7 if k else 0)), q * 0.9), t0 + beat * q, 1.0)
    for beat in (0.5, 1.5): at(band, squeeze([Bb(kk) for kk in chord[r][:3]], 0.16), t0 + beat * q, 0.8)
    for i in range(8):
        g = (1.0, 0.35, 0.6, 0.35, 0.9, 0.35, 0.6, 0.6)[i]; at(bandp, snare(g), t0 + i * q / 4, 0.45)
    at(bandp, drum(80, 0.1), t0, 1.0); at(bandp, drum(80, 0.1), t0 + q, 0.7); at(bandp, jingle(0.9), t0 + q, 0.5)
# the letter: slow reed tune over plucked chords (half time)
smel = [(7, 2), (4, 1), (5, 1), (7, 2), (12, 2), (9, 2), (7, 1), (5, 1), (4, 3), (None, 1)]
tl = 0.0
while tl < TOTAL:
    t = 0.0
    for m, d in smel:
        if m is not None: at(soft, reed(Bb(m), q * d * 0.95, 0.008), tl + t * q, 0.7)
        t += d
    for i, r in enumerate((0, 5, 0, -5)):
        for j, kk in enumerate(chord[r]): at(soft, pluck(Bb(kk - 12), 1.2, 0.7), tl + i * 4 * q + j * 0.05, 0.35)
    tl += 16 * q
SEC = [(0, B["hero"], 1.0, 1.0, 0), (B["hero"], B["game"], 0.0, 0.5, 0), (B["game"], B["suelto"], 0.5, 0.7, 0), (B["suelto"], B["recoge"], 0, 0, 0), (B["recoge"], B["gracias"], 1.05, 1.0, 0),
       (B["gracias"], B["veras"], 0, 0, 0), (B["veras"], B["mejor"], 0, 0, 0), (B["mejor"], B["jugada"], 1.0, 1.0, 0), (B["jugada"], B["carta"], 0.7, 0.8, 0),
       (B["carta"], B["y1929"], 0, 0, 1.0), (B["y1929"], B["club"], 0, 0, 0.6), (B["club"], B["veinte"], 0, 0, 1.0), (B["veinte"], B["mundo"], 0.6, 0.9, 0), (B["mundo"], FR - 24, 1.05, 1.0, 0), (FR - 24, FR, 0, 0, 0)]
g1 = np.zeros(N); g2 = np.zeros(N); g3 = np.zeros(N)
for a, b, x1, x2, x3 in SEC: m_ = (tt >= F(a)) & (tt < F(b)); g1[m_] = x1; g2[m_] = x2; g3[m_] = x3
mus = band * lp(g1, 8) + bandp * lp(g2, 8) * 0.5 + soft * lp(g3, 5) * 0.9
pad = np.zeros(N)
def padnote(fs, a, b, g):
    n = int((b - a) / 30 * SR); t = np.arange(n) / SR; d = n / SR; s = np.zeros(n)
    for f in fs:
        for dt in (0.997, 1.003): s += np.sin(2 * np.pi * f * dt * t) + 0.3 * np.sin(4 * np.pi * f * dt * t)
    at(pad, lp(s, 1800) * np.minimum(1, t / 0.5) * np.minimum(1, (d - t) / 0.4).clip(0, 1) * 0.1, F(a), g)
for kk in (0, 4, 7, 12): at(mus, brass([Bb(kk)], 1.4), F(B["hero"]), 0.9)                               # hero chord
at(mus, brass([Bb(0), Bb(7)], 0.5), F(B["duros"]), 0.9); at(mus, brass([Bb(0), Bb(7)], 0.5), F(B["duros"] + 14), 0.9)
def wah(f, dur, bend): n = int(dur * SR); t = np.arange(n) / SR; fr = f * 2 ** (bend * t / dur / 12); ph = 2 * np.pi * np.cumsum(fr) / SR; s = sum(np.sin(h * ph) / h for h in range(1, 8)); return lp(s, 900 + 500 * np.sin(2 * np.pi * 3 * t)[0] + 900) * np.minimum(1, t / 0.03) * np.minimum(1, (dur - t) / 0.1).clip(0, 1) * 0.22
for i, (k, d) in enumerate(((3, 0.45), (2, 0.45), (1, 0.45), (0, 1.1))): at(mus, wah(Bb(k - 12), d, -1.2 if i == 3 else -0.3), F(B["gracias"] + 14) + i * 0.47, 1.0)   # sad trombone
for i, k in enumerate((12, 16, 19, 24)): at(mus, pluck(Bb(k), 0.6, 1.3), F(B["como"] + 4 + i * 5), 0.5)
padnote([Bb(-24), Bb(-17), Bb(-9)], B["veras"], B["mejor"], 1.0)
for kk in (0, 4, 7, 12): at(mus, brass([Bb(kk)], 1.2), F(FR - 24), 0.8)
at(mus, tuba(Bb(-24), 0.9), F(FR - 24), 1.0); at(mus, drum(80, 0.12), F(FR - 24), 1.0)
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
def whistle(d=0.5): n = int(d * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * 2900 * t + 3 * np.sin(2 * np.pi * 38 * t)) * np.minimum(1, t / 0.01) * np.minimum(1, (d - t) / 0.05).clip(0, 1) * 0.3
def steps(a, b, every, g):
    for f in np.arange(a, b, every): at(sfx, thud(170, 0.05), F(f), g)
# ambiences: the crowd is always there; it swells on the run and the celebrations
crowd(0, B["carta"], 1.3); crowd(B["y1929"], B["club"], 0.9); crowd(B["veinte"], FR, 1.2)
roar(0, B["arrive"], 1.2); roar(B["celeb"], B["gift"] + 10, 1.8); roar(B["corre"], B["cree"], 1.3); roar(B["lanza"], B["rival"] + 10, 1.8); roar(B["mejor"], B["jugada"], 1.8); roar(B["antes"], B["carta"], 1.6); roar(B["reves"] + 16, FR, 1.5)
n_ = int((B["mejor"] - B["ruido"]) / 30 * SR); t_ = np.arange(n_) / SR
at(sfx, bp(rng.standard_normal(n_), 300, 3000) * 0.1 * np.minimum(1, t_ / 0.8) * np.minimum(1, (n_ / SR - t_) / 0.2).clip(0, 1), F(B["ruido"]), 2.0)   # the roar in his helmet
wind = bp(rng.standard_normal(N), 200, 900) * (0.5 + 0.5 * np.sin(tt * 1.3)) * 0.04
wg = np.zeros(N); wg[((tt >= F(B["carta"])) & (tt < F(B["y1929"]))) | ((tt >= F(B["club"])) & (tt < F(B["veinte"])))] = 1; sfx += wind * lp(wg, 3)
# spot effects
cuts = [B[k] for k in ("arrive", "gift", "hero", "game", "recoge", "nadie", "gritan", "cree", "fondo", "rival", "espera", "como", "veras", "casco", "norte", "mejor", "jugada", "carta", "y1929", "club", "veinte", "mundo", "reves")]
for f in cuts: at(sfx, whoosh(), F(f - 5), 0.5)
steps(0, B["arrive"], 3.5, 0.5); steps(B["corre"], B["gritan"], 3.5, 0.45); steps(B["cree"], B["fondo"] + 14, 3.5, 0.5); steps(B["y1929"], B["club"], 3.5, 0.4); steps(B["jugada"] + 26, B["carta"], 3.5, 0.4)
at(sfx, whoosh(0.5, 500, 3000), F(B["celeb"]), 0.8); at(sfx, sparkle(), F(B["celeb"] + 2), 0.8)
at(sfx, clink((1200, 1800), 0.03), F(B["gift"] + 12), 0.9); at(sfx, ding(988), F(B["gift"] + 13), 0.9); at(sfx, boing(), F(B["gift"] + 18), 0.7)   # the scoreboard flips
for f0 in (B["duros"], B["duros"] + 14): at(sfx, thud(70, 0.35), F(f0), 1.4); at(sfx, boing(), F(f0 + 2), 0.6); at(sfx, sparkle(), F(f0 + 6), 0.5)
at(sfx, whistle(0.35), F(B["game"] + 8), 0.7)
at(sfx, thud(70, 0.35), F(B["suelto"]), 1.5); at(sfx, pop(), F(B["suelto"] + 3), 0.8)
for k in range(3): at(sfx, thud(200, 0.06), F(B["suelto"] + 6 + k * 5), 0.6 - 0.15 * k)                      # the ball bounces
at(sfx, pop(), F(B["recoge"] + 8), 0.7)
for k in range(5): at(sfx, whoosh(0.22, 600, 3500), F(B["gira"] + k * 6), 0.6)                               # he spins
at(sfx, slidew(0.35, 300, 1100), F(B["corre"] - 2), 0.6)
for k in range(5): at(sfx, pop(), F(B["gritan"] + 4 + k * 11), 0.4)                                           # the bench yells
at(sfx, whoosh(0.6, 500, 3000), F(B["lanza"]), 0.9); at(sfx, sparkle(), F(B["lanza"] + 4), 0.6)
steps(B["rival"], B["gracias"] - 8, 9, 0.45)
at(sfx, pop(), F(B["gracias"]), 0.9); at(sfx, ding(1318), F(B["gracias"] + 1), 0.6); at(sfx, boing(), F(B["gracias"] + 16), 0.9)
at(sfx, slidew(0.3, 900, 300), F(B["espera"] - 2), 0.6); at(sfx, pop(), F(B["espera"] + 4), 0.8)
for i in range(18): at(sfx, pop(), F(B["como"] + i * 2.2), 0.3)                                               # the dashes of the diagram
at(sfx, boing(), F(B["como"] + 44), 0.7)
for k in range(8): at(sfx, whoosh(0.3, 500, 3000), F(B["veras"] + 6 + k * 12), 0.5)                           # slow-motion spin
for k in range(7): at(sfx, thud(55, 0.12), F(B["casco"] + k * 9), 0.5 + 0.05 * k)                             # heartbeat
for k in range(13): at(sfx, clink((2400, 3600), 0.012), F(B["norte"] + k * 2), 0.4)                           # the compass spins
at(sfx, ding(1568), F(B["norte"] + 27), 0.8); at(sfx, boing(), F(B["norte"] + 30), 0.6)
at(sfx, clink((1200, 1800), 0.03), F(B["mejor"] + 6), 0.8); at(sfx, ding(1318), F(B["mejor"] + 7), 0.8)
at(sfx, slidew(0.4, 1200, 400), F(B["jugada"] - 3), 0.6)                                                      # rewind
at(sfx, thud(70, 0.35), F(B["jugada"] + 14), 1.5); at(sfx, pop(), F(B["jugada"] + 17), 0.7); at(sfx, pop(), F(B["jugada"] + 26), 0.7)
steps(B["carta"] + 6, B["otro"] - 12, 9, 0.35); at(sfx, slide(0.4), F(B["otro"] - 8), 0.9); at(sfx, slide(0.3), F(B["otro"] + 8), 0.7)   # the postman; paper
at(sfx, sparkle(), F(B["club"] + 3), 0.8); at(sfx, pop(), F(B["club"] + 2), 0.6)
u = (B["mundo"] - B["veinte"])
for k in range(7): at(sfx, slide(0.2), F(B["veinte"] + k * u / 7), 0.6)                                       # calendar leaves
at(sfx, sparkle(), F(B["veinte"] + u * 0.34), 0.6); at(sfx, whoosh(1.0, 1500, 6000), F(B["veinte"] + u * 0.67), 0.5)
steps(B["mundo"], B["reves"], 12, 0.3)
at(sfx, pop(), F(B["reves"] + 20), 0.9); at(sfx, ding(1318), F(B["reves"] + 21), 0.6); at(sfx, sparkle(), F(B["reves"] + 24), 0.7)
for f0 in (B["celeb"] + 6, B["lanza"] + 10, B["reves"] + 26): at(sfx, shutter(), F(f0), 0.6); at(sfx, shutter(), F(f0 + 9), 0.5)
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
