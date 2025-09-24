<script lang="ts">
	import { fly } from 'svelte/transition';
	import { saveXML, openXML } from '$lib/utils/dialog';
	import { obj2xml, xml2obj } from '$lib/utils/xml-convert/index';
	import type { DialogFilter } from '@tauri-apps/plugin-dialog';
	import { xmlView } from '$lib/stores/global';
	import { xmlData, tracks } from '$lib/stores/xml-obj.store';

	// Icons
	import SolarAltArrowDownLinear from '~icons/solar/alt-arrow-down-linear';
	import SolarArchiveDownMinimlisticLineDuotone from '~icons/solar/archive-down-minimlistic-line-duotone';
	import SolarArchiveUpMinimlisticLineDuotone from '~icons/solar/archive-up-minimlistic-line-duotone';
	import SolarBoltBoldDuotone from '~icons/solar/bolt-bold-duotone';
	import SolarFolderOpenBoldDuotone from '~icons/solar/folder-open-bold-duotone';
	import SolarCodeBoldDuotone from '~icons/solar/code-bold-duotone';
	import SolarSettingsLinear from '~icons/solar/settings-linear';

	let profileOpen = $state(false);
	let workingDir = $state<string | null>();
</script>

<div class="flex items-center gap-2">
	<div class="relative">
		<button
			onclick={() => (profileOpen = !profileOpen)}
			class="relative flex w-40 max-w-40 items-center rounded-md bg-slate-700 py-1 pr-8 pl-2 text-right text-sm text-white hover:bg-slate-500"
			class:!bg-slate-500={profileOpen == true}
		>
			<span>Select a Profile</span>
			<SolarAltArrowDownLinear width="16" height="16" class="absolute right-2" />
		</button>
		{#if profileOpen}
			<!-- <div
				transition:fly={{ y: 10, duration: 180 }}
				class="absolute top-8 right-0 left-0 overflow-hidden rounded-md bg-zinc-700 shadow-lg shadow-neutral-900"
			>
				<button class="w-full px-2 py-1 text-left text-sm text-white hover:bg-zinc-500">
					NFSU2
				</button>
			</div> -->
		{/if}
	</div>
	<button
		onclick={async () => {
			await openXML();
		}}
		class="rounded-md bg-slate-700 px-4 py-1 text-white transition-colors hover:bg-slate-500"
		title="Import XML (Ctrl + I)"
	>
		<SolarArchiveDownMinimlisticLineDuotone width="20" height="20" />
	</button>
	<button
		onclick={async () => {
			await saveXML(obj2xml($xmlData));
		}}
		class="rounded-md bg-slate-700 px-4 py-1 text-white transition-colors hover:bg-slate-500"
		title="Export XML (Ctrl + E)"
	>
		<SolarArchiveUpMinimlisticLineDuotone width="20" height="20" />
	</button>

	<button
		class="rounded-md bg-slate-700 px-4 py-1 text-white transition-colors hover:bg-slate-500"
		title="Create Radio Station"
	>
		<SolarBoltBoldDuotone width="20" height="20" />
	</button>

	<div class="absolute right-2 flex gap-2">
		<button
			onclick={() => xmlView.set(!$xmlView)}
			class="rounded-md bg-slate-700 px-4 py-1 text-white transition-colors hover:bg-slate-500"
			title="{!$xmlView ? 'Show' : 'Hide'} XML Preview"
		>
			<SolarCodeBoldDuotone width="20" height="20" />
		</button>
		<button
			class="rounded-md bg-slate-700 px-4 py-1 text-white transition-colors hover:bg-slate-500"
			title="Settings"
		>
			<SolarSettingsLinear width="20" height="20" />
		</button>
	</div>
</div>
