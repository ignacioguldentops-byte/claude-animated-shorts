---
name: cartoon-3d-short
description: Make a ~55-70 s vertical cartoon story short in the "2D characters in a colourful 3D world" style (flat bean-head cartoon cards with ink outlines, painted 3D town/world with black ink lines, saturated sky, depth-of-field backgrounds, gliding cameras, voice narration, synthesized SFX + march-style music), rendered with three.js inside Remotion. Proven on "The Bridge That Fell for a Song" (2026-10-31). Use when the user asks for another video "like the bridge video", "like the soldiers/bridge short", "in that cartoon 3D style", a history/science story short with cartoon characters in 3D, or says "use the cartoon short skill".
---

# Cartoon 3D story short (three.js + Remotion)

## CURRENT STYLE — user's order 2026-11-25 (overrides the QUALITY STANDARD below)
"Vuelve de verdad al que hiciste de pelo de Maradona. Hazme otro exactamente con ese mismo estilo, cópialo todo."
Every new reel copies the Maradona-hair reel (`examples/maradona-hair/`): painted-toon 3D world with ink lines, bean-head
cards, short punchy shots, the hook/everyman/"Espera"/"Verás"/payoff script formula, the tarantella theme
(`audio/mix.py`), Alvaro +12 %. Start from `examples/servilleta-messi/src/n/` (hair engine + new story: club bar,
auction room, stadium). The realistic look described below was rejected by the user.

## QUALITY STANDARD — mandatory for every reel from 2026-11-21 (user's order: "todos deben ser así a partir de ahora o incluso mejor")
The bar is `examples/back-room/la_trastienda_reel_v2.mp4` ("La trastienda" v2). Every new reel must match it or beat it.
Start from `templates/realistic/` (full source), not from `templates/bridge/`. Compare with
`templates/realistic/lookdev_antes_despues.jpg`: the top row (painted toon world with ink lines) is the OLD look and is
no longer acceptable.
- **Characters stay doodles**: flat bean-head cards, plum ink, stick limbs (`toon.ts`). Only the world becomes real.
- **World = realistic 3D, physically lit**: MeshStandardMaterial everywhere with albedo + normal + roughness
  (`pbr.ts`), textures laid in world metres (`wmat`), sky dome that is also the image-based light (PMREM), soft sun
  shadows (4096 map), N8AO ambient occlusion, bloom on emissives, NEUTRAL tone map + grade. NO world ink lines.
- **Detail is real geometry, not painted on**: window reveals with frames and glass, balconies with balusters,
  cornices, shutters, roof tiles, chimneys, shop fronts with goods behind glass, shelving with 3D objects, furniture with
  turned legs, extruded arches. Instanced (`Batch`) so thousands of pieces stay cheap.
- **Ground is never flat colour**: grass of instanced blades around the camera (`makeGrass`), setts, flags, earth with
  pebbles; trees made of leaf cards (`makeTrees`).
- **Crowds are full**: every stand filled with instanced flat people (`makeCrowd`), cheering on cue.
- **Props in 3D**: balls are spheres with leather / panel textures, trophies are lathe-turned metal; painted cards only
  for gags (stars, notes, question marks, flashes).
- **Cast casts real shadows**; no painted contact blobs.
- **No cuts, no clipping (user's order 2026-11-22)**: one continuous camera (rigs handed over with blended flights,
  see `examples/marathon-1904/src/o/story.ts`); every frame must pass the frame checker (`templates/realistic/qa/`,
  `bash qa/run.sh 1`): no feet or heads cut by the frame, no figures overlapping or inside solids (register every
  solid with `solid()` in `real.ts`), camera never inside a solid or a car. Fix every report before rendering.
- **Process**: test stills of every shot (`stills_q.mjs`, scale 0.5), fix framing so nobody is cut or hidden, then a
  chunked render from a prebuilt bundle (`render_qb.sh`, chunks ≤125 frames, ≤ ~3 chunks per background task), review
  every chunk in motion on contact sheets, re-render only what is wrong, assemble under 30 MB (`assemble_q.py`).
- Cost: ~6-10 s per frame at 1080x1920 with `--gl swangle`; plan ~3-4 h of render for 50 s.
- **Current quality bar (user's choice, 2026-11-23):** `examples/marathon-origin/origen_del_maraton.mp4`. Match or beat it;
  render at full 1080x1920 and 30 fps (no low-res or 15 fps shortcuts).
- **Lessons from the origin-of-the-marathon short (2026-11-23), now the reference build** (`examples/marathon-origin/`):
  enclose every set to the horizon (hills dressed with scrub texture + 3D bushes + pines, towns on slopes, far
  mountains with a forest texture, never a bare backdrop); use trees v2 (`src/g/trees.ts`: branching bark trunks,
  per-species leaf sprays, shrubs, vines); give every role its own silhouette and use the run/walk cycle and bold
  outer outline of `src/g/toon.ts` + `outline.ts`; plant no tree or bush where the camera path passes (sample
  `camAt` for every frame); check the camera against the terrain and tree crowns; in a 9:16 frame keep the people
  of a scene within about +-14 degrees of the view axis (restage them rather than widen the shot); crowds that must
  read in the frame gather in ordered rows (no crossing paths).
- **Lessons from the marathon short (2026-11-22)**: register tree canopies as solids too (the camera once flew
  through an apple tree), and check the camera against fences/rails (`camera at the fence line` in
  `examples/marathon-1904/qa/qa_o.ts`); keep subjects visible (cut a path through tall crops, have figures face the
  camera when the angle changes); no shot may hold the same framing for more than ~2 s, so orbit, pull back or rise;
  flights between far places need an `arc` so they never skim the ground; a stage change between beats must happen
  while the camera looks away. Run render queues detached (`setsid nohup bash queue_o.sh`) because background
  tasks are killed at their time limit, and after assembly measure the frame-to-frame difference at every seam
  between renders made from different bundles: any jump means re-rendering that range with the latest bundle.

## Standing user rules (override older rules below where they differ)
- Narration in **Spanish**, Latin American neutral storytelling register, modelled on the user's reference: ~3 words/s,
  sentences of ~12 words chained with "y", "Un momento." and "Verás," slower with a pause after them, ironic payoff.
  **THE voice (user's order 2026-11-23, for this and every future reel): `es-ES-AlvaroNeural` via edge-tts at a
  flat +12 %**, exactly as in the Maradona-hair reel (verified 2026-11-24: a fresh +12 % clip matches that reel's voice
  file at 0.99 correlation). Never slow it down or change the rate per line (the user noticed at +2..+8 %). Generate one
  clip per sentence and place each where the picture expects it (`examples/pickles-1966/voice/fit12.py`); do not use
  Jorge or any other voice.
- **Music = one catchy theme that loops all the way through** (user's order 2026-11-24, after the Maradona reel's
  "música medio adictiva"): an original 8-bar tune in a bouncy groove (6/8, plucked lead, off-beat chord plucks, bass
  on 1 and 4, tambourine + drum, ~1 bar per second) that repeats; vary only density and key (minor for trouble, the
  same tune in major for the payoff), stop it dead for one beat on a "Un momento". No genre changes per scene. See
  `examples/maradona-hair` (`audio/mix.py`) and `examples/pickles-1966/audio/mix_w.py`. Music level as in those mixes
  (about -24 dB in the pauses, voice clearly on top).
- **Never blurry (user's order 2026-11-23)**: keep lens blur (DOF) a light touch only (`cInf` <= ~1.6 px, see
  `examples/pickles-1966/src/w/story.ts` `dofAt`), no film grain, card textures at least as large as they appear on
  screen (`tier` in `world.ts`), and encode at the highest bitrate that still fits under 30 MB. Sharp beats "cinematic".
- Length ~49-52 s, strong hook with movement in the first second, lots of movement, true facts with sources.
- Deliver 1080x1920, 30 fps, **under 30 MB**, -14 LUFS (music +3 dB, SFX -6 dB). No captions, labels, logos, crests or
  real likenesses; all characters invented.
- Characters never stand inside props or each other, and nobody the shot is about is cut by the frame.
- Reply to the user in Spanish.


Proven example: **The Bridge That Fell for a Song**. It is an original 67 s short about the 1831 Broughton bridge and 74 soldiers marching in step.
- Code: `src/videos/bridge/` of your Remotion project (composition `BridgeShort`, 1080x1920, 30 fps).
- Script, voice and sound: `~/bridge-short/`.
- Style research: `references/`.

The style reference is a channel studied privately (`references/`: STYLE_BIBLE.md, reports/*.md, frames/).
- Those videos are private study material. Never upload, publish or send them.
- Never copy their scripts, characters or shots. Story, characters and voice are always OUR OWN.
- Never say the channel's name in a voice-over or description.

User rules that apply:
- No captions or labels in the video.
- (Old) English only — superseded: narration is now Spanish, see Standing user rules above.
- Voice: one steady tone.
- Jokes are researched real facts.
- Standard mix: music +3 dB, SFX -6 dB, voice unchanged.
- (Old) Final export 2K vertical — superseded: deliver 1080x1920 under 30 MB.
- Opus max verifies every check.
- Save after every step.
- "Just do it" once the script is approved.

## Pipeline
1. **Topic and facts.** Pick one surprising true story with a physical cause and effect (it should be visual), plus a simple everyday analogy that explains it.
   - Write the facts with their source at the top of `SCRIPT.md`.
2. **Script** (~3.7 words/s, 55-70 s). Beat formula from the bridge short:
   - **Hook:** the absurd fact in one line ("Seventy-four soldiers knocked down an iron bridge just by walking across it.").
   - **Setting:** year, place, pride.
   - **Action:** escalation over three or four beats, each a little bigger.
   - **Snap:** the moment it breaks.
   - **Deadpan double line:** "Luckily ... / Unluckily ...".
   - **Explanation:** one physics idea through an everyday analogy (the kid on a swing).
   - **Consequence:** the rule it created.
   - **Callback twist:** the ending.
   - Never describe on screen what the viewer already sees.
3. **Voice.** Record or generate `voice.wav`, then make its word timings `words.json` (any speech-to-text with word times).
   - Put them in the project folder, e.g. `~/bridge-short/voice/`.
   - Hand-fix the word timings. Everything is timed to words.json.
4. **Shot plan** in `story.ts`: copy `templates/bridge/` (the final bridge source, same as `src/videos/bridge/` of your Remotion project) to `src/videos/<name>/`, register a new composition next to `BridgeShort` in `src/Root.tsx`, and rename it.
   - `SHOTS`: id, a/b frames, light day/golden, crowd mode, `tau` story time.
   - `XFADE`: crossfades at place/time changes.
   - `FLASH_AT`: a white flash after the hook.
   - `CAMS`: per-shot keys `{f, dur?, cut?, s: f => {pos, look, fov, roll}}`.
   - `KICKS`: impact flip-shakes.
   - `DOF`/`dofAt`: lens blur per beat.
   - `FOREGROUND`: near framing props.
   - Every visual reaction lands 0-3 frames before its word.
5. **World.**
   - `lights.ts`: LIGHTS plus the LOOK sky/river/cloud palette per light.
   - `shade.ts`: two-tone shading and `untone()`.
   - `build.ts`: town, houses and Kenney CC0 kit props, recoloured, with sight-line culling of anything blocking a camera.
   - `paint.ts`: HD Canvas2D painted textures with seams painted in as dark tints.
   - `world.ts`: sky shader, fog = horizon colour, river, per-frame posing, sun frozen per shot and camera-relative.
6. **Characters.**
   - `toon.ts`: the Canvas2D `Pen` drawing API, 600x1000 design canvas, soles at y = 975, bean heads, stick limbs, plum variable-width outline, face library.
   - `cast.ts`: camera-facing billboards, crowds, effect cards, blinks, walk cycles. All billboards go on the `NOINK` layer.
   - `cardshade.ts`: cards lit by the scene light, no emissive.
7. **Post** (`Bridge.tsx` + `ink.ts` + `lensblur.ts` + `grade.ts`).
   - Composer order: ink → lens pre → lens main → bloom → NEUTRAL tone map → grade (MSAA 4).
   - Every pixel parameter scales with output height / 1920.
8. **Sound** (`~/bridge-short/audio/`: timeline.py, sfx_gen.py, sfx.py, music.py, instruments.py, dsp.py, mix.py).
   - Event table → synthesized SFX plus an original score ducked under the voice.
   - Output: mix.wav (48 kHz, exact length), stems and cues.md.
   - Lock the picture's time constants before the sound is made. Any later timing change means re-running the sound.
9. **Look checks.** Run `node scripts/bridge-stills.mjs out/<name>/x_ 100,400 0.5`.
   - Set `BRIDGE_ENTRY=src/sandboxes/<n>/index.tsx` to render a sandbox copy.
   - Make side-by-sides against reference frames with `python scripts/sbs_sheet.py out.jpg --ours ... --ref ...`.
   - Send them to an Opus max verifier: 1-3 images, a ≤200-word verdict.
10. **Final render.**
    - `npx remotion render src/index.ts <Comp> out/<name>/video.mp4 --codec h264 --crf 16 --scale 1.3333`
    - Mux with `-map 0:v:0 -map 1:a:0` (Remotion writes a silent audio track).
    - QA: `python scripts/short_qa.py final.mp4 out/<name>/qa shots.json` checks every frame for black, white, frozen and pop frames, plus loudness and sheets.
    - Fix anything it finds, then run a deep Opus audit.
11. **Deliver.** SendUserFile the final mp4, update memory, write notes.

## Final look values (bridge after 4 verifier rounds; all in `templates/bridge/`)
Start every new short from `templates/bridge/` (copy to `src/videos/<name>/`): the look lives in these values, the
story lives in story.ts / build.ts layout / cast.ts roles. Opus max scores at the end: colour day 7, golden 5-6,
lighting 5-6, ink 6, textures 5-6, characters 7, depth 6-7, composition 6-7 (from 5/3/4/5/4/7/4/6 at the start).
- **Light presets** (`lights.ts`, sun camera-relative and frozen per shot):
  - day: az 75 / el 48, lit [1.58,1.5,1.33], shade [.30,.29,.36], lift [.05,.06,.11] (cool tint ONLY in shade), sky
    top #3e7fd2 → horizon #b8d0ec, fog = horizon, 25→300 m, uSat 1.08, ~15 % blue haze past 60 m.
  - golden: az 6 / el 7 (backlit low sun), key toward #FFB36B ×1.5, violet-blue shade (facade ≈ #444380), sky
    #ffc47c → #8a6f8a, peach fog only past 50 m, sun disc #ffcf9e + bloom, contact blobs + real card shadows.
- **Albedos** (`paint.ts`/`build.ts`): muted brick / cream / ochre / terracotta houses with plinth, cornice, sills,
  hoods, door step, chimney + pot, heights 7 / 8.4 / 9.8 m; warm grey/beige stone (saturation −35 % from "storybook");
  ochre wood deck C* ~51-58 with near-black seams; iron dark and desaturated. Never lemon, never lavender lit faces.
- **Ink** (`ink.ts`): #030303, 5.1 px near (6 m) → 3.3 px far (90 m) at 1080x1920, creases ×0.8 from 35°, depth
  jumps from 1 %, fog tint 0.3 only far; character cards on layer `NOINK` (they carry their own plum ink).
- **Lens** (`lensblur.ts` + `dofAt` in story.ts): cInf px at 1080: hook/river CU 15-16, close-ups 12-14, MS 10-12,
  park 7, golden sway 5, wides/aerials 0. Focus on the eyes of the front row.
- **Post** (`Bridge.tsx`): ink → lens pre → lens main → bloom (thr 1.0, int .5, 6 levels, radius .6) → NEUTRAL tone
  map → grade; MSAA 4. Film grain exists but is OFF (reference measures no grain; it quadruples the file size).
- **Characters** (`toon.ts`/`cast.ts`/`cardshade.ts`): bean heads h/w .94, plum ink #241726, eyes .26 W apart, no blush,
  14 expressions; adults 3.5 head-heights; walk bob 5 %, lean 1-7°, planted 0.8 m stride; blinks 0.5-2.3 s; tight
  contact shadow ~.5 under the feet + sun-direction tail by day; golden rim inner only (never an offset outer copy).
- **Camera** (`story.ts`): cuts on big jumps, smootherstep glides 18-40 f, every hold creeps (no static hold ≥4 f),
  flip kicks decaying over 7 f on impacts, 4-4.6° rolls, foreground props (`FOREGROUND`) in ~1/3 of shots.

## Look targets (measured from the reference; see references/reports/)
- **Ink:**
  - World lines: about 3 px at 1080 wide, near-black #0b0a0c, nearly constant with distance. Silhouettes, depth jumps and normal creases only. No line on wall/floor joins or the horizon. Character cards are never outlined by the world ink.
  - Character ink: dark plum #201628-#2f1d28, thicker on the bottom/shadow side.
- **Colour:**
  - Day median luma ~.57. Non-ink p5 ~.23 (no crushed blacks). Lit chroma C* p90 ~55. Day sky top ~#5e93d9, horizon 1.28x brighter.
  - Golden: peach horizon #ffd08a, violet-blue shadows (never brown), backlit sun.
- **Depth:**
  - DOF on about 1/3 of screen time (CU, MS, inserts), cInf 10-16 px at 1080, focus on the eyes. Establishing and wide shots stay sharp.
  - Fog = horizon colour, 25→420 m day, 20→360 m golden.
  - Bloom only on HDR emissives: threshold 1.0.
- **Camera:**
  - Hard cuts on big jumps. Everything else is a smootherstep glide of 18-40 f, peak ≤ 25 px/f at 720p.
  - Every hold pushes in 0.15-0.35 %/f, with 0.6 %/f on punch words.
  - Rolls of 4-5°.
  - No hand-held float. Impact shakes flip sign every frame and decay over 7 f.
- **Characters:**
  - About 3.5 head-heights tall, legs 1.4 HH.
  - Stick limbs about 0.055 of head width, ink-dot hands.
  - Bean head (h/w ~0.93, narrower chin, pointier crown).
  - No blush or eye highlights. Faces at brightness ~.93.
  - Walk bob 3-7 %, lean 1-7°, planted feet.
  - Blinks every 0.5-2.3 s, lasting 4 f.

## Look-match loop (how the bridge look was reached; reuse for any "make it look like X" pass)
1. **Measure the reference first.** One analysis agent per topic (motion, depth, textures, characters, lighting, outlines, grade), each writing numbers, not adjectives, to `references/reports/<topic>.md`. Shared brief: `compare/CONTEXT.md`. Reports are the source of truth for every agent after.
2. **Sandboxes, one owner per file.** Copy the project folder to `src/videos/<name>_{cam,world,mat,char,post}` with entries `src/sandboxes/<n>/index.tsx` (same `index.tsx` as main, only the import path changed). Ownership used for the bridge:
   - cam: story.ts (camera keys, cuts, kicks, DOF table, foreground props)
   - world: world.ts, lights.ts, shade.ts, grade.ts (sun, sky, fog, river, colour, grade)
   - mat: paint.ts, build.ts (painted textures, buildings, props)
   - char: toon.ts, cast.ts, cardshade.ts (character drawing, posing, card lighting, fx cards)
   - post: ink.ts, Bridge.tsx, lensblur.ts (outline pass, composer, lens blur, bloom)
   Agents only edit their own files in their own sandbox and render stills with `BRIDGE_ENTRY=src/sandboxes/<n>/index.tsx node scripts/bridge-stills.mjs out/<name>/<n>/x_ <frames> 0.5`.
3. **Merge** with `python scripts/bridge_merge.py [cam,world,mat,char,post]` (backs main up to `backup/bridge_<time>/`, copies owned files only). Then `npx tsc --noEmit` (filter to the project folder), then **re-sync every sandbox from main** (`cp -f src/videos/<name>/* src/videos/<name>_<n>/`) before the next round.
4. **Verify** with a fresh Opus max agent: side-by-side sheets (`python scripts/sbs_sheet.py out.jpg --ours a b --ref r1 r2`), score each area out of 10 (colour day / golden, lighting, ink, textures, characters, depth, composition) plus a numbered fix list with frame numbers. Map each fix to the file owner and resume that owner's agent with SendMessage (keeps its context). Bridge scores: round 1 5/3/4/5/4/7/4/6 → round 2 5/4/5/6/4/7/6/6 → round 3 see notes.
5. Contracts between owners live in exported constants (e.g. `NOINK` layer from ink.ts, `dofAt`/`FOREGROUND` from story.ts, `LIGHTS`/`LOOK` from lights.ts). Changing a contract means telling every owner that reads it.

## Gotchas
- Kenney nature-kit materials are teal: recolour them by material name in build.ts.
- Cameras end up inside houses: the sight-line culler in build.ts/world.ts removes anything blocking any camera ray.
- Ink in the same merged effect pass as DOF gets overwritten. Ink must be its own pass before the blur.
- Pixel-sized post parameters must scale with resolution: stills are at 0.5, the final at 1.333. R3F clamps dpr to ≥ 1, so `--scale 0.5` stills still render a 1080x1920 buffer.
- **Disk:** every Remotion bundle copies `public/` (~1.3 GB) into `the temp folder\remotion-webpack-bundle-*` and never deletes it. 60+ GB filled the system drive during the bridge passes and a render died with ENOSPC. Always render with `export TEMP='<big drive>/remotion-tmp' TMP='<big drive>/remotion-tmp'` (bridge-stills.mjs sets it itself) and ask the user before deleting old bundle folders in the shared the temp folder (auto mode blocks the sweep). <big drive>/remotion-tmp fills too (~500 folders / 110 GB after the 4 bridge rounds): when a project is finished and nothing is rendering, delete its `remotion-webpack-bundle-*` and `puppeteer_dev_chrome_profile-*` folders there.
- In JS strings write `"<big drive>/remotion-tmp"`, never `"<big drive>\remotion-tmp"` (`\r` becomes a carriage return).
- Remotion writes a silent audio track: mux with `-map 0:v:0 -map 1:a:0`.
- Sub-agents can't write report files in this harness: ask them for a ≤150-word final message and save it yourself to `out/<name>/<n>/REPORT.md`.
- Scratch `.ts` files inside `out/` break `tsc`: name them `.txt`.
- 2K renders run ~4 fps (≈10 min for 67 s). Stills at 0.5 take 3-8 s each after a ~40 s bundle.
- Film grain at 2.5 % made the 2K file 910 MB instead of ~250 MB and will turn to mush on YouTube; the reference has none. Keep it off.

## Readability traps the verifier caught (check every new prop/shot for these)
- **A swing drawn as one rope that disappears behind the kid reads as a HANGING.** Always two ropes to a wide plank
  with the kid between them (`swingKid` in toon.ts), and a frame whose legs clear the arc (A-frame at each end).
- Props or flotsam closer than ~2 m to a lens become huge cut-off blobs at the frame edge. When a camera moves, re-check
  every prop near its new position (the river cameras moved into the floating hats).
- A foreground bush cut by the frame edge reads as a "green ball"; a foreground prop must be recognisable or gone.
- Flags: red + yellow star/diamond reads as Vietnam's. Use a period-correct flag (St George's cross for England 1831).
- Painted signs lit by a side sun go grey-blue and unreadable: give the sign face an unlit material.
- Golden rim light done as an offset outer copy turns every hat into a picture frame: inner rim only, head/torso only.
- Balcony/railing rails at chest height through characters: put the lens ~2.5 m up so rails cross legs, not torsos.
- Flat holds read as freezes in QA (frozen span ≥12 f): every hold needs a creeping push-in.
