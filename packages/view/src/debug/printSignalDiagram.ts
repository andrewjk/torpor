import type Computed from "../types/Computed";
import type Effect from "../types/Effect";
import type ProxyData from "../types/ProxyData";
import type ProxySignal from "../types/ProxySignal";
import type Subscription from "../types/Subscription";
import { COMPUTED_TYPE, EFFECT_TYPE, SIGNAL_TYPE } from "../types/constants";
import { proxyDataSymbol } from "../watch/symbols";

/**
 * Creates a Mermaid diagram for a state object's effect subscriptions.
 */
export default function printSignalDiagram(object: any): string {
	let d = `flowchart LR`;
	let subs: Subscription[] = [];
	let effects: Effect[] = [];
	let comps: Computed[] = [];
	for (let prop in object) {
		//d += `\n\tSource --> ${prop}(${prop})`;

		let signal = proxyData(object).signals.get(prop);

		// go forwards to get signal targets
		let oldsub: Subscription | undefined;
		let oldsi = oldsub ? printSubName(oldsub) : "null";
		let sub = signal?.firstTarget;
		while (sub) {
			let handled = subs.includes(sub);
			if (!handled) {
				subs.push(sub);
				sub.name = `S${subs.length}`;
				sub.source.name = prop;
				sub.target.name = getTargetName(sub.target);
			}
			let si = printSubName(sub);

			if (oldsub) {
				d += `\n\t${oldsi} -- nt --> ${si}[[${si}]]`;
			} else {
				d += `\n\t${prop} -- t --> ${si}[[${si}]]`;
			}

			if (!handled) {
				d += `\n\t${si} -- t --> ${sub.target.name}${printDiagramBorder(sub, sub.target)}`;
			}

			if (sub.target.type === EFFECT_TYPE && !effects.includes(sub.target)) {
				effects.push(sub.target);
			} else if (sub.target.type === COMPUTED_TYPE && !comps.includes(sub.target)) {
				comps.push(sub.target);
			}

			oldsub = sub;
			oldsi = si;
			sub = sub.nextTarget;
		}
	}

	for (let effect of effects) {
		// go backwards to get effect subs
		let oldsub2: Subscription | undefined;
		let oldsi2 = oldsub2 ? printSubName(oldsub2) : "null";
		let sub = effect.firstSource;
		while (sub) {
			let handled = subs.includes(sub);
			if (!handled) subs.push(sub);
			let si2 = printSubName(sub);

			if (oldsub2) {
				d += `\n\t${oldsi2} -- ns --> ${si2}[[${si2}]]`;
			} else {
				d += `\n\t${sub.target.name} -- s --> ${si2}[[${si2}]]`;
			}

			d += `\n\t${si2} -- s --> ${sub.source.name}${printDiagramBorder(sub, sub.source)}`;

			oldsub2 = sub;
			oldsi2 = si2;
			sub = sub.nextSource;
		}
	}

	for (let comp of comps) {
		// go backwards to get computed subs
		let oldsub2: Subscription | undefined;
		let oldsi2 = oldsub2 ? printSubName(oldsub2) : "null";
		let sub = comp.firstSource;
		while (sub) {
			let handled = subs.includes(sub);
			if (!handled) subs.push(sub);
			let si2 = printSubName(sub);

			if (oldsub2) {
				d += `\n\t${oldsi2} -- ns --> ${si2}[[${si2}]]`;
			} else {
				d += `\n\t${sub.target.name} -- s --> ${si2}[[${si2}]]`;
			}

			d += `\n\t${si2} -- s --> ${sub.source.name}${printDiagramBorder(sub, sub.source)}`;

			oldsub2 = sub;
			oldsi2 = si2;
			sub = sub.nextSource;
		}
	}

	return d;
}

function printSubName(sub: Subscription) {
	let name = sub.name;
	if (!sub.active) name = "!" + name;
	return name;
}

function getTargetName(target: Effect | Computed) {
	let name = String(target.run);
	if (name.startsWith("function ")) {
		name = name.substring(9);
	}
	name = name.substring(0, name.indexOf("() {"));
	return name;
}

function printDiagramBorder(sub: Subscription, object: ProxySignal | Computed | Effect) {
	let name = "";
	if (!sub.active) name += "!";
	name += object.name;
	if (object.type === SIGNAL_TYPE) {
		return `(${name})`;
	} else if (object.type === COMPUTED_TYPE) {
		return `([${name}])`;
	} else if (object.type === EFFECT_TYPE) {
		return `[${name}]`;
	}
}

function proxyData(object: any): ProxyData {
	return object[proxyDataSymbol];
}
