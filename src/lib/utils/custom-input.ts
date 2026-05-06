import { tick } from 'svelte';
import { Menu } from '@tauri-apps/api/menu';
import { readText } from '@tauri-apps/plugin-clipboard-manager';

interface CustomInputParams {
	onCancel?: (el: HTMLDivElement) => void;
	onApply?: (value: string, el: HTMLDivElement) => void;
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
	async function dblClickHandler() {
		node.setAttribute('contenteditable', 'plaintext-only');
	}

	function keyDownHandler(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			params.onCancel?.(node);
			node.blur();
			return;
		}

		if (e.key === 'Enter') {
			e.preventDefault();
			params.onApply?.(node.innerText, node);
			node.blur();
			return;
		}

		if (e.key === 'Tab' && node.getAttribute('contenteditable') === 'plaintext-only') {
			node.setAttribute('contenteditable', 'false');

			const sibling = node.parentElement?.nextElementSibling?.querySelector(
				'[data-editable]'
			) as HTMLDivElement;

			if (sibling) {
				e.preventDefault();
				sibling.setAttribute('contenteditable', 'plaintext-only');
			}
		}
	}

	async function blurHandler() {
		node.setAttribute('contenteditable', 'false');

		await tick();

		node.scrollLeft = 0;
	}

	async function contextMenuHandler(e: MouseEvent) {
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

	node.addEventListener('dblclick', dblClickHandler);
	node.addEventListener('keydown', keyDownHandler);
	node.addEventListener('blur', blurHandler);
	node.addEventListener('contextmenu', contextMenuHandler);

	return {
		update(newParams: CustomInputParams) {
			params = newParams;
		},
		destroy() {
			node.removeEventListener('dblclick', dblClickHandler);
			node.removeEventListener('keydown', keyDownHandler);
			node.removeEventListener('blur', blurHandler);
			node.removeEventListener('contextmenu', contextMenuHandler);
			observer.disconnect();
		}
	};
}

export default customInput;
