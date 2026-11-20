import React from "react";
import { Composition, registerRoot } from "remotion";
import { MadridShort, MAD_FRAMES } from "./r/Main";
const Root: React.FC = () => <Composition id="MadridShort" component={MadridShort} durationInFrames={MAD_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Root);
