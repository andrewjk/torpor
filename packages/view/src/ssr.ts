import t_class from "./render/buildClasses";
import t_style from "./render/buildStyles";
import t_attr from "./render/formatAttributeText";
import t_fmt from "./ssr/formatText";
import $async from "./ssr/$serverAsync";
import $batch from "./ssr/$serverBatch";
import $bind from "./ssr/$serverBind";
import $cache from "./ssr/$serverCache";
import $onmount from "./ssr/$serverOnmount";
import $peek from "./ssr/$serverPeek";
import $pending from "./ssr/$serverPending";
import $refresh from "./ssr/$serverRefresh";
import $run from "./ssr/$serverRun";
import $stream from "./ssr/$serverStream";
import $unwrap from "./ssr/$serverUnwrap";
import $watch from "./ssr/$serverWatch";
import runServerAwait from "./ssr/runServerAwait";
import { serverFlush } from "./ssr/serverSentinels";
import fromElement from "./stream/fromElement";
import fromServer from "./stream/fromServer";
import fromWebSocket from "./stream/fromWebSocket";
import type AsyncOptions from "./types/AsyncOptions";
import type ServerComponent from "./types/ServerComponent";
import type ServerSlotRender from "./types/ServerSlotRender";
import type StreamSource from "./types/StreamSource";

export {
	$watch,
	$bind,
	$cache,
	$run,
	$onmount,
	$stream,
	$unwrap,
	$peek,
	$batch,
	$async,
	$pending,
	$refresh,
	serverFlush as t_server_flush,
	runServerAwait as t_await_server,
	fromElement,
	fromServer,
	fromWebSocket,
	t_fmt,
	t_attr,
	t_class,
	t_style,
};

// Client-only exports, stubbed so client-compiled code (or shared helpers that
// import the main entry) resolves in a server bundle and fails loudly if
// actually invoked
export {
	mount,
	hydrate,
	unmount,
	fillLayoutSlot,
	clearLayoutSlot,
	t_add_element,
	t_add_fragment,
	t_anchor,
	t_animate,
	t_apply_props,
	t_attribute,
	t_child,
	t_dynamic,
	t_event,
	t_first_inside,
	t_fragment,
	t_fragment_el,
	t_head_element,
	t_list_item,
	t_next,
	t_pop_region,
	t_push_region,
	t_region,
	t_rerun_region_effects,
	t_restore_hydration,
	t_root,
	t_root_el,
	t_run_await,
	t_run_branch,
	t_run_control,
	t_run_list,
	t_run_try,
	t_save_hydration,
	t_skip,
} from "./ssr/unavailable";

export type { AsyncOptions, ServerComponent, ServerSlotRender, StreamSource };
