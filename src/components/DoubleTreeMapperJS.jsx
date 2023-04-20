import * as go from "gojs";
import { ReactDiagram } from "gojs-react";
import { useState, useEffect } from "react";
import checkLink from "../utils/checkLink";
import makeGroupLayout from "../utils/makeGroupLayout";
import longTarget from "../data/target_long.json";
import { makeTree } from "../makeTree";

// Constant
let ROUTINGSTYLE = "ToNode";

// Class
class TreeNode extends go.Node {
  findVisibleNode() {
    // redirect links to lowest visible "ancestor" in the tree
    var n = this;
    while (n !== null && !n.isVisible()) {
      n = n.findTreeParentNode();
    }
    return n;
  }
}

// function
function handleTreeCollapseExpand(e) {
  e.subject.each((n) => {
    n.findExternalTreeLinksConnected().each((l) => l.invalidateRoute());
  });
}

const initDiagram = () => {
  const $ = go.GraphObject.make;
  const diagram = $(go.Diagram, {
    "commandHandler.copiesTree": true,
    "commandHandler.deletesTree": true,
    TreeCollapsed: handleTreeCollapseExpand,
    TreeExpanded: handleTreeCollapseExpand,
    // newly drawn links always map a node in one tree to a node in another tree
    "linkingTool.archetypeLinkData": { category: "Mapping" },
    "linkingTool.linkValidation": checkLink,
    "relinkingTool.linkValidation": checkLink,
    "undoManager.isEnabled": true,
    LayoutCompleted: (e) => {
      e.diagram.nodes.each((node) => {
        const table = node.findObject("TABLE");
        console.log(table);
      });
    },
  });

  // 애니메이션 제거 속성
  diagram.animationManager.canStart = () => {
    return false;
  };
  diagram.nodeTemplate = $(
    TreeNode,
    "Horizontal",

    {
      movable: false,
      copyable: false,
      deletable: false,
      selectionAdorned: false,
      background: "white",
      mouseEnter: (e, node) => (node.background = "#d3ebf5"),
      //@ts-ignore
      mouseLeave: (e, node) => (node.background = node.isSelected ? "#d3ebf5" : "white"),
      click: (e, node) => {
        console.log(node.findBindingPanel()?.data);
      },
      // mouseLeave: (e, node) => (node.background = "white"),
    },
    new go.Binding("background", "isSelected", (s) => (s ? "#d3ebf5" : "white")).ofObject(),
    new go.Binding("fromLinkable", "group", (k) => k === "source"),
    new go.Binding("toLinkable", "group", (k) => k === "target"),

    $(
      "TreeExpanderButton", // support expanding/collapsing subtrees
      {
        width: 24,
        height: 24,
        "ButtonIcon.stroke": "white",
        "ButtonIcon.strokeWidth": 2,
        "ButtonBorder.fill": "#83C3D8",
        "ButtonBorder.stroke": null,
        "ButtonBorder.figure": "RoundedRectangle",
        _buttonFillOver: "#5b90a1",
        _buttonStrokeOver: null,
        _buttonFillPressed: null,
        // margin: 10,
      }
    ),

    $(
      go.Panel,
      "Auto",
      { position: new go.Point(16, 0) },
      $(go.Shape, "RoundedRectangle", {
        fill: "transparent",
        width: 200,
        height: 40,
        stroke: "gray",
      }),

      $(
        go.Picture,
        {
          source: `${process.env.PUBLIC_URL}/copy.png`,
          width: 30,
          height: 30,
          alignment: go.Spot.Left,
          margin: 10,
        },
        new go.Binding("source", "type", (type) => `${process.env.PUBLIC_URL}/${type}.png`)
      ),
      $(go.TextBlock, { alignment: go.Spot.Center }, new go.Binding("text", "name"))
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
      $(go.Shape, { stroke: "teal", strokeWidth: 2 })
    )
  );

  diagram.groupTemplate = $(
    go.Group,
    "Auto",
    {
      layout: makeGroupLayout($),

      // autoScrollRegion: new go.Rect(0, 0, 50, 50),
      // // 스크롤이 적용되는 마진 설정
      // scrollMargin: new go.Margin(50, 50, 50, 50),
    },
    new go.Binding("position", "xy", go.Point.parse).makeTwoWay(go.Point.stringify),
    new go.Binding("layout", "width", makeGroupLayout),

    $(go.Shape, { fill: "white", stroke: "gray" }),
    $(
      go.Panel,
      "Auto",
      { defaultAlignment: go.Spot.Left },
      $(
        go.TextBlock,
        { font: "bold 14pt sans-serif", margin: new go.Margin(5, 5, 0, 5), row: 0, column: 0 },
        new go.Binding("text", "key")
      ),
      $(go.Placeholder, { padding: 100 })
    )
  );

  diagram.model = new go.GraphLinksModel({
    linkKeyProperty: "key",
  });

  return diagram;
};
const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //최댓값은 제외, 최솟값은 포함
};
const defaultLinkDataArray = [
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
const DoubleTreeMapper = () => {
  const [sourceDataArray, setSourceDataArray] = useState([
    { key: "source", isGroup: true, name: "source", xy: "0 0", width: 400 },
    { key: "source_0", name: "Employee", type: "copy", group: "source" },
    { key: "source_1", name: "id", type: "string", group: "source" },
    { key: "source_2", name: "name", type: "string", group: "source" },
    { key: "source_3", name: "salary", type: "string", group: "source" },
    { key: "source_4", name: "department", group: "source" },
    { key: "source_5", name: "id", group: "source" },
    { key: "source_6", name: "name", group: "source" },
    { key: "source_7", name: "department", group: "source" },
    { key: "source_8", name: "id", group: "source" },
    { key: "source_9", name: "name", group: "source" },
    { key: "source_10", name: "departments", group: "source" },
    { key: "source_11", name: "id", group: "source" },
    { key: "source_12", name: "name", group: "source" },
    { key: "source_13", name: "hobbies", group: "source" },
    { key: "source_14", name: "ignored", group: "source" },
    { key: "source_15", name: "Enum", group: "source" },
    { key: "source_16", name: "department", group: "source" },
    { key: "source_17", name: "id", group: "source" },
    { key: "source_18", name: "name", group: "source" },
    { key: "source_19", name: "hobby", group: "source" },
  ]);
  const [targetDataArray, setTargetDataArray] = useState([
    { key: "target", isGroup: true, name: "target", xy: "650 0", width: 10 },
    { key: "target_0", name: "Employee", group: "target" },
    { key: "target_1", name: "id", group: "target" },
    { key: "target_2", name: "name", group: "target" },
    { key: "target_3", name: "salary", group: "target" },
    { key: "target_4", name: "department", group: "target" },
    { key: "target_5", name: "id", group: "target" },
    { key: "target_6", name: "name", group: "target" },
    { key: "target_7", name: "department", group: "target" },
    { key: "target_8", name: "id", group: "target" },
    { key: "target_9", name: "name", group: "target" },
    { key: "target_10", name: "departments", group: "target" },
    { key: "target_11", name: "id", group: "target" },
    { key: "target_12", name: "name", group: "target" },
    { key: "target_13", name: "hobbies", group: "target" },
    { key: "target_14", name: "ignored", group: "target" },
    { key: "target_15", name: "Enum", group: "target" },
    { key: "target_16", name: "department", group: "target" },
    { key: "target_17", name: "id", group: "target" },
    { key: "target_18", name: "name", group: "target" },
    { key: "target_19", name: "hobby", group: "target" },
  ]);
  const [nodeDataArray, setNodeDataArray] = useState([...sourceDataArray, ...targetDataArray]);
  const [linkDataArray, setLinkDataArray] = useState(defaultLinkDataArray);
  const [isChanged, setIsChanged] = useState(false);
  const onModelChange = (event) => {
    console.log(event);
  };

  const handleClickAddTarget = () => {
    const newNodeKey = parseInt(targetDataArray[targetDataArray.length - 1].key.split("_")[1]);
    const newNode = {
      key: `target_${newNodeKey + 1}`,
      name: `newNode${newNodeKey + 1}`,
      group: "target",
    };
    setTargetDataArray([...targetDataArray, newNode]);
  };
  const handleClickAddSource = () => {
    const newNodeKey = parseInt(sourceDataArray[sourceDataArray.length - 1].key.split("_")[1]);
    const newNode = {
      key: `source_${newNodeKey + 1}`,
      name: `newNode${newNodeKey + 1}`,
      group: "source",
    };
    setSourceDataArray([...sourceDataArray, newNode]);
  };

  const handleClickAddLink = () => {
    const sourceRandomNum = getRandomInt(1, sourceDataArray.length);
    const targetRandomNum = getRandomInt(1, targetDataArray.length);
    const newLinkData = {
      key: `link_${linkDataArray.length}`,
      from: `source_${sourceRandomNum}`,
      to: `target_${targetRandomNum}`,
      category: "Mapping",
    };
    setLinkDataArray([...linkDataArray, newLinkData]);
    console.log(sourceRandomNum, targetRandomNum);
  };
  const handleClickChangeData = () => {
    setIsChanged(!isChanged);
    setLinkDataArray(defaultLinkDataArray);
    if (isChanged) {
      setNodeDataArray([...sourceDataArray, ...targetDataArray]);
    } else {
      const newNodeDataArray = [
        { key: "source", isGroup: true, name: "source", xy: "0 0", width: 400 },
        { key: "target", isGroup: true, name: "target", xy: "650 0", width: 10 },
      ];
      const newLinkDataArray = [];
      makeTree({
        sourceTreeData: longTarget.sourceTreeData,
        nodeDataArray: newNodeDataArray,
        linkDataArray: newLinkDataArray,
        groupKey: "source",
      });
      makeTree({
        sourceTreeData: longTarget.sourceTreeData,
        nodeDataArray: newNodeDataArray,
        linkDataArray: newLinkDataArray,
        groupKey: "target",
      });

      console.log(newNodeDataArray);
      console.log(newLinkDataArray);
      setNodeDataArray(newNodeDataArray);
      setLinkDataArray(newLinkDataArray);
      // setLinkDataArray([]);
    }
  };
  useEffect(() => {
    setNodeDataArray([...sourceDataArray, ...targetDataArray]);
  }, [sourceDataArray, targetDataArray]);
  return (
    <>
      <ReactDiagram
        initDiagram={initDiagram}
        divClassName="diagram-component"
        nodeDataArray={nodeDataArray}
        linkDataArray={linkDataArray}
        onModelChange={onModelChange}
      />

      <button onClick={handleClickAddSource}>source 추가</button>
      <button onClick={handleClickAddTarget}>target 추가</button>
      <button onClick={handleClickAddLink}>random link 추가</button>
      <button onClick={handleClickChangeData}>
        {!isChanged ? "새로운 데이터로 교체" : "원래로 복구"}
      </button>
    </>
  );
};

export default DoubleTreeMapper;
