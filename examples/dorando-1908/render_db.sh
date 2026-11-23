# usage: bash render_db.sh <bundle dir> <range> ...   (Dorando short: 15 fps composition, rendered at 720x1280)
cd /home/user/maradona
B=$1; shift
for r in "$@"; do
  [ -f out/dr/part_$r.mp4 ] && continue
  npx remotion render $B DorandoShort out/dr/tmp_$r.mp4 --frames=$r --codec h264 --crf 16 --muted --concurrency=4 --timeout=600000 --browser-executable /opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell --gl swangle --scale 0.6 > out/dr/render_$r.log 2>&1 && mv out/dr/tmp_$r.mp4 out/dr/part_$r.mp4 && echo DONE_$r
done
echo ALLDONE
