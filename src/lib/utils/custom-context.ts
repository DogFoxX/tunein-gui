import { Menu, type MenuItem, type MenuItemOptions } from '@tauri-apps/api/menu';
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager';

interface ExtraItem {
	text?: string;
	action?: () => void;
	accelerator?: string;
}

type InputEl = HTMLInputElement | HTMLTextAreaElement;

function getSelection(el: InputEl) {
	const start = el.selectionStart ?? 0;
	const end = el.selectionEnd ?? 0;

	return {
		start,
		end,
		hasSelection: start !== end
	};
}

async function cut(el: InputEl) {
	const { start, end, hasSelection } = getSelection(el);
	if (!hasSelection) return;

	const selected = el.value.slice(start, end);
	await writeText(selected);

	el.setRangeText('', start, end, 'start');
	el.dispatchEvent(new Event('input'));
}

async function copy(el: InputEl) {
	const { start, end, hasSelection } = getSelection(el);
	if (!hasSelection) return;

	await writeText(el.value.slice(start, end));
}

async function paste(el: InputEl) {
	const text = await readText();
	if (!text) return;

	const { start, end } = getSelection(el);

	el.setRangeText(text, start, end, 'end');
	el.dispatchEvent(new Event('input'));
}

function canUndo(el: InputEl) {
	return document.queryCommandEnabled('undo');
}

function canRedo(el: InputEl) {
	return document.queryCommandEnabled('redo');
}

async function buildMenu(el: InputEl, extraItem?: MenuItemOptions) {
	const { hasSelection } = getSelection(el);

	let clipboardText = '';
	try {
		clipboardText = await readText();
	} catch {}

	const canPaste = clipboardText.length > 0;

	return await Menu.new({
		items: [
			...(extraItem ? [extraItem, { item: 'Separator' as const }] : []),

			{
				text: 'Undo',
				accelerator: 'Ctrl+Z',
				enabled: canUndo(el),
				action: () => document.execCommand('undo')
			},
			{
				text: 'Redo',
				accelerator: 'Ctrl+Y',
				enabled: canRedo(el),
				action: () => document.execCommand('redo')
			},
			{ item: 'Separator' as const },
			{
				text: 'Cut',
				accelerator: 'Ctrl+X',
				enabled: hasSelection,
				action: () => cut(el)
			},
			{
				text: 'Copy',
				accelerator: 'Ctrl+C',
				enabled: hasSelection,
				action: () => copy(el)
			},
			{
				text: 'Paste',
				accelerator: 'Ctrl+V',
				enabled: canPaste,
				action: () => paste(el)
			}
		]
	});
}

function customContext(
	node: HTMLInputElement | HTMLTextAreaElement,
	extraItem?: () => MenuItemOptions
) {
	const handler = async (e: Event) => {
		e.preventDefault();

		const menu = await buildMenu(node, extraItem?.());
		await menu.popup();
	};

	node.addEventListener('contextmenu', handler);

	return {
		destroy() {
			node.removeEventListener('contextmenu', handler);
		}
	};
}

export default customContext;
