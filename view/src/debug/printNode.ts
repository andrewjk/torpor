export default function printNode(node: Node | null | undefined) {
  let paths: string[] = [];

  while (node != null) {
    if (node.nodeType === 1) {
      // Element
      let el = node as Element;
      let p = el.tagName.toLowerCase();
      if (el.id) p += "#" + el.id;
      if (el.classList.length) p += Array.from(el.classList).join(".");
      paths.push(p);
    } else if (node.nodeType === 3) {
      // Text
      paths.push(`'${node.textContent}'`);
    } else if (node.nodeType === 8) {
      // Comment
      paths.push("#com");
    } else if (node.nodeType === 9) {
      // Document
      paths.push("#doc");
    } else if (node.nodeType === 11) {
      // Document fragment
      paths.push("#frag");
    } else {
      paths.push(node.nodeType + "?");
    }
    node = node.parentNode;
  }

  return paths.reverse().join(" > ") || "null";
}
