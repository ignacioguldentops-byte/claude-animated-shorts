# Spanish narration fitted to the picture: one clip per clause, placed at the frame where the picture expects it,
# gently sped up (pitch kept) when a clause is longer than its slot.
# usage: python3 tts_es.py kokoro [voice]   |   python3 tts_es.py eleven <voice_id> [speed]
import json, sys, subprocess, os, numpy as np, soundfile as sf
ENGINE = sys.argv[1] if len(sys.argv) > 1 else "kokoro"
SEG = [
 (2, "Un camarero de Nápoles hizo mundialmente famoso su bar vacío con un pelo que cogió de un asiento de avión."),
 (176, "Se llama Gennaro, y su bar está tan vacío que ya no entran ni las moscas."),
 (316, "Una noche vuelve en avión desde Milán, y el hombre que duerme en el asiento de delante es Diego Maradona."),
 (487, "En Nápoles, eso es ir detrás de un santo."),
 (549, "Gennaro no se atreve ni a saludarlo."),
 (614, "Así que se pasa dos horas mirando la nuca de esa famosa cabeza rizada."),
 (730, "Aterrizan."),
 (757, "Maradona se baja."),
 (795, "Y ahí, en el reposacabezas, queda un único pelo negro."),
 (880, "Mira a la izquierda."),
 (912, "A la derecha."),
 (938, "Y se lo guarda en la cartera."),
 (984, "De vuelta en el bar, lo pone en un marquito dorado, con velas y flores."),
 (1110, "Su mujer le dice: Gennaro, es un pelo."),
 (1170, "Pero a la mañana siguiente, una anciana entra y se arrodilla delante."),
 (1268, "A mediodía, la cola da la vuelta a la manzana."),
 (1351, "Espera. ¿Rezarle a un pelo?"),
 (1408, "Verás: antes de Maradona, el Nápoles nunca había ganado la liga."),
 (1497, "Ni una."),
 (1518, "Con él, ganó dos."),
 (1565, "No era un futbolista."),
 (1608, "Era un milagro."),
 (1640, "Y todo milagro pide una reliquia."),
 (1694, "Más de treinta años después, el pelo sigue ahí."),
 (1776, "Y si quieres una foto, solo hay una regla."),
 (1837, "Primero, pides un café."),
]
END = 1886; SR = 48000; os.makedirs("seg_" + ENGINE, exist_ok=True)
def synth(i, text):
    out = f"seg_{ENGINE}/{i:02d}.wav"
    if os.path.exists(out): return out
    if ENGINE == "kokoro":
        from kokoro_onnx import Kokoro
        global K
        try: K
        except NameError: K = Kokoro("/home/user/tts/kokoro.onnx", "/home/user/tts/voices.bin")
        a, sr = K.create(text.replace("Gennaro", "Yenaro"), voice=sys.argv[2] if len(sys.argv) > 2 else "em_alex", speed=1.12, lang="es")
        sf.write(out, a, sr)
    else:
        import urllib.request
        vid = sys.argv[2]; speed = float(sys.argv[3]) if len(sys.argv) > 3 else 1.1
        body = {"text": text, "model_id": "eleven_multilingual_v2", "language_code": None,
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.8, "style": 0.15, "use_speaker_boost": True, "speed": speed},
                "previous_text": SEG[i - 1][1] if i else None, "next_text": SEG[i + 1][1] if i + 1 < len(SEG) else None}
        body = {k: v for k, v in body.items() if v is not None}
        mp3 = out.replace(".wav", ".mp3")
        r = subprocess.run(["curl", "-sS", "-m", "120", "-X", "POST", f"https://api.elevenlabs.io/v1/text-to-speech/{vid}?output_format=mp3_44100_192",
                            "-H", "Content-Type: application/json", "-d", json.dumps(body), "-o", mp3, "-w", "%{http_code}"], capture_output=True, text=True)
        if r.stdout.strip() != "200": raise SystemExit(f"ElevenLabs error {r.stdout}: {open(mp3, 'rb').read()[:300]}")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-ar", str(SR), "-ac", "1", out], check=True)
    return out
def load(path, tempo=1.0):
    tmp = path.replace(".wav", "_t.wav")
    af = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse"
    if tempo > 1.001: af += f",atempo={tempo:.4f}"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-af", af, "-ar", str(SR), "-ac", "1", tmp], check=True)
    a, _ = sf.read(tmp); return a
mix = np.zeros(int(1890 / 30 * SR)); cur = 0.0; rep = []
for i, (f0, text) in enumerate(SEG):
    p = synth(i, text); a = load(p); d = len(a) / SR
    t0 = max(f0 / 30, cur + 0.05); nxt = (SEG[i + 1][0] if i + 1 < len(SEG) else END) / 30
    room = nxt + 0.12 - t0                      # may run 0.12 s into the next slot
    tempo = min(1.2, max(1.0, d / max(room, 0.2)))
    if tempo > 1.001: a = load(p, tempo); d = len(a) / SR
    j = int(t0 * SR); mix[j:j + len(a)] += a[:len(mix) - j]; cur = t0 + d
    rep.append({"i": i, "frame": f0, "start": round(t0, 2), "late": round(t0 - f0 / 30, 2), "dur": round(d, 2), "tempo": round(tempo, 3), "over": round(cur - nxt, 2), "text": text})
    print(f"{i:2d} f{f0:4d} late {t0 - f0 / 30:+.2f}s dur {d:.2f} tempo {tempo:.2f} over {cur - nxt:+.2f}  {text[:40]}")
mix = mix / np.max(np.abs(mix)) * 0.89
sf.write(f"voice_{ENGINE}.wav", mix, SR); json.dump(rep, open(f"fit_{ENGINE}.json", "w"), ensure_ascii=False, indent=1)
print("max tempo", max(r["tempo"] for r in rep), "max late", max(r["late"] for r in rep))
