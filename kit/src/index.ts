import buildRoutePath from "./site/buildRoutePath";
import defineConfig from "./site/defineConfig";
import type EndPoint from "./types/EndPoint";
import type UserConfig from "./types/UserConfig";

// NOTE: Do not export anything that relies on vinxi/vite from here, or it will
// cause problems when they are re-imported when routes are lazily loaded

export { defineConfig, buildRoutePath };

export type { UserConfig, EndPoint };
