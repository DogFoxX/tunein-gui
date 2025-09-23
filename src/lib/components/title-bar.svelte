<script lang="ts">
	import SolarRadioMinimalisticBold from '~icons/solar/radio-minimalistic-bold';
	import { getCurrentWindow } from '@tauri-apps/api/window';
	import { onMount } from 'svelte';

	let isMax = $state<boolean>();

	const window = {
		minimize: () => getCurrentWindow().minimize(),
		maximize: async () => getCurrentWindow().toggleMaximize(),
		close: () => getCurrentWindow().close()
	};

	onMount(async () => {
		isMax = await getCurrentWindow().isMaximized();
	});

	getCurrentWindow().onResized(async () => (isMax = await getCurrentWindow().isMaximized()));
</script>

<div id="title-bar" class="bg-primary fixed top-0 right-0 left-0 h-9">
	<div class="flex items-center gap-2 p-2">
		<SolarRadioMinimalisticBold width="20" height="20" color="white" />
		<label for="" class="text-xs font-semibold text-white">TUNEIN GUI</label>
	</div>
	<div class="absolute top-0 right-0 bottom-0 flex">
		<button
			onclick={window.minimize}
			class="window-controls no-drag flex h-[29px] w-[45px] items-center justify-center"
			aria-label="minimize"
			title="Minimize"
			tabindex="-1"
		>
			<svg
				class="stroke-neutral-300"
				width="29"
				height="29"
				viewBox="0 0 29 29"
				xmlns="http://www.w3.org/2000/svg"
				style="shape-rendering: crispEdges;"
			>
				<line x1="10" y1="15" x2="20" y2="15" stroke-width="1" />
			</svg>
		</button>
		<button
			onclick={window.maximize}
			class="window-controls no-drag flex h-[29px] w-[45px] items-center justify-center"
			aria-label="maximize"
			title={isMax ? 'Restore' : 'Maximize'}
			tabindex="-1"
		>
			{#if isMax}
				<svg
					class="stroke-neutral-300"
					width="29"
					height="29"
					viewBox="0 0 29 29"
					xmlns="http://www.w3.org/2000/svg"
					style="shape-rendering: crispEdges;"
				>
					<line x1="10" y1="10" x2="19" y2="10" stroke-width="1" />
					<line x1="19" y1="10" x2="19" y2="18" stroke-width="1" />
					<rect
						x="9"
						y="12"
						width="8"
						height="8"
						stroke-width="1"
						fill="none"
						vector-effect="non-scaling-stroke"
					/>
				</svg>
			{:else}
				<svg
					class="stroke-neutral-300"
					width="29"
					height="29"
					viewBox="0 0 29 29"
					xmlns="http://www.w3.org/2000/svg"
					style="shape-rendering: crispEdges;"
				>
					<rect x="10" y="10" width="10" height="10" stroke-width="1" fill="none" />
				</svg>
			{/if}
		</button>
		<button
			onclick={window.close}
			class="window-controls no-drag close flex h-[29px] w-[45px] items-center justify-center"
			title="Close"
			aria-label="Close"
		>
			<svg
				class="stroke-neutral-300"
				width="29"
				height="29"
				viewBox="0 0 29 29"
				xmlns="http://www.w3.org/2000/svg"
				style="shape-rendering: crispEdges;"
			>
				<line x1="9" y1="9" x2="19" y2="19" stroke-width="1" />
				<line x1="19" y1="9" x2="9" y2="19" stroke-width="1" />
			</svg>
		</button>
	</div>
</div>

<style>
	#title-bar {
		-webkit-app-region: drag;
		z-index: 999;
	}

	.window-controls {
		cursor: default;
		transition: 100ms background-color ease-in-out;

		&:hover:not(.close) {
			background-color: var(--color-neutral-700);
		}

		&.close:hover {
			background-color: var(--color-close-red);

			svg {
				stroke: white;
			}
		}
	}

	.no-drag {
		-webkit-app-region: no-drag;
	}
</style>
