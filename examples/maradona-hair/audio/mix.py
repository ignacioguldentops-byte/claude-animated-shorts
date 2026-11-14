# "The Hair": original tarantella-flavoured score (A minor, 6/8) + synthesized SFX, ducked under the voice.
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
SR = 48000; FR = 1890; TOTAL = FR / 30; N = int(TOTAL * SR)
rng = np.random.default_rng(7)
import sys
VOICE = sys.argv[1] if len(sys.argv) > 1 else "/home/user/maradona/voice2/voice.wav"; TAG = sys.argv[2] if len(sys.argv) > 2 else ""
v, vsr = sf.read(VOICE)
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
semi = lambda k: 220.0 * 2 ** (k / 12)
# ---------- instruments ----------
def pluck(f, dur=0.5, bright=1.0):   # mandolin-ish double string
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for d in (1, 1.006):
        for h in range(1, 9): s += np.sin(2 * np.pi * f * d * h * t + h) * np.exp(-t * (5 + 2.2 * h) / bright) / h ** 1.1
    return s * np.minimum(1, t / 0.002) * 0.25
def trem(f, dur, rate=13.5):          # tremolo-picked long note
    out = np.zeros(int(dur * SR) + int(0.3 * SR)); k = 0
    while k / rate < dur: at2(out, pluck(f, 0.22), k / rate, 0.7 + 0.3 * (k % 2)); k += 1
    return out
def at2(buf, sig, t, g=1.0):
    i = int(t * SR); j = min(len(buf), i + len(sig))
    if i < len(buf): buf[i:j] += g * sig[:j - i]
def bass(f, dur): n = int(dur * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t)) * env(n, 0.004, 0.28)
def jingle(g=1.0): n = int(0.09 * SR); return hp(rng.standard_normal(n), 6500) * env(n, 0.001, 0.022) * g
def drum(): n = int(0.16 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * 150 * t * np.exp(-t * 9)) * env(n, 0.001, 0.05)
def choir(fs, dur):                   # "aah" pad: saws through vowel formants
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in fs:
        for d in (0.994, 1, 1.007): s += ((t * f * d + rng.random()) % 1) * 2 - 1
    s = bp(s, 600, 1100) * 1.0 + bp(s, 1000, 1400) * 0.6 + bp(s, 2400, 3000) * 0.25
    return s * np.minimum(1, t / 0.35) * np.minimum(1, (dur - t) / 0.5) * (1 + 0.08 * np.sin(2 * np.pi * 5.2 * t)) * 0.12
# ---------- music: tarantella, 6/8, dotted quarter = 126 ----------
e8 = 60 / 126 / 3; bar = 6 * e8
prog = [(0, [0, 3, 7]), (0, [0, 3, 7]), (-5, [-5, -1, 2, 5]), (-5, [-5, -1, 2, 5]), (0, [0, 3, 7]), (5, [5, 8, 12]), (-5, [-5, -1, 2]), (0, [0, 3, 7])]
mel = [[12, 14, 15, 12, 14, 15], [19, 15, 12, 15, 14, 12], [11, 12, 14, 11, 12, 14], [17, 14, 11, 14, 12, 11],
       [12, 14, 15, 19, 17, 15], [17, 15, 14, 17, 20, 17], [16, 14, 11, 8, 11, 14], [12, None, 12, 12, None, None]]
mus = np.zeros(N); perc = np.zeros(N)
nbars = int(TOTAL / bar) + 1
for b in range(nbars):
    t0 = b * bar; root, ch = prog[b % 8]
    for k, beat in enumerate((0, 3)): at(mus, bass(semi(root - 24 + (7 if k else 0)), e8 * 2.6), t0 + beat * e8, 0.9)
    for beat in (1, 2, 4, 5):
        for j, kk in enumerate(ch): at(mus, pluck(semi(kk - 12), 0.3, 0.8), t0 + beat * e8 + j * 0.006, 0.20)
    for i, m in enumerate(mel[b % 8]):
        if m is not None: at(mus, pluck(semi(m), 0.34, 1.2), t0 + i * e8, 0.55)
    for i in range(6): at(perc, jingle(1.0 if i in (0, 3) else 0.45), t0 + i * e8, 0.5)
    at(perc, drum(), t0, 0.6); at(perc, drum(), t0 + 3 * e8, 0.35)
# sections: (frame a, b, music gain, percussion gain)
SEC = [(0, 176, 1.0, 1.0), (176, 316, 0.8, 0.5), (316, 549, 0.55, 0.0), (549, 730, 0.6, 0.25), (730, 880, 0.5, 0.0), (880, 984, 0.75, 0.5),
       (984, 1110, 0.7, 0.3), (1110, 1166, 0.0, 0.0), (1166, 1351, 0.95, 0.9), (1351, 1408, 0.45, 0.0), (1408, 1516, 0.3, 0.0), (1516, 1565, 1.1, 1.0),
       (1565, 1694, 0.4, 0.0), (1694, 1776, 0.9, 0.8), (1776, 1868, 1.0, 1.0), (1868, FR, 0.0, 0.0)]
gm = np.zeros(N); gp = np.zeros(N)
for a, b, g1, g2 in SEC: m_ = (tt >= F(a)) & (tt < F(b)); gm[m_] = g1; gp[m_] = g2
mus = mus * lp(gm, 6) + perc * lp(gp, 6) * 0.5
# final chord hit on "coffee"
for kk in (0, 3, 7, 12): at(mus, pluck(semi(kk - 12), 1.4, 0.6), F(1867), 0.5)
at(mus, bass(semi(-24), 1.0), F(1867), 1.0)
# pads (not ducked as hard): halo, the hair on the headrest, the relic, the mural
pad = np.zeros(N)
at(pad, choir([semi(0), semi(4), semi(7), semi(12)], 1.9), F(490), 1.0)
at(pad, choir([semi(-2), semi(2), semi(5), semi(10)], 2.3), F(806), 0.9)
at(pad, choir([semi(0), semi(4), semi(7), semi(12)], 1.2), F(1038), 0.8)
at(pad, choir([semi(-3), semi(0), semi(4), semi(9)], 3.4), F(1565), 0.8)
at(pad, choir([semi(0), semi(4), semi(7), semi(12), semi(16)], 2.2), F(1648), 1.0)
at(pad, choir([semi(0), semi(3), semi(7)], 1.6), F(1352), 0.6)
# sad trombone for "Not once" + slow sad melody before it
def bone(f, dur, bend=0.0):
    n = int(dur * SR); t = np.arange(n) / SR; ff = f * (1 - bend * t / dur); ph = 2 * np.pi * np.cumsum(ff) / SR
    s = sum(np.sin(ph * h) / h for h in range(1, 7)); return lp(s, 1500) * np.minimum(1, t / 0.03) * np.minimum(1, (dur - t) / 0.06) * 0.22
for i, k in enumerate((7, 3, 0, -2)): at(pad, bone(semi(k - 12), 0.75, 0.0), F(1420) + i * 0.8, 0.5)
for i, (k, d) in enumerate(((3, 0.28), (2, 0.28), (1, 0.28), (0, 0.9))): at(pad, bone(semi(k - 12), d, 0.04 if i < 3 else 0.16), F(1494) + i * 0.27, 1.0)
# ---------- sfx ----------
sfx = np.zeros(N)
def thud(f=90, d=0.25):
    n = int(d * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t * np.exp(-t * 6)) * env(n, 0.001, 0.07) + lp(rng.standard_normal(n), 1500) * env(n, 0.001, 0.02) * 0.6
def whoosh(d=0.32, lo=400, hi=2600): n = int(d * SR); t = np.arange(n) / SR; return bp(rng.standard_normal(n), lo, hi) * np.sin(np.pi * t / d) ** 2 * 0.5
def clink(fs=(2650, 3910, 5200), d=0.06): n = int(0.35 * SR); t = np.arange(n) / SR; return sum(np.sin(2 * np.pi * f * t) for f in fs) / len(fs) * env(n, 0.001, d) * 0.4
def sparkle():
    out = np.zeros(int(0.7 * SR))
    for i, f in enumerate((3136, 3951, 4699, 6272, 7902)): at2(out, clink((f, f * 2.01), 0.09), i * 0.055, 0.5)
    return out
def pop(): n = int(0.12 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * (500 + 1800 * t / 0.12) * t) * env(n, 0.001, 0.03) * 0.6
def boing(): n = int(0.3 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * (300 + 500 * t) * t) * env(n, 0.002, 0.07) * 0.5
def ding(f=1318): n = int(0.9 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t)) * env(n, 0.002, 0.3) * 0.3
def bell(): n = int(1.2 * SR); t = np.arange(n) / SR; return sum(np.sin(2 * np.pi * f * t) * np.exp(-t * dd) for f, dd in ((1760, 4), (2637, 6), (3520, 9), (880, 3))) * 0.12
def buzz(d):
    n = int(d * SR); t = np.arange(n) / SR; f = 190 + 30 * np.sin(2 * np.pi * 3.1 * t) + 14 * np.sin(2 * np.pi * 11 * t)
    return lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 1800) * (0.6 + 0.4 * np.sin(2 * np.pi * 5 * t)) * np.minimum(1, t / 0.2) * np.minimum(1, (d - t) / 0.25) * 0.18
def shutter(): n = int(0.1 * SR); return bp(rng.standard_normal(n), 2000, 8000) * (env(n, 0.001, 0.008) + 0.7 * np.roll(env(n, 0.001, 0.008), int(0.045 * SR))) * 0.6
def slide(d): n = int(d * SR); t = np.arange(n) / SR; return bp(rng.standard_normal(n), 2500, 6000) * (1 - t / d) ** 0.5 * 0.14
def match(): n = int(0.35 * SR); t = np.arange(n) / SR; return hp(rng.standard_normal(n), 3000) * (np.exp(-t / 0.03) + 0.35 * np.exp(-((t - 0.12) / 0.08) ** 2)) * 0.3
def zipp(): n = int(0.25 * SR); t = np.arange(n) / SR; return np.sign(np.sin(2 * np.pi * (60 + 240 * t / 0.25) * t * 8)) * bp(rng.standard_normal(n), 1500, 5000) * 0.25
def murmur(a, b, g):
    n = int((b - a) / 30 * SR); x = bp(rng.standard_normal(n), 250, 1100) * (0.6 + 0.4 * lp(np.abs(rng.standard_normal(n)), 3) * 4)
    x += bp(rng.standard_normal(n), 1100, 2600) * 0.3; t = np.arange(n) / SR; d = n / SR
    at(sfx, x * np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.4) * 0.06, F(a), g)
# crowds / ambiences
murmur(40, 126, 1.0); murmur(1268, 1351, 1.3); murmur(1700, 1840, 1.0); murmur(1565, 1646, 0.5)
cab = bp(rng.standard_normal(N), 70, 420) * 0.07 + bp(rng.standard_normal(N), 900, 2400) * 0.012
cg = np.zeros(N); cg[((tt >= F(131)) & (tt < F(174))) | ((tt >= F(316)) & (tt < F(984)))] = 1
sfx += cab * lp(cg, 3)
wind = bp(rng.standard_normal(N), 200, 900) * (0.5 + 0.5 * np.sin(tt * 1.3)) * 0.05
wg = np.zeros(N); wg[(tt >= F(1408)) & (tt < F(1516))] = 1; sfx += wind * lp(wg, 3)
roar = (bp(rng.standard_normal(N), 300, 2500) * 0.08 + bp(rng.standard_normal(N), 120, 600) * 0.05)
rg = np.zeros(N); rg[(tt >= F(1516)) & (tt < F(1568))] = 1; sfx += roar * lp(rg, 4) * 2.2
# spot effects
for f in (50, 122, 262, 456, 614, 663, 696, 795, 902, 927, 1012, 1151, 1273, 1497, 1646, 1807, 1837): at(sfx, whoosh(), F(f - 5), 0.55)
at(sfx, whoosh(0.9, 300, 1800), F(1300), 0.5); at(sfx, whoosh(1.0, 300, 1800), F(1650), 0.6)
at(sfx, sparkle(), F(112), 0.8); at(sfx, pop(), F(147), 0.9); at(sfx, sparkle(), F(150), 0.6)
at(sfx, bell(), F(196), 0.5)                                  # door bell, Gennaro waves
at(sfx, buzz(1.9), F(256), 1.0)                               # flies
at(sfx, whoosh(2.2, 150, 900), F(318), 0.9)                   # the airliner passes
at(sfx, pop(), F(444), 0.5); at(sfx, sparkle(), F(494), 0.8)  # he realises; halo
at(sfx, pop(), F(560), 0.4); at(sfx, boing(), F(590), 0.5)   # hand up... and down
for k in range(9): at(sfx, clink((1900, 2500), 0.012), F(616 + k * 5), 0.35)   # clock ticking fast
at(sfx, thud(60, 0.5), F(746), 1.3); at(sfx, whoosh(0.8, 500, 3000), F(748), 0.7); at(sfx, ding(), F(758), 0.8)   # touch-down + seatbelt chime
for f in range(772, 794, 7): at(sfx, thud(180, 0.08), F(f), 0.25)   # footsteps
at(sfx, sparkle(), F(862), 0.9)
at(sfx, whoosh(0.2, 800, 4000), F(899), 0.5); at(sfx, whoosh(0.2, 800, 4000), F(924), 0.5); at(sfx, zipp(), F(950), 0.6); at(sfx, pop(), F(971), 0.5)
at(sfx, thud(140, 0.15), F(1040), 0.7); at(sfx, sparkle(), F(1041), 0.8)   # the frame goes up
for f in (1074, 1079, 1084, 1089): at(sfx, match(), F(f), 0.6)
at(sfx, pop(), F(1096), 0.5)
at(sfx, boing(), F(1160), 0.5)                                # it's a hair
at(sfx, bell(), F(1200), 0.5)                                 # the door: the old lady
for f in range(1200, 1238, 8): at(sfx, clink((900, 1300), 0.02), F(f), 0.3)   # her cane
at(sfx, thud(120, 0.12), F(1240), 0.4)
at(sfx, pop(), F(1358), 0.8)                                  # ?
at(sfx, sparkle(), F(1518), 0.9); at(sfx, thud(80, 0.3), F(1518), 0.9); at(sfx, pop(), F(1552), 0.9); at(sfx, sparkle(), F(1553), 0.9)
at(sfx, sparkle(), F(1622), 0.7); at(sfx, sparkle(), F(1681), 1.0)
at(sfx, shutter(), F(1798), 0.9); at(sfx, boing(), F(1812), 0.5)
at(sfx, slide(0.8), F(1840), 1.0); at(sfx, clink((2100, 3300, 4700), 0.05), F(1865), 0.9)
at(sfx, clink((3100, 4650, 6200), 0.1), F(1880), 0.8)        # the coin
# ---------- mix: duck music under the voice, music +3 dB, sfx -6 dB (skill standard) ----------
venv = lp(np.abs(voice), 8); duck = 1 - 0.55 * np.clip(venv / (np.percentile(venv, 90) + 1e-9), 0, 1)
m = mus / (np.max(np.abs(mus)) + 1e-9) * 0.2 * 10 ** (3 / 20) * duck + pad / (np.max(np.abs(pad)) + 1e-9) * 0.16 * (0.6 + 0.4 * duck)
s = sfx / (np.max(np.abs(sfx)) + 1e-9) * 0.45 * 10 ** (-6 / 20)
mix = voice * 0.8 + m + s
fade = np.ones(N); fade[-int(0.2 * SR):] = np.linspace(1, 0, int(0.2 * SR)); mix *= fade
mix = np.tanh(mix * 1.1) / 1.1
sf.write("mix_raw" + TAG + ".wav", np.stack([mix, mix], 1), SR)
sf.write("music.wav", m, SR); sf.write("sfx.wav", s, SR)
print("ok", N / SR)
