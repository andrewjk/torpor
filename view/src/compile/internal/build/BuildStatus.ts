import Fragment from "../../types/nodes/Fragment";

export default interface BuildStatus {
  imports: Set<string>;
  props: string[];
  styleHash: string;
  varNames: Record<string, number>;
  fragmentStack: {
    fragment?: Fragment;
    path: string;
  }[];
  forVarNames: string[];
}
