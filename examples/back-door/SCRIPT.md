# La puerta de atrás — notes

A 49-second vertical short in the house format, in a melancholy key: a famous footballer's childhood, told through one
small true story.

## What is true (checked)
- He grew up in Madeira in a small house, sharing a room with his three siblings (shown, not narrated).
- At twelve he moved alone to Lisbon (almost a thousand kilometres away) to join a football academy, and he has said he
  cried on the phone to his family.
- In a 2019 television interview he told how, hungry at night, he and other academy boys knocked on the back door of
  a burger restaurant asking for leftovers; "Edna and two other girls" gave them burgers. He said he wanted to find
  them and invite them to dinner "to give something back".
- After the interview one of the women, Paula, came forward on Portuguese radio and said she would accept the dinner.

## What is staged or simplified
- The narration names the player (first words, as the hook). At the owner's request the player is drawn as a
  bean-head caricature of the real footballer (gelled quiff with faded sides, heavy brows, studs, tanned skin, the
  number 7, his jump celebration); everyone else is invented. No brand, logo or club crest appears.
- The street, the phone booth, the stone bench, the shut door with a cobweb and the last scene (the two of them on
  the bench, the door opening again) are staging. The real restaurant closed years ago; whether the dinner took place is not known to us.

## Sources
- https://www.insideedition.com/cristiano-ronaldo-is-searching-for-the-mcdonalds-ladies-who-fed-him-as-a-child-56101
- https://www.sportbible.com/football/take-a-bow-woman-comes-forward-as-mcdonalds-employee-who-helped-cristiano-ronaldo-20190919
- https://gulfnews.com/sport/football/cristiano-ronaldo-looking-for-edna-girl-who-gave-him-free-burgers-1.1568898854109
- https://www.thestatesman.com/sports/burger-girl-fed-broke-cristiano-ronaldo-comes-cr-7s-appeal-1502802015.html

## Build
Same pipeline as `examples/spain-octopus` (narration first, `src/c/timing.ts` drives picture and sound). Sets: the night
street, burger place, plane cabin and night sky come from the Maradona short's set (`sets.ts`), plus a bedroom and a
phone booth (`sets2.ts`, `paint4.ts`).

## Second cut (shorter, stronger hook, animation pass)
- Narration cut from 164 to 123 words (62 s -> 49 s); the first line names the player and the camera rushes in on the
  cup from frame 0, with an impact sound.
- A stone bench by the back door: seated figures now sit on real geometry with their feet on the ground.
- Held items stay visible over the head (`eat`, `ear`, `mic` arm poses in `toon.ts`): burgers, the phone, the microphone.
- The cup is held with both hands; walk cycles advance one stride per cycle so feet do not slide.
- `render_c2.sh <range>...` renders any frame ranges as separate pieces.

## Third cut (likeness, more movement, harder hook)
- New first line: "Cristiano Ronaldo le debe una hamburguesa a tres mujeres. Y salió en televisión para encontrarlas."
- Hook: frame 0 is his jump celebration landing, team-mates running in; on "hamburguesa" a giant burger drops out of
  the sky in front of him; three "?" silhouettes; then the microphone close-up.
- `toon.ts`: hair kind `quiff`, `brows`, `studs`, pose `wide` (feet apart). `cast.ts`: shared `CR` look for the boy and the man.
- More action: the boy keeps a ball up in the bedroom, the boys run to the door and fidget while they wait, they jump
  when the bag comes out, the man walks in with the flower; every camera has a slow hand-held sway (turbulence in the plane).
