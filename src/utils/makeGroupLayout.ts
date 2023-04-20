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
    }
  );
}
