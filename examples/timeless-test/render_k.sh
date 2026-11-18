# usage: bash render_k.sh <range> [<range> ...]   (each range becomes out/k/part_<range>.mp4; finished parts are skipped)
cd /home/user/maradona
for r in "$@"; do
  [ -f out/k/part_$r.mp4 ] && continue
  rm -f out/k/tmp_$r.mp4
  npx remotion render src/index_k.tsx CricketShort out/k/tmp_$r.mp4 --frames=$r --codec h264 --crf 16 --muted --concurrency=4 --timeout=600000 --browser-executable /opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell --gl swangle --scale 1 > out/k/render_$r.log 2>&1 && mv out/k/tmp_$r.mp4 out/k/part_$r.mp4 && echo DONE_$r
done
echo ALLDONE
