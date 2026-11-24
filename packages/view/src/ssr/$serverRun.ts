import type Cleanup from "../types/Cleanup";
import type Effect from "../types/Effect";

/**
 * Server no-op for the client-side `$run` primitive. Effects never run during
 * SSR, but the stub signature matches the client primitive exactly (so the two
 * can't drift — see `test/types/server-twin-signatures.test.ts`). The returned
 * `Effect` is never meaningful here, because nothing is created.
 */
export default function $serverRun(
	_fn: () => Cleanup | void,
	_name?: string,
	_options?: Pick<Effect, "isMountEffect" | "forVarMask">,
): Effect {
	return undefined as unknown as Effect;
}
