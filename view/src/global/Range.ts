// TODO: Make these properties required for monomorphism
export default interface Range {
  startNode?: Node;
  endNode?: Node;

  parent?: Range;
  children?: Range[];

  // TODO: What is this
  index?: number;

  // TODO: Should we store effects in here too?
}
