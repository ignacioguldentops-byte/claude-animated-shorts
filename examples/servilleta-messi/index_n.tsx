import React from "react";
import { Composition, registerRoot } from "remotion";
import { ServilletaShort, SERV_FRAMES } from "./n/Main";
const Root: React.FC = () => <Composition id="ServilletaShort" component={ServilletaShort} durationInFrames={SERV_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Root);
