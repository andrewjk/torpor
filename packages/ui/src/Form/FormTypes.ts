import { type StandardSchemaV1 } from "./StandardSchemaV1";

export const FormContextName: unique symbol = Symbol("Form");
export const FieldContextName: unique symbol = Symbol("Field");

export interface ValidationIssue {
	path: string;
	message: string;
}

export interface FormContext {
	schema?: StandardSchemaV1;
	state: {
		issues: ValidationIssue[];
	};
	validate: () => void;
}

export interface FieldContext {
	name: string;
	schema?: StandardSchemaV1;
	state: {
		inputId: string;
		value?: any;
		issues: ValidationIssue[];
		valid: boolean;
		message: string;
	};
	validate: () => void;
}
