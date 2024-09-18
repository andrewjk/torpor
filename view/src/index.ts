import $mount from "./$mount";
import $run from "./$run";
import $unwrap from "./$unwrap";
import $watch from "./$watch";
import hydrate from "./hydrate";
import mount from "./mount";
import addAnimation from "./render/addAnimation";
import addEvent from "./render/addEvent";
import addFragment from "./render/addFragment";
import applyProps from "./render/applyProps";
import flushMountEffects from "./render/flushMountEffects";
import formatText from "./render/formatText";
import getFragment from "./render/getFragment";
import nodeAnchor from "./render/nodeAnchor";
import nodeChild from "./render/nodeChild";
import nodeNext from "./render/nodeNext";
import nodeRoot from "./render/nodeRoot";
import popRange from "./render/popRange";
import pushRange from "./render/pushRange";
import pushRangeToParent from "./render/pushRangeToParent";
import runControl from "./render/runControl";
import runControlBranch from "./render/runControlBranch";
import runList from "./render/runList";
import setAttribute from "./render/setAttribute";
import setDynamicElement from "./render/setDynamicElement";

// Functions for the user that will be called from components and when
// mounting/hydrating

export { mount, hydrate, $watch, $unwrap, $run, $mount };

// TODO: Need to hide these from the user somehow
export {
	addAnimation,
	addEvent,
	addFragment,
	applyProps,
	flushMountEffects,
	formatText,
	getFragment,
	nodeAnchor,
	nodeChild,
	nodeNext,
	nodeRoot,
	popRange,
	pushRange,
	pushRangeToParent,
	runControl,
	runControlBranch,
	runList,
	setAttribute,
	setDynamicElement,
};
