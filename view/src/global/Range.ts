// TODO: Make these properties required for monomorphism
export default interface Range {
  // TODO: This should be for debugging only
  title: string;
  startNode?: Node;
  endNode?: Node;

  parent?: Range;
  children?: Range[];

  // TODO: What is this
  index?: number;

  // TODO: Should we store effects in here too?
}
