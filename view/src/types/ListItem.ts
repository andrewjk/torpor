import Range from "../global/Range";

export default interface ListItem extends Range {
  key: any;
  data: Record<string, any>;
}
