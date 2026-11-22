import React from "react";
import { Composition, registerRoot } from "remotion";
import { MarathonShort, MAD_FRAMES } from "./o/Main";
const Root: React.FC = () => <Composition id="MarathonShort" component={MarathonShort} durationInFrames={MAD_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Root);
