<script lang="ts">
	// Svelte Imports
	import { onMount } from 'svelte';

	// Tauri Imports
	import { getCurrentWindow } from '@tauri-apps/api/window';
	import { openUrl } from '@tauri-apps/plugin-opener';

	// Components
	import { Sonar } from '$assets/tg-icons/loaders';

	// Utils
	import { fetchMods } from '$lib/utils';
	import importXML from '$lib/utils/xml';
	('$lib/utils/xml');

	// Icons
	import { Flame, Like } from '@solar-icons/svelte/Bold';
	import { Plus } from '$assets/tg-icons';

	onMount(async () => {
		await getCurrentWindow().setTitle('Home - Tunein GUI');
	});
</script>

<div class="flex flex-col items-center gap-8 pt-20 pb-4 size-full bg-primary-700">
	<div class="flex grow gap-10 overflow-hidden">
		<div class="flex flex-col gap-4 grow">
			<header class="text-4xl text-white font-semibold">Get Started</header>
			<ul class="flex flex-col">
				<li>
					<button
						class="flex w-full py-2 text-zinc-400 hover:text-white transition-colors"
						>Open File...</button
					>
				</li>
				<li>
					<button
						onclick={importXML}
						class="flex w-full py-2 text-zinc-400 hover:text-white transition-colors"
						>Import XML...</button
					>
				</li>
			</ul>
		</div>
		<hr class="w-px h-full bg-primary-500" />
		<div id="tg-profiles" class="grid grid-cols-4 gap-1 h-full overflow-y-scroll">
			<button class="flex flex-col gap-2 h-36 w-36 px-4 py-2">
				<span
					class="tg-profile-tile flex items-center justify-center grow w-full text-sky-500 bg-sky-900 border border-sky-600 rounded-xl transition-colors"
				>
					<Plus size={32} />
				</span>
				<span class="text-sm text-primary-400 transition-colors">Create New...</span>
			</button>
		</div>
	</div>
	<div class="flex flex-col items-center gap-8 w-full">
		<header class="flex items-center gap-1 text-4xl">
			<Flame color="var(--color-orange-500)" />
			<span class="text-white font-semibold">Latest Radio Mods</span>
		</header>
		<div class="flex items-center justify-center h-38 w-full px-4 overflow-hidden">
			{#await fetchMods()}
				<Sonar />
			{:then data}
				{@const nexusUrl = 'https://www.nexusmods.com/games/thecrew/mods?tag=Music'}

				<div class="flex gap-4 h-full py-2 overflow-x-scroll">
					{#each data as { author, endorsements, modId, name, pictureUrl }}
						{@const modUrl = `https://www.nexusmods.com/thecrew/mods/${modId}`}

						<button
							onclick={() => openUrl(modUrl)}
							class="relative h-full min-w-52 bg-contain bg-no-repeat bg-center bg-primary-800 border border-primary-500 hover:border-white rounded-xl transition-colors overflow-hidden"
							style="background-image: url({pictureUrl});"
							title={modUrl}
						>
							<div
								class="absolute inset-0 bg-linear-to-t to-50% from-25% from-black"
							></div>
							<div
								class="absolute bottom-0 left-0 right-0 flex flex-col text-left p-1.5 overflow-hidden"
							>
								<span class="text-sm font-semibold text-white truncate">{name}</span
								>
								<div class="flex items-center gap-1.5">
									<span class="text-xs text-zinc-400">{author}</span>
									<span class="text-xs text-zinc-600">|</span>
									<div class="flex items-center gap-1 text-xs text-zinc-400">
										<Like />
										<span>{endorsements}</span>
									</div>
								</div>
							</div>
						</button>
					{/each}
					<button
						onclick={() => openUrl(nexusUrl)}
						class="relative h-full min-w-52 bg-size-[auto_3.5rem] bg-no-repeat bg-center bg-orange-500 border border-orange-300 hover:border-white rounded-xl transition-colors"
						style="background-image: url(https://next.nexusmods.com/assets/images/default/logo-emblem.svg);"
						title={nexusUrl}
					>
						<span
							class="absolute bottom-1.5 left-0 right-0 text-sm font-semibold text-white"
							>Explore more at NexusMods</span
						>
					</button>
				</div>
			{:catch}
				<span class="text-primary-400">Uh-oh. Couldn't fetch latest mods.</span>
			{/await}
		</div>
	</div>
</div>

<style>
	#tg-profiles button:hover {
		span {
			color: white;
		}

		.tg-profile-tile {
			background-color: var(--color-sky-600);
		}
	}
</style>
