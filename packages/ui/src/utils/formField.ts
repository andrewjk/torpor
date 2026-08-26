import type { FieldContext, FormContext } from "../Form/FormTypes";

export interface FormField {
	/** The resolved form data field name: the component's name, or the enclosing Field's */
	name: string | undefined;
	/** Whether this component is contained within a Form Field */
	inField: boolean;
	/** Whether the Field's value is valid; always true outside a Field */
	valid: boolean;
	/** The ID of the Field's Message component, for aria-describedby */
	messageId: string | undefined;
	/** Called after the value has been changed by user interaction */
	handleInput: () => void;
	/** Called when the component loses focus */
	handleBlur: () => void;
}

/**
 * Wires a standalone input component into an enclosing Form and Field, in
 * the same way as the components in the Form family: the Field's name is
 * used when the component doesn't set one, validation runs as the user
 * interacts, and the standard validity attributes can be applied.
 *
 * Usage inside a component:
 *
 * ```ts
 * const form = createFormField(
 * 	$props?.name,
 * 	$context[FormContextName] as FormContext | undefined,
 * 	$context[FieldContextName] as FieldContext | undefined,
 * );
 * ```
 */
export default function createFormField(
	name: string | undefined,
	formContext: FormContext | undefined,
	fieldContext: FieldContext | undefined,
): FormField {
	let blurred = false;

	return {
		get name() {
			return name ?? fieldContext?.name;
		},
		get inField(): boolean {
			return fieldContext !== undefined;
		},
		get valid(): boolean {
			if (!fieldContext) return true;
			return fieldContext.state.valid !== false;
		},
		get messageId(): string | undefined {
			return fieldContext?.state.messageId;
		},
		handleInput() {
			if (formContext) {
				formContext.validate();
			}
			if (fieldContext && blurred) {
				fieldContext.validate();
			}
		},
		handleBlur() {
			if (fieldContext) {
				fieldContext.validate();
			}
			blurred = true;
		},
	};
}
