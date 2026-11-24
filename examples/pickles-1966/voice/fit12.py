# Maradona-hair voice, exactly as in that reel: es-ES-AlvaroNeural at +12 %, one clip per sentence, each placed where
# the picture expects it (the picture's line slots in ../src/w/timing.ts stay as rendered).
#   python3 fit12.py  ->  seg_M12/*.wav, voice_M12.wav, fit_M12.json
import os, re, sys, json, subprocess, time, numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import LINES
H = os.path.dirname(os.path.abspath(__file__)); D = f"{H}/seg_M12"; os.makedirs(D, exist_ok=True); SR = 48000
ts = open(f"{H}/../src/w/timing.ts").read()
SLOT = json.loads(re.search(r"LINES[^=]*= (\[.*?\]);", ts, re.S).group(1)); FR = int(re.search(r"TOTAL = (\d+)", ts).group(1))
af = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse"
def say(k, text):
    wav = f"{D}/{k}.wav"
    if not os.path.exists(wav):
        mp3 = wav.replace(".wav", ".mp3")
        for a in range(5):
            r = subprocess.run([sys.executable, f"{H}/edge_one.py", "es-ES-AlvaroNeural", "+12%", mp3, text])
            if r.returncode == 0 and os.path.exists(mp3) and os.path.getsize(mp3) > 2000: break
            time.sleep(3 + 4 * a)
        else: raise SystemExit("voice failed: " + text)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-af", af, "-ar", str(SR), "-ac", "1", wav], check=True)
    return sf.read(wav)[0]
out = np.zeros(int(FR / 30 * SR) + SR); log = []
for i, (text, _) in enumerate(LINES):
    s, e = SLOT[i][0] / 30, SLOT[i][1] / 30
    parts = [p.strip() for p in re.split(r"\|", text) for p in re.split(r"(?<=[.…?!])\s+(?=\S)", p) if p.strip()]
    clips = [say(f"{i:02d}_{j}", p) for j, p in enumerate(parts)]
    nch = [len(p) for p in parts]; tot = sum(nch); t_end = 0
    for j, (p, y) in enumerate(zip(parts, clips)):
        t = s + (e - s) * sum(nch[:j]) / tot          # where this sentence started in the rendered timing
        t = max(t, t_end + (0.18 if j else 0)); k = int(t * SR); out[k:k + len(y)] += y; t_end = t + len(y) / SR
        log.append({"line": i, "part": j, "start": round(t, 2), "dur": round(len(y) / SR, 2), "slot_end": round(e, 2), "text": p})
    print(f"line {i}: slot {s:5.2f}-{e:5.2f}  speech ends {t_end:5.2f}  ({'OK' if t_end <= e + 0.35 else 'LONG'})")
out = out[: int(FR / 30 * SR)]; sf.write(f"{H}/voice_M12.wav", out / np.max(np.abs(out)) * 0.89, SR)
json.dump(log, open(f"{H}/fit_M12.json", "w"), ensure_ascii=False, indent=1)
