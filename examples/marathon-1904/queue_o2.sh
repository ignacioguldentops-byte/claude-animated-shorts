# second queue: after the main queue, re-render the car-boarding shot and the flight to the breakdown
cd /home/user/maradona
while pgrep -f "bash queue_o.sh" >/dev/null; do sleep 20; done
while pgrep -f "^bash render_ob.sh|remotion render out" >/dev/null; do sleep 20; done; sleep 60
bash render_ob.sh out/o/b7 880-999
echo QUEUE2_DONE
