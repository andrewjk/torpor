type OperationType =
  | "@root"
  | "@const"
  | "@if group"
  | "@if"
  | "@else if"
  | "@else"
  | "@switch group"
  | "@case"
  | "@default"
  | "@for group"
  | "@for"
  | "@key"
  | "@await group"
  | "@await"
  | "@then"
  | "@catch";

export default OperationType;
