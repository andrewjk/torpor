import $mount from "./render/$mount";
import $run from "./render/$run";
import $unwrap from "./render/$unwrap";
import $watch from "./render/$watch";
import t_animate from "./render/addAnimation";
import t_event from "./render/addEvent";
import t_add_fragment from "./render/addFragment";
import t_apply_props from "./render/applyProps";
import clearLayoutSlot from "./render/clearLayoutSlot";
import t_fmt from "./render/formatText";
import t_class from "./render/getClasses";
import t_fragment from "./render/getFragment";
import t_style from "./render/getStyles";
import hydrate from "./render/hydrate";
import mount from "./render/mount";
import t_list_item from "./render/newListItem";
import t_range from "./render/newRange";
import t_anchor from "./render/nodeAnchor";
import t_child from "./render/nodeChild";
import t_next from "./render/nodeNext";
import t_reanchor from "./render/nodeReanchor";
import t_root from "./render/nodeRoot";
import t_skip from "./render/nodeSkip";
import t_pop_range from "./render/popRange";
import t_push_range from "./render/pushRange";
import t_run_control from "./render/runControl";
import t_run_branch from "./render/runControlBranch";
import runLayoutSlot from "./render/runLayoutSlot";
import t_run_list from "./render/runList";
import t_attribute from "./render/setAttribute";
import t_dynamic from "./render/setDynamicElement";
import { type Component } from "./types/Component";
import { type ListItem } from "./types/ListItem";
import { type ServerComponent } from "./types/ServerComponent";
import { type ServerSlotRender } from "./types/ServerSlotRender";
import { type SlotRender } from "./types/SlotRender";

// Mount and hydrate
export { mount, hydrate, runLayoutSlot, clearLayoutSlot };

// Functions for the user that can be called from components
export { $watch, $unwrap, $run, $mount };

// Functions for use within generated code
export {
	t_animate,
	t_event,
	t_add_fragment,
	t_apply_props,
	t_fmt,
	t_class,
	t_fragment,
	t_style,
	t_range,
	t_anchor,
	t_reanchor,
	t_child,
	t_next,
	t_root,
	t_skip,
	t_pop_range,
	t_push_range,
	t_run_control,
	t_run_branch,
	t_list_item,
	t_run_list,
	t_attribute,
	t_dynamic,
};

export type { Component, ServerComponent, SlotRender, ServerSlotRender, ListItem };
