# The Hair (61 s vertical short)

A dramatized true curiosity about Diego Maradona and Naples, told in story mode with an invented everyman.

## Facts and sources
- In Bar Nilo, a café on Spaccanapoli in Naples, a small altar displays what is presented as a hair of Diego Maradona ("the miraculous hair").
- Reports agree the owner collected it in February 1990 on a flight back from Milan, from the seat / headrest Maradona had used.
- Visitors are expected to buy a coffee before photographing the altar.
- Napoli had never won the Italian league before Maradona; with him they won it in 1987 and 1990.
- Sources: Atlas Obscura "Maradona altar, Naples"; Destination Calcio "Napoli bar offers hair of the god"; Goal.com "Diego Maradona: Naples' patron saint and champion"; AP "For Napoli fans the team is a religion and Maradona is god".
- Caveats: the owner's name varies between reports; one report says the displayed hair is a replica and the real one is kept at home; one source dates the flight to 1986.

## What is invented (dramatization)
- The barman "Gennaro", his empty café, the flies, his shyness on the plane, the wallet, his wife's line, the old lady and the queue are our own story beats. The real owner is not named or depicted.

## Voice-over (English, one steady voice)
1. A barman in Naples made his empty café famous all over the world, with one hair he picked off an airplane seat.
2. His name is Gennaro, and his café is so quiet that even the flies have stopped coming in.
3. One night he's flying home from Milan, and the man asleep in the seat in front of him is Diego Maradona.
4. In Naples, that's like sitting behind a saint.
5. Gennaro is far too shy to say hello. So for two hours, he just stares at the back of that famous, curly head.
6. The plane lands. Maradona walks off. And there, on the headrest, lies one single black hair.
7. Gennaro looks left. He looks right. And he slips it into his wallet.
8. Back at the café, he puts it in a little golden frame, with candles and flowers.
9. His wife says: Gennaro, it's a hair.
10. But the next morning, an old lady walks in, and kneels in front of it. By lunchtime, the queue goes around the block.
11. Wait. Why would a whole city pray to a hair?
12. You see, before Maradona, Naples had never won the league. Not once. With him, they won it twice.
13. To them, he wasn't a footballer. He was a miracle. And every miracle needs a relic.
14. More than thirty years later, the hair is still on that wall.
15. And if you want a photo, there's only one rule. First, you buy a coffee.

## Structure (reference formula)
Hook as a paradox (1) · setting with a named everyman (2) · escalation (3-9) · mystery beat "Wait..." (11) · "You see," mechanism (12-13) · ironic payoff that calls back to the empty café (14-15).

## Build
- `src/h/`: story.ts (20 shots, cameras, lights), world.ts (staging), sets.ts + paint2.ts (café, alley, cabin), toon.ts `figure()` + cast.ts (characters), props.ts.
- `node tools/charsheet.mjs out.jpg tools/s1.json 0.5` previews characters in 2 s; `node tools/texsheet.mjs out.jpg cafeBack 0.5` previews a painted texture.
- `node stills.mjs out/h/x_ 80,420 0.5` renders test stills; `bash render_h.sh` renders the film in chunks.
