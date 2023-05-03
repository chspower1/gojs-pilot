import Blockly from "blockly";
import { useEffect, useState, useRef } from "react";
import { javascriptGenerator } from "blockly/javascript";
import { initBlockly } from "../utils/initBlockly";
function MyBlocklyComponent() {
  const toolbox = {
    kind: "flyoutToolbox",
    contents: [
      {
        kind: "block",
        type: "path",
        id: "ppp",
      },
    ],
  };
  const blockDiv = useRef();

  useEffect(() => {
    initBlockly(blockDiv);
  }, []);

  return (
    <>
      <div id="blocklyDiv" ref={blockDiv} style={{ width: "1400px", height: "400px" }} />
    </>
  );
}
export default MyBlocklyComponent;
