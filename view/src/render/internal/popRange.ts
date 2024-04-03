import context from "../../global/context";

export default function popRange() {
  context.rangeStack.pop();
}
