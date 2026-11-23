# Closes Remotion renders that hang after the file is written, and keeps the finished chunk (run in the background)
cd /home/user/maradona
while true; do
  for log in out/wr/render_*.log; do r=${log#out/wr/render_}; r=${r%.log}
    [ -f out/wr/part_$r.mp4 ] && continue; [ -f out/wr/tmp_$r.mp4 ] || continue
    if tr -d '\000' < $log | grep -q "+ .*out/wr/tmp_$r.mp4"; then sleep 25; [ -f out/wr/part_$r.mp4 ] && continue
      n=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 out/wr/tmp_$r.mp4 2>/dev/null | tr -d ,); a=${r%-*}; b=${r#*-}
      if [ "$n" = "$((b - a + 1))" ]; then pkill -9 -f "tmp_$r.mp4"; sleep 2; mv out/wr/tmp_$r.mp4 out/wr/part_$r.mp4 && echo "WATCH_DONE_$r"; fi; fi
  done; sleep 20
done
