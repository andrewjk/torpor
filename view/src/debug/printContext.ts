import hash from "../compile/internal/hash";
import context from "../global/context";

export default function printContext(message?: string) {
	const print: any = {};
	const effectsMap = new Map<string, string>();

	print.objectEffects = [];
	for (let [target, propEffects] of context.objectEffects.entries()) {
		let effectTarget = { target: JSON.stringify(target), props: [] } as any;
		for (let [prop, effects] of propEffects.entries()) {
			let effectProp = { prop, effects: [] } as any;
			effectTarget.props.push(effectProp);
			for (let x of effects) {
				let runText = String(x.run);
				let runName = runText.substring("function ".length, runText.indexOf("{") - 1).trim();
				let cleanupText = String(x.cleanup);
				effectProp.effects.push({
					effect: `${runName} => ${hash(runText)}`,
					cleanup: cleanupText,
				});
				effectsMap.set(hash(String(x.run)), String(x.run));
			}
		}
		print.objectEffects.push(effectTarget);
	}

	/*
	print.rangeEffects = [];
	for (let [range, effect] of context.rangeEffects.entries()) {
		if (effect.size) {
			for (let x of effect) {
				print.rangeEffects.push({
					startNode: range.startNode?.textContent,
					endNode: range.endNode?.textContent,
					//children: (range.children || []).map((c) => c.title),
					target: x.target,
					prop: x.prop,
					effect: hash(String(x.effect)),
				});
				effectsMap.set(hash(String(x.effect)), String(x.effect));
			}
		} else {
			print.rangeEffects.push({
				startNode: range.startNode?.textContent,
				endNode: range.endNode?.textContent,
				//children: (range.children || []).map((c) => c.title),
				target: undefined,
				prop: undefined,
				effect: undefined,
			});
		}
	}
	*/
	/*
	print.rangeEffects = [];
	for (let [range, effect] of context.rangeEffects.entries()) {
		if (effect.size) {
			for (let x of effect) {
				print.rangeEffects.push({
					startNode: range.startNode?.textContent,
					endNode: range.endNode?.textContent,
					//children: (range.children || []).map((c) => c.title),
					effect: hash(String(x)),
				});
				effectsMap.set(hash(String(x)), String(x));
			}
		} else {
			print.rangeEffects.push({
				startNode: range.startNode?.textContent,
				endNode: range.endNode?.textContent,
				//children: (range.children || []).map((c) => c.title),
				effect: undefined,
			});
		}
	}
	*/

	//print.effects = [];
	//for (let [hash, value] of effectsMap.entries()) {
	//	print.effects.push({ hash, value });
	//}

	if (message) {
		console.log(message);
	}
	console.log(print);
	console.dir(print, { depth: null });
}
