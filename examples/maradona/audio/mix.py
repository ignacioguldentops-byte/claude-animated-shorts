# Original score (tango-flavoured march, A minor, 116 bpm) + synthesized SFX, ducked under the voice.
import numpy as np, soundfile as sf, json
from scipy.signal import butter, sosfilt
SR = 48000; TOTAL = 1830 / 30; N = int(TOTAL * SR)
rng = np.random.default_rng(3)
v, vsr = sf.read("/home/user/maradona/voice/voice.wav")
vi = np.interp(np.arange(int(len(v) * SR / vsr)) / SR, np.arange(len(v)) / vsr, v)
voice = np.zeros(N); voice[:min(N, len(vi))] = vi[:N]
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], "band", fs=SR, output="sos"), x)
def lp(x, hi, o=2): return sosfilt(butter(o, hi, "low", fs=SR, output="sos"), x)
def env(n, a, d): t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def at(buf, sig, t, g=1.0):
    i = int(t * SR); j = min(N, i + len(sig))
    if i < N: buf[i:j] += g * sig[:j - i]
# ---------- music ----------
bpm = 116; beat = 60 / bpm
mus = np.zeros(N)
def note(f, dur, kind="reed"):
    n = int(dur * SR); t = np.arange(n) / SR
    if kind == "reed":  # bandoneon-ish: detuned saws, soft attack
        s = sum(((t * f * d) % 1 * 2 - 1) for d in (1, 1.004, 0.996)) / 3
        s = lp(s, 2600) * np.minimum(1, t / 0.03) * np.exp(-t / (dur * 1.2))
    elif kind == "bass": s = np.sin(2 * np.pi * f * t) * env(n, 0.005, 0.35) + 0.3 * np.sin(4 * np.pi * f * t) * env(n, 0.005, 0.15)
    else: s = np.sign(np.sin(2 * np.pi * f * t)) * 0.3 * env(n, 0.002, 0.08); s = lp(s, 3000)
    return s
A = 220.0; semis = lambda k: A * 2 ** (k / 12)
prog = [(0, [0, 3, 7]), (-4, [-4, 0, 3]), (-7, [-7, -3, 0]), (-5, [-5, -1, 2])]  # Am F D(m) E
mel = [12, 10, 8, 7, 8, 10, 12, 15, 14, 12, 10, 8, 7, 5, 4, 7]
nb = int(TOTAL / beat) + 1
for b in range(nb):
    t0 = b * beat; bar = (b // 4) % 4; root, ch = prog[bar]
    at(mus, note(semis(root - 24), beat * 0.9, "bass"), t0, 0.55 if b % 2 == 0 else 0.35)
    if b % 4 in (0, 2): # tango marcato stabs on 1 and 3 (plus a pickup on 4&)
        for k in ch: at(mus, note(semis(k), beat * 0.45, "reed"), t0, 0.12)
    if b % 4 == 3: 
        for k in ch: at(mus, note(semis(k), beat * 0.25, "reed"), t0 + beat * 0.5, 0.09)
    m = mel[(b // 2) % 16] + (0 if (b // 32) % 2 == 0 else -5)
    if b % 2 == 0: at(mus, note(semis(m), beat * 1.9, "reed"), t0, 0.10)
    at(mus, lp(rng.standard_normal(int(0.04 * SR)), 6000) * env(int(0.04 * SR), 0.001, 0.01), t0 + beat * 0.5, 0.05)  # brush
# golden/explanation shots softer, final shot swells
gain = np.ones(N); tt = np.arange(N) / SR
for a, b, g in [(194/30, 368/30, 0.6), (1296/30, 1618/30, 0.65)]: gain[(tt >= a) & (tt < b)] = g
gain[tt >= 1618/30] = 1.15
mus *= lp(gain, 3)
# ---------- sfx ----------
sfx = np.zeros(N)
crowd = bp(rng.standard_normal(N), 300, 2500) * 0.08 + bp(rng.standard_normal(N), 120, 600) * 0.05
cg = np.zeros(N)
for a, b in [(0, 194), (368, 1296), (1618, 1686)]: cg[(tt >= a/30) & (tt < b/30)] = 1
for f0, f1, g in [(1262, 1300, 2.6), (816, 850, 1.6), (1618, 1690, 2.4), (150, 194, 2.0), (510, 592, 2.2)]: cg[(tt >= f0/30) & (tt < f1/30)] *= g
sfx += crowd * lp(cg, 2) * (0.8 + 0.2 * np.sin(tt * 0.7))
def whistle(d=0.5):
    n = int(d * SR); t = np.arange(n) / SR; f = 2900 + 80 * np.sin(2 * np.pi * 28 * t)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 + 0.6 * np.sign(np.sin(2 * np.pi * 28 * t))) * 0.2 * np.minimum(1, t / 0.01) * np.minimum(1, (d - t) / 0.03)
def thud(f=90, d=0.25):
    n = int(d * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t * np.exp(-t * 6)) * env(n, 0.001, 0.07) + lp(rng.standard_normal(n), 1500) * env(n, 0.001, 0.02) * 0.6
def kick():
    a = thud(140, 0.15) * 0.8; b = bp(rng.standard_normal(int(0.08 * SR)), 1500, 5000) * env(int(0.08 * SR), 0.001, 0.015) * 0.5; a[:len(b)] += b; return a
def swish(d=0.4):
    n = int(d * SR); t = np.arange(n) / SR; return bp(rng.standard_normal(n), 2000, 7000) * np.sin(np.pi * t / d) * 0.4
def clink(): n = int(0.3 * SR); t = np.arange(n) / SR; return sum(np.sin(2 * np.pi * f * t) for f in (2650, 3910, 5200)) / 3 * env(n, 0.001, 0.06) * 0.4
def boing(): n = int(0.25 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * (300 + 500 * t) * t) * env(n, 0.002, 0.06) * 0.5
def zoom(): n = int(0.45 * SR); t = np.arange(n) / SR; return bp(rng.standard_normal(n), 800, 4000) * (t / 0.45) ** 2 * 0.6
F = lambda f: f / 30
at(sfx, whistle(0.7), F(370))                 # kick-off
for f in range(200, 310, 13): at(sfx, kick(), F(f), 0.4)   # kid kicking the ball
at(sfx, kick(), F(645), 0.9)                   # the loop
at(sfx, thud(70, 0.4), F(810), 1.2); at(sfx, swish(), F(818), 0.8)   # punch + net
at(sfx, boing(), F(918), 0.6)                  # "?" pop
for f in (1037, 1072, 1100, 1113, 1126, 1139, 1150): at(sfx, kick(), F(f), 0.5)
for f in (1168, 1186, 1193, 1203, 1226): at(sfx, thud(110, 0.25), F(f), 0.9); at(sfx, kick(), F(f - 4), 0.5)
at(sfx, zoom(), F(1140), 0.7)
at(sfx, kick(), F(1252), 1.0); at(sfx, swish(0.5), F(1262), 1.0)
at(sfx, boing(), F(1390), 0.5)
for f in range(1471, 1540, 9): at(sfx, clink(), F(f + (f % 4)), 0.5)
at(sfx, zoom(), F(1572), 0.6); at(sfx, clink(), F(1592), 0.4)
for k in range(3): at(sfx, whistle(0.35 if k < 2 else 0.9), F(1622) + k * 0.45, 0.8)   # final whistle
at(sfx, kick(), F(1800), 0.5); at(sfx, kick(), F(1813), 0.8)
def whoosh(d=0.32):
    n = int(d * SR); t = np.arange(n) / SR; return bp(rng.standard_normal(n), 400, 2600) * np.sin(np.pi * t / d) ** 2 * 0.5
for f in (66, 106, 152, 512, 652, 726, 752, 806, 828, 901, 1080, 1088, 1268, 1470, 1547, 1648, 1766, 1808): at(sfx, whoosh(), F(f), 0.55)   # camera whips, the pirouette
for f in (64, 866, 1037, 1768, 1813): at(sfx, clink(), F(f), 0.45)   # sparkles
for f in (104, 118, 132, 146): at(sfx, kick(), F(f), 0.4)   # keepie-uppies
at(sfx, thud(80, 0.3), F(1090), 0.7)   # the two who crash
at(sfx, thud(100, 0.2), F(1262), 0.8)
# ---------- mix: duck music under the voice, music +3 dB, sfx -6 dB (skill standard) ----------
venv = lp(np.abs(voice), 8); duck = 1 - 0.55 * np.clip(venv / (np.percentile(venv, 90) + 1e-9), 0, 1)
m = mus / (np.max(np.abs(mus)) + 1e-9) * 0.18 * 10 ** (3 / 20) * duck
s = sfx / (np.max(np.abs(sfx)) + 1e-9) * 0.45 * 10 ** (-6 / 20)
mix = voice * 0.8 + m + s
fade = np.ones(N); fade[-int(0.25 * SR):] = np.linspace(1, 0, int(0.25 * SR)); mix *= fade
mix = np.tanh(mix * 1.1) / 1.1
sf.write("/home/user/maradona/audio/mix_raw.wav", np.stack([mix, mix], 1), SR)
print("ok", N / SR)
