export type SvelteActionReturn = {
	destroy?: () => void;
};

export type SvelteAction<T = HTMLElement> = (
	node: T,
	callback: (width: number, done?: boolean) => void
) => SvelteActionReturn;
