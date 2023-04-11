// App.js
import React, { useEffect, useState } from "react";
import sourceData from "../data/source.json";
import targetData from "../data/target.json";
import * as go from "gojs";
import { ReactDiagram } from "gojs-react";
import { makeTree } from "../makeTree";

function checkLink(fn: any, fp: any, tn: any, tp: any, link: any) {
  // make sure the nodes are inside different Groups
  if (fn.containingGroup === null || fn.containingGroup.data.key !== -1) return false;
  if (tn.containingGroup === null || tn.containingGroup.data.key !== -2) return false;
  //// optional limit to a single mapping link per node
  //if (fn.linksConnected.any(l => l.category === "Mapping")) return false;
  //if (tn.linksConnected.any(l => l.category === "Mapping")) return false;
  return true;
}

function initDiagram() {
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
    //   const n = this;
    //   let m;
    //   while (n !== null && !n.isVisible()) {
    //     m = n.findTreeParentNode();
    //   }
    //   if (m === undefined) return null;
    //   return m;
    // }
  }
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
    $(go.Shape, { stroke: "lightgray" }),
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
        nodeSpacing: 0,
        setsPortSpot: false,
        setsChildPortSpot: false,
      }
    );
  }

  return diagram;
}

// render function...
export default function Test() {
  return (
    <ReactDiagram
      initDiagram={initDiagram}
      divClassName="diagram-component"
      nodeDataArray={[
        { key: -1, isGroup: true, name: "source", xy: "0 0", width: 200 },
        { key: "0", name: "Employee", parent: "null", group: -1 },
        { key: "1", name: "id", parent: "0", group: -1 },
        { key: "2", name: "name", parent: "0", group: -1 },
        { key: "3", name: "salary", parent: "0", group: -1 },
        { key: "4", name: "department", parent: "0", group: -1 },
        { key: "5", name: "id", parent: "4", group: -1 },
        { key: "6", name: "name", parent: "4", group: -1 },
        { key: "7", name: "department", parent: "0", group: -1 },
        { key: "8", name: "id", parent: "7", group: -1 },
        { key: "9", name: "name", parent: "7", group: -1 },
        { key: "10", name: "departments", parent: "0", group: -1 },
        { key: "11", name: "id", parent: "10", group: -1 },
        { key: "12", name: "name", parent: "10", group: -1 },
        { key: "13", name: "hobbies", parent: "0", group: -1 },
        { key: "14", name: "ignored", parent: "0", group: -1 },
        { key: "15", name: "Enum", parent: "0", group: -1 },
        { key: "16", name: "department", parent: "15", group: -1 },
        { key: "17", name: "id", parent: "16", group: -1 },
        { key: "18", name: "name", parent: "16", group: -1 },
        { key: "19", name: "hobby", parent: "15", group: -1 },
        { key: -2, isGroup: true, name: "target", xy: "300 0", width: 150 },
        { key: "--0", name: "Employee", parent: "null", group: -2 },
        { key: "--1", name: "id", parent: "--0", group: -2 },
        { key: "--2", name: "name", parent: "--0", group: -2 },
        { key: "--3", name: "salary", parent: "--0", group: -2 },
        { key: "--4", name: "department", parent: "--0", group: -2 },
        { key: "--5", name: "id", parent: "--4", group: -2 },
        { key: "--6", name: "name", parent: "--4", group: -2 },
        { key: "--7", name: "department", parent: "--0", group: -2 },
        { key: "--8", name: "id", parent: "--7", group: -2 },
        { key: "--9", name: "name", parent: "--7", group: -2 },
        { key: "--10", name: "departments", parent: "--0", group: -2 },
        { key: "--11", name: "id", parent: "--10", group: -2 },
        { key: "--12", name: "name", parent: "--10", group: -2 },
        { key: "--13", name: "hobbies", parent: "--0", group: -2 },
        { key: "--14", name: "ignored", parent: "--0", group: -2 },
        { key: "--15", name: "Enum", parent: "--0", group: -2 },
        { key: "--16", name: "department", parent: "--15", group: -2 },
        { key: "--17", name: "id", parent: "--16", group: -2 },
        { key: "--18", name: "name", parent: "--16", group: -2 },
        { key: "--19", name: "hobby", parent: "--15", group: -2 },
      ]}
      style={{ width: "1000px", height: "1000px" }}
    />
  );
}
