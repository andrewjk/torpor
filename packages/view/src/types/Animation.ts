export default interface Animation {
	keyframes: Keyframe[] | PropertyIndexedKeyframes;
	options?: number | KeyframeAnimationOptions;
}
