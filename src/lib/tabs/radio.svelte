<script lang="ts">
	// Stores
	import { tabStore } from '$lib/stores';
	import radioDataTabs from '$lib/stores/radio-data.store';

	// Icons
	import { Bolt } from '@solar-icons/svelte/BoldDuotone';
	import { Diskette, Tuning2 } from '@solar-icons/svelte/Bold';

	let radioData = $derived(
		$radioDataTabs.find((tabData) => tabData.tabId === $tabStore.find((tab) => tab.active)?.id)
	);
</script>

<div class="flex flex-col">
	<div class="flex gap-10 p-4 bg-primary-700 overflow-hidden">
		<div class="flex flex-col gap-2">
			<button
				class="flex items-center justify-center px-10 py-3 text-xl text-white bg-orange-900 hover:bg-orange-600 border border-orange-600 rounded-lg transition-colors"
				title="Create Radio"
			>
				<Bolt />
			</button>
			<button
				class="flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-white bg-primary-750 hover:bg-primary-600 border border-primary-600 rounded-lg transition-colors"
			>
				<Diskette size={16} />
				<span>Save</span>
			</button>
			<button
				onclick={() =>
					radioDataTabs.openConfig({
						header: `Configure ${radioData?.radioName}`,
						tabId: radioData?.tabId
					})}
				class="flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-white bg-primary-750 hover:bg-primary-600 border border-primary-600 rounded-lg transition-colors"
			>
				<Tuning2 size={16} />
				<span>Configure</span>
			</button>
		</div>
		<div class="flex flex-col gap-3">
			<h1 class="text-lg text-white font-semibold">Radio Configuration</h1>
			<div class="flex gap-4">
				<div class="relative size-22 overflow-hidden">
					{#await radioData?.logo then logo}
						{#if !logo}
							<div
								class="absolute inset-0 flex items-center justify-center bg-primary-600 rounded-lg"
							>
								<span class="text-sm text-primary-400 font-bold">No Logo</span>
							</div>
						{:else}
							<img class="absolute inset-0" src={logo} alt="" />
						{/if}
					{/await}
				</div>
				<table class="select-none table-fixed border-separate border-spacing-0">
					<thead>
						<tr>
							<th
								class="px-2 py-1 text-xs text-white text-left font-semibold border-r border-primary-600"
								>Radio ID</th
							>
							<th
								class="px-2 py-1 text-xs text-white text-left font-semibold border-r border-primary-600"
								>Radio Station Name</th
							>
							<th
								class="px-2 py-1 text-xs text-white text-left font-semibold border-r border-primary-600"
								>Froce Value</th
							>
							<th
								class="px-2 py-1 text-xs text-white text-left font-semibold border-r border-primary-600"
								>Target Volume</th
							>
							<th
								class="px-2 py-1 text-xs text-white text-left font-semibold border-r border-primary-600"
								>Jingles #</th
							>
							<th class="px-2 py-1 text-xs text-white text-left font-semibold"
								>Tracks #</th
							>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td class="min-w-26 truncate px-2 py-1 text-xs text-primary-300"
								>{radioData?.radioId}</td
							>
							<td
								class="min-w-26 max-w-50 truncate px-2 py-1 text-xs text-primary-300"
								title={radioData?.radioName}>{radioData?.radioName}</td
							>
							<td class="min-w-26 truncate px-2 py-1 text-xs text-primary-300"
								>{radioData?.force?.enabled
									? radioData.force.value
									: 'Default (80)'}</td
							>
							<td class="min-w-26 truncate px-2 py-1 text-xs text-primary-300"
								>{radioData?.volume?.enabled ? radioData.volume.value : '-'}</td
							>
							<td class="min-w-26 truncate px-2 py-1 text-xs text-primary-300"
								>{radioData?.tracks?.jingles
									? radioData.tracks.jingles.length
									: '-'}</td
							>
							<td class="min-w-26 truncate px-2 py-1 text-xs text-primary-300"
								>{radioData?.tracks?.songs
									? radioData.tracks.songs.length
									: '-'}</td
							>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>

<style>
</style>
