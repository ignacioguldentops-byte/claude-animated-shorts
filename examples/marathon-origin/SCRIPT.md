# Cómo nació el maratón (vertical short, 1080x1920, ~54 s)

## Narration (es-MX-JorgeNeural, Latin American storytelling register)
1. El maratón se inventó por culpa de una carrera que, casi seguro, nunca pasó.
2. Grecia, 490 antes de Cristo. Atenas vence a los persas en Maratón, y un mensajero corre a la ciudad a dar la noticia.
3. Llega, grita: «¡Hemos vencido!»… y cae muerto.
4. Un momento. | Heródoto, que contó la batalla, solo habla de un corredor que fue a Esparta a pedir ayuda. Lo de la muerte apareció siglos después.
5. Verás, en 1896 un lingüista francés, Michel Bréal, propuso revivirla en los primeros Juegos modernos, y hasta pagó el trofeo.
6. La ganó Spiridón Luis, un aguador griego que, dicen, paró en una taberna a tomarse una copa a mitad de camino.
7. ¿Y los cuarenta y dos ciento noventa y cinco? Londres, 1908: salida en el castillo de Windsor, meta frente al palco de la reina.
8. Esa medida se quedó. Así que todo maratón del mundo mide lo que hizo falta para acabar delante de una reina.

## Facts and how they are worded
- Herodotus (Histories 6.105-106) tells of Pheidippides running from Athens to Sparta to ask for help before the battle;
  he never mentions a run from Marathon to Athens or a death. The death story appears centuries later (Plutarch names
  another herald; Lucian, 2nd century AD, gives the full "rejoice, we conquer" version). Hence "casi seguro, nunca pasó".
- Michel Bréal, French philologist, proposed the race to Pierre de Coubertin in 1894 and gave the silver cup for the winner.
- Spyridon Louis, who helped his father carry water into Athens, won on 10 April 1896. The stop at an inn in Pikermi is
  traditional but disputed (wine, or cognac according to his grandson), so the script says "dicen" and "una copa".
- London 1908: start on the grounds of Windsor Castle, finish in front of the royal box at the White City stadium, where
  Queen Alexandra watched: 26 miles 385 yards (42.195 km), later made the standard distance (1921).

## Sources
- https://en.wikipedia.org/wiki/Pheidippides
- https://theconversation.com/the-uncertain-origins-of-the-modern-marathon-79493
- https://worldathletics.org/heritage/news/1896-olympic-marathon-spiridon-louis-125-anniversary-breal-cup
- https://en.wikipedia.org/wiki/Breal%27s_Silver_Cup
- https://en.wikipedia.org/wiki/Spyridon_Louis
- https://en.wikipedia.org/wiki/Athletics_at_the_1908_Summer_Olympics_%E2%80%93_Men%27s_marathon
- https://www.olympedia.org/results/56369

## What is staged
Every character is an invented bean-head; nobody is a likeness of a real person (the queen is a generic queen in a box).
The geography is compressed: the Marathon-Athens road is 700 m long, the Acropolis, the agora and the 1896 stadium sit at
its west end, the taverna is at mid road; England is reached through a bank of cloud. The dying messenger, the historian
walking in, the princes running beside the winner and the waving queen are pictures for the narration.

## What is new in this film (answering the notes on the previous one)
- Enclosed sets: every view closes on hills dressed in scrub and pines, a town round Athens, the cape and mountain round
  the bay, belts of oak round the English park; far mountains get a forest texture instead of a bare backdrop.
- Trees v2 (`src/g/trees.ts`): branching trunks with bark per species, painted leaf sprays (olive, cypress, stone pine,
  oak, plane, poplar), crown shading, wind; scrub bushes; a vine over the taverna pergola.
- Characters (`src/g/toon.ts`, `castg.ts`): a real run and walk cycle (arms pumping, knees lifting, stride and IK knees
  side-on), a bold outer ink line on every figure (`outline.ts`), new hats and costumes (crested helmets, petasos, fez,
  Persian caps, laurel, tiara, tunics, capes that trail, sashes, cuirasses), catchlights, nose, blush, new expressions,
  and a different silhouette for every role.
- Camera: one continuous move with no held frames (sweeps, orbits, flights, a crossing through cloud). The frame
  checker (`qa/qa_g.ts`) now also tests the camera against the terrain and tree crowns, and floating/sunk figures; trees
  and bushes are never planted where the camera path would pass through them.

## Build
Voice: `voice/gen.py es-MX-JorgeNeural J 10`, `voice/timing.py`. Sound: `audio/mix_g.py` (modal piece for 490 BC,
bouzouki dance for 1896, brass march and fanfare for 1908; effects), normalised to -14 LUFS. Render: `render_gb.sh`
from prebuilt bundles, `queue_g.sh` detached, `watch_g.sh`; `assemble_g.py` splices re-rendered ranges.
