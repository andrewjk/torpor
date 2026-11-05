import type EmbedArtifact from "../types/EmbedArtifact";

const STYLE_ATTRIBUTE = "data-torpor-embed";

/**
 * Injects an artifact's styles into the document, deduped by artifact id.
 *
 * @param nonce A CSP nonce for the injected `<style>` element, when the
 * host's policy uses style-src nonces
 * @returns Whether anything was injected
 */
export default function injectStyles(artifact: EmbedArtifact, nonce?: string): boolean {
	if (artifact.styles.length === 0) return false;
	const document = window.document;
	if (document.querySelector(`style[${STYLE_ATTRIBUTE}="${artifact.id}"]`)) return false;
	const style = document.createElement("style");
	style.setAttribute(STYLE_ATTRIBUTE, artifact.id);
	if (nonce !== undefined) style.setAttribute("nonce", nonce);
	style.textContent = artifact.styles.map((s) => s.style).join("\n");
	document.head.appendChild(style);
	return true;
}

/**
 * Removes the styles that were injected for an artifact.
 */
export function removeStyles(artifact: EmbedArtifact): void {
	const document = window.document;
	for (const style of document.querySelectorAll(`style[${STYLE_ATTRIBUTE}="${artifact.id}"]`)) {
		style.remove();
	}
}
