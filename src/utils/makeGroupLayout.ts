import * as go from "gojs";

export default function makeGroupLayout($: any) {
  return $(
    go.TreeLayout, // taken from samples/treeView.html
    {
      alignment: go.TreeLayout.AlignmentStart,
      angle: 0,
      compaction: go.TreeLayout.CompactionNone,
      layerSpacing: 16,
      layerSpacingParentOverlap: 0.8,
      nodeIndentPastParent: 1.0,
      nodeSpacing: 0,
      setsPortSpot: false,
      setsChildPortSpot: false,
      // after the tree layout, change the width of each node so that all
      // of the nodes have widths such that the collection has a given width
      //   commitNodes: function () {
      //     // method override must be function, not =>
      //     go.TreeLayout.prototype.commitNodes.call(this);
      //     if (ROUTINGSTYLE === "ToGroup") {
      //       updateNodeWidths(this.group, this.group.data.width || 100);
      //     }
      //   },
    }
  );
}
