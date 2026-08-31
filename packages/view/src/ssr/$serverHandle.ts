import type Cleanup from "../types/Cleanup";

/**
 * Server no-op for the client-side `$handle` effect primitive. Server renders
 * are synchronous — effects don't run, so there is no "change" to react to.
 * The stub exists so server builds importing `$handle` don't emit a dangling
 * import.
 */
export default function $serverHandle(_: (first: boolean) => Cleanup | void): void {}
