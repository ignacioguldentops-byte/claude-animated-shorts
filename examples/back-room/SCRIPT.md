# La trastienda (how Real Madrid began)

Vertical reel (1080x1920, 30 fps, 49 s) in the cartoon-3d-short style: 2D bean-head cards in a 3D toon world. Formula of the
curious true story (paradox hook, escalation, "Espera…", "Verás:", ironic payoff). Narration in Spanish.

## Narration
1. Al Real Madrid lo fundaron dos catalanes. En la trastienda de una tienda de telas.
2. Madrid, 1902. El fútbol es una rareza inglesa: unos estudiantes juegan en un descampado junto a la plaza de toros, y se
   cambian en una taberna.
3. Les falta todo.
4. Hasta que llegan los hermanos Padrós: Juan y Carlos, nacidos en Barcelona y dueños de una tienda de telas en la calle de
   Alcalá.
5. En su trastienda, entre rollos de tela, nace el Madrid Fútbol Club.
6. ¿El uniforme? De blanco, como un equipo de caballeros de Londres.
7. Espera, que falta lo mejor.
8. Verás: ese mismo año montan un torneo por la coronación del rey. Primer rival: el Barcelona.
9. El Madrid pierde, tres a uno. Y un gol lo marca el fundador del Barça, que era suizo.
10. Así empezó el club con más Copas de Europa de la historia: fundado por dos catalanes, y perdiendo su primer Clásico.

## What is true
- Juan and Carlos Padrós, brothers from a Catalan family (born in Barcelona in 1869 and 1870), ran the cloth shop
  "Al Capricho" at calle de Alcalá 48 in Madrid; the first board of Madrid Foot-Ball Club met in its back room. The club
  gives 6 March 1902 as its founding date, with Juan Padrós as its first president; Carlos succeeded him.
- The first ground was a plot beside the old bullring; the players changed (and kept the goalposts) in the tavern next door,
  La Taurina.
- The all-white kit is traditionally said to follow Corinthian FC, the London side of gentleman amateurs.
- The Padrós brothers promoted the Copa de la Coronación of May 1902, for the coronation of Alfonso XIII, played at the
  Hipódromo de la Castellana. Madrid's first match in it, on 13 May 1902, was the first meeting with FC Barcelona: Madrid
  lost 1-3, and one of the goals was scored by Joan Gamper, the Swiss who had founded Barcelona in 1899.
- No club has won more European Cups.

## What is staged
All characters are invented bean-heads (nobody is a likeness of a real person). The ball that knocks a gentleman's hat off,
the students pulling their shirts on as they leave the tavern, the flat ball, the bolt of white cloth running along the
counter, the team photograph in London, the cheese, cowbell and Alps of the scorer, and the two founders sitting in today's
stand are pictures for the narration, not records. The street compresses calle de Alcalá (the shop and the stone gate were
not that close). No text, numbers, crests or logos appear on screen.

## Sources
- https://www.realmadrid.com/sobre-el-real-madrid/el-club/historia/presidentes/juan-padros
- https://en.wikipedia.org/wiki/Carlos_Padr%C3%B3s
- https://www.realmadrid.com/es-ES/el-club/historia/estadio/campo-de-o-donnel
- https://en.wikipedia.org/wiki/1902_Copa_de_la_Coronaci%C3%B3n_final
- https://espndeportes.espn.com/futbol/espana/nota/_/id/6938077/se-cumplen-118-anos-del-primer-clasico-de-la-historia-entre-real-madrid-y-barcelona

## Build
Same pipeline as `examples/timeless-test` (narration first; `src/r/timing.ts` drives picture and sound).
- Voice: `voice/guide.py es-ES-AlvaroNeural +15%` writes the narration and the timing table.
- `src/r/setsr.ts` + `paintr.ts`: today's stadium (bowl of two tiers under a lit roof, a block of real seats, the table of
  cups), calle de Alcalá in 1902 (shops under awnings, floors of balconies, slate mansards and corner domes, bunting, gas
  lamps, the tram, the stone gate) with the cloth shop, the shop and its back room (shelves of bolts, the counter, the
  fitting stand; the table with the founding paper), the waste ground by the bullring with the tavern, the desk with the
  map, a London pitch in the fog, and the racecourse (grandstand, royal box, the white rail, marquees).
- `src/r/castr.ts`: the cast; `toon.ts` gained a top hat, a bowler and a crown. `src/r/gearr.ts`: the leather ball, the
  cup, a cab, a dog, the Swiss props.
- `src/r/story.ts`: 24 shots and their cameras; `src/r/world.ts`: staging (street walkers, onlookers behind the rope, the
  crowd along the racecourse rail, the stand of today). Staging rule: nobody stands inside a prop or another character,
  and nobody the shot is about is cut by the frame.
- `audio/mix_r.py`: score (a two-step over the Andalusian cadence for 1902, a pad with a heartbeat for today) and effects;
  normalised to -14 LUFS.
- Render: `render_rb.sh <bundle> <range>...` renders `part_<range>.mp4` from a prebuilt bundle (`npx remotion bundle
  src/index_r.tsx`); `assemble_r.py <mix.wav> <out.mp4>` joins them, adds the mix and encodes under 30 MB.

## Result
`la_trastienda_reel.mp4`: 1080x1920, 30 fps, 49.4 s, 28.1 MB, -14 LUFS. `preview.jpg`: six frames of the cut.
Every shot was reviewed in motion on contact sheets; the ranges listed in the second line of `PARTS` in `assemble_r.py`
were re-framed and rendered again (the hook, the tavern, the shop front, the counter, London, the racecourse, the cups
and the two shots in today's stand). The sound was measured, not listened to.

## Realistic pass (`src/q`)
After comparing the first cut with a reference short (flat doodle characters in a physically lit, realistic 3D world),
the world was rebuilt; story, timing, cameras and cast are unchanged.
- **Look**: no ink lines on the set; every surface is a physically based material (`pbr.ts`: albedo, normal and
  roughness computed from tileable noise: setts, flags, stucco, brick, pantiles, slate, boards, cloth, felt, earth, turf,
  concrete, leather, brushed metal); the sky is an equirectangular dome that also lights the scene (PMREM); soft sun
  shadows from a 4096 map; ambient occlusion (N8AO); the cards of the cast cast real shadows instead of painted blobs.
- **Building blocks** (`real.ts`): materials textured in world metres (one seamless surface across thousands of
  instanced boxes), a batcher of instanced boxes / cylinders / spheres, grass of instanced blades that follows the camera,
  trees of leaf cards, stands filled with instanced flat people drawn by the cast painter, 3D footballs and a
  lathe-turned silver cup.
- **Sets** (`setsq.ts`, `setsq2.ts`): the stadium (real terraces with ~30 000 spectators, roof trusses, floodlight
  ribbon, tip-up seats, glass balustrade), calle de Alcalá (window reveals, French windows, iron balconies, shutters,
  cornices, mansards with dormers, shop fronts with plate glass and awnings, the tram, the stone gate), the cloth shop
  and its back room (timber shelving full of 3D bolts, panelled counter, brass till, cheval mirror), the bullring
  (38 extruded bays of horseshoe arches), the tavern (openings in the wall, pantiled roof), London and the racecourse.
- Cost: about 6-10 s per frame at 1080x1920 with `--gl swangle` (4 tabs).
