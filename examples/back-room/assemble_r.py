# Joins the rendered parts into the reel. Later entries of PARTS override earlier ones frame by frame (re-rendered
# ranges are spliced over the first render), then the mix is added and the file is encoded under 30 MB.
# usage: python3 assemble_r.py <mix.wav> <out.mp4> [video bitrate, default 4200k]
import subprocess, sys, os
D = "/home/user/maradona/out/r"; TOTAL = 1483
PARTS = ["0-249", "250-499", "500-749", "750-874", "875-999", "1000-1124", "1125-1249", "1250-1374", "1375-1482",   # first render
         "0-36", "369-415", "562-635", "745-798", "799-873", "924-994"]   # second pass: livelier hook, closer tavern, shop front, counter, London, racecourse
mix, out = sys.argv[1], sys.argv[2]; br = sys.argv[3] if len(sys.argv) > 3 else "4200k"
src = [None] * TOTAL
for k, p in enumerate(PARTS):
    a, b = map(int, p.split("-")); assert os.path.exists(f"{D}/part_{p}.mp4"), p
    for f in range(a, b + 1): src[f] = (k, f - a)
assert all(src)
segs = []; f = 0
while f < TOTAL:
    k, i0 = src[f]; g = f
    while g + 1 < TOTAL and src[g + 1] == (k, i0 + g + 1 - f): g += 1
    segs.append((k, i0, i0 + g - f + 1, f, g)); f = g + 1
fc = "".join(f"[{k}:v]trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS[s{n}];" for n, (k, a, b, _, _) in enumerate(segs))
fc += "".join(f"[s{n}]" for n in range(len(segs))) + f"concat=n={len(segs)}:v=1:a=0[v]"
for s in segs: print("frames %4d-%4d from part_%s" % (s[3], s[4], PARTS[s[0]]))
ins = sum((["-i", f"{D}/part_{p}.mp4"] for p in PARTS), [])
run = lambda *c: subprocess.run(list(c), check=True)
run("ffmpeg", "-y", "-loglevel", "error", *ins, "-filter_complex", fc, "-map", "[v]", "-c:v", "libx264", "-crf", "12", "-preset", "medium", "-pix_fmt", "yuv420p", "-r", "30", f"{D}/video.mp4")
n = subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", f"{D}/video.mp4"], capture_output=True, text=True).stdout.strip()
print("frames", n); assert int(n) == TOTAL
os.chdir(D)
run("ffmpeg", "-y", "-loglevel", "error", "-i", "video.mp4", "-c:v", "libx264", "-preset", "slow", "-b:v", br, "-pass", "1", "-an", "-f", "null", "/dev/null")
run("ffmpeg", "-y", "-loglevel", "error", "-i", "video.mp4", "-i", mix, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "libx264", "-preset", "slow", "-b:v", br, "-pass", "2", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", out)
print(out, round(os.path.getsize(out) / 1e6, 2), "MB")
