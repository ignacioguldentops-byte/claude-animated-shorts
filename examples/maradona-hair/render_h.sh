set -e
cd /home/user/maradona
for r in 0-299 300-599 600-899 900-1199 1200-1499 1500-1799 1800-1889; do
  [ -f out/h/part_$r.mp4 ] && continue
  npx remotion render src/index.tsx MaradonaShort out/h/tmp_$r.mp4 --frames=$r --codec h264 --crf 16 --muted --concurrency=4 --timeout=600000 --browser-executable /opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell --gl swangle --scale 1 > out/h/render_$r.log 2>&1
  mv out/h/tmp_$r.mp4 out/h/part_$r.mp4
done
echo ALLDONE
