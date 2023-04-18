interface MakeTreeProps {
  sourceTreeData: SourceTreeData[];
  nodeDataArray: go.ObjectData[];
  linkDataArray: go.ObjectData[];
  parentKey?: number | string;
  groupKey: string;
}

interface SourceTreeData {
  [key: string]: any;
  title: string;
  children?: Children[];
}
interface Children {
  title: string;
  [key: string]: any;
}
let [nodeKey, linkKey] = [0, 0];
export const makeTree = ({
  sourceTreeData,
  nodeDataArray,
  linkDataArray,
  parentKey,
  groupKey,
}: MakeTreeProps) => {
  sourceTreeData.forEach((data) => {
    const newNode = {
      key: nodeKey,
      name: data.title,
      group: groupKey,
    };
    if (parentKey !== undefined) {
      const newLink = { key: linkKey, from: parentKey, to: nodeKey };
      linkDataArray.push(newLink);
    }
    nodeKey++;
    linkKey++;
    nodeDataArray.push(newNode);
    if (data.children?.length! > 0) {
      makeTree({
        sourceTreeData: data.children!,
        nodeDataArray,
        linkDataArray,
        groupKey,
        parentKey: nodeKey - 1,
      });
    }
  });
};
