# Narration from a TTS engine, one clip per script line, fitted to the picture's line table (src/p/timing.ts):
# each clip starts where the picture expects the line; it is sped up (pitch kept) only if it would run into the next line.
# usage: python3 tts_fit.py edge <voice> [rate]   |   python3 tts_fit.py eleven <voice_id> [speed] [model]
import sys, os, re, json, subprocess, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); SR = 48000
sys.path.insert(0, HERE); from lines import LINES as TXT
ts = open(HERE + "/../src/p/timing.ts").read()
LT = json.loads(re.search(r"LINES[^=]*= (\[.*?\]);", ts, re.S).group(1)); FR = int(re.search(r"TOTAL = (\d+)", ts).group(1))
ENGINE = sys.argv[1]; VOICE = sys.argv[2]; tag = re.sub(r"[^A-Za-z0-9]", "", VOICE)[:24]; d = f"{HERE}/seg_{ENGINE}_{tag}"; os.makedirs(d, exist_ok=True)
def say(t): return t.replace("«", "").replace("»", "").replace("2010", "dos mil diez")
def synth(i, text):
    mp3 = f"{d}/{i:02d}.mp3"; wav = mp3.replace(".mp3", ".wav")
    if os.path.exists(wav): return wav
    if ENGINE == "edge":
        rate = sys.argv[3] if len(sys.argv) > 3 else "+8%"
        for k in range(5):
            r = subprocess.run([sys.executable, f"{HERE}/edge_one.py", VOICE, rate, mp3, say(text)], capture_output=True)
            if r.returncode == 0 and os.path.exists(mp3) and os.path.getsize(mp3) > 2000: break
            import time; time.sleep(3 + 4 * k)
        else: raise SystemExit("voice service failed on line %d" % i)
    else:
        speed = float(sys.argv[3]) if len(sys.argv) > 3 else 1.08; model = sys.argv[4] if len(sys.argv) > 4 else "eleven_multilingual_v2"
        body = {"text": say(text), "model_id": model, "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.3, "use_speaker_boost": True, "speed": speed}}
        if model != "eleven_v3": body["previous_text"] = say(TXT[i - 1][0]) if i else None; body["next_text"] = say(TXT[i + 1][0]) if i + 1 < len(TXT) else None
        body = {k: v for k, v in body.items() if v is not None}
        r = subprocess.run(["curl", "-sS", "-m", "120", "-X", "POST", f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_192",
                            "-H", "Content-Type: application/json", "-d", json.dumps(body), "-o", mp3, "-w", "%{http_code}"], capture_output=True, text=True)
        if r.stdout.strip() != "200": raise SystemExit(f"ElevenLabs error {r.stdout}: {open(mp3, 'rb').read()[:300]}")
    af = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-af", af, "-ar", str(SR), "-ac", "1", wav], check=True)
    return wav
def tempo(path, k):
    tmp = path.replace(".wav", "_t.wav"); subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-af", f"atempo={k:.4f}", tmp], check=True); a, _ = sf.read(tmp); return a
mix = np.zeros(int(FR / 30 * SR)); cur = 0.0; rep = []
for i, (text, _) in enumerate(TXT):
    p = synth(i, text); a, _ = sf.read(p); dur = len(a) / SR
    t0 = max(LT[i][0] / 30, cur + 0.1); nxt = LT[i + 1][0] / 30 if i + 1 < len(TXT) else FR / 30 - 0.3
    room = nxt - 0.1 - t0; k = min(1.18, max(1.0, dur / max(room, 0.2)))
    if k > 1.005: a = tempo(p, k); dur = len(a) / SR
    j = int(t0 * SR); n = min(len(a), len(mix) - j); mix[j:j + n] += a[:n]; cur = t0 + dur
    rep.append((i + 1, round(t0 - LT[i][0] / 30, 2), round(dur, 2), round(k, 3), round(room - dur, 2)))
mix = mix / np.max(np.abs(mix)) * 0.89; out = f"{HERE}/voice_{ENGINE}_{tag}.wav"; sf.write(out, mix, SR)
print(out); print("line, late, dur, tempo, slack:", rep); print("max tempo", max(r[3] for r in rep), "max late", max(r[1] for r in rep), "min slack", min(r[4] for r in rep))
