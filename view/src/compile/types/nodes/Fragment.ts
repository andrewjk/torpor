export default interface Fragment {
  number: number;
  text: string;
  events: {
    varName: string;
    eventName: string;
    handler: string;
  }[];
  endVarName?: string;
}
