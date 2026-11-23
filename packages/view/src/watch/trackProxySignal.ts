import type ProxyData from "../types/ProxyData";
import type Computed from "../types/Computed";
import type ProxySignal from "../types/ProxySignal";
import { SIGNAL_TYPE } from "../types/constants";
import trackSignal from "./trackSignal";

export default function trackProxySignal(data: ProxyData, key: PropertyKey): void {
	//console.log(`tracking effect '${context.activeTarget.name}' for '${String(key)}' prop`);

	trackSignal(ensureProxySignal(data, key));
}

/**
 * Creates or gets the signal for a proxy key, without subscribing the active
 * effect to it. Used where a signal must exist for later reads (e.g. the
 * array iterator creating per-index signals) but the current reader
 * shouldn't re-run when that key changes.
 */
export function ensureProxySignal(data: ProxyData, key: PropertyKey): ProxySignal | Computed {
	// Create or get the signals
	let signal = data.signals.get(key);
	if (signal === undefined) {
		signal = {
			type: SIGNAL_TYPE,
			firstTarget: null,
			nextSignalToUpdate: null,
			//name: dev.propName(key),
		};
		data.signals.set(key, signal);
	}
	return signal;
}
