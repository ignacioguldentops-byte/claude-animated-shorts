# Detached render queue: waits for any running render, then renders every missing chunk (existing parts are skipped)
cd /home/user/maradona
while pgrep -f "^bash render_ob.sh|remotion render out" >/dev/null; do sleep 20; done; sleep 60
bash render_ob.sh out/o/b4 625-760 530-600 750-874
bash render_ob.sh out/o/b5 875-999 1000-1124 1125-1249 1250-1374 1375-1499 1500-1592
echo QUEUE_DONE
