import json, re, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("/home/user/tts/kokoro.onnx", "/home/user/tts/voices.bin")
SPEED = float(sys.argv[1]) if len(sys.argv) > 1 else 1.4
S = [
"A barman in Naples made his empty café famous all over the world, with one hair he picked off an airplane seat.",
"His name is Gennaro, and his café is so quiet that even the flies have stopped coming in.",
"One night he's flying home from Milan, and the man asleep in the seat in front of him is Diego Maradona.",
"In Naples, that's like sitting behind a saint.",
"Gennaro is far too shy to say hello. So for two hours, he just stares at the back of that famous, curly head.",
"The plane lands. Maradona walks off. And there, on the headrest, lies one single black hair.",
"Gennaro looks left. He looks right. And he slips it into his wallet.",
"Back at the café, he puts it in a little golden frame, with candles and flowers.",
"His wife says: Gennaro, it's a hair.",
"But the next morning, an old lady walks in, and kneels in front of it. By lunchtime, the queue goes around the block.",
"Wait. Why would a whole city pray to a hair?",
"You see, before Maradona, Naples had never won the league. Not once. With him, they won it twice.",
"To them, he wasn't a footballer. He was a miracle. And every miracle needs a relic.",
"More than thirty years later, the hair is still on that wall.",
"And if you want a photo, there's only one rule. First, you buy a coffee.",
]
SAY = {"café": "cafe", "Gennaro": "Jennaro"}
out=[]; t=0.06; words=[]; sents=[]; sr=24000
out.append(np.zeros(int(t*sr)))
for s in S:
    say = s
    for a_,b_ in SAY.items(): say = say.replace(a_, b_)
    a, sr = k.create(say, voice="am_michael", speed=SPEED, lang="en-us")
    nz=np.where(np.abs(a)>0.01)[0]; a=a[max(0,nz[0]-240):nz[-1]+480]
    d=len(a)/sr
    env=np.convolve(np.abs(a), np.ones(480)/480, mode="same"); quiet=env<0.012
    gaps=[]; i=0
    while i<len(a):
        if quiet[i]:
            j=i
            while j<len(a) and quiet[j]: j+=1
            if (j-i)/sr>0.05: gaps.append(((i+j)/2/sr))
            i=j
        else: i+=1
    ws=s.split(); cl=[[]]
    for w in ws:
        cl[-1].append(w)
        if re.search(r"[.,:?]$", w) and w is not ws[-1]: cl.append([])
    bounds=[0.0]; pre=""
    for c in cl[:-1]:
        pre=(pre+" "+" ".join(c)).strip(); sp=pre
        for a_,b_ in SAY.items(): sp=sp.replace(a_,b_)
        pa,_=k.create(sp, voice="am_michael", speed=SPEED, lang="en-us"); nzp=np.where(np.abs(pa)>0.01)[0]
        est=(nzp[-1]-nzp[0])/sr+0.01
        near=[g for g in gaps if abs(g-est)<0.3]
        bounds.append(min(near,key=lambda g:abs(g-est)) if near else est)
    bounds.append(d); bounds=sorted(bounds); mode="pre"
    for ci,c in enumerate(cl):
        L=sum(len(w)+1 for w in c); cc=0; b0,b1=bounds[ci],bounds[ci+1]
        for w in c:
            w0=t+b0+(b1-b0)*cc/L; cc+=len(w)+1; words.append({"w":w,"s":round(w0,3),"e":round(t+b0+(b1-b0)*cc/L,3)})
    sents.append({"text":s,"s":round(t,3),"e":round(t+d,3)})
    print(round(t,2), round(t+d,2), mode, s[:38])
    out.append(a); gap=0.06; out.append(np.zeros(int(gap*sr))); t+=d+gap
y=np.concatenate(out); y=y/np.max(np.abs(y))*0.89
sf.write("voice.wav", y, sr)
json.dump({"sentences":sents,"words":words,"dur":len(y)/sr}, open("words.json","w"), indent=1)
print("DUR", len(y)/sr, "words", len(words), "wps", len(words)/(len(y)/sr))
