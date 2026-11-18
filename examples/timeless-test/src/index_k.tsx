import React from "react";
import { Composition, registerRoot } from "remotion";
import { CricketShort, CRI_FRAMES } from "./k/Main";
const Root: React.FC = () => <Composition id="CricketShort" component={CricketShort} durationInFrames={CRI_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Root);
