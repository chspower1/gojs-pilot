import * as go from "gojs";
import { ReactDiagram } from "gojs-react";
import { useEffect } from "react";
import checkLink from "../utils/checkLink";
import makeGroupLayout from "../utils/makeGroupLayout";
class TreeNode extends go.Node {
  constructor() {
    super();
    this.treeExpandedChanged = (node) => {
      if (node.containingGroup !== null) {
        node.containingGroup.findExternalLinksConnected().each((l) => l.invalidateRoute());
      }
    };
  }
}
const initDiagram = () => {
  const $ = go.GraphObject.make;
  const diagram = $(go.Diagram, {
    "commandHandler.copiesTree": true,
    "commandHandler.deletesTree": true,
    // newly drawn links always map a node in one tree to a node in another tree
    "linkingTool.archetypeLinkData": { category: "Mapping" },
    "linkingTool.linkValidation": checkLink,
    "relinkingTool.linkValidation": checkLink,
    "undoManager.isEnabled": true,
  });

  diagram.nodeTemplate = $(
    TreeNode,
    {
      movable: false,
      copyable: false,
      deletable: false,
      selectionAdorned: false,
      background: "white",
      mouseEnter: (e, node) => (node.background = "aquamarine"),
      mouseLeave: (e, node) => (node.background = "white"),
    },
    new go.Binding("background", "isSelected", (s) => (s ? "skyblue" : "white")).ofObject(),
    new go.Binding("fromLinkable", "group", (k) => k === "source"),
    new go.Binding("toLinkable", "group", (k) => k === "target"),
    $(
      "TreeExpanderButton", // support expanding/collapsing subtrees
      {
        width: 14,
        height: 14,
        "ButtonIcon.stroke": "white",
        "ButtonIcon.strokeWidth": 2,
        "ButtonBorder.fill": "goldenrod",
        "ButtonBorder.stroke": null,
        "ButtonBorder.figure": "Rectangle",
        _buttonFillOver: "darkgoldenrod",
        _buttonStrokeOver: null,
        _buttonFillPressed: null,
      }
    ),
    $(
      go.Panel,
      "Horizontal",
      { position: new go.Point(16, 0) },

      $(go.TextBlock, new go.Binding("text", "name"))
    )
  );

  diagram.linkTemplate = $(
    go.Link,
    {
      selectable: false,
      routing: go.Link.Orthogonal,
      fromEndSegmentLength: 4,
      toEndSegmentLength: 4,
      fromSpot: new go.Spot(0.001, 1, 7, 0),
      toSpot: go.Spot.Left,
    },
    $(go.Shape, { stroke: "lightgray" })
  );

  diagram.linkTemplateMap.add(
    "Mapping",
    $(
      go.Link,
      { isTreeLink: false, isLayoutPositioned: false, layerName: "Foreground" },
      { fromSpot: go.Spot.Right, toSpot: go.Spot.Left },
      { relinkableFrom: true, relinkableTo: true },
      $(go.Shape, { stroke: "blue", strokeWidth: 2 })
    )
  );

  diagram.groupTemplate = $(
    go.Group,
    "Auto",
    { deletable: false, layout: makeGroupLayout($) },
    new go.Binding("position", "xy", go.Point.parse).makeTwoWay(go.Point.stringify),
    new go.Binding("layout", "width", makeGroupLayout),
    $(go.Shape, { fill: "white", stroke: "lightgray" }),
    $(
      go.Panel,
      "Vertical",
      { defaultAlignment: go.Spot.Left },
      $(
        go.TextBlock,
        { font: "bold 14pt sans-serif", margin: new go.Margin(5, 5, 0, 5) },
        new go.Binding("text")
      ),
      $(go.Placeholder, { padding: 5 })
    )
  );
  diagram.model = new go.GraphLinksModel({
    linkKeyProperty: "key",
  });
  return diagram;
};

const Test = () => {
  const nodeDataArray: go.ObjectData[] = [
    { key: "source", isGroup: true, name: "source", xy: "0 0", width: 200 },
    { key: "source_0", name: "Employee", parent: "null", group: "source" },
    { key: "source_1", name: "id", parent: "0", group: "source" },
    { key: "source_2", name: "name", parent: "0", group: "source" },
    { key: "source_3", name: "salary", parent: "0", group: "source" },
    { key: "source_4", name: "department", parent: "0", group: "source" },
    { key: "source_5", name: "id", parent: "4", group: "source" },
    { key: "source_6", name: "name", parent: "4", group: "source" },
    { key: "source_7", name: "department", parent: "0", group: "source" },
    { key: "source_8", name: "id", parent: "7", group: "source" },
    { key: "source_9", name: "name", parent: "7", group: "source" },
    { key: "source_10", name: "departments", parent: "0", group: "source" },
    { key: "source_11", name: "id", parent: "10", group: "source" },
    { key: "source_12", name: "name", parent: "10", group: "source" },
    { key: "source_13", name: "hobbies", parent: "0", group: "source" },
    { key: "source_14", name: "ignored", parent: "0", group: "source" },
    { key: "source_15", name: "Enum", parent: "0", group: "source" },
    { key: "source_16", name: "department", parent: "15", group: "source" },
    { key: "source_17", name: "id", parent: "16", group: "source" },
    { key: "source_18", name: "name", parent: "16", group: "source" },
    { key: "source_19", name: "hobby", parent: "15", group: "source" },
    { key: "target", isGroup: true, name: "target", xy: "300 0", width: 10 },
    { key: "target_0", name: "Employee", parent: "null", group: "target" },
    { key: "target_1", name: "id", parent: "0", group: "target" },
    { key: "target_2", name: "name", parent: "0", group: "target" },
    { key: "target_3", name: "salary", parent: "0", group: "target" },
    { key: "target_4", name: "department", parent: "0", group: "target" },
    { key: "target_5", name: "id", parent: "4", group: "target" },
    { key: "target_6", name: "name", parent: "4", group: "target" },
    { key: "target_7", name: "department", parent: "0", group: "target" },
    { key: "target_8", name: "id", parent: "7", group: "target" },
    { key: "target_9", name: "name", parent: "7", group: "target" },
    { key: "target_10", name: "departments", parent: "0", group: "target" },
    { key: "target_11", name: "id", parent: "10", group: "target" },
    { key: "target_12", name: "name", parent: "10", group: "target" },
    { key: "target_13", name: "hobbies", parent: "0", group: "target" },
    { key: "target_14", name: "ignored", parent: "0", group: "target" },
    { key: "target_15", name: "Enum", parent: "0", group: "target" },
    { key: "target_16", name: "department", parent: "15", group: "target" },
    { key: "target_17", name: "id", parent: "16", group: "target" },
    { key: "target_18", name: "name", parent: "16", group: "target" },
    { key: "target_19", name: "hobby", parent: "15", group: "target" },
  ];
  const linkDataArray: go.ObjectData[] = [
    { key: "link_0", from: "source_0", to: "source_1" },
    { key: "link_1", from: "source_0", to: "source_2" },
    { key: "link_2", from: "source_0", to: "source_3" },
    { key: "link_3", from: "source_0", to: "source_4" },
    { key: "link_4", from: "source_4", to: "source_5" },
    { key: "link_5", from: "source_4", to: "source_6" },
    { key: "link_6", from: "source_0", to: "source_7" },
    { key: "link_7", from: "source_7", to: "source_8" },
    { key: "link_8", from: "source_7", to: "source_9" },
    { key: "link_9", from: "source_0", to: "source_10" },
    { key: "link_10", from: "source_10", to: "source_11" },
    { key: "link_11", from: "source_10", to: "source_12" },
    { key: "link_12", from: "source_0", to: "source_13" },
    { key: "link_13", from: "source_0", to: "source_14" },
    { key: "link_14", from: "source_0", to: "source_15" },
    { key: "link_15", from: "source_15", to: "source_16" },
    { key: "link_16", from: "source_16", to: "source_17" },
    { key: "link_17", from: "source_16", to: "source_18" },
    { key: "link_18", from: "source_15", to: "source_19" },
    { key: "link_19", from: "target_0", to: "target_1" },
    { key: "link_20", from: "target_0", to: "target_2" },
    { key: "link_21", from: "target_0", to: "target_3" },
    { key: "link_22", from: "target_0", to: "target_4" },
    { key: "link_23", from: "target_4", to: "target_5" },
    { key: "link_24", from: "target_4", to: "target_6" },
    { key: "link_25", from: "target_0", to: "target_7" },
    { key: "link_26", from: "target_7", to: "target_8" },
    { key: "link_27", from: "target_7", to: "target_9" },
    { key: "link_28", from: "target_0", to: "target_10" },
    { key: "link_29", from: "target_10", to: "target_11" },
    { key: "link_30", from: "target_10", to: "target_12" },
    { key: "link_31", from: "target_0", to: "target_13" },
    { key: "link_32", from: "target_0", to: "target_14" },
    { key: "link_33", from: "target_0", to: "target_15" },
    { key: "link_34", from: "target_15", to: "target_16" },
    { key: "link_35", from: "target_16", to: "target_17" },
    { key: "link_36", from: "target_16", to: "target_18" },
    { key: "link_37", from: "target_15", to: "target_19" },
  ];
  const onModelChange = (event: go.IncrementalData) => {
    console.log(event);
  };
  return (
    <ReactDiagram
      initDiagram={initDiagram}
      divClassName="diagram-component"
      nodeDataArray={nodeDataArray}
      linkDataArray={linkDataArray}
      onModelChange={onModelChange}
    />
  );
};

export default Test;
