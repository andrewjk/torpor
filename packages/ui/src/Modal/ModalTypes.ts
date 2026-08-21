import { type FocusApi } from "../utils/PopoutTypes";

export const ModalContextName: unique symbol = Symbol.for("torp.Modal");

/** The shared context for modal components (Contextual, Prompt and Modal) */
export interface ModalContext extends FocusApi {
	handleButton: (type: "confirm" | "cancel" | undefined, value?: any) => void;
	// HACK: We need to be able to let children (i.e. Dialogs) override the click outside functionality
	// There may be a more elegant way to accomplish this too
	handleClickOutside?: (e: MouseEvent) => void;
	state: ModalState;
}

export interface ModalState {
	visible: boolean;
}
