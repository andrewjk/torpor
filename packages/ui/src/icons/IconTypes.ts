import type { ClassValue, StyleValue } from "@torpor/view";

export interface IconProps {
	/** An ID for the svg element */
	id?: string;
	/** Classes for the svg element */
	class?: ClassValue;
	/** Styles for the root element */
	style?: StyleValue;
}
