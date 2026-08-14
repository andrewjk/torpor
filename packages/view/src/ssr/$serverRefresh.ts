/**
 * Server no-op for the client-side `$refresh` primitive. A refresh is an
 * imperative action that never runs during SSR. The stub exists so server
 * builds importing `$refresh` don't emit a dangling import.
 */
export default function $serverRefresh(_: () => any): void {}
