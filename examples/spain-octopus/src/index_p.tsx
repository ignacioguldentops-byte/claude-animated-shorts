import React from "react";
import { Composition, registerRoot } from "remotion";
import { PulpoShort, PULPO_FRAMES } from "./p/Main";
const Root: React.FC = () => <Composition id="PulpoShort" component={PulpoShort} durationInFrames={PULPO_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Root);
