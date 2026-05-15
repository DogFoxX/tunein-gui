import { tick } from 'svelte';

import contextmenu from '$lib/components/window/menus/contextmenu/state.svelte';

interface CustomInputParams {
	value: string;
	focusNext?: () => void;
	onclose?: (detail: { node: HTMLDivElement; value: string; cancelled?: boolean }) => void;
}

function customInput(node: HTMLDivElement, params: CustomInputParams) {
	node.innerText = params.value ?? '';

	let closing = false;

	async function ondblclick() {
		node.setAttribute('contenteditable', 'plaintext-only');
	}

	async function onkeydown(e: KeyboardEvent) {
		if (contextmenu.state.visible) {
			e.preventDefault();
			return;
		}

		if (e.key === 'Escape') {
			e.preventDefault();

			closeEdit(true);
			return;
		}

		if (e.key === 'Enter') {
			e.preventDefault();

			closeEdit();
			return;
		}

		if (e.key === 'Tab' && node.getAttribute('contenteditable') === 'plaintext-only') {
			closeEdit();

			await tick();

			const parentSibling = node.parentElement?.parentElement?.nextElementSibling as
				| HTMLElement
				| null
				| undefined;

			const sibling = node.parentElement?.nextElementSibling?.querySelector(
				'[data-editable]'
			) as HTMLDivElement;

			if (sibling) {
				e.preventDefault();
				sibling.setAttribute('contenteditable', 'plaintext-only');
			} else {
				if (!parentSibling) return;
				params.focusNext?.();

				const firstFocus = parentSibling.querySelectorAll('[data-editable]')[1];

				e.preventDefault();
				firstFocus.setAttribute('contenteditable', 'plaintext-only');
			}
		}
	}

	async function closeEdit(cancelled?: boolean) {
		if (closing) return;
		closing = true;

		node.setAttribute('contenteditable', 'false');

		await tick();

		params.onclose?.({
			node,
			value: node.innerText,
			cancelled
		});

		node.scrollLeft = 0;

		await tick();

		closing = false;
	}

	function onWindowBlur() {
		if (node.getAttribute('contenteditable') !== 'plaintext-only') return;
		closeEdit();
	}

	function onWindowMouseDown(e: MouseEvent) {
		const target = e.target as HTMLElement;

		const clickedInsideEditor = node.contains(target);

		const clickedInsideContextMenu = !!target.closest('[data-contextmenu]');

		if (!clickedInsideEditor && !clickedInsideContextMenu) {
			closeEdit();
		}
	}

	async function checkAttibute() {
		await tick();

		if (node.getAttribute('contenteditable') === 'plaintext-only') {
			const range = document.createRange();
			range.selectNodeContents(node);

			const selection = window.getSelection();
			selection?.removeAllRanges();
			selection?.addRange(range);
		}
	}

	const observer = new MutationObserver((mutations) => {
		for (const m of mutations) {
			if (m.type === 'attributes' && m.attributeName === 'contenteditable') {
				checkAttibute();
			}
		}
	});

	observer.observe(node, {
		attributes: true,
		attributeFilter: ['contenteditable']
	});

	node.addEventListener('dblclick', ondblclick);
	node.addEventListener('keydown', onkeydown);
	window.addEventListener('mousedown', onWindowMouseDown);
	window.addEventListener('blur', onWindowBlur);

	return {
		update(newParams: CustomInputParams) {
			params = newParams;

			if (document.activeElement !== node) {
				node.innerText = params.value ?? '';
			}
		},
		destroy() {
			node.removeEventListener('dblclick', ondblclick);
			node.removeEventListener('keydown', onkeydown);
			window.removeEventListener('mousedown', onWindowMouseDown);
			window.removeEventListener('blur', onWindowBlur);
			observer.disconnect();
		}
	};
}

export default customInput;
