<script lang="ts">
	// Svelte Imports
	import { scale } from 'svelte/transition';

	// Tauri Imports
	import { getVersion } from '@tauri-apps/api/app';
	import { openUrl } from '@tauri-apps/plugin-opener';

	// Icons
	import { SquareTopDown } from '@solar-icons/svelte/Outline';

	// Stores
	import { settings } from '$lib/stores';
</script>

<div transition:scale={{ start: 0.9, duration: 100 }} class="absolute inset-4 flex flex-col">
	<div class="flex grow flex-col items-center justify-center gap-4 px-16">
		<h1 class="text text-center text-white">
			An unofficial GUI for creating custom radio station mods for The Crew (2014)
		</h1>
		<div class="flex flex-col items-center gap-2">
			<h1 class="text-lg font-bold text-white">GUI by DogFoxX</h1>
			<button
				onclick={() => openUrl('https://github.com/DogFoxX/tunein-gui')}
				class="flex items-center gap-2 text-sm text-blue-200 underline"
			>
				<span>github.com/DogFoxX/tunein-gui</span>
				<SquareTopDown />
			</button>
		</div>
		<div class="flex flex-col items-center gap-2">
			<h1 class="text-lg font-bold text-white">TuneinCrew by FTIW</h1>
			<button
				onclick={() => openUrl('https://github.com/Telonof/TuneinCrew')}
				class="flex items-center gap-2 text-sm text-blue-200 underline"
			>
				<span>github.com/Telonof/TuneinCrew</span>
				<SquareTopDown />
			</button>
		</div>
		<div class="flex gap-4 py-4">
			<div class="flex gap-2">
				<span class="text-sm text-primary-400">GUI Version:</span>
				{#await getVersion() then version}
					<span class="text-sm font-bold text-primary-400">v{version}</span>
				{/await}
			</div>
			<div class="flex gap-2">
				<span class="text-sm text-primary-400">TuneinCrew Version:</span>
				<span class="text-sm font-bold text-primary-400"
					>{settings.tuneinCrewVersion ?? 'N/A'}</span
				>
			</div>
		</div>
	</div>
</div>

<style>
</style>
