<script lang="ts">
	// Tauri Imports
	import { getCurrentWindow } from '@tauri-apps/api/window';

	// Tables Components
	import { SongsTable } from './tables';

	// Stores
	import { tabs } from '$lib/stores';
	import { radioData } from '$lib/stores';

	// Icons
	import { Bolt } from '@solar-icons/svelte/BoldDuotone';
	import { Diskette, Tuning2 } from '@solar-icons/svelte/Bold';
	import JinglesTable from './tables/jingles-table.svelte';

	let radioStoreData = $derived(
		radioData.state.find(
			(tabData) => tabData.tabId === tabs.state.find((tab) => tab.active)?.id
		)
	);

	$effect(() => {
		getCurrentWindow().setTitle(`${radioStoreData?.configuration.radioName} - Tunein GUI`);
	});
</script>

<div class="flex flex-col size-full">
	<div class="flex gap-10 p-4 bg-primary-700 overflow-hidden">
		<div class="flex flex-col gap-2">
			<button
				class="flex items-center justify-center px-10 py-3 text-xl text-white bg-orange-600/50 hover:bg-orange-600 border border-orange-600 rounded-lg transition-colors"
				title="Create Radio"
			>
				<Bolt />
			</button>
			<button
				class="flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-white bg-primary-900/50 hover:bg-primary-800/50 border border-primary-600 rounded-lg transition-colors"
			>
				<Diskette size={16} />
				<span>Save</span>
			</button>
			<button
				onclick={() =>
					radioData.openConfig({
						header: `Configure ${radioStoreData?.configuration.radioName}`,
						tabId: radioStoreData?.tabId
					})}
				class="flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-white bg-primary-900/50 hover:bg-primary-800/50 border border-primary-600 rounded-lg transition-colors"
			>
				<Tuning2 size={16} />
				<span>Configure</span>
			</button>
		</div>
		<div class="flex flex-col gap-2">
			<header class="pb-1.5 text-white text-lg font-semibold border-b border-primary-600">
				Basic Overview
			</header>
			<div class="flex grow items-center gap-4">
				<div class="relative size-21.5 overflow-hidden">
					{#if radioData}
						{@const src = radioStoreData?.configuration.logo.data}
						{#if !src}
							<div
								class="absolute inset-0 flex items-center justify-center bg-primary-600 rounded-lg"
							>
								<span class="text-sm text-primary-400 font-bold">No Logo</span>
							</div>
						{:else}
							<img height="512" width="512" class="absolute inset-0" {src} alt="" />
						{/if}
					{/if}
				</div>
				<div class="flex flex-col gap-4">
					<div class="flex flex-col gap-2 px-2">
						<div class="flex gap-2">
							<div class="flex gap-2 px-3 py-1.5 bg-primary-900/50 rounded-lg">
								<span class="text-sm text-emerald-400 font-medium">ID:</span>
								<span class="w-[4ch] text-primary-300 text-sm"
									>{radioStoreData?.configuration.radioId}</span
								>
							</div>
							<div class="flex gap-2 w-50 rounded-md bg-primary-900/50 px-3 py-1.5">
								<span class="text-sm text-emerald-400 font-medium">Force:</span>
								<span class="text-primary-300 text-sm"
									>{radioStoreData?.configuration.force.enabled
										? radioStoreData?.configuration.force.value === '0'
											? 'Disabled (0)'
											: radioStoreData?.configuration.force.value
										: 'Default (80)'}</span
								>
							</div>
							<div class="flex gap-2 w-50 px-3 py-1.5 bg-primary-900/50 rounded-lg">
								<span class="text-sm text-emerald-400 font-medium"
									>Target Volume:</span
								>
								<span class="text-primary-300 text-sm"
									>{radioStoreData?.configuration.volume.enabled
										? `${radioStoreData?.configuration.volume.value} dB`
										: 'Disabled'}</span
								>
							</div>
						</div>
						<div class="flex gap-2 w-full">
							<div
								class="flex flex-1/2 gap-2 px-3 py-1.5 bg-primary-900/50 rounded-lg"
							>
								<span class="text-sm text-emerald-400 font-medium">Songs #:</span>
								<span class="text-primary-300 text-sm"
									>{radioStoreData?.tracks?.songs.length
										? radioStoreData?.tracks?.songs.length
										: '- -'}</span
								>
							</div>
							<div
								class="flex flex-1/2 gap-2 px-3 py-1.5 bg-primary-900/50 rounded-lg"
							>
								<span class="text-sm text-emerald-400 font-medium">Jingles #:</span>
								<span class="text-primary-300 text-sm"
									>{radioStoreData?.tracks?.jingles.length
										? radioStoreData?.tracks?.jingles.length
										: '- -'}</span
								>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="flex grow p-4 gap-4">
		<JinglesTable />
		<SongsTable />
	</div>
</div>

<style>
</style>
