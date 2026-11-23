# after the main queue: the run to the taverna approached from the road side (bundle b5)
cd /home/user/maradona
while pgrep -f "bash queue_g.sh" >/dev/null; do sleep 30; done
while pgrep -f "^bash render_gb.sh|remotion render out/gr" >/dev/null; do sleep 20; done; sleep 60
bash render_gb.sh out/gr/b5 940-1079
echo QUEUE2_DONE
