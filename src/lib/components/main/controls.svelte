<script lang="ts">
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { Command } from '@tauri-apps/plugin-shell';
	import { exists, mkdir, readDir } from '@tauri-apps/plugin-fs';
	import { join, dirname } from '@tauri-apps/api/path';
	import { saveXML, openXML } from '$lib/utils/dialog';
	import { obj2xml } from '$lib/utils/xml-convert/index';
	import { xmlData } from '$lib/stores/xml-obj.store';
	import { settings } from '$lib/stores/settings.store';
	import { unsaved } from '$lib/stores/global';
	import logger from '$lib/stores/logger';

	// Icons
	import CaretDown from '~icons/solar/alt-arrow-down-linear';
	import SaveIcon from '~icons/solar/file-bold-duotone';
	import ImportIcon from '~icons/solar/archive-down-minimlistic-line-duotone';
	import CreateIcon from '~icons/solar/bolt-bold-duotone';

	let profileOpen = $state(false);
	let profiles = $state<{ name: string; path: string }[]>([]);

	$effect(() => {
		if ($settings) {
			readDir($settings.cwd).then(async (stations) => {
				for (const station of stations) {
					const entries = await readDir(await join($settings.cwd, station.name));
					const hasXml = entries.some((e) => e.isFile && e.name === 'data.xml');

					if (hasXml) {
						profiles.push({
							name: station.name,
							path: await join($settings.cwd, station.name, 'data.xml')
						});
					}
				}
			});
		}
	});

	async function create() {
		const stationPath = await join($settings.cwd, $xmlData.project.radio.name);

		const stationExist = await exists(stationPath);

		if (!stationExist) await mkdir(stationPath, { recursive: true });

		const xmlPath = await join(stationPath, 'data.xml');

		logger.info('Exporting XML and saving logo file...');

		await saveXML(obj2xml($xmlData), xmlPath);

		logger.info('Starting TuneinCrew.');

		const command = Command.create('exec', [$settings.tuneinCrew.dir, `"${xmlPath}"`]);

		command.stdout.on('data', (msg) => logger.log(msg));

		command.on('close', () => {
			logger.info(
				`Saved Radio: [ID: ${$xmlData.project.radio.id} | Name: ${$xmlData.project.radio.name}] in ${stationPath}`
			);
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
					{#each profiles as profile}
						<button
							onclick={async () => {
								await openXML(profile.path);
								profileOpen = false;
							}}
							class="w-full px-2 py-1 text-left text-sm text-white hover:bg-zinc-500"
						>
							{profile.name}
						</button>
					{/each}
				</div>
			{/if}
		</div>
		<button
			class="rounded-md px-4 py-1 bg-slate-700 hover:bg-slate-500 text-white"
			title="Save As (Ctrl + S)"
			disabled={!$unsaved}
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
