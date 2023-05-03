import Blockly from "blockly";
Blockly.Blocks["path"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("source")
      .appendField(new Blockly.FieldTextInput(""), "source_input");

    this.appendDummyInput()
      .setAlign(Blockly.ALIGN_RIGHT)
      .appendField("target")
      .appendField(new Blockly.FieldTextInput(""), "target_input");

    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(230);
    this.setTooltip("");
    this.setHelpUrl("");

    // 각 입력 필드의 ID 값 설정
    this.getField("source_input").id_ = "my_source_input";
    this.getField("target_input").id_ = "my_target_input";
  },
};
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
export const initBlockly = (blockDiv: React.MutableRefObject<null>) => {
  const onFirstComment = (event: any) => {
    // console.log(event);
    if (
      event.type === Blockly.Events.BLOCK_CHANGE &&
      event.element === "comment" &&
      !event.oldValue &&
      event.newValue
    ) {
      console.log("false");
      alert("Congratulations on creating your first comment!");
      workspace.removeChangeListener(onFirstComment);
    }
  };
  const workspace = Blockly.inject(blockDiv?.current!, { toolbox });
  workspace.addChangeListener(onFirstComment);
};
