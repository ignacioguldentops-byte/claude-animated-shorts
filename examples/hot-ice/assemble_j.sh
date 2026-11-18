# joins the rendered parts (with the two re-rendered ranges spliced in), adds the mix and encodes the reel under 30 MB
cd /home/user/maradona/out/j || exit 1
ffmpeg -y -loglevel error \
  -i part_0-239.mp4 -i part_240-479.mp4 -i part_480-719.mp4 -i part_720-959.mp4 \
  -i part_960-1199.mp4 -i part_970-1120.mp4 -i part_1200-1527.mp4 -i part_1333-1395.mp4 \
  -filter_complex "\
[4:v]trim=start_frame=0:end_frame=10,setpts=PTS-STARTPTS[a];\
[4:v]trim=start_frame=161:end_frame=240,setpts=PTS-STARTPTS[b];\
[6:v]trim=start_frame=0:end_frame=133,setpts=PTS-STARTPTS[c];\
[6:v]trim=start_frame=196:end_frame=328,setpts=PTS-STARTPTS[d];\
[0:v][1:v][2:v][3:v][a][5:v][b][c][7:v][d]concat=n=10:v=1:a=0[v]" \
  -map "[v]" -c:v libx264 -crf 12 -preset medium -pix_fmt yuv420p -r 30 video.mp4 || exit 1
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 video.mp4
BR=${1:-4200k}
ffmpeg -y -loglevel error -i video.mp4 -c:v libx264 -preset slow -b:v $BR -pass 1 -an -f null /dev/null
ffmpeg -y -loglevel error -i video.mp4 -i ../../audio_j/mix_A.wav -map 0:v:0 -map 1:a:0 -c:v libx264 -preset slow -b:v $BR -pass 2 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart -shortest hielo.mp4
ls -la hielo.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 hielo.mp4
ffmpeg -hide_banner -nostats -i hielo.mp4 -af loudnorm=print_format=summary -f null - 2>&1 | grep -E "Input Integrated|Input True Peak"
