import context from "../render/context";
import type ProxyData from "../types/ProxyData";
import { SIGNAL_TYPE } from "../types/constants";
import trackEffect from "./trackEffect";

export default function trackProxyEffect(data: ProxyData, key: PropertyKey): void {
	if (context.activeTarget !== null) {
		//console.log(`tracking effect '${context.activeTarget.name}' for '${String(key)}' prop`);

		// Create or get the signals
		let signal = data.signals.get(key);
		if (signal === undefined || signal === null) {
			signal = {
				type: SIGNAL_TYPE,
				firstTarget: null,
				nextSignalToUpdate: null,
				//name: dev.propName(key),
			};
			data.signals.set(key, signal);
		}

		trackEffect(signal);
	}
}
