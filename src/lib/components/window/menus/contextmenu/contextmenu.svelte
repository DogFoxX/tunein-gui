<script lang="ts">
	// Tauri Imports
	import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager';

	// Contextmenu State
	import contextmenu from './state.svelte';

	// Icons
	import {
		Copy,
		ClipboardText,
		Restart,
		Scissors,
		UndoLeft,
		UndoRight
	} from '@solar-icons/svelte/Outline';

	type SelectionResult = {
		start?: number;
		end?: number;
		text: string;
		hasSelection: boolean;
	};

	let contextmenuEl = $state<HTMLElement>();

	function getSelection(
		node: HTMLInputElement | HTMLDivElement | null | undefined
	): SelectionResult | undefined {
		if (!node) return;

		// CONTENTEDITABLE DIV
		if (node instanceof HTMLDivElement) {
			const selection = window.getSelection();

			if (!selection || selection.rangeCount === 0) {
				return {
					text: '',
					hasSelection: false
				};
			}

			const text = selection.toString();

			return {
				text,
				hasSelection: !selection.isCollapsed && text.length > 0
			};
		}

		// INPUT
		const start = node.selectionStart ?? 0;
		const end = node.selectionEnd ?? 0;

		return {
			start,
			end,
			text: node.value.slice(start, end),
			hasSelection: start !== end
		};
	}

	async function cut(node: HTMLInputElement | HTMLDivElement | null | undefined) {
		if (!node) return;

		const selection = getSelection(node);

		if (!selection?.hasSelection) return;

		await writeText(selection.text);

		// CONTENTEDITABLE
		if (node instanceof HTMLDivElement) {
			document.execCommand('delete');

			if (node.innerText.trim() === '') {
				node.innerHTML = '';
			}

			node.dispatchEvent(
				new InputEvent('input', {
					bubbles: true,
					inputType: 'deleteContentBackward'
				})
			);

			return;
		}

		// INPUT
		node.focus();
		node.setSelectionRange(selection.start!, selection.end!);

		document.execCommand('delete');
	}

	async function copy(node: HTMLInputElement | HTMLDivElement | null | undefined) {
		const selection = getSelection(node);

		if (!selection?.hasSelection) return;

		await writeText(selection.text);

		// Clear selection for inputs
		if (node instanceof HTMLInputElement) {
			node.setSelectionRange(selection.end!, selection.end!);
		}
	}

	async function paste(node: HTMLInputElement | HTMLDivElement | null | undefined) {
		if (!node) return;

		const clipboardText = await readText();

		node.focus();

		document.execCommand('insertText', false, clipboardText);
	}

	function canPaste() {
		let clipboardText = '';

		readText().then((value) => (clipboardText = value));

		return clipboardText.length > 0;
	}
</script>

{#if contextmenu.state.visible}
	<div
		bind:this={contextmenuEl}
		onmousedown={(e) => {
			e.preventDefault();
			e.stopPropagation();
		}}
		class="absolute z-999"
		style="top: {contextmenu.state.position?.y}px; left: {contextmenu.state.position?.x}px;"
		data-contextmenu
		role="dialog"
		tabindex="-1"
	>
		<div
			class="flex flex-col gap-1 p-1 bg-primary-800 border border-primary-700 rounded-lg shadow-lg shadow-black/40"
		>
			{#if contextmenu.state.extraItems}
				{#each contextmenu.state.extraItems as { action, text }}
					<div class="flex px-1">
						<button
							onmousedown={(e) => {
								e.stopPropagation();
							}}
							onmouseup={(e) => {
								e.stopPropagation();
								action?.();
								contextmenu.closemenu();
							}}
							class="flex items-center gap-4 py-1 pl-1 pr-3 grow hover:bg-primary-700/50 rounded-sm"
						>
							<span class="flex items-center justify-center size-5">
								<Restart size={16} class="text-primary-400" />
							</span>
							<span class="grow pr-14 text-xs text-left text-primary-200">{text}</span
							>
						</button>
					</div>
				{/each}
				<hr class="h-px w-full text-primary-700/50" />
			{/if}
			<div class="flex flex-col px-1">
				<button
					onmousedown={(e) => {
						e.stopPropagation();
					}}
					onmouseup={(e) => {
						e.stopPropagation();
						document.execCommand('undo');
						contextmenu.closemenu();
					}}
					class="flex items-center gap-4 py-1 pl-1 pr-3 grow hover:bg-primary-700/50 rounded-sm"
					disabled={!document.queryCommandEnabled('undo')}
				>
					<span class="flex items-center justify-center size-5">
						<UndoLeft size={16} class="text-primary-400" />
					</span>
					<span class="grow pr-14 text-xs text-left text-primary-200">Undo</span>
					<span class="text-xs text-primary-400/70">CTRL+Z</span>
				</button>
				<button
					onmousedown={(e) => {
						e.stopPropagation();
					}}
					onmouseup={(e) => {
						e.stopPropagation();
						document.execCommand('redo');
						contextmenu.closemenu();
					}}
					class="flex items-center gap-4 py-1 pl-1 pr-3 grow hover:bg-primary-700/50 rounded-sm"
					disabled={!document.queryCommandEnabled('redo')}
				>
					<span class="flex items-center justify-center size-5">
						<UndoRight size={16} class="text-primary-400" />
					</span>
					<span class="grow pr-14 text-xs text-left text-primary-200">Redo</span>
					<span class="text-xs text-primary-400/70">CTRL+Z</span>
				</button>
			</div>
			<hr class="h-px w-full text-primary-700/50" />
			<div class="flex flex-col px-1">
				<button
					onmousedown={(e) => {
						e.stopPropagation();
					}}
					onmouseup={(e) => {
						e.stopPropagation();
						cut(contextmenu.state.node);
						contextmenu.closemenu();
					}}
					class="flex items-center gap-4 py-1 pl-1 pr-3 grow hover:bg-primary-700/50 rounded-sm"
					disabled={!getSelection(contextmenu.state.node)!.hasSelection}
				>
					<span class="flex items-center justify-center size-5">
						<Scissors size={16} class="text-primary-400" />
					</span>
					<span class="grow pr-14 text-xs text-left text-primary-200">Cut</span>
					<span class="text-xs text-primary-400/70">CTRL+X</span>
				</button>
				<button
					onmousedown={(e) => {
						e.stopPropagation();
					}}
					onmouseup={(e) => {
						e.stopPropagation();
						copy(contextmenu.state.node);
						contextmenu.closemenu();
					}}
					class="flex items-center gap-4 py-1 pl-1 pr-3 grow hover:bg-primary-700/50 rounded-sm"
					disabled={!getSelection(contextmenu.state.node)!.hasSelection}
				>
					<span class="flex items-center justify-center size-5">
						<Copy size={16} class="text-primary-400" />
					</span>
					<span class="grow pr-14 text-xs text-left text-primary-200">Copy</span>
					<span class="text-xs text-primary-400/70">CTRL+C</span>
				</button>
				<button
					onmousedown={(e) => {
						e.stopPropagation();
					}}
					onmouseup={(e) => {
						e.stopPropagation();
						paste(contextmenu.state.node);
						contextmenu.closemenu();
					}}
					class="flex items-center gap-4 py-1 pl-1 pr-3 grow hover:bg-primary-700/50 rounded-sm"
					disabled={canPaste()}
				>
					<span class="flex items-center justify-center size-5">
						<ClipboardText size={16} class="text-primary-400" />
					</span>
					<span class="grow pr-14 text-xs text-left text-primary-200">Paste</span>
					<span class="text-xs text-primary-400/70">CTRL+V</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
</style>
