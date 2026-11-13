import React from "react";
import { Composition, registerRoot } from "remotion";
import { MaradonaShort, MARADONA_FRAMES } from "./m/Main";
const Root: React.FC = () => <Composition id="MaradonaShort" component={MaradonaShort} durationInFrames={MARADONA_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Root);
