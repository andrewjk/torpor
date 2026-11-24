// The page state is no longer exported as `$page`: components read their
// request's page state from `$context.$page` (`let { $page } = $context;`)
import type PageState from "./types/PageState";

export type { PageState };
