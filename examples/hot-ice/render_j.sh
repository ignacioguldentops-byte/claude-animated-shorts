# usage: bash render_j.sh <range> [<range> ...]   (each range becomes out/j/part_<range>.mp4; finished parts are skipped)
cd /home/user/maradona
for r in "$@"; do
  [ -f out/j/part_$r.mp4 ] && continue
  rm -f out/j/tmp_$r.mp4
  npx remotion render src/index_j.tsx HieloShort out/j/tmp_$r.mp4 --frames=$r --codec h264 --crf 16 --muted --concurrency=4 --timeout=600000 --browser-executable /opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell --gl swangle --scale 1 > out/j/render_$r.log 2>&1 && mv out/j/tmp_$r.mp4 out/j/part_$r.mp4 && echo DONE_$r
done
echo ALLDONE
