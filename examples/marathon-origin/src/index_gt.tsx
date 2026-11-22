import React from "react";
import { Composition, registerRoot } from "remotion";
import { TreeLab } from "./g/TreeLab";
const Root: React.FC = () => <Composition id="TreeLab" component={TreeLab} durationInFrames={1} fps={30} width={1080} height={1920} />;
registerRoot(Root);
