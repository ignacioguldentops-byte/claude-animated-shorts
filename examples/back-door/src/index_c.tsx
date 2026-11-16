import React from "react";
import { Composition, registerRoot } from "remotion";
import { PuertaShort, PUERTA_FRAMES } from "./c/Main";
const Root: React.FC = () => <Composition id="PuertaShort" component={PuertaShort} durationInFrames={PUERTA_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Root);
