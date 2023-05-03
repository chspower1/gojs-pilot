import * as go from "gojs";
import { ReactDiagram } from "gojs-react";
import { useEffect } from "react";
import MyBlocklyComponent from "./MyBlocklyComponent";
import * as Blockly from "blockly";
class FieldDraggingTool extends go.DraggingTool {
  constructor() {
    super();
    this.fieldTemplate = null; // THIS NEEDS TO BE SET before a drag starts
    this.temporaryPart = null;
    this.temporaryImage = null;
  }

  // override this method
  findDraggablePart() {
    const diagram = this.diagram;
    let obj = diagram.findObjectAt(diagram.lastInput.documentPoint);
    while (obj !== null && obj.type !== go.Panel.TableRow) obj = obj.panel;
    if (
      obj !== null &&
      obj.type === go.Panel.TableRow &&
      this.fieldTemplate !== null &&
      this.temporaryPart === null
    ) {
      const tempPart = go.GraphObject.make(
        go.Node,
        "Table",
        { layerName: "Tool", locationSpot: go.Spot.Bottom },
        this.fieldTemplate.copy()
      ); // copy the template!
      this.temporaryPart = tempPart;
      // assume OBJ is now a Panel representing a field, bound to field data
      // update the temporary Part via data binding
      tempPart.location = diagram.lastInput.documentPoint; // need to set location explicitly
      diagram.add(tempPart); // add to Diagram before setting data
      tempPart.data = obj.data; // bind to the same field data as being dragged
      // console.log(tempPart.layerName);
      return tempPart;
    }
    return super.findDraggablePart();
  }

  doActivate() {
    if (this.temporaryPart === null) return super.doActivate();
    const diagram = this.diagram;
    this.standardMouseSelect();
    this.isActive = true;
    // instead of the usual result of computeEffectiveCollection, just use the temporaryPart alone
    const map = new go.Map(/*go.Part, go.DraggingInfo*/);
    map.set(this.temporaryPart, new go.DraggingInfo(diagram.lastInput.documentPoint.copy()));
    this.draggedParts = map;
    this.startTransaction("Drag Field");
    console.log("active");
    diagram.isMouseCaptured = true;
  }

  doDeactivate() {
    if (this.temporaryPart === null) return super.doDeactivate();
    const diagram = this.diagram;
    // make sure the temporary Part is no longer in the Diagram
    diagram.remove(this.temporaryPart);
    this.temporaryPart = null;
    if (this.temporaryImage !== null) {
      document.body.removeChild(this.temporaryImage);
      this.temporaryImage = null;
    }
    // now do all the standard deactivation cleanup,
    // including setting isActive = false, clearing out draggedParts, calling stopTransaction(),
    // and setting diagram.isMouseCaptured = false
    super.doDeactivate();
  }

  makeImage() {
    if (this.temporaryPart === null) return null;
    const parts = new go.List();
    parts.add(this.temporaryPart);
    return this.diagram.makeImage({
      parts: parts,
      showTemporary: true,
      callback: (img) => {
        this.temporaryImage = img;
        img.style.position = "absolute";
        img.style.pointerEvents = "none";
        img.style.zIndex = 999;
        document.body.appendChild(img);
        this.temporaryPart.opacity = 0;
      },
    });
  }

  doMouseMove() {
    if (!this.isActive) return;
    if (this.temporaryPart === null) return super.doMouseMove();
    const diagram = this.diagram;
    // just move the temporaryPart (in draggedParts), without regard to moving or copying permissions of the Node
    const offset = diagram.lastInput.documentPoint
      .copy()
      .subtract(diagram.firstInput.documentPoint);
    this.moveParts(this.draggedParts, offset, false);
    if (diagram.viewportBounds.containsPoint(diagram.lastInput.documentPoint)) {
      if (this.temporaryPart.opacity !== 1) {
        this.temporaryPart.opacity = 1;
        if (this.temporaryImage !== null) {
          document.body.removeChild(this.temporaryImage);
          this.temporaryImage = null;
        }
      }
    } else {
      if (this.temporaryPart.opacity === 1) {
        this.makeImage(); // also sets temporaryPart.opacity = 0
      }
      // move a temporary Image element instead
      const img = this.temporaryImage;
      if (img !== null) {
        const e = diagram.lastInput.event;
        img.style.left = window.scrollX + e.clientX - img.width / 2 + "px";
        img.style.top = window.scrollY + e.clientY - img.height / 2 + "px";
        // position the Image to be just above the mouse pointer
      }
    }
  }

  doMouseUp() {
    if (!this.isActive) return;
    if (this.temporaryPart === null) return super.doMouseUp();
    const blocklyWorkspace = Blockly.getMainWorkspace().getAllBlocks();
    const diagram = this.diagram;
    const data = this.temporaryPart.data;
    const input = diagram.lastInput;
    let target = input.event.target;
    let parent = input.event.target?.parentNode?.parentNode;
    let id = parent?.getAttribute("data-id");

    const targetIdx = blocklyWorkspace.findIndex((block) => block.id === id);

    if (input.isTouchEvent) {
      // Touch events always target the first object touched, we want the last.
      // Determine if you are using Touch or Pointer:
      const evt = input.event.changedTouches ? input.event.changedTouches[0] : input.event;
      id = document.elementFromPoint(evt.clientX, evt.clientY).id;
    }
    if (input.event && id === "myDroppedFields") {
      document.getElementById("myDroppedFields").textContent +=
        data.name + " (" + data.info + ")\n";
    }

    // pilot code
    if (input.event) {
      blocklyWorkspace[targetIdx].setFieldValue(data.name, "source_input");
      console.log(
        `parent-id:${id} \n target:${target} \n data: ${data} \n parent : ${parent}`,
        parent
      );
      console.log(target);
      // document.getElementById("testDiv").textContent += data.name;
    }
    this.transactionResult = "Dragged Field";
    this.stopTool();
    // console.log("doMouseUp", data);
  }
}
function initDiagram() {
  const $ = go.GraphObject.make; // for conciseness in defining templates
  const myDiagram = $(go.Diagram, {
    validCycle: go.Diagram.CycleNotDirected, // don't allow loops
    draggingTool: $(FieldDraggingTool), // use custom DraggingTool
    "undoManager.isEnabled": true,
  });

  // This template is a Panel that is used to represent each item in a Panel.itemArray.
  // The Panel is data bound to the item object.
  const fieldTemplate = $(
    go.Panel,
    "TableRow", // this Panel is a row in the containing Table
    new go.Binding("portId", "name"), // this Panel is a "port"
    {
      background: "transparent", // so this port's background can be picked by the mouse
      fromSpot: go.Spot.Right, // links only go from the right side to the left side
      toSpot: go.Spot.Left,
    }, // allow drawing links from or to this port
    $(
      go.Shape,
      { width: 12, height: 12, column: 0, strokeWidth: 2, margin: 4 },
      new go.Binding("figure", "figure"),
      new go.Binding("fill", "color")
    ),
    $(
      go.TextBlock,
      { margin: new go.Margin(0, 2), column: 1, font: "bold 13px sans-serif" },
      new go.Binding("text", "name")
    ),
    $(
      go.TextBlock,
      { margin: new go.Margin(0, 2), column: 2, font: "13px sans-serif" },
      new go.Binding("text", "info")
    )
  );

  // the FieldDraggingTool needs a template for what to show while dragging
  myDiagram.toolManager.draggingTool.fieldTemplate = fieldTemplate;

  // This template represents a whole "record".
  myDiagram.nodeTemplate = $(
    go.Node,
    "Auto",
    new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
    // this rectangular shape surrounds the content of the node
    $(go.Shape, { fill: "#EEEEEE" }),
    // the content consists of a header and a list of items
    $(
      go.Panel,
      "Vertical",
      // this is the header for the whole node
      $(
        go.Panel,
        "Auto",
        { stretch: go.GraphObject.Horizontal }, // as wide as the whole node
        $(go.Shape, { fill: "#1570A6", stroke: null }),
        $(
          go.TextBlock,
          {
            alignment: go.Spot.Center,
            margin: 3,
            stroke: "white",
            textAlign: "center",
            font: "bold 12pt sans-serif",
          },
          new go.Binding("text", "key")
        )
      ),
      // this Panel holds a Panel for each item object in the itemArray;
      // each item Panel is defined by the itemTemplate to be a TableRow in this Table
      $(
        go.Panel,
        "Table",
        {
          name: "TABLE",
          padding: 2,
          minSize: new go.Size(100, 10),
          defaultStretch: go.GraphObject.Horizontal,
          itemTemplate: fieldTemplate,
        },
        new go.Binding("itemArray", "fields")
      ) // end Table Panel of items
    ) // end Vertical Panel
  ); // end Node

  myDiagram.model = new go.GraphLinksModel({
    linkKeyProperty: "key",
    linkFromPortIdProperty: "fromPort",
    linkToPortIdProperty: "toPort",
    copiesArrays: true,
    copiesArrayObjects: true,
  });
  return myDiagram;
}
const nodeDataArray = [
  {
    key: "Record1",
    fields: [
      { name: "field1", color: "#F7B84B", figure: "Ellipse" },
      { name: "field2", info: "the second one", color: "#F25022", figure: "Ellipse" },
      { name: "fieldThree", info: "3rd", color: "#00BCF2" },
    ],
    loc: "0 0",
  },
  {
    key: "Record2",
    fields: [
      {
        name: "fieldA",
        color: "#FFB900",
        figure: "Diamond",
        info: "diamond",
      },
      { name: "fieldB", color: "green", figure: "Circle", info: "circle" },
      { name: "fieldC", color: "red", figure: "Triangle", info: "triangle" },
      { name: "fieldD", figure: "XLine", info: "X" },
    ],
    loc: "250 0",
  },
];

const DragOutFieldsWithBlockly = () => {
  // var hasClass = Blockly.utils.dom.hasClass(blockElement, "my_class");

  return (
    <>
      <ReactDiagram
        initDiagram={initDiagram}
        divClassName="diagram-component"
        nodeDataArray={nodeDataArray}
      />
      <div
        id="redBox"
        key="redBoxKey"
        style={{ width: 200, height: 200, backgroundColor: "red" }}
      ></div>
      <button onClick={() => {}}>보기</button>
      <MyBlocklyComponent />
    </>
  );
};
export default DragOutFieldsWithBlockly;
