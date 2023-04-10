interface MakeTreeProps {
  sourceTreeData: SourceTreeData[];
  parentKey: string;
  goJsNodes: any[];
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
export const makeTree = ({ sourceTreeData, parentKey, goJsNodes }: MakeTreeProps) => {
  sourceTreeData.forEach((data) => {
    const newItem = {
      key: data.key,
      name: data.title,
      parent: parentKey,
    };
    goJsNodes.push(newItem);
    if (data.children?.length! > 0) {
      makeTree({
        sourceTreeData: data.children!,
        parentKey: data.key,
        goJsNodes,
      });
    }
  });
};
