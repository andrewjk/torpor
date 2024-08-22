export default interface BuildServerStatus {
  output: string;
  styleHash: string;
  varNames: Record<string, number>;
}
