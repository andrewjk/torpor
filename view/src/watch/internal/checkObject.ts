import $watch from "../$watch";
import { isProxySymbol } from "./symbols";
import triggerEffects from "./triggerEffects";
import updateEffects from "./updateEffects";

// TODO: Pass in the target
export default function checkObject(
  oldObject: any,
  newObject: any,
  alreadyChecked: any[],
  alreadyTriggered?: any[],
) {
  alreadyChecked = alreadyChecked || [];
  for (let prop in newObject) {
    const oldValue = oldObject[prop];
    let newValue = newObject[prop];

    if (alreadyChecked.includes(oldValue)) {
      return;
    }
    alreadyChecked.push(oldValue);

    // If the value was previously a proxy, watch the new value and update effect subscriptions
    if (oldValue && oldValue[isProxySymbol]) {
      newValue = $watch(newValue);
      updateEffects(oldValue, newValue);
    }

    if (oldValue !== newValue) {
      // Trigger effects for the value
      triggerEffects(newObject, prop, alreadyTriggered);
    }

    if (oldValue && oldValue[isProxySymbol]) {
      checkObject(oldValue, newValue, alreadyChecked, alreadyTriggered);
    }
  }
}
