import $mount from "./render/$mount";
import $run from "./render/$run";
import $unwrap from "./render/$unwrap";
import $watch from "./render/$watch";
import t_animate from "./render/addAnimation";
import t_event from "./render/addEvent";
import t_add_fragment from "./render/addFragment";
import t_apply_props from "./render/applyProps";
import t_flush from "./render/flushMountEffects";
import t_fmt from "./render/formatText";
import t_fragment from "./render/getFragment";
import hydrate from "./render/hydrate";
import mount from "./render/mount";
import t_range from "./render/newRange";
import t_anchor from "./render/nodeAnchor";
import t_child from "./render/nodeChild";
import t_next from "./render/nodeNext";
import t_root from "./render/nodeRoot";
import t_pop_range from "./render/popRange";
import t_push_range from "./render/pushRange";
import t_run_control from "./render/runControl";
import t_run_branch from "./render/runControlBranch";
import t_run_list from "./render/runList";
import t_attribute from "./render/setAttribute";
import t_dynamic from "./render/setDynamicElement";
import type SlotRender from "./types/SlotRender";

// Mount and hydrate
export { mount, hydrate };

// Functions for the user that can be called from components
export { $watch, $unwrap, $run, $mount };

// Functions for use within generated code
export {
	t_animate,
	t_event,
	t_add_fragment,
	t_apply_props,
	t_flush,
	t_fmt,
	t_fragment,
	t_range,
	t_anchor,
	t_child,
	t_next,
	t_root,
	t_pop_range,
	t_push_range,
	t_run_control,
	t_run_branch,
	t_run_list,
	t_attribute,
	t_dynamic,
};

export type { SlotRender };
