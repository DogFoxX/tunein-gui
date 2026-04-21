<script lang="ts" generics="T extends Record<string, Component>">
	interface ModalProps<T extends Record<string, Component>> {
		components: T;
		active?: keyof T;
		class?: string;
		open: boolean;
		onOpen?: () => void;
		onClose?: () => void;
		header?: string;
	}

	// Svelte Imports
	import type { Component } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';

	// Stores
	import { modelOpen } from '.';

	// Icons
	import { Close } from '$assets/tg-icons';

	let {
		open = $bindable(),
		onOpen,
		onClose,
		components,
		active,
		class: className,
		header
	}: ModalProps<T> = $props();

	let modal = $state<HTMLElement>();

	const keys = $derived<(keyof T)[]>(Object.keys(components));
	let current = $derived<keyof T>(active ?? keys[0]);

	let Comp = $derived<Component>(components[current]);

	// Focus Trap
	const isTabbable = (node: Element): node is HTMLElement => {
		if (!(node instanceof HTMLElement)) return false;

		const isDisabled =
			node instanceof HTMLButtonElement ||
			node instanceof HTMLInputElement ||
			node instanceof HTMLSelectElement ||
			node instanceof HTMLTextAreaElement
				? node.disabled
				: false;

		const isHiddenInput = node instanceof HTMLInputElement && node.type === 'hidden';

		return (
			node.tabIndex >= 0 &&
			!node.hidden &&
			!isDisabled &&
			!isHiddenInput &&
			node.style.display !== 'none' &&
			Boolean(node.offsetWidth || node.offsetHeight || node.getClientRects().length)
		);
	};

	const handleKeydown = (e: KeyboardEvent) => {
		if (!open) return;

		if (e.key === 'Escape') {
			e.preventDefault();
			open = false;
		}

		if (modal && e.key === 'Tab') {
			// trap focus
			const nodes = modal.querySelectorAll('*');
			const tabbable = Array.from(nodes)
				.filter(isTabbable)
				.sort((a, b) => a.tabIndex - b.tabIndex);

			const active = document.activeElement as HTMLElement | null;

			let index = tabbable.indexOf(active as HTMLElement);
			if (index === -1 && e.shiftKey) index = 0;

			index += tabbable.length + (e.shiftKey ? -1 : 1);
			index %= tabbable.length;

			tabbable[index].focus();
			e.preventDefault();
		}
	};

	$effect(() => modelOpen.set(open));
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
	<div
		transition:fade={{ duration: 180 }}
		bind:this={modal}
		class="absolute inset-0 flex items-center justify-center backdrop-blur-xs"
		role="dialog"
		tabindex="-1"
	>
		<div class="absolute inset-0 bg-primary-700 opacity-70"></div>
		<div
			in:scale={{ start: 0.9, duration: 300, easing: backOut }}
			out:scale={{ start: 0.9, duration: 180 }}
			class={`absolute flex flex-col bg-primary-800 rounded-lg shadow-lg shadow-neutral-900 ${className ?? ''}`}
		>
			<header
				class="relative box-content flex items-center gap-6 min-h-10 px-6 border-b border-primary-750"
			>
				{#if keys.length > 1}
					{#each keys as key}
						<button
							onclick={() => (current = key)}
							class="sett-head-btn relative h-full text-lg text-primary-400 hover:text-white font-semibold transition-colors"
							class:active={current === key}
							tabIndex="-1"
						>
							{key}</button
						>
					{/each}
				{/if}
				{#if header}
					<span class="text-lg text-white font-semibold">{header}</span>
				{/if}
				<button
					onclick={() => (open = false)}
					class="absolute top-1.5 bottom-1.5 right-4 px-2 text-primary-400 hover:text-white hover:bg-primary-700 rounded-md transition-colors"
				>
					<Close size={18} />
				</button>
			</header>
			<div class="relative grow">
				<Comp />
			</div>
		</div>
	</div>
{/if}

<style>
	.sett-head-btn {
		&.active {
			color: white;

			&::after {
				opacity: 100;
			}
		}

		&::after {
			content: '';
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			height: 1px;
			background-color: white;
			opacity: 0;
			transition: 150ms ease-in-out;
		}
	}
</style>
