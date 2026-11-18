# Sin límite (the Timeless Test)

Vertical reel (1080x1920, 30 fps, 52 s) in the cartoon-3d-short style: 2D bean-head cards in a 3D toon world. Formula of the
curious true story (paradox hook, escalation, "Espera…", "Verás:", ironic payoff). Narration in Spanish.

## Narration
1. Este partido de críquet lleva diez días jugándose. Y va a acabar sin ganador, porque un equipo tiene que coger un barco.
2. Sudáfrica, 1939. Inglaterra y Sudáfrica acuerdan jugar sin límite de tiempo: hasta que alguien gane.
3. Pasa un día. Tres. Seis. Paran a comer, paran para el té, y los domingos descansan.
4. Espera. ¿Cómo puede durar tanto?
5. Verás: en el críquet, el bateador no está obligado a correr. Mientras no lo eliminen, puede quedarse horas.
6. Y hay que eliminar a diez. Dos veces por equipo.
7. El décimo día, a Inglaterra le faltan cuarenta y dos carreras. Y se pone a llover.
8. Su barco sale a dos días en tren. Así que hacen las maletas y se van.
9. El partido más largo de la historia acabó en empate.
10. Hoy, los más largos duran cinco días. Y aún pueden acabar en empate.

## What is true
- Fifth Test, South Africa v England, Kingsmead, Durban, 3-14 March 1939: agreed to be played to a finish ("timeless").
- Ten playing days (one lost to rain), two rest days on the Sundays; lunch and tea intervals every day.
- England, set 696 to win, were 654 for 5 (42 short) when rain stopped play on the tenth day; they had to start the
  two-day rail journey to their ship at Cape Town, so the match was left drawn. It was the last timeless Test.
- A batter is never obliged to run; an innings ends when ten batters are out; each side bats twice.
- Test matches today are limited to five days and can still be drawn.

## What is staged
All characters are invented (nobody is a likeness of a real player). The old spectator and his descendant, the umpire
throwing away his watch, the queue of padded-up batsmen, the bowler keeling over and the scoreboard of lamps are
pictures for the narration, not records. No text, numbers, logos or flags appear on screen.

## Sources
- https://www.espncricinfo.com/magazine/content/story/393923.html
- https://www.espncricinfo.com/story/timeless-memories-616787
- https://www.cricketcountry.com/articles/durban-1938-39-the-longest-test-ever-a-draw-after-10-days-of-play-23636/
- https://wikiwand.com/en/articles/English_cricket_team_in_South_Africa_in_1938-39

## Build
Same pipeline as `examples/hot-ice` (narration first; `src/k/timing.ts` drives picture and sound).
- Voice: `voice/guide.py es-ES-AlvaroNeural +15%` (Spanish neural voice) writes the narration and the timing table.
- `src/k/setsk.ts` + `paintk.ts`: the cricket ground of 1939 (mown oval, pitch, wickets, picket fence, stands with a
  period crowd, pavilion with a running clock, scoreboard of lamps, palms, the sea), the quay with the liner, the
  station with the train; today's floodlights and crowd for the last two shots.
- `src/k/story.ts`: 24 shots and their cameras; `src/k/world.ts`: staging; `audio/mix_k.py`: score and effects.
- Staging rule: nobody stands inside a prop or another character; groups are spaced so each figure reads on its own.
