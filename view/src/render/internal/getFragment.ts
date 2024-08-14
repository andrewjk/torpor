export default function createFragment(
  array: any[],
  index: number,
  html: string,
): DocumentFragment {
  let fragment = array[index];
  if (fragment === undefined) {
    const template = document.createElement("template");
    template.innerHTML = html;
    array[index] = fragment = template.content;
  }
  return fragment.cloneNode(true);
}
