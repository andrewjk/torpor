import { type HandleButtonPress } from "../utils/PopoutTypes";

export const DialogContextName: unique symbol = Symbol.for("torp.Dialog");

export interface DialogContext {
	handleButton?: HandleButtonPress;
	state: DialogState;
	anchorElement?: HTMLElement;
	confirmButton?: HTMLButtonElement;
	cancelButton?: HTMLButtonElement;
}

export interface DialogState {
	dialogId: string;
	headerId: string;
	bodyId: string;
}
