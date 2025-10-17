import type ProxyData from "../types/ProxyData";
import { SIGNAL_TYPE } from "../types/constants";
import trackSignal from "./trackSignal";

export default function trackProxySignal(data: ProxyData, key: PropertyKey): void {
	//console.log(`tracking effect '${context.activeTarget.name}' for '${String(key)}' prop`);

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

	trackSignal(signal);
}
