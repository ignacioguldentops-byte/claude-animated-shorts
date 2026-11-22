# Detached render queue for the origin-of-the-marathon short (existing parts are skipped)
cd /home/user/maradona
while pgrep -f "^bash render_gb.sh|remotion render out/gr" >/dev/null; do sleep 20; done
bash render_gb.sh out/gr/b3 445-599 600-699 700-799 800-899 900-999 1000-1099 1100-1199 1200-1299 1300-1399 1400-1499 1500-1599 1600-1612 0-99 130-292
echo QUEUE_DONE
