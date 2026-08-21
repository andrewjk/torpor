import { type PopoutContext, type PopoutState } from "../utils/PopoutTypes";

export const ModalContextName: unique symbol = Symbol.for("torp.Modal");

/** The shared context for modal components (Contextual, Prompt and Modal) */
export interface ModalContext extends PopoutContext {
	state: ModalState;
}

/** A modal's state is exactly the shared popout state */
export type ModalState = PopoutState;
