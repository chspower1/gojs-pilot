import * as go from "gojs";
import { ReactDiagram } from "gojs-react";

const SingleTree = () => {
  const init = () => {
    const $ = go.GraphObject.make;
    const diagram = $(go.Diagram, { "undoManager.isEnabled": true, model: new go.TreeModel() });

    diagram.nodeTemplate = $(
      go.Node,
      {
        movable: false,
        selectionAdorned: false,
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
        go.Panel,
        "Horizontal",
        { position: new go.Point(18, 0) },
        new go.Binding("background", "isSelected", (s) => (s ? "lightblue" : "white")).ofObject(),

        $(go.TextBlock, { font: "9pt Verdana, sans-serif" }, new go.Binding("text", "name"))
      )
    );
    diagram.linkTemplate = $(go.Link);
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
    return diagram;
  };
  const nodeDataArray = [
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
  ];
  return (
    <ReactDiagram
      initDiagram={init}
      divClassName="diagram-component"
      nodeDataArray={nodeDataArray}
      style={{ width: "500px", height: "500px" }}
    />
  );
};

export default SingleTree;
