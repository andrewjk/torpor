/**
 * The loader contract shared by components that can load data from the
 * network: DataGrid, Tree, TagInput, ListBox, ComboBox and SelectBox.
 *
 * ```
 * import { createItemLoader, type Loader } from "@torpor/ui/loader";
 * ```
 */

export { createItemLoader, normalizeLoadResult } from "../utils/loader";
export type {
	ItemLoaderOptions,
	ItemLoaderState,
	Loader,
	LoadRequest,
	LoadResult,
} from "../utils/loader";
