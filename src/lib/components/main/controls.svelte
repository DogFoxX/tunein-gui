<script lang="ts">
	import { fly } from 'svelte/transition';
	import { Command } from '@tauri-apps/plugin-shell';
	import { exists, mkdir } from '@tauri-apps/plugin-fs';
	import { join } from '@tauri-apps/api/path';
	import { saveXML, openXML } from '$lib/utils/dialog';
	import { obj2xml } from '$lib/utils/xml-convert/index';
	import { xmlView, xmlData } from '$lib/stores/xml-obj.store';
	import { settingsOpen, settings } from '$lib/stores/settings.store';
	import { stdOut } from '$lib/stores/global';
	import formatCurrentTime from '$lib/utils/format-time';

	// Icons
	import CaretDown from '~icons/solar/alt-arrow-down-linear';
	import SaveIcon from '~icons/solar/file-bold-duotone';
	import ImportIcon from '~icons/solar/archive-down-minimlistic-line-duotone';
	import CreateIcon from '~icons/solar/bolt-bold-duotone';

	let profileOpen = $state(false);

	async function create() {
		const stationPath = await join($settings.cwd, $xmlData.project.radio.name);

		const stationExist = await exists(stationPath);

		if (!stationExist) await mkdir(stationPath, { recursive: true });

		const xmlPath = await join(stationPath, 'data.xml');

		stdOut.update((arr) => {
			const newarr = [
				...arr,
				`${formatCurrentTime()} INFO: Exporting XML and saving logo file...`
			];
			return Array.from(new Set(newarr));
		});

		await saveXML(obj2xml($xmlData), xmlPath);

		stdOut.update((arr) => {
			const newarr = [...arr, `${formatCurrentTime()} INFO: Starting TuneinCrew.`];
			return Array.from(new Set(newarr));
		});

		const command = Command.create('exec', [$settings.tuneinCrew.dir, `"${xmlPath}"`]);

		command.stdout.on('data', (msg) =>
			stdOut.update((arr) => {
				const newarr = [...arr, msg];
				return Array.from(new Set(newarr));
			})
		);

		command.on('close', () => {
			stdOut.update((arr) => {
				const newarr = [
					...arr,
					`${formatCurrentTime()} INFO: Saved Radio: [ID: ${$xmlData.project.radio.id} | Name: ${$xmlData.project.radio.name}] in ${stationPath}`
				];
				return Array.from(new Set(newarr));
			});
		});

		command.spawn();
	}
</script>

<div id="controls" class="flex w-full items-center gap-6 h-7">
	<div class="flex gap-2">
		<div class="relative max-h-full">
			<button
				onclick={() => (profileOpen = !profileOpen)}
				class="flex w-40 max-w-40 items-center rounded-md py-1 pr-8 pl-2 text-right text-sm bg-slate-700 hover:bg-slate-500 text-white"
			>
				<span>Select a Profile</span>
				<CaretDown width="16" height="16" class="absolute right-2" />
			</button>
			{#if profileOpen}
				<div
					transition:fly={{ y: 10, duration: 180 }}
					class="absolute top-8 right-0 left-0 overflow-hidden rounded-md bg-zinc-700 shadow-lg shadow-neutral-900 z-10"
				>
					<button class="w-full px-2 py-1 text-left text-sm text-white hover:bg-zinc-500">
						NFSU2
					</button>
				</div>
			{/if}
		</div>
		<button
			onclick={async () => {
				await openXML();
			}}
			class="rounded-md px-4 py-1 bg-slate-700 hover:bg-slate-500 text-white"
			title="Save As (Ctrl + S)"
		>
			<SaveIcon width="20" height="20" />
		</button>
		<button
			onclick={async () => {
				await openXML();
			}}
			class="rounded-md px-4 py-1 bg-slate-700 hover:bg-slate-500 text-white"
			title="Import XML (Ctrl + I)"
		>
			<ImportIcon width="20" height="20" />
		</button>
	</div>
	<button
		onclick={create}
		class="rounded-md px-6 py-1 hover:bg-orange-600 !border-[1px] !border-orange-600 bg-orange-900 max-h-full text-white"
		title="Create Radio Station"
	>
		<CreateIcon width="20" height="20" />
	</button>
</div>
