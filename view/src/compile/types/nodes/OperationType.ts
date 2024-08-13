type OperationType =
  | "@root"
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
  | "@catch"
  | "@const"
  | "@console"
  | "@debugger"
  | "@function";

export default OperationType;
