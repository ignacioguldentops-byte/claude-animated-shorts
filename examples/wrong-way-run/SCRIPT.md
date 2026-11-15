# Al revés — notes

A 63-second vertical short in the house format about the most famous wrong-way run in American football.

## What is true (checked)
- 25 October 1964, San Francisco: Jim Marshall (Minnesota Vikings) picked up a loose ball and ran 66 yards (about
  60 metres) into his own end zone. Thinking he had scored, he threw the ball away; it went out of bounds: a safety,
  two points for the 49ers.
- A 49ers player (Bruce Bosley) was the first to reach him, and thanked him.
- The Vikings still won 27-22. The touchdown that put them ahead earlier in the game came from a fumble Marshall
  himself had forced.
- He received a letter from Roy Riegels, who ran the wrong way in the 1929 Rose Bowl: "Welcome to the club".
- He played twenty NFL seasons without missing a game.

## What is simplified or invented
- Characters are our own bean-head designs (no likenesses); team colours only, no logos or names on the kits.
- End zones are painted in team colours to make the direction readable; the scoreboard shows only numbers.
- Why he lost his bearings (the spin, the helmet, the noise) is the usual explanation, told as such.
- The postman, the bench scene, the compass, the seasons montage and the last scene are staging.

## Sources
- https://nfl.com/100/originals/100-greatest/plays-54
- https://profootballhof.com/news/2013/10/news-fact-or-fiction-jim-marshall-had-the-only-wrong-way-run-in-nfl-history
- https://www.history.com/this-day-in-history/october-25/worst-nfl-mistakes-gaffes-jim-marshall-minnesota-vikings
- https://vault.si.com/vault/1994/10/31/a-play-that-will-live-in-infamy
- https://www.49ers.com/news/75-for-75-marshall-s-wrong-way-run

## Build
Same pipeline as `examples/spain-octopus`: `voice/lines.py` is the script, `voice/guide.py` makes the narration and
writes `src/a/timing.ts`; picture (`src/a/story.ts`, `src/a/world.ts`) and sound (`audio/mix_a.py`) derive from it.
