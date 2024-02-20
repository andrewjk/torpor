import hash from "../../compile/internal/hash";
import context from "./context";

export default function printContext(message?: string) {
  if (message) {
    console.log(message);
  }

  const print: any = {};
  const effects = new Map<string, string>();

  print.effectSubscriptions = [];
  for (let [key, value] of context.effectSubscriptions.entries()) {
    const sub: any = {
      target: key,
      props: [],
    };
    for (let [key2, value2] of value.entries()) {
      const prop: any = {
        name: key2,
        effects: [],
      };
      for (let x of value2) {
        prop.effects.push(hash(String(x)));
        effects.set(hash(String(x)), String(x));
      }
      sub.props.push(prop);
    }
    print.effectSubscriptions.push(sub);
  }

  print.nodeEffects = [];
  for (let [key, value] of context.nodeEffects.entries()) {
    const sub: any = {
      node: key.textContent,
      effects: [],
      children: value.children.map((c) => c.textContent),
    };
    for (let x of value.effects) {
      sub.effects.push({
        target: x.target,
        prop: x.prop,
        effect: hash(String(x.effect)),
      });
      effects.set(hash(String(x)), String(x));
    }
    print.nodeEffects.push(sub);
  }

  //print.effects = [];
  //for (let [hash, value] of effects.entries()) {
  //  print.effects.push({ hash, value });
  //}

  console.dir(print, { depth: null });
}
