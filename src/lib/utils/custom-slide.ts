import type { TransitionConfig } from 'svelte/transition';

export function tgSlide(node: HTMLElement, { duration = 1000 } = {}): TransitionConfig {
	const width = node.getBoundingClientRect().width;

	return {
		duration,
		css: (t) => `
			max-width: ${t * width}px;
			opacity: ${t};
		`
	};
}
