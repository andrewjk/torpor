export const CarouselContextName: unique symbol = Symbol.for("torp.Carousel");

export interface SlideState {
	/** The index of the slide */
	index: number;
}

export interface CarouselContext {
	/** Called from a slide when it is added */
	registerSlide: () => SlideState;
	/** Called from a slide when it is removed */
	removeSlide: (index: number) => void;
	/** Moves to the slide at the given index */
	goToSlide: (index: number) => void;
	/** Moves to the next slide */
	nextSlide: () => void;
	/** Moves to the previous slide */
	previousSlide: () => void;
	/** Whether the slide at the given index is the active one */
	isActive: (index: number) => boolean;
	/** Whether the next / previous controls can move from the current slide */
	canNext: () => boolean;
	canPrevious: () => boolean;
	/** The reactive list of registered slides */
	slides: () => SlideState[];
	/** The number of registered slides */
	count: () => number;
}
