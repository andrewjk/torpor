import type Computed from "../types/Computed";
import type Effect from "../types/Effect";
import type ProxyData from "../types/ProxyData";
import type Subscription from "../types/Subscription";
import { COMPUTED_TYPE, EFFECT_TYPE } from "../types/constants";
import { proxyDataSymbol } from "../watch/symbols";

/**
 * Creates a simple Mermaid diagram for a state object's effect subscriptions
 * (just signal -> effect, without any subscription details).
 */
export default function printSimpleDiagram(object: any): string {
	let d = `flowchart LR`;
	let subs: Subscription[] = [];
	let effects: Effect[] = [];
	let comps: Computed[] = [];
	for (let prop in object) {
		let signal = proxyData(object).signals.get(prop);

		// go forwards to get signal targets
		let sub = signal?.firstTarget;
		while (sub) {
			let handled = subs.includes(sub);
			if (!handled) {
				subs.push(sub);
				sub.name = `S${subs.length}`;
				sub.source.name = prop;
				sub.target.name = getTargetName(sub.target);
				d += `\n\t${sub.source.name}${sub.active ? "" : " -- !"} --> ${sub.target.name}`;
			}

			if (sub.target.type === EFFECT_TYPE && !effects.includes(sub.target)) {
				effects.push(sub.target);
			} else if (sub.target.type === COMPUTED_TYPE && !comps.includes(sub.target)) {
				comps.push(sub.target);
			}

			sub = sub.nextTarget;
		}
	}

	subs = [];
	for (let comp of comps) {
		// go backwards to get computed subs
		let sub = comp.firstSource;
		while (sub) {
			let handled = subs.includes(sub);
			if (!handled) {
				subs.push(sub);
				d += `\n\t${sub.source.name} <-- ${sub.active ? "" : "! --"}${sub.target.name}`;
			}

			sub = sub.nextSource;
		}
	}

	subs = [];
	for (let eff of effects) {
		// go backwards to get computed effects
		let sub = eff.firstSource;
		while (sub) {
			let handled = subs.includes(sub);
			if (!handled) {
				subs.push(sub);
				d += `\n\t${sub.source.name} <-- ${sub.active ? "" : "! --"}${sub.target.name}`;
			}

			sub = sub.nextSource;
		}
	}

	return d;
}

function getTargetName(target: Effect | Computed) {
	//`let name = target.name;
	//`if (!name) {
	let name = String(target.run);
	if (name.startsWith("function ")) {
		name = name.substring(9);
	}
	name = name.substring(0, name.indexOf("() {"));
	return name;
}

function proxyData(object: any): ProxyData {
	return object[proxyDataSymbol];
}
