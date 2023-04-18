import * as go from "gojs";
import { ReactDiagram } from "gojs-react";

function checkLink(fn: any, fp: any, tn: any, tp: any, link: any) {
  // make sure the nodes are inside different Groups
  if (fn.containingGroup === null || fn.containingGroup.data.key !== -1) return false;
  if (tn.containingGroup === null || tn.containingGroup.data.key !== -2) return false;
  //// optional limit to a single mapping link per node
  // if (fn.linksConnected.any((l: any) => l.category === "Mapping")) return false;
  if (tn.linksConnected.any((l: any) => l.category === "Mapping")) return false;
  return true;
}
class TreeNode extends go.Node {
  constructor() {
    super();
    this.treeExpandedChanged = (node) => {
      if (node.containingGroup !== null) {
        node.containingGroup.findExternalLinksConnected().each((l) => l.invalidateRoute());
      }
    };
  }

  // findVisibleNode() {
  //   // redirect links to lowest visible "ancestor" in the tree
  //   let n = this;
  //   let m;
  //   while (n !== null && n !== undefined && !n.isVisible()) {
  //     m = n.findTreeParentNode();
  //   }
  //   if (m === undefined) return null;
  //   else return m;
  // }
}
function initDiagram() {
  const $ = go.GraphObject.make;
  const diagram = $(go.Diagram, {
    "commandHandler.copiesTree": true,
    "commandHandler.deletesTree": true,
    "linkingTool.archetypeLinkData": { category: "Mapping" },
    "linkingTool.linkValidation": checkLink,
    "relinkingTool.linkValidation": checkLink,
    "undoManager.isEnabled": true,
    ModelChanged: (e) => {
      console.log(e.model?.toJson());
    },

    model: new go.GraphLinksModel(),
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
    // whether the user can start drawing a link from or to this node depends on which group it's in
    new go.Binding("fromLinkable", "group", (k) => k === -1),
    new go.Binding("toLinkable", "group", (k) => k === -2),
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
      //// optional icon for each tree node
      //$(go.Picture,
      //  { width: 14, height: 14,
      //    margin: new go.Margin(0, 4, 0, 0),
      //    imageStretch: go.GraphObject.Uniform,
      //    source: "images/defaultIcon.png" },
      //  new go.Binding("source", "src")),
      $(go.TextBlock, new go.Binding("text", "name"))
    ) // end Horizontal Panel
  );

  diagram.linkTemplate = $(
    go.Link,
    {
      selectable: false,
      routing: go.Link.Orthogonal,
      fromEndSegmentLength: 1,
      toEndSegmentLength: 1,
      fromSpot: new go.Spot(0.001, 1, 7, 0),
      toSpot: go.Spot.Left,
    },
    $(go.Shape, { stroke: "#512121" }),
    $(go.Shape, { toArrow: "Standard" })
  );

  diagram.linkTemplateMap.add(
    "Mapping",
    $(
      go.Link,
      { isTreeLink: false, isLayoutPositioned: false, layerName: "Foreground" },
      { fromSpot: go.Spot.Right, toSpot: go.Spot.Left },
      { relinkableFrom: true, relinkableTo: true },
      $(go.Shape, { stroke: "blue", strokeWidth: 2 }),
      $(go.Shape, { fill: "blue", toArrow: "Standard", stroke: null, angle: 90 })
    )
  );

  diagram.groupTemplate = $(
    go.Group,
    "Auto",
    { deletable: false, layout: makeGroupLayout() },
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
        new go.Binding("text", "name")
      ),
      $(go.Placeholder, { padding: 5 })
    )
  );

  function makeGroupLayout() {
    return $(
      go.TreeLayout, // taken from samples/treeView.html
      {
        alignment: go.TreeLayout.AlignmentStart,
        angle: 0,
        compaction: go.TreeLayout.CompactionNone,
        layerSpacing: 16,
        layerSpacingParentOverlap: 1,
        nodeIndentPastParent: 1.0,
        nodeSpacing: 100,
        setsPortSpot: false,
        setsChildPortSpot: false,
      }
    );
  }
  console.log(diagram);
  return diagram;
}

// render function...
export default function DoubleTree() {
  return (
    <ReactDiagram
      initDiagram={initDiagram}
      divClassName="diagram-component"
      nodeDataArray={[
        { key: -1, isGroup: true, name: "source", xy: "0 0", width: 200 },
        { key: 10, name: "Employee", parent: "null", group: -1 },
        { key: 11, name: "id", parent: "0", group: -1 },
        { key: 12, name: "name", parent: "0", group: -1 },
        { key: 13, name: "salary", parent: "0", group: -1 },
        { key: 14, name: "department", parent: "0", group: -1 },
        { key: 15, name: "id", parent: "4", group: -1 },
        { key: 16, name: "name", parent: "4", group: -1 },
        { key: 17, name: "department", parent: "0", group: -1 },
        { key: 18, name: "id", parent: "7", group: -1 },
        { key: 19, name: "name", parent: "7", group: -1 },
        { key: 110, name: "departments", parent: "0", group: -1 },
        { key: -2, isGroup: true, name: "target", xy: "300 0", width: 10 },
        { key: -10, name: "Employee", parent: "null", group: -2 },
        { key: -11, name: "id", parent: "--0", group: -2 },
        { key: -12, name: "name", parent: "--0", group: -2 },
        { key: -13, name: "salary", parent: "--0", group: -2 },
        { key: -14, name: "department", parent: "--0", group: -2 },
        { key: -15, name: "id", parent: "--4", group: -2 },
        { key: -16, name: "name", parent: "--4", group: -2 },
        { key: -17, name: "department", parent: "--0", group: -2 },
        { key: -18, name: "id", parent: "--7", group: -2 },
        { key: -19, name: "name", parent: "--7", group: -2 },
        { key: -110, name: "departments", parent: "--0", group: -2 },
      ]}
      linkDataArray={[{ key: 5000, from: 10, to: -10, category: "Mapping" }]}
      style={{ width: "500px", height: "800px" }}
    />
  );
}
