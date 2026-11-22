# Media carrera en coche (the 1904 Olympic marathon)

Vertical reel (1080x1920, 30 fps, 53 s), realistic-world standard (`templates/realistic/`), one continuous camera.
Narration in Spanish (Latin American register, `es-MX-JorgeNeural`).

## Narration
1. El primero en cruzar la meta del maratón olímpico de 1904 había hecho casi la mitad en coche.
2. San Luis, 1904. Treinta y dos grados, caminos de tierra, y los coches de los jueces levantando polvo delante de los corredores.
3. Y apenas hay agua en todo el recorrido: el organizador quiere ver qué pasa si no beben.
4. Un cartero cubano corre con pantalones largos cortados a tijera, y a otro lo persiguen unos perros fuera del camino.
5. Un momento. ¿Y el del coche?
6. Verás, en el kilómetro catorce, Fred Lorz se retira, se sube a un coche y adelanta a todos saludando.
7. El coche se avería, así que se baja, sigue corriendo… y entra primero en el estadio. Casi le dan la medalla.
8. El ganador de verdad llegó medio inconsciente, con veneno para ratas y brandy en el cuerpo, sostenido por sus entrenadores.
9. ¿Y el cartero? Paró a comer manzanas de un huerto, se echó una siesta… y aun así quedó cuarto.

## What is true
- St. Louis, 30 August 1904: about 90 °F (32 °C), dusty unpaved roads; officials and doctors drove ahead of the field.
- James Sullivan kept water to a minimum (one or two points on the course) to study "purposeful dehydration".
- Félix Carvajal, a Cuban postman, ran in long trousers cut off at the knee; he ate (rotten) apples from an orchard, lay
  down for a nap, and still finished fourth. Len Tau was chased about a mile off course by dogs.
- Fred Lorz dropped out at about 9 miles (≈14 km), rode in a car for about 10 miles, ran again when it broke down,
  crossed the line first and was nearly given the gold before the trick came out (later reinstated).
- Thomas Hicks, the winner, was given strychnine (rat poison) and brandy by his trainers and was held up at the finish.
- 32 started, 14 finished.

## What is staged
All characters are invented bean-heads; nobody is a likeness of a real person. The lady with the laurel wreath, the
photographer, the organiser at the well, the four fingers, the three exhausted finishers on the grass, and the
geography (the orchard beside the stadium, the breakdown near the gate) are pictures for the narration, not records.

## Sources
- https://www.olympics.com/en/news/the-strange-case-of-the-st-louis-1904-marathon
- https://en.wikipedia.org/wiki/Athletics_at_the_1904_Summer_Olympics_%E2%80%93_Men's_marathon
- https://en.wikipedia.org/wiki/Andar%C3%ADn_Carvajal
- https://en.wikipedia.org/wiki/Len_Taunyane
- https://www.smithsonianmag.com/history/how-the-1904-marathon-became-one-of-the-weirdest-olympic-events-of-all-time-14910747/
- https://run.outsideonline.com/general/strange-running-history-the-1904-olympic-marathon/

## Build
- `src/o/geo.ts`: one continuous world (stadium of 1904 at the origin, the dirt road east through the farmland).
- `src/o/setso.ts`: terrain with hills, the cinder track, grandstand of 11 rows with a crowd, bleachers, dignitaries'
  box, judges' platform, finish posts and a tape that breaks, picket fence and gate; the fair (palaces, a dome, the
  observation wheel); the road with ruts, rail fences, telegraph poles with wires; wheat (blades) and corn (rows that
  never swim) masked to their fields; the well with windlass and bucket; the orchard with apples; the farm (clapboard
  house with porch, red gambrel barn, silo, windmill pump, hay); a 1904 touring car built from geometry (spoked wheels
  that turn, brass lamps and radiator, leather seats).
- `src/o/story.ts`: **one continuous camera**: rigs that follow cars and runners, handed over with blended flights
  (an arc over the land when far apart). No cuts.
- `qa/qa_o.ts` (`bash qa/run.sh 1`): runs the real staging and camera for every frame without rendering (~2 s) and
  reports figures whose feet or head are cut by the frame, figures overlapping, figures inside solids, the camera
  inside a solid or a car. The render only starts when it reports nothing but brief side exits.
- Voice: `voice/gen.py es-MX-JorgeNeural J 7`, `voice/timing.py` → `src/o/timing.ts`. Sound: `audio/mix_o.py`.
