import React from "react";
import { Composition, registerRoot } from "remotion";
import { DorandoShort, MAD_FRAMES } from "./d/Main";
const Root: React.FC = () => <Composition id="DorandoShort" component={DorandoShort} durationInFrames={MAD_FRAMES} fps={15} width={1080} height={1920} />;
registerRoot(Root);
