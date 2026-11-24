import type SourceSpan from "../SourceSpan";
import type TemplateNode from "./TemplateNode";

export default interface TextNode extends TemplateNode {
	type: "text";
	content: string;
	/** Absolute source index where `content` begins (set by parseText). */
	start?: number;
	//reactive: boolean;
	spans: SourceSpan[];
	/**
	 * Raw-text content (e.g. inside `<script>` / `<style>`). It is emitted
	 * verbatim: no interpolation, whitespace collapsing or HTML escaping.
	 */
	raw?: boolean;
}
