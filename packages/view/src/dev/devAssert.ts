import devContext from "./devContext";

/**
 * Throws when `condition` is false — but only when dev mode is enabled (the
 * dev-tools build calls `setDevMode`). Used for invariant checks on the
 * runtime's implicit state machines (the batch counter, the signal update
 * chain, the `$async` settle latch): violations mean the machine's
 * bookkeeping is corrupt, and failing loudly in dev beats silently leaking
 * subscriptions or dropping settles in ways that only show up as subtle UI
 * glitches later. Production builds pay one boolean read per check.
 *
 * @param condition The invariant to hold.
 * @param message What the violation means — the thrown error's message.
 */
export default function devAssert(condition: boolean, message: string): void {
	if (devContext.enabled && !condition) {
		throw new Error(message);
	}
}
