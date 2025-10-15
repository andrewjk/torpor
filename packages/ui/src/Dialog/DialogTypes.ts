export const DialogContextName = "Dialog";

export type HandleButtonPress = (type: "confirm" | "cancel" | undefined, value?: any) => void;

export interface DialogContext {
	handleButton: HandleButtonPress;
	state: DialogState;
	anchorElement?: HTMLElement;
	confirmButton?: HTMLButtonElement;
	cancelButton?: HTMLButtonElement;
}

export interface DialogState {
	dialogId: string;
	headerId: string;
	bodyId: string;
	visible: boolean;
}
