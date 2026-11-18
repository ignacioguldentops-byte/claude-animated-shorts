# The narration re-voiced with another neural voice on the timing the picture was already built on: each line is
# synthesised at the speaking rate that makes it as long as its slot in src/j/timing.ts (a small pitch-kept stretch
# takes up the rest) and laid at its start frame.  usage: python3 alvaro.py [voice] [base_rate%]  ->  voice_alt.wav
import sys, os, re, subprocess, json, time, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); SR = 48000
sys.path.insert(0, HERE)
from lines import LINES
voice = sys.argv[1] if len(sys.argv) > 1 else "es-ES-AlvaroNeural"; base = int(sys.argv[2]) if len(sys.argv) > 2 else 8
tm = open(f"{HERE}/../src/j/timing.ts").read()
SLOT = json.loads(re.search(r"LINES[^=]*= (\[\[.*?\]\]);", tm).group(1)); TOTAL = int(re.search(r"TOTAL = (\d+)", tm).group(1))
D = f"{HERE}/seg_alt"; os.makedirs(D, exist_ok=True)
TRIM = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse"
def synth(i, text, rate, tempo=1.0):
    mp3 = f"{D}/{i:02d}_{rate:+d}.mp3"; wav = f"{D}/{i:02d}_{rate:+d}_{tempo:.3f}.wav"
    if not os.path.exists(mp3) or os.path.getsize(mp3) < 2000:
        for k in range(6):
            r = subprocess.run([sys.executable, f"{HERE}/edge_one.py", voice, f"{rate:+d}%", mp3, text], capture_output=True)
            if r.returncode == 0 and os.path.exists(mp3) and os.path.getsize(mp3) > 2000: break
            time.sleep(3 + 4 * k)
        else: raise SystemExit("voice service failed on line %d" % i)
    af = TRIM + (f",atempo={tempo:.4f}" if abs(tempo - 1) > 0.004 else "")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-af", af, "-ar", str(SR), "-ac", "1", wav], check=True)
    a, _ = sf.read(wav); return a
mix = np.zeros(int(TOTAL / 30 * SR)); rep = []; LO, HI = base - 5, base + 5
for i, (text, _) in enumerate(LINES):
    f0, f1 = SLOT[i]; target = (f1 - f0) / 30; nxt = (SLOT[i + 1][0] / 30 - 0.14) if i + 1 < len(SLOT) else TOTAL / 30 - 0.5
    a = synth(i, text, base); d0 = len(a) / SR
    rate = int(round(max(LO, min(HI, (1 + base / 100) * d0 / target * 100 - 100))))
    a = synth(i, text, rate); d = len(a) / SR
    t0 = f0 / 30 + max(0.0, min(0.2, (target - d) / 2))           # a short line sits in the middle of its slot
    tempo = max(1.0, (t0 + d - nxt + d) / d) if t0 + d > nxt else 1.0  # only if it would run into the next line
    if tempo > 1.004: a = synth(i, text, rate, min(tempo, 1.1)); d = len(a) / SR
    j = int(t0 * SR); n = min(len(a), len(mix) - j); mix[j:j + n] += a[:n]
    print("line %2d slot %.2fs  rate %+d%%  tempo %.3f  len %.2fs  starts %+.2fs  ends %+.2fs vs slot, %.2fs before next" % (i, target, rate, tempo, d, t0 - f0 / 30, t0 + d - f1 / 30, nxt + 0.14 - t0 - d))
sf.write(f"{HERE}/voice_alt.wav", mix / np.max(np.abs(mix)) * 0.89, SR)
