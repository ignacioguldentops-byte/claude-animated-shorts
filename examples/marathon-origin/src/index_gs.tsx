import React from "react";
import { Composition, registerRoot } from "remotion";
import { Sheet } from "./g/Sheet";
const Root: React.FC = () => <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} />;
registerRoot(Root);
