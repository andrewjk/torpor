import t_animate from "./render/addAnimation";
import t_event from "./render/addEvent";
import t_add_fragment from "./render/addFragment";
import t_apply_props from "./render/applyProps";
import t_class from "./render/buildClasses";
import t_style from "./render/buildStyles";
import clearLayoutSlot from "./render/clearLayoutSlot";
import t_clear from "./render/clearRegion";
import fillLayoutSlot from "./render/fillLayoutSlot";
import t_fmt from "./render/formatText";
import t_fragment from "./render/getFragment";
import hydrate from "./render/hydrate";
import mount from "./render/mount";
import t_list_item from "./render/newListItem";
import t_region from "./render/newRegion";
import t_anchor from "./render/nodeAnchor";
import t_child from "./render/nodeChild";
import t_next from "./render/nodeNext";
import t_root from "./render/nodeRoot";
import t_skip from "./render/nodeSkip";
import t_pop_region from "./render/popRegion";
import t_push_region from "./render/pushRegion";
import t_run_control from "./render/runControl";
import t_run_list from "./render/runList";
import t_attribute from "./render/setAttribute";
import t_dynamic from "./render/setDynamicElement";
import type Animation from "./types/Animation";
import type Component from "./types/Component";
import type ListItem from "./types/ListItem";
import type SlotRender from "./types/SlotRender";
import $batch from "./watch/$batch";
import $cache from "./watch/$cache";
import $mount from "./watch/$mount";
import $peek from "./watch/$peek";
import $run from "./watch/$run";
import $unwrap from "./watch/$unwrap";
import $watch from "./watch/$watch";
import ReactiveDate from "./wrappers/ReactiveDate";

// Mount and hydrate
export { mount, hydrate, fillLayoutSlot, clearLayoutSlot };

// Functions for the user that can be called from components
export { $watch, $cache, $run, $mount, $unwrap, $peek, $batch };

// Wrapped objects for using in reactive objects
export { ReactiveDate };

// Functions for use within generated code
export {
	t_animate,
	t_event,
	t_add_fragment,
	t_apply_props,
	t_fmt,
	t_class,
	t_clear,
	t_fragment,
	t_style,
	t_region,
	t_anchor,
	t_child,
	t_next,
	t_root,
	t_skip,
	t_pop_region,
	t_push_region,
	t_run_control,
	t_list_item,
	t_run_list,
	t_attribute,
	t_dynamic,
};

export type { Component, SlotRender, ListItem, Animation };
