import React from "react";
import { Composition, registerRoot } from "remotion";
import { RevesShort, REVES_FRAMES } from "./a/Main";
const Root: React.FC = () => <Composition id="RevesShort" component={RevesShort} durationInFrames={REVES_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Root);
