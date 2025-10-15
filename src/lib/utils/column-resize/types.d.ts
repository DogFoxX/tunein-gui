export type SvelteActionReturn = {
	destroy?: () => void;
};

export type SvelteAction<T = HTMLElement> = (node: T) => SvelteActionReturn;
