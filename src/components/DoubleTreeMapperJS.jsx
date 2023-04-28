import * as go from "gojs";
import { ReactDiagram } from "gojs-react";
import { useState, useEffect } from "react";
import checkLink from "../utils/checkLink";
import longTarget from "../data/target_long.json";
import { makeTree } from "../makeTree";

// Constant
let ROUTINGSTYLE = "Normal";
const PlaceholderMargin = new go.Margin(4);
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
class MappingLink extends go.Link {
  getLinkPoint(node, port, spot, from, ortho, othernode, otherport) {
    if (ROUTINGSTYLE !== "ToGroup") {
      // console.log("node", node.position.y);
      // console.log("spot", spot);
      // console.log("port", port);
      // console.log("from", from);
      // console.log("ortho", ortho);
      // console.log("othernode", othernode.position.y);
      // console.log("otherport", otherport);

      // return super.getLinkPoint(node, port, spot, from, ortho, othernode, otherport);
      // console.log(
      //   "------",
      //   super.getLinkPoint(node, port, spot, from, ortho, othernode, otherport)
      // );
      if (from) {
        if (node.position.y > 600) return new go.Point(400, 600);
        else if (node.position.y < 0) return new go.Point(400, 0);
        // else return super.getLinkPoint(node, port, spot, from, ortho, othernode, otherport);
      } else {
        if (node.position.y > 600) return new go.Point(650, 600);
        else if (node.position.y < 0) return new go.Point(650, 0);
        // else return super.getLinkPoint(node, port, spot, from, ortho, othernode, otherport);
      }
      return super.getLinkPoint(node, port, spot, from, ortho, othernode, otherport);
    } else {
      var r = port.getDocumentBounds();
      var group = node.containingGroup;
      var b = group !== null ? group.actualBounds : node.actualBounds;
      var op = othernode.getDocumentPoint(go.Spot.Center);
      var x = op.x > r.centerX ? b.right : b.left;
      return new go.Point(x, r.centerY);
    }
  }

  computePoints() {
    var result = super.computePoints();
    if (result && ROUTINGSTYLE === "ToNode") {
      var fn = this.fromNode;
      var tn = this.toNode;
      // console.log("computing", fn.actualBounds, tn);
      if (fn && tn) {
        var fg = fn.containingGroup;
        var fb = fg ? fg.actualBounds : fn.actualBounds;
        var fpt = this.getPoint(0);
        var tg = tn.containingGroup;
        var tb = tg ? tg.actualBounds : tn.actualBounds;
        var tpt = this.getPoint(this.pointsCount - 1);
        this.setPoint(1, new go.Point(fpt.x < tpt.x ? fb.right : fb.left, fpt.y));
        this.setPoint(
          this.pointsCount - 2,
          new go.Point(fpt.x < tpt.x ? tb.left : tb.right, tpt.y)
        );
      }
    }
    return result;
  }
}
class GroupTreeLayout extends go.TreeLayout {
  initialOrigin() {
    if (this.group) {
      const b = this.diagram.computePartsBounds(this.group.memberParts);
      if (b.isReal()) return b.position;
      let sized = this.group.findObject("SIZED");
      if (!sized) sized = this.group;
      return sized.getDocumentPoint(
        new go.Spot(0, 0, PlaceholderMargin.left, PlaceholderMargin.top)
      );
    }
    return this.arrangementOrigin;
  }
} // end of GroupTreeLayout

// Function
const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //최댓값은 제외, 최솟값은 포함
};

// Init
const initDiagram = () => {
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

  const diagram = $(go.Diagram, {
    // scrollMode: go.Diagram.DocumentScroll,
    InitialLayoutCompleted: (e) => e.diagram.nodes.each(updateGroupInteraction),
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

    // 첫 랜더링시 범위 밖에 있는 요소들도 선택될 수 있게끔 하는 옵션
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
          // console.log("unit", unit, dir, dist);
          scrollGroup(grp, unit, dir, dist);
          return;
        }
      }
      // otherwise, scroll the viewport normally
      go.Diagram.prototype.scroll.call(this, unit, dir, dist);
    },
    "commandHandler.copiesTree": true,
    "commandHandler.deletesTree": true,
    TreeExpanded: (e) => setTimeout(() => updateGroupInteraction(e.subject.first()), 1000),
    TreeCollapsed: (e) => setTimeout(() => updateGroupInteraction(e.subject.first()), 1000),
    // newly drawn links always map a node in one tree to a node in another tree
    "linkingTool.archetypeLinkData": { category: "Mapping" },
    "linkingTool.linkValidation": checkLink,
    "relinkingTool.linkValidation": checkLink,
    "undoManager.isEnabled": true,
    // allowVerticalScroll: false,
    // allowHorizontalScroll: false,
  });
  function scrollGroup(grp, unit, dir, dist) {
    if (grp instanceof go.GraphObject) grp = grp.part;
    if (grp instanceof go.Adornment) grp = grp.adornedPart;
    if (!(grp instanceof go.Group)) return;
    var diag = grp.diagram;
    if (!diag) return;
    var sized = grp.findObject("SIZED");
    if (!sized) sized = grp;
    var bnds = diag.computePartsBounds(grp.memberParts);
    const view = sized.getDocumentBounds().subtractMargin(PlaceholderMargin);
    var dx = 0;
    var dy = 0;
    switch (unit) {
      case "pixel":
        switch (dir) {
          case "up":
            dy = dist;
            break;
          case "down":
            dy = -dist;
            break;
          case "left":
            dx = dist;
            break;
          case "right":
            dx = -dist;
            break;
        }
        break;
      case "line":
        switch (dir) {
          case "up":
            dy = dist;
            break;
          case "down":
            dy = -dist;
            break;
          case "left":
            dx = dist;
            break;
          case "right":
            dx = -dist;
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
      default:
        break;
    }
    if (dx > 0)
      dx = Math.min(dx, view.left + PlaceholderMargin.left - bnds.left); // top-left margin
    else if (dx < 0 && view.right > bnds.right) dx = 0;
    if (dy > 0) dy = Math.min(dy, view.top + PlaceholderMargin.top - bnds.top); // top-left margin
    else if (dy < 0 && view.bottom > bnds.bottom) dy = 0;
    const off = new go.Point(dx, dy);
    if (dx !== 0 || dy !== 0) {
      diag.commit((diag) => {
        diag.moveParts(grp.memberParts, off, true);
        updateGroupInteraction(grp, view);
      });
    }
  }
  function scrollAt(vertical, grp, pt) {
    // PT in document coordinates
    if (grp instanceof go.GraphObject) grp = grp.part;
    if (grp instanceof go.Adornment) grp = grp.adornedPart;
    if (!(grp instanceof go.Group)) return;
    const diagram = grp.diagram;
    let sized = grp.findObject("SIZED");
    if (!sized) sized = grp;
    const panel = grp.findAdornment("Selection");
    if (!panel) return;
    const viewb = sized.getDocumentBounds().subtractMargin(PlaceholderMargin);
    const memb = diagram.computePartsBounds(grp.memberParts); //??? ought to skip some but not all invisible parts
    const p = pt.copy();
    let off = null;
    if (vertical) {
      const VTHUMB = panel.findObject("VTHUMB");
      const TOP = panel.findObject("TOP");
      const BOTTOM = panel.findObject("BOTTOM");
      const ptop = TOP.getDocumentPoint(go.Spot.Bottom);
      const pbot = BOTTOM.getDocumentPoint(go.Spot.Top);
      p.projectOntoLineSegmentPoint(ptop, pbot);
      const dist = Math.sqrt(p.distanceSquaredPoint(ptop));
      const ty = Math.max(1, viewb.height - TOP.actualBounds.height - BOTTOM.actualBounds.height);
      const fy = Math.max(0, Math.min(1 - VTHUMB.actualBounds.height / ty, dist / ty));
      off = new go.Point(0, viewb.y - memb.height * fy - memb.y);
    } else {
      const HTHUMB = panel.findObject("HTHUMB");
      const LEFT = panel.findObject("LEFT");
      const RIGHT = panel.findObject("RIGHT");
      const ptop = LEFT.getDocumentPoint(go.Spot.Right);
      const pbot = RIGHT.getDocumentPoint(go.Spot.Left);
      p.projectOntoLineSegmentPoint(ptop, pbot);
      const dist = Math.sqrt(p.distanceSquaredPoint(ptop));
      const tx = Math.max(1, viewb.width - LEFT.actualBounds.width - RIGHT.actualBounds.width);
      const fx = Math.max(0, Math.min(1 - HTHUMB.actualBounds.width / tx, dist / tx));
      off = new go.Point(viewb.x - memb.width * fx - memb.x, 0);
    }
    diagram.commit((diag) => {
      diag.moveParts(grp.memberParts, off, true);
      updateGroupInteraction(grp);
    });
  }
  function updateGroupInteraction(grp, viewb) {
    if (grp instanceof go.GraphObject) grp = grp.part;
    if (!(grp instanceof go.Group)) grp = grp.containingGroup;
    if (!(grp instanceof go.Group)) return;
    if (viewb === undefined) {
      let sized = grp.findObject("SIZED");
      if (!sized) sized = grp;
      viewb = sized.getDocumentBounds().subtractMargin(PlaceholderMargin);
    }
    grp.memberParts.each((part) => {
      if (part instanceof go.Node && part.isVisible()) {
        part.pickable =
          part.selectable =
          part.isInDocumentBounds =
          part.selectionAdorned =
            viewb.intersectsRect(part.actualBounds);
        // hide links that connect with nodes that are outside of the group's view
        // part.findLinksConnected().each((l) => {
        //   if (l.category === "Mapping") l.visible = part.pickable;
        // });
      }
    });
    updateScrollbars(grp, viewb);
  }
  function updateScrollbars(grp, viewb) {
    if (grp instanceof go.GraphObject) grp = grp.part;
    if (grp instanceof go.Adornment) grp = grp.adornedPart;
    if (!(grp instanceof go.Group)) return;
    if (viewb === undefined) {
      let sized = grp.findObject("SIZED");
      if (!sized) sized = grp;
      viewb = sized.getDocumentBounds().subtractMargin(PlaceholderMargin);
    }
    const panel = grp.findAdornment("Selection");
    if (!panel) return;
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
  // 애니메이션 제거 속성
  diagram.animationManager.canStart = () => {
    return false;
  };

  diagram.nodeTemplate = $(
    TreeNode,
    "Horizontal",

    {
      movable: true,
      copyable: false,
      deletable: false,
      selectionAdorned: false,
      background: "white",
      mouseEnter: (e, node) => (node.background = "#d3ebf5"),
      mouseLeave: (e, node) => (node.background = node.isSelected ? "#d3ebf5" : "white"),
      click: (e, node) => {
        console.log(node.findBindingPanel()?.data);
      },
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

  diagram.linkTemplateMap.add(
    "Mapping",
    $(
      MappingLink,
      { isTreeLink: false, isLayoutPositioned: false, layerName: "Foreground" },
      { fromSpot: go.Spot.Right, toSpot: go.Spot.Left },
      { relinkableFrom: true, relinkableTo: true },
      $(go.Shape, { stroke: "teal", strokeWidth: 2 }),
      $(go.Shape, { toArrow: "Standard", stroke: null, fill: "teal" })
    )
  );

  diagram.groupTemplate = $(
    go.Group,
    "Vertical",
    {
      movable: false,
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
    new go.Binding("location", "xy", go.Point.parse).makeTwoWay(go.Point.stringify),
    // $(go.TextBlock, { font: "bold 14pt sans-serif" }, new go.Binding("text")),
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
  diagram.groupTemplate.selectionAdornmentTemplate = $(
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
        scrollAt(false, back.part, e.diagram.lastInput.documentPoint);
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
        scrollAt(false, thumb.part, e.diagram.lastInput.documentPoint);
      },
    }),
    $(
      "AutoRepeatButton",
      {
        row: 2,
        column: 1,
        name: "LEFT",
        alignment: go.Spot.Left,
        click: (e, but) => scrollGroup(but.part, "pixel", "left", 100),
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
        click: (e, but) => scrollGroup(but.part, "pixel", "right", 100),
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
        scrollAt(true, back.part, e.diagram.lastInput.documentPoint);
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
        scrollAt(true, thumb.part, e.diagram.lastInput.documentPoint);
      },
    }),
    $(
      "AutoRepeatButton",
      {
        row: 1,
        column: 2,
        name: "TOP",
        alignment: go.Spot.Top,
        click: (e, but) => scrollGroup(but.part, "pixel", "up", 100),
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
        click: (e, but) => scrollGroup(but.part, "pixel", "down", 100),
      },
      $(go.Shape, "TriangleDown", { stroke: null, desiredSize: new go.Size(8, 6) })
    )
  );
  diagram.model = new go.GraphLinksModel({
    linkKeyProperty: "key",
  });

  return diagram;
};

// Data
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

// Main Component
const DoubleTreeMapper = () => {
  const [sourceDataArray, setSourceDataArray] = useState([
    { key: "source", isGroup: true, name: "source", xy: "0 0", size: "400 700" },
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
    { key: "target", isGroup: true, name: "target", xy: "650 0", size: "400 700" },
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

  // Button Hanlde Function
  const handleClickAddTarget = () => {
    const newNodeKey = parseInt(targetDataArray[targetDataArray.length - 1].key.split("_")[1]);
    const newNode = {
      key: `target_${newNodeKey + 1}`,
      name: `newNode${newNodeKey + 1}`,
      group: "target",
    };
    const newLink = {
      key: `link_${linkDataArray.length}`,
      from: `target_0`,
      to: `target_${newNodeKey + 1}`,
    };
    setTargetDataArray([...targetDataArray, newNode]);
    setLinkDataArray([...linkDataArray, newLink]);
  };
  const handleClickAddSource = () => {
    const newNodeKey = parseInt(sourceDataArray[sourceDataArray.length - 1].key.split("_")[1]);
    const newNode = {
      key: `source_${newNodeKey + 1}`,
      name: `newNode${newNodeKey + 1}`,
      group: "source",
    };
    const newLink = {
      key: `link_${linkDataArray.length}`,
      from: `source_0`,
      to: `source_${newNodeKey + 1}`,
    };
    setSourceDataArray([...sourceDataArray, newNode]);
    setLinkDataArray([...linkDataArray, newLink]);
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

      // console.log(newNodeDataArray);
      // console.log(newLinkDataArray);
      setNodeDataArray(newNodeDataArray);
      setLinkDataArray(newLinkDataArray);
      // setLinkDataArray([]);
    }
  };

  // useEffect
  useEffect(() => {
    setNodeDataArray([...sourceDataArray, ...targetDataArray]);
  }, [sourceDataArray, targetDataArray]);
  useEffect(() => {
    // handleClickChangeData();
  }, []);
  return (
    <>
      <ReactDiagram
        initDiagram={initDiagram}
        divClassName="diagram-component"
        nodeDataArray={nodeDataArray}
        linkDataArray={linkDataArray}
        onModelChange={onModelChange}
      />
      {isChanged || (
        <>
          <button onClick={handleClickAddSource}>Add Source Node</button>
          <button onClick={handleClickAddTarget}>Add Target Node</button>
          <button onClick={handleClickAddLink}>Add Random Link</button>
        </>
      )}
      <button onClick={handleClickChangeData}>
        {!isChanged ? "Change to New Data" : "Change to Original Data"}
      </button>
    </>
  );
};

export default DoubleTreeMapper;
