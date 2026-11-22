// Layout of "Media carrera en coche" (the 1904 Olympic marathon): one continuous world, so the camera can fly from
// place to place without cuts. The stadium of 1904 sits at the origin; the dirt road leaves its east gate and runs
// east through the farmland. Everything that places things on the road reads these.
export const GATE_X = 80, ROAD_W = 7;
/** centre line of the dirt road (z for a given x, x >= GATE_X) */
export const roadZ = (x: number) => -26 + 12 * Math.sin(Math.max(0, x - GATE_X) / 60) * Math.min(1, Math.max(0, x - GATE_X) / 30);
/** unit direction of travel along the road towards +x at x */
export const roadDir = (x: number): [number, number] => { const d = roadZ(x + 0.5) - roadZ(x - 0.5), l = Math.hypot(1, d); return [1 / l, d / l]; };
/** a point `off` metres to the side of the road centre (+ = south, towards +z) at x */
export const onRoad = (x: number, off = 0, y = 0): [number, number, number] => { const [dx, dz] = roadDir(x); return [x - dz * off, y, roadZ(x) + dx * off]; };
/** the track: straights along x at |z| 22..30, half-length 45, curves of radius 22..30 round x = +-45 */
export const TR = { L: 45, r0: 22, r1: 30 };
export const FINISH_X = -10;            // finish line across the north straight (z -30 .. -22)
export const LANE = (k: number) => -(TR.r0 + 1 + k * 1.2); // z of lane k on the north straight
/** places in the country (x along the road) */
export const P = { orchard: 118, breakdown: 175, well: 232, cartero: 285, dogs: 318, quit: 350, farmX: 420, farmZ: -105 };
/** fields: wheat south of the road (x 150..700), corn north (x 240..420); orchard south (x 100..140) */
export const WHEAT_GLSL = `( step( 150.0, wp.x ) * smoothstep( 4.5, 6.0, wp.y - ( -26.0 + 12.0 * sin( ( wp.x - 80.0 ) / 60.0 ) ) ) * ( 1.0 - smoothstep( 80.0, 82.0, wp.y + 26.0 ) ) )`;
export const CORN_GLSL = `( step( 240.0, wp.x ) * ( 1.0 - step( 420.0, wp.x ) ) * smoothstep( 5.0, 6.0, ( -26.0 + 12.0 * sin( ( wp.x - 80.0 ) / 60.0 ) ) - wp.y ) * ( 1.0 - smoothstep( 70.0, 72.0, -26.0 - wp.y ) ) )`;
