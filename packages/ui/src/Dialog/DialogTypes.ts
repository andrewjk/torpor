export const DialogContextName = "Dialog";

export interface DialogContext {
	handleButton: (type: "confirm" | "cancel" | undefined, value?: any) => void;
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
