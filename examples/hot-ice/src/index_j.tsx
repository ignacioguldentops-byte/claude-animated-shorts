import React from "react";
import { Composition, registerRoot } from "remotion";
import { HieloShort, HIELO_FRAMES } from "./j/Main";
const Root: React.FC = () => <Composition id="HieloShort" component={HieloShort} durationInFrames={HIELO_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Root);
