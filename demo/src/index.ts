import render from "../../view/src/render/render";
import Demo from "./Demo";

//export default Demo;

const root = document.getElementById("tera-container");
if (root) {
  render(root, Demo, null);
}
