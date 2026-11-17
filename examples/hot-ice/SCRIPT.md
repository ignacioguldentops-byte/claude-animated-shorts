# Hielo caliente — notes

A 51-second vertical short in the house format: the island sled team that went to the 1988 Winter Games, told as a
curious true story (paradox hook, escalation, "Espera…", "Verás:", ironic payoff). Narration in Spanish.

## Narration
1. Este trineo olímpico viene de una isla donde jamás ha nevado. Y está a punto de volcar a ciento treinta por hora.
2. Jamaica, 1987. Dos empresarios ven una carrera de carritos y piensan: esto es un trineo sin hielo.
3. Ningún velocista acepta. Así que reclutan soldados… y a un cantante de reggae.
4. Meses después están en Calgary, vendiendo camisetas para poder competir.
5. A tres días de la carrera, uno se lesiona. Entra el hermano del piloto, que solo había ido a animar.
6. Espera. ¿Y con eso compiten?
7. Verás: en la salida son los séptimos más rápidos del mundo.
8. Y entonces… vuelcan. Con los cascos rozando el hielo.
9. Se levantan. Y caminan hasta la meta, con todo el público en pie.
10. Quedaron últimos.
11. Seis años después volvieron. Y ganaron a Estados Unidos.

## What is true (checked)
- Two American businessmen living in Jamaica saw a pushcart derby in 1987, thought it looked like bobsledding and set
  up a team. Sprinters were not interested, so the team came from open try-outs and the army; a reggae singer was part
  of the squad as its reserve.
- In Calgary they raised money by selling T-shirts (and the singer's record).
- Days before the four-man race one member was injured; the pilot's younger brother, a sprinter who had travelled to
  watch, joined the sled three days before.
- On the third run their start was the seventh fastest of the heat; the sled then overturned in a curve at about
  85 mph (roughly 130 km/h), the crew's helmets scraping the wall. They got out and walked to the finish beside the
  sled, to applause. They did not take the last run, so they are listed last (did not finish).
- Six years later (Lillehammer 1994) the four-man sled finished 14th, ahead of the United States sleds.

## What is staged or simplified
- Nobody is a likeness: the crew, the businessmen, the brother, the singer and the crowd are invented bean-head
  characters. No real names, no brands, no rings, no text on screen; the results board shows flags and dots only.
- The race is shown at night under floodlights and an aurora (the real runs were in daylight). The start hill, the
  curve, the finish stands and the snowy square are our own set, not the real track or town.
- In the picture the singer stays in the stands (he was the reserve); the four in the sled are the three soldiers and
  the brother.
- "Una isla donde jamás ha nevado" is the usual way of putting it; there is no record of snow in Jamaica.

## Sources
- https://olympics.com/en/news/jamaican-bobsleigh-team-1988-winter-olympics
- https://wtop.com/news/2014/02/1988-jamaican-bobsled-team/
- https://www.nbcsports.com/olympics/news/jamaica-bobsled-stranded-calgary
- https://www.fox13news.com/news/cool-runnings-inspired-by-original-jamaican-bobsled-team
- https://en.wikipedia.org/wiki/Jamaica_at_the_1994_Winter_Olympics

## Build
Same pipeline as `examples/back-door` (narration first; `src/j/timing.ts` drives picture and sound).
- `src/j/track.ts`: the hill, the ice track's centre line, its banked cross-section swept into geometry, and where a
  sled is for a distance along it (on the floor, up the wall of a curve, or tipped on its side).
- `src/j/setsj.ts` + `paintj.ts`: the valley (snow terrain, 360-degree painted mountains, pines, start house, floodlights,
  grandstand, finish arch, results board, a square with chalets, a church and the T-shirt stall) and the island (beach
  with sea, foam, palms, a beach bar, a barracks; a village road running down a hill to the sea).
- `src/j/story.ts`: 22 shots; `src/j/world.ts`: staging; `audio/mix_j.py`: score and effects.
