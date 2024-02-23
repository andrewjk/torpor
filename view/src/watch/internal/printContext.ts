import hash from "../../compile/internal/hash";
import context from "./context";

export default function printContext(message?: string) {
  const print: any = {};
  const effectsMap = new Map<string, string>();

  print.effectSubscriptions = [];
  for (let [target, propEffects] of context.effectSubscriptions.entries()) {
    for (let [prop, effects] of propEffects.entries()) {
      for (let x of effects) {
        print.effectSubscriptions.push({
          target,
          prop,
          effect: hash(String(x)),
        });
        effectsMap.set(hash(String(x)), String(x));
      }
    }
  }

  print.rangeEffects = [];
  for (let [range, effect] of context.rangeEffects.entries()) {
    if (effect.size) {
      for (let x of effect) {
        print.rangeEffects.push({
          title: range.title,
          startNode: range.startNode?.textContent,
          endNode: range.endNode?.textContent,
          children: (range.children || []).map((c) => c.title),
          target: x.target,
          prop: x.prop,
          effect: hash(String(x.effect)),
        });
        effectsMap.set(hash(String(x)), String(x));
      }
    } else {
      print.rangeEffects.push({
        title: range.title,
        startNode: range.startNode?.textContent,
        endNode: range.endNode?.textContent,
        children: (range.children || []).map((c) => c.title),
        target: undefined,
        prop: undefined,
        effect: undefined,
      });
      //effectsMap.set(hash(String(x)), String(x));
    }
  }

  print.effects = [];
  for (let [hash, value] of effectsMap.entries()) {
    print.effects.push({ hash, value });
  }

  if (message) {
    console.log(message);
  }
  console.log(print);
  //console.dir(print, { depth: null });
}
