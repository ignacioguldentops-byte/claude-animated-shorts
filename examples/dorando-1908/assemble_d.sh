# joins the 15 fps parts, scales to 1080x1920, doubles each frame to 30 fps, adds the mix, encodes under 30 MB
cd /home/user/maradona/out/dr
printf "file 'part_0-199.mp4'\nfile 'part_200-399.mp4'\nfile 'part_400-600.mp4'\n" > list.txt
ffmpeg -loglevel error -y -f concat -safe 0 -i list.txt -c copy joined.mp4
ffmpeg -loglevel error -y -i joined.mp4 -vf "scale=1080:1920:flags=lanczos,fps=30" -c:v libx264 -crf 12 -preset fast -pix_fmt yuv420p up.mp4
ffmpeg -loglevel error -y -i up.mp4 -c:v libx264 -preset medium -b:v 4500k -pass 1 -an -f null /dev/null
ffmpeg -loglevel error -y -i up.mp4 -i /home/user/maradona/audio_d/mix_A.wav -map 0:v:0 -map 1:a:0 -c:v libx264 -preset medium -b:v 4500k -pass 2 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart -shortest dorando_1908.mp4
ls -la dorando_1908.mp4
