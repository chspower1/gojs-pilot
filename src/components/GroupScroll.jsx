import * as go from "gojs";
import { ReactDiagram } from "gojs-react";
class GroupTreeLayout extends go.TreeLayout {
  initialOrigin() {
    if (this.group) {
      var sized = this.group.findObject("SIZED");
      if (sized) return sized.getDocumentPoint(new go.Spot(0, 0, 4, 4)); // top-left margin
    }
    return this.arrangementOrigin;
  }
}

const init = () => {
  const $ = go.GraphObject.make;
  go.GraphObject.defineBuilder("AutoRepeatButton", function (args) {
    var repeat = go.GraphObject.takeBuilderArgument(args, 50, function (x) {
      return typeof x === "number";
    });
    var delay = go.GraphObject.takeBuilderArgument(args, 500, function (x) {
      return typeof x === "number";
    });
    var $ = go.GraphObject.make;
    // some internal helper functions for auto-repeating
    function delayClicking(e, obj) {
      endClicking(e, obj);
      if (obj.click) {
        // wait milliseconds before starting clicks
        obj._timer = setTimeout(function () {
          repeatClicking(e, obj);
        }, delay);
      }
    }
    function repeatClicking(e, obj) {
      if (obj._timer) clearTimeout(obj._timer);
      if (obj.click) {
        obj._timer = setTimeout(function () {
          if (obj.click) {
            obj.click(e, obj);
            repeatClicking(e, obj);
          }
        }, repeat); // milliseconds between clicks
      }
    }
    function endClicking(e, obj) {
      if (obj._timer) {
        clearTimeout(obj._timer);
        obj._timer = undefined;
      }
    }

    var button = $("Button", {
      "ButtonBorder.figure": "Rectangle",
      "ButtonBorder.fill": "transparent",
      "ButtonBorder.stroke": null,
      _buttonFillOver: "rgba(0, 0, 0, .25)",
      _buttonStrokeOver: null,
      cursor: "auto",
    });
    // override the normal button actions
    var btndown = button.actionDown;
    var btnup = button.actionUp;
    var btncancel = button.actionCancel;
    button.actionDown = function (e, btn) {
      delayClicking(e, btn);
      if (btndown) btndown(e, btn);
    };
    button.actionUp = function (e, btn) {
      endClicking(e, btn);
      if (btnup) btnup(e, btn);
    };
    button.actionCancel = function (e, btn) {
      endClicking(e, btn);
      if (btncancel) btncancel(e, btn);
    };
    return button;
  });

  go.GraphObject.defineBuilder("ScrollingTable", function (args) {
    var $ = go.GraphObject.make;
    var tablename = go.GraphObject.takeBuilderArgument(args, "TABLE");

    // an internal helper function used by the THUMB for scrolling to a Y-axis point in local coordinates
    function setScrollIndexLocal(bar, y) {
      // may be called with the "SCROLLBAR" panel or any element within it
      while (bar && bar.name !== "SCROLLBAR") bar = bar.panel;
      if (!bar) return;
      var table = bar.panel.findObject(tablename);
      if (!table) return;

      var up = bar.findObject("UP");
      var uph = up ? up.actualBounds.height : 0;

      var down = bar.findObject("DOWN");
      var downh = down ? down.actualBounds.height : 0;

      var tabh = bar.actualBounds.height;
      var idx = Math.round(
        Math.max(0, Math.min(1, (y - uph) / (tabh - uph - downh))) * table.rowCount
      );
      incrTableIndex(bar, idx - table.topIndex);
    }

    // an internal helper function used by the UP and DOWN buttons for relative scrolling
    // the OBJ may be the "SCROLLBAR" panel or any element within it
    function incrTableIndex(obj, i) {
      var diagram = obj.diagram;
      var table = obj;
      while (table && table.name !== "SCROLLBAR") table = table.panel;
      if (table) table = table.panel.findObject(tablename);
      if (!table) return;
      if (i === +Infinity || i === -Infinity) {
        // page up or down
        var tabh = table.actualBounds.height;
        var rowh = table.elt(table.topIndex).actualBounds.height; // assume each row has same height?
        if (i === +Infinity) {
          i = Math.max(1, Math.ceil(tabh / rowh) - 1);
        } else {
          i = -Math.max(1, Math.ceil(tabh / rowh) - 1);
        }
      }
      var idx = table.topIndex + i;
      if (idx >= table.rowCount - 1) idx = table.rowCount - 1;
      if (idx < 0) idx = 0;
      if (table.topIndex !== idx) {
        if (diagram !== null) diagram.startTransaction("scroll");
        table.topIndex = idx;
        var node = table.part; // may need to reroute links if the table contains any ports
        if (node instanceof go.Node) node.invalidateConnectedLinks();
        updateScrollBar(table);
        if (diagram !== null) diagram.commitTransaction("scroll");
      }
    }

    // must be passed either the "ScrollingTable" Panel, or the "Table" Panel that holds the rows
    // that are scrolled (i.e. adjusting topIndex), or the "SCROLLBAR" Panel
    function updateScrollBar(table) {
      if (!(table instanceof go.Panel) || table.type !== go.Panel.Table) return;
      if (table.part) table.part.ensureBounds();
      if (table.name !== tablename) {
        while (table && !table._updateScrollBar) table = table.panel;
        if (!table) return;
        table = table.findObject(tablename);
      }

      // the scrollbar is a sibling of the table
      var bar = table.panel.findObject("SCROLLBAR");
      if (!bar) return;
      var idx = table.topIndex;

      var up = bar.findObject("UP");
      var uph = 0;
      if (up) {
        up.opacity = idx > 0 ? 1.0 : 0.3;
        uph = up.actualBounds.height;
      }

      var down = bar.findObject("DOWN");
      var downh = 0;
      if (down) {
        down.opacity = idx < table.rowCount - 1 ? 1.0 : 0.3;
        downh = down.actualBounds.height;
      }

      var thumb = bar.findObject("THUMB");
      var tabh = bar.actualBounds.height;
      var availh = Math.max(0, tabh - uph - downh);
      if (table.rowCount <= 0) {
        if (thumb) thumb.height = Math.min(availh, 10);
        return;
      }
      var rows = 0;
      var rowh = 1;
      var last = idx;
      for (var i = idx; i < table.rowCount; i++) {
        var h = table.elt(i).actualBounds.height;
        if (h > 0) {
          rows++;
          rowh += h;
          last = i;
        }
      }
      var needed = idx > 0 || last < table.rowCount - 1;
      bar.opacity = needed ? 1.0 : 0.5;
      if (thumb) {
        thumb.height =
          Math.max((rows / table.rowCount) * availh, Math.min(availh, 10)) -
          (thumb instanceof go.Shape ? thumb.strokeWidth : 0);
        thumb.alignment = new go.Spot(
          0.5,
          Math.min(table.rowCount, idx + 0.5) / table.rowCount,
          0,
          0
        );
      }
    }

    // must be called with the "SCROLLBAR" panel
    function showScrollButtons(bar, show) {
      if (!bar || bar.name !== "SCROLLBAR") return;
      var table = bar.panel.findObject(tablename);
      if (!table) return;
      var idx = table.topIndex;

      var up = bar.findObject("UP");
      if (up) up.opacity = show ? (idx > 0 ? 1.0 : 0.3) : 0.0;

      var down = bar.findObject("DOWN");
      if (down) down.opacity = show ? (idx < table.rowCount - 1 ? 1.0 : 0.3) : 0.0;

      var thumb = bar.findObject("THUMB");
      if (thumb) thumb.opacity = table.rowCount > 0 ? 1 : 0;
    }

    return $(
      go.Panel,
      "Table",
      {
        // in case external code wants to update the scrollbar
        _updateScrollBar: updateScrollBar,
        mouseEnter: function (e, table) {
          table._updateScrollBar(table);
        },
      },

      // this actually holds the item elements
      $(go.Panel, "Table", {
        name: tablename,
        column: 0,
        stretch: go.GraphObject.Fill,
        background: "whitesmoke",
        rowSizing: go.RowColumnDefinition.None,
        defaultAlignment: go.Spot.Top,
      }),

      // this is the scrollbar
      $(go.RowColumnDefinition, { column: 1, sizing: go.RowColumnDefinition.None }),
      $(
        go.Panel,
        "Table",
        {
          name: "SCROLLBAR",
          column: 1,
          stretch: go.GraphObject.Vertical,
          background: "#DDDDDD",
          mouseEnter: function (e, bar) {
            showScrollButtons(bar, true);
          },
          mouseLeave: function (e, bar) {
            showScrollButtons(bar, false);
          },
        },

        // the scroll up button
        $(
          "AutoRepeatButton",
          {
            name: "UP",
            row: 0,
            opacity: 0,
            click: function (e, obj) {
              e.handled = true;
              incrTableIndex(obj, -1);
            },
          },
          $(go.Shape, "TriangleUp", { stroke: null, desiredSize: new go.Size(6, 6) })
        ),
        $(go.RowColumnDefinition, { row: 0, sizing: go.RowColumnDefinition.None }),

        {
          // clicking in the bar scrolls directly to that point in the list of items
          click: function (e, bar) {
            e.handled = true;
            var local = bar.getLocalPoint(e.documentPoint);
            setScrollIndexLocal(bar, local.y);
          },
        },

        // the scroll thumb, gets all available extra height
        $(go.Shape, {
          name: "THUMB",
          row: 1,
          stretch: go.GraphObject.Horizontal,
          height: 10,
          margin: new go.Margin(0, 2),
          fill: "gray",
          stroke: "transparent",
          alignment: go.Spot.Top,
          alignmentFocus: go.Spot.Top,
          mouseEnter: function (e, thumb) {
            thumb.stroke = "gray";
          },
          mouseLeave: function (e, thumb) {
            thumb.stroke = "transparent";
          },
          isActionable: true,
          actionMove: function (e, thumb) {
            var local = thumb.panel.getLocalPoint(e.documentPoint);
            setScrollIndexLocal(thumb, local.y);
          },
        }),
        $(go.RowColumnDefinition, { row: 1, stretch: go.GraphObject.Vertical }),

        // the scroll down button
        $(
          "AutoRepeatButton",
          {
            name: "DOWN",
            row: 2,
            opacity: 0,
            click: function (e, obj) {
              e.handled = true;
              incrTableIndex(obj, +1);
            },
          },
          $(go.Shape, "TriangleDown", { stroke: null, desiredSize: new go.Size(6, 6) })
        ),
        $(go.RowColumnDefinition, { row: 2, sizing: go.RowColumnDefinition.None })
      )
    );
  });

  const myDiagram = $(
    go.Diagram,
    // create a Diagram for the DIV HTML element
    {
      InitialLayoutCompleted: (e) => e.diagram.nodes.each(updateGroupInteraction),
      TreeExpanded: (e) => setTimeout(() => updateGroupInteraction(e.subject.first()), 1000),
      TreeCollapsed: (e) => setTimeout(() => updateGroupInteraction(e.subject.first()), 1000),
      "resizingTool.dragsMembers": false,
      "resizingTool.updateAdornments": function (part) {
        // method override
        go.ResizingTool.prototype.updateAdornments.call(this, part);
        const ad = part.findAdornment("Selection");
        if (ad) {
          ad.ensureBounds();
          updateScrollbars(part);
        }
      },
      PartResized: (e) => updateGroupInteraction(e.subject.part),
      // support mouse scrolling of subgraphs
      scroll: function (unit, dir, dist) {
        // override Diagram.scroll
        if (!dist) dist = 1;
        var it = this.findPartsAt(this.lastInput.documentPoint).iterator;
        while (it.next()) {
          var grp = it.value;
          if (grp instanceof go.Group) {
            // if the mouse is in a Group, scroll it
            scrollGroup(grp, unit, dir, dist);
            return;
          }
        }
        // otherwise, scroll the viewport normally
        go.Diagram.prototype.scroll.call(this, unit, dir, dist);
      },
    }
  );

  function scrollGroup(grp, unit, dir, dist) {
    if (grp instanceof go.GraphObject) grp = grp.part;
    if (grp instanceof go.Adornment) grp = grp.adornedPart;
    if (!(grp instanceof go.Group)) return;
    var diag = grp.diagram;
    if (!diag) return;
    var sized = grp.findObject("SIZED");
    if (!sized) sized = grp;
    var bnds = diag.computePartsBounds(grp.memberParts);
    var view = sized.getDocumentBounds();
    var dx = 0;
    var dy = 0;
    switch (unit) {
      case "pixel":
        switch (dir) {
          case "up":
            dy = 10;
            break;
          case "down":
            dy = -10;
            break;
          case "left":
            dx = 10;
            break;
          case "right":
            dx = -10;
            break;
        }
        break;
      case "line":
        switch (dir) {
          case "up":
            dy = 30;
            break;
          case "down":
            dy = -30;
            break;
          case "left":
            dx = 30;
            break;
          case "right":
            dx = -30;
            break;
        }
        break;
      case "page":
        switch (dir) {
          case "up":
            dy = Math.min(10, -sized.actualBounds.height - 10);
            break;
          case "down":
            dy = Math.max(-10, sized.actualBounds.height + 10);
            break;
          case "left":
            dx = Math.min(10, -sized.actualBounds.width - 10);
            break;
          case "right":
            dx = Math.max(-10, sized.actualBounds.width + 10);
            break;
        }
        break;
    }
    if (dx > 0) dx = Math.min(dx, view.left + 4 - bnds.left); // top-left margin
    else if (dx < 0 && view.right - 2 > bnds.right) dx = 0;
    if (dy > 0) dy = Math.min(dy, view.top + 4 - bnds.top); // top-left margin
    else if (dy < 0 && view.bottom - 2 > bnds.bottom) dy = 0;
    const off = new go.Point(dx, dy);
    if (dx !== 0 || dy !== 0) {
      diag.commit((diag) => {
        diag.moveParts(grp.memberParts, off, true);
        updateGroupInteraction(grp, view);
      });
    }
  }
  function updateGroupInteraction(grp, viewb) {
    if (grp instanceof go.GraphObject) grp = grp.part;
    if (!(grp instanceof go.Group)) grp = grp.containingGroup;
    if (!(grp instanceof go.Group)) return;
    if (viewb === undefined) {
      var sized = grp.findObject("SIZED");
      if (!sized) return;
      viewb = sized.getDocumentBounds();
    }
    grp.memberParts.each((part) => {
      if (part instanceof go.Node && part.isVisible()) {
        part.pickable =
          part.selectable =
          part.isInDocumentBounds =
          part.selectionAdorned =
            viewb.intersectsRect(part.actualBounds);
      }
    });
    updateScrollbars(grp, viewb);
  }
  function updateScrollbars(grp, viewb) {
    const selad = grp.findAdornment("Selection");
    if (!selad) return;
    if (viewb === undefined) {
      var sized = grp.findObject("SIZED");
      if (!sized) return;
      viewb = sized.getDocumentBounds();
    }
    const panel = selad;
    const memb = grp.diagram.computePartsBounds(grp.memberParts); //??? ought to skip some but not all invisible parts
    memb.union(memb.x, memb.y, 1, 1); // avoid zero width or height
    const HTHUMB = panel.findObject("HTHUMB");
    const LEFT = panel.findObject("LEFT");
    const RIGHT = panel.findObject("RIGHT");
    const VTHUMB = panel.findObject("VTHUMB");
    const TOP = panel.findObject("TOP");
    const BOTTOM = panel.findObject("BOTTOM");
    const fx = Math.min(Math.max(0, (viewb.x - memb.x) / memb.width), 1);
    const fw = Math.min(Math.max(0, viewb.width / memb.width), 1);
    const tx = Math.max(0, viewb.width - LEFT.actualBounds.width - RIGHT.actualBounds.width);
    const fy = Math.min(Math.max(0, (viewb.y - memb.y) / memb.height), 1);
    const fh = Math.min(Math.max(0, viewb.height / memb.height), 1);
    const ty = Math.max(0, viewb.height - TOP.actualBounds.height - BOTTOM.actualBounds.height);
    HTHUMB.visible = fw < 1 || viewb.x > memb.x || viewb.right < memb.right;
    if (HTHUMB.visible) {
      HTHUMB.width = Math.max(Math.min(10, tx / 2), fw * tx);
      HTHUMB.alignment = new go.Spot(0, 0.5, LEFT.actualBounds.width + fx * tx, 0);
    }
    VTHUMB.visible = fh < 1 || viewb.y > memb.y || viewb.bottom < memb.bottom;
    if (VTHUMB.visible) {
      VTHUMB.height = Math.max(Math.min(10, ty / 2), fh * ty);
      VTHUMB.alignment = new go.Spot(0.5, 0, 0, TOP.actualBounds.height + fy * ty);
    }
  }
  myDiagram.nodeTemplate = $(
    go.Node,
    "Horizontal",
    new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
    $("TreeExpanderButton"),
    $(
      go.Panel,
      "Auto",
      $(go.Shape, { fill: "lightgray" }, new go.Binding("fill", "color")),
      $(go.TextBlock, { margin: 4 }, new go.Binding("text"))
    )
  );
  myDiagram.linkTemplate = $(
    go.Link,
    {
      isInDocumentBounds: false,
      selectable: false,
      pickable: false,
      routing: go.Link.Orthogonal,
      fromEndSegmentLength: 4,
      toEndSegmentLength: 4,
      fromSpot: new go.Spot(0.001, 1, 7, 0),
      toSpot: go.Spot.Left,
    },
    $(go.Shape, { stroke: "gray" })
  );

  myDiagram.groupTemplate = $(
    go.Group,
    "Vertical",
    {
      selectionObjectName: "SIZED",
      locationObjectName: "SIZED",
      resizable: true,
      resizeObjectName: "SIZED",
      layout: $(GroupTreeLayout, {
        alignment: go.TreeLayout.AlignmentStart,
        angle: 0,
        compaction: go.TreeLayout.CompactionNone,
        layerSpacing: 25,
        layerSpacingParentOverlap: 1.0,
        nodeIndent: 5,
        nodeIndentPastParent: 1.0,
        nodeSpacing: 5,
        setsPortSpot: false,
        setsChildPortSpot: false,
      }),
      isClipping: true,
    },
    new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
    $(go.TextBlock, { font: "bold 14pt sans-serif" }, new go.Binding("text")),
    $(
      go.Shape,
      {
        name: "SIZED",
        row: 1,
        column: 1,
        minSize: new go.Size(30, 30),
        fill: "transparent",
        stroke: "blue",
        strokeWidth: 2,
      },
      new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify)
    )
  );
  myDiagram.groupTemplate.selectionAdornmentTemplate = $(
    go.Adornment,
    "Table",
    $(go.Placeholder, { row: 1, column: 1 }),
    // the scrollbars; first the backgrounds
    $(go.Shape, {
      row: 2,
      column: 1,
      stretch: go.GraphObject.Fill,
      fill: "#DDDDDD",
      strokeWidth: 0,
    }),
    $(go.Shape, {
      row: 1,
      column: 2,
      stretch: go.GraphObject.Fill,
      fill: "#DDDDDD",
      strokeWidth: 0,
    }),
    // Scrolling buttons
    $(go.Shape, {
      row: 2,
      column: 1,
      name: "HBACK",
      strokeWidth: 0,
      fill: "transparent",
      stretch: go.GraphObject.Fill,
      isActionable: true,
      actionDown: (e, back) => {
        // handle click for absolute positioning
      },
    }),
    $(go.Shape, {
      row: 2,
      column: 1,
      name: "HTHUMB",
      stretch: go.GraphObject.Vertical,
      margin: new go.Margin(1, 0),
      strokeWidth: 0,
      fill: "gray",
      width: 12,
      alignmentFocus: go.Spot.Left,
      isActionable: true,
      actionMove: (e, thumb) => {
        const up = e.diagram.lastInput.documentPoint.x < e.diagram.firstInput.documentPoint.x;
        scrollGroup(thumb.part, "line", up ? "left" : "right");
      },
    }),
    $(
      "AutoRepeatButton",
      {
        row: 2,
        column: 1,
        name: "LEFT",
        alignment: go.Spot.Left,
        click: (e, but) => scrollGroup(but.part, "pixel", "left"),
      },
      $(go.Shape, "TriangleLeft", { stroke: null, desiredSize: new go.Size(6, 8) })
    ),
    $(
      "AutoRepeatButton",
      {
        row: 2,
        column: 1,
        name: "RIGHT",
        alignment: go.Spot.Right,
        click: (e, but) => scrollGroup(but.part, "pixel", "right"),
      },
      $(go.Shape, "TriangleRight", { stroke: null, desiredSize: new go.Size(6, 8) })
    ),
    $(go.Shape, {
      row: 1,
      column: 2,
      name: "VBACK",
      strokeWidth: 0,
      fill: "transparent",
      stretch: go.GraphObject.Fill,
      isActionable: true,
      actionDown: (e, back) => {
        // handle click for absolute positioning
      },
    }),
    $(go.Shape, {
      row: 1,
      column: 2,
      name: "VTHUMB",
      stretch: go.GraphObject.Horizontal,
      margin: new go.Margin(0, 1),
      strokeWidth: 0,
      fill: "gray",
      height: 12,
      alignmentFocus: go.Spot.Top,
      isActionable: true,
      actionMove: (e, thumb) => {
        const up = e.diagram.lastInput.documentPoint.y < e.diagram.firstInput.documentPoint.y;
        scrollGroup(thumb.part, "line", up ? "up" : "down");
      },
    }),
    $(
      "AutoRepeatButton",
      {
        row: 1,
        column: 2,
        name: "TOP",
        alignment: go.Spot.Top,
        click: (e, but) => scrollGroup(but.part, "pixel", "up"),
      },
      $(go.Shape, "TriangleUp", { stroke: null, desiredSize: new go.Size(8, 6) })
    ),
    $(
      "AutoRepeatButton",
      {
        row: 1,
        column: 2,
        name: "BOTTOM",
        alignment: go.Spot.Bottom,
        click: (e, but) => scrollGroup(but.part, "pixel", "down"),
      },
      $(go.Shape, "TriangleDown", { stroke: null, desiredSize: new go.Size(8, 6) })
    )
  );
  myDiagram.model = new go.GraphLinksModel({
    linkKeyProperty: "key",
  });

  return myDiagram;
};
const GroupScroll = () => {
  const nodeDataArray = [
    { key: 0, isGroup: true, text: "Group", loc: "0 0", size: "100 100" },
    { key: 1, text: "Concept Maps", group: 0 },
    { key: 2, text: "Organized Knowledge", group: 0 },
    { key: 3, text: "Context Dependent", group: 0 },
    { key: 4, text: "Concepts", group: 0 },
    { key: 5, text: "Propositions", group: 0 },
    { key: 6, text: "Associated Feelings or Affect", group: 0 },
    { key: 7, text: "Seven", group: 0 },
    { key: 8, text: "Eight", group: 0 },
    { key: 9, text: "Nine", group: 0 },
    { key: 10, text: "Ten", group: 0 },
  ];
  const linkDataArray = [
    { from: 1, to: 2 },
    { from: 1, to: 3 },
    { from: 1, to: 4 },
    { from: 4, to: 5 },
    { from: 4, to: 6 },
    { from: 3, to: 7 },
    { from: 3, to: 8 },
    { from: 3, to: 9 },
    { from: 3, to: 10 },
  ];
  return (
    <ReactDiagram
      initDiagram={init}
      divClassName="diagram-component"
      nodeDataArray={nodeDataArray}
      linkDataArray={linkDataArray}
      style={{ width: "500px", height: "500px" }}
    />
  );
};

export default GroupScroll;
