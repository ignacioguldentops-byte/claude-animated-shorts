# El pulpo — notes

A 68-second vertical short in the house format: an invented everyman (Manolo, an octopus cook from O Carballiño)
carries a true curiosity about the 2010 World Cup final: Paul the octopus.

## What is true (checked)
- Paul lived in the Sea Life aquarium in Oberhausen, Germany. Two clear boxes, each with a flag and a mussel; the box he
  opened first was the "prediction". He got all eight of his 2010 World Cup picks right, including Spain over Germany in
  the semi-final and Spain over the Netherlands in the final.
- After the semi-final pick, German fans and media joked about cooking him; Spain's prime minister joked about sending
  him a protection team.
- Spain won the final 1-0 with Iniesta's goal in minute 116, wearing the dark-blue away kit.
- O Carballiño (Ourense), famous for its Festa do Pulpo, named Paul "Amigo Predilecto"; a local businessman offered
  30,000 euros to bring him to the town. The aquarium said no.
- Octopuses are colour-blind but see brightness and contrast; some biologists suggested he was drawn to flags with bold
  horizontal stripes. Eight correct coin flips in a row is 1 in 256.

## What is invented or simplified
- Manolo, his stall, his "no octopus today" sign and everything he does.
- The ceremony with the portrait and the last scene (Paul never travelled to Galicia; he died in October 2010).
- The stripes explanation is a hypothesis, told as one ("or pure luck").
- The cup is a generic golden cup; no real trophy, logo or likeness is drawn.

## Sources
- https://en.wikipedia.org/wiki/Paul_the_Octopus
- https://www.sciencefocus.com/nature/paul-the-octopus-scientific-or-psychic
- https://www.mykhel.com/more-sports/fifa-world-cup-2010-paul-octopus-spain-protection-062976.html
- https://www.eluniverso.com/2010/07/15/1/1372/espana-ofrece-un-nuevo-hogar-paul-alemania-opone.html
- https://en.mercopress.com/2010/07/17/paul-the-oracle-octopus-not-for-sale-germany-tells-madrid-zoo

## Build
- `voice/lines.py` is the script. `voice/guide.py` makes a guide narration and writes `src/p/timing.ts` (start/end frame
  of every line); every cut, camera move, gag and sound cue derives from that table (`src/p/story.ts`, `audio/mix_p.py`).
- With a real narration: `voice/convert.py` (clean-up + timbre change that keeps the performance), then `voice/fit.py`
  (finds each line in the recording by DTW against the guide, tightens pauses, rewrites `timing.ts`), then render.
- `tools/fxsheet.mjs` and `tools/tex3.mjs` preview the 2D props and painted textures; `stills_p.mjs` renders stills.
