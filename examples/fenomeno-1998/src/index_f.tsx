import React from "react";
import { Composition, registerRoot } from "remotion";
import { FenomenoShort, MAD_FRAMES } from "./f/Main";
const Root: React.FC = () => <Composition id="FenomenoShort" component={FenomenoShort} durationInFrames={MAD_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Root);
