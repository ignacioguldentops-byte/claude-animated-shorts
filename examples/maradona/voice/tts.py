import json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("/home/user/tts/kokoro.onnx", "/home/user/tts/voices.bin")
S = [
"In nineteen eighty-six, one man scored the dirtiest goal and the most beautiful goal in World Cup history, four minutes apart.",
"He grew up on the dirt roads of Villa Fiorito, outside Buenos Aires, and slept hugging his first football.",
"At twenty-five, he's Argentina's captain in a quarter-final against England, in front of a hundred and fourteen thousand people in Mexico City.",
"Six minutes into the second half, the ball floats up toward the English goalkeeper, who is twenty centimetres taller.",
"Maradona jumps anyway, and punches it into the net with his left hand.",
"Luckily for Argentina, the referee didn't see a thing.",
"Unluckily for England, Maradona was about to use his feet.",
"Four minutes later, he picks up the ball in his own half, and just starts running.",
"One Englishman, two, three, four, then the goalkeeper. Sixty metres, in about ten seconds.",
"You see, Maradona was only one metre sixty-five, with his weight low to the ground.",
"Ever watched a waiter carry a tall stack of plates? He takes every corner slowly. A short stack can whip around without tipping.",
"Argentina went on to win the whole World Cup.",
"And to this day, half the world remembers that match for his hand, and the other half for his feet.",
]
out=[]; t=0.08; sr=24000; words=[]; sents=[]
out.append(np.zeros(int(0.08*sr)))
for s in S:
    a, sr = k.create(s, voice="am_michael", speed=1.32, lang="en-us")
    # trim silence
    nz=np.where(np.abs(a)>0.01)[0]; a=a[max(0,nz[0]-240):nz[-1]+480]
    d=len(a)/sr; ws=s.split(); L=sum(len(w)+1 for w in ws); c=0
    for w in ws:
        w0=t+d*c/L; c+=len(w)+1; words.append({"w":w,"s":round(w0,3),"e":round(t+d*c/L,3)})
    sents.append({"text":s,"s":round(t,3),"e":round(t+d,3)})
    out.append(a); gap=0.07; out.append(np.zeros(int(gap*sr))); t+=d+gap
y=np.concatenate(out); y=y/np.max(np.abs(y))*0.89
sf.write("/home/user/maradona/voice/voice.wav", y, sr)
json.dump({"sentences":sents,"words":words,"dur":len(y)/sr}, open("/home/user/maradona/voice/words.json","w"), indent=1)
for x in sents: print(x["s"], x["e"], x["text"][:40])
print("DUR", len(y)/sr, "words", len(words), "wps", len(words)/(len(y)/sr))
