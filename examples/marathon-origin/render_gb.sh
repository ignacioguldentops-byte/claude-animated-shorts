# usage: bash render_rb.sh <bundle dir> <range> [<range> ...]   (renders from a prebuilt bundle, so the sources can change meanwhile)
cd /home/user/maradona
B=$1; shift
for r in "$@"; do
  [ -f out/gr/part_$r.mp4 ] && continue
  npx remotion render $B OriginShort out/gr/tmp_$r.mp4 --frames=$r --codec h264 --crf 16 --muted --concurrency=4 --timeout=600000 --browser-executable /opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell --gl swangle --scale 1 > out/gr/render_$r.log 2>&1 && mv out/gr/tmp_$r.mp4 out/gr/part_$r.mp4 && echo DONE_$r
done
echo ALLDONE
