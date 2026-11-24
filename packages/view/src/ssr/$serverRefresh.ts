import type { RefreshOptions } from "../watch/$refresh";

/**
 * Server no-op for the client-side `$refresh` primitive. A refresh is an
 * imperative action that never runs during SSR. The stub exists so server
 * builds importing `$refresh` don't emit a dangling import, and its signature
 * matches the client primitive exactly (see
 * `test/types/server-twin-signatures.test.ts`).
 */
export default function $serverRefresh(_fn: () => any, _options?: RefreshOptions): void {}
