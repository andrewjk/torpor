import type Template from "../../types/Template";

/**
 * Binds `$data` in a parsed template whose requirements come from an app
 * manifest (see `@torpor/embed/app`): inserts the `let $data = …` chunk
 * after the start-marker chunk and keeps `$props` from being renamed as an
 * unused param. Without it, builds reference an undeclared `$data`.
 */
export default function bindDataTemplate(template: Template): void {
	// Insert the binding as its own chunk after the `/* @start */` marker:
	// the builds match that marker by exact string, so it must stay intact.
	for (let i = 0; i < template.script.length; i++) {
		if (template.script[i].script === "/* @start */") {
			template.script.splice(i + 1, 0, {
				script: " let $data = $props?.$data ?? {};",
				span: { start: 0, end: 0 },
			});
			i += 1;
		}
	}
	for (const component of template.components) {
		if (!component.props?.length) component.props = ["$data"];
	}
}
