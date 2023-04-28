import { UUID } from "crypto";

interface GroupNodeData {
  key: UUID;
  isGroup: true;
  name: string;
  xy: string;
  width: number;
}

interface NodeData {
  key: UUID;
  name: string;
  type: "STRING" | "TypeRef" | "INT" | "RecordDef" | "LONG" | "Enum";
  isArray: boolean;
  isUsed: boolean;
  group: "SOURCE" | "TARGET";
}

type NodeDataArray = (GroupNodeData | NodeData)[];

interface TreeLinkData {
  key: UUID;
  // 부모 Node의 Key
  from: string;
  // 자식 Node의 Key
  to: string;
}

interface MappingLinkData {
  key: UUID;
  // Source Node의 Key
  from: string;
  // Target Node의 Key
  to: string;
  category: "Mapping";
}

type LinkDataArray = (TreeLinkData | MappingLinkData)[];
