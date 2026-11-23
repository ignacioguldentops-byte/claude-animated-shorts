# Synthesize every line with one voice: python3 gen.py <voice> <tag>  ->  seg_<tag>/NN.wav (silence trimmed, 48 kHz mono)
import sys, os, subprocess, time, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import LINES
HERE = os.path.dirname(os.path.abspath(__file__)); voice, tag = sys.argv[1], sys.argv[2]; extra = int(sys.argv[3]) if len(sys.argv) > 3 else 0; D = f"{HERE}/seg_{tag}"; os.makedirs(D, exist_ok=True)
af = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse"
tot = 0
for i, (text, rate) in enumerate(LINES):
    mp3, wav = f"{D}/{i:02d}.mp3", f"{D}/{i:02d}.wav"
    if not os.path.exists(wav):
        parts = []
        for pi, piece in enumerate(text.split("|")):
            pm = mp3.replace(".mp3", f"_{pi}.mp3"); pw = pm.replace(".mp3", ".wav")
            for k in range(4):
                rr = f"{int(rate.strip('%+') if rate[0] != '-' else rate.strip('%')) + extra:+d}%"; r = subprocess.run([sys.executable, f"{HERE}/edge_one.py", voice, rr, pm, piece])
                if r.returncode == 0 and os.path.exists(pm) and os.path.getsize(pm) > 2000: break
                time.sleep(3 + 4 * k)
            else: raise SystemExit(f"voice failed on line {i}")
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", pm, "-af", af, "-ar", "48000", "-ac", "1", pw], check=True); parts.append(sf.read(pw)[0])
        import numpy as np
        gap = np.zeros(int(0.22 * 48000)); y = parts[0]
        for p in parts[1:]: y = np.concatenate([y, gap, p])
        sf.write(wav, y, 48000)
    d = sf.info(wav).duration; tot += d; print(f"{i:2d} {d:5.2f}s {len(text.replace('|', ' ').split())/d:4.2f} w/s")
print(tag, "total speech", round(tot, 2))
