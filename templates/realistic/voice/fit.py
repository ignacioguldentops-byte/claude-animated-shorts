# Lay one voice's lines into the picture's existing slots (src/r/timing.ts), time-stretching with rubberband where a line
# is longer than its slot (it may also borrow most of the pause after it): python3 fit.py <tag>  ->  voice_<tag>.wav
import sys, os, json, re, subprocess, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); tag = sys.argv[1]; SR = 48000
ts = open(f"{HERE}/../src/r/timing.ts").read(); L = json.loads(re.search(r"LINES[^=]*= (\[.*?\]);", ts, re.S).group(1)); TOT = int(re.search(r"TOTAL = (\d+)", ts).group(1))
nxt = [L[i + 1][0] for i in range(len(L) - 1)] + [TOT - 18]
out = np.zeros(int(TOT / 30 * SR)); worst = 1
for i, (a, b) in enumerate(L):
    EARLY = {6: 3}; a = a - EARLY.get(i, 0); src = f"{HERE}/seg_{tag}/{i:02d}.wav"; d = sf.info(src).duration; slot = (b - a) / 30; room = slot + 0.75 * ((nxt[i] - b) / 30)
    k = max(1.0, d / room); worst = max(worst, k)
    if k > 1.0005: tmp = f"{HERE}/seg_{tag}/{i:02d}_fit.wav"; subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-af", f"rubberband=tempo={k:.4f}:transients=smooth:formant=preserved", "-ar", str(SR), "-ac", "1", tmp], check=True); src = tmp
    y, _ = sf.read(src); j = int(a / 30 * SR); out[j:j + len(y)] += y[: len(out) - j]
    print(f"{i:2d} clip {d:5.2f}s slot {slot:5.2f}s -> tempo {k:4.2f}, ends {(a / 30 + d / k):6.2f}s (next line {nxt[i] / 30:6.2f}s)")
sf.write(f"{HERE}/voice_{tag}.wav", out / np.max(np.abs(out)) * 0.89, SR); print(tag, "max tempo", round(worst, 3))
