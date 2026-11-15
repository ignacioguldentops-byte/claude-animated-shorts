# Turn the narrator's own recording into "someone else": same performance (rhythm, intonation), different timbre.
# Clean-up (rumble, hiss, level) + Praat "Change gender" (pitch median and formants moved together, prosody kept).
# usage: python3 convert.py <recording> [name]   ->  <name>_A.wav (deeper), _B.wav (much deeper), _C.wav (lighter), _clean.wav
import sys, os, subprocess, numpy as np, soundfile as sf, parselmouth
from parselmouth.praat import call
HERE = os.path.dirname(os.path.abspath(__file__)); src = sys.argv[1]; name = sys.argv[2] if len(sys.argv) > 2 else "voz"
clean = f"{HERE}/{name}_clean.wav"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-ac", "1", "-ar", "48000", "-af",
                "highpass=f=75,afftdn=nr=12:nf=-45,equalizer=f=220:t=q:w=1:g=-2,equalizer=f=3500:t=q:w=1.2:g=2.5,acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=4,alimiter=limit=0.9", clean], check=True)
snd = parselmouth.Sound(clean)
pitch = snd.to_pitch(time_step=0.01, pitch_floor=65, pitch_ceiling=450); f0 = pitch.selected_array["frequency"]; f0 = f0[f0 > 0]
med = float(np.median(f0)) if len(f0) else 120.0
print("median pitch of the recording: %.0f Hz" % med)
VAR = {"A": (0.93, 0.87, 1.05), "B": (0.88, 0.78, 1.1), "C": (1.07, 1.12, 1.0)}   # formant ratio, pitch ratio, pitch-range factor
for k, (fr, pr, rg) in VAR.items():
    out = call(snd, "Change gender", 65, 450, fr, med * pr, rg, 1.0)
    a = out.values[0]; a = a / (np.max(np.abs(a)) + 1e-9) * 0.89
    sf.write(f"{HERE}/{name}_{k}.wav", a, int(out.sampling_frequency)); print(k, "formants x%.2f, pitch %.0f -> %.0f Hz" % (fr, med, med * pr))
