import context from "./context";

/**
 * Parses a transform function argument as a number, returning null for
 * anything we can't confidently evaluate (calcs, variables, etc.).
 */
function parseNumber(value: string): number | null {
	if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[a-z%]+)?$/i.test(value.trim())) {
		return null;
	}
	return Number.parseFloat(value);
}

function isZero(value: string): boolean {
	return parseNumber(value) === 0;
}

function isOne(value: string): boolean {
	return parseNumber(value) === 1;
}

function all(args: string[], expected: number, test: (value: string) => boolean): boolean {
	return args.length === expected && args.every(test);
}

function isIdentityFunction(name: string, args: string[]): boolean {
	switch (name) {
		case "matrix": {
			const numbers = args.map(parseNumber);
			return (
				numbers.length === 6 &&
				numbers[0] === 1 &&
				numbers[1] === 0 &&
				numbers[2] === 0 &&
				numbers[3] === 1 &&
				numbers[4] === 0 &&
				numbers[5] === 0
			);
		}
		case "matrix3d": {
			const numbers = args.map(parseNumber);
			const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
			return numbers.length === 16 && numbers.every((value, i) => value === identity[i]);
		}
		case "translate":
			return args.length >= 1 && args.length <= 2 && args.every(isZero);
		case "translatex":
		case "translatey":
		case "translatez":
			return all(args, 1, isZero);
		case "translate3d":
			return all(args, 3, isZero);
		case "scale":
			return args.length >= 1 && args.length <= 2 && args.every(isOne);
		case "scalex":
		case "scaley":
		case "scalez":
			return all(args, 1, isOne);
		case "scale3d":
			return all(args, 3, isOne);
		case "rotate":
		case "rotatex":
		case "rotatey":
		case "rotatez":
		case "skewx":
		case "skewy":
			return all(args, 1, isZero);
		case "rotate3d":
			return args.length === 4 && isZero(args[3]!);
		case "skew":
			return args.length >= 1 && args.length <= 2 && args.every(isZero);
		default:
			return false;
	}
}

/**
 * Whether a transform value is the identity transform (and so creates a
 * containing block without changing what is rendered).
 */
function isIdentityTransform(value: string): boolean {
	const transform = value.trim().toLowerCase();
	if (transform === "" || transform === "none") {
		return true;
	}

	let rest = transform;
	while (rest.length > 0) {
		const match = /^([a-z0-9]+)\(([^()]*)\)/.exec(rest);
		if (!match) {
			return false;
		}
		const args = match[2]!.split(",").map((arg) => arg.trim());
		if (!isIdentityFunction(match[1]!, args)) {
			return false;
		}
		rest = rest.slice(match[0].length).trim();
	}
	return true;
}

/**
 * Replaces a final identity transform in the keyframes with `none`.
 *
 * A forwards-filled animation keeps its final keyframe applied after it
 * finishes. When that keyframe's transform is the identity, the only visible
 * difference from not animating the transform at all is the side effect: any
 * non-`none` transform makes the element the containing block for fixed
 * descendants (so fixed-position popovers/tooltips inside it are positioned
 * against it rather than the viewport). Ending on `none` instead keeps the
 * animation's other persisted properties while letting the transform effect
 * go away.
 */
function withoutFinalIdentityTransform(
	keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
): Keyframe[] | PropertyIndexedKeyframes | null {
	if (keyframes === null) {
		return null;
	}

	if (Array.isArray(keyframes)) {
		let index = keyframes.length - 1;
		while (index >= 0 && keyframes[index] == null) {
			index--;
		}
		if (index < 0) {
			return keyframes;
		}
		const last = keyframes[index]!;
		if (typeof last.transform !== "string" || !isIdentityTransform(last.transform)) {
			return keyframes;
		}
		const next = keyframes.slice();
		next[index] = { ...last, transform: "none" };
		return next;
	}

	const transform = keyframes.transform;
	if (Array.isArray(transform)) {
		const last = transform[transform.length - 1];
		if (typeof last !== "string" || !isIdentityTransform(last)) {
			return keyframes;
		}
		const values = transform.slice();
		values[values.length - 1] = "none";
		return { ...keyframes, transform: values };
	}
	if (typeof transform === "string" && isIdentityTransform(transform)) {
		return { ...keyframes, transform: "none" };
	}
	return keyframes;
}

/**
 * Adds an animation for an element
 * @param el The element to animate
 * @param enter Whether the animation is being run on enter
 * @param keyframes The Web Animation API keyframes
 * @param options The Web Animmation API options
 */
export default async function animate(
	el: HTMLElement,
	enter: boolean,
	keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
	options?: number | KeyframeAnimationOptions,
): Promise<void> {
	// This is quite simplistic
	// We might need to
	// - store the animation
	// - reverse it if it's running and the region appears/disappears
	// - transfer the animation to the new element
	let animationOptions = Object.assign(
		{
			direction: enter ? "normal" : "reverse",
			// TODO: Should probably have a global setting for these somewhere
			// And respect browser reduce motion settings
			duration: 300,
			easing: "ease-in-out",
			fill: "forwards",
		},
		options,
	);

	// An enter animation with `fill: "forwards"` keeps its final transform
	// applied after it finishes. End on `none` when that transform is the
	// identity, so the element stops being a containing block for fixed
	// descendants (see withoutFinalIdentityTransform).
	const persisted = animationOptions.fill === "forwards" || animationOptions.fill === "both";
	const effectiveKeyframes =
		enter === true && persisted ? withoutFinalIdentityTransform(keyframes) : keyframes;

	const animation = el.animate(effectiveKeyframes, animationOptions);

	// HACK: I'm not entirely sure why we need to sent the animation's timeline,
	// but without it, animations never start
	// HACK: We also need to make sure the element has been added to the DOM
	// with a timeout
	setTimeout(() => {
		animation.timeline = el.ownerDocument.timeline;
	}, 1);

	// Add the animation to the active region, so that the region won't be cleared
	// until the animation is completed
	const activeRegion = context.activeRegion;
	// TODO: An option for whether to await or cancel events on region remove
	// e.g. if you are doing a client side navigation, you don't want to run animations
	activeRegion.animations ??= new Set();
	activeRegion.animations.add(animation);

	await animation.finished;
}
