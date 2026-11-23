import React from "react";
import { Composition, registerRoot } from "remotion";
import { PicklesShort, MAD_FRAMES } from "./w/Main";
const Root: React.FC = () => <Composition id="PicklesShort" component={PicklesShort} durationInFrames={MAD_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Root);
