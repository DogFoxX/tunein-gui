import { tick } from 'svelte';
import { Menu } from '@tauri-apps/api/menu';
import { readText } from '@tauri-apps/plugin-clipboard-manager';

interface CustomInputParams {
	value: string;
	focusNext?: () => void;
	onclose?: (detail: { node: HTMLDivElement; value: string; cancelled?: boolean }) => void;
}

function hasEditableSelection() {
	const selection = window.getSelection();
	return !!selection && !selection.isCollapsed;
}

async function canPaste() {
	try {
		return (await readText()).length > 0;
	} catch {
		return false;
	}
}

// Context Menu Builder
async function buildMenu() {
	const hasSelection = hasEditableSelection();
	const pasteAvailable = await canPaste();

	return await Menu.new({
		items: [
			{
				text: 'Undo',
				accelerator: 'Ctrl+Z',
				enabled: document.queryCommandEnabled('undo'),
				action: () => document.execCommand('undo')
			},
			{
				text: 'Redo',
				accelerator: 'Ctrl+Y',
				enabled: document.queryCommandEnabled('redo'),
				action: () => document.execCommand('redo')
			},
			{ item: 'Separator' as const },
			{
				text: 'Cut',
				accelerator: 'Ctrl+X',
				enabled: hasSelection,
				action: () => document.execCommand('cut')
			},
			{
				text: 'Copy',
				accelerator: 'Ctrl+C',
				enabled: hasSelection,
				action: () => document.execCommand('copy')
			},
			{
				text: 'Paste',
				accelerator: 'Ctrl+V',
				enabled: pasteAvailable,
				action: async () => {
					const text = await readText();
					document.execCommand('insertText', false, text);
				}
			}
		]
	});
}

function customInput(node: HTMLDivElement, params: CustomInputParams) {
	node.innerText = params.value ?? '';

	let closing = false;

	const parentSibling = node.parentElement?.parentElement?.nextElementSibling as
		| HTMLElement
		| null
		| undefined;

	async function ondblclick() {
		node.setAttribute('contenteditable', 'plaintext-only');
	}

	async function onkeydown(e: KeyboardEvent) {
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

	function onblur() {
		closeEdit();
	}

	async function oncontextmenu(e: MouseEvent) {
		if (node.getAttribute('contenteditable') !== 'plaintext-only') return;

		e.preventDefault();

		const menu = await buildMenu();
		await menu.popup();
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
	node.addEventListener('blur', onblur);
	node.addEventListener('contextmenu', oncontextmenu);

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
			node.removeEventListener('blur', onblur);
			node.removeEventListener('contextmenu', oncontextmenu);
			observer.disconnect();
		}
	};
}

export default customInput;
