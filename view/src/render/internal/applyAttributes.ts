import $run from "../../watch/$run";

export default function applyAttributes(
  el: Element,
  props: Record<string, any>,
  propNames: string[],
) {
  for (let [name, value] of Object.entries(props)) {
    if (!name.startsWith("$") && !propNames.includes(name)) {
      if (name.indexOf("on") === 0) {
        const eventName = name.substring(2);
        el.addEventListener(eventName, value);
      } else if (name.indexOf("bind:") === 0) {
        // TODO: Not sure about passing on bind
        const eventName = "input";
        const defaultValue = '""';
        const propName = name.substring(5);
        $run(() => el.setAttribute(propName, value || defaultValue));
        // @ts-ignore
        el.addEventListener(eventName, (e) => (value = e.target.value));
      } else if (name.indexOf("class:") === 0) {
        const propName = name.substring(6);
        $run(() => el.classList.toggle(propName, value));
      } else if (name === "class") {
        // TODO: Clear any previously set values from the element
        $run(() => (el.className = value));
      } else {
        $run(() => el.setAttribute(name, value));
      }
    }
  }
}
