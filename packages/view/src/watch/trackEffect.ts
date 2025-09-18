import context from "../render/context";
import type Computed from "../types/Computed";
import type ProxySignal from "../types/ProxySignal";
import type Subscription from "../types/Subscription";

// TODO: Rename this to `subscribe` because its purpose has changed a bit

/**
 * If there's an active target, subscribe it to this signal, so that it will be
 * run when the signal changes.
 */
export default function trackEffect(signal: ProxySignal | Computed): void {
	const target = context.activeTarget;
	if (target !== null) {
		let sub: Subscription | null = null;
		let lastSub: Subscription | null = null;

		// Check if there's a sub we can re-use
		// TODO: Maybe we could be smarter with this
		// -- use the target sub instead?
		// -- do it differently on push vs pull??
		for (
			let nextSub: Subscription | null = signal.firstTarget;
			nextSub !== null;
			nextSub = nextSub.nextTarget
		) {
			lastSub = nextSub;
			if (nextSub.target === target) {
				sub = nextSub;
				break;
			}
		}

		if (sub === null) {
			sub = {
				source: signal,
				target: target,
				previousTarget: lastSub,
				nextTarget: null,
				nextSource: null,
				active: true,
				recalc: false,
				//name: dev.subName(),
			};
			//console.log(`creating sub '${signal.name}' => '${effect.name}' (${sub.name})`);
			if (lastSub === null) {
				signal.firstTarget = sub;
			} else {
				lastSub.nextTarget = sub;
			}

			if (target.firstSource === null) {
				target.firstSource = sub;
			} else {
				let lastEffectSub = target.firstSource;
				for (
					let nextSub: Subscription | null = lastEffectSub.nextSource;
					nextSub !== null;
					nextSub = nextSub.nextSource
				) {
					lastEffectSub = nextSub;
				}
				lastEffectSub.nextSource = sub;
			}
		} else {
			// We can re-use this subscription object
			//console.log(`re-using sub '${signal.name}' => '${effect.name}' (${sub.name})`);
			sub.active = true;
		}
	}
}
