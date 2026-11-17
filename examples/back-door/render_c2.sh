# usage: bash render_c2.sh <range> [<range> ...]   (each range becomes out/c/part_<range>.mp4; finished parts are skipped)
cd /home/user/maradona
for r in "$@"; do
  [ -f out/c/part_$r.mp4 ] && continue
  rm -f out/c/tmp_$r.mp4
  npx remotion render src/index_c.tsx PuertaShort out/c/tmp_$r.mp4 --frames=$r --codec h264 --crf 16 --muted --concurrency=4 --timeout=600000 --browser-executable /opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell --gl swangle --scale 1 > out/c/render_$r.log 2>&1 && mv out/c/tmp_$r.mp4 out/c/part_$r.mp4 && echo DONE_$r
done
echo ALLDONE
