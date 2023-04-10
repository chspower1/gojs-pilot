// App.js
import React, { useEffect, useState } from "react";
import sourceData from "./data/source.json";
import targetData from "./data/target.json";
import * as go from "gojs";
import { ReactDiagram } from "gojs-react";
import "./App.css";
import { makeTree } from "./makeTree";
function initDiagram() {
  const $ = go.GraphObject.make;

  const diagram = $(go.Diagram, {
    "undoManager.isEnabled": true, // must be set to allow for model change listening
    allowMove: false,
    allowCopy: false,
    allowDelete: false,
    allowHorizontalScroll: false,
    model: new go.TreeModel(),
  });
  diagram.layout = $(go.TreeLayout, {
    alignment: go.TreeLayout.AlignmentStart,
    angle: 0,
    compaction: go.TreeLayout.CompactionNone,
    layerSpacing: 16,
    layerSpacingParentOverlap: 1,
    nodeIndentPastParent: 1.0,
    nodeSpacing: 0,
    setsPortSpot: false,
    setsChildPortSpot: false,
  });
  diagram.nodeTemplate = $(
    go.Node,
    "Horizontal",
    {
      movable: false,
      // selectionAdorned: false,
    },
    $("TreeExpanderButton", {
      // customize the button's appearance
      _treeExpandedFigure: "LineDown",
      _treeCollapsedFigure: "LineRight",
      "ButtonBorder.fill": "whitesmoke",
      "ButtonBorder.stroke": null,
      _buttonFillOver: "rgba(0,128,255,0.25)",
      _buttonStrokeOver: null,
    }),
    $(
      go.TextBlock,
      {
        alignment: go.Spot.Center,
      },
      new go.Binding("text", "name")
    )
  );
  diagram.linkTemplate = $(go.Link);
  return diagram;
}

// render function...
export default function App() {
  const [nodeDataArray, setNodeDataArray] = useState<go.ObjectData[]>([]);
  useEffect(() => {
    const goJsNodes: go.ObjectData[] = [];
    makeTree({
      sourceTreeData: sourceData.sourceTreeData,
      parentKey: "123",
      goJsNodes,
    });
    console.log(goJsNodes);
    setNodeDataArray(goJsNodes);
  }, []);

  return (
    <div>
      <ReactDiagram
        initDiagram={initDiagram}
        divClassName="diagram-component"
        nodeDataArray={nodeDataArray}
      />
    </div>
  );
}
