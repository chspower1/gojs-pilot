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

  const handleClickButton = () => {
    const workspace = Blockly.getMainWorkspace().getAllBlocks();
    console.log("all", workspace);
    console.log("1", workspace[1].id);
    // const newBlock = Blockly.getMainWorkspace().newBlock("path");
    workspace[0].setFieldValue("casdasdasdasdc", "source_input");
  };

  useEffect(() => {
    initBlockly(blockDiv);
  }, []);

  return (
    <>
      <div id="blocklyDiv" ref={blockDiv} style={{ width: "1400px", height: "400px" }} />
      <button style={{ position: "absolute", right: 0, top: "50%" }} onClick={handleClickButton}>
        workspace 보기
      </button>
    </>
  );
}
export default MyBlocklyComponent;
