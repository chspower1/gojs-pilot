import * as go from "gojs";
import { ReactDiagram } from "gojs-react";

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
    console.log("obj", obj);
    console.log("obj type", obj?.type);
    while (obj !== null && obj.type !== go.Panel.Horizontal) {
      obj = obj.panel;
      console.log("obj type", obj?.type);
    }
    if (
      obj !== null &&
      obj.type === go.Panel.Horizontal &&
      this.fieldTemplate !== null &&
      this.temporaryPart === null
    ) {
      const tempPart = go.GraphObject.make(
        go.Node,
        "Table",
        { layerName: "Tool", locationSpot: go.Spot.Bottom },
        go.GraphObject.make(go.Panel, this.fieldTemplate.copy())
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
    console.log("doMouseMove");
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
    console.log("doMouseUp");
    if (!this.isActive) return;
    if (this.temporaryPart === null) return super.doMouseUp();
    const diagram = this.diagram;
    const data = this.temporaryPart.data;
    console.log("doMouseUp", data);
    const input = diagram.lastInput;
    let id = input.event.target.id;
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
    if (input.event && id === "testDiv") {
      document.getElementById("testDiv").textContent += data.name;
    }
    this.transactionResult = "Dragged Field";
    this.stopTool();
    console.log("doMouseUp", data);
  }
}

const init = () => {
  const $ = go.GraphObject.make;
  const diagram = $(go.Diagram, {
    "undoManager.isEnabled": true,
    draggingTool: $(FieldDraggingTool), // use custom DraggingTool
  });
  const fieldTemplate = $(
    go.Panel,
    "Auto",
    $(
      go.Shape,
      "RoundedRectangle",
      { fill: "white", width: 200, height: 100 },
      new go.Binding("fill", "color")
    ),
    $(
      go.TextBlock,
      { alignment: go.Spot.Center, font: "20px bold" },
      new go.Binding("text", "name")
    )
  );
  const nodeTemplate = $(go.Node, "Horizontal", { movable: false }, fieldTemplate);
  diagram.nodeTemplate = nodeTemplate;
  diagram.toolManager.draggingTool.fieldTemplate = fieldTemplate;
  diagram.linkTemplate = $(go.Link);
  diagram.model = new go.GraphLinksModel({
    linkKeyProperty: "key",
  });
  return diagram;
};

const nodeDataArray = [
  { key: 0, name: "first", color: "red" },
  { key: 1, name: "second", color: "teal" },
  { key: 2, name: "third", color: "skyblue" },
];
const linkDataArray = [];
const Test = () => {
  return (
    <>
      <ReactDiagram
        initDiagram={init}
        divClassName="diagram-component"
        nodeDataArray={nodeDataArray}
        linkDataArray={linkDataArray}
      />
    </>
  );
};
export default Test;
