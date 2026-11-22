import React from "react";
import { Composition, registerRoot } from "remotion";
import { OriginShort, MAD_FRAMES } from "./g/Main";
const Root: React.FC = () => <Composition id="OriginShort" component={OriginShort} durationInFrames={MAD_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Root);
