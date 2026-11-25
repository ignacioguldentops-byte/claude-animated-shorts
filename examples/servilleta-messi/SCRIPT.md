# La servilleta (57.6 s vertical reel, Spanish)

Same style, engine and music as the Maradona-hair reel (`examples/maradona-hair/`), new true story: the paper napkin on
which FC Barcelona committed to sign a 13-year-old Lionel Messi.

## Facts and sources
- On 14 December 2000, at a tennis club in Barcelona, Barça's sporting director Carles Rexach signed a commitment on a
  paper napkin to sign Lionel Messi, in front of the agents Josep Maria Minguella and Horacio Gaggioli; all three signed it.
- Messi, 13, had a growth-hormone deficiency; the treatment was expensive and Barcelona agreed to pay for it.
- The club had hesitated for weeks after his trial; the agents pressed with an ultimatum to take him elsewhere.
- Messi went on to win eight Ballon d'Or awards and the 2022 World Cup.
- The napkin was sold by Bonhams (London) in May 2024 for £762,400 (about $965,000).
- Sources: NPR (2024-05-18) "Napkin securing Lionel Messi's first contract fetches nearly $1 million at auction";
  ESPN "Lionel Messi's famous Barcelona napkin sold at auction"; NBC News "Deal written on a napkin that sent Lionel
  Messi to Barcelona sells at auction for $965,000"; CBS Sports (same sale).

## What is invented (dramatization)
- The waiter "Pere", his empty bar, the flies, the missing paper, him handing over the napkin, and the wall of framed
  napkins are our own story beats. No real person is depicted with their likeness; the cast are generic doodles.

## Voice-over (es-ES-AlvaroNeural, flat +12 %)
1. Una servilleta de papel se vendió por casi un millón de dólares.
2. Pere es camarero en un club de tenis de Barcelona, y en su bar nunca pasa nada.
3. Hasta que un día de diciembre del año dos mil, se sientan en su mesa tres señores muy serios.
4. Uno es el director deportivo del Barça.
5. Los otros dos le hablan de un niño argentino de trece años que juega como nadie.
6. Pero mide como un niño de nueve, y su tratamiento para crecer cuesta una fortuna.
7. El Barça lleva semanas dudando, y los agentes amenazan con llevárselo a otro club.
8. Entonces el director pide un papel. Y no hay papel.
9. Pere mira a la izquierda. A la derecha. Y le da una servilleta.
10. En ella, el director se compromete a fichar a Lionel Messi. Y firman los tres.
11. Espera. ¿Un fichaje en una servilleta?
12. Verás: gracias a esa servilleta, el Barça se quedó al niño y le pagó el tratamiento.
13. Y ese niño ganó ocho Balones de Oro. Y un Mundial.
14. Veinticuatro años después, la servilleta se subastó en Londres.
15. ¿Y Pere? Sigue en su bar. Pero ahora guarda todas las servilletas.

## Build
- `src/n/`: copy of the hair engine; story.ts (15 shots, cameras, lights), world.ts stage(), sets.ts (club bar = the
  café redressed, auction room `buildAuction`), cast.ts (Pere, director, agents, kid, star, auctioneer), props.ts
  (napkin with writing/signatures, golden balls, coin heap, pen hand, dome, napkin tower), paint2.ts (club wall,
  napkin wall, auction textures).
- Voice: `voice/gen.py es-ES-AlvaroNeural N` then `voice/timing.py N` (writes src/n/timing.ts).
- Music/SFX: `audio/mix_n.py` (the hair tarantella, re-sectioned) then two-pass loudnorm to -14 LUFS.
- Stills `node stills_n.mjs out/n/a_ 30,95 0.5`; render `bash queue_n.sh` (+ `watch_n.sh`); `python3 assemble_n.py mix.wav out.mp4 4000k`.
