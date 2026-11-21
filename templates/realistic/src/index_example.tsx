import React from "react";
import { Composition, registerRoot } from "remotion";
import { MadridQ, MAD_FRAMES } from "./q/Main";
const Root: React.FC = () => <Composition id="MadridQ" component={MadridQ} durationInFrames={MAD_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Root);
