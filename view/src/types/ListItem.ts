export default interface ListItem {
  key: any;
  startNode: Node;
  endNode: Node;
  data: Record<string, any>;
  // HACK:
  title: string;
}
