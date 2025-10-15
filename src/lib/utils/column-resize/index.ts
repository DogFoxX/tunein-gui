import type { SvelteAction } from './types.d.ts';

const columnResize: SvelteAction<HTMLButtonElement> = (node) => {
	let startX = 0;
	let startWidth = 0;
	let parent: HTMLElement | null = null;

	function onMouseDown(e: MouseEvent) {
		e.preventDefault();

		parent = node.parentElement;
		if (!parent) return;

		startX = e.clientX;
		startWidth = parent.offsetWidth;

		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
		document.body.style.cursor = 'col-resize';
	}

	function onMouseMove(e: MouseEvent) {
		if (!parent) return;
		const deltaX = e.clientX - startX;
		const newWidth = Math.max(25, startWidth + deltaX);
		parent.style.width = `${newWidth}px`;
	}

	function onMouseUp() {
		document.removeEventListener('mousemove', onMouseMove);
		document.removeEventListener('mouseup', onMouseUp);
		document.body.style.cursor = '';
	}

	node.addEventListener('mousedown', onMouseDown);

	return {
		destroy() {
			node.removeEventListener('mousedown', onMouseDown);
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
		}
	};
};

export default columnResize;
