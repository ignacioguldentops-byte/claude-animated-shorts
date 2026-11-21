# Realistic-world template (the quality standard since 2026-11-21)

Complete source of "La trastienda" v2 (`examples/back-room/la_trastienda_reel_v2.mp4`): flat doodle cast (bean heads,
plum ink) standing in a physically lit, realistic 3D world. Every new reel starts from this folder.

| Path | What it is |
|---|---|
| `src/pbr.ts` | Procedural PBR surfaces (albedo + normal + roughness from tileable noise): setts, flags, stucco, brick, pantile, slate, boards, weave, felt, earth, turf, concrete, leather, brushed metal; equirectangular skies (day, golden, night, grey, room) |
| `src/real.ts` | `wmat` (textures in world metres), `pmat`, `Batch` (instanced boxes / cylinders / spheres / rods), `makeGrass` (instanced blades following the camera), `makeTrees` (leaf-card crowns), `makeCrowd` (instanced flat people drawn by the cast painter, cheer by uniform), 3D balls, lathe-turned cup |
| `src/setsq.ts`, `setsq2.ts` | Example sets: stadium with real terraces and ~30 000 spectators, 1902 street with real window reveals / balconies / mansards / shop fronts / tram / stone gate, a shop with 3D shelving, bullring of extruded arches, tavern, London pitch, racecourse with grandstand |
| `src/world.ts` | Per-frame staging; sun + sky IBL (PMREM) per shot, real card shadows (no painted blobs), point lamps |
| `src/Main.tsx` | Composer: N8AO ambient occlusion → lens blur → bloom → NEUTRAL tone map → grade. World ink OFF |
| `src/toon.ts`, `castr.ts`, `cardshade.ts` | The cast (unchanged doodle style; top hat, bowler, crown added) |
| `src/story.ts` | Shots, cameras, beats from `timing.ts` |
| `voice/` | `lines.py` script, `gen.py` (edge-tts per line), `fit.py` (fits lines into the picture's slots with rubberband) |
| `audio/mix.py` | Original score + synthesized SFX, ducked under the voice |
| `scripts/` | `stills_q.mjs` (test stills), `render_qb.sh` (chunked render from a prebuilt bundle), `assemble_q.py` (join parts + mix, under 30 MB), `sheet.py` |
| `lookdev_antes_despues.jpg` | Top: the old painted-toon look. Bottom: this standard. Never go back to the top row. |
