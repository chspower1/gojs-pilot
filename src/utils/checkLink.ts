export default function checkLink(
  fromNode: go.Node,
  fromPort: go.GraphObject,
  toNode: go.Node,
  toPort: go.GraphObject,
  link: go.Link
) {
  // make sure the nodes are inside different Groups
  if (fromNode.containingGroup === null || fromNode.containingGroup.data.key !== "source")
    return false;
  if (toNode.containingGroup === null || toNode.containingGroup.data.key !== "target") return false;
  //// optional limit to a single mapping link per node
  //if (fromNode.linksConnected.any(l => l.category === "Mapping")) return false;
  if (toNode.linksConnected.any((l) => l.category === "Mapping")) return false;
  return true;
}
