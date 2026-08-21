import { type FocusApi } from "../utils/PopoutTypes";

export const PopoverContextName: unique symbol = Symbol.for("torp.Popover");

/** The shared context for popover components (Contextual, Prompt and Popover) */
export interface PopoverContext extends FocusApi {
	handleButton: (type: "confirm" | "cancel" | undefined, value?: any) => void;
	// HACK: We need to be able to let children (i.e. Dialogs) override the click outside functionality
	// There may be a more elegant way to accomplish this too
	handleClickOutside?: (e: MouseEvent) => void;
	state: PopoverState;
	//modal: boolean;
	anchorElement?: HTMLElement;
}

export interface PopoverState {
	visible: boolean;
	position: Point;
}

export interface Point {
	x: number;
	y: number;
}
